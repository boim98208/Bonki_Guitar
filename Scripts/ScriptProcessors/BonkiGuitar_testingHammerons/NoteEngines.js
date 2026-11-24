 Synth.deferCallbacks(false);
 Synth.setFixNoteOnAfterNoteOff(true);

const var DEBUGMODEENABLED = false;

inline function debugPrint(msg)
{
	if (DEBUGMODEENABLED)
	{
		Console.print(msg);
	}
}

// Note buffer and chord voicing configuration
var excludeOpenStringsFromFretSpread = false; // If true, exclude fret 0 from fret spread and leftmost fret calculation; if false, include it
var UPTIME_CHORD_THRESHOLD = 0.002; // 2 ms (0.002s) buffer threshold for simultaneous note detection. Can be tuned down to 0.001 (1 ms) or 0.00005 (50 microseconds)
var chordArrivalCount = 0;
 
 
 Content.makeFrontInterface(800, 400);
 
 const var LegatoDecayGraph = Content.addTable("LegatoDecayGraph", 10, 10);
 LegatoDecayGraph.set("width", 260);
 LegatoDecayGraph.set("height", 120);
 //LegatoDecayGraph.reset();
 //LegatoDecayGraph.setTablePoint(0, 0.0, 1.0, 0.35);
 //LegatoDecayGraph.setTablePoint(1, 1.0, 0.0, 0.5);
 
 reg i = 0;
 reg linearRRCounter = 1;
 
 //Emulated releases didn't go as well as planned. But I'll keep it here for now
 Globals.g_emulatedReleasesOn = false;
 
 
include("NoteRangeAndOpenStringNote.js");

include("KeyswitchConstants.js");

// Pre-reserved scratch arrays for audio thread chord buffering and voicing
const var clusterIndices = [];
clusterIndices.reserve(128);

const var chordNotes = [];
chordNotes.reserve(128);

const var chordVelocities = [];
chordVelocities.reserve(128);

const var chordBestStrings = [];
chordBestStrings.reserve(128);

const var chordBestFrets = [];
chordBestFrets.reserve(128);

const var chordCandStrings = [];
chordCandStrings.reserve(128);

const var chordCandFrets = [];
chordCandFrets.reserve(128);

const var chordStrChoice = [];
chordStrChoice.reserve(128);

const var oldStringNoteId = [];
oldStringNoteId.reserve(128);

// Pre-reserved scratch arrays for polyphonic legato portamento voice matching
const var activeStrings = [];
activeStrings.reserve(128);

const var activeNotes = [];
activeNotes.reserve(128);

const var targetSlid = [];
targetSlid.reserve(128);

const var usedActive = [];
usedActive.reserve(128);

const var sortedTargetNotes = [];
sortedTargetNotes.reserve(128);

const var sortedTargetVels = [];
sortedTargetVels.reserve(128);

const var MAX_MATCH_TARGETS = 128;
const var matchEdgeValid = [];
const var matchEdgeCost = [];
matchEdgeValid.reserve(NUMOFSTRINGS);
matchEdgeCost.reserve(NUMOFSTRINGS);
for (var mIdx = 0; mIdx < NUMOFSTRINGS; mIdx++)
{
    matchEdgeValid.push([]);
    matchEdgeValid[mIdx].reserve(MAX_MATCH_TARGETS);
    matchEdgeCost.push([]);
    matchEdgeCost[mIdx].reserve(MAX_MATCH_TARGETS);
    for (var tIdx = 0; tIdx < MAX_MATCH_TARGETS; tIdx++)
    {
        matchEdgeValid[mIdx].push(0);
        matchEdgeCost[mIdx].push(0.0);
    }
}

const var matchActiveToTarget = [];
matchActiveToTarget.reserve(128);

const var matchTargetToActive = [];
matchTargetToActive.reserve(128);

const var bfDistL = [];
bfDistL.reserve(128);

const var bfDistR = [];
bfDistR.reserve(128);

const var bfParentL = [];
bfParentL.reserve(128);

const var bfParentR = [];
bfParentR.reserve(128);


Globals.g_stringPerformance = [];
Globals.g_stringPerformance.reserve(NUMOFSTRINGS * 2);
for(var i = 0; i < NUMOFSTRINGS * 2; i++){
	Globals.g_stringPerformance.push(PerformanceType.SUSTAIN);
}
 

var legatoKeySwitchPlaying = false;
 
 // setting up keyswitches to mute samplers
 
inline function createAllMutersArray(articulationName){
	local arrayToReturn = [];
	local LeftMuter = Synth.getMidiProcessor("Left" + articulationName + "ContainerMute");
	local RightMuter = Synth.getMidiProcessor("Right" + articulationName + "ContainerMute");
	
	arrayToReturn.reserve(2);
	
	arrayToReturn.push(LeftMuter);
	arrayToReturn.push(RightMuter);

	return arrayToReturn;
}
 
const var susSamplerName = "Sus";
  
const var muteSamplerName = "Mute";

const var harmonicSamplerName = "Harmonic";
  
const var tremoloSamplerName = "Tremolo";

const var legatoSamplerName = "Legato";

 
 // skipping SFX samplers for now. Do later if it exists
 
const var AllSusMuters = createAllMutersArray(susSamplerName);
const var AllMuteMuters = createAllMutersArray(muteSamplerName);
const var AllHarmonicMuters = createAllMutersArray(harmonicSamplerName);
const var AllLegatoMuters = createAllMutersArray(legatoSamplerName);

// I'll need to do some reworking for anything timestretching
//const var AllTremoloMuters = createAllMutersArray(tremoloSamplerName);
 
 


//sfxcontainermute has been disabled because I might just have it be constantly available


const var AllContainerMuters = [];
AllContainerMuters.reserve(PerformanceType.NUMOFPERFORMANCES);

for(i = 0; i < PerformanceType.NUMOFPERFORMANCES; i++){
	AllContainerMuters.push(-1);
}

AllContainerMuters[PerformanceType.SUSTAIN] = AllSusMuters;
AllContainerMuters[PerformanceType.MUTE] = AllMuteMuters;
AllContainerMuters[PerformanceType.HARMONIC] = AllHarmonicMuters;
AllContainerMuters[PerformanceType.TREMOLO] = AllTremoloMuters;
AllContainerMuters[PerformanceType.LEGATOUP] = AllLegatoMuters;
AllContainerMuters[PerformanceType.LEGATODOWN] = AllLegatoMuters;
AllContainerMuters[PerformanceType.LEGATO] = AllLegatoMuters;


const var NUMOFKEYSWITCHES = 4;

 
 inline function setAllSamplersMuted(){
 
	 for(var i = 0; i < AllContainerMuters.length; i++){ 
		if(AllContainerMuters[i] != -1){
			for(var j = 0; j < AllContainerMuters[i].length; j++){
				AllContainerMuters[i][j].setAttribute(0, 1.0);
			}
		}
	 }
 }
 
 inline function setSamplerUnmuted(articulationIndex){
	 if(AllContainerMuters[articulationIndex] == -1){
		 if (DEBUGMODEENABLED) Console.print("articulation doesn't have muter or doesn't exist");
	 }else{
		 for(var i = 0; i < AllContainerMuters[articulationIndex].length; i++){
		 
			 	AllContainerMuters[articulationIndex][i].setAttribute(0, 0.0);
		 }
	 }
 }
 
 inline function setSamplerMuted(articulationIndex){
	 if(AllContainerMuters[articulationIndex] != -1){
		 for(var i = 0; i < AllContainerMuters[articulationIndex].length; i++){
		 
			 	AllContainerMuters[articulationIndex][i].setAttribute(0, 1.0);
		 }
	 }
 }
 
 Globals.g_currArticulationPlaying = PerformanceType.SUSTAIN;
 
 inline function detectKeySwitch(notePlayed){
	 
 
	if(!isBetweenIncl(notePlayed, SUSTAINKEYSWITCHNOTE, LEGATOKEYSWITCHNOTE))
	{
		//keyswitch was not pressed
		return 0;
	}
	
	
	
	setAllSamplersMuted();
	 
	 //emulated releases probably only work on sustains so set off by default
	 Globals.g_emulatedReleasesOn = false;
	 
	 if(notePlayed == SUSTAINKEYSWITCHNOTE){
	 
		 setSamplerUnmuted(PerformanceType.SUSTAIN);
		Globals.g_currArticulationPlaying = PerformanceType.SUSTAIN; 
		 Globals.g_emulatedReleasesOn = true;
	 }else if(notePlayed == MUTEKEYSWITCHNOTE){
	 
		 setSamplerUnmuted(PerformanceType.MUTE);
		 Globals.g_currArticulationPlaying = PerformanceType.MUTE;
		 
	 }else if(notePlayed == HARMONICKEYSWITCHNOTE){
		 
		 setSamplerUnmuted(PerformanceType.HARMONIC);
		 Globals.g_currArticulationPlaying = PerformanceType.HARMONIC;
	 }else if(notePlayed == TREMOLOKEYSWITCHNOTE){
		 
		 setSamplerUnmuted(PerformanceType.TREMOLO);
		 Globals.g_currArticulationPlaying = PerformanceType.TREMOLO;
	 }else if(notePlayed == LEGATOKEYSWITCHNOTE){
		 // setSamplerUnmuted is dictated by the note played in the playNextNoteLegato function
		 
		 legatoKeySwitchPlaying = true;
		 Globals.g_currArticulationPlaying = PerformanceType.LEGATOGENERAL;
// for now do legato down because there's no samplers for LEGATOGENERAL. Later make it so that LEGATOGENERAL can be used and can still increment the things
	 } else if(notePlayed == SFXKEYSWITCHNOTE){
	 
		 Globals.g_currArticulationPlaying = PerformanceType.SFX;
		 
	 }
	 
 }
 
 
 
 detectKeySwitch(SUSTAINKEYSWITCHNOTE);
 

 
 //variables to correspond with the Fretdisplay
 
 //please refactor this later to all just be an array
 Globals.g_handPositionFret = 0;
 Globals.g_stringNotes = [];
 Globals.g_stringNotes.reserve(NUMOFSTRINGS * 2);
 
 for(i = 0; i < NUMOFSTRINGS * 2; i++){
	 Globals.g_stringNotes.push(-1);
 }
 
 


 /*
     stringNotes holds the note played by each string
    on each index. Index 0 holds note played by string 1 
    (the high string) while index 5 holds note played by
    string 6 (the low string)
 */
const var stringNote = [];
stringNote.reserve(NUMOFSTRINGS * 2 + 1);

const var stringNoteId = [];
stringNoteId.reserve(NUMOFSTRINGS * 2 + 1);

const var indivNoteStrumIds = [];
indivNoteStrumIds.reserve(NUMOFSTRINGS);

const var notePlayedMethod = [];
notePlayedMethod.reserve(g_NUMOFSTRINGS * 2 + 1);

const var eventIds = Engine.createMidiList();
eventIds.fill(NO_NOTE); 



// use this to check for upcoming notes now please
inline function getActiveEventIds(resultList)
{
    for (i = 0; i < 128; i++)
    {
        local id = eventIds.getValue(i);
        if (id != -1)
            resultList.push(id);
    }
}

var currStrummingDirection = StrummingDirections.notStrumming;
var downStrumHeld = false;
var upStrumHeld = false;


stringNote.reserve(NUMOFSTRINGS);
for(i = 0; i < NUMOFSTRINGS * 2; i++){
	stringNote.push(NO_NOTE);
	stringNoteId.push(NO_NOTE);
	notePlayedMethod.push(NO_NOTE);
}

//one more push to make up for the "NOSTRING" and not go out of bounds when scanning string notes

stringNote.push(POSINFINITY);


for(i = 0; i < NUMOFSTRINGS; i++){
	indivNoteStrumIds.push(NO_NOTE);
}


// ==============================================================================
// Setting up portamento
// Every portamento value follows the order of Direction x String x Note
// ==============================================================================

const var DEFAULT_TRANSIT_MS = 22.0;
const var HARDCODED_CROSSFADE_MS = 5.0;
const var NUM_LEGATO_DIRECTIONS = 2;

// 3-D Metadata Arrays (2 directions x NUMOFSTRINGS rows x 128 columns)
// Dimension 0: 0 = LegatoDirection.LegatoUp, 1 = LegatoDirection.LegatoDown
// Dimension 1: string index 0..(NUMOFSTRINGS - 1)
// Dimension 2: note number 0..127
const var transitDurations = [];
transitDurations.reserve(NUM_LEGATO_DIRECTIONS);

const var sampleStartOffsets = [];
sampleStartOffsets.reserve(NUM_LEGATO_DIRECTIONS);

const var sampleArrivalOffsets = [];
sampleArrivalOffsets.reserve(NUM_LEGATO_DIRECTIONS);

// Per-String State & Event ID Arrays (dynamically sized by NUMOFSTRINGS)
const var eventIdArray = [];
eventIdArray.reserve(NUMOFSTRINGS);

const var slideStepNotes = [];
slideStepNotes.reserve(NUMOFSTRINGS);

const var reachedLastNote = [];
reachedLastNote.reserve(NUMOFSTRINGS);

const var slideStartTimeSec = [];
slideStartTimeSec.reserve(NUMOFSTRINGS);

const var slideTotalDurationMS = [];
slideTotalDurationMS.reserve(NUMOFSTRINGS);

const var slideDestinationVoiceId = [];
slideDestinationVoiceId.reserve(NUMOFSTRINGS);

const var slideStartFret = [];
slideStartFret.reserve(NUMOFSTRINGS);

const var stringNoteStartTime = [];
stringNoteStartTime.reserve(NUMOFSTRINGS);

var isSustainPedalDown = false;
const var pedalHeldStrings = [];
pedalHeldStrings.reserve(NUMOFSTRINGS);

