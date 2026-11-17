 Synth.deferCallbacks(false);
 Synth.setFixNoteOnAfterNoteOff(true);
 
 
 Content.makeFrontInterface(800, 400);
 
 reg i = 0;
 reg linearRRCounter = 1;
 
 //Emulated releases didn't go as well as planned. But I'll keep it here for now
 Globals.g_emulatedReleasesOn = false;
 
 
include("NoteRangeAndOpenStringNote.js");

include("KeyswitchConstants.js");


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

const var legatoUpSamplerName = "LegatoUp";

const var legatoDownSamplerName = "LegatoDown";

 
 // skipping SFX samplers for now. Do later if it exists
 
const var AllSusMuters = createAllMutersArray(susSamplerName);
const var AllMuteMuters = createAllMutersArray(muteSamplerName);
const var AllHarmonicMuters = createAllMutersArray(harmonicSamplerName);
const var AllLegatoUpMuters = createAllMutersArray(legatoUpSamplerName);
const var AllLegatoDownMuters = createAllMutersArray(legatoDownSamplerName);

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
AllContainerMuters[PerformanceType.LEGATOUP] = AllLegatoUpMuters;
AllContainerMuters[PerformanceType.LEGATODOWN] = AllLegatoDownMuters;


const var NUMOFKEYSWITCHES = 4;

 
 inline function setAllSamplersMuted(){
 
	 for(i = 0; i < AllContainerMuters.length; i++){ 
		if(AllContainerMuters[i] != -1){
			for(var j = 0; j < AllContainerMuters[i].length; j++){
				AllContainerMuters[i][j].setAttribute("Bypass", true);
			}
		}
	 }
 }
 
 inline function setSamplerUnmuted(articulationIndex){
	 if(AllContainerMuters[articulationIndex] == -1){
		 Console.print("articulation doesn't have muter or doesn't exist");
	 }else{
		 for(i = 0; i < AllContainerMuters[articulationIndex].length; i++){
		 
			 	AllContainerMuters[articulationIndex][i].setAttribute("Bypass", false);
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
// PORTAMENTO / LEGATO SYSTEM (2-D Multi-String Architecture)
// ==============================================================================

const var DEFAULT_TRANSIT_MS = 22.0;
const var HARDCODED_CROSSFADE_MS = 5.0;

// 2-D Metadata Arrays (NUMOFSTRINGS rows x 128 columns)
const var transitDurations = [];
transitDurations.reserve(NUMOFSTRINGS);

const var sampleStartOffsets = [];
sampleStartOffsets.reserve(NUMOFSTRINGS);

const var sampleArrivalOffsets = [];
sampleArrivalOffsets.reserve(NUMOFSTRINGS);

// Per-String State & Event ID Arrays (8 rows)
const var eventIdArray = [];
eventIdArray.reserve(NUMOFSTRINGS);

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

for (var sIdx = 0; sIdx < NUMOFSTRINGS; sIdx++)
{
    var tRow = [];
    tRow.reserve(128);
    var sStartRow = [];
    sStartRow.reserve(128);
    var sArrRow = [];
    sArrRow.reserve(128);
    
    for (var cIdx = 0; cIdx < 128; cIdx++)
    {
        tRow.push(DEFAULT_TRANSIT_MS);
        sStartRow.push(0);
        sArrRow.push(0);
    }
    
    transitDurations.push(tRow);
    sampleStartOffsets.push(sStartRow);
    sampleArrivalOffsets.push(sArrRow);
    
    var evRow = [];
    evRow.reserve(128);
    eventIdArray.push(evRow);
    
    reachedLastNote.push(true);
    slideStartTimeSec.push(0.0);
    slideTotalDurationMS.push(0.0);
    slideDestinationVoiceId.push(NO_NOTE);
    slideStartFret.push(NO_NOTE);
}

// Hardcoded Upward Slide Transit Times for String 8 (measured from physical recordings)
transitDurations[StringType.STRING8][41] = 47.33; // E1_F1
transitDurations[StringType.STRING8][42] = 44.68; // F1_F#1
transitDurations[StringType.STRING8][43] = 24.67; // F#1_G1
transitDurations[StringType.STRING8][44] = 23.28; // G1_G#1
transitDurations[StringType.STRING8][45] = 42.67; // G#1_A1
transitDurations[StringType.STRING8][46] = 40.27; // A1_A#1
transitDurations[StringType.STRING8][47] = 28.67; // A#1_B1
transitDurations[StringType.STRING8][48] = 27.06; // B1_C2
transitDurations[StringType.STRING8][49] = 21.33; // C2_C#2
transitDurations[StringType.STRING8][50] = 20.14; // C#2_D2
transitDurations[StringType.STRING8][51] = 30.67; // D2_D#2
transitDurations[StringType.STRING8][52] = 28.95; // D#2_E2
transitDurations[StringType.STRING8][53] = 18.67; // E2_F2
transitDurations[StringType.STRING8][54] = 17.62; // F2_F#2
transitDurations[StringType.STRING8][55] = 17.33; // F#2_G2
transitDurations[StringType.STRING8][56] = 16.36; // G2_G#2
transitDurations[StringType.STRING8][57] = 15.33; // G#2_A2
transitDurations[StringType.STRING8][58] = 14.47; // A2_A#2
transitDurations[StringType.STRING8][59] = 20.00; // A#2_B2
transitDurations[StringType.STRING8][60] = 18.88; // B2_C3
transitDurations[StringType.STRING8][61] = 20.67; // C3_C#3
transitDurations[StringType.STRING8][62] = 19.51; // C#3_D3
transitDurations[StringType.STRING8][63] = 15.33; // D3_D#3
transitDurations[StringType.STRING8][64] = 14.47; // D#3_E3

// Hardcoded Upward Sample Alignment Offsets for String 8
sampleStartOffsets[StringType.STRING8][41] = 33180; sampleArrivalOffsets[StringType.STRING8][41] = 35452; // E1_F1
sampleStartOffsets[StringType.STRING8][42] = 31318; sampleArrivalOffsets[StringType.STRING8][42] = 33462; // F1_F#1
sampleStartOffsets[StringType.STRING8][43] = 22677; sampleArrivalOffsets[StringType.STRING8][43] = 23861; // F#1_G1
sampleStartOffsets[StringType.STRING8][44] = 21404; sampleArrivalOffsets[StringType.STRING8][44] = 22522; // G1_G#1
sampleStartOffsets[StringType.STRING8][45] = 21924; sampleArrivalOffsets[StringType.STRING8][45] = 23972; // G#1_A1
sampleStartOffsets[StringType.STRING8][46] = 20694; sampleArrivalOffsets[StringType.STRING8][46] = 22627; // A1_A#1
sampleStartOffsets[StringType.STRING8][47] = 24455; sampleArrivalOffsets[StringType.STRING8][47] = 25831; // A#1_B1
sampleStartOffsets[StringType.STRING8][48] = 23082; sampleArrivalOffsets[StringType.STRING8][48] = 24381; // B1_C2
sampleStartOffsets[StringType.STRING8][49] = 17754; sampleArrivalOffsets[StringType.STRING8][49] = 18778; // C2_C#2
sampleStartOffsets[StringType.STRING8][50] = 16758; sampleArrivalOffsets[StringType.STRING8][50] = 17724; // C#2_D2
sampleStartOffsets[StringType.STRING8][51] = 18013; sampleArrivalOffsets[StringType.STRING8][51] = 19485; // D2_D#2
sampleStartOffsets[StringType.STRING8][52] = 17002; sampleArrivalOffsets[StringType.STRING8][52] = 18391; // D#2_E2
sampleStartOffsets[StringType.STRING8][53] = 20174; sampleArrivalOffsets[StringType.STRING8][53] = 21070; // E2_F2
sampleStartOffsets[StringType.STRING8][54] = 19042; sampleArrivalOffsets[StringType.STRING8][54] = 19887; // F2_F#2
sampleStartOffsets[StringType.STRING8][55] = 14443; sampleArrivalOffsets[StringType.STRING8][55] = 15275; // F#2_G2
sampleStartOffsets[StringType.STRING8][56] = 13632; sampleArrivalOffsets[StringType.STRING8][56] = 14418; // G2_G#2
sampleStartOffsets[StringType.STRING8][57] = 18514; sampleArrivalOffsets[StringType.STRING8][57] = 19250; // G#2_A2
sampleStartOffsets[StringType.STRING8][58] = 17475; sampleArrivalOffsets[StringType.STRING8][58] = 18170; // A2_A#2
sampleStartOffsets[StringType.STRING8][59] = 14659; sampleArrivalOffsets[StringType.STRING8][59] = 15619; // A#2_B2
sampleStartOffsets[StringType.STRING8][60] = 13836; sampleArrivalOffsets[StringType.STRING8][60] = 14742; // B2_C3
sampleStartOffsets[StringType.STRING8][61] = 19741; sampleArrivalOffsets[StringType.STRING8][61] = 20733; // C3_C#3
sampleStartOffsets[StringType.STRING8][62] = 18633; sampleArrivalOffsets[StringType.STRING8][62] = 19569; // C#3_D3
sampleStartOffsets[StringType.STRING8][63] = 16831; sampleArrivalOffsets[StringType.STRING8][63] = 17567; // D3_D#3
sampleStartOffsets[StringType.STRING8][64] = 15886; sampleArrivalOffsets[StringType.STRING8][64] = 16581; // D#3_E3

inline function linMap(value, inMin, inMax, outMin, outMax)
{
    return outMin + (value - inMin) * (outMax - outMin) / (inMax - inMin);
}

inline function stringEnumToMidiChannel(stringEnum)
{
    return stringEnum + 1;
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
    
    reachedLastNote[stringIndex] = (destId != NO_NOTE) && ((elapsedMS >= slideTotalDurationMS[stringIndex]) || Synth.isArtificialEventActive(destId));
    
    local targetEvArray = eventIdArray[stringIndex];
    local evIdx;
    
    if (reachedLastNote[stringIndex])
    {
        // Reached destination note: fade out cleanly
        if (destId != NO_NOTE)
        {
            if (Synth.isArtificialEventActive(destId))
            {
                Synth.addVolumeFade(destId, 25, -100);
                Synth.noteOffDelayedByEventId(destId, Engine.getSamplesForMilliSeconds(25));
            }
            else
            {
                Synth.noteOffByEventId(destId);
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
    slideDestinationVoiceId[stringIndex] = NO_NOTE;
    slideStartFret[stringIndex] = NO_NOTE;
    slideTotalDurationMS[stringIndex] = 0.0;
    slideStartTimeSec[stringIndex] = 0.0;
}

/**
 * Executes an upward multi-fret portamento slide on a specific string.
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
                // Each step in targetEventIdArray corresponds to slideStartFret + 1 + evIdx
                effectiveStart = slideStartFret[stringIndex] + 1 + evIdx;
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
    
    local interval = endNote - effectiveStart;
    if (interval <= 0)
        return;
        
    local numSteps = interval;
    local currentOffsetSamples = 0;
    local speedFactor = linMap(velocity, 1, 127, 1.8, 0.55);
    local stepNote;
    local stepDurMS;
    local stepDurSamples;
    local stepOverlapSamples = Engine.getSamplesForMilliSeconds(HARDCODED_CROSSFADE_MS);
    local isLastStep;
    local voiceId;
    local step;
    
    for (step = 0; step < numSteps; step++)
    {
        stepNote = effectiveStart + 1 + step;
        isLastStep = (step == numSteps - 1);
        
        stepDurMS = transitDurations[stringIndex][stepNote] * speedFactor;
        stepDurSamples = Engine.getSamplesForMilliSeconds(stepDurMS);
        
        voiceId = Synth.addNoteOn(slideChannel, stepNote, velocity, currentOffsetSamples);
        targetEventIdArray.push(voiceId);
        
        if (!isLastStep)
        {
            Synth.noteOffDelayedByEventId(voiceId, currentOffsetSamples + stepDurSamples + stepOverlapSamples);
            currentOffsetSamples += stepDurSamples;
        }
        else
        {
            slideDestinationVoiceId[stringIndex] = voiceId;
            slideTotalDurationMS[stringIndex] = (currentOffsetSamples / Engine.getSampleRate()) * 1000.0;
            slideStartTimeSec[stringIndex] = Engine.getUptime();
            reachedLastNote[stringIndex] = false;
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
		if (eventIdArray[s].length > 0)
		{
			endSlide(s);
		}
	}
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
	
	if (stringToPlay < NUMOFSTRINGS && eventIdArray[stringToPlay].length > 0)
	{
		endSlide(stringToPlay);
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
	
	Globals.g_stringActiveRRs[stringToOff] = NO_NOTE;
	if (stringToOff < NUMOFSTRINGS && eventIdArray[stringToOff].length > 0)
	{
		endSlide(stringToOff);
	}
	else
	{
		Synth.noteOffByEventId(stringIdsToUpdate[stringToOff]);
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

	
	Console.print("~~  new start  ~~");
	for(var j = 0; j < NUMOFSTRINGS; j++){
		Console.print(stringNote[j]);
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
		if (currNote != NO_NOTE && currNote < notePlayed)
		{
			local dist = notePlayed - currNote;
			if (dist < closestDistance)
			{
				closestDistance = dist;
				closestString = strIdx;
				startNote = currNote;
			}
		}
	}
	
	// Safety fallback check if no note was strictly lower
	if (closestString == StringType.NOSTRING)
	{
		for (strIdx = 0; strIdx < NUMOFSTRINGS; strIdx++)
		{
			local cNote = stringNote[strIdx];
			if (cNote != NO_NOTE)
			{
				local d = Math.abs(notePlayed - cNote);
				if (d < closestDistance)
				{
					closestDistance = d;
					closestString = strIdx;
					startNote = cNote;
				}
			}
		}
	}
	
	if (closestString == StringType.NOSTRING || startNote == NO_NOTE || startNote >= notePlayed)
	{
		return false;
	}
	
	// Ignore incoming raw MIDI event to avoid double-triggering with artificial slide events
	Message.ignoreEvent(true);
	
	// Ensure LegatoUp samplers are unmuted
	setSamplerUnmuted(PerformanceType.LEGATOUP);
	
	// Trigger the upward multi-fret portamento slide on the closest string
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
	Globals.g_stringPerformance[closestString] = PerformanceType.LEGATOUP;
	
	// Preserve LEGATOGENERAL so that subsequent overlapping notes stay in legato mode
	if (legatoKeySwitchPlaying || Synth.isKeyDown(LEGATOKEYSWITCHNOTE) || Globals.g_currArticulationPlaying == PerformanceType.LEGATOGENERAL)
	{
		Globals.g_currArticulationPlaying = PerformanceType.LEGATOGENERAL;
	}
	else
	{
		Globals.g_currArticulationPlaying = PerformanceType.LEGATOUP;
	}
	lastStringPlayed = closestString;
	
	return true;
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



const var legatoDownSamplerLowestStringNum = 1;
const var legatoDownSamplerHighestStringNum = NUMOFSTRINGS;

const var legatoUpSamplerLowestStringNum = 1;
const var legatoUpSamplerHighestStringNum = NUMOFSTRINGS;


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

 
const var AllLegatoDownLeftSamplers = createAllLeftArticSamplerArray(legatoDownSamplerName, legatoDownSamplerLowestStringNum, legatoDownSamplerHighestStringNum);

const var AllLegatoDownRightSamplers = createAllRightArticSamplerArray(legatoDownSamplerName, legatoDownSamplerLowestStringNum, legatoDownSamplerHighestStringNum);

const var AllLegatoUpLeftSamplers = createAllLeftArticSamplerArray(legatoUpSamplerName, legatoUpSamplerLowestStringNum, legatoUpSamplerHighestStringNum);

const var AllLegatoUpRightSamplers = createAllRightArticSamplerArray(legatoUpSamplerName, legatoUpSamplerLowestStringNum, legatoUpSamplerHighestStringNum);

inline function concatArrays(arr1, arr2)
{
    local result = [];
    
    for (item in arr1)
        result.push(item);
        
    for (item in arr2)
        result.push(item);
        
    return result;
}

const var AllLegatoGeneralLeftSamplers = concatArrays(AllLegatoUpLeftSamplers, AllLegatoDownLeftSamplers)

 
 const var AllMuteLeftSamplers = createAllLeftArticSamplerArray(muteSamplerName, muteSamplerLowestStringNum, muteSamplerHighestStringNum);
 
 const var AllMuteRightSamplers = createAllRightArticSamplerArray(muteSamplerName, muteSamplerLowestStringNum, muteSamplerHighestStringNum);
 
 
 const var AllHarmonicLeftSamplers = createAllLeftArticSamplerArray(harmonicSamplerName, harmonicSamplerLowestStringNum, harmonicSamplerHighestStringNum);
 
 const var AllHarmonicRightSamplers = createAllRightArticSamplerArray(harmonicSamplerName, harmonicSamplerLowestStringNum, harmonicSamplerHighestStringNum);
 
const var AllLegatoGeneralRightSamplers = concatArrays(AllLegatoUpRightSamplers, AllLegatoDownRightSamplers)


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
AllLeftSamplers[PerformanceType.LEGATOUP] = AllLegatoUpLeftSamplers;
AllLeftSamplers[PerformanceType.LEGATODOWN] = AllLegatoDownLeftSamplers;
AllLeftSamplers[PerformanceType.LEGATOGENERAL] = AllLegatoGeneralLeftSamplers;



AllRightSamplers[PerformanceType.SUSTAIN] = AllSusRightSamplers;
AllRightSamplers[PerformanceType.MUTE] = AllMuteRightSamplers;
AllRightSamplers[PerformanceType.HARMONIC] = AllHarmonicRightSamplers;
AllRightSamplers[PerformanceType.TREMOLO] = AllTremoloRightSamplers;
AllRightSamplers[PerformanceType.LEGATOUP] = AllLegatoUpRightSamplers;
AllRightSamplers[PerformanceType.LEGATODOWN] = AllLegatoDownRightSamplers;
AllRightSamplers[PerformanceType.LEGATOGENERAL] = AllLegatoGeneralRightSamplers;


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

//	eventIds.setValue(notePlayed, notePlayedId);





	detectKeySwitch(notePlayed);
	
	if(Globals.g_resetNotes == true)
		resetNotes();
	
	
	if(isBetweenIncl(notePlayed, LOWESTNOTE, HIGHESTNOTE)){

		local isLegatoActive = legatoKeySwitchPlaying || 
		                       Synth.isKeyDown(LEGATOKEYSWITCHNOTE) || 
		                       (Globals.g_currArticulationPlaying == PerformanceType.LEGATOGENERAL) || 
		                       (Globals.g_currArticulationPlaying == PerformanceType.LEGATOUP);

		if(isLegatoActive){

			didPlayNoteLegato = playNextNoteLegato(notePlayed, velocityPlayed);
			if(!didPlayNoteLegato){
				// First note in legato phrase (no previous active lower note to slide from)
				// Unmute sustain sampler and play note normally on a string, but preserve legato keyswitch state
				setSamplerUnmuted(PerformanceType.SUSTAIN);
				playNextNoteOnNewString(notePlayed, velocityPlayed);
			}
		
		}else{
	
			 playNextNoteOnNewString(notePlayed, velocityPlayed);
			
			
			
		}
		
		for(i = 0; i < stringNote.length - 1; i++){
			if(stringNote[i] != NO_NOTE){
			
				eventIds.setValue(stringNote[i], stringNoteId[i]);
			}
		}
		
	}
	

	
	

	
	strumIfStrumKeyPressed(notePlayed, stringNoteId, stringNote, velocityPlayed);
	
	individualNoteStrum(notePlayed, velocityPlayed, stringNote, stringNoteId, indivNoteStrumIds);
	
	
	
/*	for(i = 0; i < NoteIdLabels.length; i++){
		NoteIdLabels[i].set("text", stringNoteId[i]);
	}*/

//	strumIfStrumKeyPressed(notePlayed, IdsToTest, notesToTest, velocityPlayed);
	
//	individualNoteStrum(notePlayed, velocityPlayed, notesToTest, IdsToTest, indivNoteStrumIds);

	
}
function onNoteOff()
{
    local releasedNote = Message.getNoteNumber();
    local releasedNoteId = Message.getEventId();
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
			
	for (var s = 0; s < NUMOFSTRINGS; s++)
	{
	    if (stringNote[s] != NO_NOTE && !Synth.isKeyDown(stringNote[s]))
	    {
			if(notePlayedMethod[s] == StringPlayingMethod.pianoRoll){
				noteOffStringSound(s, stringNote, stringNoteId);
			}
	        noteOffStringHolder(s, stringNote, stringNoteId);
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
	
}
 function onTimer()
{
	
}
 function onControl(number, value)
{
	
}
 