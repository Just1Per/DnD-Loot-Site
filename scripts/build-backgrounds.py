#!/usr/bin/env python3
"""Build factual PHB background metadata, excluding source prose."""
import json,pathlib,urllib.request,argparse,re
REV='b9061583536101068b3a59d27e886d1fa664e366'
root=pathlib.Path(__file__).resolve().parents[1]
p=argparse.ArgumentParser();p.add_argument('--cache',type=pathlib.Path,default=root/'scripts/.source-cache');args=p.parse_args();args.cache.mkdir(parents=True,exist_ok=True)
file=args.cache/'backgrounds.json'
if not file.exists(): file.write_bytes(urllib.request.urlopen(f'https://raw.githubusercontent.com/5etools-mirror-3/5etools-src/{REV}/data/backgrounds.json',timeout=60).read())
rows=json.loads(file.read_text())['background'];lookup={(r['name'],r['source']):r for r in rows};out={'modern':{},'legacy':{}}
skills={'sleight of hand':'sleightOfHand','animal handling':'animalHandling'}
features={'Acolyte':'Shelter of the Faithful','Charlatan':'False Identity','Criminal':'Criminal Contact','Entertainer':'By Popular Demand','Folk Hero':'Rustic Hospitality','Guild Artisan':'Guild Membership','Hermit':'Discovery','Noble':'Position of Privilege','Outlander':'Wanderer','Sage':'Researcher','Sailor':"Ship’s Passage",'Soldier':'Military Rank','Urchin':'City Secrets','Spy':'Spy Contact','Gladiator':'By Popular Demand','Guild Merchant':'Guild Membership','Knight':'Retainers','Retainers':'Retainers','Pirate':'Bad Reputation'}
for original in rows:
 if original['source'] not in ('PHB','XPHB') or original['name']=='Custom Background':continue
 row={**lookup[(original['_copy']['name'],original['_copy']['source'])],**original} if '_copy' in original else original
 edition='2024' if row['source']=='XPHB' else '2014';name=re.sub(r'^Variant .*? \((.*?)\)$',r'\1',row['name']);id=re.sub(r'[^a-z0-9]+','-',name.lower()).strip('-')+'-'+edition
 if name=='Acolyte' and edition=='2014':id='acolyte'
 d={'name':name,'edition':edition,'source':row['source'],'page':row['page'],'skills':[skills.get(k,k) for k,v in row.get('skillProficiencies',[{}])[0].items() if v is True],'fixedTools':[],'toolChoices':[],'languages':row.get('languageProficiencies',[{}])[0].get('anyStandard',0)}
 for k,v in row.get('toolProficiencies',[{}])[0].items():
  if v is True:d['fixedTools'].append(k)
  elif k in ['anyArtisansTool','anyGamingSet','anyMusicalInstrument']:d['toolChoices'].extend([k]*v)
  elif k=='choose':d['toolChoices'].append('merchant')
 if edition=='2024':
  d['abilities']=row['ability'][0]['choose']['weighted']['from']
  feat=next(iter(row['feats'][0])).split('|')[0].title().replace('Magic Initiate; ','Magic Initiate (');d['feat']=feat+')' if '(' in feat else feat
  d['tool']=d['fixedTools'][0] if d['fixedTools'] else 'Choose '+d['toolChoices'][0]
 else:d['feature']=features[name]
 out['modern' if edition=='2024' else 'legacy'][id]=d
text='/* Generated factual metadata; scripts/build-backgrounds.py. No source prose. */\nvar CharacterBackgroundData = '+json.dumps(out,ensure_ascii=False,indent=2)+';\nif(typeof module!==\'undefined\'&&module.exports)module.exports=CharacterBackgroundData;\n'
(root/'js/modules/character-background-data.js').write_text(text)
print({k:len(v) for k,v in out.items()})
