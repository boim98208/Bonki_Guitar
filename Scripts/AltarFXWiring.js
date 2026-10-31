/**
 * Altar DSP FX Wiring for Chonki
 * Modular 9-Slot Multi-FX System
 * Allows any effect module to be placed in any of the 9 slots.
 * Each slot maintains fully independent, memorized parameters.
 */

namespace AltarFX
{
    // ==========================================
    // 1. PROCESSOR HANDLES
    // ==========================================
    const var fxGate = Synth.getEffect("gate");
    const var fxTranspose = Synth.getEffect("transpose");
    const var fxPick = Synth.getEffect("pick");
    const var fxOctave = Synth.getEffect("octave");
    const var fxChug = Synth.getEffect("chug");
    const var fxPreEQ = Synth.getEffect("preEQ");
    const var fxPostEQ = Synth.getEffect("postEQ");

    const var fxSlots = [
        Synth.getEffect("modularSlot0"),
        Synth.getEffect("modularSlot1"),
        Synth.getEffect("modularSlot2"),
        Synth.getEffect("modularSlot3"),
        Synth.getEffect("modularSlot4"),
        Synth.getEffect("modularSlot5"),
        Synth.getEffect("modularSlot6"),
        Synth.getEffect("modularSlot7"),
        Synth.getEffect("modularSlot8")
    ];

    inline function setFXParam(fx, paramName, value)
    {
        if (fx != 0)
        {
            local idx = fx.getAttributeIndex(paramName);
            if (idx != -1)
                fx.setAttribute(idx, value);
        }
    }

    // ==========================================
    // 2. STATE STORAGE PER SLOT (INDEPENDENT PARAMETERS)
    // ==========================================
    var activeSlot = 0;
    var isUpdatingUI = false;

    const var moduleNames = [
        "Empty",
        "Overdrive",
        "Amp",
        "Cab",
        "Reverb",
        "Delay",
        "Chorus",
        "Ringmod"
    ];

    var slotStates = [];

    for (var i = 0; i < 9; i++)
    {
        slotStates[i] = {
            module: 0,
            overdrive: {
                Mode: 0.0,
                Drive: 3.4,
                Tone: 0.06,
                FoldAmount: 1.0,
                Bits: 8.0,
                SRReduction: 16.0,
                CircuitBend: 0.0,
                Mix: 0.33,
                OutputGain: -2.8,
                Mono: 0.0
            },
            amp: {
                Mode: 0.0,
                InputGain: 11.2,
                Low: 4.2,
                Mid: -1.7,
                High: 3.7,
                Presence: 0.0,
                OutputGain: -12.1,
                Slim: 1.0,
                CleanToneStackMode: 1.0,
                DirtyToneStackMode: 1.0,
                DistortionMode: 0.0,
                Mono: 0.0,
                namPath: "",
                namName: "No Model"
            },
            cab: {
                Mix: 0.0,
                CabAGain: 0.0,
                CabAPan: 0.0,
                CabAAxis: 0.0,
                CabADistance: 20000.0,
                CabADelay: 0.0,
                CabBGain: 0.0,
                CabBPan: 0.0,
                CabBAxis: 0.0,
                CabBDistance: 20000.0,
                CabBDelay: 0.0,
                CabDesignerBypass: 0.0,
                cabAPath: "",
                cabAName: "",
                cabBPath: "",
                cabBName: ""
            },
            reverb: {
                ReverbMode: 3.0,
                Mix: 0.28,
                PreDelay: 0.0,
                RoomSize: 1.0,
                Decay: 0.66,
                DampingFrequency: 20000.0,
                ChorusDepth: 0.0
            },
            delay: {
                DelayMode: 2.0,
                Mix: 0.43,
                DelayTime: 0.66,
                Feedback: 0.5,
                Damping: 5100.0,
                Modulation: 0.3,
                StereoWidth: 0.5
            },
            chorus: {
                ChorusMix: 0.5,
                ChorusVoices: 2.0,
                ChorusRate: 2.0,
                ChorusDepth: 0.5,
                ChorusFeedback: 0.38,
                ChorusDelayTime: 10.0,
                ChorusTone: 5900.0
            },
            ringmod: {
                RingmodMode: 0.0,
                RingmodMix: 0.43,
                RingmodFrequency: 217.0,
                RingmodDepth: 0.5,
                RingmodLFORate: 1.5,
                RingmodLFODepth: 0.5,
                RingmodFilterFrequency: 1100.0
            }
        };
    }

    // ==========================================
    // 3. UI PANELS & SLOTS NAVIGATION
    // ==========================================
    const var pnlModularEmpty = Content.getComponent("pnlModularEmpty");
    const var pnlModularA = Content.getComponent("pnlModularA");
    const var pnlModularB = Content.getComponent("pnlModularB");
    const var pnlModularC = Content.getComponent("pnlModularC");
    const var pnlModularD = Content.getComponent("pnlModularD");
    const var pnlModularE = Content.getComponent("pnlModularE");
    const var pnlModularF = Content.getComponent("pnlModularF");
    const var pnlModularG = Content.getComponent("pnlModularG");
    const var pnlPreEQ = Content.getComponent("pnlPreEQ");
    const var pnlPostEQ = Content.getComponent("pnlPostEQ");

    const var modulePanels = [
        pnlModularEmpty,
        pnlModularA,
        pnlModularB,
        pnlModularC,
        pnlModularD,
        pnlModularE,
        pnlModularF,
        pnlModularG
    ];

    const var btnSlots = [
        Content.getComponent("btnSlot0"),
        Content.getComponent("btnSlot1"),
        Content.getComponent("btnSlot2"),
        Content.getComponent("btnSlot3"),
        Content.getComponent("btnSlot4"),
        Content.getComponent("btnSlot5"),
        Content.getComponent("btnSlot6"),
        Content.getComponent("btnSlot7"),
        Content.getComponent("btnSlot8")
    ];

    const var cmbSlots = [
        Content.getComponent("cmbSlot0"),
        Content.getComponent("cmbSlot1"),
        Content.getComponent("cmbSlot2"),
        Content.getComponent("cmbSlot3"),
        Content.getComponent("cmbSlot4"),
        Content.getComponent("cmbSlot5"),
        Content.getComponent("cmbSlot6"),
        Content.getComponent("cmbSlot7"),
        Content.getComponent("cmbSlot8")
    ];

    const var btnPreEQ = Content.getComponent("btnPreEQ");
    const var btnPostEQ = Content.getComponent("btnPostEQ");

    // ==========================================
    // 4. UI CONTROLS DEFINITIONS
    // ==========================================

    // Amp
    const var knbAmpMode = Content.getComponent("knbAmpMode");
    const var knbAmpInput = Content.getComponent("knbAmpInput");
    const var knbAmpLow = Content.getComponent("knbAmpLow");
    const var knbAmpMid = Content.getComponent("knbAmpMid");
    const var knbAmpHigh = Content.getComponent("knbAmpHigh");
    const var knbAmpPresence = Content.getComponent("knbAmpPresence");
    const var knbAmpOutput = Content.getComponent("knbAmpOutput");
    const var knbAmpSlim = Content.getComponent("knbAmpSlim");
    const var cmbAmpCleanToneStackMode = Content.getComponent("cmbAmpCleanToneStackMode");
    const var cmbAmpDirtyToneStackMode = Content.getComponent("cmbAmpDirtyToneStackMode");
    const var cmbAmpDirtyDistortionMode = Content.getComponent("cmbAmpDirtyDistortionMode");
    const var btnBrowseNAM = Content.getComponent("btnBrowseNAM");
    const var lblNAMName = Content.getComponent("lblNAMName");

