 include("KeyswitchConstants.js");
 
 include("NoteRangeAndOpenStringNote.js");function onNoteOn()
{
	local noteNumber = Message.getNoteNumber();
	local stringToPlay = Message.getChannel();
	local stringEnumToPlay = stringToPlay - 1;
	local OpenNoteOfStringPlayed = OPENSTRINGNOTES[stringEnumToPlay];
	local highestNoteOfStringPlayed = OpenNoteOfStringPlayed + NOTESPERSTRING;
	
	

	
	if(noteNumber >= LOWESTNOTE && noteNumber <= HIGHESTNOTE){
		if(noteNumber >= highestNoteOfStringPlayed - NOTEPITCHSPREAD){

		
			Message.setTransposeAmount(-NOTEPITCHSPREAD);
			Message.setCoarseDetune(NOTEPITCHSPREAD);
		}else{
			

		
	
		Message.setTransposeAmount(NOTEPITCHSPREAD);
		Message.setCoarseDetune(-NOTEPITCHSPREAD);
		}
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
 