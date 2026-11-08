/*
    Pitch Shifter for Chonki
    Provides multiple pitch shifting algorithms:
    0: Spectral HQ (Signalsmith Stretch - Phase Vocoder)
    1: Spectral Fast (Signalsmith Stretch - Transient / Snappy)
    2: Granular Low-Latency (Dual Delay Line Crossfade)
*/

#pragma once
#include <JuceHeader.h>
#include <cmath>
#include <algorithm>
#include "src/dependencies/signalsmith-stretch/signalsmith-stretch.h"

namespace project
{
using namespace juce;
using namespace hise;
using namespace scriptnode;

template <int NV> struct pitchshifter: public data::base
{
    SNEX_NODE(pitchshifter);

    struct MetadataClass
    {
        SN_NODE_ID("pitchshifter");
    };

    static constexpr bool isModNode() { return false; };
    static constexpr bool isPolyphonic() { return NV > 1; };
    static constexpr bool hasTail() { return true; };
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
        sampleRate = specs.sampleRate;
        maxBlockSize = static_cast<int>(specs.blockSize);

        // Algorithm 0: Spectral HQ
        int hqBlock = static_cast<int>(std::round(sampleRate * 0.10));
        int hqInterval = static_cast<int>(std::round(sampleRate * 0.025));
        stretchHQ.configure(numChannels, hqBlock, hqInterval);

        // Algorithm 1: Spectral Fast
        int fastBlock = static_cast<int>(std::round(sampleRate * 0.045));
        int fastInterval = static_cast<int>(std::round(sampleRate * 0.011));
        stretchFast.configure(numChannels, fastBlock, fastInterval);

        updateRatio();

        tmp.setSize(numChannels, std::max(maxBlockSize, 2048), false, false, true);
        dryBuffer.setSize(numChannels, std::max(maxBlockSize, 2048), false, false, true);

        // Granular delay buffer: 8192 samples (approx 185ms at 44.1k)
        delayBufferSize = 8192;
        delayBuffer.setSize(numChannels, delayBufferSize);
        delayBuffer.clear();
        writePos = 0;
        grainPhase0 = 0.0f;
        grainSize = static_cast<float>(std::round(sampleRate * 0.035)); // ~35ms grain
        if (grainSize < 256.0f) grainSize = 256.0f;
        if (grainSize > 2048.0f) grainSize = 2048.0f;

        // Dry delay alignment buffer for phase vocoder wet/dry blending
        dryRingSize = 8192;
        dryDelayRing.setSize(numChannels, dryRingSize);
        dryDelayRing.clear();
        dryRingWritePos = 0;

        reset();
    }

    void reset()
    {
        stretchHQ.reset();
        stretchFast.reset();
        delayBuffer.clear();
        dryDelayRing.clear();
        writePos = 0;
        dryRingWritePos = 0;
        grainPhase0 = 0.0f;
    }

