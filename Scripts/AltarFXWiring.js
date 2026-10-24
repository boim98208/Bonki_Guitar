/**
 * Altar DSP FX Wiring for Chonki
 * Connects all UI Knobs, Sliders, and Comboboxes to Altar DSP processors
 */

namespace AltarFX
{
    // 1. Processor Handles
    const var fxGate = Synth.getEffect("gate");
    const var fxTranspose = Synth.getEffect("transpose");
    const var fxPick = Synth.getEffect("pick");
    const var fxOctave = Synth.getEffect("octave");
    const var fxChug = Synth.getEffect("chug");
    const var fxOverdrive = Synth.getEffect("modularA");
    const var fxAmp = Synth.getEffect("modularB");
    const var fxCab = Synth.getEffect("modularC");
    const var fxReverb = Synth.getEffect("modularD");
    const var fxDelay = Synth.getEffect("modularE");
    const var fxChorus = Synth.getEffect("modularF");
    const var fxRingmod = Synth.getEffect("modularG");
    const var fxPreEQ = Synth.getEffect("preEQ");
    const var fxPostEQ = Synth.getEffect("postEQ");

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
    // AMP CONTROLS
    // ==========================================
    const var knbAmpMode = Content.getComponent("knbAmpMode");
    const var knbAmpInput = Content.getComponent("knbAmpInput");
    const var knbAmpLow = Content.getComponent("knbAmpLow");
    const var knbAmpMid = Content.getComponent("knbAmpMid");
    const var knbAmpHigh = Content.getComponent("knbAmpHigh");
    const var knbAmpPresence = Content.getComponent("knbAmpPresence");
    const var knbAmpOutput = Content.getComponent("knbAmpOutput");
    const var cmbAmpCleanToneStackMode = Content.getComponent("cmbAmpCleanToneStackMode");
    const var cmbAmpDirtyToneStackMode = Content.getComponent("cmbAmpDirtyToneStackMode");
    const var cmbAmpDirtyDistortionMode = Content.getComponent("cmbAmpDirtyDistortionMode");

    inline function onAmpMode(component, value) { setFXParam(fxAmp, "Mode", value); }
    inline function onAmpInput(component, value) { setFXParam(fxAmp, "InputGain", value); }
    inline function onAmpLow(component, value) { setFXParam(fxAmp, "Low", value); }
    inline function onAmpMid(component, value) { setFXParam(fxAmp, "Mid", value); }
    inline function onAmpHigh(component, value) { setFXParam(fxAmp, "High", value); }
    inline function onAmpPresence(component, value) { setFXParam(fxAmp, "Presence", value); }
    inline function onAmpOutput(component, value) { setFXParam(fxAmp, "OutputGain", value); }
    inline function onAmpCleanToneStackMode(component, value) { setFXParam(fxAmp, "CleanToneStackMode", value - 1.0); }
    inline function onAmpDirtyToneStackMode(component, value) { setFXParam(fxAmp, "DirtyToneStackMode", value - 1.0); }
    inline function onAmpDirtyDistortionMode(component, value) { setFXParam(fxAmp, "DistortionMode", value - 1.0); }

    knbAmpMode.setControlCallback(onAmpMode);
    knbAmpInput.setControlCallback(onAmpInput);
    knbAmpLow.setControlCallback(onAmpLow);
    knbAmpMid.setControlCallback(onAmpMid);
    knbAmpHigh.setControlCallback(onAmpHigh);
    knbAmpPresence.setControlCallback(onAmpPresence);
    knbAmpOutput.setControlCallback(onAmpOutput);
    cmbAmpCleanToneStackMode.setControlCallback(onAmpCleanToneStackMode);
    cmbAmpDirtyToneStackMode.setControlCallback(onAmpDirtyToneStackMode);
    cmbAmpDirtyDistortionMode.setControlCallback(onAmpDirtyDistortionMode);

    // ==========================================
    // OVERDRIVE CONTROLS
    // ==========================================
    const var knbOverdriveMode = Content.getComponent("knbOverdriveMode");
    const var knbOverdriveDrive = Content.getComponent("knbOverdriveDrive");
    const var knbOverdriveTone = Content.getComponent("knbOverdriveTone");
    const var knbOverdriveFoldAmount = Content.getComponent("knbOverdriveFoldAmount");
    const var knbOverdriveBits = Content.getComponent("knbOverdriveBits");
    const var knbOverdriveSRReduction = Content.getComponent("knbOverdriveSRReduction");
    const var knbOverdriveCircuitBend = Content.getComponent("knbOverdriveCircuitBend");
    const var knbOverdriveMix = Content.getComponent("knbOverdriveMix");
    const var knbOverdriveOutputGain = Content.getComponent("knbOverdriveOutputGain");

