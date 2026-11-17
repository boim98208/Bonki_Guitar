/**
 * LegatoData.js
 * 
 * Fine-tuned transit durations, seam crossfade windows, and Equal-Amplitude
 * Raised-Cosine lookup tables derived from the physical guitar recordings.
 * 
 * All transit durations, seam crossfade times, and sample offsets are
 * 100% hardcoded directly into the script (no JSON file loading required).
 */

namespace LegatoData
{
    // Hardcoded crossfade duration (in milliseconds)
    const var HARDCODED_CROSSFADE_MS = 5.0;
    const var DEFAULT_CROSSFADE_NORMAL_MS = HARDCODED_CROSSFADE_MS;
    const var DEFAULT_TRANSIT_MS = 22.0;
    
    // Upwards Legato Arrays (indexed by MIDI note number 0..127)
    const var transitDurationsUp = [];
    transitDurationsUp.reserve(128);
    
    const var sampleStartOffsetsUp = [];
    sampleStartOffsetsUp.reserve(128);
    
    const var sampleArrivalOffsetsUp = [];
    sampleArrivalOffsetsUp.reserve(128);

    // Downwards Legato Arrays (indexed by MIDI note number 0..127)
    const var transitDurationsDown = [];
    transitDurationsDown.reserve(128);
    
    const var sampleStartOffsetsDown = [];
    sampleStartOffsetsDown.reserve(128);
    
    const var sampleArrivalOffsetsDown = [];
    sampleArrivalOffsetsDown.reserve(128);
    
    // 1. Initialize arrays with base fallback values
    for (var idx = 0; idx < 128; idx++)
    {
        transitDurationsUp.push(DEFAULT_TRANSIT_MS);
        sampleStartOffsetsUp.push(0);
        sampleArrivalOffsetsUp.push(0);

        transitDurationsDown.push(DEFAULT_TRANSIT_MS);
        sampleStartOffsetsDown.push(0);
        sampleArrivalOffsetsDown.push(0);
    }
    
    // 2. Hardcoded Upward Slide Transit Times (measured from physical recordings)
    transitDurationsUp[41] = 47.33; // E1_F1
    transitDurationsUp[42] = 44.68; // F1_F#1
    transitDurationsUp[43] = 24.67; // F#1_G1
    transitDurationsUp[44] = 23.28; // G1_G#1
    transitDurationsUp[45] = 42.67; // G#1_A1
    transitDurationsUp[46] = 40.27; // A1_A#1
    transitDurationsUp[47] = 28.67; // A#1_B1
    transitDurationsUp[48] = 27.06; // B1_C2
    transitDurationsUp[49] = 21.33; // C2_C#2
    transitDurationsUp[50] = 20.14; // C#2_D2
    transitDurationsUp[51] = 30.67; // D2_D#2
    transitDurationsUp[52] = 28.95; // D#2_E2
    transitDurationsUp[53] = 18.67; // E2_F2
    transitDurationsUp[54] = 17.62; // F2_F#2
    transitDurationsUp[55] = 17.33; // F#2_G2
    transitDurationsUp[56] = 16.36; // G2_G#2
    transitDurationsUp[57] = 15.33; // G#2_A2
    transitDurationsUp[58] = 14.47; // A2_A#2
    transitDurationsUp[59] = 20.00; // A#2_B2
    transitDurationsUp[60] = 18.88; // B2_C3
    transitDurationsUp[61] = 20.67; // C3_C#3
    transitDurationsUp[62] = 19.51; // C#3_D3
    transitDurationsUp[63] = 15.33; // D3_D#3
    transitDurationsUp[64] = 14.47; // D#3_E3

