import argparse
import xml.etree.ElementTree as ET
from xml.dom import minidom
import os

UIDATA_XML = """
          <UIData>
            <ContentProperties DeviceType="Desktop">
              <Component type="ScriptImage" id="CreditsBG" x="0" y="-60" width="1020"
                         height="800" fileName="{PROJECT_FOLDER}Credits_BG.png" scale="0.699999988079071"/>
              <Component type="ScriptImage" id="PlayingModeBG" x="0" y="-60" width="1020"
                         height="800" fileName="{PROJECT_FOLDER}Empty_BG.png" scale="0.699999988079071">
                <Component type="ScriptFloatingTile" id="PlayingModeKeyboard" x="0" y="580"
                           width="1020" height="73" ContentType="Keyboard" bgColour="4294967295"
                           itemColour="4294967295" itemColour2="4294967295" textColour="0"
                           Data="{&#10;  &quot;KeyWidth&quot;: 14,&#10;  &quot;DisplayOctaveNumber&quot;: true,&#10;  &quot;LowKey&quot;: 0,&#10;  &quot;HiKey&quot;: 127,&#10;  &quot;CustomGraphics&quot;: false,&#10;  &quot;DefaultAppearance&quot;: false,&#10;  &quot;BlackKeyRatio&quot;: 0.699999988079071,&#10;  &quot;ToggleMode&quot;: false,&#10;  &quot;MidiChannel&quot;: 1,&#10;  &quot;UseVectorGraphics&quot;: true,&#10;  &quot;UseFlatStyle&quot;: false,&#10;  &quot;MPEKeyboard&quot;: false,&#10;  &quot;MPEStartChannel&quot;: 2,&#10;  &quot;MPEEndChannel&quot;: 16&#10;}"
                           parentComponent="PlayingModeBG"/>
                <Component type="ScriptLabel" id="CurrArticulationPlayingLabel" x="530"
                           y="490" width="100" height="34" parentComponent="PlayingModeBG"
                           text="Sustain" textColour="4278190080" fontName="Shehroz" fontSize="18.0"
                           alignment="left"/>
                <Component type="ScriptLabel" id="ArticulationPlayingLabel" x="430" y="490"
                           width="100" height="34" parentComponent="PlayingModeBG" text="Articulation:"
                           textColour="4278190080" fontName="Shehroz" fontSize="18.0"/>
                <Component type="ScriptPanel" id="FretBorderPanel" x="260" y="240" itemColour="0"
                           itemColour2="0" textColour="16777215" bgColour="16777215" width="450"
                           parentComponent="PlayingModeBG">
                  <Component type="ScriptImage" id="FretBorderLow" x="0" y="25" parentComponent="FretBorderPanel"
                             fileName="{PROJECT_FOLDER}PlayingMode_HandBorder.png" scale="0.25"
                             height="15" width="10" text="FretBorderLowForced"/>
                  <Component type="ScriptImage" id="FretBorderLowForced" x="0" y="25" parentComponent="FretBorderPanel"
                             fileName="{PROJECT_FOLDER}PlayingMode_HandBorder_Forced.png"
                             scale="0.25" height="15" width="10" visible="0"/>
                  <Component type="ScriptImage" id="FretBorderHigh" x="146" y="25" parentComponent="FretBorderPanel"
                             fileName="{PROJECT_FOLDER}PlayingMode_HandBorder.png" scale="0.25"
                             height="15" width="10" text="FretBorderLowForced"/>
                  <Component type="ScriptImage" id="FretBorderHighForced" x="146" y="25" parentComponent="FretBorderPanel"
                             fileName="{PROJECT_FOLDER}PlayingMode_HandBorder_Forced.png"
                             scale="0.25" height="15" width="10" visible="0"/>
                  <Component type="ScriptImage" id="FretBorderCenter" x="73" y="23" parentComponent="FretBorderPanel"
                             fileName="{PROJECT_FOLDER}PlayingMode_HandCenter.png" height="15"
                             width="15" text="FretBorderLowForced" scale="0.4000000059604645"/>
                  <Component type="ScriptImage" id="FretBorderCenterForced" x="73" y="23"
                             parentComponent="FretBorderPanel" fileName="{PROJECT_FOLDER}PlayingMode_HandCenter_Forced.png"
                             height="15" width="15" text="FretBorderLowForced" scale="0.4000000059604645"
                             visible="0"/>
                </Component>
                <Component type="ScriptPanel" id="PerformanceOptionsPanel" x="10" y="370"
                           height="195" width="436" itemColour="0" itemColour2="0" bgColour="16777215"
                           textColour="16777215" borderSize="0.0" parentComponent="PlayingModeBG">
                  <Component type="ScriptSlider" id="HandPositionFretForceKnob" x="224" y="12"
                             text="Fret: Auto" width="726" mode="Discrete" stepSize="1.0"
                             middlePosition="10.0" min="1.0" max="19.0" parentComponent="PerformanceOptionsPanel"
                             filmstripImage="{PROJECT_FOLDER}ForceFretPosition_Knob_Filmstrip.png"
                             height="47" scaleFactor="0.25" numStrips="19.0" mouseSensitivity="0.699999988079071"/>
                  <Component type="ScriptSlider" id="StringForceKnob" x="224" y="62" width="185"
                             text="string: 6.0" mode="Discrete" stepSize="1.0" middlePosition="4.0"
                             max="7.0" min="1.0" defaultValue="1.0" parentComponent="PerformanceOptionsPanel"
                             filmstripImage="{PROJECT_FOLDER}ForceString_Knob_Filmstrip.png"
                             numStrips="7.0" scaleFactor="0.25" mouseSensitivity="0.699999988079071"/>
                  <Component type="ScriptComboBox" id="FrettingEngineComboBox" x="230" y="122"
                             max="2" items="Natural&#10;Melody" enableMidiLearn="1" parentComponent="PerformanceOptionsPanel"/>
                  <Component type="ScriptLabel" id="FrettingModeLabel" x="50" y="122" width="130"
                             height="30" text="Fretting Mode:" fontSize="28.0" parentComponent="PerformanceOptionsPanel"
                             visible="0" enabled="0"/>
                  <Component type="ScriptLabel" id="ForceStringTextLabel" x="30" y="72" parentComponent="PerformanceOptionsPanel"
                             fontSize="30.0" text="Force String:" width="189" visible="0"
                             enabled="0"/>
                  <Component type="ScriptLabel" id="ForceFretPositionLabel" x="10" y="12"
                             parentComponent="PerformanceOptionsPanel" text="Force Fret Position:"
                             fontSize="30.0" width="210" height="30" visible="0" enabled="0"/>
                  <Component type="ScriptButton" id="ResetGlobalRRButton" x="110" y="50" width="100"
                             height="25" parentComponent="PerformanceOptionsPanel" isMomentary="1"
                             text="Midi Panic"/>
                </Component>
                <Component type="ScriptPanel" id="StringForcePanel" x="260" y="275" width="648"
                           height="86" parentComponent="PlayingModeBG" itemColour="0" itemColour2="0"
                           textColour="16777215">
                  <Component type="ScriptImage" id="StringForceString6" x="12" y="67" width="605"
                             height="10" parentComponent="StringForcePanel" fileName="{PROJECT_FOLDER}PlayingMode_ForceString_Indicator_String6.png"
                             scale="0.699999988079071" visible="0"/>
                  <Component type="ScriptImage" id="StringForceString5" x="12" y="57" width="605"
                             height="10" parentComponent="StringForcePanel" fileName="{PROJECT_FOLDER}PlayingMode_ForceString_Indicator_String5.png"
                             scale="0.699999988079071" visible="0"/>
                  <Component type="ScriptImage" id="StringForceString4" x="12" y="48" width="605"
                             height="10" parentComponent="StringForcePanel" fileName="{PROJECT_FOLDER}PlayingMode_ForceString_Indicator_String4.png"
                             scale="0.699999988079071" visible="0"/>
                  <Component type="ScriptImage" id="StringForceString3" x="12" y="38" width="605"
                             height="10" parentComponent="StringForcePanel" fileName="{PROJECT_FOLDER}PlayingMode_ForceString_Indicator_String3.png"
                             scale="0.699999988079071" visible="0"/>
                  <Component type="ScriptImage" id="StringForceString2" x="12" y="28" width="605"
                             height="10" parentComponent="StringForcePanel" fileName="{PROJECT_FOLDER}PlayingMode_ForceString_Indicator_String2.png"
                             scale="0.699999988079071" visible="0"/>
                  <Component type="ScriptImage" id="StringForceString1" x="12" y="18" width="605"
                             height="10" parentComponent="StringForcePanel" fileName="{PROJECT_FOLDER}PlayingMode_ForceString_Indicator_String1.png"
                             scale="0.699999988079071" visible="0"/>
                </Component>
                <Component type="ScriptPanel" id="DSPPanel" x="280" y="130" width="557"
                           height="100" parentComponent="PlayingModeBG" itemColour="3355443"
                           itemColour2="1118481" textColour="16777215" bgColour="16777215">
                  <Component type="ScriptSlider" id="IRMixKnob" x="30" y="30" width="125"
                             height="30" parentComponent="DSPPanel" middlePosition="0.5"/>
                  <Component type="ScriptComboBox" id="cmbIr" x="170" y="40" width="131" height="21"
                             parentComponent="DSPPanel" text="Load Impulse" items="&#10;Ample M (rec 50 perc)&#10;Ample SJ (rec 43 percent)&#10;Ample T (rec 50 percent)"
                             max="3"/>
                </Component>
                <Component type="ScriptPanel" id="VibratoPnl" x="120" y="140" width="150"
                           height="100" parentComponent="PlayingModeBG" itemColour="0" itemColour2="0"
                           textColour="16777215" bgColour="16777215">
                  <Component type="ScriptSlider" id="VibratoDepthKnob" x="20" y="0" width="36"
                             height="38" parentComponent="VibratoPnl" filmstripImage="{PROJECT_FOLDER}General_Knob_Filmstrip.png"
                             numStrips="100.0" scaleFactor="0.2000000029802322" mouseSensitivity="0.5"
                             max="3.5" middlePosition="1.0" showValuePopup="Above"/>
                  <Component type="ScriptSlider" id="VibratoFreqKnob" x="90" y="0" width="36"
                             height="38" parentComponent="VibratoPnl" filmstripImage="{PROJECT_FOLDER}General_Knob_Filmstrip.png"
                             numStrips="100.0" scaleFactor="0.2000000029802322" mouseSensitivity="0.5"
                             max="40.0" defaultValue="8.5" middlePosition="8.0" showValuePopup="Above"
                             mode="Frequency"/>
                  <Component type="ScriptLabel" id="VibratoDepthLabel" x="0" y="30" width="68"
                             height="40" parentComponent="VibratoPnl" text="Depth" textColour="4278190080"
                             fontName="Shehroz" fontSize="18.0"/>
                  <Component type="ScriptLabel" id="VibratoFreqLabel" x="60" y="30" width="100"
                             height="40" parentComponent="VibratoPnl" text="Frequency" textColour="4278190080"
                             fontName="Shehroz" fontSize="18.0"/>
                </Component>
                <Component type="ScriptPanel" id="PitchBendRangePnl" x="590" y="110" width="102"
                           height="86" parentComponent="PlayingModeBG" itemColour="0" itemColour2="0"
                           textColour="16777215" bgColour="16777215">
                  <Component type="ScriptLabel" id="PitchBendRangeLabel" x="0" y="10" width="100"
                             height="100" parentComponent="PitchBendRangePnl" text="Pitch Bend Range"
                             textColour="4278190080" fontName="Shehroz" fontSize="18.0"/>
                  <Component type="ScriptSlider" id="PitchBendRangeKnob" x="30" y="0" width="36"
                             height="38" parentComponent="PitchBendRangePnl" filmstripImage="{PROJECT_FOLDER}General_Knob_Filmstrip.png"
                             numStrips="100.0" scaleFactor="0.2000000029802322" mouseSensitivity="0.5"
                             max="12.0" stepSize="1.0" defaultValue="2.0" showValuePopup="Above"/>
                </Component>
                <Component type="ScriptPanel" id="DoubleTrackingPnl" x="810" y="470" width="186"
                           height="71" parentComponent="PlayingModeBG" itemColour="0" itemColour2="0"
                           textColour="16777215" bgColour="16777215">
                  <Component type="ScriptButton" id="DoubleTrackingBtn" x="-1" y="17" width="32"
                             height="29" parentComponent="DoubleTrackingPnl" filmstripImage="{PROJECT_FOLDER}Checkbox_Filmstrip.png"
                             scaleFactor="0.5"/>
                  <Component type="ScriptLabel" id="DoubleTrackingLabel" x="20" y="-20" width="120"
                             height="100" parentComponent="DoubleTrackingPnl" fontName="Shehroz"
                             textColour="4278190080" text="Double Tracking" fontSize="26.0"
                             editable="0"/>
                </Component>
                <Component type="ScriptPanel" id="StrummingModePnl" x="630" y="460" width="186"
                           height="71" parentComponent="PlayingModeBG" itemColour="0" itemColour2="0"
                           textColour="16777215" bgColour="16777215">
                  <Component type="ScriptButton" id="StrummingModeEnableBtn" x="-1" y="17"
                             width="32" height="29" parentComponent="StrummingModePnl" filmstripImage="{PROJECT_FOLDER}Checkbox_Filmstrip.png"
                             scaleFactor="0.5"/>
                  <Component type="ScriptLabel" id="StrummingModeLabel" x="20" y="-20" width="120"
                             height="100" parentComponent="StrummingModePnl" fontName="Shehroz"
                             textColour="4278190080" text="Strumming Mode" fontSize="26.0"
                             editable="0"/>
                </Component>
                <Component type="ScriptSlider" id="StrumSpeedKnob" x="40" y="130" width="84"
                           height="86" parentComponent="PlayingModeBG" filmstripImage="{PROJECT_FOLDER}General_Knob_Filmstrip.png"
                           numStrips="100.0" scaleFactor="0.2000000029802322" mouseSensitivity="0.5"
                           max="127.0" middlePosition="63.0" showValuePopup="Above" stepSize="1.0">
                  <Component type="ScriptLabel" id="StrumSpeedLabel" x="-10" y="40" width="68"
                             height="40" parentComponent="StrumSpeedKnob" text="Strum Speed"
                             textColour="4278190080" fontName="Shehroz" fontSize="18.0"/>
                  <Component type="ScriptButton" id="EnableStrumSpeedWithVelBtn" x="30" y="20"
                             width="54" height="20" parentComponent="StrumSpeedKnob" text="Vel"/>
                </Component>
                <Component type="ScriptImage" id="PlayingModeGuitarImg" x="10" y="160" width="1006"
                           height="314" parentComponent="PlayingModeBG" fileName="{PROJECT_FOLDER}Bonki_GuitarRender.png"/>
                <Component type="ScriptPanel" id="StringFretMarkersPnl" x="0" y="0" width="1020"
                           height="756" parentComponent="PlayingModeBG" itemColour2="0"
                           itemColour="0">
                  <Component type="ScriptPanel" id="String8FretMarkers" x="0" y="322" width="1020"
                             height="54" parentComponent="StringFretMarkersPnl" itemColour="0"
                             itemColour2="0" textColour="16777215" bgColour="16777215">
                    <Component type="ScriptImage" id="String8Fret0Marker" x="193" y="20" width="11"
                               height="12" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String8FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String8Fret1Marker" x="211" y="20" width="11"
                               height="12" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String8FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String8Fret2Marker" x="250" y="20" width="11"
                               height="12" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String8FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String8Fret3Marker" x="285" y="21" width="11"
                               height="12" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String8FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String8Fret4Marker" x="320" y="21" width="11"
                               height="12" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String8FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String8Fret5Marker" x="351" y="22" width="11"
                               height="12" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String8FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String8Fret6Marker" x="382" y="22" width="11"
                               height="12" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String8FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String8Fret7Marker" x="409" y="23" width="11"
                               height="12" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String8FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String8Fret8Marker" x="434" y="23" width="11"
                               height="12" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String8FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String8Fret9Marker" x="459" y="24" width="11"
                               height="12" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String8FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String8Fret10Marker" x="481" y="24" width="11"
                               height="12" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String8FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String8Fret11Marker" x="504" y="24" width="11"
                               height="12" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String8FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String8Fret12Marker" x="527" y="25" width="11"
                               height="27" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String8FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String8Fret13Marker" x="546" y="25" width="11"
                               height="12" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String8FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String8Fret14Marker" x="565" y="25" width="11"
                               height="12" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String8FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String8Fret15Marker" x="582" y="25" width="11"
                               height="12" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String8FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String8Fret16Marker" x="598" y="26" width="11"
                               height="12" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String8FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String8Fret17Marker" x="614" y="26" width="11"
                               height="12" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String8FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String8Fret18Marker" x="629" y="26" width="11"
                               height="35" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String8FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String8Fret19Marker" x="643" y="26" width="11"
                               height="12" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String8FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String8Fret20Marker" x="655" y="27" width="11"
                               height="12" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String8FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String8Fret21Marker" x="667" y="27" width="11"
                               height="17" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String8FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String8Fret22Marker" x="679" y="27" width="11"
                               height="17" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String8FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String8Fret23Marker" x="690" y="27" width="11"
                               height="17" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String8FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String8Fret24Marker" x="702" y="27" width="11"
                               height="17" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String8FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String8Fret25Marker" x="712" y="28" width="11"
                               height="17" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String8FretMarkers" text="" visible="0"/>
                  </Component>
                  <Component type="ScriptPanel" id="String7FretMarkers" x="0" y="315" width="1020"
                             height="54" parentComponent="StringFretMarkersPnl" itemColour="0"
                             itemColour2="0" textColour="16777215" bgColour="16777215">
                    <Component type="ScriptImage" id="String7Fret0Marker" x="194" y="21" width="11"
                               height="12" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String7FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String7Fret1Marker" x="212" y="21" width="11"
                               height="12" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String7FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String7Fret2Marker" x="251" y="21" width="11"
                               height="12" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String7FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String7Fret3Marker" x="286" y="21" width="11"
                               height="12" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String7FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String7Fret4Marker" x="320" y="22" width="11"
                               height="12" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String7FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String7Fret5Marker" x="351" y="22" width="11"
                               height="12" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String7FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String7Fret6Marker" x="382" y="22" width="11"
                               height="12" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String7FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String7Fret7Marker" x="409" y="23" width="11"
                               height="12" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String7FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String7Fret8Marker" x="434" y="23" width="11"
                               height="12" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String7FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String7Fret9Marker" x="459" y="23" width="11"
                               height="12" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String7FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String7Fret10Marker" x="481" y="23" width="11"
                               height="12" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String7FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String7Fret11Marker" x="503" y="23" width="11"
                               height="12" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String7FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String7Fret12Marker" x="526" y="24" width="11"
                               height="27" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String7FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String7Fret13Marker" x="545" y="24" width="11"
                               height="12" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String7FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String7Fret14Marker" x="563" y="24" width="11"
                               height="12" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String7FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String7Fret15Marker" x="580" y="24" width="11"
                               height="12" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String7FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String7Fret16Marker" x="596" y="24" width="11"
                               height="12" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String7FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String7Fret17Marker" x="612" y="25" width="11"
                               height="12" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String7FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String7Fret18Marker" x="627" y="25" width="11"
                               height="35" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String7FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String7Fret19Marker" x="641" y="25" width="11"
                               height="12" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String7FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String7Fret20Marker" x="653" y="25" width="11"
                               height="12" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String7FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String7Fret21Marker" x="665" y="25" width="11"
                               height="17" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String7FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String7Fret22Marker" x="677" y="25" width="11"
                               height="17" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String7FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String7Fret23Marker" x="688" y="25" width="11"
                               height="17" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String7FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String7Fret24Marker" x="700" y="25" width="11"
                               height="17" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String7FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String7Fret25Marker" x="710" y="26" width="11"
                               height="17" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String7FretMarkers" text="" visible="0"/>
                  </Component>
                  <Component type="ScriptPanel" id="String6FretMarkers" x="0" y="310" width="1020"
                             height="54" parentComponent="StringFretMarkersPnl" itemColour="0"
                             itemColour2="0" textColour="16777215" bgColour="16777215">
                    <Component type="ScriptImage" id="String6Fret0Marker" x="196" y="19" width="11"
                               height="12" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String6FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String6Fret1Marker" x="215" y="19" width="11"
                               height="12" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String6FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String6Fret2Marker" x="252" y="19" width="11"
                               height="12" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String6FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String6Fret3Marker" x="287" y="19" width="11"
                               height="12" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String6FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String6Fret4Marker" x="321" y="19" width="11"
                               height="12" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String6FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String6Fret5Marker" x="351" y="19" width="11"
                               height="12" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String6FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String6Fret6Marker" x="382" y="20" width="11"
                               height="12" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String6FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String6Fret7Marker" x="409" y="20" width="11"
                               height="12" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String6FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String6Fret8Marker" x="434" y="20" width="11"
                               height="12" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String6FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String6Fret9Marker" x="459" y="20" width="11"
                               height="12" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String6FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String6Fret10Marker" x="481" y="20" width="11"
                               height="12" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String6FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String6Fret11Marker" x="503" y="20" width="11"
                               height="12" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String6FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String6Fret12Marker" x="525" y="20" width="11"
                               height="27" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String6FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String6Fret13Marker" x="544" y="21" width="11"
                               height="12" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String6FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String6Fret14Marker" x="562" y="21" width="11"
                               height="12" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String6FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String6Fret15Marker" x="579" y="21" width="11"
                               height="12" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String6FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String6Fret16Marker" x="595" y="21" width="11"
                               height="12" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String6FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String6Fret17Marker" x="611" y="21" width="11"
                               height="12" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String6FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String6Fret18Marker" x="626" y="21" width="11"
                               height="35" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String6FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String6Fret19Marker" x="640" y="21" width="11"
                               height="12" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String6FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String6Fret20Marker" x="651" y="21" width="11"
                               height="12" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String6FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String6Fret21Marker" x="663" y="21" width="11"
                               height="17" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String6FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String6Fret22Marker" x="675" y="21" width="11"
                               height="17" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String6FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String6Fret23Marker" x="686" y="21" width="11"
                               height="17" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String6FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String6Fret24Marker" x="698" y="21" width="11"
                               height="17" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String6FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String6Fret25Marker" x="708" y="22" width="11"
                               height="17" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String6FretMarkers" text="" visible="0"/>
                  </Component>
                  <Component type="ScriptPanel" id="String5FretMarkers" x="0" y="302" width="1020"
                             height="54" parentComponent="StringFretMarkersPnl" itemColour="0"
                             itemColour2="0" textColour="16777215" bgColour="16777215">
                    <Component type="ScriptImage" id="String5Fret0Marker" x="197" y="21" width="11"
                               height="12" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String5FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String5Fret1Marker" x="216" y="21" width="11"
                               height="12" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String5FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String5Fret2Marker" x="254" y="21" width="11"
                               height="12" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String5FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String5Fret3Marker" x="288" y="21" width="11"
                               height="12" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String5FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String5Fret4Marker" x="321" y="21" width="11"
                               height="12" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String5FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String5Fret5Marker" x="352" y="21" width="11"
                               height="12" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String5FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String5Fret6Marker" x="382" y="21" width="11"
                               height="12" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String5FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String5Fret7Marker" x="409" y="21" width="11"
                               height="12" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String5FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String5Fret8Marker" x="434" y="21" width="11"
                               height="12" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String5FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String5Fret9Marker" x="459" y="21" width="11"
                               height="12" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String5FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String5Fret10Marker" x="481" y="21" width="11"
                               height="12" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String5FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String5Fret11Marker" x="503" y="21" width="11"
                               height="12" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String5FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String5Fret12Marker" x="524" y="21" width="11"
                               height="27" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String5FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String5Fret13Marker" x="543" y="21" width="11"
                               height="12" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String5FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String5Fret14Marker" x="561" y="21" width="11"
                               height="12" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String5FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String5Fret15Marker" x="578" y="21" width="11"
                               height="12" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String5FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String5Fret16Marker" x="594" y="21" width="11"
                               height="12" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String5FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String5Fret17Marker" x="609" y="21" width="11"
                               height="12" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String5FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String5Fret18Marker" x="624" y="21" width="11"
                               height="35" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String5FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String5Fret19Marker" x="638" y="21" width="11"
                               height="12" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String5FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String5Fret20Marker" x="650" y="21" width="11"
                               height="12" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String5FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String5Fret21Marker" x="662" y="21" width="11"
                               height="17" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String5FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String5Fret22Marker" x="674" y="21" width="11"
                               height="17" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String5FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String5Fret23Marker" x="685" y="21" width="11"
                               height="17" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String5FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String5Fret24Marker" x="696" y="21" width="11"
                               height="17" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String5FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String5Fret25Marker" x="706" y="22" width="11"
                               height="17" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String5FretMarkers" text="" visible="0"/>
                  </Component>
                  <Component type="ScriptPanel" id="String4FretMarkers" x="0" y="296" width="1020"
                             height="54" parentComponent="StringFretMarkersPnl" itemColour="0"
                             itemColour2="0" textColour="16777215" bgColour="16777215">
                    <Component type="ScriptImage" id="String4Fret0Marker" x="199" y="21" width="11"
                               height="12" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String4FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String4Fret1Marker" x="218" y="20" width="11"
                               height="12" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String4FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String4Fret2Marker" x="255" y="20" width="11"
                               height="12" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String4FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String4Fret3Marker" x="289" y="20" width="11"
                               height="12" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String4FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String4Fret4Marker" x="322" y="20" width="11"
                               height="12" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String4FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String4Fret5Marker" x="352" y="19" width="11"
                               height="12" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String4FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String4Fret6Marker" x="382" y="19" width="11"
                               height="12" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String4FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String4Fret7Marker" x="409" y="19" width="11"
                               height="12" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String4FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String4Fret8Marker" x="434" y="19" width="11"
                               height="12" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String4FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String4Fret9Marker" x="459" y="18" width="11"
                               height="12" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String4FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String4Fret10Marker" x="481" y="18" width="11"
                               height="12" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String4FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String4Fret11Marker" x="502" y="18" width="11"
                               height="12" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String4FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String4Fret12Marker" x="523" y="18" width="11"
                               height="27" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String4FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String4Fret13Marker" x="541" y="18" width="11"
                               height="12" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String4FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String4Fret14Marker" x="559" y="18" width="11"
                               height="12" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String4FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String4Fret15Marker" x="576" y="18" width="11"
                               height="12" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String4FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String4Fret16Marker" x="592" y="17" width="11"
                               height="12" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String4FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String4Fret17Marker" x="608" y="17" width="11"
                               height="12" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String4FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String4Fret18Marker" x="623" y="17" width="11"
                               height="35" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String4FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String4Fret19Marker" x="637" y="17" width="11"
                               height="12" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String4FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String4Fret20Marker" x="648" y="17" width="11"
                               height="12" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String4FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String4Fret21Marker" x="660" y="17" width="11"
                               height="17" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String4FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String4Fret22Marker" x="672" y="17" width="11"
                               height="17" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String4FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String4Fret23Marker" x="683" y="17" width="11"
                               height="17" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String4FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String4Fret24Marker" x="693" y="17" width="11"
                               height="17" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String4FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String4Fret25Marker" x="704" y="17" width="11"
                               height="17" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String4FretMarkers" text="" visible="0"/>
                  </Component>
                  <Component type="ScriptPanel" id="String3FretMarkers" x="0" y="290" width="1020"
                             height="54" parentComponent="StringFretMarkersPnl" itemColour="0"
                             itemColour2="0" textColour="16777215" bgColour="16777215">
                    <Component type="ScriptImage" id="String3Fret0Marker" x="200" y="20" width="11"
                               height="12" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String3FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String3Fret1Marker" x="220" y="19" width="11"
                               height="12" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String3FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String3Fret2Marker" x="257" y="19" width="11"
                               height="12" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String3FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String3Fret3Marker" x="290" y="19" width="11"
                               height="12" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String3FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String3Fret4Marker" x="322" y="18" width="11"
                               height="12" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String3FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String3Fret5Marker" x="353" y="18" width="11"
                               height="12" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String3FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String3Fret6Marker" x="382" y="18" width="11"
                               height="12" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String3FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String3Fret7Marker" x="409" y="17" width="11"
                               height="12" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String3FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String3Fret8Marker" x="434" y="17" width="11"
                               height="12" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String3FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String3Fret9Marker" x="459" y="17" width="11"
                               height="12" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String3FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String3Fret10Marker" x="481" y="17" width="11"
                               height="12" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String3FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String3Fret11Marker" x="502" y="16" width="11"
                               height="12" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String3FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String3Fret12Marker" x="522" y="16" width="11"
                               height="27" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String3FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String3Fret13Marker" x="541" y="16" width="11"
                               height="12" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String3FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String3Fret14Marker" x="558" y="16" width="11"
                               height="12" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String3FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String3Fret15Marker" x="575" y="16" width="11"
                               height="12" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String3FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String3Fret16Marker" x="591" y="16" width="11"
                               height="12" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String3FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String3Fret17Marker" x="606" y="15" width="11"
                               height="12" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String3FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String3Fret18Marker" x="621" y="15" width="11"
                               height="35" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String3FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String3Fret19Marker" x="635" y="15" width="11"
                               height="12" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String3FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String3Fret20Marker" x="647" y="15" width="11"
                               height="12" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String3FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String3Fret21Marker" x="659" y="15" width="11"
                               height="17" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String3FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String3Fret22Marker" x="670" y="15" width="11"
                               height="17" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String3FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String3Fret23Marker" x="681" y="15" width="11"
                               height="17" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String3FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String3Fret24Marker" x="692" y="15" width="11"
                               height="17" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String3FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String3Fret25Marker" x="702" y="15" width="11"
                               height="17" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String3FretMarkers" text="" visible="0"/>
                  </Component>
                  <Component type="ScriptPanel" id="String2FretMarkers" x="0" y="283" width="1020"
                             height="54" parentComponent="StringFretMarkersPnl" itemColour="0"
                             itemColour2="0" textColour="16777215" bgColour="16777215">
                    <Component type="ScriptImage" id="String2Fret0Marker" x="202" y="21" width="11"
                               height="12" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String2FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String2Fret1Marker" x="222" y="20" width="11"
                               height="12" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String2FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String2Fret2Marker" x="258" y="20" width="11"
                               height="12" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String2FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String2Fret3Marker" x="291" y="19" width="11"
                               height="12" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String2FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String2Fret4Marker" x="323" y="19" width="11"
                               height="12" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String2FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String2Fret5Marker" x="353" y="18" width="11"
                               height="12" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String2FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String2Fret6Marker" x="382" y="18" width="11"
                               height="12" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String2FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String2Fret7Marker" x="409" y="17" width="11"
                               height="12" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String2FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String2Fret8Marker" x="434" y="17" width="11"
                               height="12" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String2FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String2Fret9Marker" x="459" y="16" width="11"
                               height="12" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String2FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String2Fret10Marker" x="481" y="16" width="11"
                               height="12" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String2FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String2Fret11Marker" x="502" y="16" width="11"
                               height="12" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String2FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String2Fret12Marker" x="521" y="15" width="11"
                               height="27" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String2FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String2Fret13Marker" x="540" y="15" width="11"
                               height="12" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String2FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String2Fret14Marker" x="557" y="15" width="11"
                               height="12" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String2FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String2Fret15Marker" x="574" y="15" width="11"
                               height="12" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String2FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String2Fret16Marker" x="590" y="14" width="11"
                               height="12" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String2FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String2Fret17Marker" x="605" y="14" width="11"
                               height="12" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String2FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String2Fret18Marker" x="620" y="14" width="11"
                               height="35" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String2FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String2Fret19Marker" x="634" y="14" width="11"
                               height="12" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String2FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String2Fret20Marker" x="645" y="13" width="11"
                               height="12" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String2FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String2Fret21Marker" x="657" y="13" width="11"
                               height="17" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String2FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String2Fret22Marker" x="668" y="13" width="11"
                               height="17" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String2FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String2Fret23Marker" x="679" y="13" width="11"
                               height="17" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String2FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String2Fret24Marker" x="690" y="13" width="11"
                               height="17" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String2FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String2Fret25Marker" x="701" y="13" width="11"
                               height="17" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String2FretMarkers" text="" visible="0"/>
                  </Component>
                  <Component type="ScriptPanel" id="String1FretMarkers" x="0" y="277" width="1020"
                             height="54" parentComponent="StringFretMarkersPnl" itemColour="0"
                             itemColour2="0" textColour="16777215" bgColour="16777215">
                    <Component type="ScriptImage" id="String1Fret0Marker" x="204" y="20" width="11"
                               height="11" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String1FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String1Fret1Marker" x="225" y="19" width="11"
                               height="11" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String1FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String1Fret2Marker" x="260" y="18" width="11"
                               height="11" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String1FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String1Fret3Marker" x="293" y="18" width="11"
                               height="11" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String1FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String1Fret4Marker" x="324" y="17" width="11"
                               height="11" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String1FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String1Fret5Marker" x="354" y="16" width="11"
                               height="11" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String1FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String1Fret6Marker" x="382" y="16" width="11"
                               height="11" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String1FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String1Fret7Marker" x="409" y="15" width="11"
                               height="11" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String1FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String1Fret8Marker" x="434" y="14" width="11"
                               height="11" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String1FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String1Fret9Marker" x="459" y="14" width="11"
                               height="11" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String1FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String1Fret10Marker" x="481" y="13" width="11"
                               height="11" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String1FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String1Fret11Marker" x="502" y="13" width="11"
                               height="11" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String1FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String1Fret12Marker" x="521" y="12" width="11"
                               height="27" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String1FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String1Fret13Marker" x="539" y="12" width="11"
                               height="11" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String1FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String1Fret14Marker" x="556" y="12" width="11"
                               height="11" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String1FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String1Fret15Marker" x="573" y="11" width="11"
                               height="11" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String1FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String1Fret16Marker" x="589" y="11" width="11"
                               height="11" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String1FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String1Fret17Marker" x="604" y="11" width="11"
                               height="11" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String1FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String1Fret18Marker" x="619" y="10" width="11"
                               height="35" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String1FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String1Fret19Marker" x="633" y="10" width="11"
                               height="11" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String1FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String1Fret20Marker" x="644" y="10" width="11"
                               height="11" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String1FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String1Fret21Marker" x="656" y="9" width="11"
                               height="17" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String1FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String1Fret22Marker" x="667" y="9" width="11"
                               height="17" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String1FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String1Fret23Marker" x="678" y="9" width="11"
                               height="17" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String1FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String1Fret24Marker" x="688" y="9" width="11"
                               height="17" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String1FretMarkers" text="" visible="0"/>
                    <Component type="ScriptImage" id="String1Fret25Marker" x="699" y="9" width="11"
                               height="17" fileName="{PROJECT_FOLDER}PlayingMode_FretIndicator.png"
                               parentComponent="String1FretMarkers" text="" visible="0"/>
                  </Component>
                </Component>
              </Component>
              <Component type="ScriptPanel" id="DebugPanel" x="120" y="0" itemColour="0"
                         itemColour2="0" bgColour="16777215" textColour="16777215" borderSize="0.0"
                         width="606" height="102" visible="0">
                <Component type="ScriptFloatingTile" id="SettingsTile" x="-40" y="-6" width="654"
                           height="536" parentComponent="DebugPanel" ContentType="CustomSettings"
                           bgColour="4278190080" itemColour="0" itemColour2="0" Data="{&#10;  &quot;Driver&quot;: true,&#10;  &quot;Device&quot;: true,&#10;  &quot;Output&quot;: true,&#10;  &quot;BufferSize&quot;: true,&#10;  &quot;SampleRate&quot;: true,&#10;  &quot;GlobalBPM&quot;: true,&#10;  &quot;StreamingMode&quot;: true,&#10;  &quot;ScaleFactor&quot;: true,&#10;  &quot;VoiceAmountMultiplier&quot;: true,&#10;  &quot;ClearMidiCC&quot;: true,&#10;  &quot;SampleLocation&quot;: true,&#10;  &quot;DebugMode&quot;: true,&#10;  &quot;UseOpenGL&quot;: true,&#10;  &quot;ScaleFactorList&quot;: [&#10;    0.5,&#10;    0.75,&#10;    1.0,&#10;    1.25,&#10;    1.5,&#10;    2.0&#10;  ]&#10;}"
                           textColour="4278190080" updateAfterInit="0" visible="0"/>
                <Component type="ScriptImage" id="NerdDetails_BG" x="3" y="3" width="597"
                           height="100" parentComponent="DebugPanel" fileName="{PROJECT_FOLDER}PlayingMode_NerdDetails_BG.png"/>
                <Component type="ScriptLabel" id="handPositionFretLabel" x="388" y="9" width="39"
                           fontSize="20.0" height="13" text="0" parentComponent="DebugPanel"
                           textColour="4278190080"/>
                <Component type="ScriptLabel" id="String1RRLabel" x="498" y="50" width="100"
                           height="21" parentComponent="DebugPanel" text="-1" textColour="4278190080"
                           fontSize="16.0"/>
                <Component type="ScriptLabel" id="String2RRLabel" x="400" y="50" width="100"
                           height="21" parentComponent="DebugPanel" text="-1" textColour="4278190080"
                           fontSize="16.0"/>
                <Component type="ScriptLabel" id="String3RRLabel" x="300" y="50" width="100"
                           height="21" parentComponent="DebugPanel" text="-1" textColour="4278190080"
                           fontSize="16.0"/>
                <Component type="ScriptLabel" id="String4RRLabel" x="202" y="50" width="100"
                           height="21" parentComponent="DebugPanel" text="-1" textColour="4278190080"
                           fontSize="16.0"/>
                <Component type="ScriptLabel" id="String5RRLabel" x="105" y="50" width="100"
                           height="21" parentComponent="DebugPanel" text="-1" textColour="4278190080"
                           fontSize="16.0"/>
                <Component type="ScriptLabel" id="String6RRLabel" x="4" y="50" width="100"
                           height="21" parentComponent="DebugPanel" text="-1" textColour="4278190080"
                           fontSize="16.0"/>
                <Component type="ScriptLabel" id="String7RRLabel" x="4" y="50" width="100"
                           height="21" parentComponent="DebugPanel" text="-1" textColour="4278190080"
                           fontSize="16.0"/>
                <Component type="ScriptLabel" id="String8RRLabel" x="4" y="50" width="100"
                           height="21" parentComponent="DebugPanel" text="-1" textColour="4278190080"
                           fontSize="16.0"/>
              </Component>
              <Component type="ScriptImage" id="ArticulationBG" x="0" y="-60" width="1020"
                         height="600" fileName="{PROJECT_FOLDER}Articulations_BG.png"
                         visible="0">
                <Component type="ScriptPanel" id="SustainModulatorsPnl" x="0" y="150" width="723"
                           height="60" parentComponent="ArticulationBG" itemColour="0" itemColour2="0"
                           textColour="16777215" bgColour="16777215">
                  <Component type="ScriptLabel" id="SustainModulatorsPnlLabel" x="10" y="-10"
                             width="203" height="100" parentComponent="SustainModulatorsPnl"
                             fontName="Shehroz" text="Sustain" fontSize="46.0" fontStyle="Regular"
                             alignment="right"/>
                  <Component type="ScriptSlider" id="SustainModulatorsAttack" x="320" y="7"
                             filmstripImage="{PROJECT_FOLDER}General_Knob_Filmstrip.png" numStrips="100.0"
                             scaleFactor="0.25" max="20000.0" mouseSensitivity="0.5" showValuePopup="Left"
                             middlePosition="150.0" parentComponent="SustainModulatorsPnl"
                             width="52" mode="Time" macroControl="No MacroControl"/>
                  <Component type="ScriptSlider" id="SustainModulatorsDecay" x="403" y="7"
                             filmstripImage="{PROJECT_FOLDER}General_Knob_Filmstrip.png" numStrips="100.0"
                             scaleFactor="0.25" max="20000.0" mouseSensitivity="0.5" showValuePopup="Left"
                             middlePosition="150.0" parentComponent="SustainModulatorsPnl"
                             width="52" mode="Time" macroControl="No MacroControl"/>
                  <Component type="ScriptSlider" id="SustainModulatorsSustain" x="486" y="7"
                             filmstripImage="{PROJECT_FOLDER}General_Knob_Filmstrip.png" numStrips="100.0"
                             scaleFactor="0.25" min="-100.0" max="0.0" mouseSensitivity="0.5"
                             showValuePopup="Left" middlePosition="-10.0" mode="Decibel" parentComponent="SustainModulatorsPnl"
                             width="52" macroControl="No MacroControl"/>
                  <Component type="ScriptSlider" id="SustainModulatorsRelease" x="570" y="7"
                             filmstripImage="{PROJECT_FOLDER}General_Knob_Filmstrip.png" numStrips="100.0"
                             scaleFactor="0.25" max="20000.0" mouseSensitivity="0.5" showValuePopup="Left"
                             middlePosition="150.0" parentComponent="SustainModulatorsPnl"
                             width="52" mode="Time" defaultValue="151.0" macroControl="No MacroControl"/>
                  <Component type="ScriptButton" id="PurgeSustainBtn" x="259" y="18" width="30"
                             height="30" parentComponent="SustainModulatorsPnl" text="Enable speed change"
                             filmstripImage="{PROJECT_FOLDER}Articulation_PurgeButton_Filmstrip.png"
                             scaleFactor="0.5" defaultValue="1.0"/>
                </Component>
                <Component type="ScriptPanel" id="MuteModulatorsPnl" x="7" y="206" width="723"
                           height="60" parentComponent="ArticulationBG" itemColour="0" itemColour2="0"
                           textColour="16777215" bgColour="16777215">
                  <Component type="ScriptLabel" id="MuteModulatorsPnlLabel" x="53" y="-16"
                             width="162" height="100" parentComponent="MuteModulatorsPnl"
                             fontName="Shehroz" text="Mute" fontSize="46.0" fontStyle="Regular"
                             alignment="right"/>
                  <Component type="ScriptSlider" id="MuteModulatorsAttack" x="320" y="7" filmstripImage="{PROJECT_FOLDER}General_Knob_Filmstrip.png"
                             numStrips="100.0" scaleFactor="0.25" max="20000.0" mouseSensitivity="0.5"
                             showValuePopup="Left" middlePosition="150.0" parentComponent="MuteModulatorsPnl"
                             width="52" mode="Time" macroControl="No MacroControl"/>
                  <Component type="ScriptSlider" id="MuteModulatorsDecay" x="403" y="7" filmstripImage="{PROJECT_FOLDER}General_Knob_Filmstrip.png"
                             numStrips="100.0" scaleFactor="0.25" max="20000.0" mouseSensitivity="0.5"
                             showValuePopup="Left" middlePosition="150.0" parentComponent="MuteModulatorsPnl"
                             width="52" mode="Time" macroControl="No MacroControl"/>
                  <Component type="ScriptSlider" id="MuteModulatorsMute" x="486" y="7" filmstripImage="{PROJECT_FOLDER}General_Knob_Filmstrip.png"
                             numStrips="100.0" scaleFactor="0.25" min="-100.0" max="0.0" mouseSensitivity="0.5"
                             showValuePopup="Left" middlePosition="-10.0" mode="Decibel" parentComponent="MuteModulatorsPnl"
                             width="52" macroControl="No MacroControl"/>
                  <Component type="ScriptSlider" id="MuteModulatorsRelease" x="570" y="7"
                             filmstripImage="{PROJECT_FOLDER}General_Knob_Filmstrip.png" numStrips="100.0"
                             scaleFactor="0.25" max="20000.0" mouseSensitivity="0.5" showValuePopup="Left"
                             middlePosition="150.0" parentComponent="MuteModulatorsPnl" width="52"
                             mode="Time" defaultValue="151.0" macroControl="No MacroControl"/>
                  <Component type="ScriptButton" id="PurgeMuteBtn" x="259" y="18" width="30"
                             height="30" parentComponent="MuteModulatorsPnl" text="Bruh" filmstripImage="{PROJECT_FOLDER}Articulation_PurgeButton_Filmstrip.png"
                             scaleFactor="0.5" defaultValue="1.0"/>
                </Component>
                <Component type="ScriptPanel" id="HarmonicModulatorsPnl" x="14" y="266"
                           width="723" height="60" parentComponent="ArticulationBG" itemColour="0"
                           itemColour2="0" textColour="16777215" bgColour="16777215">
                  <Component type="ScriptLabel" id="HarmonicModulatorsPnlLabel" x="16" y="-16"
                             width="207" height="100" parentComponent="HarmonicModulatorsPnl"
                             fontName="Shehroz" text="Harmonic" fontSize="46.0" fontStyle="Regular"
                             alignment="right"/>
                  <Component type="ScriptSlider" id="HarmonicModulatorsAttack" x="320" y="7"
                             filmstripImage="{PROJECT_FOLDER}General_Knob_Filmstrip.png" numStrips="100.0"
                             scaleFactor="0.25" max="20000.0" mouseSensitivity="0.5" showValuePopup="Left"
                             middlePosition="150.0" parentComponent="HarmonicModulatorsPnl"
                             width="52" mode="Time" macroControl="No MacroControl"/>
                  <Component type="ScriptSlider" id="HarmonicModulatorsDecay" x="403" y="7"
                             filmstripImage="{PROJECT_FOLDER}General_Knob_Filmstrip.png" numStrips="100.0"
                             scaleFactor="0.25" max="20000.0" mouseSensitivity="0.5" showValuePopup="Left"
                             middlePosition="150.0" parentComponent="HarmonicModulatorsPnl"
                             width="52" mode="Time" macroControl="No MacroControl"/>
                  <Component type="ScriptSlider" id="HarmonicModulatorsHarmonic" x="486" y="7"
                             filmstripImage="{PROJECT_FOLDER}General_Knob_Filmstrip.png" numStrips="100.0"
                             scaleFactor="0.25" min="-100.0" max="0.0" mouseSensitivity="0.5"
                             showValuePopup="Left" middlePosition="-10.0" mode="Decibel" parentComponent="HarmonicModulatorsPnl"
                             width="52" macroControl="No MacroControl"/>
                  <Component type="ScriptSlider" id="HarmonicModulatorsRelease" x="570" y="7"
                             filmstripImage="{PROJECT_FOLDER}General_Knob_Filmstrip.png" numStrips="100.0"
                             scaleFactor="0.25" max="20000.0" mouseSensitivity="0.5" showValuePopup="Left"
                             middlePosition="150.0" parentComponent="HarmonicModulatorsPnl"
                             width="52" mode="Time" defaultValue="151.0" macroControl="No MacroControl"/>
                  <Component type="ScriptButton" id="PurgeHarmonicBtn" x="259" y="18" width="30"
                             height="30" parentComponent="HarmonicModulatorsPnl" text="Enable speed change"
                             filmstripImage="{PROJECT_FOLDER}Articulation_PurgeButton_Filmstrip.png"
                             scaleFactor="0.5" defaultValue="1.0"/>
                </Component>
                <Component type="ScriptPanel" id="TremoloModulatorsPnl" x="20" y="325" width="1000"
                           height="60" parentComponent="ArticulationBG" itemColour="0" itemColour2="0"
                           textColour="16777215" bgColour="16777215">
                  <Component type="ScriptButton" id="EnableTremStretchButton" x="697" y="40"
                             width="100" height="30" parentComponent="TremoloModulatorsPnl"
                             text="Enable speed change" filmstripImage="{PROJECT_FOLDER}Articulation_PurgeButton_Filmstrip.png"
                             scaleFactor="0.4000000059604645"/>
                  <Component type="ScriptLabel" id="TremoloModulatorsPnlLabel" x="16" y="-16"
                             width="207" height="100" parentComponent="TremoloModulatorsPnl"
                             fontName="Shehroz" text="Tremolo" fontSize="46.0" fontStyle="Regular"
                             alignment="right"/>
                  <Component type="ScriptSlider" id="TremoloModulatorsAttack" x="320" y="7"
                             filmstripImage="{PROJECT_FOLDER}General_Knob_Filmstrip.png" numStrips="100.0"
                             scaleFactor="0.25" max="20000.0" mouseSensitivity="0.5" showValuePopup="Left"
                             middlePosition="150.0" parentComponent="TremoloModulatorsPnl"
                             width="52" mode="Time" macroControl="No MacroControl"/>
                  <Component type="ScriptSlider" id="TremoloModulatorsDecay" x="403" y="7"
                             filmstripImage="{PROJECT_FOLDER}General_Knob_Filmstrip.png" numStrips="100.0"
                             scaleFactor="0.25" max="20000.0" mouseSensitivity="0.5" showValuePopup="Left"
                             middlePosition="150.0" parentComponent="TremoloModulatorsPnl"
                             width="52" mode="Time" macroControl="No MacroControl"/>
                  <Component type="ScriptSlider" id="TremoloModulatorsTremolo" x="486" y="7"
                             filmstripImage="{PROJECT_FOLDER}General_Knob_Filmstrip.png" numStrips="100.0"
                             scaleFactor="0.25" min="-100.0" max="0.0" mouseSensitivity="0.5"
                             showValuePopup="Left" middlePosition="-10.0" mode="Decibel" parentComponent="TremoloModulatorsPnl"
                             width="52" macroControl="No MacroControl"/>
                  <Component type="ScriptSlider" id="TremoloModulatorsRelease" x="570" y="7"
                             filmstripImage="{PROJECT_FOLDER}General_Knob_Filmstrip.png" numStrips="100.0"
                             scaleFactor="0.25" max="20000.0" mouseSensitivity="0.5" showValuePopup="Left"
                             middlePosition="150.0" parentComponent="TremoloModulatorsPnl"
                             width="52" mode="Time" defaultValue="151.0" macroControl="No MacroControl"/>
                  <Component type="ScriptSlider" id="TremoloTimestretchKnob" x="652" y="7"
                             filmstripImage="{PROJECT_FOLDER}General_Knob_Filmstrip.png" numStrips="100.0"
                             scaleFactor="0.25" min="0.5" max="2.0" mouseSensitivity="0.5"
                             showValuePopup="Left" middlePosition="1.0" defaultValue="1.0"
                             mode="NormalizedPercentage" parentComponent="TremoloModulatorsPnl"
                             width="48"/>
                  <Component type="ScriptButton" id="PurgeTremoloBtn" x="259" y="18" width="30"
                             height="30" parentComponent="TremoloModulatorsPnl" text="Enable speed change"
                             filmstripImage="{PROJECT_FOLDER}Articulation_PurgeButton_Filmstrip.png"
                             scaleFactor="0.5" defaultValue="1.0"/>
                </Component>
                <Component type="ScriptPanel" id="SFXModulatorsPnl" x="29" y="387" width="952"
                           height="60" parentComponent="ArticulationBG" itemColour="0" itemColour2="0"
                           textColour="16777215" bgColour="16777215">
                  <Component type="ScriptLabel" id="SFXModulatorsPnlLabel" x="16" y="-16"
                             width="207" height="100" parentComponent="SFXModulatorsPnl" fontName="Shehroz"
                             text="SFX" fontSize="46.0" fontStyle="Regular" alignment="right"/>
                  <Component type="ScriptSlider" id="SFXModulatorsAttack" x="320" y="7" filmstripImage="{PROJECT_FOLDER}General_Knob_Filmstrip.png"
                             numStrips="100.0" scaleFactor="0.25" max="20000.0" mouseSensitivity="0.5"
                             showValuePopup="Left" middlePosition="150.0" parentComponent="SFXModulatorsPnl"
                             width="52" mode="Time" macroControl="No MacroControl"/>
                  <Component type="ScriptSlider" id="SFXModulatorsDecay" x="403" y="7" filmstripImage="{PROJECT_FOLDER}General_Knob_Filmstrip.png"
                             numStrips="100.0" scaleFactor="0.25" max="20000.0" mouseSensitivity="0.5"
                             showValuePopup="Left" middlePosition="150.0" parentComponent="SFXModulatorsPnl"
                             width="52" mode="Time" macroControl="No MacroControl"/>
                  <Component type="ScriptSlider" id="SFXModulatorsSFX" x="486" y="7" filmstripImage="{PROJECT_FOLDER}General_Knob_Filmstrip.png"
                             numStrips="100.0" scaleFactor="0.25" min="-100.0" max="0.0" mouseSensitivity="0.5"
                             showValuePopup="Left" middlePosition="-10.0" mode="Decibel" parentComponent="SFXModulatorsPnl"
                             width="52" macroControl="No MacroControl"/>
                  <Component type="ScriptSlider" id="SFXModulatorsRelease" x="570" y="7" filmstripImage="{PROJECT_FOLDER}General_Knob_Filmstrip.png"
                             numStrips="100.0" scaleFactor="0.25" max="20000.0" mouseSensitivity="0.5"
                             showValuePopup="Left" middlePosition="150.0" parentComponent="SFXModulatorsPnl"
                             width="52" mode="Time" defaultValue="151.0" macroControl="No MacroControl"/>
                  <Component type="ScriptButton" id="PurgeSFXBtn" x="259" y="18" width="30"
                             height="30" parentComponent="SFXModulatorsPnl" text="Enable speed change"
                             filmstripImage="{PROJECT_FOLDER}Articulation_PurgeButton_Filmstrip.png"
                             scaleFactor="0.5" defaultValue="1.0"/>
                </Component>
                <Component type="ScriptButton" id="NextPageBtn" x="50" y="80" width="25"
                           height="28" parentComponent="ArticulationBG" isMomentary="1"
                           filmstripImage="{PROJECT_FOLDER}Next_Button_Filmstrip.png" scaleFactor="0.25"/>
                <Component type="ScriptButton" id="PrevPageBtn" x="10" y="80" width="25"
                           height="28" parentComponent="ArticulationBG" isMomentary="1"
                           filmstripImage="{PROJECT_FOLDER}Previous_Button_Filmstrip.png"
                           scaleFactor="0.25"/>
                <Component type="ScriptLabel" id="PurgeLabel" x="237" y="103" width="60"
                           height="50" parentComponent="ArticulationBG" fontName="Shehroz"
                           textColour="4294211876" text="Purge" fontSize="25.0" itemColour2="4294211876"
                           itemColour="16777215" editable="0"/>
              </Component>
              <Component type="ScriptButton" id="ShowPlayingModeButton" x="259" y="478"
                         text="Show Main Playing Controls" width="188" filmstripImage="{PROJECT_FOLDER}PlayingMode_Button_Filmstrip.png"
                         scaleFactor="0.3149999976158142" height="28"/>
              <Component type="ScriptButton" id="ShowArticulationsButton" x="423" y="478"
                         text="Show Main Playing Controls" width="202" filmstripImage="{PROJECT_FOLDER}Articulations_Button_Filmstrip.png"
                         scaleFactor="0.3149999976158142"/>
              <Component type="ScriptButton" id="ShowDebugPanelButton" x="613" y="478"
                         text="Show Performance Details" width="197" filmstripImage="{PROJECT_FOLDER}NerdDetails_Button_Filmstrip.png"
                         scaleFactor="0.3149999976158142"/>
            </ContentProperties>
          </UIData>

"""




