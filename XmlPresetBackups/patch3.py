import sys

def patch():
    with open('generate_hise_xml.py', 'r', encoding='utf-8') as f:
        lines = f.readlines()
        
    start_idx = 0
    end_idx = 0
    for i, line in enumerate(lines):
        if "# Strings Iteration (Descending)" in line:
            start_idx = i
        if "# Pretty write" in line:
            end_idx = i
            break
            
    new_lines = lines[:start_idx]
    post_lines = lines[end_idx:]
    
    code = """            # Strings Iteration (Descending)
            for string in range(num_strings, 0, -1):
                def create_sampler(is_release):
                    suffix = \"Rel\" if is_release else \"\"
                    sampler_id = f\"{side}String{string}{art}{suffix}Sampler\"
                    sampler = ET.SubElement(art_child_processors, \"Processor\", Type=\"StreamingSampler\", ID=sampler_id, 
                                            Bypassed=\"0\", Gain=\"1.0\", Balance=\"0.0\", VoiceLimit=\"256.0\", KillFadeTime=\"20.0\", IconColour=\"0\", 
                                            SamplerRepeatMode=\"3.0\", RRGroupAmount=\"6.0\", PitchTracking=\"1.0\", OneShot=\"0.0\", CrossfadeGroups=\"0.0\", 
                                            Purged=\"0.0\", Reversed=\"0.0\", NumChannels=\"1\", UseStaticMatrix=\"0.0\", LowPassEnvelopeOrder=\"0.0\")
                    sampler_child_processors = ET.SubElement(sampler, \"ChildProcessors\")
                    
                    # Midi Processor Chain (Channel Filter)
                    sampler_midi = ET.SubElement(sampler_child_processors, \"Processor\", Type=\"MidiProcessorChain\", ID=\"Midi Processor\", Bypassed=\"0\")
                    sampler_midi_children = ET.SubElement(sampler_midi, \"ChildProcessors\")
                    
                    channel_filter = ET.SubElement(sampler_midi_children, \"Processor\", Type=\"ChannelFilter\", ID=f\"String{string}ChannelFilter\", Bypassed=\"0\")
                    ET.SubElement(channel_filter, \"ChildProcessors\")
                    content = ET.SubElement(channel_filter, \"Content\")
                    ET.SubElement(content, \"Control\", type=\"ScriptSlider\", id=\"channelNumber\", value=f\"{float(string)}\")
                    ET.SubElement(content, \"Control\", type=\"ScriptSlider\", id=\"mpeStart\", value=\"0.0\")
                    ET.SubElement(content, \"Control\", type=\"ScriptSlider\", id=\"mpeEnd\", value=\"16.0\")
                    
                    # Gain Modulation (AHDSR + Velocity)
                    sampler_gain = ET.SubElement(sampler_child_processors, \"Processor\", Type=\"ModulatorChain\", ID=\"GainModulation\", Bypassed=\"0\", Intensity=\"1.0\")
                    sampler_gain_children = ET.SubElement(sampler_gain, \"ChildProcessors\")
                    
                    # AHDSR and Velocity
                    ahdsr_id = f\"{art}{suffix}AHDSR\"
                    ahdsr = ET.SubElement(sampler_gain_children, \"Processor\", Type=\"AHDSR\", ID=ahdsr_id, Bypassed=\"0\", Monophonic=\"0.0\", Retrigger=\"1.0\", 
                                          Intensity=\"1.0\", AttackCurve=\"0.0\", DecayCurve=\"0.0\", Attack=\"0.0\", AttackLevel=\"0.0\", Hold=\"10.0\", 
                                          Decay=\"1.0\", Sustain=\"0.0\", Release=\"151.0\", EcoMode=\"1.0\")
                    ahdsr_children = ET.SubElement(ahdsr, \"ChildProcessors\")
                    ET.SubElement(ahdsr_children, \"Processor\", Type=\"ModulatorChain\", ID=\"Attack Time\", Bypassed=\"0\", Intensity=\"1.0\").append(ET.Element(\"ChildProcessors\"))
                    ET.SubElement(ahdsr_children, \"Processor\", Type=\"ModulatorChain\", ID=\"Attack Level\", Bypassed=\"0\", Intensity=\"1.0\").append(ET.Element(\"ChildProcessors\"))
                    ET.SubElement(ahdsr_children, \"Processor\", Type=\"ModulatorChain\", ID=\"Decay Time\", Bypassed=\"0\", Intensity=\"1.0\").append(ET.Element(\"ChildProcessors\"))
                    ET.SubElement(ahdsr_children, \"Processor\", Type=\"ModulatorChain\", ID=\"Sustain Level\", Bypassed=\"0\", Intensity=\"1.0\").append(ET.Element(\"ChildProcessors\"))
                    ET.SubElement(ahdsr_children, \"Processor\", Type=\"ModulatorChain\", ID=\"Release Time\", Bypassed=\"0\", Intensity=\"1.0\").append(ET.Element(\"ChildProcessors\"))
                    
                    vel_id = f\"{art}{suffix}VelModulator\"
                    vel = ET.SubElement(sampler_gain_children, \"Processor\", Type=\"Velocity\", ID=vel_id, Bypassed=\"0\", 
                                        Intensity=\"1.0\", UseTable=\"0.0\", Inverted=\"0.0\", DecibelMode=\"0.0\")
                    ET.SubElement(vel, \"ChildProcessors\")
                    
                    # Pitch Modulation (Random Pitch + Pitch Wheel)
                    sampler_pitch = ET.SubElement(sampler_child_processors, \"Processor\", Type=\"ModulatorChain\", ID=\"PitchModulation\", Bypassed=\"0\", Intensity=\"0.0\")
                    sampler_pitch_children = ET.SubElement(sampler_pitch, \"ChildProcessors\")
                    
                    rand_pitch = ET.SubElement(sampler_pitch_children, \"Processor\", Type=\"Random\", ID=f\"{art}RandPitchModulator\", Bypassed=\"0\", 
                                               Intensity=\"0.001666666590608656\", Bipolar=\"1\", UseTable=\"0.0\", RandomTableData=\"\")
                    ET.SubElement(rand_pitch, \"ChildProcessors\")
                    
                    pitch_bend = ET.SubElement(sampler_pitch_children, \"Processor\", Type=\"PitchWheel\", ID=\"PitchBendModulator\", Bypassed=\"0\", 
                                               Intensity=\"0.1666666716337204\", Bipolar=\"1\", UseTable=\"0.0\", Inverted=\"0.0\", SmoothTime=\"20.0\")
                    ET.SubElement(pitch_bend, \"ChildProcessors\")
                    
                    # Standard FX, Sample Start, and Group Fade chains
                    sampler_fx = ET.SubElement(sampler_child_processors, \"Processor\", Type=\"EffectChain\", ID=\"FX\", Bypassed=\"0\")
                    sampler_fx_children = ET.SubElement(sampler_fx, \"ChildProcessors\")
                    
                    conv = ET.SubElement(sampler_fx_children, \"Processor\", Type=\"Convolution\", ID=f\"{side}String{string}{art}{suffix}Convolution\", 
                                         Bypassed=\"0\", DryGain=\"-11.96508884429932\", WetGain=\"-4.039377689361572\", 
                                         Latency=\"0.0\", ImpulseLength=\"1.0\", ProcessInput=\"1.0\", UseBackgroundThread=\"0.0\", 
                                         Predelay=\"0.0\", HiCut=\"20000.0\", Damping=\"0.0\", FFTType=\"0.0\", 
                                         FileName=\"{'{PROJECT_FOLDER}'}Ample M (rec 50 perc).wav\", 
                                         min=\"0\", max=\"8192\", loopStart=\"0\", loopEnd=\"8192\")
                    ET.SubElement(conv, \"ChildProcessors\")
                    ET.SubElement(conv, \"RoutingMatrix\", NumSourceChannels=\"2\", Channel0=\"0\", Send0=\"-1\", Channel1=\"1\", Send1=\"-1\")
                    
                    ET.SubElement(sampler_child_processors, \"Processor\", Type=\"ModulatorChain\", ID=\"Sample Start\", Bypassed=\"0\", Intensity=\"1.0\").append(ET.Element(\"ChildProcessors\"))
                    ET.SubElement(sampler_child_processors, \"Processor\", Type=\"ModulatorChain\", ID=\"Group Fade\", Bypassed=\"0\", Intensity=\"1.0\").append(ET.Element(\"ChildProcessors\"))
                    
                    # Sampler Routing
                    ET.SubElement(sampler, \"RoutingMatrix\", NumSourceChannels=\"2\", Channel0=\"0\", Send0=\"-1\", Channel1=\"1\", Send1=\"-1\")
                    channels = ET.SubElement(sampler, \"channels\")
                    ET.SubElement(channels, \"channelData\", enabled=\"1\", level=\"0.0\", suffix=\"\")
                
                # Create main sampler
                create_sampler(False)
                # Create release sampler
                create_sampler(True)
            
"""
    with open('generate_hise_xml.py', 'w', encoding='utf-8') as f:
        f.writelines(new_lines)
        f.write(code)
        f.writelines(post_lines)

patch()