    inline function onOverdriveMode(component, value) { setFXParam(fxOverdrive, "Mode", value); }
    inline function onOverdriveDrive(component, value) { setFXParam(fxOverdrive, "Drive", value); }
    inline function onOverdriveTone(component, value) { setFXParam(fxOverdrive, "Tone", value); }
    inline function onOverdriveFoldAmount(component, value) { setFXParam(fxOverdrive, "FoldAmount", value); }
    inline function onOverdriveBits(component, value) { setFXParam(fxOverdrive, "Bits", value); }
    inline function onOverdriveSRReduction(component, value) { setFXParam(fxOverdrive, "SRReduction", value); }
    inline function onOverdriveCircuitBend(component, value) { setFXParam(fxOverdrive, "CircuitBend", value); }
    inline function onOverdriveMix(component, value) { setFXParam(fxOverdrive, "Mix", value); }
    inline function onOverdriveOutputGain(component, value) { setFXParam(fxOverdrive, "OutputGain", value); }

    knbOverdriveMode.setControlCallback(onOverdriveMode);
    knbOverdriveDrive.setControlCallback(onOverdriveDrive);
    knbOverdriveTone.setControlCallback(onOverdriveTone);
    knbOverdriveFoldAmount.setControlCallback(onOverdriveFoldAmount);
    knbOverdriveBits.setControlCallback(onOverdriveBits);
    knbOverdriveSRReduction.setControlCallback(onOverdriveSRReduction);
    knbOverdriveCircuitBend.setControlCallback(onOverdriveCircuitBend);
    knbOverdriveMix.setControlCallback(onOverdriveMix);
    knbOverdriveOutputGain.setControlCallback(onOverdriveOutputGain);

    // ==========================================
    // CAB CONTROLS
    // ==========================================
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

    inline function onCabMix(component, value) { setFXParam(fxCab, "Mix", value); }
    inline function onCabAGain(component, value) { setFXParam(fxCab, "CabAGain", value); }
    inline function onCabAPan(component, value) { setFXParam(fxCab, "CabAPan", value); }
    inline function onCabAAxis(component, value) { setFXParam(fxCab, "CabAAxis", value); }
    inline function onCabADistance(component, value) { setFXParam(fxCab, "CabADistance", value); }
    inline function onCabADelay(component, value) { setFXParam(fxCab, "CabADelay", value); }
    inline function onCabBGain(component, value) { setFXParam(fxCab, "CabBGain", value); }
    inline function onCabBPan(component, value) { setFXParam(fxCab, "CabBPan", value); }
    inline function onCabBAxis(component, value) { setFXParam(fxCab, "CabBAxis", value); }
    inline function onCabBDistance(component, value) { setFXParam(fxCab, "CabBDistance", value); }
    inline function onCabBDelay(component, value) { setFXParam(fxCab, "CabBDelay", value); }

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

    // Cab IR File Loaders
    const var btnBrowseCabA = Content.getComponent("btnBrowseCabA");
    const var lblCabAName = Content.getComponent("lblCabAName");
    const var btnBrowseCabB = Content.getComponent("btnBrowseCabB");
    const var lblCabBName = Content.getComponent("lblCabBName");

    // Audio sample processor handle for modularC (cab)
    const var aspModularC = Synth.getAudioSampleProcessor("modularC");
    const var audioFileCabA = (aspModularC != 0) ? aspModularC.getAudioFile(0) : 0;
    const var audioFileCabB = (aspModularC != 0) ? aspModularC.getAudioFile(1) : 0;

    var currentCabAPath = "";
    var currentCabBPath = "";

    inline function onBtnBrowseCabA(component, value)
    {
        if (value)
        {
            FileSystem.browse(FileSystem.getFolder(FileSystem.AudioFiles), false, "*.wav;*.aif;*.aiff", function(file)
            {
                if (!file.isFile())
                    return;

                if (lblCabAName != 0)
                    lblCabAName.set("text", file.toString(3));

                currentCabAPath = file.toString(0);
                if (aspModularC != 0)
                {
                    local irSlotA = aspModularC.getAudioFile(0);
                    if (irSlotA != 0)
                        irSlotA.loadFile(currentCabAPath);
                }
                else if (audioFileCabA != 0)
                {
                    audioFileCabA.loadFile(currentCabAPath);
                }
            });
        }
    }

    inline function onBtnBrowseCabB(component, value)
    {
        if (value)
        {
            FileSystem.browse(FileSystem.getFolder(FileSystem.AudioFiles), false, "*.wav;*.aif;*.aiff", function(file)
            {
                if (!file.isFile())
                    return;

                if (lblCabBName != 0)
                    lblCabBName.set("text", file.toString(3));

                currentCabBPath = file.toString(0);
                if (aspModularC != 0)
                {
                    local irSlotB = aspModularC.getAudioFile(1);
                    if (irSlotB != 0)
                        irSlotB.loadFile(currentCabBPath);
                }
                else if (audioFileCabB != 0)
                {
                    audioFileCabB.loadFile(currentCabBPath);
                }
            });
        }
    }