    template <typename T> void process(T& data)
    {
        auto ptrs = data.getRawDataPointers();
        const int numSamples = data.getNumSamples();

        if (tmp.getNumSamples() < numSamples)
        {
            tmp.setSize(numChannels, numSamples, false, false, true);
            dryBuffer.setSize(numChannels, numSamples, false, false, true);
        }

        // Store dry copy
        for (int ch = 0; ch < numChannels; ++ch)
            std::memcpy(dryBuffer.getWritePointer(ch), ptrs[ch], sizeof(float) * numSamples);

        // If pitch is 0 or mix is dry (mix <= 0.001f), bypass heavy processing (0 latency pass-through)
        if (std::abs(pitchSemitones) < 0.01f || mix <= 0.001f)
        {
            return;
        }

        if (algorithm == 0) // Spectral HQ
        {
            float* in[2]  = { ptrs[0], ptrs[1] };
            float* out[2] = { tmp.getWritePointer(0), tmp.getWritePointer(1) };
            stretchHQ.process(in, numSamples, out, numSamples);

            const int lat = std::clamp(stretchHQ.outputLatency(), 0, dryRingSize - 1);

            if (mix >= 0.999f)
            {
                std::memcpy(ptrs[0], tmp.getReadPointer(0), sizeof(float) * numSamples);
                std::memcpy(ptrs[1], tmp.getReadPointer(1), sizeof(float) * numSamples);
                for (int s = 0; s < numSamples; ++s)
                {
                    dryDelayRing.setSample(0, dryRingWritePos, dryBuffer.getReadPointer(0)[s]);
                    dryDelayRing.setSample(1, dryRingWritePos, dryBuffer.getReadPointer(1)[s]);
                    dryRingWritePos = (dryRingWritePos + 1) % dryRingSize;
                }
            }
            else
            {
                for (int s = 0; s < numSamples; ++s)
                {
                    int readPos = (dryRingWritePos - lat + dryRingSize) % dryRingSize;
                    for (int ch = 0; ch < numChannels; ++ch)
                    {
                        float drySamp = dryBuffer.getReadPointer(ch)[s];
                        dryDelayRing.setSample(ch, dryRingWritePos, drySamp);
                        float delayedDry = dryDelayRing.getSample(ch, readPos);
                        float wetSamp = tmp.getReadPointer(ch)[s];
                        ptrs[ch][s] = delayedDry * (1.0f - mix) + wetSamp * mix;
                    }
                    dryRingWritePos = (dryRingWritePos + 1) % dryRingSize;
                }
            }
        }
        else if (algorithm == 1) // Spectral Fast
        {
            float* in[2]  = { ptrs[0], ptrs[1] };
            float* out[2] = { tmp.getWritePointer(0), tmp.getWritePointer(1) };
            stretchFast.process(in, numSamples, out, numSamples);

            const int lat = std::clamp(stretchFast.outputLatency(), 0, dryRingSize - 1);

            if (mix >= 0.999f)
            {
                std::memcpy(ptrs[0], tmp.getReadPointer(0), sizeof(float) * numSamples);
                std::memcpy(ptrs[1], tmp.getReadPointer(1), sizeof(float) * numSamples);
                for (int s = 0; s < numSamples; ++s)
                {
                    dryDelayRing.setSample(0, dryRingWritePos, dryBuffer.getReadPointer(0)[s]);
                    dryDelayRing.setSample(1, dryRingWritePos, dryBuffer.getReadPointer(1)[s]);
                    dryRingWritePos = (dryRingWritePos + 1) % dryRingSize;
                }
            }
            else
            {
                for (int s = 0; s < numSamples; ++s)
                {
                    int readPos = (dryRingWritePos - lat + dryRingSize) % dryRingSize;
                    for (int ch = 0; ch < numChannels; ++ch)
                    {
                        float drySamp = dryBuffer.getReadPointer(ch)[s];
                        dryDelayRing.setSample(ch, dryRingWritePos, drySamp);
                        float delayedDry = dryDelayRing.getSample(ch, readPos);
                        float wetSamp = tmp.getReadPointer(ch)[s];
                        ptrs[ch][s] = delayedDry * (1.0f - mix) + wetSamp * mix;
                    }
                    dryRingWritePos = (dryRingWritePos + 1) % dryRingSize;
                }
            }
        }
        else // Algorithm 2: Granular Low-Latency
        {
            const float rate = static_cast<float>(ratio);
            const float phaseInc = 1.0f - rate;
            const float halfGrain = grainSize * 0.5f;

            for (int s = 0; s < numSamples; ++s)
            {
                // Advance grain phases
                grainPhase0 += phaseInc;
                while (grainPhase0 >= grainSize) grainPhase0 -= grainSize;
                while (grainPhase0 < 0.0f)       grainPhase0 += grainSize;

                float grainPhase1 = grainPhase0 + halfGrain;
                while (grainPhase1 >= grainSize) grainPhase1 -= grainSize;

                // Triangular / linear crossfade window
                float w0 = 1.0f - 2.0f * std::abs(grainPhase0 / grainSize - 0.5f);
                float w1 = 1.0f - w0;

                for (int ch = 0; ch < numChannels; ++ch)
                {
                    float inSamp = dryBuffer.getReadPointer(ch)[s];
                    delayBuffer.setSample(ch, writePos, inSamp);

                    // Read pointer 0
                    float r0 = static_cast<float>(writePos) - grainPhase0;
                    if (r0 < 0.0f) r0 += static_cast<float>(delayBufferSize);
                    int i0 = static_cast<int>(r0);
                    int i0_next = (i0 + 1) % delayBufferSize;
                    float frac0 = r0 - static_cast<float>(i0);
                    float s0 = (1.0f - frac0) * delayBuffer.getSample(ch, i0) + frac0 * delayBuffer.getSample(ch, i0_next);

                    // Read pointer 1
                    float r1 = static_cast<float>(writePos) - grainPhase1;
                    if (r1 < 0.0f) r1 += static_cast<float>(delayBufferSize);
                    int i1 = static_cast<int>(r1);
                    int i1_next = (i1 + 1) % delayBufferSize;
                    float frac1 = r1 - static_cast<float>(i1);
                    float s1 = (1.0f - frac1) * delayBuffer.getSample(ch, i1) + frac1 * delayBuffer.getSample(ch, i1_next);

                    float wet = s0 * w0 + s1 * w1;
                    ptrs[ch][s] = inSamp * (1.0f - mix) + wet * mix;
                }

                writePos = (writePos + 1) % delayBufferSize;
            }
        }
    }

    template <int P> void setParameter(double v)
    {
        switch (P)
        {
        case 0:
            pitchSemitones = static_cast<float>(v);
            if (std::abs(pitchSemitones) < 0.01f)
                reset();
            updateRatio();
            break;
        case 1:
            mix = static_cast<float>(v);
            break;
        case 2:
            algorithm = std::clamp(static_cast<int>(std::round(v)), 0, 2);
            break;
        }
    }

    void createParameters(ParameterDataList& data)
    {
        {
            parameter::data p("Pitch", { -24.0, 24.0 });
            registerCallback<0>(p);
            p.setDefaultValue(0.0);
            data.add(std::move(p));
        }
        {
            parameter::data p("Mix", { 0.0, 1.0 });
            registerCallback<1>(p);
            p.setDefaultValue(1.0);
            data.add(std::move(p));
        }
        {
            parameter::data p("Algorithm", { 0.0, 2.0 });
            registerCallback<2>(p);
            p.setDefaultValue(0.0);
            data.add(std::move(p));
        }
    }

private:
    void updateRatio()
    {
        ratio = std::pow(2.0, pitchSemitones / 12.0);
        stretchHQ.setTransposeFactor(ratio);
        stretchFast.setTransposeFactor(ratio);
    }

    signalsmith::stretch::SignalsmithStretch<float> stretchHQ;
    signalsmith::stretch::SignalsmithStretch<float> stretchFast;

    juce::AudioBuffer<float> tmp;
    juce::AudioBuffer<float> dryBuffer;
    juce::AudioBuffer<float> delayBuffer;
    juce::AudioBuffer<float> dryDelayRing;
    int dryRingSize = 8192;
    int dryRingWritePos = 0;

    double sampleRate = 44100.0;
    double ratio = 1.0;
    int maxBlockSize = 0;
    const int numChannels = 2;

    float pitchSemitones = 0.0f;
    float mix = 1.0f;
    int algorithm = 0;

    int delayBufferSize = 8192;
    int writePos = 0;
    float grainPhase0 = 0.0f;
    float grainSize = 1024.0f;
};

} // namespace project

