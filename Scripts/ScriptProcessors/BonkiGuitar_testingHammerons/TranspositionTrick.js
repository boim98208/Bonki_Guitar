 include("KeyswitchConstants.js");
 
 include("NoteRangeAndOpenStringNote.js");function onNoteOn()
{
	local noteNumber = Message.getNoteNumber();
	
	if(noteNumber >= LOWESTNOTE && noteNumber <= HIGHESTNOTE){
		Message.setTransposeAmount(2);
		Message.setCoarseDetune(-2);
	}else{
		Message.ignoreEvent(true);
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
 