    if (btnBrowseCabA != 0)
        btnBrowseCabA.setControlCallback(onBtnBrowseCabA);
    if (btnBrowseCabB != 0)
        btnBrowseCabB.setControlCallback(onBtnBrowseCabB);

    // ==========================================
    // REVERB CONTROLS
    // ==========================================
    const var knbReverbMix = Content.getComponent("knbReverbMix");
    const var knbReverbPreDelay = Content.getComponent("knbReverbPreDelay");
    const var knbReverbRoomSize = Content.getComponent("knbReverbRoomSize");
    const var knbReverbDecay = Content.getComponent("knbReverbDecay");
    const var knbReverbDampingFrequency = Content.getComponent("knbReverbDampingFrequency");
    const var knbReverbChorusDepth = Content.getComponent("knbReverbChorusDepth");

    inline function onReverbMix(component, value) { setFXParam(fxReverb, "Mix", value); }
    inline function onReverbPreDelay(component, value) { setFXParam(fxReverb, "PreDelay", value); }
    inline function onReverbRoomSize(component, value) { setFXParam(fxReverb, "RoomSize", value); }
    inline function onReverbDecay(component, value) { setFXParam(fxReverb, "Decay", value); }
    inline function onReverbDampingFrequency(component, value) { setFXParam(fxReverb, "DampingFrequency", value); }
    inline function onReverbChorusDepth(component, value) { setFXParam(fxReverb, "ChorusDepth", value); }

    knbReverbMix.setControlCallback(onReverbMix);
    knbReverbPreDelay.setControlCallback(onReverbPreDelay);
    knbReverbRoomSize.setControlCallback(onReverbRoomSize);
    knbReverbDecay.setControlCallback(onReverbDecay);
    knbReverbDampingFrequency.setControlCallback(onReverbDampingFrequency);
    knbReverbChorusDepth.setControlCallback(onReverbChorusDepth);

    // ==========================================
    // DELAY CONTROLS
    // ==========================================
    const var knbDelayMode = Content.getComponent("knbDelayMode");
    const var knbDelayMix = Content.getComponent("knbDelayMix");
    const var knbDelayDelayTime = Content.getComponent("knbDelayDelayTime");
    const var knbDelayFeedback = Content.getComponent("knbDelayFeedback");
    const var knbDelayDamping = Content.getComponent("knbDelayDamping");
    const var knbDelayModulation = Content.getComponent("knbDelayModulation");
    const var knbDelayStereoWidth = Content.getComponent("knbDelayStereoWidth");

    inline function onDelayMode(component, value) { setFXParam(fxDelay, "DelayMode", value); }
    inline function onDelayMix(component, value) { setFXParam(fxDelay, "Mix", value); }
    inline function onDelayDelayTime(component, value) { setFXParam(fxDelay, "DelayTime", value); }
    inline function onDelayFeedback(component, value) { setFXParam(fxDelay, "Feedback", value); }
    inline function onDelayDamping(component, value) { setFXParam(fxDelay, "Damping", value); }
    inline function onDelayModulation(component, value) { setFXParam(fxDelay, "Modulation", value); }
    inline function onDelayStereoWidth(component, value) { setFXParam(fxDelay, "StereoWidth", value); }

    knbDelayMode.setControlCallback(onDelayMode);
    knbDelayMix.setControlCallback(onDelayMix);
    knbDelayDelayTime.setControlCallback(onDelayDelayTime);
    knbDelayFeedback.setControlCallback(onDelayFeedback);
    knbDelayDamping.setControlCallback(onDelayDamping);
    knbDelayModulation.setControlCallback(onDelayModulation);
    knbDelayStereoWidth.setControlCallback(onDelayStereoWidth);

    // ==========================================
    // CHORUS CONTROLS
    // ==========================================
    const var knbChorusMix = Content.getComponent("knbChorusMix");
    const var knbChorusVoices = Content.getComponent("knbChorusVoices");
    const var knbChorusRate = Content.getComponent("knbChorusRate");
    const var knbChorusDepth = Content.getComponent("knbChorusDepth");
    const var knbChorusFeedback = Content.getComponent("knbChorusFeedback");
    const var knbChorusDelayTime = Content.getComponent("knbChorusDelayTime");
    const var knbChorusTone = Content.getComponent("knbChorusTone");

