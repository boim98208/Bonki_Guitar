/*
    Copyright 2025, 2026 iamlamprey

    This file is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This file is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with This file. If not, see <http://www.gnu.org/licenses/>.
*/

#pragma once
#include <JuceHeader.h>
#include "DevBypassConfig.h"

// xsimd best simd
#define RTNEURAL_USE_EIGEN 0
#define RTNEURAL_USE_XSIMD 1
#define RTNEURAL_DEFAULT_ALIGNMENT 16

#include <atomic>
#include <memory>
#include <thread>
#include <vector>
#include <cmath>
#include <algorithm>
#include <initializer_list>
#include <array>

#include "src/dependencies/json/single_include/nlohmann/json.hpp"
#include "src/dependencies/xsimd/include/xsimd/xsimd.hpp"
#include "src/dependencies/RTNeural/RTNeural/RTNeural.h"
#include "src/dependencies/math_approx/include/math_approx/math_approx.hpp"
#include "src/filters.h"
#include "src/NAM_impl.h"

enum class GlobalCablesAmp
{
    tempo = 0,
    pitch = 1,
    nam = 2    
};

namespace project
{
using namespace juce;
using namespace hise;
using namespace scriptnode;
using namespace altarFilters;
using cable_manager_t = routing::global_cable_cpp_manager<SN_GLOBAL_CABLE(110245659),
                                                          SN_GLOBAL_CABLE(106677056),
                                                          SN_GLOBAL_CABLE(108826)>;

template <int NV> struct amp: public data::base, public cable_manager_t
{
    SNEX_NODE(amp);    
    struct MetadataClass { SN_NODE_ID("amp"); };    
    
    static constexpr bool isModNode() { return false; };
    static constexpr bool isPolyphonic() { return NV > 1; };
    static constexpr bool hasTail() { return false; };
    static constexpr bool isSuspendedOnSilence() { return false; };
    static constexpr int getFixChannelAmount() { return 2; };
    static constexpr int NumTables = 0;
    static constexpr int NumSliderPacks = 0;
    static constexpr int NumAudioFiles = 0;
    static constexpr int NumFilters = 0;
    static constexpr int NumDisplayBuffers = 0;

    int handleModulation(double& value) { return 0; }
    template <typename T> void processFrame(T& data) {}
    void handleHiseEvent(HiseEvent& e) {}
    void setExternalData(const ExternalData& data, int index) {}    

    std::shared_ptr<std::atomic<bool>> isAlive = std::make_shared<std::atomic<bool>>(true);

    amp()
    {        
        this->registerDataCallback<GlobalCablesAmp::nam>([this](const var& data)
        {
            this->loadNAMModel(data);
        });
    }

    ~amp()
    {
        if (isAlive)
            isAlive->store(false);
    }
    
    void prepare(PrepareSpecs specs) 
    {
        sampleRate   = static_cast<float>(specs.sampleRate);
        numChannels  = specs.numChannels;
        maxBlockSize = specs.blockSize;
                
        lastSpecs.sampleRate        = specs.sampleRate;
        lastSpecs.numChannels       = 2;
        lastSpecs.maximumBlockSize  = static_cast<uint32>(std::max(512, (int)specs.blockSize));
        
        internalBuffer.setSize(2, (int)lastSpecs.maximumBlockSize, false, true, true);
        internalBuffer.clear();
                
        updateOversampling();
        updateToneStackRate();
        
        resamplerConfig.store(true, std::memory_order_release);
        updateNAMResamplers();
        namDCBlocker.update(specs.sampleRate);
        namDCBlocker.reset();
        
        // prepare nam model        
        if (auto m = std::atomic_load(&modelShared))
        {
            m->prepare(static_cast<int>(lastSpecs.maximumBlockSize));            
            warmupNAM(*m);
            if (auto mR = std::atomic_load(&modelSharedR))
            {
                mR->prepare(static_cast<int>(lastSpecs.maximumBlockSize));
                warmupNAM(*mR);
            }
            needsWarmup.store(false, std::memory_order_release);
            modelLoaded = true;
        }                
        
        reset();        
    }           

    void reset() 
    {        
        toneStack.reset();
        dcBlocker.reset();
        glass.reset();
        pearl.reset();
        diamond.reset();
        zircon.reset();
        slate.reset();
        obsidian.reset();
        amethyst.reset();
        opal.reset();
        sapphire.reset();
        garnet.reset();
                
        if (oversamplingFactor > 0 && oversampling != nullptr) { oversampling->reset(); }
        for (int ch = 0; ch < 2; ++ch) 
        { 
            dirtyLowBandMem[ch] = 0.0f; 
            dirtyPresenceMem[ch] = 0.0f; 
            biasMem[ch] = 0.0f;
        }
        
        inputResampler.resetState();
        outputResampler.resetState();                
        inputResamplerR.resetState();
        outputResamplerR.resetState();                

        if (auto mL = std::atomic_load(&modelShared)) mL->reset();
        if (auto mR = std::atomic_load(&modelSharedR)) mR->reset();

        namDCBlocker.reset();

        internalBuffer.clear();
    }
    
    template <typename T> void process(T& data)
    {
#if DEV_BYPASS_AMP
        return;
#endif

        juce::ScopedNoDenormals noDenormals;

        const int numSamples = data.getNumSamples();
        if (numSamples <= 0) return;

        const int numCh = juce::jmin(2, (int)data.getNumChannels());

        if (numSamples > (int)lastSpecs.maximumBlockSize)
        {
            lastSpecs.maximumBlockSize = static_cast<uint32>(numSamples);
            updateOversampling();
            resamplerConfig.store(true, std::memory_order_release);
            updateNAMResamplers();
        }

        if (internalBuffer.getNumSamples() < numSamples || internalBuffer.getNumChannels() < 2)
        {
            internalBuffer.setSize(2, numSamples, false, true, true);
            internalBuffer.clear();
        }

        int channelIndex = 0;
        for (auto ch: data)
        {   
            if (channelIndex >= numCh) break;
            dyn<float> channel = data.toChannelData(ch);
            float* dest = internalBuffer.getWritePointer(channelIndex);
            for (int s = 0; s < numSamples; ++s)
            {
                dest[s] = channel[s];
            }
            channelIndex++;
        }

        if (numCh == 1)
        {
            FloatVectorOperations::copy(internalBuffer.getWritePointer(1), internalBuffer.getReadPointer(0), numSamples);
        }

        AudioBuffer<float> buffer(internalBuffer.getArrayOfWritePointers(), 2, numSamples);
                
        processAudioBuffer(buffer, numSamples);
        
        channelIndex = 0;
        for (auto ch: data)
        {
            if (channelIndex >= numCh) break;
            dyn<float> channel = data.toChannelData(ch);
            const float* src = internalBuffer.getReadPointer(channelIndex);
            for (int s = 0; s < numSamples; ++s)
            {
                channel[s] = src[s];
            }
            channelIndex++;
        }
    }
    
    template <int P> void setParameter(double v)
    {
        switch (P)
        {        
        case 0: 
        {
            int oldMode = ampMode;
            ampMode = static_cast<int>(v); 
            if (oldMode != ampMode)
                updateToneStackRate();
            break; // clean | dirty | nam
        }
        case 1: 
        {
            int oldFactor = oversamplingFactor;
            oversamplingFactor = static_cast<int>(v);
            if (oldFactor != oversamplingFactor)
            {
                updateOversampling();
                updateToneStackRate();
            }
            break;
        }        
        case 2: inputGain = static_cast<float>(v); break;
        case 3: 
        {
            low = static_cast<float>(v); 
            toneStack.setPreGain(0, low);
            updateToneStackRate(); 
            break;
        }
        case 4: 
        {
            mid = static_cast<float>(v); 
            toneStack.setPreGain(1, mid);
            updateToneStackRate(); 
            break;
        }
        case 5: 
        {
            high = static_cast<float>(v); 
            toneStack.setPreGain(2, high);
            updateToneStackRate(); 
            break;
        }
        case 6: 
        {
            presence = static_cast<float>(v); 
            toneStack.setPreGain(3, presence);
            updateToneStackRate(); 
            break;
        }
        case 7: outputGain = static_cast<float>(v); break;           
        case 8: distortionMode = static_cast<int>(v); break;
        case 9: cleanToneStackMode = static_cast<int>(v); break;  
        case 10: dirtyToneStackMode = static_cast<int>(v); break;  
        case 11: latestFilterFreq = static_cast<float>(v); break;
        case 12: latestFilterQ = static_cast<float>(v); break;
        case 13: latestFilterGain = static_cast<float>(v); break;
        case 14: monoMode = (v > 0.5); break;
        case 15:
        {
            const float newSlim = static_cast<float>(v);
            if (std::abs(slimAmount.load() - newSlim) > 0.05f)
            {
                slimAmount.store(newSlim);
                reloadCurrentModel();
            }
            break;
        }
        }
    }
    
    void createParameters(ParameterDataList& data)
    {               
        { 
            parameter::data mode("Mode", { 0.0, 2.0 });                   
            registerCallback<0>(mode);          
            mode.setDefaultValue(1.0);          
            data.add(std::move(mode)); 
        }            
        { 
            parameter::data oversamp("Oversampling", { 0.0, 3.0 });       
            registerCallback<1>(oversamp);      
            oversamp.setDefaultValue(1.0);      
            data.add(std::move(oversamp)); 
        }        
        { 
            parameter::data inputGain("InputGain", { -100.0, 100.0 });    
            registerCallback<2>(inputGain);     
            inputGain.setDefaultValue(0.0);     
            data.add(std::move(inputGain)); 
        }
        { 
            parameter::data low("Low", { -12.0, 12.0 });                  
            registerCallback<3>(low);           
            low.setDefaultValue(0.0);           
            data.add(std::move(low)); 
        }
        { 
            parameter::data mid("Mid", { -12.0, 12.0 });                  
            registerCallback<4>(mid);           
            mid.setDefaultValue(0.0);           
            data.add(std::move(mid)); 
        }
        { 
            parameter::data high("High", { -12.0, 12.0 });                
            registerCallback<5>(high);          
            high.setDefaultValue(0.0);          
            data.add(std::move(high)); 
        }
        { 
            parameter::data presence("Presence", { -12.0, 12.0 });        
            registerCallback<6>(presence);      
            presence.setDefaultValue(0.0);      
            data.add(std::move(presence)); 
        }
        { 
            parameter::data outputGain("OutputGain", { -100.0, 100.0 });  
            registerCallback<7>(outputGain);    
            outputGain.setDefaultValue(0.0);    
            data.add(std::move(outputGain)); 
        }          
        {
            parameter::data distortionMode("DistortionMode", { 0.0, 1.0 });  
            registerCallback<8>(distortionMode);    
            distortionMode.setDefaultValue(0.0);    
            data.add(std::move(distortionMode)); 
        }   
        {
            parameter::data cleanToneStackMode("CleanToneStackMode", { 0.0, 3.0 });  
            registerCallback<9>(cleanToneStackMode);    
            cleanToneStackMode.setDefaultValue(0.0);    
            data.add(std::move(cleanToneStackMode)); 
        }     
        {
            parameter::data dirtyToneStackMode("DirtyToneStackMode", { 0.0, 5.0 });  
            registerCallback<10>(dirtyToneStackMode);    
            dirtyToneStackMode.setDefaultValue(0.0);    
            data.add(std::move(dirtyToneStackMode)); 
        }   

        // TS design
        {
            parameter::data latestFilterFreq("LatestFilterFreq", { 20.0, 20000.0 });  
            registerCallback<11>(latestFilterFreq);    
            latestFilterFreq.setDefaultValue(10000.0);    
            data.add(std::move(latestFilterFreq)); 
        }
        {
            parameter::data latestFilterQ("LatestFilterQ", { 0.2, 8.0 });  
            registerCallback<12>(latestFilterQ);    
            latestFilterQ.setDefaultValue(1.0);    
            data.add(std::move(latestFilterQ)); 
        }
        {
            parameter::data latestFilterGain("LatestFilterGain", { -24.0, 24.0 });  
            registerCallback<13>(latestFilterGain);    
            latestFilterGain.setDefaultValue(0.0);    
            data.add(std::move(latestFilterGain)); 
        }
        {
            parameter::data mono("Mono", { 0.0, 1.0 });
            registerCallback<14>(mono);
            mono.setDefaultValue(0.0);
            data.add(std::move(mono));
        }
        {
            parameter::data slim("Slim", { 0.0, 1.0 });
            registerCallback<15>(slim);
            slim.setDefaultValue(0.0);
            data.add(std::move(slim));
        }
           
    }    
    
private:

    float sampleRate = 44100.0f;
    int numChannels = 2;
    int maxBlockSize = 512;    
    int ampMode = 1; // 0 = clean | 1 = dirty | 2 = nam
    bool monoMode = false;
    float inputGain = 0.0f;
    float low = 0.0f;
    float mid = 0.0f;
    float high = 0.0f;
    float presence = 0.0f;
    float outputGain = 0.0f;        

    int distortionMode = 0;    
    int cleanToneStackMode = 0;
    int dirtyToneStackMode = 0;    

    float dirtyLowBandMem[2] = {0.0f, 0.0f};
    float dirtyPresenceMem[2] = {0.0f, 0.0f};
    float biasMem[2] = {0.0f, 0.0f};

    float latestFilterFreq = 1000.0f;
    float latestFilterQ = 0.81f;
    float latestFilterGain = 0.0f;    
    
    // oversampling
    struct ProcessSpec
    {
        double sampleRate = 44100.0;
        uint32 numChannels = 2;
        uint32 maximumBlockSize = 512;
    };

    ProcessSpec lastSpecs;
    ProcessSpec specsOversampling;
    int oversamplingFactor = 1;    
    float scaledSampleRate = 44100.0f;
    std::unique_ptr<juce::dsp::Oversampling<float>> oversampling;    
    
    void updateToneStackRate()
    {
        double rate = (ampMode < 2 && oversamplingFactor > 0 && oversampling != nullptr)
                    ? static_cast<double>(scaledSampleRate)
                    : (lastSpecs.sampleRate > 0.0 ? lastSpecs.sampleRate : (double)sampleRate);
        toneStack.update(rate);
    }

    // main process function
    void processAudioBuffer(juce::AudioBuffer<float>& buffer, int numSamples)
    {        
        // Mode 2 is NAM: run directly at host sample rate (matching Altar)
        if (ampMode == 2)
        {
            processNAMMode(buffer, numSamples);
            return;
        }

        const bool useOversampling = (oversamplingFactor > 0 && oversampling != nullptr); // oversample
        juce::dsp::AudioBlock<float> inBlock(buffer);

        if (useOversampling)
        {            
            auto upBlock = oversampling->processSamplesUp(inBlock);
            const int upCh     = static_cast<int>(upBlock.getNumChannels());
            const int upFrames = static_cast<int>(upBlock.getNumSamples());
            float* chanPtrs[2] = { nullptr, nullptr };
            for (int ch = 0; ch < upCh; ++ch) { chanPtrs[ch] = upBlock.getChannelPointer(static_cast<size_t>(ch)); }
                
            // non-owning view of the upsampled data
            juce::AudioBuffer<float> osBuffer(chanPtrs, upCh, upFrames);

            // process
            if (ampMode == 0) { processCleanMode(osBuffer, upFrames); }
            else if (ampMode == 1) { processDirtyMode(osBuffer, upFrames); }

            oversampling->processSamplesDown(inBlock); // downsample back to original sr
        }
        else // no oversampling
        {            
            if (ampMode == 0) { processCleanMode(buffer, numSamples); }
            else if (ampMode == 1) { processDirtyMode(buffer, numSamples); }
        }
    }

    void processCleanMode(AudioBuffer<float>& buffer, int numSamples)
    {
        int numCh = juce::jmin(2, buffer.getNumChannels());
        int chLimit = (monoMode && numCh == 2) ? 1 : numCh;
        
        for (int ch = 0; ch < chLimit; ++ch)
        {
            float* channelData = buffer.getWritePointer(ch);
            
            for (int s = 0; s < numSamples; ++s)
            {
                float sample = channelData[s];

                sample *= Decibels::decibelsToGain(inputGain); // input gain                                                

                switch (cleanToneStackMode)
                {                    
                    case 0: sample = glass.processPre(ch, sample); break;
                    case 1: sample = pearl.processPre(ch, sample); break;
                    case 2: sample = diamond.processPre(ch, sample); break;
                    case 3: sample = zircon.processPre(ch, sample); break;
                }

                sample = getCleanSample(sample); // transfer function  

                //for (int f = 0; f < numToneStackStates; ++f) { sample = toneStackStates[ch][f].process(sample); } // tone stack
                sample = toneStack.processPre(ch, sample);

                switch (cleanToneStackMode)
                {                    
                    case 0: sample = glass.processPost(ch, sample); break;
                    case 1: sample = pearl.processPost(ch, sample); break;
                    case 2: sample = diamond.processPost(ch, sample); break;
                    case 3: sample = zircon.processPost(ch, sample); break;
                }
                
                sample *= Decibels::decibelsToGain(outputGain); // output gain
                
                channelData[s] = sample;
            }
        }

        if (monoMode && numCh == 2)
        {
            std::memcpy(buffer.getWritePointer(1), buffer.getReadPointer(0), sizeof(float) * (size_t)numSamples);
        }
    }

    void processDirtyMode(AudioBuffer<float>& buffer, int numSamples)
    {
        int numCh = juce::jmin(2, buffer.getNumChannels());
        int chLimit = (monoMode && numCh == 2) ? 1 : numCh;
        
        for (int ch = 0; ch < chLimit; ++ch)
        {
            float* channelData = buffer.getWritePointer(ch);
            
            for (int s = 0; s < numSamples; ++s)
            {
                float sample = channelData[s];

                sample *= Decibels::decibelsToGain(inputGain); // input gain                     

                // pre sculpt
                switch (dirtyToneStackMode)
                {                         
                    case 0: sample = slate.processPre(ch, sample); break;
                    case 1: sample = obsidian.processPre(ch, sample); break;
                    case 2: sample = amethyst.processPre(ch, sample); break;
                    case 3: sample = opal.processPre(ch, sample); break;
                    case 4: sample = sapphire.processPre(ch, sample); break;
                    case 5: sample = garnet.processPre(ch, sample); break;
                }
                
                // dc block
                sample = dcBlocker.processPre(ch, sample);

                switch (distortionMode) // waveshaper algos go here
                {
                    case 0: sample = getTyrantSample(sample, dirtyLowBandMem[ch], dirtyPresenceMem[ch]); break;
                    case 1: sample = getFacelessSample(sample, biasMem[ch]); break;
                }                                           

                // tone stack                
                sample = toneStack.processPre(ch, sample);

                // post sculpt
                switch (dirtyToneStackMode)
                {
                    case 0: sample = slate.processPost(ch, sample); break;
                    case 1: sample = obsidian.processPost(ch, sample); break;
                    case 2: sample = amethyst.processPost(ch, sample); break;
                    case 3: sample = opal.processPost(ch, sample); break;
                    case 4: sample = sapphire.processPost(ch, sample); break;
                    case 5: sample = garnet.processPost(ch, sample); break;               
                }                

                sample *= Decibels::decibelsToGain(outputGain); // output gain
                
                channelData[s] = sample; 
            }
        }

        if (monoMode && numCh == 2)
        {
            std::memcpy(buffer.getWritePointer(1), buffer.getReadPointer(0), sizeof(float) * (size_t)numSamples);
        }
    }    
    
    // amp algos
    float getCleanSample(float input)
    {
        float threshold = 0.8f;
        float warmth = 0.3f;
        float scaledInput = input * (0.3f + warmth * 0.5f);
        float absInput = std::abs(scaledInput);
        
        if (absInput > threshold)
        {
            float excess = absInput - threshold;
            float compressed = threshold + std::tanh(excess * 2.0f) * 0.2f;
            scaledInput = (scaledInput > 0.0f) ? compressed : -compressed;
        }
        
        float harmonic = std::sin(scaledInput * 4.0f) * warmth * 0.02f;
        return scaledInput + harmonic;
    }
    
    float getTyrantSample(float x, float& lowBandMem, float& presenceMem)
    {
        // the original distortion, renamed
        // processes low & high bands separately 

        float y = x;
        float highSat;
        const float crossover = 0.15f;
        const float ceiling = 0.95f;
            
        // low band
        lowBandMem = lowBandMem + crossover * (y - lowBandMem);
        float lowSat = std::tanh(lowBandMem * 2.8f) * 0.9f;

        // high band
        float highBand = y - lowBandMem;                
        float highDrive = highBand * 4.5f;        
        if (highDrive > 0.0f) { highSat = 1.0f - std::exp(-highDrive * 2.0f); }            
        else { highSat = -(1.0f - std::exp(highDrive * 1.8f)); }            
        highSat = highSat * 0.4f;

        // combine
        y = lowSat + highSat;
        
        // hard clip
        if (std::abs(y) > ceiling) 
        {
            float sign = y > 0.0f ? 1.0f : -1.0f;
            float excess = std::abs(y) - ceiling;
            y = sign * (ceiling + excess / (1.0f + excess * 8.0f));
        }
        
        // presence
        float presenceDiff = y - presenceMem;
        presenceMem = y;
        y = y + presenceDiff * 0.08f;

        return y * 0.91f;
    }    
    
    float triode(float x, float bias, float gain, float asym)
    {
        // simple triode helper with grid bias for getFacelessSample()
        const float alpha = 0.7f;
        
        // simple grid into tanh
        x = gain * x + bias;        
        float y = std::tanh(x) + asym * x * x * 0.05f + asym * x * x * x * 0.1f;
                
        // remove bias after for symmetric y
        return y - (alpha * std::tanh(bias));
    }

    float getFacelessSample(float x, float& biasMem) 
    {        
        // slightly more aggressive & using multi-stage triode setup
        // cheeky nod to a very well-known plugin
        const float gain1 = 3.2f;
        const float gain2 = 2.7f;
        const float asym1 = 0.14f; 
        const float asym2 = 0.09f;
        const float biasSpeed = 0.01f; 
        
        // dynamic bias
        float biasTarget = 0.23f + x * 0.09f;
        biasMem += biasSpeed * (biasTarget - biasMem);

        // triode stages
        float stage1 = triode(x, biasMem, gain1, asym1);
        float stage2 = triode(stage1, biasMem * 0.75f, gain2, asym2);

        // simple presence shelf
        float presence = stage2 + (stage2 - x) * 0.12f;

        // scale y out
        float y = std::clamp(presence * 0.75f, -1.0f, 1.0f);
        return y;
    }    

    // Tone Stack

    ToneStack toneStack{
        {
            PEAK(160.0f, 0.6f, low),
            PEAK(600.0f, 0.8f, mid),
            PEAK(2600.0f, 0.8f, high),
            PEAK(6000.0f, 0.8f, presence),
        },{}        
    };    

    // DC Blocker

    ToneStack dcBlocker{
        {
            HP(140.0f),
            HP(140.0f),
            HP(140.0f),
            HP(140.0f),            
        }, {}
    };

    // CLEAN

    ToneStack glass{
        // pre
        {
            HP(55.0f),
            PEAK(870.0f, 0.4f, 4.0f),
            PEAK(3700.0f, 0.32f, 7.0f),
            HS(6000.0f, 0.7f, 16.0f)
        },
        // post
        {
            HP(60.0f),
            PEAK(140.0f, 2.4f, -3.5f),
            PEAK(2200.0f, 0.3f, 4.0f),
            PEAK(2600.0f, 5.8f, -5.1f),
            PEAK(6400.0f, 1.0f, 4.8f),
            LP(10000.0f)
        }
    };

    ToneStack pearl{
        {
            HP(55.0f),
            PEAK(870.0f, 0.4f, 4.0f),
            PEAK(3700.0f, 0.32f, 7.0f),
            HS(6000.0f, 0.7f, 16.0f)
        },
        {
            HP(60.0f),
            PEAK(114.0f, 0.37f, 4.88f),
            PEAK(140.0f, 2.4f, -3.5f),
            PEAK(2200.0f, 0.3f, 4.0f),
            PEAK(2600.0f, 5.8f, -5.1f),
            PEAK(5740.0f, 0.71f, 5.58f),
            PEAK(6400.0f, 1.0f, 4.8f),
            LP(10000.0f)
        }
    };

    ToneStack diamond{
        {
            HP(55.0f),
            PEAK(870.0f, 0.4f, 4.0f),
            PEAK(3700.0f, 0.32f, 7.0f),
            HS(6000.0f, 0.7f, 16.0f)
        },
        {
            HP(60.0f),
            PEAK(104.0f, 0.42f, 5.33f),
            PEAK(140.0f, 2.4f, -3.5f),
            PEAK(527.0f, 0.71f, -6.32f),
            PEAK(2200.0f, 0.3f, 4.0f),
            PEAK(2600.0f, 5.8f, -5.1f),
            PEAK(3230.0f, 0.26f, 6.09f),
            PEAK(6400.0f, 1.0f, 4.8f),
            LP(10000.0f)
        }
    };

    ToneStack zircon{
        {
            HP(55.0f),
            PEAK(870.0f, 0.4f, 4.0f),
            PEAK(3700.0f, 0.32f, 7.0f),
            HS(6000.0f, 0.7f, 16.0f)
        },
        {
            HP(60.0f),
            PEAK(85.0f, 0.71f, 5.33f),
            PEAK(140.0f, 2.4f, -3.5f),
            PEAK(1820.0f, 0.26f, 5.08f),
            PEAK(2200.0f, 0.3f, 4.0f),
            PEAK(2600.0f, 5.8f, -5.1f),
            PEAK(6400.0f, 1.0f, 4.8f),
            PEAK(8280.0f, 0.28f, 5.71f),
            LP(10000.0f)
        }
    };

    // DIRTY

    ToneStack slate{
       {
            HP(82.0f),
            PEAK(650.0f, 1.2f, 2.5f),
            PEAK(2200.0f, 0.8f, 3.2f),
            HS(4500.0f, 0.7f, 6.0f)
       },
       {
            HP(40.0f),
            LS(45.0f, 0.5f, 6.0f),
            PEAK(75.1f, 0.46f, 4.38f),
            PEAK(120.0f, 0.5f, 8.0f),
            LS(150.0f, 0.7f, -2.0f),
            PEAK(160.0f, 0.6f, 2.0f),
            PEAK(505.0f, 0.93f, -2.14f),
            PEAK(750.0f, 1.4f, 4.0f),
            PEAK(1800.0f, 1.0f, 2.8f),
            PEAK(2350.0f, 0.69f, 2.35f),
            PEAK(2500.0f, 2.11f, 1.86f),
            PEAK(3200.0f, 1.2f, -1.5f),
            PEAK(3638.0f, 1.156f, 4.616f),
            PEAK(3670.0f, 1.14f, 3.48f),
            PEAK(4000.0f, 5.02f, -2.31f),
            PEAK(5000.0f, 0.8f, 2.0f),
            HS(6500.0f, 0.7f, -1.8f),
            PEAK(7842.0f, 0.938f, 4.032f),
            PEAK(8610.0f, 0.71f, 2.60f),
            HS(9000.0f, 0.6f, 3.5f),
            LP(12000.0f),
       }
    };

    ToneStack obsidian{
        {
            HP(60.0f),
            PEAK(520.0f, 0.9f, 2.8f),
            PEAK(1400.0f, 0.7f, 3.2f),
            PEAK(3800.0f, 1.1f, 4.5f),
        },
        {
            HP(32.0f),
            HP(32.0f),
            RBJ_LS(120.0f, 0.5f, 11.712f),
            PEAK(129.0f, 1.74f, 5.86f),
            PEAK(180.0f, 0.813f, 3.0f),
            PEAK(232.0f, 1.58f, -2.21f),
            PEAK(528.0f, 0.71f, -9.0f),
            PEAK(600.0f, 0.8f, 3.84f),
            PEAK(1100.0f, 1.374f, -5.872f),
            PEAK(1190.0f, 0.71f, 2.11f),
            PEAK(1787.0f, 0.813, -2.496f),
            PEAK(2185.0f, 0.437f, 7.686f),
            PEAK(2350.0f, 0.71f, 2.85f),    
            PEAK(2770.0f, 4.24f, -5.50f),        
            PEAK(2900.0f, 2.03f, 3.60f),
            PEAK(3740.0f, 4.43f, -1.76f),
            HS(6000.0f, 0.8f, 5.0f),
            HS(7760.0f, 0.813f, 2.5f),
            PEAK(8678.0f, 0.688f, 3.532f),
            PEAK(8990.0f, 0.71f, 0.4f),
            LP(17122.0f)
        }
    };

    ToneStack amethyst{
        {
            HP(60.0f),
            PEAK(500.0f, 1.1f, 2.8f),
            PEAK(1600.0f, 0.9f, 3.5f),
            PEAK(4000.0f, 1.3f, 4.0f),
        },
        {
            HP(45.0f),
            LS(45.0f, 0.5f, 6.0f),
            PEAK(58.7f, 0.53f, 8.33f),
            PEAK(120.0f, 0.5f, 8.0f),
            PEAK(180.0f, 1.2f, -1.8f),
            PEAK(400.0f, 0.71f, -2.85f),
            PEAK(600.0f, 1.0f, 3.2f),
            PEAK(1000.0f, 0.93f, 2.74f),            
            PEAK(1200.0f, 0.8f, 2.5f),
            PEAK(2800.0f, 1.4f, -2.0f),
            PEAK(3590.0f, 1.27f, 2.29f),
            PEAK(4500.0f, 1.1f, 4.5f),
            PEAK(6500.0f, 0.9f, 2.8f),
            HS(8500.0f, 0.7f, 3.5f),
            LP(13000.0f),
            PEAK(13500.0f, 0.71f, -3.40f)
        }
    };

    ToneStack opal{
        {
            HP(90.0f),
            PEAK(720.0f, 1.5f, 3.8f),
            PEAK(2000.0f, 1.0f, 2.5f),
            PEAK(5500.0f, 1.8f, 5.2f)
        },
        {
            HP(40.0f),
            HP(45.0f),
            LS(45.0f, 0.5f, 6.0f),
            PEAK(84.0f, 0.5f, 6.29f),
            PEAK(120.0f, 0.5f, 8.0f),
            PEAK(200.0f, 1.5f, -3.2f),
            PEAK(800.0f, 1.2f, 4.5f),
            PEAK(1020.0f, 1.06f, 3.05f),
            PEAK(1600.0f, 0.9f, 2.8f),
            PEAK(3200.0f, 2.0f, -2.8f),
            PEAK(3230.0f, 0.71f, 5.33f),
            PEAK(5800.0f, 1.3f, 4.8f),
            HS(7500.0f, 0.8f, -2.5f),
            PEAK(8250.0f, 0.71f, 2.36f),
            LP(11500.0f)
        }
    };

    ToneStack sapphire{
        {
            HP(85.0f),
            PEAK(680.0f, 1.4f, 4.2f),
            PEAK(1800.0f, 0.9f, 3.5f),
            PEAK(4800.0f, 1.6f, 5.8f),
        },
        {
            HP(45.0f),
            LS(45.0f, 0.5f, 6.0f),
            PEAK(84.0f, 0.5f, 6.29f),
            PEAK(120.0f, 0.5f, 8.0f),
            PEAK(150.0f, 1.2f, -2.5f),
            PEAK(750.0f, 1.1f, 4.8f),
            PEAK(1500.0f, 0.8f, 2.8f),
            PEAK(2670.0f, 1.72f, 3.84f),
            PEAK(2800.0f, 1.8f, -2.2f),
            PEAK(4000.0f, 6.98f, -5.02f),
            PEAK(5200.0f, 1.2f, 5.5f),
            PEAK(7200.0f, 0.9f, 3.2f),
            HS(9000.0f, 0.7f, -1.8f),
            PEAK(10000.0f, 0.52f, 6.31f),
            LP(12800.0f)
        }   
    };

    ToneStack garnet{
        {
            HP(50.0f),
            PEAK(320.0f, 0.8f, 2.2f),
            PEAK(1000.0f, 0.7f, 2.8f),
            PEAK(2800.0f, 0.6f, 3.8f),
        },
        {
            HP(45.0f),
            LS(45.0f, 0.5f, 6.0f),
            LS(100.0f, 0.7f, 2.0f),
            PEAK(120.0f, 0.5f, 8.0f),
            PEAK(160.0f, 0.71f, 0.87f),
            PEAK(360.0f, 0.9f, 2.5f),
            PEAK(599.0f, 1.15f, -1.86f),
            PEAK(850.0f, 0.8f, 2.8f),
            PEAK(1560.0f, 0.71f, 1.86f),
            PEAK(1600.0f, 0.9f, 2.2f),
            PEAK(3200.0f, 1.1f, 3.5f),
            PEAK(3440.0f, 2.14f, -1.67f),
            PEAK(5500.0f, 0.8f, 3.8f),
            PEAK(6960.0f, 0.71f, 2.85f),
            HS(7500.0f, 0.7f, 4.5f),
            LP(16000.0f)
        }
    };

    void updateOversampling()
    {
        if (lastSpecs.sampleRate <= 0) return;
        
        std::unique_ptr<juce::dsp::Oversampling<float>> newOversampling;
        
        if (oversamplingFactor > 0)
        {
            newOversampling = std::make_unique<juce::dsp::Oversampling<float>>(
                2,
                oversamplingFactor,
                juce::dsp::Oversampling<float>::filterHalfBandFIREquiripple,
                false
            );
            
            newOversampling->initProcessing(lastSpecs.maximumBlockSize);
            newOversampling->reset();
            
            specsOversampling.numChannels = 2;
            specsOversampling.sampleRate = lastSpecs.sampleRate * (1 << oversamplingFactor);
            specsOversampling.maximumBlockSize = lastSpecs.maximumBlockSize * (1 << oversamplingFactor);
            
            scaledSampleRate = static_cast<float>(specsOversampling.sampleRate);
        }

        else { scaledSampleRate = static_cast<float>(lastSpecs.sampleRate); }       
        
        oversampling.swap(newOversampling);        

        // dcBlocker
        dcBlocker.reset();
        dcBlocker.update(scaledSampleRate);

        // clean
        glass.reset();
        glass.update(scaledSampleRate);

        pearl.reset();
        pearl.update(scaledSampleRate);

        diamond.reset();
        diamond.update(scaledSampleRate);

        zircon.reset();
        zircon.update(scaledSampleRate);

        // dirty
        slate.reset();
        slate.update(scaledSampleRate); 

        obsidian.reset();
        obsidian.update(scaledSampleRate);  

        amethyst.reset();
        amethyst.update(scaledSampleRate);   

        opal.reset();
        opal.update(scaledSampleRate);    

        sapphire.reset();
        sapphire.update(scaledSampleRate);    

        garnet.reset();
        garnet.update(scaledSampleRate);            

        toneStack.reset();
        updateToneStackRate();
    }

    // nam

    using Model = Altar::DSP::NAM::ManualModel;

    void reloadCurrentModel()
    {
        juce::String jsonString;
        {
            const juce::ScopedLock sl(cachedJsonLock);
            jsonString = lastLoadedModelJson;
        }
        if (jsonString.isNotEmpty())
            loadNAMModelInternal(jsonString);
    }
    
    void loadNAMModel(const var& jsonData)
    {
#if DEV_BYPASS_AMP
        return;
#endif
        // thread-safe JSON loader, creates new model off-thread & atomically swaps it in        
        juce::String jsonString;

        if (jsonData.isObject()) { jsonString = juce::JSON::toString(jsonData); }
        else if (jsonData.isString()) { jsonString = jsonData.toString(); }        
        else { DBG("Invalid JSON data format for NAM loader."); return; }

        if (jsonString.isEmpty()) { return; }
        {
            const juce::ScopedLock sl(cachedJsonLock);
            lastLoadedModelJson = jsonString;
        }

        loadNAMModelInternal(jsonString);
    }

    void loadNAMModelInternal(const juce::String& jsonString)
    {
#if DEV_BYPASS_AMP
        return;
#endif
        if (isLoading.exchange(true)) { return; }

        const std::string jsonCopy = jsonString.toStdString();
        // slimAmount: 0.0 = Full (target 1.0), 1.0 = Lite (target 0.0)
        const double targetSlim = 1.0 - (double)std::max(0.0f, std::min(1.0f, slimAmount.load()));
        const int prepBlockSize = static_cast<int>(lastSpecs.maximumBlockSize > 0 ? lastSpecs.maximumBlockSize : 512);
        auto aliveToken = isAlive;

        std::thread([this, aliveToken, jsonCopy, targetSlim, prepBlockSize]()
        {
            try
            {
                nlohmann::json modelJson = nlohmann::json::parse(jsonCopy);

                if (!aliveToken->load()) return;

                Altar::DSP::NAM::LoadedManualModel loadedModelL = Altar::DSP::NAM::createManualModel(modelJson, targetSlim);
                Altar::DSP::NAM::LoadedManualModel loadedModelR = Altar::DSP::NAM::createManualModel(modelJson, targetSlim);

                if (!aliveToken->load()) return;

                if (loadedModelL.model)
                {
                    loadedModelL.model->prepare(prepBlockSize); // prepare off-thread
                    if (loadedModelR.model)
                        loadedModelR.model->prepare(prepBlockSize);

                    if (!aliveToken->load()) return;

                    modelSampleRate.store(loadedModelL.sampleRate, std::memory_order_release);
                    resamplerConfig.store(true, std::memory_order_release);

                    std::atomic_store(&modelShared, std::move(loadedModelL.model));
                    std::atomic_store(&modelSharedR, std::move(loadedModelR.model));
                    modelLoaded = true;
                    modelPath = {}; 
                    needsWarmup.store(true, std::memory_order_release); // request warmup
                }
            }
            catch (const std::exception& e) { DBG("Exception loading NAM model: " << e.what()); if (aliveToken->load()) modelLoaded = false; }            
            catch (...) { DBG("Unknown exception loading NAM model"); if (aliveToken->load()) modelLoaded = false; }            

            if (aliveToken->load())
                isLoading.store(false);
        }).detach();
    }
 
    struct StreamingResampler
    {        
        static constexpr int NumTaps = 12;
        static constexpr int HalfTaps = NumTaps / 2;
        static constexpr int HistoryLenVal = HalfTaps + 6;

        void setup(double inRate, double outRate)
        {
            step = inRate / outRate;
            history.reserve(64);
            src.reserve(4096);
            resetState();
        }

        void resetState()
        {
            pos = 0.0;
            history.clear();
            history.resize(HistoryLenVal, 0.0f);            
        }
        
        void processBlock(const float* in, int inCount, std::vector<float>& out, int outCount)
        {
            const int postPad = HistoryLenVal; 
            src.resize(history.size() + (size_t)inCount + (size_t)postPad);
                        
            if (!history.empty()) { std::memcpy(src.data(), history.data(), history.size() * sizeof(float)); }
            if (inCount > 0) { std::memcpy(src.data() + history.size(), in, (size_t)inCount * sizeof(float)); }
            if (postPad > 0)
            {
                const float padVal = (inCount > 0) ? in[inCount - 1] : (!history.empty() ? history.back() : 0.0f);
                std::fill_n(src.data() + history.size() + (size_t)inCount, (size_t)postPad, padVal);
            }
                
            out.resize((size_t)outCount);
            const double base = static_cast<double>(history.size());
            
            for (int m = 0; m < outCount; ++m)
            {
                const double x = pos + base + (double)m * step;
                out[(size_t)m] = lagrange(x);                
            }
            
            pos += (double)outCount * step - static_cast<double>(inCount);

            const int keepN = HistoryLenVal; 
            history.resize(keepN);
            
            if (inCount >= keepN)
            {
                std::memcpy(history.data(), in + (inCount - keepN), (size_t)keepN * sizeof(float));
            }
            else
            {
                const int fromHistory = keepN - inCount;
                if (fromHistory > 0)
                {
                    std::memmove(history.data(), history.data() + inCount, (size_t)fromHistory * sizeof(float));
                }
                if (inCount > 0)
                {
                    std::memcpy(history.data() + fromHistory, in, (size_t)inCount * sizeof(float));
                }
            }
        }

        inline float lagrange(double posInSrc) const
        {
            const int baseIdx = static_cast<int>(std::floor(posInSrc));
            const float mu = static_cast<float>(posInSrc - static_cast<double>(baseIdx));
            static constexpr int nodes[NumTaps] = { -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6 };

            // Precomputed 1.0f / prod_{j != i} (nodes[i] - nodes[j])
            static constexpr float invDenom[NumTaps] = {
                -1.0f / 39916800.0f,
                 1.0f / 3628800.0f,
                -1.0f / 725760.0f,
                 1.0f / 241920.0f,
                -1.0f / 120960.0f,
                 1.0f / 86400.0f,
                -1.0f / 86400.0f,
                 1.0f / 120960.0f,
                -1.0f / 241920.0f,
                 1.0f / 725760.0f,
                -1.0f / 3628800.0f,
                 1.0f / 39916800.0f
            };

            float y[NumTaps] = { 0.0f };
            for (int i = 0; i < NumTaps; ++i)
            {
                int idx = baseIdx + nodes[i];
                if (idx >= 0 && static_cast<size_t>(idx) < src.size())
                {
                    y[i] = src[static_cast<size_t>(idx)];
                }
            }

            float diff[NumTaps];
            for (int j = 0; j < NumTaps; ++j)
            {
                diff[j] = mu - static_cast<float>(nodes[j]);
            }

            float out = 0.0f;
            for (int i = 0; i < NumTaps; ++i)
            {
                float num = 1.0f;
                for (int j = 0; j < NumTaps; ++j)
                {
                    if (i == j) continue;
                    num *= diff[j];
                }
                out += (num * invDenom[i]) * y[i];
            }
            return out;
        }
        
        double step { 1.0 };
        double pos  { 0.0 };
        std::vector<float> history;
        mutable std::vector<float> src;
    };

    void updateNAMResamplers()
    {
        if (!resamplerConfig.load(std::memory_order_acquire)) { return; }            

        const double hostSR  = (lastSpecs.sampleRate > 0.0) ? lastSpecs.sampleRate : (double)sampleRate;
        const double modelSR = modelSampleRate.load(std::memory_order_acquire);
        
        inputResampler.setup(hostSR, modelSR);
        outputResampler.setup(modelSR, hostSR);
        inputResamplerR.setup(hostSR, modelSR);
        outputResamplerR.setup(modelSR, hostSR);

        // prepare scratches        
        const int maxIn = std::max(512, (int)lastSpecs.maximumBlockSize);
        const double ratio = (hostSR > 0.0) ? (modelSR / hostSR) : 1.0;
        const int upEstimate = static_cast<int>(std::ceil(maxIn * std::max(1.0, ratio))) + 64;

        scratchUp.resize((size_t)upEstimate);
        scratchNAM.resize((size_t)upEstimate);
        scratchDown.resize((size_t)(maxIn + 64));
        tempBuffer.resize((size_t)upEstimate);

        scratchUpR.resize((size_t)upEstimate);
        scratchNAMR.resize((size_t)upEstimate);
        scratchDownR.resize((size_t)(maxIn + 64));
        tempBufferR.resize((size_t)upEstimate);

        resamplerConfig.store(false, std::memory_order_release);
    }

    void warmupNAM(Altar::DSP::NAM::ManualModel& m)
    {
        // calls forward on a bunch of 0 samples then discards them to warmup the model
        for (int i = 0; i < 2048; ++i) { (void)m.forward(0.0f); }            
    }

    void processNAMMode(AudioBuffer<float>& buffer, int numSamples)
    {
        updateNAMResamplers();
        
        const int numCh = juce::jmin(2, buffer.getNumChannels());
        const bool processStereo = (!monoMode && numCh == 2);

        float* channelDataL = buffer.getWritePointer(0);
        float* channelDataR = (numCh > 1) ? buffer.getWritePointer(1) : nullptr;

        auto mL = std::atomic_load(&modelShared);
        auto mR = processStereo ? std::atomic_load(&modelSharedR) : nullptr;

        if (mL && needsWarmup.load(std::memory_order_acquire)) // if model needs warming, warm it
        {
            bool expected = true;
            if (needsWarmup.compare_exchange_strong(expected, false, std::memory_order_acq_rel))
            {
                warmupNAM(*mL);
                if (auto mRInit = std::atomic_load(&modelSharedR))
                    warmupNAM(*mRInit);
            }
        }

        // safety check in case model doesn't exist
        if (!mL)
        {
            if (numCh > 1 && monoMode)
                std::memcpy(channelDataR, channelDataL, (size_t)numSamples * sizeof(float));
            return;
        }

        const float inGainLinear = Decibels::decibelsToGain(inputGain);
        const float outGainLinear = Decibels::decibelsToGain(outputGain);

        const double hostSR = (lastSpecs.sampleRate > 0.0) ? lastSpecs.sampleRate : (double)sampleRate;
        const double modelSR = modelSampleRate.load(std::memory_order_acquire);
        const bool needsResample = std::abs(hostSR - modelSR) > 0.5;

        auto processChannel = [&](const float* input, float* output, Altar::DSP::NAM::ManualModel* m, int ch,
                                  StreamingResampler& inResamp, StreamingResampler& outResamp,
                                  std::vector<float>& upBuf, std::vector<float>& namBuf, std::vector<float>& downBuf,
                                  std::vector<float>& tBuf)
        {
            if (!needsResample)
            {
                if (tBuf.size() < (size_t)numSamples)
                    tBuf.resize((size_t)numSamples);

                for (int s = 0; s < numSamples; ++s)
                    tBuf[(size_t)s] = input[s] * inGainLinear;

                m->forward(tBuf.data(), output, numSamples);

                for (int s = 0; s < numSamples; ++s)
                {
                    const float sVal = namDCBlocker.process(ch, output[s]);
                    output[s] = toneStack.processPre(ch, sVal) * outGainLinear;
                }
            }
            else
            {
                const double upRatio = modelSR / hostSR;
                const double exactTarget = (static_cast<double>(numSamples) - inResamp.pos) * upRatio;
                const int upCountTarget = static_cast<int>(std::round(exactTarget));

                inResamp.processBlock(input, numSamples, upBuf, upCountTarget);

                const int upCount = static_cast<int>(upBuf.size());
                if (tBuf.size() < (size_t)upCount)
                    tBuf.resize((size_t)upCount);

                for (int i = 0; i < upCount; ++i)
                    tBuf[(size_t)i] = upBuf[(size_t)i] * inGainLinear;

                if (namBuf.size() < (size_t)upCount)
                    namBuf.resize((size_t)upCount);

                m->forward(tBuf.data(), namBuf.data(), upCount);

                outResamp.processBlock(namBuf.data(), upCount, downBuf, numSamples);

                for (int s = 0; s < numSamples; ++s)
                {
                    const float sVal = namDCBlocker.process(ch, downBuf[(size_t)s]);
                    output[s] = toneStack.processPre(ch, sVal) * outGainLinear;
                }
            }
        };

        if (processStereo && mR && mR != mL)
        {
            processChannel(buffer.getReadPointer(0), channelDataL, mL.get(), 0,
                           inputResampler, outputResampler, scratchUp, scratchNAM, scratchDown, tempBuffer);
            processChannel(buffer.getReadPointer(1), channelDataR, mR.get(), 1,
                           inputResamplerR, outputResamplerR, scratchUpR, scratchNAMR, scratchDownR, tempBufferR);
        }
        else if (numCh > 1)
        {
            processChannel(buffer.getReadPointer(0), channelDataL, mL.get(), 0,
                           inputResampler, outputResampler, scratchUp, scratchNAM, scratchDown, tempBuffer);
            std::memcpy(channelDataR, channelDataL, (size_t)numSamples * sizeof(float));
        }
        else
        {
            processChannel(channelDataL, channelDataL, mL.get(), 0,
                           inputResampler, outputResampler, scratchUp, scratchNAM, scratchDown, tempBuffer);
        }
    }

    bool modelLoaded = false;
    juce::String modelPath = "";
    std::atomic<float> slimAmount { 0.0f };
    juce::CriticalSection cachedJsonLock;
    juce::String lastLoadedModelJson;
    
    std::shared_ptr<Altar::DSP::NAM::ManualModel> modelShared;
    std::shared_ptr<Altar::DSP::NAM::ManualModel> modelSharedR;
    std::atomic<bool> isLoading { false };
    std::atomic<bool> needsWarmup { false };

    // nam resampler
    std::atomic<double> modelSampleRate { 48000.0 }; // most nam models are trained at 48000
    std::atomic<bool>   resamplerConfig { true };

    struct SimpleDCBlocker
    {
        float x1[2] = { 0.0f, 0.0f };
        float y1[2] = { 0.0f, 0.0f };
        float r = 0.999f;

        void update(double sampleRate)
        {
            if (sampleRate > 0.0)
                r = static_cast<float>(std::clamp(1.0 - (2.0 * 3.14159265358979323846 * 10.0 / sampleRate), 0.99, 0.9999));
        }

        void reset()
        {
            x1[0] = x1[1] = 0.0f;
            y1[0] = y1[1] = 0.0f;
        }

        inline float process(int ch, float x)
        {
            const int c = (ch == 1) ? 1 : 0;
            float y = x - x1[c] + r * y1[c];
            x1[c] = x;
            y1[c] = (std::abs(y) < 1e-15f) ? 0.0f : y;
            return y;
        }
    } namDCBlocker;

    StreamingResampler inputResampler;   // host -> model L
    StreamingResampler outputResampler;  // model -> host L
    StreamingResampler inputResamplerR;  // host -> model R
    StreamingResampler outputResamplerR; // model -> host R
    std::vector<float> scratchUp;        // upsampled input for NAM L
    std::vector<float> scratchDown;      // NAM output resampled back L
    std::vector<float> scratchNAM;       // NAM processing buffer L
    std::vector<float> tempBuffer;       // scaled input for NAM L
    std::vector<float> scratchUpR;       // upsampled input for NAM R
    std::vector<float> scratchDownR;     // NAM output resampled back R
    std::vector<float> scratchNAMR;      // NAM processing buffer R
    std::vector<float> tempBufferR;      // scaled input for NAM R
    AudioBuffer<float> internalBuffer;
   
};
}