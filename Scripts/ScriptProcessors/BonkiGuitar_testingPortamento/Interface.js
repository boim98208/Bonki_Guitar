include("LegatoData.js");

reg i = 0;
reg step = 0;
reg noteCount = 0;

const var NO_NOTE = -1;
const var LOWESTNOTE = 41;
const var HIGHESTNOTE = 64;

reg transitionFromNoteId = NO_NOTE;
var transitionFromNote = NO_NOTE;
var currentRealNote = NO_NOTE;

// Transition timing and destination tracking registers
reg slideStartTimeSec = 0.0;
reg slideTotalDurationMS = 0.0;
reg slideDestinationVoiceId = NO_NOTE;

const var eventIdArray = [];
eventIdArray.reserve(127);

Synth.setFixNoteOnAfterNoteOff(true);

inline function linMap(value, inMin, inMax, outMin, outMax)
{
    return outMin + (value - inMin) * (outMax - outMin) / (inMax - inMin);
}

const var shortestLegatoTimeMS = 15;
const var longestLegatoTimeMS = 800;

inline function isBetweenIncl(lowBound, highBound, num)
{
    return (num >= lowBound && num <= highBound);
}

/**
 * Terminates all active and queued notes in the target event ID array.
 * If the transition reached the destination note, it seamlessly releases the destination note.
 * If the transition ended early before reaching the last note, it seamlessly fades out the
 * currently active note and mutes/notes-off all incoming queued notes so they do not explode the volume.
 */