    inline function onChorusMix(component, value) { setFXParam(fxChorus, "Mix", value); }
    inline function onChorusVoices(component, value) { setFXParam(fxChorus, "Voices", value); }
    inline function onChorusRate(component, value) { setFXParam(fxChorus, "Rate", value); }
    inline function onChorusDepth(component, value) { setFXParam(fxChorus, "Depth", value); }
    inline function onChorusFeedback(component, value) { setFXParam(fxChorus, "Feedback", value); }
    inline function onChorusDelayTime(component, value) { setFXParam(fxChorus, "DelayTime", value); }
    inline function onChorusTone(component, value) { setFXParam(fxChorus, "Tone", value); }

    knbChorusMix.setControlCallback(onChorusMix);
    knbChorusVoices.setControlCallback(onChorusVoices);
    knbChorusRate.setControlCallback(onChorusRate);
    knbChorusDepth.setControlCallback(onChorusDepth);
    knbChorusFeedback.setControlCallback(onChorusFeedback);
    knbChorusDelayTime.setControlCallback(onChorusDelayTime);
    knbChorusTone.setControlCallback(onChorusTone);

    // ==========================================
    // RINGMOD CONTROLS
    // ==========================================
    const var knbRingmodMode = Content.getComponent("knbRingmodMode");
    const var knbRingmodMix = Content.getComponent("knbRingmodMix");
    const var knbRingmodFrequency = Content.getComponent("knbRingmodFrequency");
    const var knbRingmodDepth = Content.getComponent("knbRingmodDepth");
    const var knbRingmodLFORate = Content.getComponent("knbRingmodLFORate");
    const var knbRingmodLFODepth = Content.getComponent("knbRingmodLFODepth");
    const var knbRingmodFilterFrequency = Content.getComponent("knbRingmodFilterFrequency");

    inline function onRingmodMode(component, value) { setFXParam(fxRingmod, "Mode", value); }
    inline function onRingmodMix(component, value) { setFXParam(fxRingmod, "Mix", value); }
    inline function onRingmodFrequency(component, value) { setFXParam(fxRingmod, "Frequency", value); }
    inline function onRingmodDepth(component, value) { setFXParam(fxRingmod, "Depth", value); }
    inline function onRingmodLFORate(component, value) { setFXParam(fxRingmod, "LFORate", value); }
    inline function onRingmodLFODepth(component, value) { setFXParam(fxRingmod, "LFODepth", value); }
    inline function onRingmodFilterFrequency(component, value) { setFXParam(fxRingmod, "FilterFrequency", value); }

    knbRingmodMode.setControlCallback(onRingmodMode);
    knbRingmodMix.setControlCallback(onRingmodMix);
    knbRingmodFrequency.setControlCallback(onRingmodFrequency);
    knbRingmodDepth.setControlCallback(onRingmodDepth);
    knbRingmodLFORate.setControlCallback(onRingmodLFORate);
    knbRingmodLFODepth.setControlCallback(onRingmodLFODepth);
    knbRingmodFilterFrequency.setControlCallback(onRingmodFilterFrequency);

    // ==========================================
    // PRE-FX / UTILITIES
    // ==========================================
    const var knbGateThreshold = Content.getComponent("knbGateThreshold");
    const var knbGateAttack = Content.getComponent("knbGateAttack");
    const var knbGateRelease = Content.getComponent("knbGateRelease");
    const var knbTranspose = Content.getComponent("knbTranspose");
    const var knbOctave = Content.getComponent("knbOctave");
    const var knbChugStrength = Content.getComponent("knbChugStrength");
    const var knbPickStrength = Content.getComponent("knbPickStrength");

    inline function onGateThreshold(component, value) { setFXParam(fxGate, "Threshold", value); }
    inline function onGateAttack(component, value) { setFXParam(fxGate, "Attack", value); }
    inline function onGateRelease(component, value) { setFXParam(fxGate, "Release", value); }
    inline function onTranspose(component, value) { 
        local ratio = Math.pow(2.0, value / 12.0);
        setFXParam(fxTranspose, "FreqRatio", ratio); 
    }
    inline function onOctave(component, value) { setFXParam(fxOctave, "Octave", value); }
    inline function onChugStrength(component, value) { setFXParam(fxChug, "Strength", value); }
    inline function onPickStrength(component, value) { setFXParam(fxPick, "Strength", value); }

    knbGateThreshold.setControlCallback(onGateThreshold);
    knbGateAttack.setControlCallback(onGateAttack);
    knbGateRelease.setControlCallback(onGateRelease);
    knbTranspose.setControlCallback(onTranspose);
    knbOctave.setControlCallback(onOctave);
    knbChugStrength.setControlCallback(onChugStrength);
    knbPickStrength.setControlCallback(onPickStrength);