def generate_hise_xml(num_strings, num_frets, fret_spacing, rr_spacing, articulations, output_file):
    # Root Processor
    base_name = os.path.splitext(os.path.basename(output_file))[0]
    root = ET.Element("Processor", Type="SynthChain", ID=base_name, Bypassed="0", 
                      Gain="1.0", Balance="0.0", VoiceLimit="64.0", KillFadeTime="20.0", 
                      IconColour="0", packageName="", BuildVersion="650")
    
    root_child_processors = ET.SubElement(root, "ChildProcessors")
    
    # Interface ScriptProcessor (With UIData)
    midi_chain = ET.SubElement(root_child_processors, "Processor", Type="MidiProcessorChain", ID="Midi Processor", Bypassed="0")
    midi_child = ET.SubElement(midi_chain, "ChildProcessors")
    interface_script = ET.SubElement(midi_child, "Processor", Type="ScriptProcessor", ID="Interface", Bypassed="0")
    ET.SubElement(interface_script, "ChildProcessors")
    ET.SubElement(interface_script, "Content")
    
    # Inject UIData
    ui_data = ET.fromstring(UIDATA_XML)
    
    # Find panels and clear them
    string_force_panel = ui_data.find('.//Component[@id="StringForcePanel"]')
    for child in list(string_force_panel):
        string_force_panel.remove(child)
        
    string_fret_markers_pnl = ui_data.find('.//Component[@id="StringFretMarkersPnl"]')
    for child in list(string_fret_markers_pnl):
        string_fret_markers_pnl.remove(child)
        
    debug_panel = ui_data.find('.//Component[@id="DebugPanel"]')
    for child in list(debug_panel):
        if child.attrib.get('id', '').endswith('RRLabel') and child.attrib.get('id', '').startswith('String'):
            debug_panel.remove(child)
            
    for string in range(num_strings, 0, -1):
        # StringForcePanel
        y_force = 17 + (string - 1) * 10
        ET.SubElement(string_force_panel, "Component", type="ScriptImage", id=f"StringForceString{string}", x="12", y=str(y_force), width="605", height="10", parentComponent="StringForcePanel", fileName=f"{'{PROJECT_FOLDER}'}PlayingMode_ForceString_Indicator_String{string}.png", scale="0.699999988079071", visible="0")
        
        # StringFretMarkersPnl
        y_fret_pnl = 275 + (string - 1) * 5
        string_fret_pnl = ET.SubElement(string_fret_markers_pnl, "Component", type="ScriptPanel", id=f"String{string}FretMarkers", x="0", y=str(y_fret_pnl), width="1020", height="54", parentComponent="StringFretMarkersPnl", itemColour="0", itemColour2="0", textColour="16777215", bgColour="16777215")
        
        for fret in range(num_frets + 1):
            x_fret = 195 + fret * fret_spacing
            ET.SubElement(string_fret_pnl, "Component", type="ScriptImage", id=f"String{string}Fret{fret}Marker", x=str(x_fret), y="20", width="11", height="12", fileName="{'{PROJECT_FOLDER}'}PlayingMode_FretIndicator.png", parentComponent=f"String{string}FretMarkers", text="", visible="0")

        # DebugPanel RRLabels
        x_rr = 4 + (num_strings - string) * rr_spacing
        ET.SubElement(debug_panel, "Component", type="ScriptLabel", id=f"String{string}RRLabel", x=str(x_rr), y="50", width="100", height="21", parentComponent="DebugPanel", text="-1", textColour="4278190080", fontSize="16.0")

    interface_script.append(ui_data)
    
    # Root Modulators and FX
    ET.SubElement(root_child_processors, "Processor", Type="ModulatorChain", ID="GainModulation", Bypassed="0", Intensity="1.0").append(ET.Element("ChildProcessors"))
    ET.SubElement(root_child_processors, "Processor", Type="ModulatorChain", ID="PitchModulation", Bypassed="1", Intensity="0.0").append(ET.Element("ChildProcessors"))
    ET.SubElement(root_child_processors, "Processor", Type="EffectChain", ID="FX", Bypassed="0").append(ET.Element("ChildProcessors"))
    
    # Container0
    container0 = ET.SubElement(root_child_processors, "Processor", Type="SynthChain", ID="Container0", Bypassed="0", 
                               Gain="1.0", Balance="0.0", VoiceLimit="256.0", KillFadeTime="20.0", IconColour="0")
    container0_child_processors = ET.SubElement(container0, "ChildProcessors")
    
    c0_midi = ET.SubElement(container0_child_processors, "Processor", Type="MidiProcessorChain", ID="Midi Processor", Bypassed="0")
    c0_midi_children = ET.SubElement(c0_midi, "ChildProcessors")
    note_engines = ET.SubElement(c0_midi_children, "Processor", Type="ScriptProcessor", ID="NoteEngines", Bypassed="0")
    ET.SubElement(note_engines, "ChildProcessors")
    note_engines_content = ET.SubElement(note_engines, "Content")
    ET.SubElement(note_engines_content, "Control", type="ScriptButton", id="Button1", value="0.0")
    
    ET.SubElement(container0_child_processors, "Processor", Type="ModulatorChain", ID="GainModulation", Bypassed="0", Intensity="1.0").append(ET.Element("ChildProcessors"))
    ET.SubElement(container0_child_processors, "Processor", Type="ModulatorChain", ID="PitchModulation", Bypassed="1", Intensity="0.0").append(ET.Element("ChildProcessors"))
    ET.SubElement(container0_child_processors, "Processor", Type="EffectChain", ID="FX", Bypassed="0").append(ET.Element("ChildProcessors"))

    # Left and Right sides
    for side in ["Left", "Right"]:
        guitar_container = ET.SubElement(container0_child_processors, "Processor", Type="SynthChain", ID=f"{side}GuitarContainer", Bypassed="0", 
                                      Gain="1.0", Balance="0.0", VoiceLimit="256.0", KillFadeTime="20.0", IconColour="0")
        guitar_child_processors = ET.SubElement(guitar_container, "ChildProcessors")
        
        guitar_midi = ET.SubElement(guitar_child_processors, "Processor", Type="MidiProcessorChain", ID="Midi Processor", Bypassed="0")
        guitar_midi_children = ET.SubElement(guitar_midi, "ChildProcessors")
        if side == "Right":
            right_muter = ET.SubElement(guitar_midi_children, "Processor", Type="MidiMuter", ID="RightContainerMute", Bypassed="0")
            ET.SubElement(right_muter, "ChildProcessors")
            right_muter_content = ET.SubElement(right_muter, "Content")
            ET.SubElement(right_muter_content, "Control", type="ScriptButton", id="ignoreButton", value="1.0")
            ET.SubElement(right_muter_content, "Control", type="ScriptButton", id="fixStuckNotes", value="1.0")
        ET.SubElement(guitar_child_processors, "Processor", Type="ModulatorChain", ID="GainModulation", Bypassed="0", Intensity="1.0").append(ET.Element("ChildProcessors"))
        ET.SubElement(guitar_child_processors, "Processor", Type="ModulatorChain", ID="PitchModulation", Bypassed="1", Intensity="0.0").append(ET.Element("ChildProcessors"))
        
        guitar_fx = ET.SubElement(guitar_child_processors, "Processor", Type="EffectChain", ID="FX", Bypassed="0")
        guitar_fx_children = ET.SubElement(guitar_fx, "ChildProcessors")
        
        gain_val = "-100.0" if side == "Right" else "0.0"
        balance_val = "100.0" if side == "Right" else "0.0"
        simple_gain = ET.SubElement(guitar_fx_children, "Processor", Type="SimpleGain", ID=f"{side}GuitarGain", Bypassed="0", 
                                    Gain=gain_val, Delay="0.0", Width="100.0", Balance=balance_val, InvertPolarity="0.0")
        sg_children = ET.SubElement(simple_gain, "ChildProcessors")
        ET.SubElement(sg_children, "Processor", Type="ModulatorChain", ID="Gain Modulation", Bypassed="0", Intensity="1.0").append(ET.Element("ChildProcessors"))
        ET.SubElement(sg_children, "Processor", Type="ModulatorChain", ID="Delay Modulation", Bypassed="0", Intensity="1.0").append(ET.Element("ChildProcessors"))
        ET.SubElement(sg_children, "Processor", Type="ModulatorChain", ID="Width Modulation", Bypassed="0", Intensity="1.0").append(ET.Element("ChildProcessors"))
        ET.SubElement(sg_children, "Processor", Type="ModulatorChain", ID="Pan Modulation", Bypassed="0", Intensity="1.0").append(ET.Element("ChildProcessors"))
        ET.SubElement(simple_gain, "RoutingMatrix", NumSourceChannels="2", Channel0="0", Send0="-1", Channel1="1", Send1="-1")

        # Articulations
        for art in articulations:
            art_container = ET.SubElement(guitar_child_processors, "Processor", Type="SynthChain", ID=f"{side}{art}Container", Bypassed="0", 
                                          Gain="1.0", Balance="0.0", VoiceLimit="256.0", KillFadeTime="20.0", IconColour="0")
            art_child_processors = ET.SubElement(art_container, "ChildProcessors")
            
            art_midi = ET.SubElement(art_child_processors, "Processor", Type="MidiProcessorChain", ID="Midi Processor", Bypassed="0")
            art_midi_children = ET.SubElement(art_midi, "ChildProcessors")
            
            art_muter = ET.SubElement(art_midi_children, "Processor", Type="MidiMuter", ID=f"{side}{art}ContainerMute", Bypassed="0")
            ET.SubElement(art_muter, "ChildProcessors")
            art_muter_content = ET.SubElement(art_muter, "Content")
            ET.SubElement(art_muter_content, "Control", type="ScriptButton", id="ignoreButton", value="1.0")
            ET.SubElement(art_muter_content, "Control", type="ScriptButton", id="fixStuckNotes", value="1.0")
            
            ET.SubElement(art_child_processors, "Processor", Type="ModulatorChain", ID="GainModulation", Bypassed="0", Intensity="1.0").append(ET.Element("ChildProcessors"))
            ET.SubElement(art_child_processors, "Processor", Type="ModulatorChain", ID="PitchModulation", Bypassed="1", Intensity="0.0").append(ET.Element("ChildProcessors"))
            art_fx = ET.SubElement(art_child_processors, "Processor", Type="EffectChain", ID="FX", Bypassed="0")
            art_fx_children = ET.SubElement(art_fx, "ChildProcessors")
            art_gain = ET.SubElement(art_fx_children, "Processor", Type="SimpleGain", ID=f"{side}{art}Gain", Bypassed="0", 
                                     Gain="0.0", Delay="0.0", Width="100.0", Balance="0.0", InvertPolarity="0.0")
            sg_children = ET.SubElement(art_gain, "ChildProcessors")
            ET.SubElement(sg_children, "Processor", Type="ModulatorChain", ID="Gain Modulation", Bypassed="0", Intensity="1.0").append(ET.Element("ChildProcessors"))
            ET.SubElement(sg_children, "Processor", Type="ModulatorChain", ID="Delay Modulation", Bypassed="0", Intensity="1.0").append(ET.Element("ChildProcessors"))
            ET.SubElement(sg_children, "Processor", Type="ModulatorChain", ID="Width Modulation", Bypassed="0", Intensity="1.0").append(ET.Element("ChildProcessors"))
            ET.SubElement(sg_children, "Processor", Type="ModulatorChain", ID="Pan Modulation", Bypassed="0", Intensity="1.0").append(ET.Element("ChildProcessors"))
            ET.SubElement(art_gain, "RoutingMatrix", NumSourceChannels="2", Channel0="0", Send0="-1", Channel1="1", Send1="-1")
            
            # Strings Iteration (Descending)
            for string in range(num_strings, 0, -1):
                def create_sampler(is_release):
                    suffix = "Rel" if is_release else ""
                    sampler_id = f"{side}String{string}{art}{suffix}Sampler"
                    sampler = ET.SubElement(art_child_processors, "Processor", Type="StreamingSampler", ID=sampler_id, 
                                            Bypassed="0", Gain="1.0", Balance="0.0", VoiceLimit="256.0", KillFadeTime="20.0", IconColour="0", 
                                            SamplerRepeatMode="3.0", RRGroupAmount="6.0", PitchTracking="1.0", OneShot="0.0", CrossfadeGroups="0.0", 
                                            Purged="0.0", Reversed="0.0", NumChannels="1", UseStaticMatrix="0.0", LowPassEnvelopeOrder="0.0")
                    sampler_child_processors = ET.SubElement(sampler, "ChildProcessors")
                    
                    # Midi Processor Chain (Channel Filter)
                    sampler_midi = ET.SubElement(sampler_child_processors, "Processor", Type="MidiProcessorChain", ID="Midi Processor", Bypassed="0")
                    sampler_midi_children = ET.SubElement(sampler_midi, "ChildProcessors")
                    
                    channel_filter = ET.SubElement(sampler_midi_children, "Processor", Type="ChannelFilter", ID=f"String{string}ChannelFilter", Bypassed="0")
                    ET.SubElement(channel_filter, "ChildProcessors")
                    content = ET.SubElement(channel_filter, "Content")
                    ET.SubElement(content, "Control", type="ScriptSlider", id="channelNumber", value=f"{float(string)}")
                    ET.SubElement(content, "Control", type="ScriptSlider", id="mpeStart", value="0.0")
                    ET.SubElement(content, "Control", type="ScriptSlider", id="mpeEnd", value="16.0")
                    if is_release:
                        rel_trigger = ET.SubElement(sampler_midi_children, "Processor", Type="ReleaseTrigger", ID=f"{side}String{string}{art}RelTrigger", Bypassed="0")
                        ET.SubElement(rel_trigger, "ChildProcessors")
                        rel_content = ET.SubElement(rel_trigger, "Content")
                        ET.SubElement(rel_content, "Control", type="ScriptButton", id="TimeAttenuate", value="1.0")
                        ET.SubElement(rel_content, "Control", type="ScriptSlider", id="Time", value="4.699999809265137")
                        ET.SubElement(rel_content, "Control", type="ScriptTable", id="TimeTable", value="0.0", data="36...............vOUUUU9....9S9.VoO...f+....9C...vO")
                    
                    # Gain Modulation (AHDSR + Velocity)
                    sampler_gain = ET.SubElement(sampler_child_processors, "Processor", Type="ModulatorChain", ID="GainModulation", Bypassed="0", Intensity="1.0")
                    sampler_gain_children = ET.SubElement(sampler_gain, "ChildProcessors")
                    
                    # AHDSR and Velocity
                    ahdsr_id = f"{art}{suffix}AHDSR"
                    ahdsr = ET.SubElement(sampler_gain_children, "Processor", Type="AHDSR", ID=ahdsr_id, Bypassed="0", Monophonic="0.0", Retrigger="1.0", 
                                          Intensity="1.0", AttackCurve="0.0", DecayCurve="0.0", Attack="0.0", AttackLevel="0.0", Hold="10.0", 
                                          Decay="1.0", Sustain="0.0", Release="151.0", EcoMode="1.0")
                    ahdsr_children = ET.SubElement(ahdsr, "ChildProcessors")
                    ET.SubElement(ahdsr_children, "Processor", Type="ModulatorChain", ID="Attack Time", Bypassed="0", Intensity="1.0").append(ET.Element("ChildProcessors"))
                    ET.SubElement(ahdsr_children, "Processor", Type="ModulatorChain", ID="Attack Level", Bypassed="0", Intensity="1.0").append(ET.Element("ChildProcessors"))
                    ET.SubElement(ahdsr_children, "Processor", Type="ModulatorChain", ID="Decay Time", Bypassed="0", Intensity="1.0").append(ET.Element("ChildProcessors"))
                    ET.SubElement(ahdsr_children, "Processor", Type="ModulatorChain", ID="Sustain Level", Bypassed="0", Intensity="1.0").append(ET.Element("ChildProcessors"))
                    ET.SubElement(ahdsr_children, "Processor", Type="ModulatorChain", ID="Release Time", Bypassed="0", Intensity="1.0").append(ET.Element("ChildProcessors"))
                    
                    vel_id = f"{art}{suffix}VelModulator"
                    vel = ET.SubElement(sampler_gain_children, "Processor", Type="Velocity", ID=vel_id, Bypassed="0", 
                                        Intensity="1.0", UseTable="0.0", Inverted="0.0", DecibelMode="0.0")
                    ET.SubElement(vel, "ChildProcessors")
                    
                    # Pitch Modulation (Random Pitch + Pitch Wheel)
                    sampler_pitch = ET.SubElement(sampler_child_processors, "Processor", Type="ModulatorChain", ID="PitchModulation", Bypassed="0", Intensity="0.0")
                    sampler_pitch_children = ET.SubElement(sampler_pitch, "ChildProcessors")
                    
                    rand_pitch = ET.SubElement(sampler_pitch_children, "Processor", Type="Random", ID=f"{art}RandPitchModulator", Bypassed="0", 
                                               Intensity="0.001666666590608656", Bipolar="1", UseTable="0.0", RandomTableData="")
                    ET.SubElement(rand_pitch, "ChildProcessors")
                    
                    pitch_bend = ET.SubElement(sampler_pitch_children, "Processor", Type="PitchWheel", ID="PitchBendModulator", Bypassed="0", 
                                               Intensity="0.1666666716337204", Bipolar="1", UseTable="0.0", Inverted="0.0", SmoothTime="20.0")
                    ET.SubElement(pitch_bend, "ChildProcessors")
                    if not is_release:
                        is_first = (side == 'Left' and string == num_strings and art == articulations[0])
                        prefix = 'Source' if is_first else ''
                        vib_lfo = ET.SubElement(sampler_pitch_children, 'Processor', Type='LFO', ID=f'{prefix}VibratoLFO', Bypassed='0', 
                                                Intensity='0.01416666712611914', Bipolar='0', Frequency='11.33972263336182', FadeIn='3000.0', 
                                                WaveformType='1.0', Legato='1.0', TempoSync='0.0', SmoothingTime='20.0', LoopEnabled='1.0', 
                                                PhaseOffset='0.0', SyncToMasterClock='0.0', IgnoreNoteOn='0.0', CustomWaveform='', 
                                                StepData='64....f+....9C...3O...f+....9C...3O...f+....9C...3O...f+....9C...3O...f+....9C...3O...f+.')
                        vib_lfo_children = ET.SubElement(vib_lfo, 'ChildProcessors')
                        
                        int_mod_chain = ET.SubElement(vib_lfo_children, 'Processor', Type='ModulatorChain', ID='LFO Intensity Mod', Bypassed='0', Intensity='1.0')
                        int_mod_children = ET.SubElement(int_mod_chain, 'ChildProcessors')
                        vib_int_mod = ET.SubElement(int_mod_children, 'Processor', Type='LFO', ID=f'{prefix}VibratoLFOIntensityMod', Bypassed='0', 
                                                    Intensity='0.1700000017881393', Frequency='11.33972263336182', FadeIn='3000.0', WaveformType='1.0', 
                                                    Legato='1.0', TempoSync='0.0', SmoothingTime='20.0', LoopEnabled='1.0', PhaseOffset='0.0', 
                                                    SyncToMasterClock='0.0', IgnoreNoteOn='0.0', CustomWaveform='', 
                                                    StepData='64....f+....9C...3O...f+....9C...3O...f+....9C...3O...f+....9C...3O...f+....9C...3O...f+.')
                        vib_int_mod_children = ET.SubElement(vib_int_mod, 'ChildProcessors')
                        ET.SubElement(vib_int_mod_children, 'Processor', Type='ModulatorChain', ID='LFO Intensity Mod', Bypassed='0', Intensity='1.0').append(ET.Element('ChildProcessors'))
                        ET.SubElement(vib_int_mod_children, 'Processor', Type='ModulatorChain', ID='LFO Frequency Mod', Bypassed='0', Intensity='1.0').append(ET.Element('ChildProcessors'))
                        
                        freq_mod_chain = ET.SubElement(vib_lfo_children, 'Processor', Type='ModulatorChain', ID='LFO Frequency Mod', Bypassed='0', Intensity='1.0')
                        freq_mod_children = ET.SubElement(freq_mod_chain, 'ChildProcessors')
                        vib_freq_mod = ET.SubElement(freq_mod_children, 'Processor', Type='LFO', ID=f'{prefix}VibratoLFOFreqMod', Bypassed='0', 
                                                     Intensity='0.1700000017881393', Frequency='11.33972263336182', FadeIn='3000.0', WaveformType='1.0', 
                                                     Legato='1.0', TempoSync='0.0', SmoothingTime='20.0', LoopEnabled='1.0', PhaseOffset='0.0', 
                                                     SyncToMasterClock='0.0', IgnoreNoteOn='0.0', CustomWaveform='', 
                                                     StepData='64....f+....9C...3O...f+....9C...3O...f+....9C...3O...f+....9C...3O...f+....9C...3O...f+.')
                        vib_freq_mod_children = ET.SubElement(vib_freq_mod, 'ChildProcessors')
                        ET.SubElement(vib_freq_mod_children, 'Processor', Type='ModulatorChain', ID='LFO Intensity Mod', Bypassed='0', Intensity='1.0').append(ET.Element('ChildProcessors'))
                        ET.SubElement(vib_freq_mod_children, 'Processor', Type='ModulatorChain', ID='LFO Frequency Mod', Bypassed='0', Intensity='1.0').append(ET.Element('ChildProcessors'))
                    
                    # Standard FX, Sample Start, and Group Fade chains
                    sampler_fx = ET.SubElement(sampler_child_processors, "Processor", Type="EffectChain", ID="FX", Bypassed="0")
                    sampler_fx_children = ET.SubElement(sampler_fx, "ChildProcessors")
                    
                    conv = ET.SubElement(sampler_fx_children, "Processor", Type="Convolution", ID=f"{side}String{string}{art}{suffix}Convolution", 
                                         Bypassed="0", DryGain="-11.96508884429932", WetGain="-4.039377689361572", 
                                         Latency="0.0", ImpulseLength="1.0", ProcessInput="1.0", UseBackgroundThread="0.0", 
                                         Predelay="0.0", HiCut="20000.0", Damping="0.0", FFTType="0.0", 
                                         FileName="{'{PROJECT_FOLDER}'}Ample M (rec 50 perc).wav", 
                                         min="0", max="8192", loopStart="0", loopEnd="8192")
                    ET.SubElement(conv, "ChildProcessors")
                    ET.SubElement(conv, "RoutingMatrix", NumSourceChannels="2", Channel0="0", Send0="-1", Channel1="1", Send1="-1")
                    
                    ET.SubElement(sampler_child_processors, "Processor", Type="ModulatorChain", ID="Sample Start", Bypassed="0", Intensity="1.0").append(ET.Element("ChildProcessors"))
                    ET.SubElement(sampler_child_processors, "Processor", Type="ModulatorChain", ID="Group Fade", Bypassed="0", Intensity="1.0").append(ET.Element("ChildProcessors"))
                    
                    # Sampler Routing
                    ET.SubElement(sampler, "RoutingMatrix", NumSourceChannels="2", Channel0="0", Send0="-1", Channel1="1", Send1="-1")
                    channels = ET.SubElement(sampler, "channels")
                    ET.SubElement(channels, "channelData", enabled="1", level="0.0", suffix="")
                
                # Create main sampler
                create_sampler(False)
                # Create release sampler
                create_sampler(True)
            
    # Pretty write
    try:
        ET.indent(root, space="  ")
        tree = ET.ElementTree(root)
        tree.write(output_file, encoding="UTF-8", xml_declaration=True)
    except AttributeError:
        # Fallback for older python versions
        xml_str = ET.tostring(root, encoding='utf-8')
        parsed_xml = minidom.parseString(xml_str)
        pretty_xml = parsed_xml.toprettyxml(indent="  ")
        lines = [line for line in pretty_xml.split('\n') if line.strip()]
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write('\n'.join(lines))
            
    print(f"Generated HISE XML successfully written to: {output_file}")