inline function endSlide(targetEventIdArray)
{
    local currentTimeSec = Engine.getUptime();
    local elapsedMS = (currentTimeSec - slideStartTimeSec) * 1000.0;
    local reachedLastNote = (slideDestinationVoiceId != NO_NOTE) && ((elapsedMS >= slideTotalDurationMS) || Synth.isArtificialEventActive(slideDestinationVoiceId));
    
    if (reachedLastNote)
    {
        // Transition successfully reached the destination note.
        // Cleanly release destination note with a smooth fade out
        if (slideDestinationVoiceId != NO_NOTE && Synth.isArtificialEventActive(slideDestinationVoiceId))
        {
            Synth.addVolumeFade(slideDestinationVoiceId, 25, -100);
            Synth.noteOffDelayedByEventId(slideDestinationVoiceId, Engine.getSamplesForMilliSeconds(25));
        }
        else if (slideDestinationVoiceId != NO_NOTE)
        {
            Synth.noteOffByEventId(slideDestinationVoiceId);
        }
    }
    else
    {
        // Destination note ended early before reaching the last note!
        // 1. Seamlessly fade out whichever intermediate voice is currently sounding
        for (i = 0; i < targetEventIdArray.length; i++)
        {
            local activeEvId = targetEventIdArray[i];
            if (activeEvId > 0 && Synth.isArtificialEventActive(activeEvId))
            {
                Synth.addVolumeFade(activeEvId, 25, -100);
                Synth.noteOffDelayedByEventId(activeEvId, Engine.getSamplesForMilliSeconds(25));
            }
        }
        
        // 2. Note-off every other note that's coming in, and add volume fade so they don't explode
        for (i = 0; i < targetEventIdArray.length; i++)
        {
            local queuedEvId = targetEventIdArray[i];
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
    
    targetEventIdArray.clear();
    slideDestinationVoiceId = NO_NOTE;
    slideTotalDurationMS = 0.0;
    slideStartTimeSec = 0.0;
}

/**
 * Executes the upward multi-fret portamento slide.
 * Fades out the currently sustaining voice over its crossfade overlap window,
 * queues the intermediate fret notes and destination note into targetEventIdArray,
 * and schedules note-offs for intermediate notes.
 */
inline function triggerSlide(startNote, endNote, targetEventIdArray, velocity)
{
    local prevVoiceId = NO_NOTE;
    if (targetEventIdArray.length > 0)
    {
        prevVoiceId = targetEventIdArray[targetEventIdArray.length - 1];
    }
    
    local initialOverlapMS = LegatoData.getCrossfadeMS(startNote, velocity);
    local initialOverlapSamples = Engine.getSamplesForMilliSeconds(initialOverlapMS);
    
    // Release previous sustaining voice with smooth overlap
    if (prevVoiceId != NO_NOTE && Synth.isArtificialEventActive(prevVoiceId))
    {
        Synth.noteOffDelayedByEventId(prevVoiceId, initialOverlapSamples);
    }
    
    // Terminate any stale/unplayed voices except the previous sustaining voice
    for (i = 0; i < targetEventIdArray.length; i++)
    {
        local evId = targetEventIdArray[i];
        if (evId > 0 && evId != prevVoiceId)
        {
            Synth.noteOffByEventId(evId);
            if (Synth.isArtificialEventActive(evId))
            {
                Synth.addVolumeFade(evId, 5, -100);
            }
        }
    }
    targetEventIdArray.clear();
    
    local interval = endNote - startNote;
    if (interval <= 0)
        return;
        
    local numSteps = interval;
    local currentOffsetSamples = 0;
    local speedFactor = linMap(velocity, 1, 127, 1.8, 0.55);
    local stepNote;
    local stepDurMS;
    local stepDurSamples;
    local stepOverlapMS;
    local stepOverlapSamples;
    local isLastStep;
    local voiceId;
    
    for (step = 0; step < numSteps; step++)
    {
        stepNote = startNote + 1 + step;
        isLastStep = (step == numSteps - 1);
        
        stepDurMS = LegatoData.getTransitDurationMS(stepNote) * speedFactor;
        stepDurSamples = Engine.getSamplesForMilliSeconds(stepDurMS);
        
        // Add note to queue at sample offset
        voiceId = Synth.addNoteOn(1, stepNote, velocity, currentOffsetSamples);
        targetEventIdArray.push(voiceId);
        
        if (!isLastStep)
        {
            // Intermediate note: schedule release after transit duration + dynamic crossfade
            stepOverlapMS = LegatoData.getCrossfadeMS(stepNote, velocity);
            stepOverlapSamples = Engine.getSamplesForMilliSeconds(stepOverlapMS);
            
            Synth.noteOffDelayedByEventId(voiceId, currentOffsetSamples + stepDurSamples + stepOverlapSamples);
            currentOffsetSamples += stepDurSamples;
        }
        else
        {
            // Destination note: record transition timing and voice ID for early-abort checking
            slideDestinationVoiceId = voiceId;
            slideTotalDurationMS = (currentOffsetSamples / Engine.getSampleRate()) * 1000.0;
            slideStartTimeSec = Engine.getUptime();
        }
    }
}

function onNoteOn()
{
    local newNotePlayed = Message.getNoteNumber();
    local newNoteVelocity = Message.getVelocity();
    
    if (!isBetweenIncl(LOWESTNOTE, HIGHESTNOTE, newNotePlayed))
    {
        return;
    }
    
    // Suppress raw MIDI event - engine controls all voices artificially
    Message.ignoreEvent(true);
    
    if (transitionFromNoteId == NO_NOTE)
    {
        // First note (non-legato trigger)
        endSlide(eventIdArray);
        noteCount = 1;
        
        transitionFromNoteId = Synth.addNoteOn(1, newNotePlayed, newNoteVelocity, 0);
        eventIdArray.push(transitionFromNoteId);
        
        slideDestinationVoiceId = transitionFromNoteId;
        slideTotalDurationMS = 0.0;
        slideStartTimeSec = Engine.getUptime();
        
        transitionFromNote = newNotePlayed;
        currentRealNote = newNotePlayed;
    }
    else
    {
        // Legato transition
        noteCount++;
        
        local startNote = currentRealNote;
        local endNote = newNotePlayed;
        local interval = endNote - startNote;
        
        if (interval == 0)
        {
            // Retrigger same note cleanly
            endSlide(eventIdArray);
            transitionFromNoteId = Synth.addNoteOn(1, newNotePlayed, newNoteVelocity, 0);
            eventIdArray.push(transitionFromNoteId);
            
            slideDestinationVoiceId = transitionFromNoteId;
            slideTotalDurationMS = 0.0;
            slideStartTimeSec = Engine.getUptime();
            return;
        }
        
        // Trigger upward slide
        triggerSlide(startNote, endNote, eventIdArray, newNoteVelocity);
        
        // Pull destination voice from the last entry of the event ID array
        if (eventIdArray.length > 0)
        {
            transitionFromNoteId = eventIdArray[eventIdArray.length - 1];
        }
        
        currentRealNote = endNote;
        transitionFromNote = endNote;
    }
}

function onNoteOff()
{
    local releasedNote = Message.getNoteNumber();
    
    if (!isBetweenIncl(LOWESTNOTE, HIGHESTNOTE, releasedNote))
    {
        return;
    }
    
    noteCount--;
    if (noteCount < 0)
        noteCount = 0;
    
    // Only kill voices when the CURRENT destination key is released or all keys released
    if (releasedNote == currentRealNote || noteCount == 0)
    {
        endSlide(eventIdArray);
        
        transitionFromNoteId = NO_NOTE;
        transitionFromNote = NO_NOTE;
        currentRealNote = NO_NOTE;
    }
}

function onController()
{
	
}
 function onTimer()
{
	
}
 function onControl(number, value)
{
	
}