    // 3. Hardcoded Upward Sample Alignment Offsets
    sampleStartOffsetsUp[41] = 33180; sampleArrivalOffsetsUp[41] = 35452; // E1_F1
    sampleStartOffsetsUp[42] = 31318; sampleArrivalOffsetsUp[42] = 33462; // F1_F#1
    sampleStartOffsetsUp[43] = 22677; sampleArrivalOffsetsUp[43] = 23861; // F#1_G1
    sampleStartOffsetsUp[44] = 21404; sampleArrivalOffsetsUp[44] = 22522; // G1_G#1
    sampleStartOffsetsUp[45] = 21924; sampleArrivalOffsetsUp[45] = 23972; // G#1_A1
    sampleStartOffsetsUp[46] = 20694; sampleArrivalOffsetsUp[46] = 22627; // A1_A#1
    sampleStartOffsetsUp[47] = 24455; sampleArrivalOffsetsUp[47] = 25831; // A#1_B1
    sampleStartOffsetsUp[48] = 23082; sampleArrivalOffsetsUp[48] = 24381; // B1_C2
    sampleStartOffsetsUp[49] = 17754; sampleArrivalOffsetsUp[49] = 18778; // C2_C#2
    sampleStartOffsetsUp[50] = 16758; sampleArrivalOffsetsUp[50] = 17724; // C#2_D2
    sampleStartOffsetsUp[51] = 18013; sampleArrivalOffsetsUp[51] = 19485; // D2_D#2
    sampleStartOffsetsUp[52] = 17002; sampleArrivalOffsetsUp[52] = 18391; // D#2_E2
    sampleStartOffsetsUp[53] = 20174; sampleArrivalOffsetsUp[53] = 21070; // E2_F2
    sampleStartOffsetsUp[54] = 19042; sampleArrivalOffsetsUp[54] = 19887; // F2_F#2
    sampleStartOffsetsUp[55] = 14443; sampleArrivalOffsetsUp[55] = 15275; // F#2_G2
    sampleStartOffsetsUp[56] = 13632; sampleArrivalOffsetsUp[56] = 14418; // G2_G#2
    sampleStartOffsetsUp[57] = 18514; sampleArrivalOffsetsUp[57] = 19250; // G#2_A2
    sampleStartOffsetsUp[58] = 17475; sampleArrivalOffsetsUp[58] = 18170; // A2_A#2
    sampleStartOffsetsUp[59] = 14659; sampleArrivalOffsetsUp[59] = 15619; // A#2_B2
    sampleStartOffsetsUp[60] = 13836; sampleArrivalOffsetsUp[60] = 14742; // B2_C3
    sampleStartOffsetsUp[61] = 19741; sampleArrivalOffsetsUp[61] = 20733; // C3_C#3
    sampleStartOffsetsUp[62] = 18633; sampleArrivalOffsetsUp[62] = 19569; // C#3_D3
    sampleStartOffsetsUp[63] = 16831; sampleArrivalOffsetsUp[63] = 17567; // D3_D#3
    sampleStartOffsetsUp[64] = 15886; sampleArrivalOffsetsUp[64] = 16581; // D#3_E3

    // 4. Hardcoded Downward Slide Transit Times (measured from physical recordings)
    transitDurationsDown[41] = 45.20; // F1_E1
    transitDurationsDown[42] = 42.67; // F#1_F1
    transitDurationsDown[43] = 35.32; // G1_F#1
    transitDurationsDown[44] = 33.33; // G#1_G1
    transitDurationsDown[45] = 36.02; // A1_G#1
    transitDurationsDown[46] = 34.00; // A#1_A1
    transitDurationsDown[47] = 33.90; // B1_A#1
    transitDurationsDown[48] = 32.00; // C2_B1
    transitDurationsDown[49] = 28.96; // C#2_C2
    transitDurationsDown[50] = 27.33; // D2_C#2
    transitDurationsDown[51] = 18.36; // D#2_D2
    transitDurationsDown[52] = 17.33; // E2_D#2
    transitDurationsDown[53] = 31.08; // F2_E2
    transitDurationsDown[54] = 29.33; // F#2_F2
    transitDurationsDown[55] = 46.62; // G2_F#2
    transitDurationsDown[56] = 44.00; // G#2_G2
    transitDurationsDown[57] = 34.61; // A2_G#2
    transitDurationsDown[58] = 32.67; // A#2_A2
    transitDurationsDown[59] = 16.95; // B2_A#2
    transitDurationsDown[60] = 16.00; // C3_B2
    transitDurationsDown[61] = 22.60; // C#3_C3
    transitDurationsDown[62] = 21.33; // D3_C#3
    transitDurationsDown[63] = 18.36; // D#3_D3
    transitDurationsDown[64] = 17.33; // E3_D#3

