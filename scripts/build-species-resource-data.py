#!/usr/bin/env python3
"""Check authored resource facts against pinned feature identities; never export entries."""
import hashlib,json,pathlib
ROOT=pathlib.Path(__file__).resolve().parents[1]
source=ROOT/'scripts/.source-cache/5etools-v1/races.json'
raw=json.loads(source.read_text())
out=json.loads((ROOT/'scripts/species-resource-overrides.json').read_text())
bindings=json.loads((ROOT/'data/rules/species-source-bindings.json').read_text())
assert out['revision']==json.loads((ROOT/'data/rules/sources/5etools-v1.json').read_text())['revision']
def names(value):
    if isinstance(value,list):return set().union(*(names(item) for item in value)) if value else set()
    if not isinstance(value,dict):return set()
    return ({value['name']} if isinstance(value.get('name'),str) else set())|set().union(*(names(item) for item in value.values()))
for species,record in out['species'].items():
    binding=bindings[species]
    if record.get('featureOptions'):
        original=next(row for row in raw['race'] if row.get('name')==binding['name'] and row.get('source')==binding['source'])
        for option in record['featureOptions'].values():assert option['name'] in names(original),(species,option['name'])
    for resource in record['resources']:
        sub=resource.pop('subrace',False)
        kind='subrace' if sub else 'race'
        name=binding['subrace'] if sub else binding['name']
        book=binding['subSource'] if sub else binding['source']
        row=next(row for row in raw[kind] if row.get('name')==name and row.get('source')==book)
        assert any(isinstance(entry,dict) and entry.get('name')==resource['name'] for entry in row.get('entries',[])),(species,resource['name'])
        assert resource['uses']=='pb' or isinstance(resource['uses'],int) and 1<=resource['uses']<=10
        assert resource['resets'] in [['long'],['short','long']]
        resource['reference']={'name':name,'source':book,'feature':resource['name'],**({'page':row['page']} if 'page' in row else {})}
out['sourceSha256']=hashlib.sha256(source.read_bytes()).hexdigest()
text="'use strict';\n/* Generated numeric resource facts and authored instructions, never source entries. */\nvar CharacterSpeciesResourceData="+json.dumps(out,separators=(',',':'),ensure_ascii=False)+";\nif(typeof module!=='undefined'&&module.exports)module.exports=CharacterSpeciesResourceData;\n"
(ROOT/'js/modules/character-species-resource-data.js').write_text(text)
print(json.dumps({'species':len(out['species']),'resources':sum(len(row['resources']) for row in out['species'].values())}))