for (var dIdx = 0; dIdx < NUM_LEGATO_DIRECTIONS; dIdx++)
{
    transitDurations.push([]);
    transitDurations[dIdx].reserve(NUMOFSTRINGS);
    
    sampleStartOffsets.push([]);
    sampleStartOffsets[dIdx].reserve(NUMOFSTRINGS);
    
    sampleArrivalOffsets.push([]);
    sampleArrivalOffsets[dIdx].reserve(NUMOFSTRINGS);
    
    for (var sIdx = 0; sIdx < NUMOFSTRINGS; sIdx++)
    {
        transitDurations[dIdx].push([]);
        transitDurations[dIdx][sIdx].reserve(128);
        
        sampleStartOffsets[dIdx].push([]);
        sampleStartOffsets[dIdx][sIdx].reserve(128);
        
        sampleArrivalOffsets[dIdx].push([]);
        sampleArrivalOffsets[dIdx][sIdx].reserve(128);
        
        for (var cIdx = 0; cIdx < 128; cIdx++)
        {
            transitDurations[dIdx][sIdx].push(DEFAULT_TRANSIT_MS);
            sampleStartOffsets[dIdx][sIdx].push(0);
            sampleArrivalOffsets[dIdx][sIdx].push(0);
        }
    }
}

for (var sIdx = 0; sIdx < NUMOFSTRINGS; sIdx++)
{
    eventIdArray.push([]);
    eventIdArray[sIdx].reserve(128);
    
    slideStepNotes.push([]);
    slideStepNotes[sIdx].reserve(128);
    
    reachedLastNote.push(true);
    slideStartTimeSec.push(0.0);
    slideTotalDurationMS.push(0.0);
    slideDestinationVoiceId.push(NO_NOTE);
    slideStartFret.push(NO_NOTE);
    stringNoteStartTime.push(0.0);
    pedalHeldStrings.push(false);
}

// Startup verification to confirm independent array instances per string
eventIdArray[0].push(-999);
if (eventIdArray.length > 1 && eventIdArray[1].length > 0)
{
    if (DEBUGMODEENABLED) Console.print("eventIdArray rows are aliased!");
}
else
{
    if (DEBUGMODEENABLED) Console.print("eventIdArray dynamically initialized for " + NUMOFSTRINGS + " strings (rows verified independent).");
}
eventIdArray[0].clear();


// This is extremely cringe but for some reason I just can't do JSON file importing right so I'm hardcoding all portamento values and automating the writing of that hardcoded text from another script. If anybody can fix this, please tell me

// Hardcoded Transit Times for the values of transitDurations, sampleStartOffsets, and sampleArrivalOffsets. 
// LegatoDirection.LegatoUp == 0, LegatoDirection.LegatoDown == 1
include("LegatoData.js");






inline function linMap(value, inMin, inMax, outMin, outMax)
{
    return outMin + (value - inMin) * (outMax - outMin) / (inMax - inMin);
}

inline function stringEnumToMidiChannel(stringEnum)
{
    return stringEnum + 1;
}

inline function handlePedalRelease()
{
    for (var s = 0; s < NUMOFSTRINGS; s++)
    {
        if (pedalHeldStrings[s])
        {
            pedalHeldStrings[s] = false;
            noteOffStringSound(s, stringNote, stringNoteId);
            noteOffStringHolder(s, stringNote, stringNoteId);
        }
    }
}

/**
 * Terminates all active and queued slide notes for a specific string.
 * Checks reachedLastNote for early-release vs normal release, fading out
 * active voices and muting future queued notes to prevent volume explosions.
 */
inline function endSlide(stringIndex)
{
    local currentTimeSec = Engine.getUptime();
    local elapsedMS = (currentTimeSec - slideStartTimeSec[stringIndex]) * 1000.0;
    local destId = slideDestinationVoiceId[stringIndex];
    local isAct = (destId != NO_NOTE) ? Synth.isArtificialEventActive(destId) : false;
    
    reachedLastNote[stringIndex] = (destId != NO_NOTE) && ((elapsedMS >= slideTotalDurationMS[stringIndex]) || isAct);

    if (DEBUGMODEENABLED)
    {
        Console.print("[endSlide CALLED] str=" + stringIndex + " destId=" + destId + " isAct=" + isAct + " elapsedMS=" + elapsedMS + " totalMS=" + slideTotalDurationMS[stringIndex] + " reached=" + reachedLastNote[stringIndex]);
    }
    
    local targetEvArray = eventIdArray[stringIndex];
    local evIdx;
    
    if (reachedLastNote[stringIndex])
    {
        // Reached destination note: fade out cleanly
        if (destId != NO_NOTE)
        {
            if (isAct)
            {
                Synth.addVolumeFade(destId, 25, -100);
                Synth.noteOffDelayedByEventId(destId, Engine.getSamplesForMilliSeconds(25));
            }
            else
            {
                Synth.noteOffByEventId(destId);
            }
        }

        // Terminate any remaining intermediate step IDs
        for (evIdx = 0; evIdx < targetEvArray.length; evIdx++)
        {
            local remId = targetEvArray[evIdx];
            if (remId > 0 && remId != destId)
            {
                Synth.noteOffByEventId(remId);
            }
        }
    }
    else
    {
        // Early release before reaching destination note:
        // 1. Seamlessly fade out currently active intermediate voice
        for (evIdx = 0; evIdx < targetEvArray.length; evIdx++)
        {
            local activeEvId = targetEvArray[evIdx];
            if (activeEvId > 0 && Synth.isArtificialEventActive(activeEvId))
            {
                Synth.addVolumeFade(activeEvId, 25, -100);
                Synth.noteOffDelayedByEventId(activeEvId, Engine.getSamplesForMilliSeconds(25));
            }
        }
        
        // 2. Note off every other note that is coming in, and mute to -100 dB
        for (evIdx = 0; evIdx < targetEvArray.length; evIdx++)
        {
            local queuedEvId = targetEvArray[evIdx];
            if (queuedEvId > 0)
            {
                Synth.noteOffByEventId(queuedEvId);
                if (Synth.isArtificialEventActive(queuedEvId))
                {
                    Synth.addVolumeFade(queuedEvId, 5, -100);
                }
            }
        }
    }
    
    targetEvArray.clear();
    slideStepNotes[stringIndex].clear();
    slideDestinationVoiceId[stringIndex] = NO_NOTE;
    slideStartFret[stringIndex] = NO_NOTE;
    slideTotalDurationMS[stringIndex] = 0.0;
    slideStartTimeSec[stringIndex] = 0.0;
    stringNoteStartTime[stringIndex] = 0.0;
    pedalHeldStrings[stringIndex] = false;
}

const var legatoMessageHolder = Engine.createMessageHolder();

var LEGATO_MAX_DECAY_TIME_SEC = 7;
var LEGATO_DECAY_FLOOR_DB = -15.0;
var isRealisticSlideVolEnabled = true;


/**
 * Calculates the attenuated gain in decibels for a legato transition
 * based on elapsed time since the note was initially plucked.
 * Uses the interactive UI Table (LegatoDecayGraph) with an inverse exponential fallback.
 */
inline function getDecayGainDB(elapsedSec)
{
    if (!isRealisticSlideVolEnabled)
        return 0.0;
        
    local normTime = elapsedSec / LEGATO_MAX_DECAY_TIME_SEC;
    if (normTime < 0.0) normTime = 0.0;
    if (normTime > 1.0) normTime = 1.0;
    
    local decayFactor = LegatoDecayGraph.getTableValue(normTime);
    
    // Safety fallback: if table returns uninitialized/zero value at t=0, use exponential curve
    if (normTime < 0.02 && decayFactor <= 0.001)
    {
        decayFactor = Math.exp(-2.5 * normTime);
    }
    
    local gainDB = (1.0 - decayFactor) * LEGATO_DECAY_FLOOR_DB;
    return gainDB;
}

/**
 * Executes a multi-fret portamento slide (upwards or downwards) on a specific string.
 * Supports chaining where an in-flight or sustained destination note
 * becomes the starting note for the next legato note.
 */
inline function triggerSlide(stringIndex, startNote, endNote, targetEventIdArray, velocity)
{
    local slideChannel = stringEnumToMidiChannel(stringIndex);
    local prevVoiceId = stringNoteId[stringIndex];
    if (prevVoiceId == NO_NOTE && targetEventIdArray.length > 0)
    {
        prevVoiceId = targetEventIdArray[targetEventIdArray.length - 1];
    }
    
    local targetStepNoteArray = slideStepNotes[stringIndex];
    local effectiveStart = startNote;
    local evIdx;
    
    // Check if an in-flight intermediate note in the queue is currently sounding
    if (slideStartFret[stringIndex] != NO_NOTE)
    {
        for (evIdx = 0; evIdx < targetEventIdArray.length; evIdx++)
        {
            local chkId = targetEventIdArray[evIdx];
            if (chkId > 0 && Synth.isArtificialEventActive(chkId))
            {
                prevVoiceId = chkId;
                if (evIdx < targetStepNoteArray.length)
                {
                    effectiveStart = targetStepNoteArray[evIdx];
                }
            }
        }
    }
    
    // Update slideStartFret for this new slide
    slideStartFret[stringIndex] = effectiveStart;
    
    local initialOverlapSamples = Engine.getSamplesForMilliSeconds(HARDCODED_CROSSFADE_MS);
    
    // Release previous active voice with smooth overlap
    if (prevVoiceId != NO_NOTE)
    {
        if (Synth.isArtificialEventActive(prevVoiceId))
        {
            Synth.noteOffDelayedByEventId(prevVoiceId, initialOverlapSamples);
        }
        else
        {
            Synth.noteOffByEventId(prevVoiceId);
        }
    }
    
    // Terminate any queued/stale voices in this string's queue except the active voice
    for (evIdx = 0; evIdx < targetEventIdArray.length; evIdx++)
    {
        local oldEvId = targetEventIdArray[evIdx];
        if (oldEvId > 0 && oldEvId != prevVoiceId)
        {
            Synth.noteOffByEventId(oldEvId);
            if (Synth.isArtificialEventActive(oldEvId))
            {
                Synth.addVolumeFade(oldEvId, 5, -100);
            }
        }
    }
    targetEventIdArray.clear();
    targetStepNoteArray.clear();
    
    local baseTimestamp = Message.getTimestamp();
    local interval = endNote - effectiveStart;
    if (DEBUGMODEENABLED)
    {
        Console.print("[triggerSlide] str=" + stringIndex + " (ch=" + slideChannel + ") start=" + startNote + " effStart=" + effectiveStart + " end=" + endNote + " interval=" + interval + " isUp=" + (interval > 0) + " numSteps=" + Math.abs(interval) + " baseTs=" + baseTimestamp);
    }
    if (interval == 0)
        return;
        
    local isUp = (interval > 0);
    local direction = isUp ? LegatoDirection.LegatoUp : LegatoDirection.LegatoDown;
    local numSteps = Math.abs(interval);
    
    local currentOffsetSamples = 0;
    local speedFactor = linMap(velocity, 1, 127, 1.8, 0.55);
    local stepNote;
    local stepDurMS;
    local stepDurSamples;
    local stepOverlapSamples = Engine.getSamplesForMilliSeconds(HARDCODED_CROSSFADE_MS);
    local isLastStep;
    local voiceId;
    local step;
    
    if (stringNoteStartTime[stringIndex] <= 0.0)
    {
        stringNoteStartTime[stringIndex] = Engine.getUptime();
    }
    
    for (step = 0; step < numSteps; step++)
    {
        if (isUp)
            stepNote = effectiveStart + 1 + step;
        else
            stepNote = effectiveStart - 1 - step;
            
        isLastStep = (step == numSteps - 1);
        
        local durLookupNote = isUp ? stepNote : (stepNote + 1);
        if (durLookupNote > 127) durLookupNote = 127;
        if (durLookupNote < 0) durLookupNote = 0;
        
        stepDurMS = transitDurations[direction][stringIndex][durLookupNote] * speedFactor;
        stepDurSamples = Engine.getSamplesForMilliSeconds(stepDurMS);
        
        local dirVel = isUp ? LegatoDirection.LegatoUpVel : LegatoDirection.LegatoDownVel;
        legatoMessageHolder.setType(1); // 1 = NoteOn
        legatoMessageHolder.setChannel(slideChannel);
        legatoMessageHolder.setNoteNumber(stepNote);
        legatoMessageHolder.setVelocity(dirVel);
        legatoMessageHolder.setTimestamp(baseTimestamp + currentOffsetSamples);
        
        if (isRealisticSlideVolEnabled)
        {
            local offsetSec = currentOffsetSamples / Engine.getSampleRate();
            local elapsedSec = (Engine.getUptime() - stringNoteStartTime[stringIndex]) + offsetSec;
            if (elapsedSec < 0.0) elapsedSec = 0.0;
            local stepGainDB = getDecayGainDB(elapsedSec);
            legatoMessageHolder.setGain(Math.round(stepGainDB));
        }
        else
        {
            legatoMessageHolder.setGain(0);
        }
        
        voiceId = Synth.addMessageFromHolder(legatoMessageHolder);
        targetEventIdArray.push(voiceId);
        targetStepNoteArray.push(stepNote);
        
        if (DEBUGMODEENABLED)
        {
            Console.print("  [triggerSlide step] str=" + stringIndex + " step=" + step + "/" + numSteps + " note=" + stepNote + " vel=" + dirVel + " isLast=" + isLastStep + " ts=" + (baseTimestamp + currentOffsetSamples) + " durMS=" + stepDurMS + " voiceId=" + voiceId);
        }
        
        if (!isLastStep)
        {
            Synth.noteOffDelayedByEventId(voiceId, currentOffsetSamples + stepDurSamples + stepOverlapSamples);
            if (DEBUGMODEENABLED)
            {
                Console.print("  [triggerSlide noteOffDelayed] voiceId=" + voiceId + " delaySamples=" + (currentOffsetSamples + stepDurSamples + stepOverlapSamples));
            }
            currentOffsetSamples += stepDurSamples;
        }
        else
        {
            slideDestinationVoiceId[stringIndex] = voiceId;
            slideTotalDurationMS[stringIndex] = (currentOffsetSamples / Engine.getSampleRate()) * 1000.0;
            slideStartTimeSec[stringIndex] = Engine.getUptime();
            reachedLastNote[stringIndex] = false;
            if (DEBUGMODEENABLED)
            {
                Console.print("  [triggerSlide DEST] str=" + stringIndex + " destVoiceId=" + voiceId + " destNote=" + stepNote + " totalDurMS=" + slideTotalDurationMS[stringIndex]);
            }
        }
    }
}


inline function triggerLegato(stringIndex, startNote, endNote, targetEventIdArray, velocity)
{
    triggerSlide(stringIndex, startNote, endNote, targetEventIdArray, velocity);
}


