#!/usr/bin/env python3
"""Generate display facts from the pinned cache; no source entries or prose are emitted."""
import argparse,json,pathlib,re
ROOT=pathlib.Path(__file__).resolve().parents[1]
TYPES='acid bludgeoning cold fire force lightning necrotic piercing poison psychic radiant slashing thunder'.split()
GEOMETRY={'S','C','Y','W','N','Q','L','R','E','H'}
SHAPES=[r'\b([\d,]+)-foot(-radius|-square|-diameter)?\s+(sphere|cube|cone|cylinder|line|emanation|square|hemisphere)',r'\b([\d,]+)-foot[- ]radius']
def has_geometry(row):
    text=' '.join(plain(t) for t in strings(row.get('entries',[])))
    return any(re.search(pattern,text,re.I) for pattern in SHAPES)
def strings(obj):
    if isinstance(obj,str):yield obj
    elif isinstance(obj,list):
        for item in obj:yield from strings(item)
    elif isinstance(obj,dict):
        for key,value in obj.items():
            if key not in ['name','caption','colLabels']:yield from strings(value)
def plain(text):
    text=re.sub(r'\{@\w+ ([^}|]+)(?:\|[^}]+)?\}',r'\1',text)
    return re.sub(r'\s*\[Area of Effect\]','',text)
def compact(text):
    return re.sub(r'\s*([+−-])\s*',r'\1',text.strip()).replace('summonSpellLevel','SL').replace('your spellcasting ability modifier','SC')
def extract(row):
    texts=list(strings(row.get('entries',[])));text=' '.join(plain(t) for t in texts);damage=[]
    for t in texts:
        for match in re.finditer(r'\{@(?:damage|dice) ([^}|]+)(?:\|[^}]*)?\}',t):
            if match[0].startswith('{@dice') and not re.search(r'\bdamage\b',t[match.end():].split('. ')[0][:100],re.I):continue
            formula=compact(match[1]);after=plain(t[match.end():match.end()+75]);kind=re.match(r'\s+('+'|'.join(TYPES)+r')\b',after,re.I)
            if re.search(r'^(?: (?:[A-Za-z]+) damage)?\s*(?:plus|\+) your spellcasting ability modifier',after,re.I) and 'SC' not in formula:formula+='+SC'
            types=[kind[1].title()] if kind else [x.title() for x in row.get('damageInflict',[])]
            label=formula+(' '+('/'.join(types)) if types else '')
            if label not in damage:damage.append(label)
    scaling=row.get('scalingLevelDice');cantrip=isinstance(scaling,dict) and bool(scaling.get('scaling'))
    if cantrip and damage:damage=damage[:1]  # multiple base/5/11/17 tokens describe the same scaled effect
    area='';shape=row['range']['type'];distance=row['range'].get('distance',{})
    if shape not in ['point','special'] and isinstance(distance.get('amount'),int):
        unit={'feet':'ft','miles':'mile'}.get(distance.get('type'))
        if unit:area=str(distance['amount'])+'-'+unit+('-radius sphere' if unit=='mile' and shape=='sphere' else ' '+shape)
    if not area:
        for pattern in SHAPES:
            found=re.search(pattern,text,re.I)
            if found:
                area=found[0].replace('-foot','-ft').lower();break
    higher=' '.join(strings(row.get('entriesHigherLevel',[])));upcast=''
    match=re.search(r'\{@scaledamage ([^}|]+)\|([^}|]+)\|([^}|]+)',higher)
    if match and re.search(r'(?:each|every) (?:spell )?slot level',plain(higher),re.I):upcast='+'+compact(match[3])+'/SL above '+str(row['level'])
    if cantrip:upcast='CL 5/11/17: '+ '/'.join(str(scaling['scaling'].get(str(level),scaling['scaling'].get(level,''))) for level in [5,11,17])
    return {'damage':'; '.join(damage),'area':area,'scaling':upcast}
def overrides():
    result={};path=ROOT/'scripts/spell-effect-overrides.json'
    if path.exists():result=json.loads(path.read_text())
    return result
def build():
    catalog=json.loads((ROOT/'data/rules/catalog.json').read_text());source={(s['name'],s['source']):s for f in (ROOT/'scripts/.source-cache/5etools-v1/spells').glob('spells-*.json') for s in json.loads(f.read_text()).get('spell',[])}
    authored=overrides();rows={};audit=[]
    for spell in catalog['spells']:
        raw=source[(spell['name'],spell['source'])];facts=extract(raw)
        if spell.get('combat',{}).get('nonDamage'):facts['damage']='';facts['scaling']=''
        numeric_damage=bool(facts['damage'])
        for key in [spell['name'],spell['name']+'|'+spell['source']]:facts.update(authored.get(key,{}))
        for value in facts.values():
            if not isinstance(value,str) or '{@' in value or len(value)>300:raise ValueError('Invalid concise display fact: '+spell['name'])
        rows[spell['id']]={k:v for k,v in facts.items() if v}
        damage_expected=not spell.get('combat',{}).get('nonDamage') and (numeric_damage or bool(raw.get('damageInflict')) or bool(re.search(r'\{@damage ',str(raw.get('entries',[])))))
        area_expected=bool(has_geometry(raw)) or bool(set(raw.get('areaTags',[]))&GEOMETRY) or raw['range']['type'] not in ['point','special']
        audit.append({'id':spell['id'],'name':spell['name'],'source':spell['source'],'edition':spell['edition'],'damageExpected':damage_expected,'areaExpected':area_expected,'facts':rows[spell['id']],'missingDamage':damage_expected and not facts['damage'],'missingArea':area_expected and not facts['area']})
    return catalog,rows,audit
if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--check',action='store_true');args=parser.parse_args();catalog,rows,audit=build()
    names={}
    for spell in catalog['spells']:
        key=spell['edition']+':'+spell['name']
        if key not in names or spell['source'] in ['PHB','XPHB']:names[key]=spell['id']
    data={'revision':catalog['indexRevision'],'spells':rows,'names':names};js="'use strict';\n/* Generated display-only numeric/area facts; no source entries. Never used as attack formulas. */\nvar CharacterSpellEffectData="+json.dumps(data,ensure_ascii=False,separators=(',',':'))+";\nif(typeof module!=='undefined'&&module.exports)module.exports=CharacterSpellEffectData;\n"
    report={'revision':data['revision'],'scope':'Display-only damage, area and scaling reminders; structured metadata plus original concise overrides. Not a spell rules engine.', 'totals':{'spells':len(audit),'damageExpected':sum(r['damageExpected'] for r in audit),'areaExpected':sum(r['areaExpected'] for r in audit),'missingDamage':sum(r['missingDamage'] for r in audit),'missingArea':sum(r['missingArea'] for r in audit)},'spells':audit}
    for path,text in [(ROOT/'js/modules/character-spell-effect-data.js',js),(ROOT/'docs/spell-effect-description-audit.json',json.dumps(report,ensure_ascii=False,indent=2)+'\n')]:
        if args.check:
            if path.read_text()!=text:raise SystemExit('Spell effect reference is stale: '+str(path))
        else:path.write_text(text)
    print(json.dumps(report['totals']))
