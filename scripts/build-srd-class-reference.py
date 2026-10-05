#!/usr/bin/env python3
"""Build structured class/subclass progression from pinned CC-BY SRD data.

Source normalization: Open5e's pinned Wizards SRD 5.1 / 5.2.1 datasets.
Output is loaded by character-class-progression.js and then published globally
to Firestore by CharacterRulesCatalogStore.
"""
import json, pathlib, re, urllib.request
ROOT=pathlib.Path(__file__).resolve().parents[1]
REV='0acbf263c74caf8ad080af7a16d86d3700a1ac8f'
BASE=f'https://raw.githubusercontent.com/open5e/open5e-api/{REV}/data/v2/wizards-of-the-coast/srd-{{edition}}/'
def fetch(edition,name):
    with urllib.request.urlopen(BASE.format(edition=edition)+name,timeout=90) as r:return json.load(r)
def slug(s):return re.sub(r'(^-|-$)','',re.sub(r'[^a-z0-9]+','-',s.lower()))
def clean(s):
    s=(s or '').replace('\r','')
    s=re.split(r'\n\s*\n',s,maxsplit=1)[0]
    s=re.sub(r'[*|]+',' ',s)
    return re.sub(r'\s+',' ',s).strip()[:900]
out={'source':'Open5e normalized Wizards SRD data','revision':REV,'license':'CC-BY-4.0','editions':{}}
for edition in ('2014','2024'):
    classes=fetch(edition,'CharacterClass.json');features=fetch(edition,'ClassFeature.json');items=fetch(edition,'ClassFeatureItem.json')
    owners={x['pk']:{'id':slug(x['fields']['name']),'name':x['fields']['name'],'parent':x['fields'].get('subclass_of'),'hitDie':x['fields'].get('hit_dice') or '','savingThrows':x['fields'].get('saving_throws') or [],'casterType':x['fields'].get('caster_type') or ''} for x in classes}
    levels={}
    for x in items:
        f=x['fields']
        if isinstance(f.get('level'),int) and f.get('column_value') is None:levels.setdefault(f['parent'],set()).add(f['level'])
    groups={'classes':{},'subclasses':{}}
    for x in features:
        f=x['fields']
        if f.get('feature_type') or f.get('parent') not in owners:continue
        owner=owners[f['parent']];ls=sorted(levels.get(x['pk'],()))
        if not ls:continue
        group='subclasses' if owner['parent'] else 'classes'
        row=groups[group].setdefault(owner['id'],{'id':owner['id'],'name':owner['name'],'parentId':owners.get(owner['parent'],{}).get('id') if owner['parent'] else None,'hitDie':owner['hitDie'],'savingThrows':owner['savingThrows'],'casterType':owner['casterType'],'features':[]})
        for level in ls:row['features'].append({'name':f['name'],'level':level,'summary':clean(f.get('desc')),'source':'SRD '+('5.2.1' if edition=='2024' else '5.1'),'license':'CC-BY-4.0'})
    for rows in groups.values():
        for row in rows.values():row['features'].sort(key=lambda x:(x['level'],x['name']))
    out['editions'][edition]=groups
target=ROOT/'js/modules/character-srd-class-data.js'
target.write_text("/* Generated structured class/subclass progression from pinned SRD data. CC-BY-4.0. */\nvar CharacterSrdClassData="+json.dumps(out,separators=(',',':'))+";\nif(typeof globalThis!=='undefined')globalThis.CharacterSrdClassData=CharacterSrdClassData;\nif(typeof module!=='undefined'&&module.exports)module.exports=CharacterSrdClassData;\n")
print(target)
for edition,data in out['editions'].items():print(edition,len(data['classes']),'classes',sum(len(x['features']) for x in data['classes'].values()),'class feature records',len(data['subclasses']),'subclasses')