    // Overdrive
    const var knbOverdriveMode = Content.getComponent("knbOverdriveMode");
    const var knbOverdriveDrive = Content.getComponent("knbOverdriveDrive");
    const var knbOverdriveTone = Content.getComponent("knbOverdriveTone");
    const var knbOverdriveFoldAmount = Content.getComponent("knbOverdriveFoldAmount");
    const var knbOverdriveBits = Content.getComponent("knbOverdriveBits");
    const var knbOverdriveSRReduction = Content.getComponent("knbOverdriveSRReduction");
    const var knbOverdriveCircuitBend = Content.getComponent("knbOverdriveCircuitBend");
    const var knbOverdriveMix = Content.getComponent("knbOverdriveMix");
    const var knbOverdriveOutputGain = Content.getComponent("knbOverdriveOutputGain");

    // Cab
    const var knbCabMix = Content.getComponent("knbCabMix");
    const var knbCabAGain = Content.getComponent("knbCabAGain");
    const var knbCabAPan = Content.getComponent("knbCabAPan");
    const var knbCabAAxis = Content.getComponent("knbCabAAxis");
    const var knbCabADistance = Content.getComponent("knbCabADistance");
    const var knbCabADelay = Content.getComponent("knbCabADelay");
    const var knbCabBGain = Content.getComponent("knbCabBGain");
    const var knbCabBPan = Content.getComponent("knbCabBPan");
    const var knbCabBAxis = Content.getComponent("knbCabBAxis");
    const var knbCabBDistance = Content.getComponent("knbCabBDistance");
    const var knbCabBDelay = Content.getComponent("knbCabBDelay");
    const var btnBrowseCabA = Content.getComponent("btnBrowseCabA");
    const var lblCabAName = Content.getComponent("lblCabAName");
    const var btnBrowseCabB = Content.getComponent("btnBrowseCabB");
    const var lblCabBName = Content.getComponent("lblCabBName");

    // Reverb
    const var knbReverbMode = Content.getComponent("knbReverbMode");
    const var knbReverbMix = Content.getComponent("knbReverbMix");
    const var knbReverbPreDelay = Content.getComponent("knbReverbPreDelay");
    const var knbReverbRoomSize = Content.getComponent("knbReverbRoomSize");
    const var knbReverbDecay = Content.getComponent("knbReverbDecay");
    const var knbReverbDampingFrequency = Content.getComponent("knbReverbDampingFrequency");
    const var knbReverbChorusDepth = Content.getComponent("knbReverbChorusDepth");

    // Delay
    const var knbDelayMode = Content.getComponent("knbDelayMode");
    const var knbDelayMix = Content.getComponent("knbDelayMix");
    const var knbDelayDelayTime = Content.getComponent("knbDelayDelayTime");
    const var knbDelayFeedback = Content.getComponent("knbDelayFeedback");
    const var knbDelayDamping = Content.getComponent("knbDelayDamping");
    const var knbDelayModulation = Content.getComponent("knbDelayModulation");
    const var knbDelayStereoWidth = Content.getComponent("knbDelayStereoWidth");

    // Chorus
    const var knbChorusMix = Content.getComponent("knbChorusMix");
    const var knbChorusVoices = Content.getComponent("knbChorusVoices");
    const var knbChorusRate = Content.getComponent("knbChorusRate");
    const var knbChorusDepth = Content.getComponent("knbChorusDepth");
    const var knbChorusFeedback = Content.getComponent("knbChorusFeedback");
    const var knbChorusDelayTime = Content.getComponent("knbChorusDelayTime");
    const var knbChorusTone = Content.getComponent("knbChorusTone");

    // Ringmod
    const var knbRingmodMode = Content.getComponent("knbRingmodMode");
    const var knbRingmodMix = Content.getComponent("knbRingmodMix");
    const var knbRingmodFrequency = Content.getComponent("knbRingmodFrequency");
    const var knbRingmodDepth = Content.getComponent("knbRingmodDepth");
    const var knbRingmodLFORate = Content.getComponent("knbRingmodLFORate");
    const var knbRingmodLFODepth = Content.getComponent("knbRingmodLFODepth");
    const var knbRingmodFilterFrequency = Content.getComponent("knbRingmodFilterFrequency");

    // Pre-FX
    const var knbGateThreshold = Content.getComponent("knbGateThreshold");
    const var knbGateAttack = Content.getComponent("knbGateAttack");
    const var knbGateRelease = Content.getComponent("knbGateRelease");
    const var knbTranspose = Content.getComponent("knbTranspose");
    const var knbOctave = Content.getComponent("knbOctave");
    const var knbChugStrength = Content.getComponent("knbChugStrength");
    const var knbPickStrength = Content.getComponent("knbPickStrength");

    // NAM Cable Support
    const var grm = Engine.getGlobalRoutingManager();
    const var namCable = grm.getCable("nam");

    inline function loadNAMModelFile(filePath, displayName)
    {
        if (filePath == "")
            return;

        var f = FileSystem.fromAbsolutePath(filePath);
        if (!f.isFile())
            return;

        var json = f.loadAsObject();
        if (isDefined(json))
        {
            namCable.sendData(json);
            slotStates[activeSlot].amp.namPath = filePath;
            slotStates[activeSlot].amp.namName = (displayName != "") ? displayName : f.toString(3);
            if (lblNAMName != 0)
                lblNAMName.set("text", slotStates[activeSlot].amp.namName);
        }
    }

    inline function onFileSelectedNAM(file)
    {
        if (!file.isFile())
            return;

        loadNAMModelFile(file.toString(0), file.toString(3));
    }

    inline function onBtnBrowseNAM(component, value)
    {
        if (value)
            FileSystem.browse(FileSystem.getFolder(FileSystem.Samples), false, "*.nam;*.json", onFileSelectedNAM);
    }

    if (btnBrowseNAM != 0)
        btnBrowseNAM.setControlCallback(onBtnBrowseNAM);

    // Cab IR File Browsing
    inline function onFileSelectedCabA(file)
    {
        if (!file.isFile())
            return;

        slotStates[activeSlot].cab.cabAPath = file.toString(0);
        slotStates[activeSlot].cab.cabAName = file.toString(3);
        if (lblCabAName != 0)
            lblCabAName.set("text", file.toString(3));

        local asp = Synth.getAudioSampleProcessor("modularSlot" + activeSlot);
        if (asp != 0)
        {
            local irSlotA = asp.getAudioFile(0);
            if (irSlotA != 0)
                irSlotA.loadFile(slotStates[activeSlot].cab.cabAPath);
        }
    }

    inline function onBtnBrowseCabA(component, value)
    {
        if (value)
            FileSystem.browse(FileSystem.getFolder(FileSystem.AudioFiles), false, "*.wav;*.aif;*.aiff", onFileSelectedCabA);
    }

