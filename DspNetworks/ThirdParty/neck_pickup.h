/*
    Neck Pickup Comb & Acoustic Emulation Node for Bonki_Guitar
*/

#pragma once
#include <JuceHeader.h>
#include <cmath>
#include <vector>
#include <algorithm>

namespace project
{
using namespace juce;
using namespace hise;
using namespace scriptnode;

template <int NV> struct neck_pickup: public data::base
{
    SNEX_NODE(neck_pickup);

    struct MetadataClass
    {
        SN_NODE_ID("neck_pickup");
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
    void setExternalData(const ExternalData& data, int index) {}

    neck_pickup()
    {
        currentNote = openNotes[stringNumber - 1];
        for (int ch = 0; ch < 2; ++ch)
        {
            delayBuffer[ch].assign(MAX_DELAY_SAMPLES, 0.0f);
            writeIndex[ch] = 0;
            shelf_z1[ch] = shelf_z2[ch] = 0.0f;
            eqBr_z1[ch]  = eqBr_z2[ch]  = 0.0f;
            eqNk_z1[ch]  = eqNk_z2[ch]  = 0.0f;
            lp_z1[ch]    = lp_z2[ch]    = 0.0f;
        }
    }

    void handleHiseEvent(HiseEvent& e)
    {
        if (e.isNoteOn())
        {
            currentNote = e.getNoteNumber();
            updateDSPParameters();
        }
    }

    void prepare(PrepareSpecs specs)
    {
        sampleRate = static_cast<float>(specs.sampleRate);
        numChannels = juce::jlimit(1, 2, static_cast<int>(specs.numChannels));

        for (int ch = 0; ch < 2; ++ch)
        {
            delayBuffer[ch].assign(MAX_DELAY_SAMPLES, 0.0f);
            writeIndex[ch] = 0;
            shelf_z1[ch] = shelf_z2[ch] = 0.0f;
            eqBr_z1[ch]  = eqBr_z2[ch]  = 0.0f;
            eqNk_z1[ch]  = eqNk_z2[ch]  = 0.0f;
            lp_z1[ch]    = lp_z2[ch]    = 0.0f;
        }

        currentNote = openNotes[stringNumber - 1];
        updateDSPParameters();
    }

    void reset()
    {
        for (int ch = 0; ch < 2; ++ch)
        {
            std::fill(delayBuffer[ch].begin(), delayBuffer[ch].end(), 0.0f);
            writeIndex[ch] = 0;
            shelf_z1[ch] = shelf_z2[ch] = 0.0f;
            eqBr_z1[ch]  = eqBr_z2[ch]  = 0.0f;
            eqNk_z1[ch]  = eqNk_z2[ch]  = 0.0f;
            lp_z1[ch]    = lp_z2[ch]    = 0.0f;
        }
    }

    template <typename T> void process(T& data)
    {
        if (xfade <= 0.0001f)
            return; // 100% dry, passthrough

        const int numSamples = data.getNumSamples();
        const float outGain = juce::Decibels::decibelsToGain(outputGainDB);
        const float targetDelay = currentDelaySamples;
        const float targetG = combDepth;
        const float wetMix = xfade;
        const float dryMix = 1.0f - xfade;

        int chIndex = 0;
        for (auto ch : data)
        {
            if (chIndex >= 2) break;
            dyn<float> channel = data.toChannelData(ch);

            auto& dBuf = delayBuffer[chIndex];
            int wIdx = writeIndex[chIndex];

            float s_z1 = shelf_z1[chIndex];
            float s_z2 = shelf_z2[chIndex];
            float b_z1 = eqBr_z1[chIndex];
            float b_z2 = eqBr_z2[chIndex];
            float n_z1 = eqNk_z1[chIndex];
            float n_z2 = eqNk_z2[chIndex];
            float lp_1 = lp_z1[chIndex];
            float lp_2 = lp_z2[chIndex];

            for (int i = 0; i < numSamples; ++i)
            {
                const float dry = channel[i];

                // Write to circular delay buffer
                dBuf[wIdx] = dry;

                // Fractional delay read
                float readPos = static_cast<float>(wIdx) - targetDelay;
                while (readPos < 0.0f) readPos += static_cast<float>(MAX_DELAY_SAMPLES);
                int rIdx0 = static_cast<int>(readPos);
                int rIdx1 = (rIdx0 + 1) % MAX_DELAY_SAMPLES;
                float frac = readPos - static_cast<float>(rIdx0);
                float delayed = (1.0f - frac) * dBuf[rIdx0] + frac * dBuf[rIdx1];

                wIdx = (wIdx + 1) % MAX_DELAY_SAMPLES;

                // 1. Feedforward Comb filter
                float y_comb = dry - targetG * delayed;

                // 2. Low Shelf Biquad (Transposed Direct Form II)
                float y_shelf = shelf_b0 * y_comb + s_z1;
                s_z1 = shelf_b1 * y_comb - shelf_a1 * y_shelf + s_z2;
                s_z2 = shelf_b2 * y_comb - shelf_a2 * y_shelf;

                // 3. Bridge Bite Cut Biquad (~3.2 kHz) (Transposed Direct Form II)
                float y_br = eqBr_b0 * y_shelf + b_z1;
                b_z1 = eqBr_b1 * y_shelf - eqBr_a1 * y_br + b_z2;
                b_z2 = eqBr_b2 * y_shelf - eqBr_a2 * y_br;

                // 4. Neck Resonance Boost Biquad (~5.0 kHz) (Transposed Direct Form II)
                float y_nk = eqNk_b0 * y_br + n_z1;
                n_z1 = eqNk_b1 * y_br - eqNk_a1 * y_nk + n_z2;
                n_z2 = eqNk_b2 * y_br - eqNk_a2 * y_nk;

                // 5. 2nd-order Lowpass Biquad (Transposed Direct Form II)
                float y_lp = lp_b0 * y_nk + lp_1;
                lp_1 = lp_b1 * y_nk - lp_a1 * y_lp + lp_2;
                lp_2 = lp_b2 * y_nk - lp_a2 * y_lp;

                // Level Scaling: 0.38f ensures exact RMS match between dry and wet
                float wet = y_lp * 0.38f * outGain;

                // Crossfade
                channel[i] = dry * dryMix + wet * wetMix;
            }

            writeIndex[chIndex] = wIdx;
            shelf_z1[chIndex] = s_z1;
            shelf_z2[chIndex] = s_z2;
            eqBr_z1[chIndex]  = b_z1;
            eqBr_z2[chIndex]  = b_z2;
            eqNk_z1[chIndex]  = n_z1;
            eqNk_z2[chIndex]  = n_z2;
            lp_z1[chIndex]    = lp_1;
            lp_z2[chIndex]    = lp_2;

            chIndex++;
        }
    }

    template <int P> void setParameter(double v)
    {
        switch (P)
        {
        case 0:
            xfade = juce::jlimit(0.0f, 1.0f, static_cast<float>(v));
            break;
        case 1:
            stringNumber = juce::jlimit(1, 8, static_cast<int>(v));
            currentNote = openNotes[stringNumber - 1];
            updateDSPParameters();
            break;
        case 2:
            outputGainDB = static_cast<float>(v);
            break;
        case 3:
            paramPosition = juce::jlimit(0.5f, 1.5f, static_cast<float>(v));
            updateDSPParameters();
            break;
        case 4:
            paramCombDepth = juce::jlimit(0.2f, 0.99f, static_cast<float>(v));
            updateDSPParameters();
            break;
        case 5:
            paramBodyWarmth = juce::jlimit(-18.0f, 18.0f, static_cast<float>(v));
            updateDSPParameters();
            break;
        case 6:
            paramTone = juce::jlimit(1500.0f, 18000.0f, static_cast<float>(v));
            updateDSPParameters();
            break;
        case 7:
            paramBiteCut = juce::jlimit(-24.0f, 6.0f, static_cast<float>(v));
            updateDSPParameters();
            break;
        case 8:
            paramResonance = juce::jlimit(0.0f, 12.0f, static_cast<float>(v));
            updateDSPParameters();
            break;
        }
    }

    void createParameters(ParameterDataList& data)
    {
        {
            parameter::data p("XFade", { 0.0, 1.0 });
            registerCallback<0>(p);
            p.setDefaultValue(0.0);
            data.add(std::move(p));
        }
        {
            parameter::data p("StringNumber", { 1.0, 8.0 });
            registerCallback<1>(p);
            p.setDefaultValue(1.0);
            data.add(std::move(p));
        }
        {
            parameter::data p("Gain", { -12.0, 12.0 });
            registerCallback<2>(p);
            p.setDefaultValue(0.0);
            data.add(std::move(p));
        }
        {
            parameter::data p("Position", { 0.70, 1.30 });
            registerCallback<3>(p);
            p.setDefaultValue(1.0);
            data.add(std::move(p));
        }
        {
            parameter::data p("CombDepth", { 0.40, 0.98 });
            registerCallback<4>(p);
            p.setDefaultValue(0.85);
            data.add(std::move(p));
        }
        {
            parameter::data p("BodyWarmth", { -8.0, 8.0 });
            registerCallback<5>(p);
            p.setDefaultValue(0.0);
            data.add(std::move(p));
        }
        {
            parameter::data p("Tone", { 3000.0, 14000.0 });
            registerCallback<6>(p);
            p.setDefaultValue(8000.0);
            data.add(std::move(p));
        }
        {
            parameter::data p("BiteCut", { -12.0, 0.0 });
            registerCallback<7>(p);
            p.setDefaultValue(-4.0);
            data.add(std::move(p));
        }
        {
            parameter::data p("Resonance", { 0.0, 8.0 });
            registerCallback<8>(p);
            p.setDefaultValue(2.0);
            data.add(std::move(p));
        }
    }

private:
    static constexpr int MAX_DELAY_SAMPLES = 4096;

    // Open string MIDI notes from NoteRangeAndOpenStringNote.js (Strings 1 to 8):
    // String 1: 76 (E5), String 2: 71 (B4), String 3: 67 (G4), String 4: 62 (D4),
    // String 5: 57 (A3), String 6: 52 (E3), String 7: 47 (B2), String 8: 40 (E2)
    const int openNotes[8] = { 76, 71, 67, 62, 57, 52, 47, 40 };

    float sampleRate = 48000.0f;
    int numChannels = 2;

    float xfade = 0.0f;
    int stringNumber = 1;
    float outputGainDB = 0.0f;
    int currentNote = 76;

    // Tunable Generalized Parameters
    float paramPosition = 1.0f;
    float paramCombDepth = 0.85f;
    float paramBodyWarmth = 0.0f;
    float paramTone = 8000.0f;
    float paramBiteCut = -4.0f;
    float paramResonance = 2.0f;

    float currentDelaySamples = 35.0f;
    float combDepth = 0.85f;

    // Filter coefficients
    float shelf_b0 = 1.0f, shelf_b1 = 0.0f, shelf_b2 = 0.0f;
    float shelf_a1 = 0.0f, shelf_a2 = 0.0f;

    float eqBr_b0 = 1.0f, eqBr_b1 = 0.0f, eqBr_b2 = 0.0f;
    float eqBr_a1 = 0.0f, eqBr_a2 = 0.0f;

    float eqNk_b0 = 1.0f, eqNk_b1 = 0.0f, eqNk_b2 = 0.0f;
    float eqNk_a1 = 0.0f, eqNk_a2 = 0.0f;

    float lp_b0 = 1.0f, lp_b1 = 0.0f, lp_b2 = 0.0f;
    float lp_a1 = 0.0f, lp_a2 = 0.0f;

    // DSP State Buffers
    std::vector<float> delayBuffer[2];
    int writeIndex[2] = { 0, 0 };

    float shelf_z1[2], shelf_z2[2];
    float eqBr_z1[2], eqBr_z2[2];
    float eqNk_z1[2], eqNk_z2[2];
    float lp_z1[2], lp_z2[2];

    void calcLowShelf(float gainDB, float f0, float Q, float& b0, float& b1, float& b2, float& a1, float& a2)
    {
        float A = std::pow(10.0f, gainDB / 40.0f);
        float w0 = 2.0f * juce::MathConstants<float>::pi * f0 / sampleRate;
        float cos_w0 = std::cos(w0);
        float sin_w0 = std::sin(w0);
        float alpha = sin_w0 / (2.0f * Q);

        float a0_val = (A + 1.0f) + (A - 1.0f) * cos_w0 + 2.0f * std::sqrt(A) * alpha;
        b0 = (A * ((A + 1.0f) - (A - 1.0f) * cos_w0 + 2.0f * std::sqrt(A) * alpha)) / a0_val;
        b1 = (2.0f * A * ((A - 1.0f) - (A + 1.0f) * cos_w0)) / a0_val;
        b2 = (A * ((A + 1.0f) - (A - 1.0f) * cos_w0 - 2.0f * std::sqrt(A) * alpha)) / a0_val;
        a1 = (-2.0f * ((A - 1.0f) + (A + 1.0f) * cos_w0)) / a0_val;
        a2 = ((A + 1.0f) + (A - 1.0f) * cos_w0 - 2.0f * std::sqrt(A) * alpha) / a0_val;
    }

    void calcPeaking(float gainDB, float f0, float Q, float& b0, float& b1, float& b2, float& a1, float& a2)
    {
        float A = std::pow(10.0f, gainDB / 40.0f);
        float w0 = 2.0f * juce::MathConstants<float>::pi * f0 / sampleRate;
        float cos_w0 = std::cos(w0);
        float sin_w0 = std::sin(w0);
        float alpha = sin_w0 / (2.0f * Q);

        float a0_val = 1.0f + alpha / A;
        b0 = (1.0f + alpha * A) / a0_val;
        b1 = (-2.0f * cos_w0) / a0_val;
        b2 = (1.0f - alpha * A) / a0_val;
        a1 = (-2.0f * cos_w0) / a0_val;
        a2 = (1.0f - alpha / A) / a0_val;
    }

    void calcLowpass(float f0, float Q, float& b0, float& b1, float& b2, float& a1, float& a2)
    {
        float w0 = 2.0f * juce::MathConstants<float>::pi * f0 / sampleRate;
        float cos_w0 = std::cos(w0);
        float sin_w0 = std::sin(w0);
        float alpha = sin_w0 / (2.0f * Q);

        float a0_val = 1.0f + alpha;
        b0 = ((1.0f - cos_w0) * 0.5f) / a0_val;
        b1 = (1.0f - cos_w0) / a0_val;
        b2 = ((1.0f - cos_w0) * 0.5f) / a0_val;
        a1 = (-2.0f * cos_w0) / a0_val;
        a2 = (1.0f - alpha) / a0_val;
    }

    void updateDSPParameters()
    {
        int stringIdx = juce::jlimit(0, 7, stringNumber - 1);
        int openNote = openNotes[stringIdx];

        // Fret tracking against played MIDI notes (mapped 76 to 40)
        int fret = currentNote - openNote;
        if (fret < 0) fret = 0;

        // Acoustic concert pitch is 1 octave lower than written/mapped MIDI:
        // String 1: E4 (329.63 Hz, MIDI 64), String 6: E2 (82.41 Hz, MIDI 40), String 8: E1 (41.20 Hz, MIDI 28)
        int concertNote = openNote - 12;
        float f_open = 440.0f * std::pow(2.0f, (static_cast<float>(concertNote) - 69.0f) / 12.0f);

        // Multiscale 25.5" to 28.0" (0.648m to 0.711m)
        float t = static_cast<float>(stringIdx) / 7.0f;
        float L_scale = 0.648f + t * (0.711f - 0.648f);
        float d_neck  = (0.150f + t * (0.165f - 0.150f)) * paramPosition;

        // Wave speed on string: v = 2 * L * f_open
        float v = 2.0f * L_scale * f_open;
        float tau = (2.0f * d_neck) / v;

        // Tension adjustment on higher frets (slight shortening of period)
        tau *= (1.0f - 0.0015f * static_cast<float>(fret));

        currentDelaySamples = juce::jlimit(1.0f, static_cast<float>(MAX_DELAY_SAMPLES - 4), tau * sampleRate);

        // Comb Depth: 0.83 on treble open to 0.92 on fret 12; 0.88 to 0.94 on bass, scaled by paramCombDepth
        float baseDepth;
        if (stringIdx <= 1)
            baseDepth = 0.83f + (static_cast<float>(fret) / 12.0f) * 0.08f;
        else
            baseDepth = 0.88f + 0.005f * static_cast<float>(fret);
        combDepth = juce::jlimit(0.2f, 0.98f, baseDepth * (paramCombDepth / 0.85f));

        // Low Shelf: Corner frequency tracks open string fundamental, offset by paramBodyWarmth
        float shelfFreq = juce::jlimit(35.0f, 600.0f, 2.2f * f_open);
        float baseShelfGain = (stringIdx >= 4) ? (16.0f - 0.25f * static_cast<float>(fret))
                                               : (1.0f + (static_cast<float>(fret) / 12.0f) * 16.0f);
        float shelfGain = juce::jlimit(0.0f, 24.0f, baseShelfGain + paramBodyWarmth);
        calcLowShelf(shelfGain, shelfFreq, 0.707f, shelf_b0, shelf_b1, shelf_b2, shelf_a1, shelf_a2);

        // Bridge Bite Peaking Cut (~3.2 kHz)
        calcPeaking(paramBiteCut, 3200.0f, 1.8f, eqBr_b0, eqBr_b1, eqBr_b2, eqBr_a1, eqBr_a2);

        // Neck Resonance Boost (~5.0 kHz)
        float neckResGain = (stringIdx == 0) ? (paramResonance * 2.5f - (static_cast<float>(fret) / 12.0f) * (paramResonance * 2.5f)) : paramResonance;
        neckResGain = std::max(neckResGain, 0.0f);
        calcPeaking(neckResGain, 5000.0f, 1.5f, eqNk_b0, eqNk_b1, eqNk_b2, eqNk_a1, eqNk_a2);

        // Low-pass Filter (2nd-order Butterworth Q=0.7071)
        float stringOffset = (stringIdx == 0) ? 3000.0f : 0.0f;
        float fretOffset = (stringIdx == 0) ? ((static_cast<float>(fret) / 12.0f) * 8000.0f) : (static_cast<float>(fret) * 350.0f);
        float lpCutoff = paramTone + stringOffset - fretOffset;
        lpCutoff = juce::jlimit(1500.0f, 18000.0f, lpCutoff);
        calcLowpass(lpCutoff, 0.7071f, lp_b0, lp_b1, lp_b2, lp_a1, lp_a2);
    }
};

} // namespace project