    // ==========================================
    // MONO / STEREO OPTIMIZATION CONTROL
    // ==========================================
    inline function setMonoProcessing(isMono)
    {
        local v = isMono ? 1.0 : 0.0;
        setFXParam(fxAmp, "Mono", v);
        setFXParam(fxOverdrive, "Mono", v);
    }

    // ==========================================
    // MODULAR SECTIONS & BYPASS CONTROLS
    // ==========================================
    const var btnModularA = Content.getComponent("btnModularA");
    const var btnModularB = Content.getComponent("btnModularB");
    const var btnModularC = Content.getComponent("btnModularC");
    const var btnModularD = Content.getComponent("btnModularD");
    const var btnModularE = Content.getComponent("btnModularE");
    const var btnModularF = Content.getComponent("btnModularF");
    const var btnModularG = Content.getComponent("btnModularG");

    const var btnBypassModularA = Content.getComponent("btnBypassModularA");
    const var btnBypassModularB = Content.getComponent("btnBypassModularB");
    const var btnBypassModularC = Content.getComponent("btnBypassModularC");
    const var btnBypassModularD = Content.getComponent("btnBypassModularD");
    const var btnBypassModularE = Content.getComponent("btnBypassModularE");
    const var btnBypassModularF = Content.getComponent("btnBypassModularF");
    const var btnBypassModularG = Content.getComponent("btnBypassModularG");

    const var modControlsA = [
        knbOverdriveMode, knbOverdriveDrive, knbOverdriveTone, 
        knbOverdriveFoldAmount, knbOverdriveBits, knbOverdriveSRReduction, 
        knbOverdriveCircuitBend, knbOverdriveMix, knbOverdriveOutputGain
    ];

    const var modControlsB = [
        knbAmpMode, knbAmpInput, knbAmpLow, knbAmpMid, 
        knbAmpHigh, knbAmpPresence, knbAmpOutput, 
        cmbAmpCleanToneStackMode, cmbAmpDirtyToneStackMode, cmbAmpDirtyDistortionMode
    ];

    const var modControlsC = [
        knbCabMix, knbCabAGain, knbCabAPan, knbCabAAxis, knbCabADistance, knbCabADelay,
        knbCabBGain, knbCabBPan, knbCabBAxis, knbCabBDistance, knbCabBDelay
    ];

    const var modControlsD = [
        knbReverbMix, knbReverbPreDelay, knbReverbRoomSize, 
        knbReverbDecay, knbReverbDampingFrequency, knbReverbChorusDepth
    ];

    const var modControlsE = [
        knbDelayMode, knbDelayMix, knbDelayDelayTime, knbDelayFeedback, 
        knbDelayDamping, knbDelayModulation, knbDelayStereoWidth
    ];

    const var modControlsF = [
        knbChorusMix, knbChorusVoices, knbChorusRate, knbChorusDepth, 
        knbChorusFeedback, knbChorusDelayTime, knbChorusTone
    ];

    const var modControlsG = [
        knbRingmodMode, knbRingmodMix, knbRingmodFrequency, knbRingmodDepth, 
        knbRingmodLFORate, knbRingmodLFODepth, knbRingmodFilterFrequency
    ];

    inline function setControlListVisibility(list, visibility)
    {

      /*  for (c in list)
        {
            c.set("visible", isVis);
        }*/
    }
    
    const var PnlModulators = [Content.getComponent("pnlModularA"),
                               Content.getComponent("pnlModularB"),
                               Content.getComponent("pnlModularC"),
                               Content.getComponent("pnlModularD"),
                               Content.getComponent("pnlModularE"),
                               Content.getComponent("pnlModularF"),
                               Content.getComponent("pnlModularG"),
                               Content.getComponent("pnlPreEQ"),
                               Content.getComponent("pnlPostEQ")];
    
    const var btnPreEQ = Content.getComponent("btnPreEQ");
    const var btnPostEQ = Content.getComponent("btnPostEQ");
    
    const var preEQ = Synth.getEffect("preEQ");
    const var postEQ = Synth.getEffect("postEQ");

inline function onbtnBypassPreEQControl(component, value)
{
	if(!value){
		preEQ.setBypassed(true);
	}else{
		preEQ.setBypassed(false);
	}
};

Content.getComponent("btnBypassPreEQ").setControlCallback(onbtnBypassPreEQControl);

    
   inline function onbtnBypassPostEQControl(component, value)
   {
   	if(!value){
   		postEQ.setBypassed(true);
   	}else{
   		postEQ.setBypassed(false);
   	}
   };
   
   Content.getComponent("btnBypassPostEQ").setControlCallback(onbtnBypassPostEQControl);
   
    
    

	showModularSection(1);
	