    inline function onFileSelectedCabB(file)
    {
        if (!file.isFile())
            return;

        slotStates[activeSlot].cab.cabBPath = file.toString(0);
        slotStates[activeSlot].cab.cabBName = file.toString(3);
        if (lblCabBName != 0)
            lblCabBName.set("text", file.toString(3));

        local asp = Synth.getAudioSampleProcessor("modularSlot" + activeSlot);
        if (asp != 0)
        {
            local irSlotB = asp.getAudioFile(1);
            if (irSlotB != 0)
                irSlotB.loadFile(slotStates[activeSlot].cab.cabBPath);
        }
    }

    inline function onBtnBrowseCabB(component, value)
    {
        if (value)
            FileSystem.browse(FileSystem.getFolder(FileSystem.AudioFiles), false, "*.wav;*.aif;*.aiff", onFileSelectedCabB);
    }

    if (btnBrowseCabA != 0)
        btnBrowseCabA.setControlCallback(onBtnBrowseCabA);
    if (btnBrowseCabB != 0)
        btnBrowseCabB.setControlCallback(onBtnBrowseCabB);

    // ==========================================
    // 5. PARAMETER PUSHING (STATE -> C++ DSP)
    // ==========================================
    inline function pushSlotParamsToDSP(slotIdx, modIdx)
    {
        local fx = fxSlots[slotIdx];
        if (fx == 0) return;

        setFXParam(fx, "Module", modIdx);

        if (modIdx == 1) // Overdrive
        {
            local od = slotStates[slotIdx].overdrive;
            setFXParam(fx, "ODMode", od.Mode);
            setFXParam(fx, "ODDrive", od.Drive);
            setFXParam(fx, "ODTone", od.Tone);
            setFXParam(fx, "ODFoldAmount", od.FoldAmount);
            setFXParam(fx, "ODBits", od.Bits);
            setFXParam(fx, "ODSRReduction", od.SRReduction);
            setFXParam(fx, "ODCircuitBend", od.CircuitBend);
            setFXParam(fx, "ODMix", od.Mix);
            setFXParam(fx, "ODOutputGain", od.OutputGain);
            setFXParam(fx, "ODMono", od.Mono);
        }
        else if (modIdx == 2) // Amp
        {
            local a = slotStates[slotIdx].amp;
            setFXParam(fx, "AmpMode", a.Mode);
            setFXParam(fx, "AmpInputGain", a.InputGain);
            setFXParam(fx, "AmpLow", a.Low);
            setFXParam(fx, "AmpMid", a.Mid);
            setFXParam(fx, "AmpHigh", a.High);
            setFXParam(fx, "AmpPresence", a.Presence);
            setFXParam(fx, "AmpOutputGain", a.OutputGain);
            setFXParam(fx, "AmpSlim", a.Slim);
            setFXParam(fx, "AmpCleanToneStackMode", a.CleanToneStackMode);
            setFXParam(fx, "AmpDirtyToneStackMode", a.DirtyToneStackMode);
            setFXParam(fx, "AmpDistortionMode", a.DistortionMode);
            setFXParam(fx, "AmpMono", a.Mono);
        }
        else if (modIdx == 3) // Cab
        {
            local c = slotStates[slotIdx].cab;
            setFXParam(fx, "CabMix", c.Mix);
            setFXParam(fx, "CabAGain", c.CabAGain);
            setFXParam(fx, "CabAPan", c.CabAPan);
            setFXParam(fx, "CabAAxis", c.CabAAxis);
            setFXParam(fx, "CabADistance", c.CabADistance);
            setFXParam(fx, "CabADelay", c.CabADelay);
            setFXParam(fx, "CabBGain", c.CabBGain);
            setFXParam(fx, "CabBPan", c.CabBPan);
            setFXParam(fx, "CabBAxis", c.CabBAxis);
            setFXParam(fx, "CabBDistance", c.CabBDistance);
            setFXParam(fx, "CabBDelay", c.CabBDelay);
            setFXParam(fx, "CabDesignerBypass", c.CabDesignerBypass);
        }
        else if (modIdx == 4) // Reverb
        {
            local r = slotStates[slotIdx].reverb;
            setFXParam(fx, "ReverbMode", r.ReverbMode);
            setFXParam(fx, "ReverbMix", r.Mix);
            setFXParam(fx, "ReverbPreDelay", r.PreDelay);
            setFXParam(fx, "ReverbRoomSize", r.RoomSize);
            setFXParam(fx, "ReverbDecay", r.Decay);
            setFXParam(fx, "ReverbDampingFrequency", r.DampingFrequency);
            setFXParam(fx, "ReverbChorusDepth", r.ChorusDepth);
        }
        else if (modIdx == 5) // Delay
        {
            local d = slotStates[slotIdx].delay;
            setFXParam(fx, "DelayMode", d.DelayMode);
            setFXParam(fx, "DelayMix", d.Mix);
            setFXParam(fx, "DelayDelayTime", d.DelayTime);
            setFXParam(fx, "DelayFeedback", d.Feedback);
            setFXParam(fx, "DelayDamping", d.Damping);
            setFXParam(fx, "DelayModulation", d.Modulation);
            setFXParam(fx, "DelayStereoWidth", d.StereoWidth);
        }
        else if (modIdx == 6) // Chorus
        {
            local ch = slotStates[slotIdx].chorus;
            setFXParam(fx, "ChorusMix", ch.ChorusMix);
            setFXParam(fx, "ChorusVoices", ch.ChorusVoices);
            setFXParam(fx, "ChorusRate", ch.ChorusRate);
            setFXParam(fx, "ChorusDepth", ch.ChorusDepth);
            setFXParam(fx, "ChorusFeedback", ch.ChorusFeedback);
            setFXParam(fx, "ChorusDelayTime", ch.ChorusDelayTime);
            setFXParam(fx, "ChorusTone", ch.ChorusTone);
        }
        else if (modIdx == 7) // Ringmod
        {
            local rm = slotStates[slotIdx].ringmod;
            setFXParam(fx, "RingmodMode", rm.RingmodMode);
            setFXParam(fx, "RingmodMix", rm.RingmodMix);
            setFXParam(fx, "RingmodFrequency", rm.RingmodFrequency);
            setFXParam(fx, "RingmodDepth", rm.RingmodDepth);
            setFXParam(fx, "RingmodLFORate", rm.RingmodLFORate);
            setFXParam(fx, "RingmodLFODepth", rm.RingmodLFODepth);
            setFXParam(fx, "RingmodFilterFrequency", rm.RingmodFilterFrequency);
        }
    }

