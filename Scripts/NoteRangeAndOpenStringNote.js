 const var POSINFINITY = 1/0;
 
 const var OPENSTRING8NOTE = 40;
 const var OPENSTRING7NOTE = 47;
 const var OPENSTRING6NOTE = 52;
 const var OPENSTRING5NOTE = 57;
 const var OPENSTRING4NOTE = 62;
 const var OPENSTRING3NOTE = 67;
 const var OPENSTRING2NOTE = 71;
 const var OPENSTRING1NOTE = 76;
 
 const var NUMOFSTRINGS = 8;
 const var LOWESTNOTE = OPENSTRING8NOTE;
 const var HIGHESTNOTE = 97;
 
 
 
 const var NO_NOTE = -1;
 
 const var NOTESPERSTRING = 26;
 
 const var OPENSTRINGNONOTE = POSINFINITY;
 
 const var OPENSTRINGNOTES = [OPENSTRING1NOTE, OPENSTRING2NOTE, OPENSTRING3NOTE, OPENSTRING4NOTE, OPENSTRING5NOTE, OPENSTRING6NOTE, OPENSTRING7NOTE, OPENSTRING8NOTE, OPENSTRINGNONOTE];
 
 const var NOTEPITCHSPREAD = 2;
 
 namespace StringType
 {
 
 // these dictate the midi channel and array index these values come in at
 
     const var STRING1 = 0;
     const var STRING2 = 1;
     const var STRING3 = 2;
     const var STRING4 = 3;
     const var STRING5 = 4;
     const var STRING6 = 5;
     const var STRING7 = 6;
     const var STRING8 = 7;
     const var LEGATOOFFSET = NUMOFSTRINGS;
     
     const var STRING1LEG = 8;
     const var STRING2LEG = 9;
     const var STRING3LEG = 10;
     const var STRING4LEG = 11;
     const var STRING5LEG = 12;
     const var STRING6LEG = 13;
     const var STRING7LEG = 14;
     const var STRING8LEG = 15;
     const var NOSTRING = 16;
 
 }