    inline function showModularSection(index)
    {
		btnModularA.setValue(index == 0 ? 1 : 0);
		btnModularB.setValue(index == 1 ? 1 : 0);
		btnModularC.setValue(index == 2 ? 1 : 0);
		btnModularD.setValue(index == 3 ? 1 : 0);
		btnModularE.setValue(index == 4 ? 1 : 0);
		btnModularF.setValue(index == 5 ? 1 : 0);
		btnModularG.setValue(index == 6 ? 1 : 0);
        if (btnPreEQ != 0) btnPreEQ.setValue(index == 7 ? 1 : 0);
        if (btnPostEQ != 0) btnPostEQ.setValue(index == 8 ? 1 : 0);

        for (Modulator in PnlModulators){
	        if (Modulator != 0)
                Modulator.set("visible", false);
        }
        
        if (PnlModulators[index] != 0)
            PnlModulators[index].set("visible", true);
    }

    inline function onBtnModularA(component, value) { if (value) showModularSection(0); else component.setValue(1); }
    inline function onBtnModularB(component, value) { if (value) showModularSection(1); else component.setValue(1); }
    inline function onBtnModularC(component, value) { if (value) showModularSection(2); else component.setValue(1); }
    inline function onBtnModularD(component, value) { if (value) showModularSection(3); else component.setValue(1); }
    inline function onBtnModularE(component, value) { if (value) showModularSection(4); else component.setValue(1); }
    inline function onBtnModularF(component, value) { if (value) showModularSection(5); else component.setValue(1); }
    inline function onBtnModularG(component, value) { if (value) showModularSection(6); else component.setValue(1); }
    inline function onBtnPreEQ(component, value) { if (value) showModularSection(7); else component.setValue(1); }
    inline function onBtnPostEQ(component, value) { if (value) showModularSection(8); else component.setValue(1); }

    btnModularA.setControlCallback(onBtnModularA);
    btnModularB.setControlCallback(onBtnModularB);
    btnModularC.setControlCallback(onBtnModularC);
    btnModularD.setControlCallback(onBtnModularD);
    btnModularE.setControlCallback(onBtnModularE);
    btnModularF.setControlCallback(onBtnModularF);
    btnModularG.setControlCallback(onBtnModularG);
    if (btnPreEQ != 0)
        btnPreEQ.setControlCallback(onBtnPreEQ);
    if (btnPostEQ != 0)
        btnPostEQ.setControlCallback(onBtnPostEQ);

    // Bypass Callbacks: value 1 = Bypassed (turned off), 0 = Active
    inline function onBypassModularA(component, value) { if (fxOverdrive != 0) fxOverdrive.setBypassed(value > 0.5); }
    inline function onBypassModularB(component, value) { if (fxAmp != 0) fxAmp.setBypassed(value > 0.5); }
    inline function onBypassModularC(component, value) { if (fxCab != 0) fxCab.setBypassed(value > 0.5); }
    inline function onBypassModularD(component, value) { if (fxReverb != 0) fxReverb.setBypassed(value > 0.5); }
    inline function onBypassModularE(component, value) { if (fxDelay != 0) fxDelay.setBypassed(value > 0.5); }
    inline function onBypassModularF(component, value) { if (fxChorus != 0) fxChorus.setBypassed(value > 0.5); }
    inline function onBypassModularG(component, value) { if (fxRingmod != 0) fxRingmod.setBypassed(value > 0.5); }

    btnBypassModularA.setControlCallback(onBypassModularA);
    btnBypassModularB.setControlCallback(onBypassModularB);
    btnBypassModularC.setControlCallback(onBypassModularC);
    btnBypassModularD.setControlCallback(onBypassModularD);
    btnBypassModularE.setControlCallback(onBypassModularE);
    btnBypassModularF.setControlCallback(onBypassModularF);
    btnBypassModularG.setControlCallback(onBypassModularG);

    // ==========================================
    // FX PRESET SAVE & LOAD SYSTEM
    // ==========================================
    const var btnSaveFXPreset = Content.getComponent("btnSaveFXPreset");
    const var btnLoadFXPreset = Content.getComponent("btnLoadFXPreset");
    const var lblFXPresetName = Content.getComponent("lblFXPresetName");