if __name__ == "__main__":
    import sys
    if 'ipykernel' in sys.modules:
        strings = 6
        frets = 24
        fret_spacing = 5
        rr_spacing = 100
        articulations = ["Sus", "Mute"]
        out_path = os.path.abspath("GeneratedGuitar.xml")
        generate_hise_xml(strings, frets, fret_spacing, rr_spacing, articulations, out_path)
    else:
        parser = argparse.ArgumentParser(description="Generate HISE XML structure for Guitar Articulations")
        parser.add_argument("--strings", type=int, default=6, help="Number of strings")
        parser.add_argument("--frets", type=int, default=24, help="Number of frets")
        parser.add_argument("--fret_spacing", type=int, default=5, help="X-value spacing of the fret markers")
        parser.add_argument("--rr_spacing", type=int, default=100, help="X-value spacing of the RR labels")
        parser.add_argument("--articulations", nargs="+", default=["Sus", "Mute"], help="List of articulations to create containers for")
        parser.add_argument("--output", type=str, default="GeneratedGuitar.xml", help="Output XML file name")
        
        args = parser.parse_args()
        
        # Keep output in same folder if only filename provided
        out_path = os.path.abspath(args.output)
        
        generate_hise_xml(args.strings, args.frets, args.fret_spacing, args.rr_spacing, args.articulations, out_path)