inline function resetNotes(){
	for(var i = 0; i < stringNote.length - 1; i++){
		stringNote[i] = NO_NOTE;
	}
	for(var s = 0; s < NUMOFSTRINGS; s++){
		stringNoteStartTime[s] = 0.0;
		pedalHeldStrings[s] = false;
		if (eventIdArray[s].length > 0)
		{
			endSlide(s);
		}
	}
	isSustainPedalDown = false;
}

Message.setAllNotesOffCallback(resetNotes);





// GUI TO HELP ME DEBUG





var lastStringPlayed = StringType.LOWESTSTRING;

// functions to ensure only one sampler plays a voice at a time
// this should only take the StringType enum
inline function playString(stringToPlay){
	

	Message.ignoreEvent(true);
	local stringChannelToSend = stringEnumToMidiChannel(stringToPlay);
	lastStringPlayed = stringToPlay;
	
	if (stringToPlay < NUMOFSTRINGS)
	{
		pedalHeldStrings[stringToPlay] = false;
		if (eventIdArray[stringToPlay].length > 0)
		{
			endSlide(stringToPlay);
		}
		else if (stringNoteId[stringToPlay] != NO_NOTE)
		{
			Synth.noteOffByEventId(stringNoteId[stringToPlay]);
			stringNoteId[stringToPlay] = NO_NOTE;
		}
	}
	 
	// consider refactoring stringNote to be updated here rather than the melody fretting point
	
	if(!Globals.g_strummingModeOn){
	Globals.g_stringActiveRRs[stringToPlay] = getActiveRRPlayed(stringToPlay);
		
		if(stringChannelToSend < 1 || stringChannelToSend > 16){
			return false;
		}
	
		stringNoteId[stringToPlay] = Synth.addNoteOn(stringChannelToSend, Message.getNoteNumber(), Message.getVelocity(), 0);
		notePlayedMethod[stringToPlay] = StringPlayingMethod.pianoRoll;
		incrementRR(stringToPlay);
	}
	
	
	
	Globals.g_stringNotes[stringToPlay] = Message.getNoteNumber();
	
	
	
	// adding 1 because the enum starts on 0 but channels start on 1

	Message.setChannel(stringEnumToMidiChannel(stringToPlay));
}

inline function playChordString(stringToPlay, noteToPlay, velocityToPlay){
	local stringChannelToSend = stringEnumToMidiChannel(stringToPlay);
	lastStringPlayed = stringToPlay;
	
	if (stringToPlay < NUMOFSTRINGS)
	{
		pedalHeldStrings[stringToPlay] = false;
		if (eventIdArray[stringToPlay].length > 0)
		{
			endSlide(stringToPlay);
		}
		else if (stringNoteId[stringToPlay] != NO_NOTE)
		{
			Synth.noteOffByEventId(stringNoteId[stringToPlay]);
			stringNoteId[stringToPlay] = NO_NOTE;
		}
	}
	
	if(!Globals.g_strummingModeOn){
		Globals.g_stringActiveRRs[stringToPlay] = getActiveRRPlayed(stringToPlay);
		
		if(stringChannelToSend < 1 || stringChannelToSend > 16){
			return false;
		}
	
		stringNoteId[stringToPlay] = Synth.addNoteOn(stringChannelToSend, noteToPlay, velocityToPlay, 0);
		notePlayedMethod[stringToPlay] = StringPlayingMethod.pianoRoll;
		incrementRR(stringToPlay);
	}
	
	Globals.g_stringNotes[stringToPlay] = noteToPlay;
}

inline function incrementRR(stringToPlay){
	if(Globals.g_currRRBehaviour == RRBehaviour.LINEAR){
		linearRR_incrementSamplersRR(stringToPlay);
	}else if(Globals.g_currRRBehaviour == RRBehaviour.RANDOM){
		randomRR_incrementSamplersRR(stringToPlay);
	}
}

inline function noteOffStringHolder(stringToOff, stringNotesToUpdate, stringIdsToUpdate){
	// adding 1 because the enum starts on 0 but channels start on 1


	Globals.g_stringNotes[stringToOff] = NO_NOTE;
	
	stringNotesToUpdate[stringToOff] = NO_NOTE;
	
	if(notePlayedMethod[stringToOff] == StringPlayingMethod.pianoRoll){
	stringIdsToUpdate[stringToOff] = NO_NOTE;
	}
}

inline function getActiveRRPlayed(stringToPlay){

	local currArticulation = Globals.g_currArticulationPlaying;
	local currRandomRRCounter = randomRRCounters[currArticulation];
	
	
	if(Globals.g_currRRBehaviour == RRBehaviour.LINEAR){
		return linearRRCounter;
	}else if(Globals.g_currRRBehaviour == RRBehaviour.RANDOM){
		
		if(numOfRRs[Globals.g_currArticulationPlaying] <= 2){
			return linearRRCounter;
		}else{
			return randomRRsToGoThrough[currArticulation][currRandomRRCounter];
		}
	}
}

inline function noteOffStringSound(stringToOff, stringNotesToUpdate, stringIdsToUpdate){
	if (DEBUGMODEENABLED)
	{
		Console.print("[noteOffStringSound] str=" + stringToOff + " note=" + stringNotesToUpdate[stringToOff] + " id=" + stringIdsToUpdate[stringToOff] + " evLen=" + (stringToOff < NUMOFSTRINGS ? eventIdArray[stringToOff].length : -1));
	}
	Globals.g_stringActiveRRs[stringToOff] = NO_NOTE;
	if (stringToOff < NUMOFSTRINGS && eventIdArray[stringToOff].length > 0)
	{
		endSlide(stringToOff);
	}
	else
	{
		Synth.noteOffByEventId(stringIdsToUpdate[stringToOff]);
		if (stringToOff < NUMOFSTRINGS)
		{
			stringNoteStartTime[stringToOff] = 0.0;
		}
	}
}



inline function updateGlobalStringNote(stringToUpdate, notePlayed, RRPlayed){
	Globals.g_stringNotes[stringToUpdate] = notePlayed;
}
 

 

 

 
 inline function isPolyphonyPlaying(){
 
	 for(i = 0; i < NUMOFSTRINGS; i++){
		 if(stringNote[i] != NO_NOTE){
			 return true;
		 }
	 }
	 
	 return false;
 }
 
 
 // fretting engine designed for going low to high string then going back down
 // used primarily for quick debugging 
 
 inline function primitiveFretting(notePlayed){
 
	 if (stringNote[StringType.STRING6] == NO_NOTE){
	 	playString6();
	 	stringNote[StringType.STRING6] = notePlayed;
	 	updateGlobals();
	 	return;
	 }else if (stringNote[StringType.STRING5] == NO_NOTE){
	 	playString5();
	 	stringNote[StringType.STRING5] = notePlayed;
	 	updateGlobals();
	 	return;
	 }else if (stringNote[StringType.STRING4] == NO_NOTE){
	 	playString4();
	 	stringNote[StringType.STRING4] = notePlayed;
	 	updateGlobals();
	 	return;
	 }else if (stringNote[StringType.STRING3] == NO_NOTE){
	 	playString3();
	 	stringNote[StringType.STRING3] = notePlayed;
	 	updateGlobals();
	 	return;
	 }else if (stringNote[StringType.STRING2] == NO_NOTE){
	 	playString2();
	 	stringNote[StringType.STRING2] = notePlayed;
	 	updateGlobals();
	 	return;
	 }else if (stringNote[StringType.STRING1] == NO_NOTE){
	 	playString1();
	 	stringNote[StringType.STRING1] = notePlayed;
	 	updateGlobals();
	 	return;
	 }
	 
	 
 }


const var isStringEnabled = [];
isStringEnabled.reserve(NUMOFSTRINGS + 1);
for(i = 0; i < NUMOFSTRINGS + 1; i++){
	isStringEnabled.push(true);
}

/* 
The main logic for the "Natural" fretting mode in polyphony
*/
inline function stringWithClosestNote(notePlayed, currentHandPos, currArticPlaying){
	
	// there's still something going on with string selection that makes it just go beyond 1 and 16 even when there's no avialable string
	
	local currString = StringType.NOSTRING;
	//arbitrary big number to replace later
	local currDist = POSINFINITY;
	local distToCompare;
	

	
	for(i = NUMOFSTRINGS - 1; i > -1; i--){

	
		if(stringNote[i] == -1 && isBetweenIncl(notePlayed, OPENSTRINGNOTES[i] + articLowestFretOnString[i][currArticPlaying], OPENSTRINGNOTES[i] + articHighestFretOnString[i][currArticPlaying]) && isStringEnabled[i]){
		


		// the - 2 fixes it for some reason. It seems that without it the system just straight up misses notes
		
		distToCompare = Math.abs((notePlayed - OPENSTRINGNOTES[i] - 2) - currentHandPos);
		

		
			if(Math.min(currDist, distToCompare) == distToCompare)
			{
				currString = i;
				currDist = distToCompare;
			}
		}
		

	}
	

	
	// setting up debugging possibly
	
	
	
	if(currString > 16){
		return 16;
	}else{
	
	return currString;
	
	}
	
	
}



/* 
The main logic for the "Melody" fretting mode
*/

// melodyStringWeight allows you to prioritze one string over another. The higher the weight, the less it'll play that string. The lower the weight, like making it negative, the more it'll play that string
const var melodyStringWeight = [];
melodyStringWeight.reserve(NUMOFSTRINGS + 1);
for(i = 0; i < NUMOFSTRINGS + 1; i++){
	melodyStringWeight.push(0);
}
melodyStringWeight[StringType.STRING8] = 5;
melodyStringWeight[StringType.STRING7] = 5;
melodyStringWeight[StringType.STRING1] = -5;


inline function stringWithMelodyNote(notePlayed, currentHandPos, currArticPlaying)
{
	local currString = StringType.NOSTRING;
	local currDist = POSINFINITY;
	local distToCompare;
	local stringFromBottom;
	local targetNote;

	local NOTES_PER_STRING = 6;
	local halfSpan = (NOTES_PER_STRING - 1) * 0.5;
	local ascendingOrder = OPENSTRINGNOTES[0] < OPENSTRINGNOTES[NUMOFSTRINGS - 1];
	local lowestOpenNote = ascendingOrder ? OPENSTRINGNOTES[0] : OPENSTRINGNOTES[NUMOFSTRINGS - 1];

	for (i = NUMOFSTRINGS - 1; i > -1; i--)
	{
		if (stringNote[i] == -1 && isBetweenIncl(notePlayed,
			OPENSTRINGNOTES[i] + articLowestFretOnString[i][currArticPlaying],
			OPENSTRINGNOTES[i] + articHighestFretOnString[i][currArticPlaying]) && isStringEnabled[i])
		{
			stringFromBottom = ascendingOrder ? i : (NUMOFSTRINGS - 1) - i;
			targetNote = lowestOpenNote + currentHandPos + (stringFromBottom * NOTES_PER_STRING) + halfSpan;
			distToCompare = Math.abs(notePlayed - targetNote) + melodyStringWeight[i];

			if (distToCompare < currDist)
			{
				currString = i;
				currDist = distToCompare;
			}
		}
	}

	return currString;
}


inline function forceStringLogic(notePlayed, currentHandPos, fretSpaceToChange, currArticPlaying)
{



	local newFretFromForceString;
	local distanceBetweenForceAndAutoFret;
	


	if(stringNote[Globals.g_forcedString] == NO_NOTE)
	{
	

	
	stringNote[Globals.g_forcedString] = notePlayed; 
	playString(Globals.g_forcedString);
	Globals.g_stringPerformance[Globals.g_forcedString] = Globals.g_currArticulationPlaying;
	

	
	newFretFromForceString = notePlayed - OPENSTRINGNOTES[Globals.g_forcedString];
	distanceBetweenForceAndAutoFret = Math.abs(newFretFromForceString - currentHandPos);
	
	//changes fret position if forceString's frets go a certain distance
	if(distanceBetweenForceAndAutoFret < fretSpaceToChange)
		{
		return currentHandPos;
		}
	else
		{
	// originally condition was greater than 17. still not sure why it bugs out without the cap
		if(newFretFromForceString > NOTESPERSTRING - 5)
			return NOTESPERSTRING - 5;
		else
			return newFretFromForceString;
		}
		
	}
	
}




