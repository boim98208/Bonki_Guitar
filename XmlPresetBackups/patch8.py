import sys

def patch():
    with open('generate_hise_xml.py', 'r', encoding='utf-8') as f:
        content = f.read()
        
    old_jupyter_call = '''        articulations = ["Sus", "Mute"]
        out_path = os.path.abspath("GeneratedGuitar.xml")
        generate_hise_xml(strings, frets, fret_spacing, rr_spacing, articulations, out_path)'''
    
    new_jupyter_call = '''        articulations = ["Sus", "Mute"]
        timestretch_arts = []
        out_path = os.path.abspath("GeneratedGuitar.xml")
        generate_hise_xml(strings, frets, fret_spacing, rr_spacing, articulations, timestretch_arts, out_path)'''
        
    content = content.replace(old_jupyter_call, new_jupyter_call)
    
    with open('generate_hise_xml.py', 'w', encoding='utf-8') as f:
        f.write(content)

patch()
