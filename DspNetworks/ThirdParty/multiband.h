/*
    3-Band Multiband Compressor for Chonki
    Uses 4th-order Linkwitz-Riley crossovers with allpass phase compensation
    and 3 independent juce::dsp::Compressor instances.
*/

#pragma once
#include <JuceHeader.h>
#include <algorithm>

namespace project
{
using namespace juce;
using namespace hise;
using namespace scriptnode;

template <int NV> struct multiband: public data::base
{
    SNEX_NODE(multiband);

    struct MetadataClass
    {
        SN_NODE_ID("multiband");
    };

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

    void prepare(PrepareSpecs specs)
    {
        juce::dsp::ProcessSpec spec;
        spec.sampleRate = specs.sampleRate;
        spec.maximumBlockSize = specs.blockSize;
        spec.numChannels = static_cast<uint32>(specs.numChannels);

        // Low/Mid crossover filters
        filterLowLP.setType(juce::dsp::LinkwitzRileyFilterType::lowpass);
        filterLowLP.setCutoffFrequency(lowXOver);
        filterLowLP.prepare(spec);

        filterLowHP.setType(juce::dsp::LinkwitzRileyFilterType::highpass);
        filterLowHP.setCutoffFrequency(lowXOver);
        filterLowHP.prepare(spec);

        // Mid/High crossover filters
        filterHighLP.setType(juce::dsp::LinkwitzRileyFilterType::lowpass);
        filterHighLP.setCutoffFrequency(highXOver);
        filterHighLP.prepare(spec);

        filterHighHP.setType(juce::dsp::LinkwitzRileyFilterType::highpass);
        filterHighHP.setCutoffFrequency(highXOver);
        filterHighHP.prepare(spec);

        // Low-band allpass for phase compensation of the Mid/High crossover
        filterLowAP.setType(juce::dsp::LinkwitzRileyFilterType::allpass);
        filterLowAP.setCutoffFrequency(highXOver);
        filterLowAP.prepare(spec);

        // Compressors
        compLow.prepare(spec);
        compMid.prepare(spec);
        compHigh.prepare(spec);

        updateCompressors();

        const int maxSamples = static_cast<int>(specs.blockSize);
        dryBuffer.setSize(numChannels, maxSamples, false, false, true);
        lowBuffer.setSize(numChannels, maxSamples, false, false, true);
        midHighBuffer.setSize(numChannels, maxSamples, false, false, true);
        midBuffer.setSize(numChannels, maxSamples, false, false, true);
        highBuffer.setSize(numChannels, maxSamples, false, false, true);
    }

    void reset()
    {
        filterLowLP.reset();
        filterLowHP.reset();
        filterHighLP.reset();
        filterHighHP.reset();
        filterLowAP.reset();

        compLow.reset();
        compMid.reset();
        compHigh.reset();
    }

    template <typename T> void process(T& data)
    {
        const int numSamples = data.getNumSamples();

        if (dryBuffer.getNumSamples() < numSamples)
        {
            dryBuffer.setSize(numChannels, numSamples, false, false, true);
            lowBuffer.setSize(numChannels, numSamples, false, false, true);
            midHighBuffer.setSize(numChannels, numSamples, false, false, true);
            midBuffer.setSize(numChannels, numSamples, false, false, true);
            highBuffer.setSize(numChannels, numSamples, false, false, true);
        }

        auto ptrs = data.getRawDataPointers();

        // 1. Copy dry input
        for (int ch = 0; ch < numChannels; ++ch)
        {
            std::memcpy(dryBuffer.getWritePointer(ch), ptrs[ch], sizeof(float) * numSamples);
            std::memcpy(lowBuffer.getWritePointer(ch), ptrs[ch], sizeof(float) * numSamples);
            std::memcpy(midHighBuffer.getWritePointer(ch), ptrs[ch], sizeof(float) * numSamples);
        }

        // 2. Crossover Low vs (Mid+High)
        juce::dsp::AudioBlock<float> lowBlock(lowBuffer.getArrayOfWritePointers(), numChannels, numSamples);
        juce::dsp::ProcessContextReplacing<float> lowCtx(lowBlock);
        filterLowLP.process(lowCtx);
        filterLowAP.process(lowCtx); // Phase align Low with Mid+High split

        juce::dsp::AudioBlock<float> midHighBlock(midHighBuffer.getArrayOfWritePointers(), numChannels, numSamples);
        juce::dsp::ProcessContextReplacing<float> midHighCtx(midHighBlock);
        filterLowHP.process(midHighCtx);

        // 3. Crossover Mid vs High from (Mid+High)
        for (int ch = 0; ch < numChannels; ++ch)
        {
            std::memcpy(midBuffer.getWritePointer(ch), midHighBuffer.getReadPointer(ch), sizeof(float) * numSamples);
            std::memcpy(highBuffer.getWritePointer(ch), midHighBuffer.getReadPointer(ch), sizeof(float) * numSamples);
        }

        juce::dsp::AudioBlock<float> midBlock(midBuffer.getArrayOfWritePointers(), numChannels, numSamples);
        juce::dsp::ProcessContextReplacing<float> midCtx(midBlock);
        filterHighLP.process(midCtx);

        juce::dsp::AudioBlock<float> highBlock(highBuffer.getArrayOfWritePointers(), numChannels, numSamples);
        juce::dsp::ProcessContextReplacing<float> highCtx(highBlock);
        filterHighHP.process(highCtx);

        // 4. Compress each band
        compLow.process(lowCtx);
        compMid.process(midCtx);
        compHigh.process(highCtx);

        // 5. Apply band gains and recombine
        const float gLow  = juce::Decibels::decibelsToGain(lowGainDB);
        const float gMid  = juce::Decibels::decibelsToGain(midGainDB);
        const float gHigh = juce::Decibels::decibelsToGain(highGainDB);

        for (int ch = 0; ch < numChannels; ++ch)
        {
            const float* dry  = dryBuffer.getReadPointer(ch);
            const float* bLow = lowBuffer.getReadPointer(ch);
            const float* bMid = midBuffer.getReadPointer(ch);
            const float* bHi  = highBuffer.getReadPointer(ch);
            float* out = ptrs[ch];

            for (int s = 0; s < numSamples; ++s)
            {
                float wet = bLow[s] * gLow + bMid[s] * gMid + bHi[s] * gHigh;
                out[s] = dry[s] * (1.0f - mix) + wet * mix;
            }
        }
    }

    template <int P> void setParameter(double v)
    {
        switch (P)
        {
        case 0:
            lowXOver = std::clamp(static_cast<float>(v), 40.0f, 1000.0f);
            filterLowLP.setCutoffFrequency(lowXOver);
            filterLowHP.setCutoffFrequency(lowXOver);
            break;
        case 1:
            highXOver = std::clamp(static_cast<float>(v), 1000.0f, 16000.0f);
            filterHighLP.setCutoffFrequency(highXOver);
            filterHighHP.setCutoffFrequency(highXOver);
            filterLowAP.setCutoffFrequency(highXOver);
            break;
        case 2:
            lowThresholdDB = static_cast<float>(v);
            compLow.setThreshold(lowThresholdDB);
            break;
        case 3:
            lowRatio = std::max(1.0f, static_cast<float>(v));
            compLow.setRatio(lowRatio);
            break;
        case 4:
            lowGainDB = static_cast<float>(v);
            break;
        case 5:
            midThresholdDB = static_cast<float>(v);
            compMid.setThreshold(midThresholdDB);
            break;
        case 6:
            midRatio = std::max(1.0f, static_cast<float>(v));
            compMid.setRatio(midRatio);
            break;
        case 7:
            midGainDB = static_cast<float>(v);
            break;
        case 8:
            highThresholdDB = static_cast<float>(v);
            compHigh.setThreshold(highThresholdDB);
            break;
        case 9:
            highRatio = std::max(1.0f, static_cast<float>(v));
            compHigh.setRatio(highRatio);
            break;
        case 10:
            highGainDB = static_cast<float>(v);
            break;
        case 11:
            attackMs = std::max(0.1f, static_cast<float>(v));
            compLow.setAttack(attackMs);
            compMid.setAttack(attackMs);
            compHigh.setAttack(attackMs);
            break;
        case 12:
            releaseMs = std::max(1.0f, static_cast<float>(v));
            compLow.setRelease(releaseMs);
            compMid.setRelease(releaseMs);
            compHigh.setRelease(releaseMs);
            break;
        case 13:
            mix = static_cast<float>(v);
            break;
        }
    }

    void createParameters(ParameterDataList& data)
    {
        {
            parameter::data p("LowXOver", { 40.0, 1000.0 });
            registerCallback<0>(p);
            p.setDefaultValue(200.0);
            data.add(std::move(p));
        }
        {
            parameter::data p("HighXOver", { 1000.0, 16000.0 });
            registerCallback<1>(p);
            p.setDefaultValue(2500.0);
            data.add(std::move(p));
        }
        {
            parameter::data p("LowThreshold", { -60.0, 0.0 });
            registerCallback<2>(p);
            p.setDefaultValue(-20.0);
            data.add(std::move(p));
        }
        {
            parameter::data p("LowRatio", { 1.0, 20.0 });
            registerCallback<3>(p);
            p.setDefaultValue(3.0);
            data.add(std::move(p));
        }
        {
            parameter::data p("LowGain", { -18.0, 18.0 });
            registerCallback<4>(p);
            p.setDefaultValue(0.0);
            data.add(std::move(p));
        }
        {
            parameter::data p("MidThreshold", { -60.0, 0.0 });
            registerCallback<5>(p);
            p.setDefaultValue(-20.0);
            data.add(std::move(p));
        }
        {
            parameter::data p("MidRatio", { 1.0, 20.0 });
            registerCallback<6>(p);
            p.setDefaultValue(3.0);
            data.add(std::move(p));
        }
        {
            parameter::data p("MidGain", { -18.0, 18.0 });
            registerCallback<7>(p);
            p.setDefaultValue(0.0);
            data.add(std::move(p));
        }
        {
            parameter::data p("HighThreshold", { -60.0, 0.0 });
            registerCallback<8>(p);
            p.setDefaultValue(-20.0);
            data.add(std::move(p));
        }
        {
            parameter::data p("HighRatio", { 1.0, 20.0 });
            registerCallback<9>(p);
            p.setDefaultValue(3.0);
            data.add(std::move(p));
        }
        {
            parameter::data p("HighGain", { -18.0, 18.0 });
            registerCallback<10>(p);
            p.setDefaultValue(0.0);
            data.add(std::move(p));
        }
        {
            parameter::data p("Attack", { 1.0, 100.0 });
            registerCallback<11>(p);
            p.setDefaultValue(15.0);
            data.add(std::move(p));
        }
        {
            parameter::data p("Release", { 10.0, 500.0 });
            registerCallback<12>(p);
            p.setDefaultValue(100.0);
            data.add(std::move(p));
        }
        {
            parameter::data p("Mix", { 0.0, 1.0 });
            registerCallback<13>(p);
            p.setDefaultValue(1.0);
            data.add(std::move(p));
        }
    }

private:
    void updateCompressors()
    {
        compLow.setThreshold(lowThresholdDB);
        compLow.setRatio(lowRatio);
        compLow.setAttack(attackMs);
        compLow.setRelease(releaseMs);

        compMid.setThreshold(midThresholdDB);
        compMid.setRatio(midRatio);
        compMid.setAttack(attackMs);
        compMid.setRelease(releaseMs);

        compHigh.setThreshold(highThresholdDB);
        compHigh.setRatio(highRatio);
        compHigh.setAttack(attackMs);
        compHigh.setRelease(releaseMs);
    }

    juce::dsp::LinkwitzRileyFilter<float> filterLowLP;
    juce::dsp::LinkwitzRileyFilter<float> filterLowHP;
    juce::dsp::LinkwitzRileyFilter<float> filterHighLP;
    juce::dsp::LinkwitzRileyFilter<float> filterHighHP;
    juce::dsp::LinkwitzRileyFilter<float> filterLowAP;

    juce::dsp::Compressor<float> compLow;
    juce::dsp::Compressor<float> compMid;
    juce::dsp::Compressor<float> compHigh;

    juce::AudioBuffer<float> dryBuffer;
    juce::AudioBuffer<float> lowBuffer;
    juce::AudioBuffer<float> midHighBuffer;
    juce::AudioBuffer<float> midBuffer;
    juce::AudioBuffer<float> highBuffer;

    const int numChannels = 2;

    float lowXOver = 200.0f;
    float highXOver = 2500.0f;

    float lowThresholdDB = -20.0f;
    float lowRatio = 3.0f;
    float lowGainDB = 0.0f;

    float midThresholdDB = -20.0f;
    float midRatio = 3.0f;
    float midGainDB = 0.0f;

    float highThresholdDB = -20.0f;
    float highRatio = 3.0f;
    float highGainDB = 0.0f;

    float attackMs = 15.0f;
    float releaseMs = 100.0f;
    float mix = 1.0f;
};

} // namespace project