    // 5. Hardcoded Downward Sample Alignment Offsets
    sampleStartOffsetsDown[41] = 14229; sampleArrivalOffsetsDown[41] = 16398; // F1_E1
    sampleStartOffsetsDown[42] = 13430; sampleArrivalOffsetsDown[42] = 15478; // F#1_F1
    sampleStartOffsetsDown[43] = 14911; sampleArrivalOffsetsDown[43] = 16606; // G1_F#1
    sampleStartOffsetsDown[44] = 14074; sampleArrivalOffsetsDown[44] = 15674; // G#1_G1
    sampleStartOffsetsDown[45] = 14192; sampleArrivalOffsetsDown[45] = 15921; // A1_G#1
    sampleStartOffsetsDown[46] = 13395; sampleArrivalOffsetsDown[46] = 15027; // A#1_A1
    sampleStartOffsetsDown[47] = 14916; sampleArrivalOffsetsDown[47] = 16544; // B1_A#1
    sampleStartOffsetsDown[48] = 14079; sampleArrivalOffsetsDown[48] = 15615; // C2_B1
    sampleStartOffsetsDown[49] = 12741; sampleArrivalOffsetsDown[49] = 14131; // C#2_C2
    sampleStartOffsetsDown[50] = 12026; sampleArrivalOffsetsDown[50] = 13338; // D2_C#2
    sampleStartOffsetsDown[51] = 20143; sampleArrivalOffsetsDown[51] = 21024; // D#2_D2
    sampleStartOffsetsDown[52] = 19012; sampleArrivalOffsetsDown[52] = 19844; // E2_D#2
    sampleStartOffsetsDown[53] = 12640; sampleArrivalOffsetsDown[53] = 14132; // F2_E2
    sampleStartOffsetsDown[54] = 11931; sampleArrivalOffsetsDown[54] = 13339; // F#2_F2
    sampleStartOffsetsDown[55] = 12100; sampleArrivalOffsetsDown[55] = 14338; // G2_F#2
    sampleStartOffsetsDown[56] = 11421; sampleArrivalOffsetsDown[56] = 13533; // G#2_G2
    sampleStartOffsetsDown[57] = 9639; sampleArrivalOffsetsDown[57] = 11300; // A2_G#2
    sampleStartOffsetsDown[58] = 9098; sampleArrivalOffsetsDown[58] = 10666; // A#2_A2
    sampleStartOffsetsDown[59] = 9560; sampleArrivalOffsetsDown[59] = 10373; // B2_A#2
    sampleStartOffsetsDown[60] = 9023; sampleArrivalOffsetsDown[60] = 9791; // C3_B2
    sampleStartOffsetsDown[61] = 17389; sampleArrivalOffsetsDown[61] = 18474; // C#3_C3
    sampleStartOffsetsDown[62] = 16413; sampleArrivalOffsetsDown[62] = 17437; // D3_C#3
    sampleStartOffsetsDown[63] = 10376; sampleArrivalOffsetsDown[63] = 11258; // D#3_D3
    sampleStartOffsetsDown[64] = 9794; sampleArrivalOffsetsDown[64] = 10626; // E3_D#3

    // Backwards-compatible aliases pointing to active upward arrays
    const var transitDurations = transitDurationsUp;
    const var sampleStartOffsets = sampleStartOffsetsUp;
    const var sampleArrivalOffsets = sampleArrivalOffsetsUp;

    // Equal-Amplitude Raised-Cosine (Hann) Crossfade Tables (21 steps, t = 0.0 to 1.0)
    // Identity: w_out(t) + w_in(t) == 1.0
    const var rcFadeOutDB = [
         0.00,  -0.05,  -0.22,  -0.49,  -0.87, 
        -1.38,  -2.00,  -2.77,  -3.68,  -4.76, 
        -6.02,  -7.50,  -9.23, -11.28, -13.72, 
       -16.69, -20.40, -25.27, -32.23, -44.21, -100.00
    ];

    const var rcFadeInDB = [
      -100.00, -44.21, -32.23, -25.27, -20.40, 
       -16.69, -13.72, -11.28,  -9.23,  -7.50, 
        -6.02,  -4.76,  -3.68,  -2.77,  -2.00, 
        -1.38,  -0.87,  -0.49,  -0.22,  -0.05,    0.00
    ];

    // Status helpers
    inline function isJsonLoaded()
    {
        return true;
    }

    inline function isUpJsonLoaded()
    {
        return true;
    }

    inline function isDownJsonLoaded()
    {
        return true;
    }

    // Upward Getters
    inline function getTransitDurationMS(noteNumber)
    {
        if (noteNumber >= 41 && noteNumber <= 64)
            return transitDurationsUp[noteNumber];
        return DEFAULT_TRANSIT_MS;
    }
    
    inline function getCrossfadeMS(noteNumber, velocity)
    {
        return HARDCODED_CROSSFADE_MS;
    }
    
    inline function getSampleStartOffset(noteNumber)
    {
        if (noteNumber >= 41 && noteNumber <= 64)
            return sampleStartOffsetsUp[noteNumber];
        return 0;
    }
    
    inline function getSampleArrivalOffset(noteNumber)
    {
        if (noteNumber >= 41 && noteNumber <= 64)
            return sampleArrivalOffsetsUp[noteNumber];
        return 0;
    }

    // Downward Getters
    inline function getDownTransitDurationMS(noteNumber)
    {
        if (noteNumber >= 41 && noteNumber <= 64)
            return transitDurationsDown[noteNumber];
        return DEFAULT_TRANSIT_MS;
    }
    
    inline function getDownCrossfadeMS(noteNumber, velocity)
    {
        return HARDCODED_CROSSFADE_MS;
    }

    inline function getDownSampleStartOffset(noteNumber)
    {
        if (noteNumber >= 41 && noteNumber <= 64)
            return sampleStartOffsetsDown[noteNumber];
        return 0;
    }
    
    inline function getDownSampleArrivalOffset(noteNumber)
    {
        if (noteNumber >= 41 && noteNumber <= 64)
            return sampleArrivalOffsetsDown[noteNumber];
        return 0;
    }
}
