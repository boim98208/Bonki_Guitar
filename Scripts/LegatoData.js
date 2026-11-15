/**
 * LegatoData.js
 * 
 * Fine-tuned transit durations, seam crossfade windows, and Equal-Amplitude
 * Raised-Cosine lookup tables dynamically loaded from split JSON files:
 * - 'half_spread_up_metadata.json' (upward legato)
 * - 'half_spread_down_metadata.json' (downward legato)
 */

namespace LegatoData
{
    reg isUpLoaded = false;
    reg isDownLoaded = false;
    
    // Base fallback defaults (used if JSON is missing or for notes outside anchor range)
    const var DEFAULT_TRANSIT_MS = 22.0;
    const var DEFAULT_CROSSFADE_NORMAL_MS = 5.0;
    const var DEFAULT_CROSSFADE_SLOW_MS = 8.0;
    const var DEFAULT_CROSSFADE_FAST_MS = 5.0;
    
    // Upwards Legato Arrays (indexed by MIDI note number 0..127)
    const var transitDurationsUp = [];
    transitDurationsUp.reserve(128);
    
    const var crossfadeNormalUp = [];
    crossfadeNormalUp.reserve(128);
    
    const var crossfadeSlowUp = [];
    crossfadeSlowUp.reserve(128);
    
    const var crossfadeFastUp = [];
    crossfadeFastUp.reserve(128);
    
    const var sampleStartOffsetsUp = [];
    sampleStartOffsetsUp.reserve(128);
    
    const var sampleArrivalOffsetsUp = [];
    sampleArrivalOffsetsUp.reserve(128);

    // Downwards Legato Arrays (indexed by MIDI note number 0..127)
    const var transitDurationsDown = [];
    transitDurationsDown.reserve(128);
    
    const var crossfadeNormalDown = [];
    crossfadeNormalDown.reserve(128);
    
    const var crossfadeSlowDown = [];
    crossfadeSlowDown.reserve(128);
    
    const var crossfadeFastDown = [];
    crossfadeFastDown.reserve(128);
    
    const var sampleStartOffsetsDown = [];
    sampleStartOffsetsDown.reserve(128);
    
    const var sampleArrivalOffsetsDown = [];
    sampleArrivalOffsetsDown.reserve(128);
    
    // Pre-fill arrays with safe default fallback values
    for (var idx = 0; idx < 128; idx++)
    {
        transitDurationsUp.push(DEFAULT_TRANSIT_MS);
        crossfadeNormalUp.push(DEFAULT_CROSSFADE_NORMAL_MS);
        crossfadeSlowUp.push(DEFAULT_CROSSFADE_SLOW_MS);
        crossfadeFastUp.push(DEFAULT_CROSSFADE_FAST_MS);
        sampleStartOffsetsUp.push(0);
        sampleArrivalOffsetsUp.push(0);

        transitDurationsDown.push(DEFAULT_TRANSIT_MS);
        crossfadeNormalDown.push(DEFAULT_CROSSFADE_NORMAL_MS);
        crossfadeSlowDown.push(DEFAULT_CROSSFADE_SLOW_MS);
        crossfadeFastDown.push(DEFAULT_CROSSFADE_FAST_MS);
        sampleStartOffsetsDown.push(0);
        sampleArrivalOffsetsDown.push(0);
    }
    
    // Backwards-compatible aliases pointing to active upward arrays
    const var transitDurations = transitDurationsUp;
    const var crossfadeNormal = crossfadeNormalUp;
    const var crossfadeSlow = crossfadeSlowUp;
    const var crossfadeFast = crossfadeFastUp;
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
    
    // Upward anchor keys matching MIDI notes 41..64
    const var upAnchorKeys = [
        "", "", "", "", "", "", "", "", "", "", // 0-9
        "", "", "", "", "", "", "", "", "", "", // 10-19
        "", "", "", "", "", "", "", "", "", "", // 20-29
        "", "", "", "", "", "", "", "", "", "", // 30-39
        "",                                      // 40
        "E1_F1",   // 41
        "F1_F#1",  // 42
        "F#1_G1",  // 43
        "G1_G#1",  // 44
        "G#1_A1",  // 45
        "A1_A#1",  // 46
        "A#1_B1",  // 47
        "B1_C2",   // 48
        "C2_C#2",  // 49
        "C#2_D2",  // 50
        "D2_D#2",  // 51
        "D#2_E2",  // 52
        "E2_F2",   // 53
        "F2_F#2",  // 54
        "F#2_G2",  // 55
        "G2_G#2",  // 56
        "G#2_A2",  // 57
        "A2_A#2",  // 58
        "A#2_B2",  // 59
        "B2_C3",   // 60
        "C3_C#3",  // 61
        "C#3_D3",  // 62
        "D3_D#3",  // 63
        "D#3_E3"   // 64
    ];