    // ==========================================
    // 6. UI CONTROLS SYNCING (STATE -> KNOBS)
    // ==========================================
    inline function syncControlsToSlot(slotIdx, modIdx)
    {
        isUpdatingUI = true;

        if (modIdx == 1) // Overdrive
        {
            local od = slotStates[slotIdx].overdrive;
            knbOverdriveMode.setValue(od.Mode);
            knbOverdriveDrive.setValue(od.Drive);
            knbOverdriveTone.setValue(od.Tone);
            knbOverdriveFoldAmount.setValue(od.FoldAmount);
            knbOverdriveBits.setValue(od.Bits);
            knbOverdriveSRReduction.setValue(od.SRReduction);
            knbOverdriveCircuitBend.setValue(od.CircuitBend);
            knbOverdriveMix.setValue(od.Mix);
            knbOverdriveOutputGain.setValue(od.OutputGain);
        }
        else if (modIdx == 2) // Amp
        {
            local a = slotStates[slotIdx].amp;
            knbAmpMode.setValue(a.Mode);
            knbAmpInput.setValue(a.InputGain);
            knbAmpLow.setValue(a.Low);
            knbAmpMid.setValue(a.Mid);
            knbAmpHigh.setValue(a.High);
            knbAmpPresence.setValue(a.Presence);
            knbAmpOutput.setValue(a.OutputGain);
            if (knbAmpSlim != 0) knbAmpSlim.setValue(a.Slim);
            cmbAmpCleanToneStackMode.setValue(a.CleanToneStackMode + 1.0);
            cmbAmpDirtyToneStackMode.setValue(a.DirtyToneStackMode + 1.0);
            cmbAmpDirtyDistortionMode.setValue(a.DistortionMode + 1.0);
            if (lblNAMName != 0) lblNAMName.set("text", a.namName);
        }
        else if (modIdx == 3) // Cab
        {
            local c = slotStates[slotIdx].cab;
            knbCabMix.setValue(c.Mix);
            knbCabAGain.setValue(c.CabAGain);
            knbCabAPan.setValue(c.CabAPan);
            knbCabAAxis.setValue(c.CabAAxis);
            knbCabADistance.setValue(c.CabADistance);
            knbCabADelay.setValue(c.CabADelay);
            knbCabBGain.setValue(c.CabBGain);
            knbCabBPan.setValue(c.CabBPan);
            knbCabBAxis.setValue(c.CabBAxis);
            knbCabBDistance.setValue(c.CabBDistance);
            knbCabBDelay.setValue(c.CabBDelay);
            if (lblCabAName != 0) lblCabAName.set("text", c.cabAName);
            if (lblCabBName != 0) lblCabBName.set("text", c.cabBName);
        }
        else if (modIdx == 4) // Reverb
        {
            local r = slotStates[slotIdx].reverb;
            knbReverbMode.setValue(r.ReverbMode);
            knbReverbMix.setValue(r.Mix);
            knbReverbPreDelay.setValue(r.PreDelay);
            knbReverbRoomSize.setValue(r.RoomSize);
            knbReverbDecay.setValue(r.Decay);
            knbReverbDampingFrequency.setValue(r.DampingFrequency);
            knbReverbChorusDepth.setValue(r.ChorusDepth);
        }
        else if (modIdx == 5) // Delay
        {
            local d = slotStates[slotIdx].delay;
            knbDelayMode.setValue(d.DelayMode);
            knbDelayMix.setValue(d.Mix);
            knbDelayDelayTime.setValue(d.DelayTime);
            knbDelayFeedback.setValue(d.Feedback);
            knbDelayDamping.setValue(d.Damping);
            knbDelayModulation.setValue(d.Modulation);
            knbDelayStereoWidth.setValue(d.StereoWidth);
        }
        else if (modIdx == 6) // Chorus
        {
            local ch = slotStates[slotIdx].chorus;
            knbChorusMix.setValue(ch.ChorusMix);
            knbChorusVoices.setValue(ch.ChorusVoices);
            knbChorusRate.setValue(ch.ChorusRate);
            knbChorusDepth.setValue(ch.ChorusDepth);
            knbChorusFeedback.setValue(ch.ChorusFeedback);
            knbChorusDelayTime.setValue(ch.ChorusDelayTime);
            knbChorusTone.setValue(ch.ChorusTone);
        }
        else if (modIdx == 7) // Ringmod
        {
            local rm = slotStates[slotIdx].ringmod;
            knbRingmodMode.setValue(rm.RingmodMode);
            knbRingmodMix.setValue(rm.RingmodMix);
            knbRingmodFrequency.setValue(rm.RingmodFrequency);
            knbRingmodDepth.setValue(rm.RingmodDepth);
            knbRingmodLFORate.setValue(rm.RingmodLFORate);
            knbRingmodLFODepth.setValue(rm.RingmodLFODepth);
            knbRingmodFilterFrequency.setValue(rm.RingmodFilterFrequency);
        }

        isUpdatingUI = false;
    }

    // ==========================================
    // 7. PANEL SWITCHER & SLOT SELECTION
    // ==========================================
    inline function updateSlotButtonText(slotIdx)
    {
        local mod = slotStates[slotIdx].module;
        local name = moduleNames[mod];
        btnSlots[slotIdx].set("text", (slotIdx + 1) + ": " + name);
    }

    inline function showModulePanel(modIdx)
    {
        for (p in modulePanels)
        {
            if (p != 0)
                p.set("visible", false);
        }
        if (pnlPreEQ != 0) pnlPreEQ.set("visible", false);
        if (pnlPostEQ != 0) pnlPostEQ.set("visible", false);

        if (modIdx >= 0 && modIdx < modulePanels.length)
        {
            local activePanel = modulePanels[modIdx];
            if (activePanel != 0)
                activePanel.set("visible", true);
        }
    }

    inline function selectSlot(slotIdx)
    {
        activeSlot = slotIdx;

        // Radio button behavior for slot buttons
        local i = 0;
        for (i = 0; i < 9; i++)
        {
            btnSlots[i].setValue(i == activeSlot ? 1 : 0);
        }
        if (btnPreEQ != 0) btnPreEQ.setValue(0);
        if (btnPostEQ != 0) btnPostEQ.setValue(0);

        local curMod = slotStates[activeSlot].module;
        showModulePanel(curMod);
        syncControlsToSlot(activeSlot, curMod);

        // If this slot is Amp in NAM mode, ensure its model is active in DSP
        if (curMod == 2 && slotStates[activeSlot].amp.Mode == 2.0 && slotStates[activeSlot].amp.namPath != "")
        {
            loadNAMModelFile(slotStates[activeSlot].amp.namPath, slotStates[activeSlot].amp.namName);
        }
    }

    // ==========================================
    // 8. COMBOBOX & SLOT BUTTON CALLBACKS
    // ==========================================
    inline function handleSlotChange(slotIdx, value)
    {
        local newMod = value - 1; // 1-based in HISE: 1=Empty, 2=Overdrive, ...
        if (newMod < 0) newMod = 0;
        if (newMod > 7) newMod = 7;

        slotStates[slotIdx].module = newMod;

        // Send Module to C++ DSP processor
        setFXParam(fxSlots[slotIdx], "Module", newMod);

        // Push slot's memorized settings for this module to C++
        pushSlotParamsToDSP(slotIdx, newMod);

        // Update button text
        updateSlotButtonText(slotIdx);

        // If this slot is currently being inspected, update panel & knobs
        if (slotIdx == activeSlot)
        {
            showModulePanel(newMod);
            syncControlsToSlot(slotIdx, newMod);
        }

        if (newMod == 2 && slotStates[slotIdx].amp.Mode == 2.0 && slotStates[slotIdx].amp.namPath != "")
        {
            loadNAMModelFile(slotStates[slotIdx].amp.namPath, slotStates[slotIdx].amp.namName);
        }

        if (newMod == 3)
        {
            local asp = Synth.getAudioSampleProcessor("modularSlot" + slotIdx);
            if (asp != 0)
            {
                if (slotStates[slotIdx].cab.cabAPath != "")
                {
                    local irSlotA = asp.getAudioFile(0);
                    if (irSlotA != 0)
                        irSlotA.loadFile(slotStates[slotIdx].cab.cabAPath);
                }
                if (slotStates[slotIdx].cab.cabBPath != "")
                {
                    local irSlotB = asp.getAudioFile(1);
                    if (irSlotB != 0)
                        irSlotB.loadFile(slotStates[slotIdx].cab.cabBPath);
                }
            }
        }
    }

