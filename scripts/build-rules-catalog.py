#!/usr/bin/env python3
"""Reproducible catalogue. Non-SRD records deliberately contain metadata only."""
import argparse, concurrent.futures, hashlib, json, pathlib, re, urllib.request
ROOT = pathlib.Path(__file__).resolve().parents[1]
INDEX_REV = 'b9061583536101068b3a59d27e886d1fa664e366'
SRD_REV = '0acbf263c74caf8ad080af7a16d86d3700a1ac8f'
p = argparse.ArgumentParser(); p.add_argument('--cache', type=pathlib.Path, default=ROOT / 'scripts/.source-cache'); args = p.parse_args(); args.cache.mkdir(parents=True, exist_ok=True)
def fetch(name, url):
    path = args.cache / name
    if not path.exists():
        with urllib.request.urlopen(url, timeout=60) as r: path.write_bytes(r.read())
    return json.loads(path.read_text())
base = f'https://raw.githubusercontent.com/5etools-mirror-3/5etools-src/{INDEX_REV}/data/'
index = fetch('index.json', base+'spells/index.json')
books = {b['id']: b for b in fetch('books.json', base+'books.json')['book']}
lookup = fetch('gendata-spell-source-lookup.json', base+'generated/gendata-spell-source-lookup.json')
feats = fetch('feats.json', base+'feats.json')['feat']
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
    sources = list(pool.map(lambda f: fetch(f, base+'spells/'+f), index.values()))
srd = {}; benefits = {}
for edition in ('2014','2024'):
    for kind in ('Spell','Feat','FeatBenefit'):
        rows = fetch(f'{edition}-{kind}.json',f'https://raw.githubusercontent.com/open5e/open5e-api/{SRD_REV}/data/v2/wizards-of-the-coast/srd-{edition}/{kind}.json')
        if kind == 'FeatBenefit':
            for row in rows:
                f = row['fields']; benefits.setdefault(f['parent'], []).append((f.get('name','')+'\n'+f.get('desc','')).strip())
        else:
            for row in rows: srd[(edition,kind,row['fields']['name'].lower())] = row

def clean(v):
    if not isinstance(v,str): return ''
    return re.sub(r'\{@\w+ ([^}|]+)(?:\|[^}]+)?\}',r'\1',v)
def ed(source):
    return '2024' if books.get(source,{}).get('published','') >= '2024-09-17' or source in ('XPHB','XDMG') else '2014'
def identity(kind, source, name):
    return f'{kind}-{source.lower()}-'+hashlib.sha256(name.lower().encode()).hexdigest()[:16]
def basic(row, kind):
    source=row['source']; edition=ed(source); name=row['name']
    out={'id':identity(kind,source,name),'name':name,'edition':edition,'source':source,'book':books.get(source,{}).get('name',source),'page':row.get('page',0)}
    flag=row.get('srd52') if edition=='2024' else row.get('srd')
    licensed=srd.get((edition,kind, (flag if isinstance(flag,str) else name).lower())) if flag else None
    out['licensedText']=bool(licensed)
    if licensed:
        f=licensed['fields']; out['description']=clean(f.get('desc',''))
        if kind=='Feat': out['description']+='\n\n'+'\n\n'.join(clean(x) for x in benefits.get(licensed['pk'],[]))
        if kind=='Spell':
            out['combat']={'damage':('1d8' if name=='Spiritual Weapon' else f.get('damage_roll','')),'attack':bool(f.get('attack_roll')),'addAbility':name=='Spiritual Weapon'}
            inc=re.search(r'damage increases by (\d+d\d+) for (?:each|every) (?:spell )?slot level',f.get('higher_level',''),re.I)
            if inc:out['combat']['upcast']=inc[1]
            if name=='Spiritual Weapon' and edition=='2014':out['combat'].update(upcast='1d8',step=2)
        if kind=='Spell' and f.get('higher_level'): out['description']+='\n\nAt higher levels: '+clean(f['higher_level'])
        out['license']='CC-BY-4.0 / SRD '+('5.2.1' if edition=='2024' else '5.1')
    return out
