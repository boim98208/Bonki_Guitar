import sys

def patch():
    with open('generate_hise_xml.py', 'r', encoding='utf-8') as f:
        lines = f.readlines()
        
    new_lines = lines[:1060] # Up to line 1060
    
    func_code = """
def generate_hise_xml(num_strings, num_frets, fret_spacing, rr_spacing, articulations, output_file):
    # Root Processor
    root = ET.Element("Processor", Type="SynthChain", ID="MainContainer", Bypassed="0", 
                      Gain="1.0", Balance="0.0", VoiceLimit="256.0", KillFadeTime="20.0", IconColour="0")
    
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
    string_force_panel = ui_data.find('.//Component[@id=\"StringForcePanel\"]')
    for child in list(string_force_panel):
        string_force_panel.remove(child)
        
    string_fret_markers_pnl = ui_data.find('.//Component[@id=\"StringFretMarkersPnl\"]')
    for child in list(string_fret_markers_pnl):
        string_fret_markers_pnl.remove(child)
        
    debug_panel = ui_data.find('.//Component[@id=\"DebugPanel\"]')
    for child in list(debug_panel):
        if child.attrib.get('id', '').endswith('RRLabel') and child.attrib.get('id', '').startswith('String'):
            debug_panel.remove(child)
            
    for string in range(num_strings, 0, -1):
        # StringForcePanel
        y_force = 17 + (string - 1) * 10
        ET.SubElement(string_force_panel, "Component", type="ScriptImage", id=f\"StringForceString{string}\", x=\"12\", y=str(y_force), width=\"605\", height=\"10\", parentComponent=\"StringForcePanel\", fileName=f\"{'{PROJECT_FOLDER}'}PlayingMode_ForceString_Indicator_String{string}.png\", scale=\"0.699999988079071\", visible=\"0\")
        
        # StringFretMarkersPnl
        y_fret_pnl = 275 + (string - 1) * 5
        string_fret_pnl = ET.SubElement(string_fret_markers_pnl, "Component", type=\"ScriptPanel\", id=f\"String{string}FretMarkers\", x=\"0\", y=str(y_fret_pnl), width=\"1020\", height=\"54\", parentComponent=\"StringFretMarkersPnl\", itemColour=\"0\", itemColour2=\"0\", textColour=\"16777215\", bgColour=\"16777215\")
        
        for fret in range(num_frets + 1):
            x_fret = 195 + fret * fret_spacing
            ET.SubElement(string_fret_pnl, "Component", type=\"ScriptImage\", id=f\"String{string}Fret{fret}Marker\", x=str(x_fret), y=\"20\", width=\"11\", height=\"12\", fileName=\"{'{PROJECT_FOLDER}'}PlayingMode_FretIndicator.png\", parentComponent=f\"String{string}FretMarkers\", text=\"\", visible=\"0\")

        # DebugPanel RRLabels
        x_rr = 4 + (num_strings - string) * rr_spacing
        ET.SubElement(debug_panel, "Component", type=\"ScriptLabel\", id=f\"String{string}RRLabel\", x=str(x_rr), y=\"50\", width=\"100\", height=\"21\", parentComponent=\"DebugPanel\", text=\"-1\", textColour=\"4278190080\", fontSize=\"16.0\")

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
        guitar_container = ET.SubElement(container0_child_processors, "Processor", Type="SynthChain", ID=f\"{side}GuitarContainer\", Bypassed=\"0\", 
                                      Gain=\"1.0\", Balance=\"0.0\", VoiceLimit=\"256.0\", KillFadeTime=\"20.0\", IconColour=\"0\")
        guitar_child_processors = ET.SubElement(guitar_container, "ChildProcessors")
        
        ET.SubElement(guitar_child_processors, "Processor", Type="MidiProcessorChain", ID="Midi Processor", Bypassed="0").append(ET.Element("ChildProcessors"))
        ET.SubElement(guitar_child_processors, "Processor", Type="ModulatorChain", ID="GainModulation", Bypassed="0", Intensity="1.0").append(ET.Element("ChildProcessors"))
        ET.SubElement(guitar_child_processors, "Processor", Type="ModulatorChain", ID="PitchModulation", Bypassed="1", Intensity="0.0").append(ET.Element("ChildProcessors"))
        
        guitar_fx = ET.SubElement(guitar_child_processors, "Processor", Type="EffectChain", ID="FX", Bypassed="0")
        guitar_fx_children = ET.SubElement(guitar_fx, "ChildProcessors")
        
        gain_val = \"-100.0\" if side == \"Right\" else \"0.0\"
        balance_val = \"100.0\" if side == \"Right\" else \"0.0\"
        simple_gain = ET.SubElement(guitar_fx_children, "Processor", Type="SimpleGain", ID=f\"{side}GuitarGain\", Bypassed=\"0\", 
                                    Gain=gain_val, Delay=\"0.0\", Width=\"100.0\", Balance=balance_val, InvertPolarity=\"0.0\")
        sg_children = ET.SubElement(simple_gain, "ChildProcessors")
        ET.SubElement(sg_children, "Processor", Type="ModulatorChain", ID="Gain Modulation", Bypassed="0", Intensity="1.0").append(ET.Element("ChildProcessors"))
        ET.SubElement(sg_children, "Processor", Type="ModulatorChain", ID="Delay Modulation", Bypassed="0", Intensity="1.0").append(ET.Element("ChildProcessors"))
        ET.SubElement(sg_children, "Processor", Type="ModulatorChain", ID="Width Modulation", Bypassed="0", Intensity="1.0").append(ET.Element("ChildProcessors"))
        ET.SubElement(sg_children, "Processor", Type="ModulatorChain", ID="Pan Modulation", Bypassed="0", Intensity="1.0").append(ET.Element("ChildProcessors"))
        ET.SubElement(simple_gain, "RoutingMatrix", NumSourceChannels="2", Channel0="0", Send0="-1", Channel1="1", Send1="-1")

        # Articulations
        for art in articulations:
            art_container = ET.SubElement(guitar_child_processors, "Processor", Type="SynthChain", ID=f\"{side}{art}Container\", Bypassed=\"0\", 
                                          Gain=\"1.0\", Balance=\"0.0\", VoiceLimit=\"256.0\", KillFadeTime=\"20.0\", IconColour=\"0\")
            art_child_processors = ET.SubElement(art_container, "ChildProcessors")
            
            art_midi = ET.SubElement(art_child_processors, "Processor", Type="MidiProcessorChain", ID="Midi Processor", Bypassed="0")
            art_midi_children = ET.SubElement(art_midi, "ChildProcessors")
            
            art_muter = ET.SubElement(art_midi_children, "Processor", Type="MidiMuter", ID=f\"{side}{art}ContainerMute\", Bypassed=\"0\")
            ET.SubElement(art_muter, "ChildProcessors")
            art_muter_content = ET.SubElement(art_muter, "Content")
            ET.SubElement(art_muter_content, "Control", type="ScriptButton", id="ignoreButton", value="1.0")
            ET.SubElement(art_muter_content, "Control", type="ScriptButton", id="fixStuckNotes", value="1.0")
            
            ET.SubElement(art_child_processors, "Processor", Type="ModulatorChain", ID="GainModulation", Bypassed="0", Intensity="1.0").append(ET.Element("ChildProcessors"))
            ET.SubElement(art_child_processors, "Processor", Type="ModulatorChain", ID="PitchModulation", Bypassed="1", Intensity="0.0").append(ET.Element("ChildProcessors"))
            ET.SubElement(art_child_processors, "Processor", Type="EffectChain", ID="FX", Bypassed="0").append(ET.Element("ChildProcessors"))
            
            # Strings Iteration (Descending)
            for string in range(num_strings, 0, -1):
                sampler = ET.SubElement(art_child_processors, "Processor", Type="StreamingSampler", ID=f\"{side}String{string}{art}Sampler\", 
                                        Bypassed=\"0\", Gain=\"1.0\", Balance=\"0.0\", VoiceLimit=\"256.0\", KillFadeTime=\"20.0\", IconColour=\"0\", 
                                        SamplerRepeatMode=\"3.0\", RRGroupAmount=\"6.0\", PitchTracking=\"1.0\", OneShot=\"0.0\", CrossfadeGroups=\"0.0\", 
                                        Purged=\"0.0\", Reversed=\"0.0\", NumChannels=\"1\", UseStaticMatrix=\"0.0\", LowPassEnvelopeOrder=\"0.0\")
                sampler_child_processors = ET.SubElement(sampler, "ChildProcessors")
                
                # Midi Processor Chain (Channel Filter)
                sampler_midi = ET.SubElement(sampler_child_processors, "Processor", Type="MidiProcessorChain", ID="Midi Processor", Bypassed="0")
                sampler_midi_children = ET.SubElement(sampler_midi, "ChildProcessors")
                
                channel_filter = ET.SubElement(sampler_midi_children, "Processor", Type="ChannelFilter", ID=f\"String{string}ChannelFilter\", Bypassed=\"0\")
                ET.SubElement(channel_filter, "ChildProcessors")
                content = ET.SubElement(channel_filter, "Content")
                ET.SubElement(content, "Control", type=\"ScriptSlider\", id=\"channelNumber\", value=f\"{float(string)}\")
                ET.SubElement(content, "Control", type=\"ScriptSlider\", id=\"mpeStart\", value=\"0.0\")
                ET.SubElement(content, "Control", type=\"ScriptSlider\", id=\"mpeEnd\", value=\"16.0\")
                
                # Gain Modulation (AHDSR + Velocity)
                sampler_gain = ET.SubElement(sampler_child_processors, "Processor", Type="ModulatorChain", ID="GainModulation", Bypassed="0", Intensity="1.0")
                sampler_gain_children = ET.SubElement(sampler_gain, "ChildProcessors")
                
                # AHDSR and Velocity retain only the articulation name
                ahdsr = ET.SubElement(sampler_gain_children, "Processor", Type="AHDSR", ID=f\"{art}AHDSR\", Bypassed=\"0\", Monophonic=\"0.0\", Retrigger=\"1.0\", 
                                      Intensity=\"1.0\", AttackCurve=\"0.0\", DecayCurve=\"0.0\", Attack=\"0.0\", AttackLevel=\"0.0\", Hold=\"10.0\", 
                                      Decay=\"1.0\", Sustain=\"0.0\", Release=\"151.0\", EcoMode=\"1.0\")
                ahdsr_children = ET.SubElement(ahdsr, "ChildProcessors")
                ET.SubElement(ahdsr_children, "Processor", Type="ModulatorChain", ID="Attack Time", Bypassed="0", Intensity="1.0").append(ET.Element("ChildProcessors"))
                ET.SubElement(ahdsr_children, "Processor", Type="ModulatorChain", ID="Attack Level", Bypassed="0", Intensity="1.0").append(ET.Element("ChildProcessors"))
                ET.SubElement(ahdsr_children, "Processor", Type="ModulatorChain", ID="Decay Time", Bypassed="0", Intensity="1.0").append(ET.Element("ChildProcessors"))
                ET.SubElement(ahdsr_children, "Processor", Type="ModulatorChain", ID="Sustain Level", Bypassed="0", Intensity="1.0").append(ET.Element("ChildProcessors"))
                ET.SubElement(ahdsr_children, "Processor", Type="ModulatorChain", ID="Release Time", Bypassed="0", Intensity="1.0").append(ET.Element("ChildProcessors"))
                
                vel = ET.SubElement(sampler_gain_children, "Processor", Type="Velocity", ID=f\"{art}VelModulator\", Bypassed=\"0\", 
                                    Intensity=\"1.0\", UseTable=\"0.0\", Inverted=\"0.0\", DecibelMode=\"0.0\")
                ET.SubElement(vel, "ChildProcessors")
                
                # Pitch Modulation (Random Pitch + Pitch Wheel)
                sampler_pitch = ET.SubElement(sampler_child_processors, "Processor", Type="ModulatorChain", ID="PitchModulation", Bypassed="0", Intensity="0.0")
                sampler_pitch_children = ET.SubElement(sampler_pitch, "ChildProcessors")
                
                rand_pitch = ET.SubElement(sampler_pitch_children, "Processor", Type="Random", ID=f\"{art}RandPitchModulator\", Bypassed=\"0\", 
                                           Intensity=\"0.001666666590608656\", Bipolar=\"1\", UseTable=\"0.0\", RandomTableData=\"\")
                ET.SubElement(rand_pitch, "ChildProcessors")
                
                pitch_bend = ET.SubElement(sampler_pitch_children, "Processor", Type="PitchWheel", ID=\"PitchBendModulator\", Bypassed=\"0\", 
                                           Intensity=\"0.1666666716337204\", Bipolar=\"1\", UseTable=\"0.0\", Inverted=\"0.0\", SmoothTime=\"20.0\")
                ET.SubElement(pitch_bend, "ChildProcessors")
                
                # Standard FX, Sample Start, and Group Fade chains
                ET.SubElement(sampler_child_processors, "Processor", Type="EffectChain", ID="FX", Bypassed="0").append(ET.Element("ChildProcessors"))
                ET.SubElement(sampler_child_processors, "Processor", Type="ModulatorChain", ID="Sample Start", Bypassed="0", Intensity="1.0").append(ET.Element("ChildProcessors"))
                ET.SubElement(sampler_child_processors, "Processor", Type="ModulatorChain", ID="Group Fade", Bypassed="0", Intensity="1.0").append(ET.Element("ChildProcessors"))
                
                # Sampler Routing
                ET.SubElement(sampler, "RoutingMatrix", NumSourceChannels="2", Channel0="0", Send0="-1", Channel1="1", Send1="-1")
                channels = ET.SubElement(sampler, "channels")
                ET.SubElement(channels, "channelData", enabled=\"1\", level=\"0.0\", suffix=\"\")
            
    # Pretty write
    try:
        ET.indent(root, space=\"  \")
        tree = ET.ElementTree(root)
        tree.write(output_file, encoding=\"UTF-8\", xml_declaration=True)
    except AttributeError:
        # Fallback for older python versions
        xml_str = ET.tostring(root, encoding='utf-8')
        parsed_xml = minidom.parseString(xml_str)
        pretty_xml = parsed_xml.toprettyxml(indent=\"  \")
        lines = [line for line in pretty_xml.split('\\n') if line.strip()]
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write('\\n'.join(lines))
            
    print(f\"Generated HISE XML successfully written to: {output_file}\")

if __name__ == \"__main__\":
    import sys
    if 'ipykernel' in sys.modules:
        strings = 6
        frets = 24
        fret_spacing = 5
        rr_spacing = 100
        articulations = [\"Sus\", \"Mute\"]
        out_path = os.path.abspath(\"GeneratedGuitar.xml\")
        generate_hise_xml(strings, frets, fret_spacing, rr_spacing, articulations, out_path)
    else:
        parser = argparse.ArgumentParser(description=\"Generate HISE XML structure for Guitar Articulations\")
        parser.add_argument(\"--strings\", type=int, default=6, help=\"Number of strings\")
        parser.add_argument(\"--frets\", type=int, default=24, help=\"Number of frets\")
        parser.add_argument(\"--fret_spacing\", type=int, default=5, help=\"X-value spacing of the fret markers\")
        parser.add_argument(\"--rr_spacing\", type=int, default=100, help=\"X-value spacing of the RR labels\")
        parser.add_argument(\"--articulations\", nargs=\"+\", default=[\"Sus\", \"Mute\"], help=\"List of articulations to create containers for\")
        parser.add_argument(\"--output\", type=str, default=\"GeneratedGuitar.xml\", help=\"Output XML file name\")
        
        args = parser.parse_args()
        
        # Keep output in same folder if only filename provided
        out_path = os.path.abspath(args.output)
        
        generate_hise_xml(args.strings, args.frets, args.fret_spacing, args.rr_spacing, args.articulations, out_path)
"""
    with open('generate_hise_xml.py', 'w', encoding='utf-8') as f:
        f.writelines(new_lines)
        f.write(func_code)

patch()
