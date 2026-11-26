include("KeyswitchConstants.js");
 
include("NoteRangeAndOpenStringNote.js");

global g_noteToPlayBufferData = {
	inputtedNotes: [],
	inputtedNotesOnTime: [],
	inputtedNoteVelocities: [],
	inputtedNoteProcessed: [],
};
 	
g_noteToPlayBufferData.inputtedNotes.reserve(128);
g_noteToPlayBufferData.inputtedNotesOnTime.reserve(128);
g_noteToPlayBufferData.inputtedNoteVelocities.reserve(128);
g_noteToPlayBufferData.inputtedNoteProcessed.reserve(256);

Globals.g_noteToPlayBufferData = g_noteToPlayBufferData;
 function onNoteOn()
{
	local noteNumber = Message.getNoteNumber();
	local noteVelocity = Message.getVelocity();
	local noteUpTime = Engine.getUptime();
	local delayToGive;
	
	//g_noteToPlayBufferData.inputtedNotes.push


if(Message.isArtificial()){
	return;
}

	
	if(noteNumber >= LOWESTNOTE && noteNumber <= HIGHESTNOTE){
		
	
	
		if (Globals.g_noteToPlayBufferData.inputtedNotes.length >= 120)
		{
			Globals.g_noteToPlayBufferData.inputtedNotes.clear();
			Globals.g_noteToPlayBufferData.inputtedNotesOnTime.clear();
			Globals.g_noteToPlayBufferData.inputtedNoteVelocities.clear();
			Globals.g_noteToPlayBufferData.inputtedNoteProcessed.clear();
		}
	
		Globals.g_noteToPlayBufferData.inputtedNotes.push(noteNumber);
		Globals.g_noteToPlayBufferData.inputtedNotesOnTime.push(noteUpTime);
		Globals.g_noteToPlayBufferData.inputtedNoteVelocities.push(noteVelocity);
		Globals.g_noteToPlayBufferData.inputtedNoteProcessed.push(false);
	
	//	Console.print("[NoteBuffering] NoteOn: " + noteNumber + " vel=" + noteVelocity + " uptime=" + noteUpTime + " ts=" + Message.getTimestamp() + " bufLen=" + Globals.g_noteToPlayBufferData.inputtedNotes.length);
	
	//delayToGive = noteNumber - LOWESTNOTE + 1;
	
	//old way of giving the engine the time to think. Currently trying to implement a proper buffer with g_noteToPlayBufferData
	//Message.delayEvent(delayToGive);
	
	
	Synth.addNoteOn(1, noteNumber, noteVelocity, 1);
	Message.ignoreEvent(true);
	return;
	
	}else if(noteNumber >= StrummingKeyswitches.downStrumKeyswitch && noteNumber <= StrummingKeyswitches.highIndivStrumKeyswitch){
	
	delayToGive = HIGHESTNOTE - LOWESTNOTE + 2;
	
		Message.delayEvent(delayToGive);
	}
}
 function onNoteOff()
{
	local noteReleased = Message.getNoteNumber();
	
	
	if(noteReleased >= LOWESTNOTE && noteReleased <= HIGHESTNOTE){

	local indexOfNoteReleased = Globals.g_noteToPlayBufferData.inputtedNotes.indexOf(noteReleased);
	

	
	if(indexOfNoteReleased != -1){
		

	
	Globals.g_noteToPlayBufferData.inputtedNotes.remove(indexOfNoteReleased);
	Globals.g_noteToPlayBufferData.inputtedNotesOnTime.remove(indexOfNoteReleased);
	Globals.g_noteToPlayBufferData.inputtedNoteVelocities.remove(indexOfNoteReleased);
	Globals.g_noteToPlayBufferData.inputtedNoteProcessed.remove(indexOfNoteReleased);
	
	}
	
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
 