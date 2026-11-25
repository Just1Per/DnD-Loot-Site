#!/usr/bin/env python3
"""Export pinned numeric mascot facts and authored compact instructions, never rule entries."""
import hashlib,json,re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
source=ROOT/'scripts/.source-cache/5etools-v1/bestiary/bestiary-scc.json'
review=json.loads((ROOT/'scripts/mascot-mechanics.json').read_text())
sizes={'T':'Tiny','S':'Small','M':'Medium','L':'Large','H':'Huge','G':'Gargantuan'}
rows=[]
for row in json.loads(source.read_text())['monster']:
 if row['name'] not in review:continue
 r=review[row['name']];hd=re.match(r'(\d+)d(\d+)',row['hp']['formula']);speed=[]
 for mode in ['walk','fly','swim','climb','burrow']:
  value=row.get('speed',{}).get(mode)
  if value is not None:speed.append(('' if mode=='walk' else mode+' ')+str(value['number'] if isinstance(value,dict) else value)+' ft'+(' (hover)' if mode=='fly' and row['speed'].get('canHover') else ''))
 attacks=r['attacks']
 assert all(a['n'] in [action['name'] for action in row.get('action',[])] for a in attacks)
 rows.append({'id':re.sub(r'[^a-z0-9]+','-',row['name'].lower())+'-scc','name':row['name'],'source':'SCC','edition':'2014','mascotCollege':r['college'],'size':sizes[row['size'][0]],'type':row['type'].capitalize(),'ac':row['ac'][0]['ac'] if isinstance(row['ac'][0],dict) else row['ac'][0],'hp':row['hp']['average'],'hd':[int(hd[1]),int(hd[2])],'speed':', '.join(speed),'scores':[row[a] for a in ['str','dex','con','int','wis','cha']],'pb':2,'cr':row['cr'],'senses':'; '.join(row.get('senses',[])),'res':', '.join(row.get('resist',[])),'imm':', '.join(row.get('immune',[])),'cimm':', '.join(row.get('conditionImmune',[])),'attacks':attacks,'traits':[t['name'] for t in r['traits']],'actions':[f['name'] for f in r['features']],'alignment':'Any' if row['alignment']==['A'] else 'Unaligned' if row['alignment']==['U'] else 'Typically Neutral','languages':'Languages from its former life; record them.' if r['college']=='Lorehold' else '' if r['college']=='Witherbloom' else 'Understands creator languages; cannot speak.','vulnerabilities':'','saveTotals':[None]*6,'skillTotals':{key:int(value) for key,value in row.get('skill',{}).items()},'traitDetails':r['traits'],'featureDetails':r['features'],'attacksAction':1})
assert len(rows)==len(review)==5
result={'revision':json.loads((ROOT/'data/rules/sources/5etools-v1.json').read_text())['revision'],'sha256':hashlib.sha256(source.read_bytes()).hexdigest(),'rows':rows}
(ROOT/'js/modules/character-mascot-data.js').write_text("'use strict';\n/* Pinned numerical facts and authored summaries. scripts/build-strixhaven-mascots.py; no source entries. */\nvar CharacterMascotData="+json.dumps(result,separators=(',',':'),ensure_ascii=False)+";\nif(typeof CharacterCreatureData!=='undefined')CharacterCreatureData.addSupplement(CharacterMascotData.rows);\nif(typeof module!=='undefined'&&module.exports)module.exports=CharacterMascotData;\n")
print('Exported five source-backed college mascots.')