schools={'A':'Abjuration','C':'Conjuration','D':'Divination','E':'Enchantment','V':'Evocation','I':'Illusion','N':'Necromancy','T':'Transmutation'}
spells=[]
for source in sources:
    for row in source.get('spell',[]):
        if row.get('_copy'): raise ValueError('Resolve inherited spell metadata explicitly: '+row['name'])
        out=basic(row,'Spell'); source=row['source']; cl=lookup.get(source.lower(),{}).get(row['name'].lower(),{}).get('class',{})
        by={'2014':set(),'2024':set()}
        for book, names in cl.items(): by[ed(book)].update(n.lower() for n in names)
        out.update(level=row['level'],school=schools.get(row['school'],row['school']),classesByEdition={k:sorted(v) for k,v in by.items()})
        out['classes']=sorted(by['2014']|by['2024'])
        out['casting']='; '.join(str(t.get('number',1))+' '+t.get('unit','')+(' — '+clean(t['condition']) if t.get('condition') else '') for t in row.get('time',[]))
        distance=row.get('range',{}).get('distance',{}); out['range']=' '.join(str(x) for x in (distance.get('amount',''),distance.get('type',row.get('range',{}).get('type',''))) if x!='')
        out['duration']='; '.join(('Concentration, ' if d.get('concentration') else '')+ (' '.join(str(d['duration'].get(k,'')) for k in ('amount','type')) if 'duration' in d else d.get('type','')) for d in row.get('duration',[]))
        # Only component flags, never non-SRD prose material descriptions.
        out['components']=', '.join(k.upper() for k in ('v','s','m') if row.get('components',{}).get(k))
        combat=out.setdefault('combat',{});combat['attack']=bool(row.get('spellAttack')) or combat.get('attack',False);combat['types']=row.get('damageInflict',[])
        scale=row.get('scalingLevelDice')
        if isinstance(scale,dict) and row.get('damageInflict') and (row.get('spellAttack') or row.get('savingThrow')):combat['scaling']=scale.get('scaling',{})
        out['save']=', '.join(v.upper() for v in row.get('savingThrow',[]))
        out['ritual']=bool(row.get('meta',{}).get('ritual')); spells.append(out)
featrows=[]
for row in feats:
    if row.get('source','').startswith(('UA','PS')): continue
    if row.get('_copy'): continue
    out=basic(row,'Feat'); out['category']=row.get('category','General / special'); out['minimumLevel']=max([int(x['level']) for x in row.get('prerequisite',[]) if isinstance(x.get('level'),int)] or [0])
    # Requirements need DM review: don't infer arbitrary custom prose prerequisites.
    out['requiresReview']=bool(row.get('prerequisite')); featrows.append(out)
for f in featrows:
    if f['source']=='PHB' and f['name']=='Grappler':
        f['description']='You have advantage on attack rolls against a creature you are grappling.\n\nYou can use your action to try to pin a creature grappled by you. To do so, make another grapple check. If you succeed, you and the creature are both restrained until the grapple ends.'
