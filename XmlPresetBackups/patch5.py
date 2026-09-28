import sys

def patch():
    with open('generate_hise_xml.py', 'r', encoding='utf-8') as f:
        lines = f.readlines()
        
    for i, line in enumerate(lines):
        if 'ET.SubElement(pitch_bend, "ChildProcessors")' in line:
            indent = line[:len(line) - len(line.lstrip())]
            insert_idx = i + 1
            break
            
    snippet = [
        indent + "if not is_release:\n",
        indent + "    is_first = (side == 'Left' and string == num_strings and art == articulations[0])\n",
        indent + "    prefix = 'Source' if is_first else ''\n",
        indent + "    vib_lfo = ET.SubElement(sampler_pitch_children, 'Processor', Type='LFO', ID=f'{prefix}VibratoLFO', Bypassed='0', \n",
        indent + "                            Intensity='0.01416666712611914', Bipolar='0', Frequency='11.33972263336182', FadeIn='3000.0', \n",
        indent + "                            WaveformType='1.0', Legato='1.0', TempoSync='0.0', SmoothingTime='20.0', LoopEnabled='1.0', \n",
        indent + "                            PhaseOffset='0.0', SyncToMasterClock='0.0', IgnoreNoteOn='0.0', CustomWaveform='', \n",
        indent + "                            StepData='64....f+....9C...3O...f+....9C...3O...f+....9C...3O...f+....9C...3O...f+....9C...3O...f+.')\n",
        indent + "    vib_lfo_children = ET.SubElement(vib_lfo, 'ChildProcessors')\n",
        indent + "    \n",
        indent + "    int_mod_chain = ET.SubElement(vib_lfo_children, 'Processor', Type='ModulatorChain', ID='LFO Intensity Mod', Bypassed='0', Intensity='1.0')\n",
        indent + "    int_mod_children = ET.SubElement(int_mod_chain, 'ChildProcessors')\n",
        indent + "    vib_int_mod = ET.SubElement(int_mod_children, 'Processor', Type='LFO', ID=f'{prefix}VibratoLFOIntensityMod', Bypassed='1', \n",
        indent + "                                Intensity='0.1700000017881393', Frequency='11.33972263336182', FadeIn='3000.0', WaveformType='1.0', \n",
        indent + "                                Legato='1.0', TempoSync='0.0', SmoothingTime='20.0', LoopEnabled='1.0', PhaseOffset='0.0', \n",
        indent + "                                SyncToMasterClock='0.0', IgnoreNoteOn='0.0', CustomWaveform='', \n",
        indent + "                                StepData='64....f+....9C...3O...f+....9C...3O...f+....9C...3O...f+....9C...3O...f+....9C...3O...f+.')\n",
        indent + "    vib_int_mod_children = ET.SubElement(vib_int_mod, 'ChildProcessors')\n",
        indent + "    ET.SubElement(vib_int_mod_children, 'Processor', Type='ModulatorChain', ID='LFO Intensity Mod', Bypassed='0', Intensity='1.0').append(ET.Element('ChildProcessors'))\n",
        indent + "    ET.SubElement(vib_int_mod_children, 'Processor', Type='ModulatorChain', ID='LFO Frequency Mod', Bypassed='0', Intensity='1.0').append(ET.Element('ChildProcessors'))\n",
        indent + "    \n",
        indent + "    freq_mod_chain = ET.SubElement(vib_lfo_children, 'Processor', Type='ModulatorChain', ID='LFO Frequency Mod', Bypassed='0', Intensity='1.0')\n",
        indent + "    freq_mod_children = ET.SubElement(freq_mod_chain, 'ChildProcessors')\n",
        indent + "    vib_freq_mod = ET.SubElement(freq_mod_children, 'Processor', Type='LFO', ID=f'{prefix}VibratoLFOFreqMod', Bypassed='1', \n",
        indent + "                                 Intensity='0.1700000017881393', Frequency='11.33972263336182', FadeIn='3000.0', WaveformType='1.0', \n",
        indent + "                                 Legato='1.0', TempoSync='0.0', SmoothingTime='20.0', LoopEnabled='1.0', PhaseOffset='0.0', \n",
        indent + "                                 SyncToMasterClock='0.0', IgnoreNoteOn='0.0', CustomWaveform='', \n",
        indent + "                                 StepData='64....f+....9C...3O...f+....9C...3O...f+....9C...3O...f+....9C...3O...f+....9C...3O...f+.')\n",
        indent + "    vib_freq_mod_children = ET.SubElement(vib_freq_mod, 'ChildProcessors')\n",
        indent + "    ET.SubElement(vib_freq_mod_children, 'Processor', Type='ModulatorChain', ID='LFO Intensity Mod', Bypassed='0', Intensity='1.0').append(ET.Element('ChildProcessors'))\n",
        indent + "    ET.SubElement(vib_freq_mod_children, 'Processor', Type='ModulatorChain', ID='LFO Frequency Mod', Bypassed='0', Intensity='1.0').append(ET.Element('ChildProcessors'))\n"
    ]
    
    new_lines = lines[:insert_idx] + snippet + lines[insert_idx:]
    
    with open('generate_hise_xml.py', 'w', encoding='utf-8') as f:
        f.writelines(new_lines)

patch()
