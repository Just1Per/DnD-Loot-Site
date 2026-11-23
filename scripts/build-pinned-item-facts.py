#!/usr/bin/env python3
"""Export bounded mechanical item facts, never source entries or expressions to execute."""
import json,pathlib,hashlib,copy
ROOT=pathlib.Path(__file__).resolve().parents[1];CACHE=ROOT/'scripts/.source-cache/5etools-v1'
def read(f):return json.loads((CACHE/f).read_text())
def edition(row):return '2024' if row.get('edition')=='one' or row.get('source') in ['XPHB','XDMG','EFA','RHW','FRHoF','LFL','AU'] else '2014'
def identity(row):return hashlib.sha256((row.get('source','')+'|'+row['name']).encode()).hexdigest()[:16]
keys=['rarity','name','source','spellBonusFamily','weight','value','charges','recharge','rechargeAmount','reqAttune','reqAttuneTags','attachedSpells','containerCapacity','bonusAc','bonusWeapon','bonusWeaponAttack','bonusWeaponDamage','bonusSpellAttack','bonusSpellSaveDc','bonusSavingThrow','bonusAbilityCheck','resist','immune','conditionImmune','baseItem','weaponCategory','dmg1','dmg2','dmgType','property','range','ac','armor','weapon','type','sword','axe','arrow','bolt','polearm','crossbow','spear','bow','net','scfType','bulletFirearm','cellEnergy']
# Resolve only exported facts. Entry/prose modifications are deliberately never loaded
# into the inheritance result. Unknown modifications to exported facts fail the build.
extra=['namePrefix','nameSuffix','nameRemove','requires','excludes','edition','propertyAdd']
allowed=set(keys+extra)
def project(row):
 result={k:copy.deepcopy(v) for k,v in row.items() if k in allowed}
 if isinstance(row.get('inherits'),dict):result['inherits']=project(row['inherits'])
 return result
def resolver(rows):
 index={(row['name'],row.get('source',row.get('inherits',{}).get('source',''))):row for row in rows};done={}
 def resolve(row,trail=()):
  key=(row['name'],row.get('source',row.get('inherits',{}).get('source','')))
  if key in trail:raise ValueError('Cyclic item inheritance: '+str(key))
  if key in done:return copy.deepcopy(done[key])
  own=project(row);parent=row.get('_copy')
  if not parent:result=own
  else:
   parent_key=(parent['name'],parent['source'])
   if parent_key not in index:raise ValueError('Missing item parent: '+str(parent_key))
   result=resolve(index[parent_key],trail+(key,))
   if result.get('bonusSpellAttack') or result.get('bonusSpellSaveDc'):result.setdefault('spellBonusFamily',result['name'])
   result.update(own)
   # Child source identity determines edition, even when a parent is legacy.
   if 'edition' not in own:result.pop('edition',None)
   for path,mods in parent.get('_mod',{}).items():
    parts=path.split('.')
    if any(part not in allowed|{'inherits'} for part in parts):continue
    target=result
    for part in parts[:-1]:target=target.setdefault(part,{})
    field=parts[-1]
    for mod in mods if isinstance(mods,list) else [mods]:
     if mod=='remove':target.pop(field,None)
     elif isinstance(mod,dict) and mod.get('mode')=='setProp':target[field]=copy.deepcopy(mod['value'])
     elif isinstance(mod,dict) and mod.get('mode') in ['appendArr','appendIfNotExistsArr']:
      values=mod['items'] if isinstance(mod['items'],list) else [mod['items']];target.setdefault(field,[])
      for value in values:
       if mod['mode']=='appendArr' or value not in target[field]:target[field].append(copy.deepcopy(value))
     else:raise ValueError('Unsupported mechanical item modification: '+str((key,path,mod)))
  done[key]=result;return copy.deepcopy(result)
 return resolve
raw_items=read('items.json')['item'];raw_bases=read('items-base.json')['baseitem'];resolve_item=resolver(raw_items+raw_bases)
items=[]
for raw in raw_items:
 row=resolve_item(raw)
 if not any(k in row for k in ['charges','recharge','reqAttune','containerCapacity','bonusAc','bonusWeapon','bonusSpellAttack','bonusSpellSaveDc','bonusSavingThrow','bonusAbilityCheck','resist','attachedSpells']):continue
 items.append({**{k:v for k,v in row.items() if k in keys and not(k=='reqAttune' and isinstance(v,str))},'reqAttune':bool(row.get('reqAttune')),'edition':edition(row)})
bases=[{**{k:v for k,v in row.items() if k in keys},'edition':edition(row),'id':identity(row)} for row in map(resolve_item,raw_bases)]
variants=[]
raw_variants=read('magicvariants.json')['magicvariant'];resolve_variant=resolver(raw_variants)
for raw in raw_variants:
 row=resolve_variant(raw);inherited=row.get('inherits');
 if not inherited:continue
 v={**{k:v for k,v in inherited.items() if k in keys+['namePrefix','nameSuffix','nameRemove','rarity']},'name':row['name'],'requires':row.get('requires',[]),'excludes':row.get('excludes',{}),'reqAttune':bool(inherited.get('reqAttune'))}
 # Requirement matching uses only factual scalar/list equality; no filters/expressions execute.
 v['edition']=edition({**row,**v});v['id']=identity(v);variants.append(v)
out={'revision':json.loads((ROOT/'data/rules/sources/5etools-v1.json').read_text())['revision'],'items':items,'bases':bases,'variants':variants,'hashes':{p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in [CACHE/'items.json',CACHE/'items-base.json',CACHE/'magicvariants.json']}}
text="'use strict';\n/* Generated structured item facts; scripts/build-pinned-item-facts.py. No source prose. */\nvar CharacterPinnedItemData="+json.dumps(out,separators=(',',':'),ensure_ascii=False)+";\nif(typeof module!=='undefined'&&module.exports)module.exports=CharacterPinnedItemData;\n";(ROOT/'js/modules/character-pinned-item-data.js').write_text(text);print(json.dumps({'items':len(items),'bases':len(bases),'variants':len(variants),'bytes':len(text)}))