/*
Natural chord fretting engine:
Finds the chord voicing with the least fret spread across strictly ascending strings.
Supports forced string, forced hand position, and open-string preference.
*/
inline function naturalChordFretting(chordNotes, chordVelocities, currentHandPos, currArticPlaying)
{
	local K = chordNotes.length;
	if (K == 0)
		return currentHandPos;
		
	if (K > NUMOFSTRINGS)
		K = NUMOFSTRINGS;
		
	local i;
	local j;
	
	// 1. Sort chord notes ascending by pitch, maintaining velocity alignment
	for (i = 0; i < K - 1; i++)
	{
		for (j = 0; j < K - 1 - i; j++)
		{
			if (chordNotes[j] > chordNotes[j + 1])
			{
				local tempN = chordNotes[j];
				chordNotes[j] = chordNotes[j + 1];
				chordNotes[j + 1] = tempN;
				
				local tempV = chordVelocities[j];
				chordVelocities[j] = chordVelocities[j + 1];
				chordVelocities[j + 1] = tempV;
			}
		}
	}
	
	// Best voicing candidate tracking using pre-reserved scratch arrays
	chordBestStrings.clear();
	chordBestFrets.clear();
	local bestSpread = POSINFINITY;
	local bestLeftmost = POSINFINITY;
	local bestInWindow = -1;
	local bestLeftSlant = POSINFINITY;
	local bestRightSlant = -1;
	local bestDistToHand = POSINFINITY;
	local bestHasForcedString = false;
	local foundVoicing = false;
	
	// Iterative search for all string assignments: s[0] > s[1] > ... > s[K-1]
	// s[depth] in 0..7 (7 = String 8 lowest pitch, 0 = String 1 highest pitch)
	chordStrChoice.clear();
	for (i = 0; i < NUMOFSTRINGS; i++)
		chordStrChoice.push(0);
		
	local depth = 0;
	chordStrChoice[0] = NUMOFSTRINGS; // Will be decremented to 7 on first step
	
	while (depth >= 0)
	{
		chordStrChoice[depth]--;
		local minAllowed = K - 1 - depth;
		local foundValidForDepth = false;
		
		while (chordStrChoice[depth] >= minAllowed)
		{
			local s = chordStrChoice[depth];
			local n = chordNotes[depth];
			local fret = n - OPENSTRINGNOTES[s];
			
			// Check if note is playable on string s
			local lowBound = OPENSTRINGNOTES[s] + articLowestFretOnString[s][currArticPlaying];
			local highBound = OPENSTRINGNOTES[s] + articHighestFretOnString[s][currArticPlaying];
			
			if (n >= lowBound && n <= highBound && fret >= 0 && fret < NOTESPERSTRING && isStringEnabled[s])
			{
				foundValidForDepth = true;
				break;
			}
			chordStrChoice[depth]--;
		}
		
		if (foundValidForDepth)
		{
			if (depth == K - 1)
			{
				// Complete candidate voicing found! Evaluate it using pre-reserved scratch arrays:
				chordCandStrings.clear();
				chordCandFrets.clear();
				
				for (j = 0; j < K; j++)
				{
					local candS = chordStrChoice[j];
					chordCandStrings.push(candS);
					chordCandFrets.push(chordNotes[j] - OPENSTRINGNOTES[candS]);
				}
				
				// Check forced string
				local candHasForced = false;
				if (Globals.g_forcedString != NO_STRING)
				{
					for (j = 0; j < K; j++)
					{
						if (chordCandStrings[j] == Globals.g_forcedString)
						{
							candHasForced = true;
							break;
						}
					}
				}
				
				// Measure fret spread and leftmost fret
				local candMinFret = POSINFINITY;
				local candMaxFret = -1;
				local hasFrettedNote = false;
				
				for (j = 0; j < K; j++)
				{
					local f = chordCandFrets[j];
					if (excludeOpenStringsFromFretSpread && f == 0)
						continue;
					hasFrettedNote = true;
					if (f < candMinFret) candMinFret = f;
					if (f > candMaxFret) candMaxFret = f;
				}
				
				if (!hasFrettedNote)
				{
					candMinFret = 0;
					candMaxFret = 0;
				}
				
				local candSpread = candMaxFret - candMinFret;
				local candLeftmost = candMinFret;
				
				// Slant calculation (guitar chord ergonomics: favor dots going up and to the right)
				local candLeftSlant = 0;
				local candRightSlant = 0;
				local bassFret = chordCandFrets[0];
				for (j = 1; j < K; j++)
				{
					local cf = chordCandFrets[j];
					if (excludeOpenStringsFromFretSpread && cf == 0)
						continue;
					if (bassFret != 0)
					{
						if (cf < bassFret)
							candLeftSlant += (bassFret - cf);
						else if (cf > bassFret)
							candRightSlant += (cf - bassFret);
					}
				}

				// Count frets in forced hand position window [forcedFret, forcedFret + 5]
				local candInWindow = 0;
				if (Globals.g_forcedHandPositionFret != -1)
				{
					local winLow = Globals.g_forcedHandPositionFret;
					local winHigh = winLow + 5;
					for (j = 0; j < K; j++)
					{
						local cfWin = chordCandFrets[j];
						if (cfWin >= winLow && cfWin <= winHigh)
							candInWindow++;
					}
				}
				
				// Distance to hand position with - 2 bias (from naturalFretting: Math.abs((fret - 2) - handPos))
				local targetHand = (Globals.g_forcedHandPositionFret != -1) ? Globals.g_forcedHandPositionFret : currentHandPos;
				local candDist = Math.abs((candLeftmost - 2) - targetHand);

				// Determine if cand is better than best
				local isBetter = false;
				
				if (!foundVoicing)
				{
					isBetter = true;
				}
				else if (Globals.g_forcedString != NO_STRING && candHasForced != bestHasForcedString)
				{
					// Voicing with forced string takes priority
					isBetter = candHasForced;
				}
				else if (Globals.g_forcedHandPositionFret != -1)
				{
					// 1. Most frets in [forcedFret, forcedFret + 5]
					if (candInWindow > bestInWindow)
					{
						isBetter = true;
					}
					else if (candInWindow == bestInWindow)
					{
						// 2. Tie-breaker: least fret spread
						if (candSpread < bestSpread)
						{
							isBetter = true;
						}
						else if (candSpread == bestSpread)
						{
							// 3. Avoid awkward backward reaches ("to the left and top left")
							if (candLeftSlant < bestLeftSlant)
							{
								isBetter = true;
							}
							else if (candLeftSlant == bestLeftSlant)
							{
								// 4. Favor natural reaches ("up and to the right")
								if (candRightSlant > bestRightSlant)
								{
									isBetter = true;
								}
								else if (candRightSlant == bestRightSlant)
								{
									// 5. Closest to forcedHandPositionFret with -2 bias
									if (candDist < bestDistToHand)
										isBetter = true;
								}
							}
						}
					}
				}
				else
				{
					// Normal mode: least fret spread, then least backward slant, then rightward slant, then closest to currentHandPos with -2 bias
					if (candSpread < bestSpread)
					{
						isBetter = true;
					}
					else if (candSpread == bestSpread)
					{
						if (candLeftSlant < bestLeftSlant)
						{
							isBetter = true;
						}
						else if (candLeftSlant == bestLeftSlant)
						{
							if (candRightSlant > bestRightSlant)
							{
								isBetter = true;
							}
							else if (candRightSlant == bestRightSlant)
							{
								if (candDist < bestDistToHand)
									isBetter = true;
							}
						}
					}
				}
				
				if (isBetter)
				{
					chordBestStrings.clear();
					chordBestFrets.clear();
					for (j = 0; j < K; j++)
					{
						chordBestStrings.push(chordCandStrings[j]);
						chordBestFrets.push(chordCandFrets[j]);
					}
					bestSpread = candSpread;
					bestLeftmost = candLeftmost;
					bestInWindow = candInWindow;
					bestLeftSlant = candLeftSlant;
					bestRightSlant = candRightSlant;
					bestDistToHand = candDist;
					bestHasForcedString = candHasForced;
					foundVoicing = true;
				}
			}
			else
			{
				depth++;
				chordStrChoice[depth] = chordStrChoice[depth - 1];
			}
		}
		else
		{
			depth--;
		}
	}
	
	if (!foundVoicing)
	{
		// Fallback if no clean chord voicing found across ascending strings
		for (i = 0; i < K; i++)
		{
			naturalFretting2_2_1(chordNotes[i], currentHandPos, currArticPlaying);
		}
		return currentHandPos;
	}
	
	// Calculate newHandPos
	// Change currentHandPos if voicing goes > currentHandPos + 5 or < currentHandPos - 2
	local newHandPos = currentHandPos;
	local minCheck = POSINFINITY;
	local maxCheck = -1;
	local hasAnyFretted = false;
	
	for (j = 0; j < K; j++)
	{
		local fretVal = chordBestFrets[j];
		if (excludeOpenStringsFromFretSpread && fretVal == 0)
			continue;
		hasAnyFretted = true;
		if (fretVal < minCheck) minCheck = fretVal;
		if (fretVal > maxCheck) maxCheck = fretVal;
	}
	if (!hasAnyFretted)
	{
		minCheck = 0;
		maxCheck = 0;
	}
	
	if (maxCheck > currentHandPos + 5 || minCheck < currentHandPos - 2)
	{
		newHandPos = minCheck;
	}
	else
	{
		newHandPos = currentHandPos;
	}
	
	if (Globals.g_forcedHandPositionFret != -1)
	{
		newHandPos = Globals.g_forcedHandPositionFret;
	}
	
	if (newHandPos < 0)
		newHandPos = 0;
		
	// Assign and sound all notes in winning voicing
	for (j = 0; j < K; j++)
	{
		local st = chordBestStrings[j];
		local nt = chordNotes[j];
		local vl = chordVelocities[j];
		
		stringNote[st] = nt;
		Globals.g_stringPerformance[st] = Globals.g_currArticulationPlaying;
		playChordString(st, nt, vl);
	}
	
	return newHandPos;
}



/* 
fretting choice to be as close as possible to the fret position. 
Designed for leads interspersed with chords or simple voicings in the "Natural" fretting mode
Will change fret position if polyphony leads to a really far fret
*/

// the function returns the next fret for the algorithm and sets the message's midi channel
inline function naturalFretting2_2_1(notePlayed, currentHandPos, currArticPlaying)
{
	
	

	local distBetweenNewFretAndAutoFret = 0;
	local newFretFromPolyphony;
	
	// I've completely forgotten what fretSpaceToChange was
	// but I think it has to do polyphony
	local fretSpaceToChange = 2;
	local stringToPlay;
	local newHandPos;
	local forceStringLowBound;
	local forceStringHighBound;
	local forceStringWorked;
	
	if(!isBetweenIncl(notePlayed, LOWESTNOTE, HIGHESTNOTE)){
	    return currentHandPos;
	}
	
	
	//Going to force string mode
	if(Globals.g_forcedString != NO_STRING)
	{


	// Yes, that -1 of NOTESPERSTRING is needed.
	forceStringLowBound = OPENSTRINGNOTES[Globals.g_forcedString] + articLowestFretOnString[Globals.g_forcedString][currArticPlaying];
	forceStringHighBound = OPENSTRINGNOTES[Globals.g_forcedString] + articHighestFretOnString[Globals.g_forcedString][currArticPlaying];
	
		if(isBetweenIncl(notePlayed, forceStringLowBound, forceStringHighBound) && stringNote[Globals.g_forcedString] == -1)
		{

		
			return forceStringLogic(notePlayed, currentHandPos, fretSpaceToChange, Globals.g_currArticulationPlaying);
			
		}
	}
	
	
	//no forced string and therefore just goes as normal
	
	
	stringToPlay = stringWithClosestNote(notePlayed, currentHandPos, currArticPlaying);
	stringNote[stringToPlay] = notePlayed;
	Globals.g_stringPerformance[stringToPlay] = Globals.g_currArticulationPlaying;
	
	playString(stringToPlay);
	

	
	//when there's polyphony, virtual guitarist moves hand to wherever the biggest change in pos is
	if(Synth.getNumPressedKeys() >= 2 && stringToPlay != StringType.NOSTRING){
	//change fret position to suit the chord fingering more.
	
	newFretFromPolyphony = stringNote[stringToPlay] - OPENSTRINGNOTES[stringToPlay];
	distBetweenNewFretAndAutoFret = Math.abs(newFretFromPolyphony - currentHandPos);
	}else{
	
	
	
		if(stringToPlay == StringType.STRING1){
			if(notePlayed - currentHandPos < OPENSTRING1NOTE + 5)
	       		return currentHandPos;
	        else
	        {
	        	newHandPos = notePlayed - OPENSTRING1NOTE - 4;
	            return newHandPos;
	         }
		}
		
		if(stringToPlay == StringType.LOWESTSTRING){
			if(notePlayed < currentHandPos + OPENSTRINGNOTES[StringType.LOWESTSTRING]){
				newHandPos = notePlayed - OPENSTRINGNOTES[StringType.LOWESTSTRING];
				return newHandPos;
			
			}
		}
	
	}
	
	//I dont really understand why, but + 2 seems like a number that makes this work
	
	if(distBetweenNewFretAndAutoFret < fretSpaceToChange + 2)
	{

		return currentHandPos;
	}else
	{

			return cap(notePlayed - OPENSTRINGNOTES[stringToPlay], NOTESPERSTRING - 5);
		
	}

	
	if (DEBUGMODEENABLED)
	{
		Console.print("~~  new start  ~~");
		for(var j = 0; j < NUMOFSTRINGS; j++){
			Console.print(stringNote[j]);
		}
	}
	
}


/* 
fretting choice that likes to lean more to being on the same string. 
Designed for timbre jumps in lead or melody playing, especially when monophonic. 

Stiiiiill kinda rough tho. It likes to skip strings a little too much it seems. 
The logic on choosing between strings needs to weigh the closer strings more than the closest fret

*/