    // Connect Slot Buttons & Combos
    inline function onBtnSlot0(c, v) { if (v) selectSlot(0); else c.setValue(1); }
    inline function onBtnSlot1(c, v) { if (v) selectSlot(1); else c.setValue(1); }
    inline function onBtnSlot2(c, v) { if (v) selectSlot(2); else c.setValue(1); }
    inline function onBtnSlot3(c, v) { if (v) selectSlot(3); else c.setValue(1); }
    inline function onBtnSlot4(c, v) { if (v) selectSlot(4); else c.setValue(1); }
    inline function onBtnSlot5(c, v) { if (v) selectSlot(5); else c.setValue(1); }
    inline function onBtnSlot6(c, v) { if (v) selectSlot(6); else c.setValue(1); }
    inline function onBtnSlot7(c, v) { if (v) selectSlot(7); else c.setValue(1); }
    inline function onBtnSlot8(c, v) { if (v) selectSlot(8); else c.setValue(1); }

    btnSlots[0].setControlCallback(onBtnSlot0);
    btnSlots[1].setControlCallback(onBtnSlot1);
    btnSlots[2].setControlCallback(onBtnSlot2);
    btnSlots[3].setControlCallback(onBtnSlot3);
    btnSlots[4].setControlCallback(onBtnSlot4);
    btnSlots[5].setControlCallback(onBtnSlot5);
    btnSlots[6].setControlCallback(onBtnSlot6);
    btnSlots[7].setControlCallback(onBtnSlot7);
    btnSlots[8].setControlCallback(onBtnSlot8);

    inline function onCmbSlot0(c, v) { handleSlotChange(0, v); }
    inline function onCmbSlot1(c, v) { handleSlotChange(1, v); }
    inline function onCmbSlot2(c, v) { handleSlotChange(2, v); }
    inline function onCmbSlot3(c, v) { handleSlotChange(3, v); }
    inline function onCmbSlot4(c, v) { handleSlotChange(4, v); }
    inline function onCmbSlot5(c, v) { handleSlotChange(5, v); }
    inline function onCmbSlot6(c, v) { handleSlotChange(6, v); }
    inline function onCmbSlot7(c, v) { handleSlotChange(7, v); }
    inline function onCmbSlot8(c, v) { handleSlotChange(8, v); }

    cmbSlots[0].setControlCallback(onCmbSlot0);
    cmbSlots[1].setControlCallback(onCmbSlot1);
    cmbSlots[2].setControlCallback(onCmbSlot2);
    cmbSlots[3].setControlCallback(onCmbSlot3);
    cmbSlots[4].setControlCallback(onCmbSlot4);
    cmbSlots[5].setControlCallback(onCmbSlot5);
    cmbSlots[6].setControlCallback(onCmbSlot6);
    cmbSlots[7].setControlCallback(onCmbSlot7);
    cmbSlots[8].setControlCallback(onCmbSlot8);

    // ==========================================
    // 9. KNOB PARAMETER CALLBACKS (ROUTED TO ACTIVE SLOT)
    // ==========================================

    // Overdrive
    inline function onOverdriveMode(c, v) { if (isUpdatingUI) return; slotStates[activeSlot].overdrive.Mode = v; setFXParam(fxSlots[activeSlot], "ODMode", v); }
    inline function onOverdriveDrive(c, v) { if (isUpdatingUI) return; slotStates[activeSlot].overdrive.Drive = v; setFXParam(fxSlots[activeSlot], "ODDrive", v); }
    inline function onOverdriveTone(c, v) { if (isUpdatingUI) return; slotStates[activeSlot].overdrive.Tone = v; setFXParam(fxSlots[activeSlot], "ODTone", v); }
    inline function onOverdriveFoldAmount(c, v) { if (isUpdatingUI) return; slotStates[activeSlot].overdrive.FoldAmount = v; setFXParam(fxSlots[activeSlot], "ODFoldAmount", v); }
    inline function onOverdriveBits(c, v) { if (isUpdatingUI) return; slotStates[activeSlot].overdrive.Bits = v; setFXParam(fxSlots[activeSlot], "ODBits", v); }
    inline function onOverdriveSRReduction(c, v) { if (isUpdatingUI) return; slotStates[activeSlot].overdrive.SRReduction = v; setFXParam(fxSlots[activeSlot], "ODSRReduction", v); }
    inline function onOverdriveCircuitBend(c, v) { if (isUpdatingUI) return; slotStates[activeSlot].overdrive.CircuitBend = v; setFXParam(fxSlots[activeSlot], "ODCircuitBend", v); }
    inline function onOverdriveMix(c, v) { if (isUpdatingUI) return; slotStates[activeSlot].overdrive.Mix = v; setFXParam(fxSlots[activeSlot], "ODMix", v); }
    inline function onOverdriveOutputGain(c, v) { if (isUpdatingUI) return; slotStates[activeSlot].overdrive.OutputGain = v; setFXParam(fxSlots[activeSlot], "ODOutputGain", v); }

    knbOverdriveMode.setControlCallback(onOverdriveMode);
    knbOverdriveDrive.setControlCallback(onOverdriveDrive);
    knbOverdriveTone.setControlCallback(onOverdriveTone);
    knbOverdriveFoldAmount.setControlCallback(onOverdriveFoldAmount);
    knbOverdriveBits.setControlCallback(onOverdriveBits);
    knbOverdriveSRReduction.setControlCallback(onOverdriveSRReduction);
    knbOverdriveCircuitBend.setControlCallback(onOverdriveCircuitBend);
    knbOverdriveMix.setControlCallback(onOverdriveMix);
    knbOverdriveOutputGain.setControlCallback(onOverdriveOutputGain);

