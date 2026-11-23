#!/usr/bin/env python3
"""Export structured feat defense/sense facts, without rule prose or executable expressions."""
import hashlib,json,pathlib
ROOT=pathlib.Path(__file__).resolve().parents[1]
source=ROOT/'scripts/.source-cache/5etools-v1/feats.json'
fields=['resist','immune','conditionImmune','senses','bonusSenses','skillProficiencies','toolProficiencies','languageProficiencies','expertise']
def spell_choice(value):
 if not isinstance(value,dict) or 'choose' not in value:return None
 choose=value['choose'];count=value.get('count',1)
 if isinstance(choose,dict):return {'names':choose['from'],'count':choose.get('count',1)} if 'from' in choose else None
 if not isinstance(choose,str):return None
 facts={'count':count}
 for clause in choose.split('|'):
  key,values=clause.split('=',1);values=values.lower().split(';')
  if key=='level' and all(v.isdigit() for v in values):facts['levels']=[int(v) for v in values]
  elif key=='class':facts['classes']=values
  elif key=='school':facts['schools']=values
  elif key=='components & miscellaneous' and values==['ritual']:facts['ritual']=True
  elif key=='spell attack' and all(v in ['m','r','o'] for v in values):facts['attack']=True
  else:raise ValueError('Unsupported spell choice: '+choose)
 return facts
def export_package(feat,package):
  spells=[];choices=[]
  for mode in ['known','prepared','innate']:
   for gate,group in package.get(mode,{}).items():
    if gate!='_' and not gate.isdigit():continue
    unlock=1 if gate=='_' else int(gate)
    if isinstance(group,list):
     for spell in group:
      if isinstance(spell,str) and (spell.endswith('#c') or mode=='prepared'):spells.append({'ref':spell,'unlock':unlock,'usage':'At will' if spell.endswith('#c') else 'Always prepared; use a spell slot or an eligible ritual casting'})
      elif isinstance(spell,dict):
       pool=spell_choice(spell)
       if pool and pool.get('levels')==[0]:choices.append({'pool':pool,'unlock':unlock,'usage':'At will'})
    elif isinstance(group,dict):
     for spell in group.get('will',[]):
      if isinstance(spell,str):spells.append({'ref':spell,'unlock':unlock,'usage':'At will'})
      elif spell_choice(spell):choices.append({'pool':spell_choice(spell),'unlock':unlock,'usage':'At will'})
     daily=group.get('daily',{})
     for count,names in daily.items():
      # `1e` means independent uses; a one-name numeric group is also unambiguous.
      if count=='1e' or count=='1' and (len(names)==1 or feat['source']=='EFA' and feat['name'] in ['Mark of Hospitality','Mark of Warding','Mark of Handling']):
       for spell in names:
        if isinstance(spell,str):spells.append({'ref':spell,'unlock':unlock,'usage':'Once per Long Rest','max':1})
        elif spell_choice(spell) and (count=='1e' or spell_choice(spell)['count']==1):choices.append({'pool':spell_choice(spell),'unlock':unlock,'usage':'Once per Long Rest','max':1})
     for count,names in group.get('rest',{}).items():
      if count=='1' and len(names)==1 and spell_choice(names[0]):choices.append({'pool':spell_choice(names[0]),'unlock':unlock,'usage':'Once per Short or Long Rest','max':1,'resets':['short','long']})
  if spells or choices:
   for spell in spells+choices:
    if spell.get('max') and 'resets' not in spell:spell['resets']=['short','long'] if feat['source']=='XGE' and feat['name']=='Fey Teleportation' else ['long']
   return {'ability':package['ability'],'grants':spells,'choices':choices}
  return None
rows={}
package_features={('EFA','Boon of Siberys'),('FRHoF','Cold Caster'),('ABH','Light Bringer'),('DSotDQ','Divinely Favored'),('DSotDQ','Initiate of High Sorcery'),('AU','Magic Connoisseur'),('SatO','Scion of the Outer Planes'),('PHB','Spell Sniper'),('SCC','Strixhaven Initiate')}
plane_resistances={'Chaotic Outer Plane':'poison','Evil Outer Plane':'necrotic','Good Outer Plane':'radiant','Lawful Outer Plane':'force','The Outlands':'psychic'}
for feat in json.loads(source.read_text())['feat']:
 facts={k:feat[k] for k in fields if k in feat};packages=feat.get('additionalSpells',[]);identity=(feat['source'],feat['name'])
 if len(packages)==1 and 'ability' in packages[0] and feat['name']!='Magic Initiate':
  exported=export_package(feat,packages[0])
  if exported:facts['spells']=exported
 elif len(packages)>1 and identity in package_features:
  exported=[]
  for index,package in enumerate(packages):
   selected=dict(package)
   if identity in [('FRHoF','Cold Caster'),('ABH','Light Bringer')]:selected['ability']='inherit'
   if identity==('AU','Magic Connoisseur'):selected['ability']='magic-initiate'
   row=export_package(feat,selected)
   if not row:raise ValueError('Empty reviewed feat spell package: '+str(identity))
   row['name']=package.get('name') or ('Ray of Frost' if index==0 else 'Wizard cantrip')
   if identity in [('FRHoF','Cold Caster'),('ABH','Light Bringer')] and index==1:row['requiresKnownCantrip']='ray of frost' if feat['name']=='Cold Caster' else 'light'
   if identity==('SatO','Scion of the Outer Planes'):row['resistance']=plane_resistances[row['name']]
   if identity==('AU','Magic Connoisseur'):row['magicInitiateClass']=row['choices'][0]['pool']['classes'][0]
   if identity==('EFA','Boon of Siberys'):
    for spell in row['grants']+row['choices']:
     if spell.get('max'):spell['resets']=['short','long'];spell['usage']='Once per Short or Long Rest'
    if row['choices']:row['choices'][0]['pool']['levels']=list(range(9))
   exported.append(row)
  facts['spellPackages']=exported
 if len(packages)==1 and packages[0].get('expanded'):
  facts['expandedSpells']=[{'slotLevel':int(gate[1:]),'spells':names} for gate,names in packages[0]['expanded'].items() if gate.startswith('s') and gate[1:].isdigit() and isinstance(names,list) and all(isinstance(name,str) for name in names)]
 if facts:rows[feat['source']+'|'+feat['name']]=facts
result={'revision':json.loads((ROOT/'data/rules/sources/5etools-v1.json').read_text())['revision'],'sha256':hashlib.sha256(source.read_bytes()).hexdigest(),'records':rows}
text="'use strict';\n/* Generated structured feat facts: scripts/build-feat-mechanics.py. No source prose. */\nvar CharacterFeatMechanicsData="+json.dumps(result,separators=(',',':'),ensure_ascii=False)+";\nif(typeof module!=='undefined'&&module.exports)module.exports=CharacterFeatMechanicsData;\n"
(ROOT/'js/modules/character-feat-mechanics-data.js').write_text(text)
print(json.dumps({'feats':len(rows),'bytes':len(text)}))