inline function melodyFretting1_0_0(notePlayed, currentHandPos)
{
	
	local distBetweenNewFretAndAutoFret = 0;
	local newFretFromPolyphony;
	local fretSpaceToChange = 10;
	local stringToPlay;
	local newHandPos;
	
	if(!isBetweenIncl(notePlayed, LOWESTNOTE, HIGHESTNOTE)){
	    return currentHandPos;
	}
	
	
	//Going to force string mode
	if(Globals.g_forcedString != NO_STRING)
	{

	local forceStringLowBound = OPENSTRINGNOTES[Globals.g_forcedString] + articLowestFretOnString[Globals.g_forcedString][currArticPlaying];
	local forceStringHighBound = OPENSTRINGNOTES[Globals.g_forcedString] + articHighestFretOnString[Globals.g_forcedString][currArticPlaying];
	
		if(isBetweenIncl(notePlayed, forceStringLowBound, forceStringHighBound) && stringNote[Globals.g_forcedString] == -1){
		
			return forceStringLogic(notePlayed, currentHandPos, fretSpaceToChange, Globals.g_currArticulationPlaying);
			
		}
	}
	
	
	//no forced string and therefore just goes as normal
	
	
	stringToPlay = stringWithMelodyNote(notePlayed, currentHandPos, Globals.g_currArticulationPlaying);
	stringNote[stringToPlay] = notePlayed;
	Globals.g_stringPerformance[stringToPlay] = Globals.g_currArticulationPlaying;
	
	local fretPlayed = stringNote[stringToPlay] - OPENSTRINGNOTES[stringToPlay];
	
	playString(stringToPlay);
	
	
	
	//when there's polyphony, virtual guitarist moves hand to wherever the biggest change in pos is
	// need to modify this to number of stringNote
	if(Synth.getNumPressedKeys() >= 2){
	newFretFromPolyphony = stringNote[stringToPlay] - OPENSTRINGNOTES[stringToPlay];
	distBetweenNewFretAndAutoFret = Math.abs(newFretFromPolyphony - currentHandPos);
	}
	
	
	if(Math.abs(fretPlayed - currentHandPos) > fretSpaceToChange)
	{
		
		// Figure out the stringWithMelodyNote first and then figure where the fret position changes
		newHandPos = fretPlayed - fretSpaceToChange;
		
		return newHandPos;
		
	}else if(fretPlayed < currentHandPos)
	{
		return fretPlayed;
	}else
	{
		return currentHandPos;
	}
}


 
 inline function isEventStillPlaying(eventId)
 {
// I dont think this is actually used like.... at all bruh	
	

     for (var i = 0; i < 128; i++)
     {
         if (activeIds.getValue(i) == eventId)
             return true;
     }
     return false;
 }
 
 inline function cap(num, limit)
 {
	 if(num > limit)
	 {
		 return limit;
	 }else{
		 return num;
	 }
 } 
 
 
 inline function playNextNoteLegato(notePlayed, velocityPlayed)
{
	local closestString = StringType.NOSTRING;
	local closestDistance = POSINFINITY;
	local startNote = NO_NOTE;
	local strIdx;
	
	// Check between every stringNote value as that holds all the currently played notes.
	// Whichever stringNote's current note is closest to the target legato note, use that note and that string as the triggerSlide.
	for (strIdx = 0; strIdx < NUMOFSTRINGS; strIdx++)
	{
		local currNote = stringNote[strIdx];
		if (currNote != NO_NOTE && currNote != notePlayed)
		{
			local dist = Math.abs(notePlayed - currNote);
			if (dist < closestDistance)
			{
				closestDistance = dist;
				closestString = strIdx;
				startNote = currNote;
			}
		}
	}
	
	if (closestString == StringType.NOSTRING || startNote == NO_NOTE || startNote == notePlayed)
	{
		return false;
	}
	
	// Ignore incoming raw MIDI event to avoid double-triggering with artificial slide events
	Message.ignoreEvent(true);
	
	local isUp = (notePlayed > startNote);
	local targetPerformance = isUp ? PerformanceType.LegatoUp : PerformanceType.LegatoDown;
	
	// Unmute unified legato container (samplemap direction selected via note velocity)
	setSamplerUnmuted(PerformanceType.LEGATO);
	
	// Trigger the portamento slide on the closest string
	triggerSlide(closestString, startNote, notePlayed, eventIdArray[closestString], velocityPlayed);
	
	// Caller pulls the destination voice from the last entry of the event ID array
	local destVoiceId = NO_NOTE;
	if (eventIdArray[closestString].length > 0)
	{
		destVoiceId = eventIdArray[closestString][eventIdArray[closestString].length - 1];
	}
	
	// Update string note and voice tracking in NoteEngines.js
	// Target note becomes the active stringNote, so any subsequent overlapping legato note chains from it!
	stringNote[closestString] = notePlayed;
	stringNoteId[closestString] = destVoiceId;
	notePlayedMethod[closestString] = StringPlayingMethod.pianoRoll;
	Globals.g_stringNotes[closestString] = notePlayed;
	Globals.g_stringPerformance[closestString] = targetPerformance;
	
	// Preserve LEGATOGENERAL so that subsequent overlapping notes stay in legato mode
	if (legatoKeySwitchPlaying || Synth.isKeyDown(LEGATOKEYSWITCHNOTE) || Globals.g_currArticulationPlaying == PerformanceType.LEGATOGENERAL)
	{
		Globals.g_currArticulationPlaying = PerformanceType.LEGATOGENERAL;
	}
	else
	{
		Globals.g_currArticulationPlaying = targetPerformance;
	}
	lastStringPlayed = closestString;
	
	return true;
}

/**
 * Executes a portamento slide on a specific string for a voice pair.
 */
inline function executeSlideOnString(strIdx, startNote, targetNote, targetVelocity, isUp)
{
	local targetPerformance = isUp ? PerformanceType.LegatoUp : PerformanceType.LegatoDown;
	
	if (DEBUGMODEENABLED)
	{
		Console.print("[executeSlideOnString] str=" + strIdx + " start=" + startNote + " target=" + targetNote + " vel=" + targetVelocity + " isUp=" + isUp);
	}
	triggerSlide(strIdx, startNote, targetNote, eventIdArray[strIdx], targetVelocity);
	
	local destVoiceId = NO_NOTE;
	if (eventIdArray[strIdx].length > 0)
	{
		destVoiceId = eventIdArray[strIdx][eventIdArray[strIdx].length - 1];
	}
	
	stringNote[strIdx] = targetNote;
	stringNoteId[strIdx] = destVoiceId;
	notePlayedMethod[strIdx] = StringPlayingMethod.pianoRoll;
	Globals.g_stringNotes[strIdx] = targetNote;
	Globals.g_stringPerformance[strIdx] = targetPerformance;
	
	lastStringPlayed = strIdx;
}

/**
 * Polyphonic buffered legato portamento engine.
 * Handles single notes and simultaneous chords when LEGATOKEYSWITCHNOTE is active.
 *
 * Rules:
 * 1. Exact optimal bi-directional bipartite matching (Super-Source Bellman-Ford SSP):
 *    maximizes the number of slid target notes regardless of direction, then minimizes
 *    total semitone distance, breaking ties by closeness to g_handPositionFret and higher string.
 * 2. Direction (up vs down) is handled per-string via velocity inside the unified Legato samplers.
 * 3. Active strings not slid remain sustaining untouched.
 * 4. Incoming target notes that cannot slide play as normal sustain notes on available strings via fretting engine.
 * 5. If no active notes exist (M == 0), voice all notes as normal sustain.
 */
inline function processBufferedLegato(targetNotes, targetVels)
{
	local s;
	local i;
	local j;
	
	activeStrings.clear();
	activeNotes.clear();
	
	for (s = 0; s < NUMOFSTRINGS; s++)
	{
		if (stringNote[s] != NO_NOTE)
		{
			activeStrings.push(s);
			activeNotes.push(stringNote[s]);
		}
	}
	
	local M = activeNotes.length;
	local K = targetNotes.length;
	if (K > MAX_MATCH_TARGETS)
		K = MAX_MATCH_TARGETS;
	
	if (DEBUGMODEENABLED)
	{
		Console.print("[processBufferedLegato] M=" + M + " activeNotes=" + activeNotes + " activeStrings=" + activeStrings + " | K=" + K + " targetNotes=" + targetNotes);
	}
	
	// Case: No active notes currently sounding -> Play as normal sustain notes
	if (M == 0)
	{
		local wasLegatoState = (Globals.g_currArticulationPlaying == PerformanceType.LEGATO || Globals.g_currArticulationPlaying == PerformanceType.LEGATOGENERAL);
		Globals.g_currArticulationPlaying = PerformanceType.SUSTAIN;
		setSamplerUnmuted(PerformanceType.SUSTAIN);
		if (K > 1)
		{
			Globals.g_handPositionFret = naturalChordFretting(targetNotes, targetVels, Globals.g_handPositionFret, PerformanceType.SUSTAIN);
		}
		else if (K == 1)
		{
			playNextNoteOnNewString(targetNotes[0], targetVels[0]);
		}
		if (wasLegatoState || legatoKeySwitchPlaying || Synth.isKeyDown(LEGATOKEYSWITCHNOTE))
		{
			Globals.g_currArticulationPlaying = PerformanceType.LEGATOGENERAL;
		}
		return;
	}
	
	// Active notes exist -> All voices handled via artificial slide/sustain events
	Message.ignoreEvent(true);
	
	// Sort active notes descending (highest note first)
	for (i = 0; i < M - 1; i++)
	{
		for (j = 0; j < M - 1 - i; j++)
		{
			if (activeNotes[j] < activeNotes[j + 1])
			{
				local tempN = activeNotes[j];
				activeNotes[j] = activeNotes[j + 1];
				activeNotes[j + 1] = tempN;
				
				local tempS = activeStrings[j];
				activeStrings[j] = activeStrings[j + 1];
				activeStrings[j + 1] = tempS;
			}
		}
	}
	
	// Sort target notes descending (highest note first)
	sortedTargetNotes.clear();
	sortedTargetVels.clear();
	for (i = 0; i < K; i++)
	{
		sortedTargetNotes.push(targetNotes[i]);
		sortedTargetVels.push(targetVels[i]);
	}
	for (i = 0; i < K - 1; i++)
	{
		for (j = 0; j < K - 1 - i; j++)
		{
			if (sortedTargetNotes[j] < sortedTargetNotes[j + 1])
			{
				local tempTN = sortedTargetNotes[j];
				sortedTargetNotes[j] = sortedTargetNotes[j + 1];
				sortedTargetNotes[j + 1] = tempTN;
				
				local tempTV = sortedTargetVels[j];
				sortedTargetVels[j] = sortedTargetVels[j + 1];
				sortedTargetVels[j + 1] = tempTV;
			}
		}
	}
	
	// 1. Build bipartite cost matrix across all (active string i, target j) pairs regardless of direction
	for (i = 0; i < M; i++)
	{
		local str = activeStrings[i];
		local startN = activeNotes[i];
		
		for (j = 0; j < K; j++)
		{
			local targetN = sortedTargetNotes[j];
			matchEdgeValid[i][j] = 0;
			matchEdgeCost[i][j] = POSINFINITY;
			
			if (targetN == startN)
				continue;
				
			local pairIsUp = (targetN > startN);
			local targetArtic = pairIsUp ? PerformanceType.LegatoUp : PerformanceType.LegatoDown;
			local fret = targetN - OPENSTRINGNOTES[str];
			
			if (!isStringEnabled[str])
				continue;
			if (fret < 0 || fret >= NOTESPERSTRING)
				continue;
			if (fret < articLowestFretOnString[str][PerformanceType.LEGATO] ||
			    fret > articHighestFretOnString[str][PerformanceType.LEGATO])
				continue;
			if (fret < articLowestFretOnString[str][targetArtic] ||
			    fret > articHighestFretOnString[str][targetArtic])
				continue;
				
			local pitchDist = Math.abs(targetN - startN);
			local handDist = Math.abs((fret - 2) - Globals.g_handPositionFret);
			local costVal = (pitchDist * 10000000.0) + (handDist * 1000.0) + str;
			
			matchEdgeValid[i][j] = 1;
			matchEdgeCost[i][j] = costVal;
		}
	}
	
	// 2. Super-Source Bellman-Ford Successive Shortest Path matching:
	//    Strictly maximizes count of slid targets first, then minimizes total semitone distance + tie-break cost
	matchActiveToTarget.clear();
	for (i = 0; i < M; i++)
	{
		matchActiveToTarget.push(-1);
	}
	matchTargetToActive.clear();
	for (j = 0; j < K; j++)
	{
		matchTargetToActive.push(-1);
	}
	
	local totalVertices = M + K;
	local augStep;
	for (augStep = 0; augStep < M && augStep < K; augStep++)
	{
		bfDistL.clear();
		bfParentL.clear();
		for (i = 0; i < M; i++)
		{
			if (matchActiveToTarget[i] == -1)
			{
				bfDistL.push(0.0);
				bfParentL.push(-1);
			}
			else
			{
				bfDistL.push(POSINFINITY);
				bfParentL.push(-2);
			}
		}
		
		bfDistR.clear();
		bfParentR.clear();
		for (j = 0; j < K; j++)
		{
			bfDistR.push(POSINFINITY);
			bfParentR.push(-1);
		}
		
		local passIdx;
		for (passIdx = 0; passIdx < totalVertices; passIdx++)
		{
			local improved = false;
			
			// Forward non-matching edges: active string i -> target j
			for (i = 0; i < M; i++)
			{
				if (bfDistL[i] == POSINFINITY)
					continue;
				for (j = 0; j < K; j++)
				{
					if (matchEdgeValid[i][j] && matchActiveToTarget[i] != j)
					{
						local candDistR = bfDistL[i] + matchEdgeCost[i][j];
						if (candDistR < bfDistR[j])
						{
							bfDistR[j] = candDistR;
							bfParentR[j] = i;
							improved = true;
						}
					}
				}
			}
			
			// Backward matching edges: target j -> matched active string matchedI
			for (j = 0; j < K; j++)
			{
				if (bfDistR[j] == POSINFINITY)
					continue;
				local matchedI = matchTargetToActive[j];
				if (matchedI != -1)
				{
					local candDistL = bfDistR[j] - matchEdgeCost[matchedI][j];
					if (candDistL < bfDistL[matchedI])
					{
						bfDistL[matchedI] = candDistL;
						bfParentL[matchedI] = j;
						improved = true;
					}
				}
			}
			
			if (!improved)
				break;
		}
		
		local bestTargetEnd = -1;
		local bestPathCost = POSINFINITY;
		for (j = 0; j < K; j++)
		{
			if (matchTargetToActive[j] == -1 && bfDistR[j] < bestPathCost)
			{
				bestPathCost = bfDistR[j];
				bestTargetEnd = j;
			}
		}
		
		if (bestTargetEnd == -1)
			break;
			
		local curR = bestTargetEnd;
		while (curR != -1)
		{
			local curL = bfParentR[curR];
			if (curL < 0)
				break;
			local prevR = bfParentL[curL];
			matchTargetToActive[curR] = curL;
			matchActiveToTarget[curL] = curR;
			curR = prevR;
		}
	}
	
	local hasAnySlide = false;
	for (i = 0; i < M; i++)
	{
		if (matchActiveToTarget[i] != -1)
		{
			hasAnySlide = true;
			break;
		}
	}
	
	if (hasAnySlide)
	{
		setSamplerUnmuted(PerformanceType.LEGATO);
	}
	
	targetSlid.clear();
	for (j = 0; j < K; j++)
	{
		targetSlid.push(false);
	}
	
	// Execute matched slides (each string independently uses up or down velocity)
	for (i = 0; i < M; i++)
	{
		local matchedJ = matchActiveToTarget[i];
		if (matchedJ != -1)
		{
			local slideStr = activeStrings[i];
			local slideStartN = activeNotes[i];
			local slideTargetN = sortedTargetNotes[matchedJ];
			local slideTargetV = sortedTargetVels[matchedJ];
			local slideIsUp = (slideTargetN > slideStartN);
			
			targetSlid[matchedJ] = true;
			executeSlideOnString(slideStr, slideStartN, slideTargetN, slideTargetV, slideIsUp);
		}
	}
	
	// Handle unslid incoming target notes: voice as normal sustain on available strings
	for (j = 0; j < K; j++)
	{
		if (!targetSlid[j])
		{
			local unslidN = sortedTargetNotes[j];
			local unslidV = sortedTargetVels[j];
			local candStr = stringWithClosestNote(unslidN, Globals.g_handPositionFret, PerformanceType.SUSTAIN);
			
			if (candStr != StringType.NOSTRING)
			{
				local prevArtic = Globals.g_currArticulationPlaying;
				Globals.g_currArticulationPlaying = PerformanceType.SUSTAIN;
				setSamplerUnmuted(PerformanceType.SUSTAIN);
				stringNote[candStr] = unslidN;
				Globals.g_stringPerformance[candStr] = PerformanceType.SUSTAIN;
				playChordString(candStr, unslidN, unslidV);
				Globals.g_currArticulationPlaying = prevArtic;
			}
		}
	}
	
	// Update hand position based on resulting sounding voicing
	local leftmostFret = POSINFINITY;
	for (s = 0; s < NUMOFSTRINGS; s++)
	{
		if (stringNote[s] != NO_NOTE)
		{
			local f = stringNote[s] - OPENSTRINGNOTES[s];
			if (excludeOpenStringsFromFretSpread && f == 0)
			{
				continue;
			}
			if (f >= 0 && f < leftmostFret)
			{
				leftmostFret = f;
			}
		}
	}
	if (leftmostFret != POSINFINITY)
	{
		local dist = leftmostFret - Globals.g_handPositionFret;
		if (dist > 5)
		{
			Globals.g_handPositionFret = leftmostFret - 5;
		}
		else if (dist < -2)
		{
			Globals.g_handPositionFret = leftmostFret;
		}
	}
	if (Globals.g_handPositionFret < 0)
	{
		Globals.g_handPositionFret = 0;
	}
	
	// Preserve legato keyswitch state
	if (legatoKeySwitchPlaying || Synth.isKeyDown(LEGATOKEYSWITCHNOTE) || Globals.g_currArticulationPlaying == PerformanceType.LEGATOGENERAL || Globals.g_currArticulationPlaying == PerformanceType.LEGATO)
	{
		Globals.g_currArticulationPlaying = PerformanceType.LEGATOGENERAL;
	}
	else
	{
		Globals.g_currArticulationPlaying = PerformanceType.LEGATO;
	}
}
 
 
 // interfacing between different fretting engines
 
 inline function playNextNoteOnNewString(notePlayed, velocityPlayed){
	 

 
	 
 	if(Globals.g_frettingEngine == FrettingEngine.NATURAL)
 			{
 		
 				if(Globals.g_forcedHandPositionFret == -1)
 				{
 		
 					Globals.g_handPositionFret = naturalFretting2_2_1(notePlayed, Globals.g_handPositionFret, Globals.g_currArticulationPlaying);
 					
 				}else{
 					
 	
 					Globals.g_handPositionFret = naturalFretting2_2_1(notePlayed, Globals.g_forcedHandPositionFret, Globals.g_currArticulationPlaying);
 				}
 			}else if(Globals.g_frettingEngine == FrettingEngine.MELODY)
 			{
 		
 				if(Globals.g_forcedHandPositionFret == -1)
 						{
 							Globals.g_handPositionFret = melodyFretting1_0_0(notePlayed, Globals.g_handPositionFret, );
 							
 						}else
 						{
 							Globals.g_handPositionFret = melodyFretting1_0_0(notePlayed, Globals.g_forcedHandPositionFret);
 						}
 			}
 			
 			//Had a bug where handPositionFret became -4 and I have no idea why so I'm normalizing out of caution
 			if(Globals.g_handPositionFret < 0){
 				Globals.g_handPositionFret = 0;
 			}
	 
 }
 
 
 
 // setting up RR handling. Primarily just here to make double tracking between left and right.
 // Maybe make it randomized later