    // Comprehensive list of all FX parameters to save and restore
    const var fxControlsMap = [
        // Amp
        { id: "knbAmpMode", comp: knbAmpMode },
        { id: "knbAmpInput", comp: knbAmpInput },
        { id: "knbAmpLow", comp: knbAmpLow },
        { id: "knbAmpMid", comp: knbAmpMid },
        { id: "knbAmpHigh", comp: knbAmpHigh },
        { id: "knbAmpPresence", comp: knbAmpPresence },
        { id: "knbAmpOutput", comp: knbAmpOutput },
        { id: "cmbAmpCleanToneStackMode", comp: cmbAmpCleanToneStackMode },
        { id: "cmbAmpDirtyToneStackMode", comp: cmbAmpDirtyToneStackMode },
        { id: "cmbAmpDirtyDistortionMode", comp: cmbAmpDirtyDistortionMode },

        // Overdrive
        { id: "knbOverdriveMode", comp: knbOverdriveMode },
        { id: "knbOverdriveDrive", comp: knbOverdriveDrive },
        { id: "knbOverdriveTone", comp: knbOverdriveTone },
        { id: "knbOverdriveFoldAmount", comp: knbOverdriveFoldAmount },
        { id: "knbOverdriveBits", comp: knbOverdriveBits },
        { id: "knbOverdriveSRReduction", comp: knbOverdriveSRReduction },
        { id: "knbOverdriveCircuitBend", comp: knbOverdriveCircuitBend },
        { id: "knbOverdriveMix", comp: knbOverdriveMix },
        { id: "knbOverdriveOutputGain", comp: knbOverdriveOutputGain },

        // Cab
        { id: "knbCabMix", comp: knbCabMix },
        { id: "knbCabAGain", comp: knbCabAGain },
        { id: "knbCabAPan", comp: knbCabAPan },
        { id: "knbCabAAxis", comp: knbCabAAxis },
        { id: "knbCabADistance", comp: knbCabADistance },
        { id: "knbCabADelay", comp: knbCabADelay },
        { id: "knbCabBGain", comp: knbCabBGain },
        { id: "knbCabBPan", comp: knbCabBPan },
        { id: "knbCabBAxis", comp: knbCabBAxis },
        { id: "knbCabBDistance", comp: knbCabBDistance },
        { id: "knbCabBDelay", comp: knbCabBDelay },

        // Reverb
        { id: "knbReverbMix", comp: knbReverbMix },
        { id: "knbReverbPreDelay", comp: knbReverbPreDelay },
        { id: "knbReverbRoomSize", comp: knbReverbRoomSize },
        { id: "knbReverbDecay", comp: knbReverbDecay },
        { id: "knbReverbDampingFrequency", comp: knbReverbDampingFrequency },
        { id: "knbReverbChorusDepth", comp: knbReverbChorusDepth },

        // Delay
        { id: "knbDelayMode", comp: knbDelayMode },
        { id: "knbDelayMix", comp: knbDelayMix },
        { id: "knbDelayDelayTime", comp: knbDelayDelayTime },
        { id: "knbDelayFeedback", comp: knbDelayFeedback },
        { id: "knbDelayDamping", comp: knbDelayDamping },
        { id: "knbDelayModulation", comp: knbDelayModulation },
        { id: "knbDelayStereoWidth", comp: knbDelayStereoWidth },

        // Chorus
        { id: "knbChorusMix", comp: knbChorusMix },
        { id: "knbChorusVoices", comp: knbChorusVoices },
        { id: "knbChorusRate", comp: knbChorusRate },
        { id: "knbChorusDepth", comp: knbChorusDepth },
        { id: "knbChorusFeedback", comp: knbChorusFeedback },
        { id: "knbChorusDelayTime", comp: knbChorusDelayTime },
        { id: "knbChorusTone", comp: knbChorusTone },

        // Ringmod
        { id: "knbRingmodMode", comp: knbRingmodMode },
        { id: "knbRingmodMix", comp: knbRingmodMix },
        { id: "knbRingmodFrequency", comp: knbRingmodFrequency },
        { id: "knbRingmodDepth", comp: knbRingmodDepth },
        { id: "knbRingmodLFORate", comp: knbRingmodLFORate },
        { id: "knbRingmodLFODepth", comp: knbRingmodLFODepth },
        { id: "knbRingmodFilterFrequency", comp: knbRingmodFilterFrequency },

        // Utilities
        { id: "knbGateThreshold", comp: knbGateThreshold },
        { id: "knbGateAttack", comp: knbGateAttack },
        { id: "knbGateRelease", comp: knbGateRelease },
        { id: "knbTranspose", comp: knbTranspose },
        { id: "knbOctave", comp: knbOctave },
        { id: "knbChugStrength", comp: knbChugStrength },
        { id: "knbPickStrength", comp: knbPickStrength },

        // Module Bypass switches
        { id: "btnBypassModularA", comp: btnBypassModularA },
        { id: "btnBypassModularB", comp: btnBypassModularB },
        { id: "btnBypassModularC", comp: btnBypassModularC },
        { id: "btnBypassModularD", comp: btnBypassModularD },
        { id: "btnBypassModularE", comp: btnBypassModularE },
        { id: "btnBypassModularF", comp: btnBypassModularF },
        { id: "btnBypassModularG", comp: btnBypassModularG }
    ];

