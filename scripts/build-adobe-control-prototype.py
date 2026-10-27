#!/usr/bin/env python3
"""Build a blank, manual first-page prototype from the supplied MPMB PDF.

Reads PDF graphics/form metadata only. Never executes embedded JavaScript or
copies filled character values. Requires PyMuPDF (fitz).
"""
import argparse, collections, json, pathlib, re
import fitz

ROOT = pathlib.Path(__file__).resolve().parents[1]
STATIC_FIELDS = {'Text.SkillsNames', 'Attack.Titles', 'SheetInformation', 'CopyrightInformation'}
SKILLS = dict(zip(['Acr','Ani','Arc','Ath','Dec','His','Ins','Inti','Inv','Med','Nat','Perc','Perf','Pers','Rel','Sle','Ste','Sur','Too'], ['Acrobatics','Animal Handling','Arcana','Athletics','Deception','History','Insight','Intimidation','Investigation','Medicine','Nature','Perception','Performance','Persuasion','Religion','Sleight of Hand','Stealth','Survival','Tool']))
ABILITIES = dict(zip(['Str','Dex','Con','Int','Wis','Cha'], ['Strength','Dexterity','Constitution','Intelligence','Wisdom','Charisma']))

def label(name):
    common={'PC Name':'Character name','Character Level':'Character level','Class and Levels':'Class and levels','HP Max':'Maximum hit points','HP Current':'Current hit points','HP Temp':'Temporary hit points','AC':'Armor Class','Too Text':'Tool name'}
    if name in common:return common[name]
    parts = name.split(' ')
    if parts[0] in SKILLS and (len(parts)==1 or parts[1] in ['Prof','Exp']):
        return SKILLS[parts[0]] + (' proficiency' if parts[-1]=='Prof' else ' expertise' if parts[-1]=='Exp' else ' bonus')
    if parts[0] in ABILITIES:
        return ABILITIES[parts[0]] + (' score' if len(parts)==1 else ' modifier' if parts[-1]=='Mod' and len(parts)==2 else ' saving throw proficiency' if parts[-1]=='Prof' else ' saving throw bonus')
    return re.sub(r'\s+', ' ', re.sub(r'([a-z])([A-Z])', r'\1 \2', name.replace('.', ' '))).strip()

def build(source, target):
    doc = fitz.open(source)
    page = doc[0]
    rows, order = [], collections.Counter()
    for widget in page.widgets():
        name = widget.field_name
        _, raw_flags = doc.xref_get_key(widget.xref, 'F')
        flags = int(raw_flags) if raw_flags.isdigit() else 0
        if flags & 35 or not page.rect.contains(widget.rect) or widget.field_type_string not in ['Text','ComboBox','CheckBox'] or name in STATIC_FIELDS:
            continue
        order[name] += 1
        rect = widget.rect
        font = widget.text_fontsize
        if font <= 0: font = 12 if name == 'Speed' else min(20, max(6.5, rect.height * .7))
        opts = []
        for option in widget.choice_values or []:
            if isinstance(option, (list,tuple)): option = option[-1]
            if str(option).strip() and str(option) not in opts: opts.append(str(option))
        # This scripted PDF selector has seven empty display captions. Supply
        # their six standard ability labels plus the browser's empty choice.
        if name.startswith('Spell DC ') and not opts: opts = list(ABILITIES.values())
        rows.append({'id': name + (' #'+str(order[name]) if order[name]>1 else ''), 'label':label(name),
                     'kind': {'Text':'textarea' if widget.field_flags & 4096 else 'text','ComboBox':'select','CheckBox':'checkbox'}[widget.field_type_string],
                     'rect': [round(n,3) for n in rect], 'fontSize':round(font,2),
                     **({'options':opts} if opts else {})})
    # Keep generic artwork, field shading, skill names and original attribution.
    # All filled text, selected dropdown values and checkbox marks are removed.
    blank = fitz.open(); blank.insert_pdf(doc, from_page=0, to_page=0, widgets=True)
    p = blank[0]
    for widget in list(p.widgets() or []):
        if widget.field_type_string != 'Button' and widget.field_name not in STATIC_FIELDS:
            p.delete_widget(widget)
    target.mkdir(parents=True,exist_ok=True)
    pix = p.get_pixmap(matrix=fitz.Matrix(3,3), alpha=False)
    from PIL import Image
    image = Image.frombytes('RGB',(pix.width,pix.height),pix.samples)
    image.save(target/'sheet-background.webp',format='WEBP',lossless=True,method=6)
    metadata = {'format':1,'title':'MPMB first-page visual prototype','sourceVersion':'13.0.4 (Printer Friendly)',
                'width':round(page.rect.width,3),'height':round(page.rect.height,3),'fields':rows}
    (target/'fields.json').write_text(json.dumps(metadata,ensure_ascii=False,separators=(',',':'))+'\n')
    print('Fields:',len(rows),dict(collections.Counter(r['kind'] for r in rows)))
    for name in ['sheet-background.webp','fields.json']: print(name,(target/name).stat().st_size,'bytes')

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('pdf',type=pathlib.Path);parser.add_argument('--output',type=pathlib.Path,default=ROOT/'prototypes/character-control')
    args=parser.parse_args();build(args.pdf,args.output)
