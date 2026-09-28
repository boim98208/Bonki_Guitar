import sys

def patch():
    with open('generate_hise_xml.py', 'r', encoding='utf-8') as f:
        content = f.read()
        
    # Task 1: Unbypass LFOIntensityMod
    content = content.replace(
        "ID=f'{prefix}VibratoLFOIntensityMod', Bypassed='1'", 
        "ID=f'{prefix}VibratoLFOIntensityMod', Bypassed='0'"
    )
    
    # Task 2: RightContainerMute
    old_guitar_midi = '        ET.SubElement(guitar_child_processors, "Processor", Type="MidiProcessorChain", ID="Midi Processor", Bypassed="0").append(ET.Element("ChildProcessors"))'
    new_guitar_midi = '''        guitar_midi = ET.SubElement(guitar_child_processors, "Processor", Type="MidiProcessorChain", ID="Midi Processor", Bypassed="0")
        guitar_midi_children = ET.SubElement(guitar_midi, "ChildProcessors")
        if side == "Right":
            right_muter = ET.SubElement(guitar_midi_children, "Processor", Type="MidiMuter", ID="RightContainerMute", Bypassed="0")
            ET.SubElement(right_muter, "ChildProcessors")
            right_muter_content = ET.SubElement(right_muter, "Content")
            ET.SubElement(right_muter_content, "Control", type="ScriptButton", id="ignoreButton", value="1.0")
            ET.SubElement(right_muter_content, "Control", type="ScriptButton", id="fixStuckNotes", value="1.0")'''
    content = content.replace(old_guitar_midi, new_guitar_midi)
    
    # Task 3: SimpleGain for Articulation Container
    old_art_fx = '            ET.SubElement(art_child_processors, "Processor", Type="EffectChain", ID="FX", Bypassed="0").append(ET.Element("ChildProcessors"))'
    new_art_fx = '''            art_fx = ET.SubElement(art_child_processors, "Processor", Type="EffectChain", ID="FX", Bypassed="0")
            art_fx_children = ET.SubElement(art_fx, "ChildProcessors")
            art_gain = ET.SubElement(art_fx_children, "Processor", Type="SimpleGain", ID=f"{side}{art}Gain", Bypassed="0", 
                                     Gain="0.0", Delay="0.0", Width="100.0", Balance="0.0", InvertPolarity="0.0")
            sg_children = ET.SubElement(art_gain, "ChildProcessors")
            ET.SubElement(sg_children, "Processor", Type="ModulatorChain", ID="Gain Modulation", Bypassed="0", Intensity="1.0").append(ET.Element("ChildProcessors"))
            ET.SubElement(sg_children, "Processor", Type="ModulatorChain", ID="Delay Modulation", Bypassed="0", Intensity="1.0").append(ET.Element("ChildProcessors"))
            ET.SubElement(sg_children, "Processor", Type="ModulatorChain", ID="Width Modulation", Bypassed="0", Intensity="1.0").append(ET.Element("ChildProcessors"))
            ET.SubElement(sg_children, "Processor", Type="ModulatorChain", ID="Pan Modulation", Bypassed="0", Intensity="1.0").append(ET.Element("ChildProcessors"))
            ET.SubElement(art_gain, "RoutingMatrix", NumSourceChannels="2", Channel0="0", Send0="-1", Channel1="1", Send1="-1")'''
    content = content.replace(old_art_fx, new_art_fx)
    
    with open('generate_hise_xml.py', 'w', encoding='utf-8') as f:
        f.write(content)

patch()