inline function createAllLeftArticSamplerArray(articName, lowBound, highBound){
	
	local samplerArrayToReturn = [];
	local samplerToPush;
	local numOfSamplers = highBound - lowBound + 1;

	samplerArrayToReturn.reserve(numOfSamplers);
	
	for(i = lowBound; i <= highBound; i++){
		samplerToPush = Synth.getChildSynth("LeftString" + i + articName + "Sampler");
		samplerArrayToReturn.push(samplerToPush);
	}

	return samplerArrayToReturn;
	
}


inline function createAllRightArticSamplerArray(articName, lowBound, highBound){
	
	local samplerArrayToReturn = [];
	local samplerToPush;
	local numOfSamplers = highBound - lowBound + 1;

	samplerArrayToReturn.reserve(numOfSamplers);
	
	for(i = lowBound; i <= highBound; i++){
		samplerToPush = Synth.getChildSynth("RightString" + i + articName + "Sampler");
		samplerArrayToReturn.push(samplerToPush);
	}

	return samplerArrayToReturn;
	
}



const var legatoSamplerLowestStringNum = 1;
const var legatoSamplerHighestStringNum = NUMOFSTRINGS;


const var susSamplerLowestStringNum = 1;
const var susSamplerHighestStringNum = NUMOFSTRINGS;
  
const var muteSamplerLowestStringNum = 1;
const var muteSamplerHighestStringNum = NUMOFSTRINGS;

 const var harmonicSamplerLowestStringNum = 1;
 const var harmonicSamplerHighestStringNum = NUMOFSTRINGS;
  
  
const var tremoloSamplerLowestStringNum = 1;
const var tremoloSamplerHighestStringNum = NUMOFSTRINGS;

 
const var AllSusLeftSamplers = createAllLeftArticSamplerArray(susSamplerName, susSamplerLowestStringNum, susSamplerHighestStringNum);

const var AllSusRightSamplers = createAllRightArticSamplerArray(susSamplerName, susSamplerLowestStringNum, susSamplerHighestStringNum);

 
const var AllLegatoLeftSamplers = createAllLeftArticSamplerArray(legatoSamplerName, legatoSamplerLowestStringNum, legatoSamplerHighestStringNum);

const var AllLegatoRightSamplers = createAllRightArticSamplerArray(legatoSamplerName, legatoSamplerLowestStringNum, legatoSamplerHighestStringNum);

inline function concatArrays(arr1, arr2)
{
    local result = [];
    
    for (item in arr1)
        result.push(item);
        
    for (item in arr2)
        result.push(item);
        
    return result;
}

 
 const var AllMuteLeftSamplers = createAllLeftArticSamplerArray(muteSamplerName, muteSamplerLowestStringNum, muteSamplerHighestStringNum);
 
 const var AllMuteRightSamplers = createAllRightArticSamplerArray(muteSamplerName, muteSamplerLowestStringNum, muteSamplerHighestStringNum);
 
 
 const var AllHarmonicLeftSamplers = createAllLeftArticSamplerArray(harmonicSamplerName, harmonicSamplerLowestStringNum, harmonicSamplerHighestStringNum);
 
 const var AllHarmonicRightSamplers = createAllRightArticSamplerArray(harmonicSamplerName, harmonicSamplerLowestStringNum, harmonicSamplerHighestStringNum);
 

//const var AllTremoloLeftSamplers = createAllLeftArticSamplerArray(tremoloSamplerName, tremoloSamplerLowestStringNum, tremoloSamplerHighestStringNum);

//const var AllTremoloRightSamplers = createAllRightArticSamplerArray(tremoloSamplerName, tremoloSamplerLowestStringNum, tremoloSamplerHighestStringNum);


// skipping SFX samplers for now. Do later
 
const var AllLeftSamplers = [];
AllLeftSamplers.reserve(PerformanceType.NUMOFPERFORMANCES);

const var AllRightSamplers = [];
AllRightSamplers.reserve(PerformanceType.NUMOFPERFORMANCES);

for(i = 0; i < PerformanceType.NUMOFPERFORMANCES; i++){
	AllLeftSamplers.push(-1);
	AllRightSamplers.push(-1);
}

AllLeftSamplers[PerformanceType.SUSTAIN] = AllSusLeftSamplers;
AllLeftSamplers[PerformanceType.MUTE] = AllMuteLeftSamplers;
AllLeftSamplers[PerformanceType.HARMONIC] = AllHarmonicLeftSamplers;
AllLeftSamplers[PerformanceType.TREMOLO] = AllTremoloLeftSamplers;
AllLeftSamplers[PerformanceType.LEGATOUP] = AllLegatoLeftSamplers;
AllLeftSamplers[PerformanceType.LEGATODOWN] = AllLegatoLeftSamplers;
AllLeftSamplers[PerformanceType.LEGATO] = AllLegatoLeftSamplers;



AllRightSamplers[PerformanceType.SUSTAIN] = AllSusRightSamplers;
AllRightSamplers[PerformanceType.MUTE] = AllMuteRightSamplers;
AllRightSamplers[PerformanceType.HARMONIC] = AllHarmonicRightSamplers;
AllRightSamplers[PerformanceType.TREMOLO] = AllTremoloRightSamplers;
AllRightSamplers[PerformanceType.LEGATOUP] = AllLegatoRightSamplers;
AllRightSamplers[PerformanceType.LEGATODOWN] = AllLegatoRightSamplers;
AllRightSamplers[PerformanceType.LEGATO] = AllLegatoRightSamplers;


// Need to disable round robin behaviour for randomization
inline function disableStandardRRBehaviour(){

	for(i = 0; i < AllLeftSamplers.length; i++){
		if(AllLeftSamplers[i] != -1){
	
			for(var j = 0; j < AllLeftSamplers[i].length; j++){
				AllLeftSamplers[i][j].asSampler().enableRoundRobin(false);
				AllRightSamplers[i][j].asSampler().enableRoundRobin(false);
			}
		}
	}
}


// keep in mind that the right samplers still need disabled RRs as it needs to very precisely be incremented from the left

// setting up RR behaviour

inline function linearRR_EnableBehaviour(){
	

	Globals.g_currRRBehaviour = RRBehaviour.LINEAR;

	for(i = 0; i < AllLeftSamplers.length; i++){
		if(AllLeftSamplers[i] != -1){
	
			for(var j = 0; j < AllLeftSamplers[i].length; j++){
				AllLeftSamplers[i][j].asSampler().enableRoundRobin(false);
				AllRightSamplers[i][j].asSampler().enableRoundRobin(false);
			}
		}
	}
}

inline function randomRR_EnableBehaviour(){
	
	Globals.g_currRRBehaviour = RRBehaviour.RANDOM;
	
	for(i = 0; i < AllLeftSamplers.length; i++){
		if(AllLeftSamplers[i] != -1){
	
			for(var j = 0; j < AllLeftSamplers[i].length; j++){
				AllLeftSamplers[i][j].asSampler().enableRoundRobin(false);
				AllRightSamplers[i][j].asSampler().enableRoundRobin(false);
			}
		}
	}
}



randomRR_EnableBehaviour();

const var numOfRRs = [];
numOfRRs.reserve(PerformanceType.NUMOFPERFORMANCES);

for(i = 0; i < PerformanceType.NUMOFPERFORMANCES; i++){
	numOfRRs.push(-1);
}






// I'd rather do this manually but the functions are bugging out on me for some reason
// will need to look into getNumActiveGroups and getRRGroupsForMessage

numOfRRs[PerformanceType.SUSTAIN] = 8;
numOfRRs[PerformanceType.MUTE] = 8;
numOfRRs[PerformanceType.HARMONIC] = 1;
numOfRRs[PerformanceType.LEGATOUP] = 1;
numOfRRs[PerformanceType.LEGATODOWN] = 1;
numOfRRs[PerformanceType.LEGATO] = 1;

// Make sure any sampler that only has 1 RR does transposition trick to not go down to mono
numOfRRs[PerformanceType.TREMOLO] = 1;

const var randomRRCounters = [];
randomRRCounters.reserve(PerformanceType.NUMOFPERFORMANCES * 2);

for(i = 0; i < PerformanceType.NUMOFPERFORMANCES * 2; i++){
	randomRRCounters.push(0);
}




const var randomRRsToGoThrough = [];
randomRRsToGoThrough.reserve(PerformanceType.NUMOFPERFORMANCES);

for(i = 0; i < numOfRRs.length; i++){
	randomRRsToGoThrough.push([]);
	randomRRsToGoThrough[i].reserve(numOfRRs[i]);
	
	for(var j = 0; j < numOfRRs[i]; j++){
		randomRRsToGoThrough[i].push(j + 1);
	}
}



inline function linearRR_incrementSamplersRR(stringPlaying){

	local rightSamplerToIncrement;
	local leftSamplerToIncrement;
	local RRForLeftSampler;
	local RRForRightSampler;
	local currArticulation;
	local stringToPlay = stringPlaying % NUMOFSTRINGS;
	
	
	currArticulation = Globals.g_currArticulationPlaying;
	
	rightSamplerToIncrement = AllRightSamplers[currArticulation][stringToPlay];
	leftSamplerToIncrement = AllLeftSamplers[currArticulation][stringToPlay];
	
	
	if(numOfRRs[currArticulation] >= 2){
	
	linearRRCounter = (linearRRCounter % numOfRRs[currArticulation]) + 1;
	
	
	RRForLeftSampler = linearRRCounter;
	
	// % makes sure it doesn't loop around and the final + 1 because 0th RR passes error
	RRForRightSampler = (RRFromLeftSampler % numOfRRs[currArticulation]) + 1;
	
	rightSamplerToIncrement.asSampler().setActiveGroup(RRForRightSampler);
	leftSamplerToIncrement.asSampler().setActiveGroup(RRForLeftSampler);
	}else{
		
		// make sure any sampler for this does the transposition trick for whatever RR needs it
	

		rightSamplerToIncrement.asSampler().setActiveGroup(1);
		leftSamplerToIncrement.asSampler().setActiveGroup(1);
	}
}

inline function shuffleArray(arr)
{
    for (i = arr.length - 1; i > 0; i--)
    {
        local j = Math.floor(Math.random() * (i + 1));
        local temp = arr[i];
        arr[i] = arr[j];
        arr[j] = temp;
    }
    return arr;
}

inline function randomRR_incrementSamplersRR(stringPlaying){

	local rightSamplerToIncrement;
	local leftSamplerToIncrement;
	local RRForLeftSampler;
	local RRForRightSampler;
	local currArticulation;
	local lastRRPlayed;	
	local stringToPlay = stringPlaying % NUMOFSTRINGS;
	
	
	currArticulation = Globals.g_currArticulationPlaying;
	
	rightSamplerToIncrement = AllRightSamplers[currArticulation][stringToPlay];
	leftSamplerToIncrement = AllLeftSamplers[currArticulation][stringToPlay];
	

	
	
	if(numOfRRs[currArticulation] >= 3){
	
	randomRRCounters[currArticulation] = (randomRRCounters[currArticulation] + 1) % numOfRRs[currArticulation];
	
	
	if(randomRRCounters[currArticulation] == 0){
		lastRRPlayed = randomRRsToGoThrough[currArticulation][randomRRsToGoThrough[currArticulation].length - 1];
		
		shuffleArray(randomRRsToGoThrough[currArticulation]);
		
		while(randomRRsToGoThrough[currArticulation][0] == lastRRPlayed){

		
		// avoid the exact same sample to play twice
		shuffleArray(randomRRsToGoThrough[currArticulation]);
		}
		
	}
	

	
	RRForLeftSampler = randomRRsToGoThrough[currArticulation][randomRRCounters[currArticulation]];

	
	RRForRightSampler = (RRForLeftSampler % numOfRRs[currArticulation]) + 1;
	
	rightSamplerToIncrement.asSampler().setActiveGroup(RRForRightSampler);
	
	leftSamplerToIncrement.asSampler().setActiveGroup(RRForLeftSampler);
	
	
	}else{
		
		// yeah I ain't writing new code for this crap
	
		linearRR_incrementSamplersRR(stringPlaying);
	}

}



