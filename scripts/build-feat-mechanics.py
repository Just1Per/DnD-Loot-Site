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
rows={}
for feat in json.loads(source.read_text())['feat']:
 facts={k:feat[k] for k in fields if k in feat};packages=feat.get('additionalSpells',[])
 # Alternative packages and school/list choices remain explicit, never unioned.
 if len(packages)==1 and 'ability' in packages[0] and feat['name']!='Magic Initiate':
  package=packages[0];spells=[];choices=[]
  for mode in ['known','prepared','innate']:
   for gate,group in package.get(mode,{}).items():
    if gate!='_' and not gate.isdigit():continue
    unlock=1 if gate=='_' else int(gate)
    if isinstance(group,list):
     for spell in group:
      if isinstance(spell,str) and spell.endswith('#c'):spells.append({'ref':spell,'unlock':unlock,'usage':'At will'})
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
      if count=='1e' or count=='1' and (len(names)==1 or feat['source']=='EFA' and feat['name'] in ['Mark of Hospitality','Mark of Warding']):
       for spell in names:
        if isinstance(spell,str):spells.append({'ref':spell,'unlock':unlock,'usage':'Once per Long Rest','max':1})
        elif spell_choice(spell) and (count=='1e' or spell_choice(spell)['count']==1):choices.append({'pool':spell_choice(spell),'unlock':unlock,'usage':'Once per Long Rest','max':1})
     for count,names in group.get('rest',{}).items():
      if count=='1' and len(names)==1 and spell_choice(names[0]):choices.append({'pool':spell_choice(names[0]),'unlock':unlock,'usage':'Once per Short or Long Rest','max':1,'resets':['short','long']})
  if spells or choices:
   for spell in spells+choices:
    if spell.get('max') and 'resets' not in spell:spell['resets']=['short','long'] if feat['source']=='XGE' and feat['name']=='Fey Teleportation' else ['long']
   facts['spells']={'ability':package['ability'],'grants':spells,'choices':choices}
 if facts:rows[feat['source']+'|'+feat['name']]=facts
result={'revision':json.loads((ROOT/'data/rules/sources/5etools-v1.json').read_text())['revision'],'sha256':hashlib.sha256(source.read_bytes()).hexdigest(),'records':rows}
text="'use strict';\n/* Generated structured feat facts: scripts/build-feat-mechanics.py. No source prose. */\nvar CharacterFeatMechanicsData="+json.dumps(result,separators=(',',':'),ensure_ascii=False)+";\nif(typeof module!=='undefined'&&module.exports)module.exports=CharacterFeatMechanicsData;\n"
(ROOT/'js/modules/character-feat-mechanics-data.js').write_text(text)
print(json.dumps({'feats':len(rows),'bytes':len(text)}))
