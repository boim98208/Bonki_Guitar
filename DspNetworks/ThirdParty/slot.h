/*
    Modular FX Slot for Chonki
    Allows any effect to be dynamically routed in any slot in the chain.
    0 = Empty (zero CPU pass-through)
    1 = Overdrive
    2 = Amp
    3 = Cab
    4 = Reverb
    5 = Delay
    6 = Chorus
    7 = Ringmod
*/

#pragma once
#include <JuceHeader.h>

#include "overdrive.h"
#include "amp.h"
#include "reverb.h"
#include "delay.h"
#include "chorus.h"
#include "ringmod.h"
#include "cab.h"

namespace project
{
using namespace juce;
using namespace hise;
using namespace scriptnode;

template <int NV> struct slot: public data::base
{
    SNEX_NODE(slot);

    struct MetadataClass
    {
        SN_NODE_ID("slot");
    };

    static constexpr bool isModNode() { return false; };
    static constexpr bool isPolyphonic() { return NV > 1; };
    static constexpr bool hasTail() { return true; };
    static constexpr bool isSuspendedOnSilence() { return false; };
    static constexpr int getFixChannelAmount() { return 2; };
    static constexpr int NumTables = 0;
    static constexpr int NumSliderPacks = 0;
    static constexpr int NumAudioFiles = 2;
    static constexpr int NumFilters = 0;
    static constexpr int NumDisplayBuffers = 0;

    int handleModulation(double& value) { return 0; }
    template <typename T> void processFrame(T& data) {}
    void handleHiseEvent(HiseEvent& e) {}

    void setExternalData(const ExternalData& data, int index)
    {
        cabNode.setExternalData(data, index);
    }

    void connectToRuntimeTarget(bool add, const runtime_target::connection& c)
    {
        ampNode.connectToRuntimeTarget(add, c);
        dlyNode.connectToRuntimeTarget(add, c);
        rmNode.connectToRuntimeTarget(add, c);
    }

    void prepare(PrepareSpecs specs)
    {
        od.prepare(specs);
        ampNode.prepare(specs);
        cabNode.prepare(specs);
        revNode.prepare(specs);
        dlyNode.prepare(specs);
        choNode.prepare(specs);
        rmNode.prepare(specs);
    }

    void reset()
    {
        od.reset();
        ampNode.reset();
        cabNode.reset();
        revNode.reset();
        dlyNode.reset();
        choNode.reset();
        rmNode.reset();
    }

    template <typename ProcessDataType>
    void process(ProcessDataType& data)
    {
        switch (activeModule)
        {
        case 1: od.process(data); break;
        case 2: ampNode.process(data); break;
        case 3: cabNode.process(data); break;
        case 4: revNode.process(data); break;
        case 5: dlyNode.process(data); break;
        case 6: choNode.process(data); break;
        case 7: rmNode.process(data); break;
        default: break; // 0 = Empty, pass-through (0 CPU)
        }
    }

    template <int P> void setParameter(double v)
    {
        switch (P)
        {
        case 0: activeModule = static_cast<int>(v); break;

        // Overdrive (1..10)
        case 1: od.template setParameter<0>(v); break;  // Mode
        case 2: od.template setParameter<2>(v); break;  // Drive
        case 3: od.template setParameter<11>(v); break; // Tone
        case 4: od.template setParameter<9>(v); break;  // FoldAmount
        case 5: od.template setParameter<7>(v); break;  // Bits
        case 6: od.template setParameter<8>(v); break;  // SRReduction
        case 7: od.template setParameter<3>(v); break;  // CircuitBend
        case 8: od.template setParameter<6>(v); break;  // Mix
        case 9: od.template setParameter<5>(v); break;  // OutputGain
        case 10: od.template setParameter<12>(v); break; // Mono

        // Amp (11..22)
        case 11: ampNode.template setParameter<0>(v); break;  // Mode
        case 12: ampNode.template setParameter<2>(v); break;  // InputGain
        case 13: ampNode.template setParameter<3>(v); break;  // Low
        case 14: ampNode.template setParameter<4>(v); break;  // Mid
        case 15: ampNode.template setParameter<5>(v); break;  // High
        case 16: ampNode.template setParameter<6>(v); break;  // Presence
        case 17: ampNode.template setParameter<7>(v); break;  // OutputGain
        case 18: ampNode.template setParameter<15>(v); break; // Slim
        case 19: ampNode.template setParameter<9>(v); break;  // CleanToneStackMode
        case 20: ampNode.template setParameter<10>(v); break; // DirtyToneStackMode
        case 21: ampNode.template setParameter<8>(v); break;  // DistortionMode
        case 22: ampNode.template setParameter<14>(v); break; // Mono

        // Cab (23..34)
        case 23: cabNode.template setParameter<0>(v); break;  // Mix
        case 24: cabNode.template setParameter<7>(v); break;  // CabAGain
        case 25: cabNode.template setParameter<6>(v); break;  // CabAPan
        case 26: cabNode.template setParameter<3>(v); break;  // CabAAxis
        case 27: cabNode.template setParameter<4>(v); break;  // CabADistance
        case 28: cabNode.template setParameter<2>(v); break;  // CabADelay
        case 29: cabNode.template setParameter<14>(v); break; // CabBGain
        case 30: cabNode.template setParameter<13>(v); break; // CabBPan
        case 31: cabNode.template setParameter<10>(v); break; // CabBAxis
        case 32: cabNode.template setParameter<11>(v); break; // CabBDistance
        case 33: cabNode.template setParameter<9>(v); break;  // CabBDelay
        case 34: cabNode.template setParameter<15>(v); break; // CabDesignerBypass

        // Reverb (35..41)
        case 35: revNode.template setParameter<6>(v); break; // ReverbMode
        case 36: revNode.template setParameter<0>(v); break; // Mix
        case 37: revNode.template setParameter<1>(v); break; // PreDelay
        case 38: revNode.template setParameter<2>(v); break; // RoomSize
        case 39: revNode.template setParameter<3>(v); break; // Decay
        case 40: revNode.template setParameter<4>(v); break; // DampingFrequency
        case 41: revNode.template setParameter<5>(v); break; // ChorusDepth

        // Delay (42..48)
        case 42: dlyNode.template setParameter<7>(v); break; // DelayMode
        case 43: dlyNode.template setParameter<0>(v); break; // Mix
        case 44: dlyNode.template setParameter<1>(v); break; // DelayTime
        case 45: dlyNode.template setParameter<2>(v); break; // Feedback
        case 46: dlyNode.template setParameter<3>(v); break; // Damping
        case 47: dlyNode.template setParameter<4>(v); break; // Modulation
        case 48: dlyNode.template setParameter<5>(v); break; // StereoWidth

        // Chorus (49..55)
        case 49: choNode.template setParameter<0>(v); break; // Mix
        case 50: choNode.template setParameter<7>(v); break; // Voices
        case 51: choNode.template setParameter<1>(v); break; // Rate
        case 52: choNode.template setParameter<2>(v); break; // Depth
        case 53: choNode.template setParameter<3>(v); break; // Feedback
        case 54: choNode.template setParameter<4>(v); break; // DelayTime
        case 55: choNode.template setParameter<6>(v); break; // Tone

        // Ringmod (56..62)
        case 56: rmNode.template setParameter<3>(v); break; // Mode
        case 57: rmNode.template setParameter<0>(v); break; // Mix
        case 58: rmNode.template setParameter<1>(v); break; // Frequency
        case 59: rmNode.template setParameter<2>(v); break; // Depth
        case 60: rmNode.template setParameter<4>(v); break; // LFORate
        case 61: rmNode.template setParameter<6>(v); break; // LFODepth
        case 62: rmNode.template setParameter<7>(v); break; // FilterFrequency
        }
    }

    void createParameters(ParameterDataList& data)
    {
        {
            parameter::data p("Module", { 0.0, 7.0 });
            registerCallback<0>(p);
            p.setDefaultValue(0.0);
            data.add(std::move(p));
        }

        // Overdrive
        {
            parameter::data p("ODMode", { 0.0, 5.0 });
            registerCallback<1>(p);
            p.setDefaultValue(0.0);
            data.add(std::move(p));
        }
        {
            parameter::data p("ODDrive", { 0.1, 20.0 });
            registerCallback<2>(p);
            p.setDefaultValue(5.0);
            data.add(std::move(p));
        }
        {
            parameter::data p("ODTone", { -1.0, 1.0 });
            registerCallback<3>(p);
            p.setDefaultValue(0.0);
            data.add(std::move(p));
        }
        {
            parameter::data p("ODFoldAmount", { 1.0, 8.0 });
            registerCallback<4>(p);
            p.setDefaultValue(2.0);
            data.add(std::move(p));
        }
        {
            parameter::data p("ODBits", { 1.0, 16.0 });
            registerCallback<5>(p);
            p.setDefaultValue(16.0);
            data.add(std::move(p));
        }
        {
            parameter::data p("ODSRReduction", { 1.0, 32.0 });
            registerCallback<6>(p);
            p.setDefaultValue(1.0);
            data.add(std::move(p));
        }
        {
            parameter::data p("ODCircuitBend", { -48.0, 48.0 });
            registerCallback<7>(p);
            p.setDefaultValue(0.0);
            data.add(std::move(p));
        }
        {
            parameter::data p("ODMix", { 0.0, 1.0 });
            registerCallback<8>(p);
            p.setDefaultValue(1.0);
            data.add(std::move(p));
        }
        {
            parameter::data p("ODOutputGain", { -24.0, 24.0 });
            registerCallback<9>(p);
            p.setDefaultValue(0.0);
            data.add(std::move(p));
        }
        {
            parameter::data p("ODMono", { 0.0, 1.0 });
            registerCallback<10>(p);
            p.setDefaultValue(0.0);
            data.add(std::move(p));
        }

        // Amp
        {
            parameter::data p("AmpMode", { 0.0, 2.0 });
            registerCallback<11>(p);
            p.setDefaultValue(1.0);
            data.add(std::move(p));
        }
        {
            parameter::data p("AmpInputGain", { -100.0, 100.0 });
            registerCallback<12>(p);
            p.setDefaultValue(0.0);
            data.add(std::move(p));
        }
        {
            parameter::data p("AmpLow", { -12.0, 12.0 });
            registerCallback<13>(p);
            p.setDefaultValue(0.0);
            data.add(std::move(p));
        }
        {
            parameter::data p("AmpMid", { -12.0, 12.0 });
            registerCallback<14>(p);
            p.setDefaultValue(0.0);
            data.add(std::move(p));
        }
        {
            parameter::data p("AmpHigh", { -12.0, 12.0 });
            registerCallback<15>(p);
            p.setDefaultValue(0.0);
            data.add(std::move(p));
        }
        {
            parameter::data p("AmpPresence", { -12.0, 12.0 });
            registerCallback<16>(p);
            p.setDefaultValue(0.0);
            data.add(std::move(p));
        }
        {
            parameter::data p("AmpOutputGain", { -100.0, 100.0 });
            registerCallback<17>(p);
            p.setDefaultValue(0.0);
            data.add(std::move(p));
        }
        {
            parameter::data p("AmpSlim", { 0.0, 1.0 });
            registerCallback<18>(p);
            p.setDefaultValue(0.0);
            data.add(std::move(p));
        }
        {
            parameter::data p("AmpCleanToneStackMode", { 0.0, 3.0 });
            registerCallback<19>(p);
            p.setDefaultValue(0.0);
            data.add(std::move(p));
        }
        {
            parameter::data p("AmpDirtyToneStackMode", { 0.0, 5.0 });
            registerCallback<20>(p);
            p.setDefaultValue(0.0);
            data.add(std::move(p));
        }
        {
            parameter::data p("AmpDistortionMode", { 0.0, 1.0 });
            registerCallback<21>(p);
            p.setDefaultValue(0.0);
            data.add(std::move(p));
        }
        {
            parameter::data p("AmpMono", { 0.0, 1.0 });
            registerCallback<22>(p);
            p.setDefaultValue(0.0);
            data.add(std::move(p));
        }

        // Cab
        {
            parameter::data p("CabMix", { 0.0, 1.0 });
            registerCallback<23>(p);
            p.setDefaultValue(0.0);
            data.add(std::move(p));
        }
        {
            parameter::data p("CabAGain", { -100.0, 12.0 });
            registerCallback<24>(p);
            p.setDefaultValue(0.0);
            data.add(std::move(p));
        }
        {
            parameter::data p("CabAPan", { -1.0, 1.0 });
            registerCallback<25>(p);
            p.setDefaultValue(0.0);
            data.add(std::move(p));
        }
        {
            parameter::data p("CabAAxis", { 0.0, 1.0 });
            registerCallback<26>(p);
            p.setDefaultValue(0.0);
            data.add(std::move(p));
        }
        {
            parameter::data p("CabADistance", { 0.0, 20000.0 });
            registerCallback<27>(p);
            p.setDefaultValue(20000.0);
            data.add(std::move(p));
        }
        {
            parameter::data p("CabADelay", { 0.0, 50.0 });
            registerCallback<28>(p);
            p.setDefaultValue(0.0);
            data.add(std::move(p));
        }
        {
            parameter::data p("CabBGain", { -100.0, 12.0 });
            registerCallback<29>(p);
            p.setDefaultValue(0.0);
            data.add(std::move(p));
        }
        {
            parameter::data p("CabBPan", { -1.0, 1.0 });
            registerCallback<30>(p);
            p.setDefaultValue(0.0);
            data.add(std::move(p));
        }
        {
            parameter::data p("CabBAxis", { 0.0, 1.0 });
            registerCallback<31>(p);
            p.setDefaultValue(0.0);
            data.add(std::move(p));
        }
        {
            parameter::data p("CabBDistance", { 0.0, 20000.0 });
            registerCallback<32>(p);
            p.setDefaultValue(20000.0);
            data.add(std::move(p));
        }
        {
            parameter::data p("CabBDelay", { 0.0, 50.0 });
            registerCallback<33>(p);
            p.setDefaultValue(0.0);
            data.add(std::move(p));
        }
        {
            parameter::data p("CabDesignerBypass", { 0.0, 1.0 });
            registerCallback<34>(p);
            p.setDefaultValue(0.0);
            data.add(std::move(p));
        }

        // Reverb
        {
            parameter::data p("ReverbMode", { 0.0, 3.0 });
            registerCallback<35>(p);
            p.setDefaultValue(3.0);
            data.add(std::move(p));
        }
        {
            parameter::data p("ReverbMix", { 0.0, 1.0 });
            registerCallback<36>(p);
            p.setDefaultValue(0.28);
            data.add(std::move(p));
        }
        {
            parameter::data p("ReverbPreDelay", { 0.0, 0.2 });
            registerCallback<37>(p);
            p.setDefaultValue(0.0);
            data.add(std::move(p));
        }
        {
            parameter::data p("ReverbRoomSize", { 0.0, 1.0 });
            registerCallback<38>(p);
            p.setDefaultValue(1.0);
            data.add(std::move(p));
        }
        {
            parameter::data p("ReverbDecay", { 0.0, 0.98 });
            registerCallback<39>(p);
            p.setDefaultValue(0.66);
            data.add(std::move(p));
        }
        {
            parameter::data p("ReverbDampingFrequency", { 20.0, 20000.0 });
            registerCallback<40>(p);
            p.setDefaultValue(20000.0);
            data.add(std::move(p));
        }
        {
            parameter::data p("ReverbChorusDepth", { 0.0, 1.0 });
            registerCallback<41>(p);
            p.setDefaultValue(0.0);
            data.add(std::move(p));
        }

        // Delay
        {
            parameter::data p("DelayMode", { 0.0, 2.0 });
            registerCallback<42>(p);
            p.setDefaultValue(2.0);
            data.add(std::move(p));
        }
        {
            parameter::data p("DelayMix", { 0.0, 1.0 });
            registerCallback<43>(p);
            p.setDefaultValue(0.43);
            data.add(std::move(p));
        }
        {
            parameter::data p("DelayTime", { 0.0, 2.0 });
            registerCallback<44>(p);
            p.setDefaultValue(0.66);
            data.add(std::move(p));
        }
        {
            parameter::data p("DelayFeedback", { 0.0, 1.0 });
            registerCallback<45>(p);
            p.setDefaultValue(0.5);
            data.add(std::move(p));
        }
        {
            parameter::data p("DelayDamping", { 20.0, 20000.0 });
            registerCallback<46>(p);
            p.setDefaultValue(5100.0);
            data.add(std::move(p));
        }
        {
            parameter::data p("DelayModulation", { 0.0, 1.0 });
            registerCallback<47>(p);
            p.setDefaultValue(0.3);
            data.add(std::move(p));
        }
        {
            parameter::data p("DelayStereoWidth", { 0.0, 1.0 });
            registerCallback<48>(p);
            p.setDefaultValue(0.5);
            data.add(std::move(p));
        }

        // Chorus
        {
            parameter::data p("ChorusMix", { 0.0, 1.0 });
            registerCallback<49>(p);
            p.setDefaultValue(0.5);
            data.add(std::move(p));
        }
        {
            parameter::data p("ChorusVoices", { 1.0, 4.0 });
            registerCallback<50>(p);
            p.setDefaultValue(2.0);
            data.add(std::move(p));
        }
        {
            parameter::data p("ChorusRate", { 0.1, 10.0 });
            registerCallback<51>(p);
            p.setDefaultValue(2.0);
            data.add(std::move(p));
        }
        {
            parameter::data p("ChorusDepth", { 0.0, 1.0 });
            registerCallback<52>(p);
            p.setDefaultValue(0.5);
            data.add(std::move(p));
        }
        {
            parameter::data p("ChorusFeedback", { 0.0, 1.0 });
            registerCallback<53>(p);
            p.setDefaultValue(0.38);
            data.add(std::move(p));
        }
        {
            parameter::data p("ChorusDelayTime", { 0.0, 50.0 });
            registerCallback<54>(p);
            p.setDefaultValue(10.0);
            data.add(std::move(p));
        }
        {
            parameter::data p("ChorusTone", { 20.0, 20000.0 });
            registerCallback<55>(p);
            p.setDefaultValue(5900.0);
            data.add(std::move(p));
        }

        // Ringmod
        {
            parameter::data p("RingmodMode", { 0.0, 2.0 });
            registerCallback<56>(p);
            p.setDefaultValue(0.0);
            data.add(std::move(p));
        }
        {
            parameter::data p("RingmodMix", { 0.0, 1.0 });
            registerCallback<57>(p);
            p.setDefaultValue(0.43);
            data.add(std::move(p));
        }
        {
            parameter::data p("RingmodFrequency", { 20.0, 5000.0 });
            registerCallback<58>(p);
            p.setDefaultValue(217.0);
            data.add(std::move(p));
        }
        {
            parameter::data p("RingmodDepth", { 0.0, 1.0 });
            registerCallback<59>(p);
            p.setDefaultValue(0.5);
            data.add(std::move(p));
        }
        {
            parameter::data p("RingmodLFORate", { 0.1, 20.0 });
            registerCallback<60>(p);
            p.setDefaultValue(1.5);
            data.add(std::move(p));
        }
        {
            parameter::data p("RingmodLFODepth", { 0.0, 1.0 });
            registerCallback<61>(p);
            p.setDefaultValue(0.5);
            data.add(std::move(p));
        }
        {
            parameter::data p("RingmodFilterFrequency", { 20.0, 20000.0 });
            registerCallback<62>(p);
            p.setDefaultValue(1100.0);
            data.add(std::move(p));
        }
    }

private:
    int activeModule = 0; // 0=Empty, 1=Overdrive, 2=Amp, 3=Cab, 4=Reverb, 5=Delay, 6=Chorus, 7=Ringmod

    project::overdrive<NV> od;
    project::amp<NV> ampNode;
    project::cab<NV> cabNode;
    project::reverb<NV> revNode;
    project::delay<NV> dlyNode;
    project::chorus<NV> choNode;
    project::ringmod<NV> rmNode;
};

} // namespace project