spells.sort(key=lambda x:(x['name'],x['edition'],x['source'])); featrows.sort(key=lambda x:(x['name'],x['edition'],x['source']))
catalog={'format':1,'metadataVersion':3,'indexRevision':INDEX_REV,'srdRevision':SRD_REV,'spells':spells,'feats':featrows}
body=json.dumps(catalog,ensure_ascii=False,separators=(',',':'))+'\n'
(ROOT/'data/rules/catalog.json').write_text(body)
manifest={'format':1,'metadataVersion':3,'release':hashlib.sha256(body.encode()).hexdigest(),'spells':len(spells),'feats':len(featrows),'spellSources':index,'counts':{edn:{'spells':sum(s['edition']==edn for s in spells),'feats':sum(f['edition']==edn for f in featrows),'fullSpellTexts':sum(s['edition']==edn and s['licensedText'] for s in spells)} for edn in ('2014','2024')}}
(ROOT/'data/rules/manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print(json.dumps(manifest,indent=2))
# Mechanical facts only; no arbitrary entry text or executable expressions.
mechanics={}
for row in feats:
    key=identity('Feat',row['source'],row['name'])
    if not any(f['id']==key for f in featrows): continue
    ability=[]
    for a in row.get('ability',[]):
        option={k:a[k] for k in ('str','dex','con','int','wis','cha') if k in a}
        option['max']=a.get('max',20)
        if 'choose' in a:
            c=a['choose'];option['choose']={k:c[k] for k in ('from','amount','count') if k in c}
        ability.append(option)
    requirements=[]
    for r in row.get('prerequisite',[]):
        requirements.append({'level':r.get('level',0) if isinstance(r.get('level',0),int) else 0,'ability':r.get('ability',[]),'manual':bool(set(r)-{'level','ability'}) or ('level' in r and not isinstance(r['level'],int))})
    mechanics[key]={'name':row['name'],'source':row['source'],'edition':ed(row['source']),'ability':ability,'requirements':requirements,'repeatable':bool(row.get('repeatable'))}
    if row.get('armorProficiencies'): mechanics[key]['armorTraining']=[a for group in row['armorProficiencies'] for a,v in group.items() if v is True and a in ('light','medium','heavy','shield')]
    if row['source']=='XPHB' and row['name']=='Crafter': mechanics[key]['toolChoices']=row['toolProficiencies'][0]['choose']['from']
for f in featrows:
    if f['source']=='PHB' and f['name']=='Grappler': mechanics[f['id']]['descriptionOverride']=f['description']
js='/* Generated numeric feat facts; see scripts/build-rules-catalog.py and rules-attribution.html. */\nvar CharacterFeatData = '+json.dumps(mechanics,ensure_ascii=False,separators=(',',':'))+';\nif(typeof module!=="undefined" && module.exports) module.exports=CharacterFeatData;\n'
(ROOT/'js/modules/character-feat-data.js').write_text(js)

# Concise feat browsing reference. This intentionally stores feature headings and
# structured facts, not arbitrary non-SRD source-book prose.
def feat_feature_names(value, out=None):
    out=[] if out is None else out
    if isinstance(value,list):
        for x in value: feat_feature_names(x,out)
    elif isinstance(value,dict):
        name=value.get('name')
        if isinstance(name,str) and len(name)<100 and name not in out: out.append(name)
        for k,x in value.items():
            if k!='name': feat_feature_names(x,out)
    return out

def proficiency_names(groups):
    out=[]
    for group in groups or []:
        for key,value in group.items():
            if value is True: out.append(re.sub(r'([A-Z])',r' \1',key).strip().title())
    return list(dict.fromkeys(out))

def feat_reference(row):
    names=[n for n in feat_feature_names(row.get('entries',[])) if n!=row['name']][:8]
    facts=[]
    ability=[]
    for option in row.get('ability',[]):
        fixed=[k.upper()+' +'+str(option[k]) for k in ('str','dex','con','int','wis','cha') if k in option]
        if fixed: ability.append(', '.join(fixed))
        choose=option.get('choose',{})
        if choose.get('from'):
            amount=choose.get('amount',1);count=choose.get('count',1)
            ability.append((str(count)+' choices from ' if count>1 else '')+'/'.join(x.upper() for x in choose['from'])+' +'+str(amount))
    if ability: facts.append('Ability increase: '+' or '.join(dict.fromkeys(ability)))
    armor=proficiency_names(row.get('armorProficiencies'));weapons=proficiency_names(row.get('weaponProficiencies'));skills=proficiency_names(row.get('skillProficiencies'));expertise=proficiency_names(row.get('expertise'))
    if armor: facts.append('Armor training: '+', '.join(armor))
    if weapons: facts.append('Weapon training: '+', '.join(weapons))
    if skills: facts.append('Skill proficiency: '+', '.join(skills))
    if expertise: facts.append('Expertise: '+', '.join(expertise))
    if row.get('toolProficiencies'): facts.append('Grants or lets you choose tool proficiency')
    if row.get('languageProficiencies'): facts.append('Grants or lets you choose language proficiency')
    if row.get('additionalSpells'): facts.append('Grants spellcasting options')
    if row.get('repeatable'): facts.append('Repeatable')
    requirements=[]
    for req in row.get('prerequisite',[]):
        if isinstance(req.get('level'),int): requirements.append('Level '+str(req['level'])+'+')
        if req.get('ability'): requirements.append('Ability prerequisite')
        if req.get('race'): requirements.append('Species prerequisite')
        if req.get('class'): requirements.append('Class prerequisite')
        if req.get('proficiency'): requirements.append('Proficiency prerequisite')
        if req.get('spellcasting') or req.get('spellcasting2020'): requirements.append('Spellcasting prerequisite')
        if req.get('campaign'): requirements.append('Campaign-specific prerequisite')
    text=' '.join([row['name'],*names,*facts]).lower()
    tags=[]
    def tag(value):
        if value not in tags: tags.append(value)
    if ability: tag('ability')
    if armor or re.search(r'\b(armor|shield)\b',text): tag('armor')
    if row.get('additionalSpells') or re.search(r'\b(spell|magic|cantrip|ritual|caster)\b',text): tag('spells')
    if skills or expertise or row.get('toolProficiencies') or row.get('languageProficiencies') or re.search(r'\b(skill|expertise|proficiency|tool|language)\b',text): tag('skills')
    if re.search(r'\b(speed|move|movement|teleport|flight|fly|climb|jump|dash|step)\b',text): tag('movement')
    if re.search(r'\b(hp|health|healing|defense|defence|armor|shield|resistance|ward|durable|tough|survivor|fortitude)\b',text): tag('defense')
    if str(row.get('category','')).lower().startswith('fs') or re.search(r'\b(weapon|attack|strike|combat|duel|archer|crossbow|grappl|crusher|piercer|slasher|damage)\b',text): tag('combat')
    if not tags: tag('other')
    summary=' · '.join(facts)
    if names: summary+=((' · ' if summary else '')+'Features: '+', '.join(names))
    if not summary: summary='Source features: '+row['name']
    if row['name']=='Survivor' and row['source']=='RHW':
        summary='Reroll Initiative; gain a bonus when trying to recover from a failed save against being Charmed or Frightened. Features: Hypervigilance, Steel Yourself.'
    return {'page':row.get('page',0),'category':row.get('category',''),'features':names,'facts':facts,'requirements':list(dict.fromkeys(requirements)),'tags':tags,'summary':summary}

reference={'format':1,'sourceRevision':INDEX_REV,'records':{}}
for row in feats:
    if row.get('source','').startswith(('UA','PS')): continue
    reference['records'][row['source']+'|'+row['name']]=feat_reference(row)
refjs='/* Generated concise feat reference metadata. Feature names and structured facts only; non-SRD source prose is not copied. */\nvar CharacterFeatReference='+json.dumps(reference,ensure_ascii=False,separators=(',',':'))+';\nif(typeof globalThis!=="undefined")globalThis.CharacterFeatReference=CharacterFeatReference;\nif(typeof module!=="undefined"&&module.exports)module.exports=CharacterFeatReference;\n'
(ROOT/'js/modules/character-feat-reference.js').write_text(refjs)
print('Feat ability increase definitions:',sum(bool(m['ability']) for m in mechanics.values()))
