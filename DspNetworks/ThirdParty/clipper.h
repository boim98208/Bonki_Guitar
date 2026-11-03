/*
    Generic Soft-Knee Clipper for Chonki
*/

#pragma once
#include <JuceHeader.h>
#include <cmath>
#include <algorithm>

namespace project
{
using namespace juce;
using namespace hise;
using namespace scriptnode;

template <int NV> struct clipper: public data::base
{
    SNEX_NODE(clipper);

    struct MetadataClass
    {
        SN_NODE_ID("clipper");
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
        sampleRate = static_cast<float>(specs.sampleRate);
        numChannels = specs.numChannels;
    }

    void reset() {}

    template <typename T> void process(T& data)
    {
        const int numSamples = data.getNumSamples();
        const float inGain = juce::Decibels::decibelsToGain(clipperGainDB);
        const float ceiling = juce::Decibels::decibelsToGain(clipperCeilingDB);
        const float outGain = juce::Decibels::decibelsToGain(clipperOutputGainDB);

        const float knee = ceiling * 0.15f;
        const float thresh = ceiling - knee;

        for (auto ch : data)
        {
            dyn<float> channel = data.toChannelData(ch);

            for (int s = 0; s < numSamples; ++s)
            {
                const float dry = channel[s];
                const float scaled = dry * inGain;
                const float absIn = std::abs(scaled);

                float clipped = 0.0f;
                if (absIn <= thresh)
                {
                    clipped = scaled;
                }
                else if (absIn >= ceiling)
                {
                    clipped = (scaled > 0.0f) ? ceiling : -ceiling;
                }
                else
                {
                    const float x = (absIn - thresh) / knee;
                    const float curve = 0.5f * (1.0f + std::tanh(juce::MathConstants<float>::pi * (x - 0.5f)));
                    const float val = thresh + curve * knee;
                    clipped = (scaled > 0.0f) ? val : -val;
                }

                const float wet = clipped * outGain;
                channel[s] = dry * (1.0f - mix) + wet * mix;
            }
        }
    }

    template <int P> void setParameter(double v)
    {
        switch (P)
        {
        case 0: clipperGainDB = static_cast<float>(v); break;
        case 1: clipperCeilingDB = static_cast<float>(v); break;
        case 2: clipperOutputGainDB = static_cast<float>(v); break;
        case 3: mix = static_cast<float>(v); break;
        }
    }

    void createParameters(ParameterDataList& data)
    {
        {
            parameter::data p("Gain", { 0.0, 24.0 });
            registerCallback<0>(p);
            p.setDefaultValue(0.0);
            data.add(std::move(p));
        }
        {
            parameter::data p("Ceiling", { -12.0, 0.0 });
            registerCallback<1>(p);
            p.setDefaultValue(-0.1);
            data.add(std::move(p));
        }
        {
            parameter::data p("OutputGain", { -24.0, 24.0 });
            registerCallback<2>(p);
            p.setDefaultValue(0.0);
            data.add(std::move(p));
        }
        {
            parameter::data p("Mix", { 0.0, 1.0 });
            registerCallback<3>(p);
            p.setDefaultValue(1.0);
            data.add(std::move(p));
        }
    }

private:
    float sampleRate = 44100.0f;
    int numChannels = 2;

    float clipperGainDB = 0.0f;
    float clipperCeilingDB = -0.1f;
    float clipperOutputGainDB = 0.0f;
    float mix = 1.0f;
};

} // namespace project