// setting up strumming functions

const var fastestTotalStrumTime = 25;
const var slowestTotalStrumTime = 250;

const var randVelDeviation = 10;


const var fastestStrumRandomizationPercent = 0.45;
const var slowestStrumRandomizationPercent = 0.1;

// linMap declared above in Portamento System


inline function strumIfStrumKeyPressed(notePlayed, noteIdsToUpdate, notesToStrum, noteVelocity){


	if(notePlayed != StrummingKeyswitches.downStrumKeyswitch && notePlayed != StrummingKeyswitches.upStrumKeyswitch){
		return false;
	}
	
	Message.delayEvent(1);
	
	Message.ignoreEvent(true);

		
	if(notePlayed == StrummingKeyswitches.downStrumKeyswitch){
	
		downStrumHeld = true;
		currStrummingDirection = StrummingDirections.downStrumming;
		downStrum(notesToStrum, noteIdsToUpdate, noteVelocity, currStrummingDirection);
		return true;
	}
	
	
	
	if(notePlayed == StrummingKeyswitches.upStrumKeyswitch){
		upStrumHeld = true;
		currStrummingDirection = StrummingDirections.upStrumming;
		upStrum(notesToStrum, noteIdsToUpdate, noteVelocity, currStrummingDirection);
		return true;
	}
	
}




  
const var notesFilteredForStrum = [];
notesFilteredForStrum.reserve(NUMOFSTRINGS);

for(i = 0; i < NUMOFSTRINGS; i++){
	notesFilteredForStrum.push(-1);
}

const var filteredNoteIds = [];
filteredNoteIds.reserve(NUMOFSTRINGS);

for(i = 0; i < NUMOFSTRINGS; i++){
	filteredNoteIds.push(-1);
}

/*
var numOfNotesPlaying = 0;

inline function updateNumOfNotesPlayingCount(notesPlaying){
	numOfNotesPlaying = 0;

	for(i = 0; i < notesPlaying.length; i++){
		if(notesPlaying[i] != NO_NOTE){
			numOfNotesPlaying++;
		}
	}
}*/

// stringEnumToMidiChannel declared above in Portamento System


//const var notesToTest = [55, 71, 67, 64, 59, 52];



inline function singleNoteStrum(notesToStrum, noteIdsToUpdate, noteVelocity)
{

	
	local numOfStringToStrum = NO_NOTE;
	local midiChannelToPlay;
	local noteToStrum;


		for(i = 0; i < NUMOFSTRINGS && numOfStringToStrum == NO_NOTE; i++){
		
			if(notesToStrum[i] != NO_NOTE){
				numOfStringToStrum = i;
			}
		}
		
	midiChannelToPlay = stringEnumToMidiChannel(numOfStringToStrum);
	noteToStrum = notesToStrum[numOfStringToStrum];
		// + 1 because enums start at 0 but 
		if(noteIdsToUpdate[numOfStringToStrum] != NO_NOTE){
		
			Synth.noteOffByEventId(noteIdsToUpdate[numOfStringToStrum]);
		}
		noteIdsToUpdate[numOfStringToStrum] = Synth.addNoteOn(midiChannelToPlay, noteToStrum, noteVelocity, 1);		
		
}


inline function upStrum(notesToStrum, noteIdsToUpdate, noteVelocity, playingStrummingDirection){

	local thisStrumDirection = playingStrummingDirection;
	
	local totalTimeMS = linMap(Globals.g_strumSpeed, 1, 127, slowestTotalStrumTime, fastestTotalStrumTime);
	
	
	local totalTimeSamples = Engine.getSamplesForMilliSeconds(totalTimeMS);
	local indivNoteDelay;
	local indivNoteDelayRandomized;
	local idToRelease;
	local numOfStringPlaying = NO_STRING;
	local numOfNotesToPlay = 0;
	local numOfNotePlayingInSeq = 0;
	
	local stringChannelToSendTo;
	
	local randomizedNoteVelocity;
	
	local strumRandomizationPercent = linMap(noteVelocity, 1, 127, slowestStrumRandomizationPercent, fastestStrumRandomizationPercent);
	
	for(i = 0; i < notesToStrum.length; i++){
		if(notesToStrum[i] != NO_NOTE && notesToStrum[i] != POSINFINITY){
			numOfNotesToPlay++;
		}
	}
	
	if(numOfNotesToPlay > 1)
		indivNoteDelay = totalTimeSamples/(numOfNotesToPlay - 1);
	else if(numOfNotesToPlay == 1)
	{

		// only one note is held
		singleNoteStrum(notesToStrum, noteIdsToUpdate, noteVelocity);
		return true;
	}else{
		// did not down strum because no notes
		return false;
	}
	
	
	strumRandomizationPercent = linMap(noteVelocity, 1, 127, slowestStrumRandomizationPercent, fastestStrumRandomizationPercent);
	
	// highest note is the first one in the array, so start there
	
	 for(var j = 0; numOfNotePlayingInSeq < NUMOFSTRINGS && thisStrumDirection == playingStrummingDirection && j < notesToStrum.length - 1; j++){
	 
	 // thisStrumDirection == playingStrummingDirection is so that a strum can be stopped midway
	 
	 
	 
		if(notesToStrum[j] != NO_NOTE){
		
			indivNoteDelayRandomized = (indivNoteDelay * numOfNotePlayingInSeq) + (Math.random() - 0.5) * strumRandomizationPercent * indivNoteDelay;
			
			// making sure no NoteOn message has a negative timestamp
			indivNoteDelayRandomized = capAtLimits(0, POSINFINITY, indivNoteDelayRandomized);
			
			if(noteIdsToUpdate[j] != NO_NOTE  && notesToStrum[i] != POSINFINITY){
				Synth.noteOffDelayedByEventId(noteIdsToUpdate[j], indivNoteDelayRandomized - 1);
			}
			
			randomizedNoteVelocity = noteVelocity + randomAddOrSub(randVelDeviation);
			
			randomizedNoteVelocity = capAtLimits(1, 127, randomizedNoteVelocity);
			
			stringChannelToSendTo = stringEnumToMidiChannel(j);
			
			noteIdsToUpdate[j] = Synth.addNoteOn(stringChannelToSendTo, notesToStrum[j], randomizedNoteVelocity, indivNoteDelayRandomized);
			
			Globals.g_stringNotes[j] = notesToStrum[j];
			Globals.g_stringActiveRRs[j] = getActiveRRPlayed(j);
			incrementRR(j);
			
			notePlayedMethod[j] = StringPlayingMethod.fullStrumKey;
			
			numOfNotePlayingInSeq++;
			
			
		}
		
	}
	
}

inline function downStrum(notesToStrum, noteIdsToUpdate, noteVelocity, playingStrummingDirection){

	local thisStrumDirection = playingStrummingDirection;
	
	local totalTimeMS = linMap(Globals.g_strumSpeed, 1, 127, slowestTotalStrumTime, fastestTotalStrumTime);
	
	local totalTimeSamples = Engine.getSamplesForMilliSeconds(totalTimeMS);
	local indivNoteDelay;
	local indivNoteDelayRandomized;
	local idToRelease;
	local numOfStringPlaying = NO_STRING;
	local numOfNotesToPlay = 0;
	local numOfNotePlayingInSeq = 0;
	
	local stringChannelToSendTo;
	
	local randomizedNoteVelocity;
	
	local strumRandomizationPercent = linMap(noteVelocity, 1, 127, slowestStrumRandomizationPercent, fastestStrumRandomizationPercent);
	
	for(i = 0; i < notesToStrum.length; i++){
		if(notesToStrum[i] != NO_NOTE && notesToStrum[i] != POSINFINITY){
			numOfNotesToPlay++;
		}
	}
	
	if(numOfNotesToPlay > 1)
		indivNoteDelay = totalTimeSamples/(numOfNotesToPlay - 1);
	else if(numOfNotesToPlay == 1)
	{

		// only one note is held
		singleNoteStrum(notesToStrum, noteIdsToUpdate, noteVelocity);
		return true;
	}else{
		// did not down strum because no notes
		return false;
	}
	
	
	strumRandomizationPercent = linMap(noteVelocity, 1, 127, slowestStrumRandomizationPercent, fastestStrumRandomizationPercent);
	
	// lowest note is the latest one in the array, so start there
	
	 for(var j = NUMOFSTRINGS - 1; numOfNotePlayingInSeq < NUMOFSTRINGS && thisStrumDirection == playingStrummingDirection && j >= 0; j--){
	 
	 // thisStrumDirection == playingStrummingDirection is so that a strum can be stopped midway
	 
	 
	 
		if(notesToStrum[j] != NO_NOTE){
		
			indivNoteDelayRandomized = (indivNoteDelay * numOfNotePlayingInSeq) + (Math.random() - 0.5) * strumRandomizationPercent * indivNoteDelay;
			
			// making sure no NoteOn message has a negative timestamp
			indivNoteDelayRandomized = capAtLimits(0, POSINFINITY, indivNoteDelayRandomized);
			
			if(noteIdsToUpdate[j] != NO_NOTE){
			
				Synth.noteOffDelayedByEventId(noteIdsToUpdate[j], indivNoteDelayRandomized);
				
				//Synth.noteOffByEventId(noteIdsToUpdate[j]);
				
			}
			
			randomizedNoteVelocity = noteVelocity + randomAddOrSub(randVelDeviation);
			
			randomizedNoteVelocity = capAtLimits(1, 127, randomizedNoteVelocity);
			
			stringChannelToSendTo = stringEnumToMidiChannel(j);
			
			noteIdsToUpdate[j] = Synth.addNoteOn(stringChannelToSendTo, notesToStrum[j], randomizedNoteVelocity, indivNoteDelayRandomized);
			
			
			Globals.g_stringNotes[j] = notesToStrum[j];
			Globals.g_stringActiveRRs[j] = getActiveRRPlayed(j);
			incrementRR(j);
			
			notePlayedMethod[j] = StringPlayingMethod.fullStrumKey;
			
			numOfNotePlayingInSeq++;
			
			
		}
		
	}
	
}





inline function releaseStrumKeyIfReleased(noteReleased, noteIdsToUpdate, notesToUpdate){
	

	
	if(noteReleased == StrummingKeyswitches.downStrumKeyswitch){
		downStrumHeld = false;
	}else if(noteReleased == StrummingKeyswitches.upStrumKeyswitch){
		upStrumHeld = false;
	}else{
		return false;
	}
	
	
	if(downStrumHeld || upStrumHeld){
		return false;
	}
	
	
	for(i = 0; i < noteIdsToUpdate.length; i++){
		
		if(noteIdsToUpdate[i] != -1 && notePlayedMethod[i] == StringPlayingMethod.fullStrumKey){
		
	Synth.noteOffDelayedByEventId(noteIdsToUpdate[i], Math.random() * Engine.getSamplesForMilliSeconds(10));
		noteIdsToUpdate[i] = -1;
		Globals.g_stringNotes[i] = NO_NOTE;
		Globals.g_stringActiveRRs[i] = NO_NOTE;
		
			}
		}
		
		
	/*	for(i = 0; i < notesToUpdate.length; i++){
			notesToUpdate[i] = -1;
		}*/
		
}


const var notesToTest = [79, 71, 67, 64, 59, 52];
const var IdsToTest = [-1, -1, -1, -1, -1, -1];

inline function individualNoteStrum(notePlayed, noteVelocity, notesToStrumFrom, noteIdsToUpdate, strumNoteIdsToUpdate){
	

	local heightOfNoteToPlay;
	local noteFound = false;
	local noteIncrement = 0;
	local noteToPlay = NO_NOTE;
	local stringOfNoteToPlay;
	local midiChannelToPlayString = 0;
	local notesAvailableToPlay = 0;
	local indexOfStrumNoteIdToUpdate = 0;
	
	if(!isBetweenIncl(notePlayed, StrummingKeyswitches.lowIndivStrumKeyswitch, StrummingKeyswitches.highIndivStrumKeyswitch)){
		return false;
	}
	
	
	heightOfNoteToPlay = notePlayed - StrummingKeyswitches.lowIndivStrumKeyswitch + 1;
	indexOfStrumNoteIdToUpdate = notePlayed - StrummingKeyswitches.lowIndivStrumKeyswitch;
	
	for(i = NUMOFSTRINGS - 1; i >= 0; i--){
		if(notesToStrumFrom[i] != NO_NOTE){
		
			notesAvailableToPlay++;
		}
	}
	
	if(notesAvailableToPlay < heightOfNoteToPlay){
		
		// topmost strum keys will all just play the available highest note
		heightOfNoteToPlay = notesAvailableToPlay;
		
	}else if(notesAvailableToPlay == 0){
		return false;
	}
	
	for(i = NUMOFSTRINGS - 1; i >= 0 && !noteFound; i--){
		if(notesToStrumFrom[i] != NO_NOTE){
		
			noteIncrement++;
		}
		
		if(noteIncrement == heightOfNoteToPlay){
			noteToPlay = notesToStrumFrom[i];
			stringOfNoteToPlay = i;
			noteFound = true;
		}
	}
	
	if(noteToPlay == NO_NOTE){
		return false;
	}

	
	if(noteIdsToUpdate[stringOfNoteToPlay] != NO_NOTE){
		Synth.noteOffByEventId(noteIdsToUpdate[stringOfNoteToPlay]);
		noteIdsToUpdate[stringOfNoteToPlay] = NO_NOTE;
	}
	
	
	midiChannelToPlayString = stringEnumToMidiChannel(stringOfNoteToPlay);
	
	
	incrementRR(stringOfNoteToPlay);
	
	noteIdsToUpdate[stringOfNoteToPlay] = Synth.addNoteOn(midiChannelToPlayString, noteToPlay, noteVelocity, 0);
	
	Globals.g_stringActiveRRs[stringOfNoteToPlay] = getActiveRRPlayed(stringOfNoteToPlay);
	
	notePlayedMethod[stringOfNoteToPlay] = StringPlayingMethod.indivStrumKey;
	
	strumNoteIdsToUpdate[indexOfStrumNoteIdToUpdate] = noteIdsToUpdate[stringOfNoteToPlay];
	
	return true;
	
}


