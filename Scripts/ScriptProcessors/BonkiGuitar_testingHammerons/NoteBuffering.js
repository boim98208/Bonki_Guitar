include("KeyswitchConstants.js");
 
include("NoteRangeAndOpenStringNote.js");function onNoteOn()
{
	local noteNumber = Message.getNoteNumber();
	local delayToGive;
	
	if(noteNumber >= LOWESTNOTE && noteNumber <= HIGHESTNOTE){
		delayToGive = noteNumber - LOWESTNOTE + 1;
	
	Message.delayEvent(delayToGive);
	}else if(noteNumber >= StrummingKeyswitches.downStrumKeyswitch && noteNumber <= StrummingKeyswitches.highIndivStrumKeyswitch){
	
	delayToGive = HIGHESTNOTE - LOWESTNOTE + 2;
	
		Message.delayEvent(delayToGive);
	}
}
 function onNoteOff()
{
	
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
 