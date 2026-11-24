 //keyswitches
 const var SUSTAINKEYSWITCHNOTE = 24; //C3 in cakewalk
 const var MUTEKEYSWITCHNOTE = 25;
 const var HARMONICKEYSWITCHNOTE = 26;
 const var TREMOLOKEYSWITCHNOTE = 27;
 const var SFXKEYSWITCHNOTE = 28;
 
 const var LEGATOKEYSWITCHNOTE = 37; //Db4 in cakewalk
 
 const var FIRSTKEYSWITCH = SUSTAINKEYSWITCHNOTE;
 const var LASTKEYSWITCH = SFXKEYSWITCHNOTE;
 
 const var FIRSTPERCUSSION = 10;
 const var LASTPERCUSSION = 20;
 
 const var AUTOFRETMODEKEYSWITCH = 38;
 const var FORCEFRETMODEKEYSWITCH = 39;
 
 const var NOTESPERSTRING = 25;
 const var NUMOFSTRINGS = 8;
 
 
 namespace PerformanceType
 {
 	const var SUSTAIN = 0;
 	const var MUTE = 1;
 	const var HARMONIC = 2;
 	const var TREMOLO = 3;
 	const var SFX = 4;
 	
 	const var LEGATOUP = 5;
 	const var LEGATODOWN = 6;
 	const var LEGATOGENERAL = 7;
 	
 	const var LegatoUp = 5;
 	const var LegatoDown = 6;
 	const var LegatoGeneral = 7;
 	
 	const var LEGATO = 7;
 	const var Legato = 7;
 	
 	const var NUMOFPERFORMANCES = 8;
 	//SFX will just be separate keys down low... maybe
 }
 
 namespace LegatoDirection
 {
	 const var LegatoUp = 0;
	 const var LegatoDown = 1;
	 const var LegatoUpVel = 65;
	 const var LegatoDownVel = 1;
 }
 
 
 
 
 const var articLowestFretOnString = [];
 const var articHighestFretOnString = [];
 
 /*
  the format of these is the first bracket gets the string and the second bracket gets the articulation. 
 By default lowest fret will be 0 (open string) and highest fret will be the NOTESPERSTRING. These variables are primarily for articulations that take multiple strings or just can't be done on all strings like chords. If highest and lowest fret are both NO_NOTE, that means none of the articulation can be played there.
 */
 
 for(i = 0; i < NUMOFSTRINGS; i++){
 	articLowestFretOnString.push([]);
 	articHighestFretOnString.push([]);
 	for(var j = 0; j < PerformanceType.NUMOFPERFORMANCES; j++){
 		articLowestFretOnString[i].push(0);
 		articHighestFretOnString[i].push(NOTESPERSTRING - 1);
 		// NOTESPERSTRING is not inclusive 0 but fret does include 0 as part of open string, so minus 1 to compensate
 	}
 }
 

 
 
 namespace FrettingEngine
 {
 	//make sure this lines up with the item list from the combo box
 
 	const var NATURAL = 1;
 	const var MELODY = 2;
 }
 
 namespace FrettingEngineKeySwitch{
	const var NATURAL = 0;
	const var MELODY = 1;
	const var FIRSTENGINE = FrettingEngineKeySwitch.NATURAL;
	const var LASTENGINE = FrettingEngineKeySwitch.MELODY;
 }
 
 
 namespace RRBehaviour{
	 const var SEPARATE = 0;
	 const var RANDOM = 1;
	 const var LINEAR = 2;
 }
 
namespace StrummingDirection{
	const var notStrumming = 0;
	const var downStrumming = 1;
	const var upStrumming = 2;
}

namespace StrummingKeyswitches{
	const var downStrumKeyswitch = 108; // C7 in HISE
	const var upStrumKeyswitch = 109;
	
	const var individualStrumKeyswitches = [110, 111, 112, 113, 114, 115, 116, 117];
	
	const var lowIndivStrumKeyswitch = individualStrumKeyswitches[0];
	
	const var highIndivStrumKeyswitch = individualStrumKeyswitches[NUMOFSTRINGS - 1];
}


namespace StringPlayingMethod{
	const var pianoRoll = 0;
	const var fullStrumKey = 1;
	const var indivStrumKey = 2;
}