    // Downward anchor keys matching MIDI notes 41..64
    const var downAnchorKeys = [
        "", "", "", "", "", "", "", "", "", "", // 0-9
        "", "", "", "", "", "", "", "", "", "", // 10-19
        "", "", "", "", "", "", "", "", "", "", // 20-29
        "", "", "", "", "", "", "", "", "", "", // 30-39
        "",                                      // 40
        "F1_E1",   // 41
        "F#1_F1",  // 42
        "G1_F#1",  // 43
        "G#1_G1",  // 44
        "A1_G#1",  // 45
        "A#1_A1",  // 46
        "B1_A#1",  // 47
        "C2_B1",   // 48
        "C#2_C2",  // 49
        "D2_C#2",  // 50
        "D#2_D2",  // 51
        "E2_D#2",  // 52
        "F2_E2",   // 53
        "F#2_F2",  // 54
        "G2_F#2",  // 55
        "G#2_G2",  // 56
        "A2_G#2",  // 57
        "A#2_A2",  // 58
        "B2_A#2",  // 59
        "C3_B2",   // 60
        "C#3_C3",  // 61
        "D3_C#3",  // 62
        "D#3_D3",  // 63
        "E3_D#3"   // 64
    ];

    /**
     * Resolves and parses a JSON file using HISE project and absolute path resolvers.
     */
    function resolveJsonFile(fileName)
    {
        var data = undefined;
        
        // 1. Try {PROJECT_FOLDER}/Scripts/fileName
        data = Engine.loadFromJSON("{PROJECT_FOLDER}/Scripts/" + fileName);
        if (isDefined(data)) return data;
        
        // 2. Try {PROJECT_FOLDER}Scripts/fileName
        data = Engine.loadFromJSON("{PROJECT_FOLDER}Scripts/" + fileName);
        if (isDefined(data)) return data;
        
        // 3. Try {PROJECT_FOLDER}/fileName
        data = Engine.loadFromJSON("{PROJECT_FOLDER}/" + fileName);
        if (isDefined(data)) return data;
        
        // 4. Try FileSystem absolute path in project Scripts
        var f1 = FileSystem.fromAbsolutePath("C:/Users/Ibrahim Rasyid/Documents/HISE Projects/Bonki_Guitar/Scripts/" + fileName);
        if (f1.isFile())
        {
            data = f1.loadAsObject();
            if (isDefined(data)) return data;
        }
        
        // 5. Try FileSystem absolute path in Export directory
        var f2 = FileSystem.fromAbsolutePath("C:/Users/Ibrahim Rasyid/Documents/HISE Projects DSP Help/Export/" + fileName);
        if (f2.isFile())
        {
            data = f2.loadAsObject();
            if (isDefined(data)) return data;
        }
        
        // 6. Try direct relative fileName
        data = Engine.loadFromJSON(fileName);
        if (isDefined(data)) return data;
        
        return undefined;
    }

    /**
     * Loads upward legato metadata from JSON, filling the arrays from MIDI 1 up to 127.
     */
    function loadMetadataUp(transitDurations, crossfadeNormal, crossfadeSlow, crossfadeFast, sampleStartOffsets, sampleArrivalOffsets, fileName)
    {
        var data = resolveJsonFile(fileName);
        if (!isDefined(data))
        {
            Console.print("[LegatoData] Notice: Upwards JSON file not loaded: " + fileName + ". Using default fallback values.");
            return false;
        }
        
        var anchors = undefined;
        if (isDefined(data.up_anchors))
            anchors = data.up_anchors;
        else if (isDefined(data.anchors))
            anchors = data.anchors;
            
        if (!isDefined(anchors))
        {
            Console.print("[LegatoData] Notice: No upward anchors found in " + fileName);
            return false;
        }
        
        var n = 0;
        var key = "";
        var anchor = undefined;
        
        // Fill the array all the way up from 1 to 127
        for (n = 1; n <= 127; n++)
        {
            if (n >= 41 && n <= 64)
            {
                key = upAnchorKeys[n];
                if (key != "" && isDefined(anchors[key]))
                {
                    anchor = anchors[key];
                    if (isDefined(anchor.dur_ms))
                        transitDurations[n] = anchor.dur_ms;
                    if (isDefined(anchor.crossfade_ms_normal))
                        crossfadeNormal[n] = anchor.crossfade_ms_normal;
                    if (isDefined(anchor.crossfade_ms_slow))
                        crossfadeSlow[n] = anchor.crossfade_ms_slow;
                    if (isDefined(anchor.crossfade_ms_fast))
                        crossfadeFast[n] = anchor.crossfade_ms_fast;
                    if (isDefined(anchor.sample_start_offset))
                        sampleStartOffsets[n] = anchor.sample_start_offset;
                    if (isDefined(anchor.sample_arrival_offset))
                        sampleArrivalOffsets[n] = anchor.sample_arrival_offset;
                }
            }
        }
        
        Console.print("[LegatoData] Successfully loaded upwards metadata from " + fileName);
        return true;
    }

