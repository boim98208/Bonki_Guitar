/*
    Generic Compressor for Chonki
    Uses HISE / JUCE native dsp::Compressor
*/

#pragma once
#include <JuceHeader.h>
#include <algorithm>

namespace project
{
using namespace juce;
using namespace hise;
using namespace scriptnode;

template <int NV> struct compressor: public data::base
{
    SNEX_NODE(compressor);

    struct MetadataClass
    {
        SN_NODE_ID("compressor");
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

        comp.prepare(spec);
        comp.setThreshold(thresholdDB);
        comp.setRatio(ratio);
        comp.setAttack(attackMs);
        comp.setRelease(releaseMs);

        dryBuffer.setSize(specs.numChannels, static_cast<int>(specs.blockSize), false, false, true);
    }

    void reset()
    {
        comp.reset();
    }

    template <typename T> void process(T& data)
    {
        const int numSamples = data.getNumSamples();
        const int numChannels = data.getNumChannels();

        if (dryBuffer.getNumSamples() < numSamples)
            dryBuffer.setSize(numChannels, numSamples, false, false, true);

        auto ptrs = data.getRawDataPointers();

        // Copy dry
        for (int ch = 0; ch < numChannels; ++ch)
            std::memcpy(dryBuffer.getWritePointer(ch), ptrs[ch], sizeof(float) * numSamples);

        // Process compression using JUCE AudioBlock
        juce::dsp::AudioBlock<float> block(ptrs, static_cast<size_t>(numChannels), static_cast<size_t>(numSamples));
        juce::dsp::ProcessContextReplacing<float> context(block);
        comp.process(context);

        // Apply makeup gain and mix
        const float makeupGain = juce::Decibels::decibelsToGain(outputGainDB);

        for (int ch = 0; ch < numChannels; ++ch)
        {
            const float* dry = dryBuffer.getReadPointer(ch);
            float* wet = ptrs[ch];

            for (int s = 0; s < numSamples; ++s)
            {
                wet[s] = dry[s] * (1.0f - mix) + (wet[s] * makeupGain) * mix;
            }
        }
    }

    template <int P> void setParameter(double v)
    {
        switch (P)
        {
        case 0:
            thresholdDB = static_cast<float>(v);
            comp.setThreshold(thresholdDB);
            break;
        case 1:
            ratio = std::max(1.0f, static_cast<float>(v));
            comp.setRatio(ratio);
            break;
        case 2:
            attackMs = std::max(0.1f, static_cast<float>(v));
            comp.setAttack(attackMs);
            break;
        case 3:
            releaseMs = std::max(1.0f, static_cast<float>(v));
            comp.setRelease(releaseMs);
            break;
        case 4:
            outputGainDB = static_cast<float>(v);
            break;
        case 5:
            mix = static_cast<float>(v);
            break;
        }
    }

    void createParameters(ParameterDataList& data)
    {
        {
            parameter::data p("Threshold", { -60.0, 0.0 });
            registerCallback<0>(p);
            p.setDefaultValue(-20.0);
            data.add(std::move(p));
        }
        {
            parameter::data p("Ratio", { 1.0, 20.0 });
            registerCallback<1>(p);
            p.setDefaultValue(4.0);
            data.add(std::move(p));
        }
        {
            parameter::data p("Attack", { 0.1, 200.0 });
            registerCallback<2>(p);
            p.setDefaultValue(10.0);
            data.add(std::move(p));
        }
        {
            parameter::data p("Release", { 10.0, 1000.0 });
            registerCallback<3>(p);
            p.setDefaultValue(100.0);
            data.add(std::move(p));
        }
        {
            parameter::data p("OutputGain", { -24.0, 24.0 });
            registerCallback<4>(p);
            p.setDefaultValue(0.0);
            data.add(std::move(p));
        }
        {
            parameter::data p("Mix", { 0.0, 1.0 });
            registerCallback<5>(p);
            p.setDefaultValue(1.0);
            data.add(std::move(p));
        }
    }

private:
    juce::dsp::Compressor<float> comp;
    juce::AudioBuffer<float> dryBuffer;

    float thresholdDB = -20.0f;
    float ratio = 4.0f;
    float attackMs = 10.0f;
    float releaseMs = 100.0f;
    float outputGainDB = 0.0f;
    float mix = 1.0f;
};

} // namespace project

