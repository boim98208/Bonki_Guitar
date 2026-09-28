import sys

def patch():
    with open('generate_hise_xml.py', 'r', encoding='utf-8') as f:
        lines = f.readlines()
        
    for i, line in enumerate(lines):
        if 'ET.SubElement(content, "Control", type="ScriptSlider", id="mpeEnd", value="16.0")' in line:
            indent = line[:len(line) - len(line.lstrip())]
            insert_idx = i + 1
            break
            
    snippet = [
        indent + "if is_release:\n",
        indent + "    rel_trigger = ET.SubElement(sampler_midi_children, \"Processor\", Type=\"ReleaseTrigger\", ID=\"Release Trigger1\", Bypassed=\"0\")\n",
        indent + "    ET.SubElement(rel_trigger, \"ChildProcessors\")\n",
        indent + "    rel_content = ET.SubElement(rel_trigger, \"Content\")\n",
        indent + "    ET.SubElement(rel_content, \"Control\", type=\"ScriptButton\", id=\"TimeAttenuate\", value=\"1.0\")\n",
        indent + "    ET.SubElement(rel_content, \"Control\", type=\"ScriptSlider\", id=\"Time\", value=\"4.699999809265137\")\n",
        indent + "    ET.SubElement(rel_content, \"Control\", type=\"ScriptTable\", id=\"TimeTable\", value=\"0.0\", data=\"36...............vOUUUU9....9S9.VoO...f+....9C...vO\")\n"
    ]
    
    new_lines = lines[:insert_idx] + snippet + lines[insert_idx:]
    
    with open('generate_hise_xml.py', 'w', encoding='utf-8') as f:
        f.writelines(new_lines)

patch()
