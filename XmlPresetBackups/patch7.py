import sys

def patch():
    with open('generate_hise_xml.py', 'r', encoding='utf-8') as f:
        content = f.read()
        
    # 1. Signature
    content = content.replace(
        "def generate_hise_xml(num_strings, num_frets, fret_spacing, rr_spacing, articulations, output_file):",
        "def generate_hise_xml(num_strings, num_frets, fret_spacing, rr_spacing, articulations, timestretch_arts, output_file):"
    )
    
    # 2. Argparse
    content = content.replace(
        "parser.add_argument('--articulations', nargs='+', default=['Sus', 'Mute'])",
        "parser.add_argument('--articulations', nargs='+', default=['Sus', 'Mute'])\n    parser.add_argument('--timestretch_arts', nargs='+', default=[])"
    )
    content = content.replace(
        "generate_hise_xml(args.num_strings, args.frets, args.fret_spacing, args.rr_spacing, args.articulations, args.output_file)",
        "generate_hise_xml(args.num_strings, args.frets, args.fret_spacing, args.rr_spacing, args.articulations, args.timestretch_arts, args.output_file)"
    )
    
    # 3. Modify the loop
    # We will replace the # Strings Iteration ... down to create_sampler(True) with a function call
    old_loop_start = "            # Strings Iteration (Descending)"
    old_loop_end = "                # Create release sampler\n                create_sampler(True)"
    
    start_idx = content.find(old_loop_start)
    end_idx = content.find(old_loop_end) + len(old_loop_end)
    
    loop_code = content[start_idx:end_idx]
    
    # Let's write the new logic
    new_logic = """
            is_ts_art = art in timestretch_arts
            
            def create_samplers_for_container(parent_processors_element, ts_prefix=""):
                for string in range(num_strings, 0, -1):
                    def create_sampler(is_release):
                        suffix = "Rel" if is_release else ""
                        sampler_id = f"{side}{ts_prefix}String{string}{art}{suffix}Sampler"
                        sampler = ET.SubElement(parent_processors_element, "Processor", Type="StreamingSampler", ID=sampler_id, 
                                                Bypassed="0", Gain="1.0", Balance="0.0", VoiceLimit="256.0", KillFadeTime="20.0", IconColour="0", 
                                                SamplerRepeatMode="3.0", RRGroupAmount="6.0", PitchTracking="1.0", OneShot="0.0", CrossfadeGroups="0.0", 
                                                Purged="0.0", Reversed="0.0", NumChannels="1", UseStaticMatrix="0.0", LowPassEnvelopeOrder="0.0")
                        
                        if ts_prefix == "Ts":
                            ET.SubElement(sampler, "TimestretchOptions", Tonality="0.0", SkipLatency="0", Mode="TimeVariant", NumQuarters="0.0", SourceBPM="0.0", PreferredEngine="")
                            
                        sampler_child_processors = ET.SubElement(sampler, "ChildProcessors")
                        
                        # Midi Processor Chain (Channel Filter)
                        sampler_midi = ET.SubElement(sampler_child_processors, "Processor", Type="MidiProcessorChain", ID="Midi Processor", Bypassed="0")
                        sampler_midi_children = ET.SubElement(sampler_midi, "ChildProcessors")
                        
                        channel_filter = ET.SubElement(sampler_midi_children, "Processor", Type="ChannelFilter", ID=f"String{string}ChannelFilter", Bypassed="0")
                        ET.SubElement(channel_filter, "ChildProcessors")
                        content_node = ET.SubElement(channel_filter, "Content")
                        ET.SubElement(content_node, "Control", type="ScriptSlider", id="channelNumber", value=f"{float(string)}")
                        ET.SubElement(content_node, "Control", type="ScriptSlider", id="mpeStart", value="0.0")
                        ET.SubElement(content_node, "Control", type="ScriptSlider", id="mpeEnd", value="16.0")
                        
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
                        
                        # Pitch Modulation
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
                                             FileName="{PROJECT_FOLDER}Ample M (rec 50 perc).wav", 
                                             min="0", max="8192", loopStart="0", loopEnd="8192")
                        ET.SubElement(conv, "ChildProcessors")
                        ET.SubElement(conv, "RoutingMatrix", NumSourceChannels="2", Channel0="0", Send0="-1", Channel1="1", Send1="-1")
                        
                        ET.SubElement(sampler_child_processors, "Processor", Type="ModulatorChain", ID="Sample Start", Bypassed="0", Intensity="1.0").append(ET.Element("ChildProcessors"))
                        ET.SubElement(sampler_child_processors, "Processor", Type="ModulatorChain", ID="Group Fade", Bypassed="0", Intensity="1.0").append(ET.Element("ChildProcessors"))
                        
                        # Sampler Routing
                        ET.SubElement(sampler, "RoutingMatrix", NumSourceChannels="2", Channel0="0", Send0="-1", Channel1="1", Send1="-1")
                        channels = ET.SubElement(sampler, "channels")
                        ET.SubElement(channels, "channelData", enabled="1", level="0.0", suffix="")
                        
                    create_sampler(False)
                    create_sampler(True)
            
            if is_ts_art:
                # Create Ts and NonTs containers inside the art container
                ts_container = ET.SubElement(art_child_processors, "Processor", Type="SynthChain", ID=f"{side}Ts{art}Container", Bypassed="0", Gain="1.0", Balance="0.0", VoiceLimit="256.0", KillFadeTime="20.0", IconColour="0")
                ts_children = ET.SubElement(ts_container, "ChildProcessors")
                
                ts_midi = ET.SubElement(ts_children, "Processor", Type="MidiProcessorChain", ID="Midi Processor", Bypassed="0")
                ts_midi_children = ET.SubElement(ts_midi, "ChildProcessors")
                ts_muter = ET.SubElement(ts_midi_children, "Processor", Type="MidiMuter", ID=f"{side}Ts{art}ContainerMute", Bypassed="0")
                ET.SubElement(ts_muter, "ChildProcessors")
                ts_muter_content = ET.SubElement(ts_muter, "Content")
                ET.SubElement(ts_muter_content, "Control", type="ScriptButton", id="ignoreButton", value="1.0")
                ET.SubElement(ts_muter_content, "Control", type="ScriptButton", id="fixStuckNotes", value="1.0")
                
                ET.SubElement(ts_children, "Processor", Type="ModulatorChain", ID="GainModulation", Bypassed="0", Intensity="1.0").append(ET.Element("ChildProcessors"))
                ET.SubElement(ts_children, "Processor", Type="ModulatorChain", ID="PitchModulation", Bypassed="1", Intensity="0.0").append(ET.Element("ChildProcessors"))
                ET.SubElement(ts_children, "Processor", Type="EffectChain", ID="FX", Bypassed="0").append(ET.Element("ChildProcessors"))
                
                create_samplers_for_container(ts_children, ts_prefix="Ts")
                
                nonts_container = ET.SubElement(art_child_processors, "Processor", Type="SynthChain", ID=f"{side}NonTs{art}Container", Bypassed="0", Gain="1.0", Balance="0.0", VoiceLimit="256.0", KillFadeTime="20.0", IconColour="0")
                nonts_children = ET.SubElement(nonts_container, "ChildProcessors")
                
                nonts_midi = ET.SubElement(nonts_children, "Processor", Type="MidiProcessorChain", ID="Midi Processor", Bypassed="0")
                nonts_midi_children = ET.SubElement(nonts_midi, "ChildProcessors")
                nonts_muter = ET.SubElement(nonts_midi_children, "Processor", Type="MidiMuter", ID=f"{side}NonTs{art}ContainerMute", Bypassed="0")
                ET.SubElement(nonts_muter, "ChildProcessors")
                nonts_muter_content = ET.SubElement(nonts_muter, "Content")
                ET.SubElement(nonts_muter_content, "Control", type="ScriptButton", id="ignoreButton", value="1.0")
                ET.SubElement(nonts_muter_content, "Control", type="ScriptButton", id="fixStuckNotes", value="1.0")
                
                ET.SubElement(nonts_children, "Processor", Type="ModulatorChain", ID="GainModulation", Bypassed="0", Intensity="1.0").append(ET.Element("ChildProcessors"))
                ET.SubElement(nonts_children, "Processor", Type="ModulatorChain", ID="PitchModulation", Bypassed="1", Intensity="0.0").append(ET.Element("ChildProcessors"))
                ET.SubElement(nonts_children, "Processor", Type="EffectChain", ID="FX", Bypassed="0").append(ET.Element("ChildProcessors"))
                
                create_samplers_for_container(nonts_children, ts_prefix="NonTs")
            else:
                create_samplers_for_container(art_child_processors)
"""
    
    content = content[:start_idx] + new_logic + content[end_idx:]
    
    with open('generate_hise_xml.py', 'w', encoding='utf-8') as f:
        f.write(content)

patch()