    // Amp
    inline function onAmpMode(c, v)
    {
        if (isUpdatingUI) return;
        slotStates[activeSlot].amp.Mode = v;
        setFXParam(fxSlots[activeSlot], "AmpMode", v);

        if (v == 2.0)
        {
            if (slotStates[activeSlot].amp.namPath != "")
            {
                loadNAMModelFile(slotStates[activeSlot].amp.namPath, slotStates[activeSlot].amp.namName);
            }
            else
            {
                var defaultModel = FileSystem.getFolder(FileSystem.Samples).getChildFile("NAM_Profiles/SinMix Soldano SLO100.nam");
                if (defaultModel.isFile())
                {
                    loadNAMModelFile(defaultModel.toString(0), "SinMix Soldano SLO100.nam");
                }
            }
        }
    }
    inline function onAmpInput(c, v) { if (isUpdatingUI) return; slotStates[activeSlot].amp.InputGain = v; setFXParam(fxSlots[activeSlot], "AmpInputGain", v); }
    inline function onAmpLow(c, v) { if (isUpdatingUI) return; slotStates[activeSlot].amp.Low = v; setFXParam(fxSlots[activeSlot], "AmpLow", v); }
    inline function onAmpMid(c, v) { if (isUpdatingUI) return; slotStates[activeSlot].amp.Mid = v; setFXParam(fxSlots[activeSlot], "AmpMid", v); }
    inline function onAmpHigh(c, v) { if (isUpdatingUI) return; slotStates[activeSlot].amp.High = v; setFXParam(fxSlots[activeSlot], "AmpHigh", v); }
    inline function onAmpPresence(c, v) { if (isUpdatingUI) return; slotStates[activeSlot].amp.Presence = v; setFXParam(fxSlots[activeSlot], "AmpPresence", v); }
    inline function onAmpOutput(c, v) { if (isUpdatingUI) return; slotStates[activeSlot].amp.OutputGain = v; setFXParam(fxSlots[activeSlot], "AmpOutputGain", v); }
    inline function onAmpSlim(c, v) { if (isUpdatingUI) return; slotStates[activeSlot].amp.Slim = v; setFXParam(fxSlots[activeSlot], "AmpSlim", v); }
    inline function onAmpCleanToneStackMode(c, v) { if (isUpdatingUI) return; slotStates[activeSlot].amp.CleanToneStackMode = v - 1.0; setFXParam(fxSlots[activeSlot], "AmpCleanToneStackMode", v - 1.0); }
    inline function onAmpDirtyToneStackMode(c, v) { if (isUpdatingUI) return; slotStates[activeSlot].amp.DirtyToneStackMode = v - 1.0; setFXParam(fxSlots[activeSlot], "AmpDirtyToneStackMode", v - 1.0); }
    inline function onAmpDirtyDistortionMode(c, v) { if (isUpdatingUI) return; slotStates[activeSlot].amp.DistortionMode = v - 1.0; setFXParam(fxSlots[activeSlot], "AmpDistortionMode", v - 1.0); }

    knbAmpMode.setControlCallback(onAmpMode);
    knbAmpInput.setControlCallback(onAmpInput);
    knbAmpLow.setControlCallback(onAmpLow);
    knbAmpMid.setControlCallback(onAmpMid);
    knbAmpHigh.setControlCallback(onAmpHigh);
    knbAmpPresence.setControlCallback(onAmpPresence);
    knbAmpOutput.setControlCallback(onAmpOutput);
    if (knbAmpSlim != 0) knbAmpSlim.setControlCallback(onAmpSlim);
    cmbAmpCleanToneStackMode.setControlCallback(onAmpCleanToneStackMode);
    cmbAmpDirtyToneStackMode.setControlCallback(onAmpDirtyToneStackMode);
    cmbAmpDirtyDistortionMode.setControlCallback(onAmpDirtyDistortionMode);

    // Cab
    inline function onCabMix(c, v) { if (isUpdatingUI) return; slotStates[activeSlot].cab.Mix = v; setFXParam(fxSlots[activeSlot], "CabMix", v); }
    inline function onCabAGain(c, v) { if (isUpdatingUI) return; slotStates[activeSlot].cab.CabAGain = v; setFXParam(fxSlots[activeSlot], "CabAGain", v); }
    inline function onCabAPan(c, v) { if (isUpdatingUI) return; slotStates[activeSlot].cab.CabAPan = v; setFXParam(fxSlots[activeSlot], "CabAPan", v); }
    inline function onCabAAxis(c, v) { if (isUpdatingUI) return; slotStates[activeSlot].cab.CabAAxis = v; setFXParam(fxSlots[activeSlot], "CabAAxis", v); }
    inline function onCabADistance(c, v) { if (isUpdatingUI) return; slotStates[activeSlot].cab.CabADistance = v; setFXParam(fxSlots[activeSlot], "CabADistance", v); }
    inline function onCabADelay(c, v) { if (isUpdatingUI) return; slotStates[activeSlot].cab.CabADelay = v; setFXParam(fxSlots[activeSlot], "CabADelay", v); }
    inline function onCabBGain(c, v) { if (isUpdatingUI) return; slotStates[activeSlot].cab.CabBGain = v; setFXParam(fxSlots[activeSlot], "CabBGain", v); }
    inline function onCabBPan(c, v) { if (isUpdatingUI) return; slotStates[activeSlot].cab.CabBPan = v; setFXParam(fxSlots[activeSlot], "CabBPan", v); }
    inline function onCabBAxis(c, v) { if (isUpdatingUI) return; slotStates[activeSlot].cab.CabBAxis = v; setFXParam(fxSlots[activeSlot], "CabBAxis", v); }
    inline function onCabBDistance(c, v) { if (isUpdatingUI) return; slotStates[activeSlot].cab.CabBDistance = v; setFXParam(fxSlots[activeSlot], "CabBDistance", v); }
    inline function onCabBDelay(c, v) { if (isUpdatingUI) return; slotStates[activeSlot].cab.CabBDelay = v; setFXParam(fxSlots[activeSlot], "CabBDelay", v); }

    knbCabMix.setControlCallback(onCabMix);
    knbCabAGain.setControlCallback(onCabAGain);
    knbCabAPan.setControlCallback(onCabAPan);
    knbCabAAxis.setControlCallback(onCabAAxis);
    knbCabADistance.setControlCallback(onCabADistance);
    knbCabADelay.setControlCallback(onCabADelay);
    knbCabBGain.setControlCallback(onCabBGain);
    knbCabBPan.setControlCallback(onCabBPan);
    knbCabBAxis.setControlCallback(onCabBAxis);
    knbCabBDistance.setControlCallback(onCabBDistance);
    knbCabBDelay.setControlCallback(onCabBDelay);

    // Reverb
    inline function onReverbMode(c, v) { if (isUpdatingUI) return; slotStates[activeSlot].reverb.ReverbMode = v; setFXParam(fxSlots[activeSlot], "ReverbMode", v); }
    inline function onReverbMix(c, v) { if (isUpdatingUI) return; slotStates[activeSlot].reverb.Mix = v; setFXParam(fxSlots[activeSlot], "ReverbMix", v); }
    inline function onReverbPreDelay(c, v) { if (isUpdatingUI) return; slotStates[activeSlot].reverb.PreDelay = v; setFXParam(fxSlots[activeSlot], "ReverbPreDelay", v); }
    inline function onReverbRoomSize(c, v) { if (isUpdatingUI) return; slotStates[activeSlot].reverb.RoomSize = v; setFXParam(fxSlots[activeSlot], "ReverbRoomSize", v); }
    inline function onReverbDecay(c, v) { if (isUpdatingUI) return; slotStates[activeSlot].reverb.Decay = v; setFXParam(fxSlots[activeSlot], "ReverbDecay", v); }
    inline function onReverbDampingFrequency(c, v) { if (isUpdatingUI) return; slotStates[activeSlot].reverb.DampingFrequency = v; setFXParam(fxSlots[activeSlot], "ReverbDampingFrequency", v); }
    inline function onReverbChorusDepth(c, v) { if (isUpdatingUI) return; slotStates[activeSlot].reverb.ChorusDepth = v; setFXParam(fxSlots[activeSlot], "ReverbChorusDepth", v); }

