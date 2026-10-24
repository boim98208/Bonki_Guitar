#define RTNEURAL_USE_XSIMD 1
#define RTNEURAL_DEFAULT_ALIGNMENT 16

#include "src/dependencies/json/single_include/nlohmann/json.hpp"
#include "src/dependencies/RTNeural/RTNeural/RTNeural.h"
#include "src/dependencies/RTNeural-NAM/wavenet/wavenet_model.hpp"
#include "src/dependencies/math_approx/include/math_approx/math_approx.hpp"


// no resampling needed path (host SR matches model SR)
for (int s = 0; s < numSamples; ++s) {
    float sample = channelDataL[s];
    sample *= Decibels::decibelsToGain(inputGain);
    sample = m->forward(sample); // <-- this is the whole NAM inference
    sample *= Decibels::decibelsToGain(outputGain);
    channelDataL[s] = sample;
}
// copy L to R
std::memcpy(buffer.getWritePointer(1), buffer.getReadPointer(0), numSamples * sizeof(float));