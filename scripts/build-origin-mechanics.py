#!/usr/bin/env python3
"""Pinned structured origin facts only. Never emit source entries or executable code."""
import json,pathlib,re,hashlib
ROOT=pathlib.Path(__file__).resolve().parents[1]
CACHE=ROOT/'scripts/.source-cache'
norm=lambda s:re.sub(r'[^a-z0-9]','',s.lower())
rows=json.loads((CACHE/'backgrounds.json').read_text())['background']
lookup={(r['name'],r['source']):r for r in rows}
def resolve(row,seen=()):
 key=(row['name'],row['source'])
 if key in seen:raise ValueError('Cyclic background inheritance')
 if '_copy' not in row:return row
 parent=resolve(lookup[(row['_copy']['name'],row['_copy']['source'])],seen+(key,))
 return {**parent,**row}
def choices(groups):
 fixed=[];options=[]
 if not groups:return fixed,options
 # Alternatives are one choice among complete proficiency packages. Do not flatten packages.
 if len(groups)>1:
  if all(len(g)==1 and next(iter(g.values())) is True for g in groups):return [],[[next(iter(g)) for g in groups]]
  return None,None
 for k,v in groups[0].items():
  if v is True:fixed.append(k)
  elif k=='choose':options.extend([v['from']]*v.get('count',1))
  elif k in ['anyStandard','any','anyArtisansTool','anyMusicalInstrument','anyGamingSet']:options.extend([[k]]*v)
  else:return None,None
 return fixed,options
out={}
for original in rows:
 row=resolve(original);fact={'source':row['source'],'name':row['name'],'page':row.get('page',0)}
 # Export only the two reviewed starting-ability patterns, never source entries.
 ability=row.get('ability',[])
 if ability:
  weighted=[group.get('choose',{}).get('weighted',{}) for group in ability]
  if len(weighted)==2 and [group.get('weights') for group in weighted]==[[2,1],[1,1,1]] and weighted[0].get('from')==weighted[1].get('from') and len(set(weighted[0].get('from',[])))==3 and all(key in ['str','dex','con','int','wis','cha'] for key in weighted[0]['from']):
   fact['abilities']=weighted[0]['from']
  else:raise ValueError('Review background starting abilities: '+row['source']+' '+row['name'])
 for source,dest in [('toolProficiencies','tools'),('languageProficiencies','languages')]:
  fixed,options=choices(row.get(source))
  if fixed is not None:fact[dest]={'fixed':fixed,'choices':options}
 out[row['source'].lower()+'|'+norm(row['name'])]=fact
races=json.loads((CACHE/'5etools-v1/races.json').read_text());racefacts={}
for row in races['race']+races['subrace']:
 if not row.get('name'):continue
 fact={'name':row['name'],'source':row['source']}
 for k in ['additionalSpells','resist','conditionImmune','immune','darkvision','speed']:
  if k in row:fact[k]=row[k]
 racefacts[row['source'].lower()+'|'+norm(row['name'])]=fact
# Every exported race value above is a structured fact, never an entry/fluff tree.
optional=[]
for row in json.loads((CACHE/'5etools-v1/optionalfeatures.json').read_text())['optionalfeature']:
 if row['source'] in ['TCE','XGE'] and 'EI' in row['featureType']:
  prereq=row.get('prerequisite',[{}])[0];level=prereq.get('level',{});optional.append({'name':row['name'],'source':row['source'],'level':level.get('level',0) if isinstance(level,dict) else level,'pact':prereq.get('pact',''),'requiresSpell':'eldritch blast' if 'eldritch blast#c' in prereq.get('spell',[]) else '', 'requiresHex':any('hex/curse' in spell for spell in prereq.get('spell',[]))})
result={'invocations2014':optional,'revision':json.loads((ROOT/'data/rules/sources/5etools-v1.json').read_text())['revision'],'backgrounds':out,'races':racefacts}
text="'use strict';\n/* Generated pinned structured origin facts; scripts/build-origin-mechanics.py. No source prose. */\nvar CharacterOriginFacts="+json.dumps(result,ensure_ascii=False,separators=(',',':'))+";\nif(typeof module!=='undefined'&&module.exports)module.exports=CharacterOriginFacts;\n"
(ROOT/'js/modules/character-origin-facts.js').write_text(text)
print(json.dumps({'backgrounds':len(out),'races':len(racefacts),'bytes':len(text)}))