inline function indivNoteStrumReleaseIfReleased(noteReleased, noteIdsToUpdate, strumNoteIdsToUpdate)
{
	local indexOfNoteToRelease;
	local noteIdToRelease;
	local strumNoteIdFoundInNoteIds = false;
	
	
	if(!isBetweenIncl(noteReleased, StrummingKeyswitches.lowIndivStrumKeyswitch, StrummingKeyswitches.highIndivStrumKeyswitch)){
		return false;
	}	
	
	indexOfNoteToRelease = noteReleased - StrummingKeyswitches.lowIndivStrumKeyswitch;
	
	noteIdToRelease = strumNoteIdsToUpdate[indexOfNoteToRelease];
	
	if(noteIdToRelease != NO_NOTE){
		Synth.noteOffByEventId(noteIdToRelease);
		strumNoteIdsToUpdate[indexOfNoteToRelease] = NO_NOTE;
		
	/*	for(i = 0; i < noteIdsToUpdate.length && !strumNoteIdFoundInNoteIds; i++){
			if (noteIdsToUpdate[i] == noteIdToRelease){
				noteIdsToUpdate[i] = NO_NOTE;
				strumNoteIdFoundInNoteIds = true;
			}
		}*/
		
		for(i = 0; i < noteIdsToUpdate.length && !strumNoteIdFoundInNoteIds; i++){
					if (noteIdsToUpdate[i] == noteIdToRelease){
						noteIdsToUpdate[i] = NO_NOTE;
						strumNoteIdFoundInNoteIds = true;
						Globals.g_stringActiveRRs[i] = NO_NOTE;
					}
				}
		
		return true;
		
	}else{
		return false;
	}
	
	
	
}


inline function capAtLimits(lowLimit, highLimit, num){
	if(isBetweenIncl(num, lowLimit, highLimit)){
		return num;
	}else{
		if(num < lowLimit){
			return lowLimit;
		}else{
			return highLimit;
		}
	}
}

inline function isBetweenIncl(num, lowBound, highBound){
	 return num >= lowBound && num <= highBound;
}

inline function randomAddOrSub(deviation){
	
	return (Math.random() - 0.5) * deviation * 2;
}
 
 function onNoteOn()
{

	local notePlayed = Message.getNoteNumber();
	local velocityPlayed = Message.getVelocity();
	local notePlayedId = Message.getEventId();
	
	local didPlayNoteLegato = false;
	local didPlayOnNewString = false;
	
	local s;
	local i;
	oldStringNoteId.clear();
	for (s = 0; s < NUMOFSTRINGS; s++)
	{
		oldStringNoteId.push(stringNoteId[s]);
	}

	detectKeySwitch(notePlayed);
	
	if(Globals.g_resetNotes == true)
		resetNotes();
	
	if(isBetweenIncl(notePlayed, LOWESTNOTE, HIGHESTNOTE)){

		if (DEBUGMODEENABLED)
		{
			Console.print("[NoteEngines] onNoteOn: note=" + notePlayed + " vel=" + velocityPlayed + " uptime=" + Engine.getUptime() + " ts=" + Message.getTimestamp());
			if (isDefined(Globals.g_noteToPlayBufferData))
			{
				Console.print("  Buffer count=" + Globals.g_noteToPlayBufferData.inputtedNotes.length);
				for (i = 0; i < Globals.g_noteToPlayBufferData.inputtedNotes.length; i++)
				{
					Console.print("    buf[" + i + "]: note=" + Globals.g_noteToPlayBufferData.inputtedNotes[i] + " uptime=" + Globals.g_noteToPlayBufferData.inputtedNotesOnTime[i] + " proc=" + Globals.g_noteToPlayBufferData.inputtedNoteProcessed[i]);
				}
			}
		}

		// Buffer clustering check: find all unprocessed notes matching the current cluster uptime (<= 20 microseconds)
		clusterIndices.clear();
		local clusterCount = 0;
		local isChord = false;

		if (isDefined(Globals.g_noteToPlayBufferData) && Globals.g_noteToPlayBufferData.inputtedNotes.length > 0)
		{
			local clusterStartIdx = -1;
			for (i = 0; i < Globals.g_noteToPlayBufferData.inputtedNoteProcessed.length; i++)
			{
				if (!Globals.g_noteToPlayBufferData.inputtedNoteProcessed[i])
				{
					clusterStartIdx = i;
					break;
				}
			}

			if (clusterStartIdx != -1)
			{
				local clusterAnchorTime = Globals.g_noteToPlayBufferData.inputtedNotesOnTime[clusterStartIdx];
				for (i = clusterStartIdx; i < Globals.g_noteToPlayBufferData.inputtedNoteProcessed.length; i++)
				{
					if (!Globals.g_noteToPlayBufferData.inputtedNoteProcessed[i])
					{
						local deltaSec = Math.abs(Globals.g_noteToPlayBufferData.inputtedNotesOnTime[i] - clusterAnchorTime);
						if (DEBUGMODEENABLED)
						{
							Console.print("    check buf[" + i + "] note=" + Globals.g_noteToPlayBufferData.inputtedNotes[i] + " delta=" + deltaSec + " <= " + UPTIME_CHORD_THRESHOLD + " => " + (deltaSec <= UPTIME_CHORD_THRESHOLD));
						}
						if (deltaSec <= UPTIME_CHORD_THRESHOLD)
						{
							clusterIndices.push(i);
						}
					}
				}
				clusterCount = clusterIndices.length;
			}
		}

		if (DEBUGMODEENABLED)
		{
			Console.print("  clusterCount=" + clusterCount + " chordArrivalCount=" + chordArrivalCount);
		}

		if (clusterCount > 1)
		{
			chordArrivalCount++;
			if (chordArrivalCount < clusterCount)
			{
				// Stop callback for intermediate notes in the chord cluster
				Message.ignoreEvent(true);
				return;
			}

			// Final note callback of this simultaneous cluster -> process entire chord!
			chordArrivalCount = 0;
			isChord = true;
		}
		else
		{
			chordArrivalCount = 0;
			isChord = false;
		}

		if (isChord)
		{
			// Final note callback of chord cluster: ignore original event so only artificial voices sound
			Message.ignoreEvent(true);

			// Mark all notes in this chord cluster as processed
			for (i = 0; i < clusterCount; i++)
			{
				Globals.g_noteToPlayBufferData.inputtedNoteProcessed[clusterIndices[i]] = true;
			}

			chordNotes.clear();
			chordVelocities.clear();
			for (i = 0; i < clusterCount; i++)
			{
				chordNotes.push(Globals.g_noteToPlayBufferData.inputtedNotes[clusterIndices[i]]);
				chordVelocities.push(Globals.g_noteToPlayBufferData.inputtedNoteVelocities[clusterIndices[i]]);
			}

			local isLegatoActiveChord = legatoKeySwitchPlaying || Synth.isKeyDown(LEGATOKEYSWITCHNOTE);

			if (DEBUGMODEENABLED)
			{
				Console.print("  >>> CHORD FLOW TRIGGERED: notes=" + chordNotes + " legato=" + isLegatoActiveChord);
			}

			if (isLegatoActiveChord)
			{
				processBufferedLegato(chordNotes, chordVelocities);
			}
			else
			{
				// Apply natural chord fretting algorithm
				Globals.g_handPositionFret = naturalChordFretting(chordNotes, chordVelocities, Globals.g_handPositionFret, Globals.g_currArticulationPlaying);
			}

			for (i = 0; i < stringNote.length - 1; i++)
			{
				if (stringNote[i] != NO_NOTE)
				{
					eventIds.setValue(stringNote[i], stringNoteId[i]);
				}
			}

			for (s = 0; s < NUMOFSTRINGS; s++)
			{
				if (stringNoteId[s] != oldStringNoteId[s])
				{
					stringNoteStartTime[s] = Engine.getUptime();
				}
			}

			strumIfStrumKeyPressed(notePlayed, stringNoteId, stringNote, velocityPlayed);
			individualNoteStrum(notePlayed, velocityPlayed, stringNote, stringNoteId, indivNoteStrumIds);

			Globals.g_noteToPlayBufferData.inputtedNotes.clear();
			Globals.g_noteToPlayBufferData.inputtedNotesOnTime.clear();
			Globals.g_noteToPlayBufferData.inputtedNoteVelocities.clear();
			Globals.g_noteToPlayBufferData.inputtedNoteProcessed.clear();

			return;
		}

		// Single note flow: mark the single note as processed
		if (clusterIndices.length > 0)
		{
			Globals.g_noteToPlayBufferData.inputtedNoteProcessed[clusterIndices[0]] = true;
		}

		local allProcessed = true;
		for (i = 0; i < Globals.g_noteToPlayBufferData.inputtedNoteProcessed.length; i++)
		{
			if (!Globals.g_noteToPlayBufferData.inputtedNoteProcessed[i])
			{
				allProcessed = false;
				break;
			}
		}
		if (allProcessed)
		{
			Globals.g_noteToPlayBufferData.inputtedNotes.clear();
			Globals.g_noteToPlayBufferData.inputtedNotesOnTime.clear();
			Globals.g_noteToPlayBufferData.inputtedNoteVelocities.clear();
			Globals.g_noteToPlayBufferData.inputtedNoteProcessed.clear();
		}

		local isLegatoActive = legatoKeySwitchPlaying || Synth.isKeyDown(LEGATOKEYSWITCHNOTE);

		if (DEBUGMODEENABLED)
		{
			Console.print("  >>> SINGLE NOTE FLOW TRIGGERED: note=" + notePlayed + " legato=" + isLegatoActive);
		}

		if (isLegatoActive)
		{
			chordNotes.clear();
			chordVelocities.clear();
			chordNotes.push(notePlayed);
			chordVelocities.push(velocityPlayed);

			processBufferedLegato(chordNotes, chordVelocities);
		}
		else
		{
			playNextNoteOnNewString(notePlayed, velocityPlayed);
		}

		for (i = 0; i < stringNote.length - 1; i++)
		{
			if (stringNote[i] != NO_NOTE)
			{
				eventIds.setValue(stringNote[i], stringNoteId[i]);
			}
		}

	}

	strumIfStrumKeyPressed(notePlayed, stringNoteId, stringNote, velocityPlayed);

	individualNoteStrum(notePlayed, velocityPlayed, stringNote, stringNoteId, indivNoteStrumIds);

	for (s = 0; s < NUMOFSTRINGS; s++)
	{
		if (stringNoteId[s] != oldStringNoteId[s])
		{
			stringNoteStartTime[s] = Engine.getUptime();
		}
	}
	
	
	
/*	for(i = 0; i < NoteIdLabels.length; i++){
		NoteIdLabels[i].set("text", stringNoteId[i]);
	}*/


	
}
function onNoteOff()
{
	
	
    local releasedNote = Message.getNoteNumber();
    local releasedNoteId = Message.getEventId();
    if (DEBUGMODEENABLED)
    {
        Console.print("[onNoteOff] releasedNote=" + releasedNote + " releasedId=" + releasedNoteId);
    }
    local noteFound = false;
    local noteFoundInLegato = false;
    local eventIdListIndexToRemoveId = 0;
    Message.ignoreEvent(true);

	if(releasedNote == LEGATOKEYSWITCHNOTE)
	{
		legatoKeySwitchPlaying = false;
		detectKeySwitch(SUSTAINKEYSWITCHNOTE);
	}
		
	eventIdListIndexToRemoveId = eventIds.getIndex(releasedNoteId);
			
	if (isBetweenIncl(releasedNote, LOWESTNOTE, HIGHESTNOTE))
	{
		for (var s = 0; s < NUMOFSTRINGS; s++)
		{
		    if (stringNote[s] == releasedNote)
		    {
		        if (isSustainPedalDown)
		        {
		            pedalHeldStrings[s] = true;
		        }
		        else
		        {
					if (notePlayedMethod[s] == StringPlayingMethod.pianoRoll)
					{
						noteOffStringSound(s, stringNote, stringNoteId);
					}
			        noteOffStringHolder(s, stringNote, stringNoteId);
		        }
		    }
		}
	}
			
		//	eventIds.setValue(eventIdListIndexToRemoveId, NO_NOTE);

		
		


		
	for (var i = StringType.LEGATOOFFSET; i < stringNote.length && !noteFoundInLegato; i++)
			{
	//Not tested yet with noteId because I lowkey forgor how to do legato. Will need to try later

			    if (stringNoteId[i] == releasedNoteId)
			    {
	
			        stringNote[i] = NO_NOTE;
			        noteOffStringSound(i, stringNote, stringNoteId);
			        noteFoundInLegato = true;
			    }
			}
			
	releaseStrumKeyIfReleased(releasedNote, stringNoteId, stringNote);

	indivNoteStrumReleaseIfReleased(releasedNote, stringNoteId, indivNoteStrumIds);
	
//	releaseStrumKeyIfReleased(releasedNote, IdsToTest, notesToTest);
	
//	indivNoteStrumReleaseIfReleased(releasedNote, IdsToTest, indivNoteStrumIds);
	

	for(i = 0; i < NoteIdLabels.length; i++){
		NoteIdLabels[i].set("text", stringNoteId[i]);
	}
    

}function onController()
{
	local ccNum = Message.getControllerNumber();
	local ccVal = Message.getControllerValue();
	
	if (ccNum == 64)
	{
		Message.ignoreEvent(true);
		isSustainPedalDown = (ccVal >= 64);
		
		if (DEBUGMODEENABLED)
		{
			Console.print("[onController] CC64 val=" + ccVal + " pedalDown=" + isSustainPedalDown);
		}
		
		if (!isSustainPedalDown)
		{
			handlePedalRelease();
		}
	}
}
 function onTimer()
{
	
}
 function onControl(number, value)
{
	
}
 