    /**
     * Loads downward legato metadata from JSON, filling the arrays from MIDI 127 down to 1.
     */
    function loadMetadataDown(transitDurations, crossfadeNormal, crossfadeSlow, crossfadeFast, sampleStartOffsets, sampleArrivalOffsets, fileName)
    {
        var data = resolveJsonFile(fileName);
        if (!isDefined(data))
        {
            Console.print("[LegatoData] Notice: Downwards JSON file not loaded: " + fileName + ". Using default fallback values.");
            return false;
        }
        
        var anchors = undefined;
        if (isDefined(data.down_anchors))
            anchors = data.down_anchors;
        else if (isDefined(data.anchors))
            anchors = data.anchors;
            
        if (!isDefined(anchors))
        {
            Console.print("[LegatoData] Notice: No downward anchors found in " + fileName);
            return false;
        }
        
        var n = 0;
        var key = "";
        var anchor = undefined;
        
        // Fill the array all the way down from 127 down to 1
        for (n = 127; n >= 1; n--)
        {
            if (n >= 41 && n <= 64)
            {
                key = downAnchorKeys[n];
                if (key != "" && isDefined(anchors[key]))
                {
                    anchor = anchors[key];
                    if (isDefined(anchor.dur_ms))
                        transitDurations[n] = anchor.dur_ms;
                    if (isDefined(anchor.crossfade_ms_normal))
                        crossfadeNormal[n] = anchor.crossfade_ms_normal;
                    if (isDefined(anchor.crossfade_ms_slow))
                        crossfadeSlow[n] = anchor.crossfade_ms_slow;
                    if (isDefined(anchor.crossfade_ms_fast))
                        crossfadeFast[n] = anchor.crossfade_ms_fast;
                    if (isDefined(anchor.sample_start_offset))
                        sampleStartOffsets[n] = anchor.sample_start_offset;
                    if (isDefined(anchor.sample_arrival_offset))
                        sampleArrivalOffsets[n] = anchor.sample_arrival_offset;
                }
            }
        }
        
        Console.print("[LegatoData] Successfully loaded downwards metadata from " + fileName);
        return true;
    }

    // Aliases
    function loadUpMetadata(transitDurations, crossfadeNormal, crossfadeSlow, crossfadeFast, sampleStartOffsets, sampleArrivalOffsets, fileName)
    {
        return loadMetadataUp(transitDurations, crossfadeNormal, crossfadeSlow, crossfadeFast, sampleStartOffsets, sampleArrivalOffsets, fileName);
    }
    
    function loadDownMetadata(transitDurations, crossfadeNormal, crossfadeSlow, crossfadeFast, sampleStartOffsets, sampleArrivalOffsets, fileName)
    {
        return loadMetadataDown(transitDurations, crossfadeNormal, crossfadeSlow, crossfadeFast, sampleStartOffsets, sampleArrivalOffsets, fileName);
    }

    function loadMetadata(transitDurations, crossfadeNormal, crossfadeSlow, crossfadeFast, sampleStartOffsets, sampleArrivalOffsets, fileName)
    {
        return loadMetadataUp(transitDurations, crossfadeNormal, crossfadeSlow, crossfadeFast, sampleStartOffsets, sampleArrivalOffsets, fileName);
    }

    // Initialize both upward and downward datasets from the split JSON files
    isUpLoaded = loadMetadataUp(transitDurationsUp, crossfadeNormalUp, crossfadeSlowUp, crossfadeFastUp, sampleStartOffsetsUp, sampleArrivalOffsetsUp, "half_spread_up_metadata.json");
    isDownLoaded = loadMetadataDown(transitDurationsDown, crossfadeNormalDown, crossfadeSlowDown, crossfadeFastDown, sampleStartOffsetsDown, sampleArrivalOffsetsDown, "half_spread_down_metadata.json");

    inline function isJsonLoaded()
    {
        return isUpLoaded;
    }

    inline function isUpJsonLoaded()
    {
        return isUpLoaded;
    }

    inline function isDownJsonLoaded()
    {
        return isDownLoaded;
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
        if (noteNumber >= 41 && noteNumber <= 64)
        {
            if (isUpLoaded)
            {
                if (velocity < 64)
                {
                    return crossfadeSlowUp[noteNumber] + (velocity - 1) * (crossfadeNormalUp[noteNumber] - crossfadeSlowUp[noteNumber]) / 63.0;
                }
                else
                {
                    return crossfadeNormalUp[noteNumber] + (velocity - 64) * (crossfadeFastUp[noteNumber] - crossfadeNormalUp[noteNumber]) / 63.0;
                }
            }
        }
        return DEFAULT_CROSSFADE_NORMAL_MS;
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
        if (noteNumber >= 41 && noteNumber <= 64)
        {
            if (isDownLoaded)
            {
                if (velocity < 64)
                {
                    return crossfadeSlowDown[noteNumber] + (velocity - 1) * (crossfadeNormalDown[noteNumber] - crossfadeSlowDown[noteNumber]) / 63.0;
                }
                else
                {
                    return crossfadeNormalDown[noteNumber] + (velocity - 64) * (crossfadeFastDown[noteNumber] - crossfadeNormalDown[noteNumber]) / 63.0;
                }
            }
        }
        return DEFAULT_CROSSFADE_NORMAL_MS;
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