    inline function onFileSavePreset(file)
    {
        if (!isDefined(file))
            return;

        var targetFile = file;
        if (targetFile.toString(2) != ".json")
            targetFile = targetFile.withFileExtension(".json");

        var preset = {};
        preset.version = 1;
        var params = {};

        for (entry in fxControlsMap)
        {
            if (entry.comp != 0)
            {
                params[entry.id] = entry.comp.getValue();
            }
        }
        preset.parameters = params;

        // Save Cab IR paths and display names
        preset.cabA = {
            path: currentCabAPath,
            name: (lblCabAName != 0) ? lblCabAName.get("text") : ""
        };
        preset.cabB = {
            path: currentCabBPath,
            name: (lblCabBName != 0) ? lblCabBName.get("text") : ""
        };

        // Save CurveEQ states (all dynamic filter nodes, frequencies, gains, Qs)
        if (fxPreEQ != 0)
            preset.preEQState = fxPreEQ.exportState();
        if (fxPostEQ != 0)
            preset.postEQState = fxPostEQ.exportState();

        var success = targetFile.writeObject(preset);
        if (success)
        {
            if (lblFXPresetName != 0)
                lblFXPresetName.set("text", targetFile.toString(3));
            Console.print("AltarFX: Saved preset to " + targetFile.toString(0));
        }
        else
        {
            Console.print("AltarFX: Failed to write preset file!");
        }
    }

    inline function onFileLoadPreset(file)
    {
        if (!isDefined(file))
            return;

        var preset = file.loadAsObject();
        if (!isDefined(preset))
        {
            Console.print("AltarFX: Could not load JSON data from file.");
            return;
        }

        // 1. Restore all parameters
        if (isDefined(preset.parameters))
        {
            for (entry in fxControlsMap)
            {
                if (entry.comp != 0 && isDefined(preset.parameters[entry.id]))
                {
                    entry.comp.setValue(preset.parameters[entry.id]);
                    entry.comp.changed(); // Triggers DSP parameter update!
                }
            }
        }

        // 2. Restore Cab IR A
        if (isDefined(preset.cabA))
        {
            currentCabAPath = isDefined(preset.cabA.path) ? preset.cabA.path : "";
            var cabAName = isDefined(preset.cabA.name) ? preset.cabA.name : "";

            if (cabAName != "" && lblCabAName != 0)
                lblCabAName.set("text", cabAName);

            if (currentCabAPath != "")
            {
                if (aspModularC != 0)
                {
                    local slotA = aspModularC.getAudioFile(0);
                    if (slotA != 0)
                        slotA.loadFile(currentCabAPath);
                }
                else if (audioFileCabA != 0)
                {
                    audioFileCabA.loadFile(currentCabAPath);
                }
            }
        }

        // 3. Restore Cab IR B
        if (isDefined(preset.cabB))
        {
            currentCabBPath = isDefined(preset.cabB.path) ? preset.cabB.path : "";
            var cabBName = isDefined(preset.cabB.name) ? preset.cabB.name : "";

            if (cabBName != "" && lblCabBName != 0)
                lblCabBName.set("text", cabBName);

            if (currentCabBPath != "")
            {
                if (aspModularC != 0)
                {
                    local slotB = aspModularC.getAudioFile(1);
                    if (slotB != 0)
                        slotB.loadFile(currentCabBPath);
                }
                else if (audioFileCabB != 0)
                {
                    audioFileCabB.loadFile(currentCabBPath);
                }
            }
        }

        // 4. Restore CurveEQ states
        if (isDefined(preset.preEQState) && fxPreEQ != 0)
            fxPreEQ.restoreState(preset.preEQState);
        if (isDefined(preset.postEQState) && fxPostEQ != 0)
            fxPostEQ.restoreState(preset.postEQState);

        if (lblFXPresetName != 0)
            lblFXPresetName.set("text", file.toString(3));
        Console.print("AltarFX: Successfully loaded preset " + file.toString(3));
    }

    inline function saveFXPreset()
    {
        FileSystem.browse(FileSystem.getFolder(FileSystem.UserPresets), true, "*.json", onFileSavePreset);
    }

    inline function loadFXPreset()
    {
        FileSystem.browse(FileSystem.getFolder(FileSystem.UserPresets), false, "*.json", onFileLoadPreset);
    }

    inline function onBtnSaveFXPreset(component, value)
    {
        if (value)
            saveFXPreset();
    }

    inline function onBtnLoadFXPreset(component, value)
    {
        if (value)
            loadFXPreset();
    }

    if (btnSaveFXPreset != 0)
        btnSaveFXPreset.setControlCallback(onBtnSaveFXPreset);

    if (btnLoadFXPreset != 0)
        btnLoadFXPreset.setControlCallback(onBtnLoadFXPreset);

    // Initialize display state (shows Overdrive, hides all others)
    //showModularSection(0);
    showModularSection(1);
    btnModularB.setValue(true);
}
