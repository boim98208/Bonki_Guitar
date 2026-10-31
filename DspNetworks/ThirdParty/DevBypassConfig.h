#pragma once

/**
 * ==============================================================================
 * DevBypassConfig.h
 *
 * Controls zero-CPU audio bypass for heavy DSP effects during HISE UI editing.
 * When set to 1:
 *  - Audio passes through untouched (0% CPU, preventing HISE freezes/crashes).
 *  - Knobs, sliders, GUI components, and parameter callbacks remain 100% active.
 *
 * Set to 0 when testing full sound or compiling the final production VST3.
 * ==============================================================================
 */

#define DEV_BYPASS_AMP          0  // NAM Neural Net, Oversampling, Tone Stack (ACTIVE)
#define DEV_BYPASS_CAB_DESIGNER 0  // Cabinet Designer IRs (ACTIVE)
#define DEV_BYPASS_REVERB       0  // Algorithmic Reverb (ACTIVE)
#define DEV_BYPASS_CHORUS       0  // Chorus (ACTIVE)
#define DEV_BYPASS_DELAY        0  // Delay (ACTIVE)
#define DEV_BYPASS_OVERDRIVE    0  // Overdrive / Distortion (ACTIVE)
#define DEV_BYPASS_CLIPPER      0  // Clipper (ACTIVE)
#define DEV_BYPASS_RINGMOD      0  // Ring Modulator (ACTIVE)