    knbReverbMode.setControlCallback(onReverbMode);
    knbReverbMix.setControlCallback(onReverbMix);
    knbReverbPreDelay.setControlCallback(onReverbPreDelay);
    knbReverbRoomSize.setControlCallback(onReverbRoomSize);
    knbReverbDecay.setControlCallback(onReverbDecay);
    knbReverbDampingFrequency.setControlCallback(onReverbDampingFrequency);
    knbReverbChorusDepth.setControlCallback(onReverbChorusDepth);

    // Delay
    inline function onDelayMode(c, v) { if (isUpdatingUI) return; slotStates[activeSlot].delay.DelayMode = v; setFXParam(fxSlots[activeSlot], "DelayMode", v); }
    inline function onDelayMix(c, v) { if (isUpdatingUI) return; slotStates[activeSlot].delay.Mix = v; setFXParam(fxSlots[activeSlot], "DelayMix", v); }
    inline function onDelayDelayTime(c, v) { if (isUpdatingUI) return; slotStates[activeSlot].delay.DelayTime = v; setFXParam(fxSlots[activeSlot], "DelayTime", v); }
    inline function onDelayFeedback(c, v) { if (isUpdatingUI) return; slotStates[activeSlot].delay.Feedback = v; setFXParam(fxSlots[activeSlot], "DelayFeedback", v); }
    inline function onDelayDamping(c, v) { if (isUpdatingUI) return; slotStates[activeSlot].delay.Damping = v; setFXParam(fxSlots[activeSlot], "DelayDamping", v); }
    inline function onDelayModulation(c, v) { if (isUpdatingUI) return; slotStates[activeSlot].delay.Modulation = v; setFXParam(fxSlots[activeSlot], "DelayModulation", v); }
    inline function onDelayStereoWidth(c, v) { if (isUpdatingUI) return; slotStates[activeSlot].delay.StereoWidth = v; setFXParam(fxSlots[activeSlot], "DelayStereoWidth", v); }

    knbDelayMode.setControlCallback(onDelayMode);
    knbDelayMix.setControlCallback(onDelayMix);
    knbDelayDelayTime.setControlCallback(onDelayDelayTime);
    knbDelayFeedback.setControlCallback(onDelayFeedback);
    knbDelayDamping.setControlCallback(onDelayDamping);
    knbDelayModulation.setControlCallback(onDelayModulation);
    knbDelayStereoWidth.setControlCallback(onDelayStereoWidth);

    // Chorus
    inline function onChorusMix(c, v) { if (isUpdatingUI) return; slotStates[activeSlot].chorus.ChorusMix = v; setFXParam(fxSlots[activeSlot], "ChorusMix", v); }
    inline function onChorusVoices(c, v) { if (isUpdatingUI) return; slotStates[activeSlot].chorus.ChorusVoices = v; setFXParam(fxSlots[activeSlot], "ChorusVoices", v); }
    inline function onChorusRate(c, v) { if (isUpdatingUI) return; slotStates[activeSlot].chorus.ChorusRate = v; setFXParam(fxSlots[activeSlot], "ChorusRate", v); }
    inline function onChorusDepth(c, v) { if (isUpdatingUI) return; slotStates[activeSlot].chorus.ChorusDepth = v; setFXParam(fxSlots[activeSlot], "ChorusDepth", v); }
    inline function onChorusFeedback(c, v) { if (isUpdatingUI) return; slotStates[activeSlot].chorus.ChorusFeedback = v; setFXParam(fxSlots[activeSlot], "ChorusFeedback", v); }
    inline function onChorusDelayTime(c, v) { if (isUpdatingUI) return; slotStates[activeSlot].chorus.ChorusDelayTime = v; setFXParam(fxSlots[activeSlot], "ChorusDelayTime", v); }
    inline function onChorusTone(c, v) { if (isUpdatingUI) return; slotStates[activeSlot].chorus.ChorusTone = v; setFXParam(fxSlots[activeSlot], "ChorusTone", v); }

    knbChorusMix.setControlCallback(onChorusMix);
    knbChorusVoices.setControlCallback(onChorusVoices);
    knbChorusRate.setControlCallback(onChorusRate);
    knbChorusDepth.setControlCallback(onChorusDepth);
    knbChorusFeedback.setControlCallback(onChorusFeedback);
    knbChorusDelayTime.setControlCallback(onChorusDelayTime);
    knbChorusTone.setControlCallback(onChorusTone);

    // Ringmod
    inline function onRingmodMode(c, v) { if (isUpdatingUI) return; slotStates[activeSlot].ringmod.RingmodMode = v; setFXParam(fxSlots[activeSlot], "RingmodMode", v); }
    inline function onRingmodMix(c, v) { if (isUpdatingUI) return; slotStates[activeSlot].ringmod.RingmodMix = v; setFXParam(fxSlots[activeSlot], "RingmodMix", v); }
    inline function onRingmodFrequency(c, v) { if (isUpdatingUI) return; slotStates[activeSlot].ringmod.RingmodFrequency = v; setFXParam(fxSlots[activeSlot], "RingmodFrequency", v); }
    inline function onRingmodDepth(c, v) { if (isUpdatingUI) return; slotStates[activeSlot].ringmod.RingmodDepth = v; setFXParam(fxSlots[activeSlot], "RingmodDepth", v); }
    inline function onRingmodLFORate(c, v) { if (isUpdatingUI) return; slotStates[activeSlot].ringmod.RingmodLFORate = v; setFXParam(fxSlots[activeSlot], "RingmodLFORate", v); }
    inline function onRingmodLFODepth(c, v) { if (isUpdatingUI) return; slotStates[activeSlot].ringmod.RingmodLFODepth = v; setFXParam(fxSlots[activeSlot], "RingmodLFODepth", v); }
    inline function onRingmodFilterFrequency(c, v) { if (isUpdatingUI) return; slotStates[activeSlot].ringmod.RingmodFilterFrequency = v; setFXParam(fxSlots[activeSlot], "RingmodFilterFrequency", v); }

    knbRingmodMode.setControlCallback(onRingmodMode);
    knbRingmodMix.setControlCallback(onRingmodMix);
    knbRingmodFrequency.setControlCallback(onRingmodFrequency);
    knbRingmodDepth.setControlCallback(onRingmodDepth);
    knbRingmodLFORate.setControlCallback(onRingmodLFORate);
    knbRingmodLFODepth.setControlCallback(onRingmodLFODepth);
    knbRingmodFilterFrequency.setControlCallback(onRingmodFilterFrequency);

    // ==========================================
    // 10. PRE-FX CONTROLS
    // ==========================================
    inline function onGateThreshold(c, v) { setFXParam(fxGate, "Threshold", v); }
    inline function onGateAttack(c, v) { setFXParam(fxGate, "Attack", v); }
    inline function onGateRelease(c, v) { setFXParam(fxGate, "Release", v); }
    inline function onTranspose(c, v) { 
        local ratio = Math.pow(2.0, v / 12.0);
        setFXParam(fxTranspose, "FreqRatio", ratio); 
    }
    inline function onOctave(c, v) { setFXParam(fxOctave, "Octave", v); }
    inline function onChugStrength(c, v) { setFXParam(fxChug, "Strength", v); }
    inline function onPickStrength(c, v) { setFXParam(fxPick, "Strength", v); }

