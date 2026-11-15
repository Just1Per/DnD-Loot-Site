#!/usr/bin/env python3
"""Export bounded mechanical item facts, never source entries or expressions to execute."""
import json,pathlib,hashlib
ROOT=pathlib.Path(__file__).resolve().parents[1];CACHE=ROOT/'scripts/.source-cache/5etools-v1'
def read(f):return json.loads((CACHE/f).read_text())
def edition(row):return '2024' if row.get('edition')=='one' or row.get('source') in ['XPHB','XDMG','EFA','RHW','FRHoF','LFL'] else '2014'
def identity(row):return hashlib.sha256((row.get('source','')+'|'+row['name']).encode()).hexdigest()[:16]
keys=['rarity','name','source','weight','value','charges','recharge','rechargeAmount','reqAttune','attachedSpells','containerCapacity','bonusAc','bonusWeapon','bonusWeaponAttack','bonusWeaponDamage','bonusSpellAttack','resist','immune','conditionImmune','baseItem','weaponCategory','dmg1','dmg2','dmgType','property','range','ac','armor','weapon','type','sword','axe','arrow','bolt','polearm','crossbow','spear','bow','net','scfType','bulletFirearm','cellEnergy']
items=[]
for row in read('items.json')['item']:
 if '_copy' in row:continue
 if not any(k in row for k in ['charges','recharge','reqAttune','containerCapacity','bonusAc','bonusWeapon','bonusSpellAttack','resist','attachedSpells']):continue
 items.append({**{k:v for k,v in row.items() if k in keys and not(k=='reqAttune' and isinstance(v,str))},'reqAttune':bool(row.get('reqAttune')),'edition':edition(row)})
bases=[{**{k:v for k,v in row.items() if k in keys},'edition':edition(row),'id':identity(row)} for row in read('items-base.json')['baseitem'] if '_copy' not in row]
variants=[]
for row in read('magicvariants.json')['magicvariant']:
 inherited=row.get('inherits');
 if not inherited or '_copy' in row:continue
 v={**{k:v for k,v in inherited.items() if k in keys+['namePrefix','nameSuffix','nameRemove','rarity']},'name':row['name'],'requires':row.get('requires',[]),'excludes':row.get('excludes',{}),'reqAttune':bool(inherited.get('reqAttune'))}
 # Requirement matching uses only factual scalar/list equality; no filters/expressions execute.
 v['edition']=edition(v);v['id']=identity(v);variants.append(v)
out={'revision':json.loads((ROOT/'data/rules/sources/5etools-v1.json').read_text())['revision'],'items':items,'bases':bases,'variants':variants,'hashes':{p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in [CACHE/'items.json',CACHE/'items-base.json',CACHE/'magicvariants.json']}}
text="'use strict';\n/* Generated structured item facts; scripts/build-pinned-item-facts.py. No source prose. */\nvar CharacterPinnedItemData="+json.dumps(out,separators=(',',':'),ensure_ascii=False)+";\nif(typeof module!=='undefined'&&module.exports)module.exports=CharacterPinnedItemData;\n";(ROOT/'js/modules/character-pinned-item-data.js').write_text(text);print(json.dumps({'items':len(items),'bases':len(bases),'variants':len(variants),'bytes':len(text)}))
