/*
    Copyright 2025 iamlamprey / Bonki Guitar
    Multi-Mode Algorithmic Reverb:
    - Mode 0: Room (Tight, crisp natural acoustic space)
    - Mode 1: Hall / Chamber (Lush, expansive concert hall with smooth diffusion)
    - Mode 2: Spring (Vintage guitar spring tank with dispersion chirp and pickup filtering)
    - Mode 3: Ambient (Cavernous cloud, dual modulated tank, 30s+ decay & infinite freeze)

    This file is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.
*/

#pragma once
#include <JuceHeader.h>
#include <vector>
#include <cmath>
#include <algorithm>

namespace project
{
using namespace juce;
using namespace hise;
using namespace scriptnode;

template <int NV> struct reverb: public data::base
{
    SNEX_NODE(reverb);        
    
    struct MetadataClass
    {
        SN_NODE_ID("reverb");
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

    // =========================================================================
    // DSP Primitives
    // =========================================================================
    struct Allpass
    {
        std::vector<float> buffer;
        int index = 0;

        void prepare(int maxSamples)
        {
            buffer.assign(std::max(1, maxSamples), 0.0f);
            index = 0;
        }

        void reset()
        {
            std::fill(buffer.begin(), buffer.end(), 0.0f);
            index = 0;
        }

        forcedinline float process(float in, float gain)
        {
            if (buffer.empty()) return in;
            float bufOut = buffer[index];
            float out = -gain * in + bufOut;
            buffer[index] = in + gain * out;
            if (++index >= (int)buffer.size()) index = 0;
            return out;
        }
    };

    struct DelayLine
    {
        std::vector<float> buffer;
        int writeIndex = 0;

        void prepare(int maxSamples)
        {
            buffer.assign(std::max(1, maxSamples), 0.0f);
            writeIndex = 0;
        }

        void reset()
        {
            std::fill(buffer.begin(), buffer.end(), 0.0f);
            writeIndex = 0;
        }

        forcedinline void write(float in)
        {
            if (buffer.empty()) return;
            buffer[writeIndex] = in;
            if (++writeIndex >= (int)buffer.size()) writeIndex = 0;
        }

        forcedinline float readLinear(float delayInSamples) const
        {
            if (buffer.empty()) return 0.0f;
            int sz = (int)buffer.size();
            float readPos = (float)writeIndex - delayInSamples;
            while (readPos < 0.0f) readPos += (float)sz;
            while (readPos >= (float)sz) readPos -= (float)sz;

            int i1 = (int)readPos;
            int i2 = i1 + 1;
            if (i2 >= sz) i2 = 0;
            float frac = readPos - (float)i1;
            return buffer[i1] + frac * (buffer[i2] - buffer[i1]);
        }
    };

    struct OnePoleLP
    {
        float state = 0.0f;
        void reset() { state = 0.0f; }

        forcedinline float process(float in, float damp)
        {
            // damp: 0.0f = full bandwidth, near 1.0f = heavy damping
            state = in * (1.0f - damp) + state * damp;
            if (std::abs(state) < 1.0e-15f) state = 0.0f;
            return state;
        }
    };

    struct SpringBandpass
    {
        float hp_x1 = 0.0f, hp_y1 = 0.0f;
        float lp_y1 = 0.0f;
        float hp_alpha = 0.97f;
        float lp_alpha = 0.35f;

        void update(float sr)
        {
            float dt = 1.0f / sr;
            // Highpass ~180 Hz
            float rc_hp = 1.0f / (2.0f * juce::MathConstants<float>::pi * 180.0f);
            hp_alpha = rc_hp / (rc_hp + dt);

            // Lowpass ~4500 Hz
            float rc_lp = 1.0f / (2.0f * juce::MathConstants<float>::pi * 4500.0f);
            lp_alpha = dt / (rc_lp + dt);
        }

        void reset()
        {
            hp_x1 = hp_y1 = lp_y1 = 0.0f;
        }

        forcedinline float process(float in)
        {
            float hp_out = hp_alpha * (hp_y1 + in - hp_x1);
            hp_x1 = in;
            hp_y1 = hp_out;
            lp_y1 += lp_alpha * (hp_out - lp_y1);
            if (std::abs(lp_y1) < 1.0e-15f) lp_y1 = 0.0f;
            return lp_y1;
        }
    };

    forcedinline static float softLimit(float x)
    {
        float ax = std::abs(x);
        return x / (1.0f + 0.1f * ax);
    }

    // =========================================================================
    // Constructor & Lifecycle
    // =========================================================================
    reverb()
    {
    }
    
    void prepare(PrepareSpecs specs) 
    {
        sampleRate = static_cast<float>(specs.sampleRate);
        numChannels = static_cast<int>(specs.numChannels);
        if (sampleRate < 1000.0f) sampleRate = 44100.0f;

        // Pre-delay buffer (up to 0.25s)
        preDelayBuffer.resize(2);
        int preDelayMaxSamples = static_cast<int>(0.25f * sampleRate);
        for (int ch = 0; ch < 2; ++ch)
        {
            preDelayBuffer[ch].assign(std::max(1, preDelayMaxSamples), 0.0f);
        }
        preDelayWriteIndex = 0;

        // ---------------------------------------------------------------------
        // Mode 0: Room Setup
        // ---------------------------------------------------------------------
        const float roomInputAPMs[4] = { 3.2f, 5.1f, 7.8f, 10.2f };
        for (int ch = 0; ch < 2; ++ch)
        {
            for (int i = 0; i < 4; ++i)
            {
                float offsetMs = (ch == 1) ? 0.7f : 0.0f;
                int apSamples = static_cast<int>((roomInputAPMs[i] + offsetMs) * 0.001f * sampleRate);
                roomInputAP[ch][i].prepare(apSamples);
            }
            int maxRoomTankSamples = static_cast<int>(0.15f * sampleRate);
            roomTankDelay[ch][0].prepare(maxRoomTankSamples);
            roomTankDelay[ch][1].prepare(maxRoomTankSamples);
        }

        // ---------------------------------------------------------------------
        // Mode 1: Hall Setup
        // ---------------------------------------------------------------------
        const float hallInputAPMs[4] = { 4.7f, 8.8f, 12.6f, 16.5f };
        for (int ch = 0; ch < 2; ++ch)
        {
            for (int i = 0; i < 4; ++i)
            {
                float offsetMs = (ch == 1) ? 1.1f : 0.0f;
                int apSamples = static_cast<int>((hallInputAPMs[i] + offsetMs) * 0.001f * sampleRate);
                hallInputAP[ch][i].prepare(apSamples);
            }
            int maxHallTankSamples = static_cast<int>(0.30f * sampleRate);
            hallTankDelay[ch].prepare(maxHallTankSamples);

            float nested1Ms = (ch == 0) ? 21.3f : 25.7f;
            float nested2Ms = (ch == 0) ? 33.1f : 39.4f;
            hallNestedAP[ch][0].prepare(static_cast<int>(nested1Ms * 0.001f * sampleRate));
            hallNestedAP[ch][1].prepare(static_cast<int>(nested2Ms * 0.001f * sampleRate));
        }

        // ---------------------------------------------------------------------
        // Mode 2: Spring Setup
        // ---------------------------------------------------------------------
        const float springDispMs[8] = { 0.52f, 0.84f, 1.11f, 1.38f, 1.65f, 2.02f, 2.43f, 2.88f };
        for (int ch = 0; ch < 2; ++ch)
        {
            for (int i = 0; i < 8; ++i)
            {
                float offsetMs = (ch == 1) ? 0.15f : 0.0f;
                int apSamples = static_cast<int>((springDispMs[i] + offsetMs) * 0.001f * sampleRate);
                springDispAP[ch][i].prepare(apSamples);
            }
            int maxSpringSamples = static_cast<int>(0.10f * sampleRate);
            springDelay[ch][0].prepare(maxSpringSamples);
            springDelay[ch][1].prepare(maxSpringSamples);
            springDelay[ch][2].prepare(maxSpringSamples);

            springBP[ch].update(sampleRate);
        }

        // ---------------------------------------------------------------------
        // Mode 3: Ambient Setup
        // ---------------------------------------------------------------------
        const float ambInputAPMs[4] = { 11.0f, 16.3f, 23.4f, 32.3f };
        for (int ch = 0; ch < 2; ++ch)
        {
            for (int i = 0; i < 4; ++i)
            {
                float offsetMs = (ch == 1) ? 2.3f : 0.0f;
                int apSamples = static_cast<int>((ambInputAPMs[i] + offsetMs) * 0.001f * sampleRate);
                ambInputAP[ch][i].prepare(apSamples);
            }
            int maxAmbSamples = static_cast<int>(1.1f * sampleRate);
            for (int i = 0; i < 4; ++i)
            {
                ambTankDelay[ch][i].prepare(maxAmbSamples);
            }
            const float ambLoopAPMs[4] = { 5.2f, 8.1f, 11.7f, 15.3f };
            for (int i = 0; i < 4; ++i)
            {
                float offsetMs = (ch == 1) ? 1.4f : 0.0f;
                ambLoopAP[ch][i].prepare(static_cast<int>((ambLoopAPMs[i] + offsetMs) * 0.001f * sampleRate));
            }
        }

        reset();
    }       

    void reset() 
    {
        for (int ch = 0; ch < 2; ++ch)
        {
            if (ch < (int)preDelayBuffer.size())
                std::fill(preDelayBuffer[ch].begin(), preDelayBuffer[ch].end(), 0.0f);

            // Room
            for (int i = 0; i < 4; ++i) roomInputAP[ch][i].reset();
            roomTankDelay[ch][0].reset();
            roomTankDelay[ch][1].reset();
            roomTankLP[ch][0].reset();
            roomTankLP[ch][1].reset();

            // Hall
            for (int i = 0; i < 4; ++i) hallInputAP[ch][i].reset();
            hallTankDelay[ch].reset();
            hallNestedAP[ch][0].reset();
            hallNestedAP[ch][1].reset();
            hallTankLP[ch].reset();

            // Spring
            for (int i = 0; i < 8; ++i) springDispAP[ch][i].reset();
            springDelay[ch][0].reset();
            springDelay[ch][1].reset();
            springDelay[ch][2].reset();
            springLP[ch][0].reset();
            springLP[ch][1].reset();
            springLP[ch][2].reset();
            springBP[ch].reset();

            // Ambient
            for (int i = 0; i < 4; ++i) ambInputAP[ch][i].reset();
            for (int i = 0; i < 4; ++i)
            {
                ambTankDelay[ch][i].reset();
                ambLoopAP[ch][i].reset();
                ambTankLP[ch][i].reset();
            }
        }

        preDelayWriteIndex = 0;
        lfoPhase1 = 0.0f;
        lfoPhase2 = 0.0f;
    }
    
    // =========================================================================
    // Mode DSP Processors
    // =========================================================================
    forcedinline void processRoom(float inL, float inR, float& outL, float& outR,
                                 float roomSizeVal, float decayVal, float dampVal)
    {
        float diffL = inL;
        float diffR = inR;
        for (int i = 0; i < 4; ++i)
        {
            diffL = roomInputAP[0][i].process(diffL, 0.6f);
            diffR = roomInputAP[1][i].process(diffR, 0.6f);
        }

        float sizeScale = 0.45f + 0.85f * roomSizeVal;
        float dL0 = (27.5f * sizeScale) * 0.001f * sampleRate;
        float dL1 = (41.2f * sizeScale) * 0.001f * sampleRate;
        float dR0 = (33.1f * sizeScale) * 0.001f * sampleRate;
        float dR1 = (49.8f * sizeScale) * 0.001f * sampleRate;

        float fbGain = 0.18f + 0.70f * decayVal; // max 0.866 for snappy room

        float rL0 = roomTankDelay[0][0].readLinear(dL0);
        float rL1 = roomTankDelay[0][1].readLinear(dL1);
        float rR0 = roomTankDelay[1][0].readLinear(dR0);
        float rR1 = roomTankDelay[1][1].readLinear(dR1);

        rL0 = roomTankLP[0][0].process(rL0, dampVal);
        rL1 = roomTankLP[0][1].process(rL1, dampVal);
        rR0 = roomTankLP[1][0].process(rR0, dampVal);
        rR1 = roomTankLP[1][1].process(rR1, dampVal);

        float cross = 0.25f;
        float feedL0 = softLimit(diffL + fbGain * (rL1 * (1.0f - cross) + rR0 * cross));
        float feedL1 = softLimit(diffL * 0.7f + fbGain * (rL0 * (1.0f - cross) + rR1 * cross));
        float feedR0 = softLimit(diffR + fbGain * (rR1 * (1.0f - cross) + rL0 * cross));
        float feedR1 = softLimit(diffR * 0.7f + fbGain * (rR0 * (1.0f - cross) + rL1 * cross));

        roomTankDelay[0][0].write(feedL0);
        roomTankDelay[0][1].write(feedL1);
        roomTankDelay[1][0].write(feedR0);
        roomTankDelay[1][1].write(feedR1);

        outL = (rL0 - rL1) * 0.65f;
        outR = (rR0 - rR1) * 0.65f;
    }

    forcedinline void processHall(float inL, float inR, float& outL, float& outR,
                                 float roomSizeVal, float decayVal, float dampVal,
                                 float modDepthVal, float lfo1, float lfo2)
    {
        float diffL = inL;
        float diffR = inR;
        for (int i = 0; i < 4; ++i)
        {
            diffL = hallInputAP[0][i].process(diffL, 0.65f);
            diffR = hallInputAP[1][i].process(diffR, 0.65f);
        }

        float sizeScale = 0.6f + 0.8f * roomSizeVal;
        float modL = modDepthVal * 0.0018f * sampleRate * lfo1;
        float modR = modDepthVal * 0.0018f * sampleRate * lfo2;

        float dL = (88.0f * sizeScale) * 0.001f * sampleRate + modL;
        float dR = (114.0f * sizeScale) * 0.001f * sampleRate + modR;

        float fbGain = 0.40f + 0.53f * decayVal; // max ~0.92 for ~8.5s tail

        float loopL = hallTankDelay[0].readLinear(dL);
        loopL = hallNestedAP[0][0].process(loopL, 0.55f);
        loopL = hallNestedAP[0][1].process(loopL, 0.50f);
        loopL = hallTankLP[0].process(loopL, dampVal);

        float loopR = hallTankDelay[1].readLinear(dR);
        loopR = hallNestedAP[1][0].process(loopR, 0.55f);
        loopR = hallNestedAP[1][1].process(loopR, 0.50f);
        loopR = hallTankLP[1].process(loopR, dampVal);

        float writeL = softLimit(diffL + fbGain * loopR);
        float writeR = softLimit(diffR + fbGain * loopL);

        hallTankDelay[0].write(writeL);
        hallTankDelay[1].write(writeR);

        outL = (loopL * 0.6f + loopR * 0.2f) * 0.70f;
        outR = (loopR * 0.6f + loopL * 0.2f) * 0.70f;
    }

    forcedinline void processSpring(float inL, float inR, float& outL, float& outR,
                                   float roomSizeVal, float decayVal, float dampVal)
    {
        // Pick attack soft compression
        float driveL = inL / (1.0f + 0.4f * std::abs(inL));
        float driveR = inR / (1.0f + 0.4f * std::abs(inR));

        // 8-stage dispersion allpass cascade for spring transient chirp ("drip/boing")
        float dispL = driveL;
        float dispR = driveR;
        for (int i = 0; i < 8; ++i)
        {
            dispL = springDispAP[0][i].process(dispL, -0.72f);
            dispR = springDispAP[1][i].process(dispR, -0.72f);
        }

        // Bandpass pickup coil filter
        dispL = springBP[0].process(dispL);
        dispR = springBP[1].process(dispR);

        // 3-strand spring delay tank: 29.3ms, 37.1ms, 44.5ms
        float tensionScale = 0.7f + 0.6f * roomSizeVal;
        float d0 = (29.3f * tensionScale) * 0.001f * sampleRate;
        float d1 = (37.1f * tensionScale) * 0.001f * sampleRate;
        float d2 = (44.5f * tensionScale) * 0.001f * sampleRate;

        float fbGain = 0.35f + 0.56f * decayVal; // max 0.898 for classic ~3s ring

        float sL0 = springDelay[0][0].readLinear(d0);
        float sL1 = springDelay[0][1].readLinear(d1);
        float sL2 = springDelay[0][2].readLinear(d2);

        float sR0 = springDelay[1][0].readLinear(d0 * 1.05f);
        float sR1 = springDelay[1][1].readLinear(d1 * 1.04f);
        float sR2 = springDelay[1][2].readLinear(d2 * 1.03f);

        sL0 = springLP[0][0].process(sL0, dampVal);
        sL1 = springLP[0][1].process(sL1, dampVal);
        sL2 = springLP[0][2].process(sL2, dampVal);

        sR0 = springLP[1][0].process(sR0, dampVal);
        sR1 = springLP[1][1].process(sR1, dampVal);
        sR2 = springLP[1][2].process(sR2, dampVal);

        float feedL0 = softLimit(dispL + fbGain * (0.6f * sL1 + 0.4f * sL2));
        float feedL1 = softLimit(dispL * 0.8f + fbGain * (0.6f * sL2 - 0.4f * sL0));
        float feedL2 = softLimit(dispL * 0.6f + fbGain * (0.5f * sL0 + 0.5f * sL1));

        float feedR0 = softLimit(dispR + fbGain * (0.6f * sR1 + 0.4f * sR2));
        float feedR1 = softLimit(dispR * 0.8f + fbGain * (0.6f * sR2 - 0.4f * sR0));
        float feedR2 = softLimit(dispR * 0.6f + fbGain * (0.5f * sR0 + 0.5f * sR1));

        springDelay[0][0].write(feedL0);
        springDelay[0][1].write(feedL1);
        springDelay[0][2].write(feedL2);

        springDelay[1][0].write(feedR0);
        springDelay[1][1].write(feedR1);
        springDelay[1][2].write(feedR2);

        outL = (sL0 - 0.7f * sL1 + 0.5f * sL2) * 0.75f;
        outR = (sR0 - 0.7f * sR1 + 0.5f * sR2) * 0.75f;
    }

    forcedinline void processAmbient(float inL, float inR, float& outL, float& outR,
                                    float roomSizeVal, float decayVal, float dampVal,
                                    float modDepthVal, float lfo1, float lfo2)
    {
        // 1. High diffusion input cascade
        float diffL = inL;
        float diffR = inR;
        for (int i = 0; i < 4; ++i)
        {
            diffL = ambInputAP[0][i].process(diffL, 0.75f);
            diffR = ambInputAP[1][i].process(diffR, 0.75f);
        }

        // 2. Exponential feedback curve for massive ambient tail & infinite freeze
        float fbGain = 0.50f;
        if (decayVal <= 0.70f)
        {
            fbGain = 0.50f + 0.35f * (decayVal / 0.70f); // 0.50 to 0.85 (2s to 12s)
        }
        else
        {
            float t = (decayVal - 0.70f) / 0.28f;
            t = juce::jlimit(0.0f, 1.0f, t);
            fbGain = 0.85f + 0.148f * (t * t); // up to 0.998 for 40s+ / infinite freeze!
        }

        // 3. Tank delay times with quadrature LFO modulation
        float sizeScale = 0.6f + 1.0f * roomSizeVal;
        const float baseDelaysL[4] = { 147.1f, 233.3f, 359.7f, 521.9f };
        const float baseDelaysR[4] = { 167.3f, 257.9f, 397.1f, 577.3f };

        float modScaleSamples = modDepthVal * 0.0035f * sampleRate;
        float modTapsL[4] = {
            modScaleSamples * lfo1,
            modScaleSamples * lfo2,
            -modScaleSamples * lfo1,
            -modScaleSamples * lfo2
        };
        float modTapsR[4] = {
            modScaleSamples * lfo2,
            -modScaleSamples * lfo1,
            -modScaleSamples * lfo2,
            modScaleSamples * lfo1
        };

        float tankReadL[4];
        float tankReadR[4];

        for (int i = 0; i < 4; ++i)
        {
            float dSamplesL = (baseDelaysL[i] * sizeScale) * 0.001f * sampleRate + modTapsL[i];
            float dSamplesR = (baseDelaysR[i] * sizeScale) * 0.001f * sampleRate + modTapsR[i];

            float sL = ambTankDelay[0][i].readLinear(dSamplesL);
            float sR = ambTankDelay[1][i].readLinear(dSamplesR);

            sL = ambLoopAP[0][i].process(sL, 0.60f);
            sR = ambLoopAP[1][i].process(sR, 0.60f);

            sL = ambTankLP[0][i].process(sL, dampVal);
            sR = ambTankLP[1][i].process(sR, dampVal);

            tankReadL[i] = sL;
            tankReadR[i] = sR;
        }

        // 4. Householder mixing matrix with crossfeed
        float sumL = tankReadL[0] + tankReadL[1] + tankReadL[2] + tankReadL[3];
        float sumR = tankReadR[0] + tankReadR[1] + tankReadR[2] + tankReadR[3];

        float crossfeed = 0.22f;

        for (int i = 0; i < 4; ++i)
        {
            float mixedL = 0.5f * sumL - tankReadL[i];
            float mixedR = 0.5f * sumR - tankReadR[i];

            float combinedL = mixedL * (1.0f - crossfeed) + mixedR * crossfeed;
            float combinedR = mixedR * (1.0f - crossfeed) + mixedL * crossfeed;

            float feedL = softLimit(diffL * 0.5f + fbGain * combinedL);
            float feedR = softLimit(diffR * 0.5f + fbGain * combinedR);

            ambTankDelay[0][i].write(feedL);
            ambTankDelay[1][i].write(feedR);
        }

        outL = (tankReadL[0] - tankReadL[1] + tankReadL[2] - tankReadL[3]) * 0.45f;
        outR = (tankReadR[0] + tankReadR[1] - tankReadR[2] - tankReadR[3]) * 0.45f;
    }

    // =========================================================================
    // Process Block
    // =========================================================================
    template <typename T> void process(T& data)
    {
        int numSamples = data.getNumSamples();
        const float mixValue = juce::jlimit(0.0f, 1.0f, mix);
        const float roomSizeValue = juce::jlimit(0.0f, 1.0f, roomSize);
        const float decayValue = juce::jlimit(0.0f, 0.98f, decay);
        const float chorusDepthValue = juce::jlimit(0.0f, 1.0f, chorusDepth);
        const float preDelayTimeValue = juce::jlimit(0.0f, 0.20f, preDelayTime);
        const int currentMode = juce::jlimit(0, 3, static_cast<int>(std::round(reverbMode)));

        int preDelaySamples = static_cast<int>(preDelayTimeValue * sampleRate);

        // Damping frequency calculation (500 Hz to 20000 Hz)
        float dampVal = std::exp(-2.0f * juce::MathConstants<float>::pi * dampingFrequency / sampleRate);
        dampVal = juce::jlimit(0.02f, 0.96f, dampVal);

        const float lfoInc1 = (2.0f * juce::MathConstants<float>::pi * 0.24f) / sampleRate;
        const float lfoInc2 = (2.0f * juce::MathConstants<float>::pi * 0.37f) / sampleRate;

        dyn<float> chData[2];
        int numChInBlock = 0;
        for (auto ch : data)
        {
            if (numChInBlock >= 2) break;
            chData[numChInBlock++] = data.toChannelData(ch);
        }
        if (numChInBlock == 0) return;

        for (int s = 0; s < numSamples; ++s)
        {
            lfoPhase1 += lfoInc1;
            if (lfoPhase1 >= 2.0f * juce::MathConstants<float>::pi)
                lfoPhase1 -= 2.0f * juce::MathConstants<float>::pi;

            lfoPhase2 += lfoInc2;
            if (lfoPhase2 >= 2.0f * juce::MathConstants<float>::pi)
                lfoPhase2 -= 2.0f * juce::MathConstants<float>::pi;

            float lfo1 = std::sin(lfoPhase1);
            float lfo2 = std::sin(lfoPhase2);

            float inL = chData[0][s];
            float inR = (numChInBlock > 1) ? chData[1][s] : inL;
            float dryL = inL;
            float dryR = inR;

            // Pre-delay
            float preInL = inL;
            float preInR = inR;
            if (preDelaySamples > 0 && !preDelayBuffer.empty() && !preDelayBuffer[0].empty())
            {
                int bufSize = (int)preDelayBuffer[0].size();
                int readIdx = (preDelayWriteIndex - preDelaySamples + bufSize) % bufSize;
                preInL = preDelayBuffer[0][readIdx];
                preInR = (numChannels > 1) ? preDelayBuffer[1][readIdx] : preInL;

                preDelayBuffer[0][preDelayWriteIndex] = inL;
                if (numChannels > 1)
                    preDelayBuffer[1][preDelayWriteIndex] = inR;

                preDelayWriteIndex = (preDelayWriteIndex + 1) % bufSize;
            }

            float wetL = 0.0f;
            float wetR = 0.0f;

            switch (currentMode)
            {
            case 0: // Room
                processRoom(preInL, preInR, wetL, wetR, roomSizeValue, decayValue, dampVal);
                break;
            case 1: // Hall
                processHall(preInL, preInR, wetL, wetR, roomSizeValue, decayValue, dampVal, chorusDepthValue, lfo1, lfo2);
                break;
            case 2: // Spring
                processSpring(preInL, preInR, wetL, wetR, roomSizeValue, decayValue, dampVal);
                break;
            case 3: // Ambient
                processAmbient(preInL, preInR, wetL, wetR, roomSizeValue, decayValue, dampVal, chorusDepthValue, lfo1, lfo2);
                break;
            default:
                processRoom(preInL, preInR, wetL, wetR, roomSizeValue, decayValue, dampVal);
                break;
            }

            chData[0][s] = dryL * (1.0f - mixValue) + wetL * mixValue;
            if (numChInBlock > 1)
                chData[1][s] = dryR * (1.0f - mixValue) + wetR * mixValue;
        }
    }
    
    // =========================================================================
    // Parameter Handling
    // =========================================================================
    template <int P> void setParameter(double v)
    {
        switch (P)
        {
        case 0: mix = static_cast<float>(v); break;
        case 1: preDelayTime = static_cast<float>(v); break;
        case 2: roomSize = static_cast<float>(v); break;
        case 3: decay = static_cast<float>(v); break;
        case 4: dampingFrequency = static_cast<float>(v); break;
        case 5: chorusDepth = static_cast<float>(v); break;
        case 6: 
            reverbMode = static_cast<float>(v);
            reset();
            break;
        }
    }
    
    void createParameters(ParameterDataList& data)
    {       
        {
            parameter::data mix_param("Mix", { 0.0, 1.0 });
            registerCallback<0>(mix_param);
            mix_param.setDefaultValue(0.5);
            data.add(std::move(mix_param));
        }
        {
            parameter::data predelay_param("PreDelay", { 0.0, 0.2 });
            registerCallback<1>(predelay_param);
            predelay_param.setDefaultValue(0.03);
            data.add(std::move(predelay_param));
        }
        {
            parameter::data roomsize_param("RoomSize", { 0.0, 1.0 });
            registerCallback<2>(roomsize_param);
            roomsize_param.setDefaultValue(0.7);
            data.add(std::move(roomsize_param));
        }
        {
            parameter::data decay_param("Decay", { 0.0, 0.98 });
            registerCallback<3>(decay_param);
            decay_param.setDefaultValue(0.8);
            data.add(std::move(decay_param));
        }
        {
            parameter::data damping_param("DampingFrequency", { 500.0, 20000.0 });
            registerCallback<4>(damping_param);
            damping_param.setDefaultValue(3000.0);
            data.add(std::move(damping_param));
        }
        {
            parameter::data chorus_param("ChorusDepth", { 0.0, 1.0 });
            registerCallback<5>(chorus_param);
            chorus_param.setDefaultValue(0.3);
            data.add(std::move(chorus_param));
        }
        {
            parameter::data mode_param("ReverbMode", { 0.0, 3.0 });
            registerCallback<6>(mode_param);
            mode_param.setDefaultValue(0.0);
            data.add(std::move(mode_param));
        }
    }

private:
    float sampleRate = 44100.0f;
    int numChannels = 2;
    
    float mix = 0.5f;
    float preDelayTime = 0.03f;
    float roomSize = 0.7f;
    float decay = 0.8f;
    float dampingFrequency = 3000.0f;
    float chorusDepth = 0.3f;
    float reverbMode = 0.0f;

    std::vector<std::vector<float>> preDelayBuffer;
    int preDelayWriteIndex = 0;

    float lfoPhase1 = 0.0f;
    float lfoPhase2 = 0.0f;

    // Mode 0: Room
    Allpass roomInputAP[2][4];
    DelayLine roomTankDelay[2][2];
    OnePoleLP roomTankLP[2][2];

    // Mode 1: Hall
    Allpass hallInputAP[2][4];
    DelayLine hallTankDelay[2];
    Allpass hallNestedAP[2][2];
    OnePoleLP hallTankLP[2];

    // Mode 2: Spring
    Allpass springDispAP[2][8];
    DelayLine springDelay[2][3];
    OnePoleLP springLP[2][3];
    SpringBandpass springBP[2];

    // Mode 3: Ambient
    Allpass ambInputAP[2][4];
    DelayLine ambTankDelay[2][4];
    Allpass ambLoopAP[2][4];
    OnePoleLP ambTankLP[2][4];
};
}