    knbGateThreshold.setControlCallback(onGateThreshold);
    knbGateAttack.setControlCallback(onGateAttack);
    knbGateRelease.setControlCallback(onGateRelease);
    knbTranspose.setControlCallback(onTranspose);
    knbOctave.setControlCallback(onOctave);
    knbChugStrength.setControlCallback(onChugStrength);
    knbPickStrength.setControlCallback(onPickStrength);

    // ==========================================
    // 11. MONO / STEREO OPTIMIZATION
    // ==========================================
    inline function setMonoProcessing(isMono)
    {
        local v = isMono ? 1.0 : 0.0;
        local s = 0;
        for (s = 0; s < 9; s++)
        {
            slotStates[s].amp.Mono = v;
            slotStates[s].overdrive.Mono = v;
            setFXParam(fxSlots[s], "AmpMono", v);
            setFXParam(fxSlots[s], "ODMono", v);
        }
    }

    // ==========================================
    // 12. PRE-EQ & POST-EQ CONTROLS
    // ==========================================
    inline function onBtnBypassPreEQ(c, v)
    {
        if (fxPreEQ != 0)
            fxPreEQ.setBypassed(!v);
    }

    inline function onBtnBypassPostEQ(c, v)
    {
        if (fxPostEQ != 0)
            fxPostEQ.setBypassed(!v);
    }

    const var btnBypassPreEQ = Content.getComponent("btnBypassPreEQ");
    const var btnBypassPostEQ = Content.getComponent("btnBypassPostEQ");
    if (btnBypassPreEQ != 0) btnBypassPreEQ.setControlCallback(onBtnBypassPreEQ);
    if (btnBypassPostEQ != 0) btnBypassPostEQ.setControlCallback(onBtnBypassPostEQ);

    inline function onBtnPreEQ(c, v)
    {
        if (v)
        {
            local i = 0;
            for (i = 0; i < 9; i++) btnSlots[i].setValue(0);
            if (btnPostEQ != 0) btnPostEQ.setValue(0);
            for (p in modulePanels) if (p != 0) p.set("visible", false);
            if (pnlPostEQ != 0) pnlPostEQ.set("visible", false);
            if (pnlPreEQ != 0) pnlPreEQ.set("visible", true);
        }
        else
        {
            c.setValue(1);
        }
    }

    inline function onBtnPostEQ(c, v)
    {
        if (v)
        {
            local i = 0;
            for (i = 0; i < 9; i++) btnSlots[i].setValue(0);
            if (btnPreEQ != 0) btnPreEQ.setValue(0);
            for (p in modulePanels) if (p != 0) p.set("visible", false);
            if (pnlPreEQ != 0) pnlPreEQ.set("visible", false);
            if (pnlPostEQ != 0) pnlPostEQ.set("visible", true);
        }
        else
        {
            c.setValue(1);
        }
    }

    if (btnPreEQ != 0) btnPreEQ.setControlCallback(onBtnPreEQ);
    if (btnPostEQ != 0) btnPostEQ.setControlCallback(onBtnPostEQ);

    // ==========================================
    // 13. PRESET SAVE & LOAD (9-SLOT MODULAR STATE)
    // ==========================================
    const var btnSaveFXPreset = Content.getComponent("btnSaveFXPreset");
    const var btnLoadFXPreset = Content.getComponent("btnLoadFXPreset");
    const var lblFXPresetName = Content.getComponent("lblFXPresetName");

    inline function onFileSavePreset(targetFile)
    {
        if (!isDefined(targetFile))
            return;

        var preset = {};
        preset.slotStates = slotStates;

        // Save CurveEQ states
        if (fxPreEQ != 0)
            preset.preEQState = fxPreEQ.exportState();
        if (fxPostEQ != 0)
            preset.postEQState = fxPostEQ.exportState();

        var success = targetFile.writeObject(preset);
        if (success)
        {
            if (lblFXPresetName != 0)
                lblFXPresetName.set("text", targetFile.toString(3));
            Console.print("AltarFX: Saved modular preset to " + targetFile.toString(0));
        }
    }

    inline function onFileLoadPreset(file)
    {
        if (!isDefined(file))
            return;

        var preset = file.loadAsObject();
        if (!isDefined(preset))
            return;

        // Restore 9-slot state
        if (isDefined(preset.slotStates))
        {
            slotStates = preset.slotStates;

            local s = 0;
            for (s = 0; s < 9; s++)
            {
                local mod = slotStates[s].module;
                cmbSlots[s].setValue(mod + 1); // 1-based index
                updateSlotButtonText(s);
                pushSlotParamsToDSP(s, mod);

                if (mod == 2 && slotStates[s].amp.Mode == 2.0 && slotStates[s].amp.namPath != "")
                {
                    loadNAMModelFile(slotStates[s].amp.namPath, slotStates[s].amp.namName);
                }

                if (mod == 3)
                {
                    local asp = Synth.getAudioSampleProcessor("modularSlot" + s);
                    if (asp != 0)
                    {
                        if (slotStates[s].cab.cabAPath != "")
                        {
                            local irA = asp.getAudioFile(0);
                            if (irA != 0)
                                irA.loadFile(slotStates[s].cab.cabAPath);
                        }
                        if (slotStates[s].cab.cabBPath != "")
                        {
                            local irB = asp.getAudioFile(1);
                            if (irB != 0)
                                irB.loadFile(slotStates[s].cab.cabBPath);
                        }
                    }
                }
            }

            selectSlot(0);
        }

        // Restore CurveEQ states
        if (isDefined(preset.preEQState) && fxPreEQ != 0)
            fxPreEQ.restoreState(preset.preEQState);
        if (isDefined(preset.postEQState) && fxPostEQ != 0)
            fxPostEQ.restoreState(preset.postEQState);

        if (lblFXPresetName != 0)
            lblFXPresetName.set("text", file.toString(3));
        Console.print("AltarFX: Successfully loaded modular preset " + file.toString(3));
    }

    inline function onBtnSaveFXPreset(c, v)
    {
        if (v)
            FileSystem.browse(FileSystem.getFolder(FileSystem.UserPresets), true, "*.json", onFileSavePreset);
    }

    inline function onBtnLoadFXPreset(c, v)
    {
        if (v)
            FileSystem.browse(FileSystem.getFolder(FileSystem.UserPresets), false, "*.json", onFileLoadPreset);
    }

    if (btnSaveFXPreset != 0)
        btnSaveFXPreset.setControlCallback(onBtnSaveFXPreset);

    if (btnLoadFXPreset != 0)
        btnLoadFXPreset.setControlCallback(onBtnLoadFXPreset);

    // ==========================================
    // 14. INITIALIZE MODULAR SYSTEM
    // ==========================================
    // Initialize all slot button labels and DSP states
    for (var s = 0; s < 9; s++)
    {
        updateSlotButtonText(s);
        setFXParam(fxSlots[s], "Module", 0.0); // Start empty
    }

    // Select Slot 0 by default (shows Empty slot panel)
    selectSlot(0);
}
