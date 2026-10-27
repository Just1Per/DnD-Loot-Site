#!/usr/bin/env python3
"""Build component flags from pinned reference metadata; never ship material prose."""
import argparse
import concurrent.futures
import hashlib
import json
import pathlib
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[1]
p = argparse.ArgumentParser()
p.add_argument('--cache', type=pathlib.Path, default=ROOT / 'scripts/.source-cache')
args = p.parse_args()
args.cache.mkdir(parents=True, exist_ok=True)
catalog = json.loads((ROOT / 'data/rules/catalog.json').read_text())
revision = catalog['indexRevision']
base = f'https://raw.githubusercontent.com/5etools-mirror-3/5etools-src/{revision}/data/spells/'

def fetch(name):
    target = args.cache / name
    if not target.exists():
        with urllib.request.urlopen(base + name, timeout=45) as response:
            target.write_bytes(response.read())
    return json.loads(target.read_text())

index = fetch('index.json')
files = sorted({index[row['source']] for row in catalog['spells']})
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
    sources = list(pool.map(fetch, files))
raw = {}
for source in sources:
    for row in source.get('spell', []):
        identity = 'Spell-' + row['source'].lower() + '-' + hashlib.sha256(row['name'].lower().encode()).hexdigest()[:16]
        raw[identity] = row
flags = {}
for row in catalog['spells']:
    original = raw[row['id']]
    if original.get('_copy'):
        raise ValueError('Resolve inherited metadata explicitly: ' + row['id'])
    material = original.get('components', {}).get('m', False)
    expected = 'M' in [part.strip().upper() for part in row.get('components', '').split(',')]
    if bool(material) != expected:
        raise ValueError('Material flag does not match catalogue: ' + row['id'])
    if isinstance(material, dict):
        cost, consume = material.get('cost', 0), material.get('consume', False)
        if not isinstance(cost, (int, float)) or cost < 0 or consume not in (True, False, 'optional'):
            raise ValueError('Unsupported component metadata: ' + row['id'])
    else:
        cost, consume = 0, False
    flags[row['id']] = [bool(material), cost > 0, 'optional' if consume == 'optional' else bool(consume)]
result = {'revision': revision, 'spells': flags}
body = json.dumps(result, separators=(',', ':'))
(ROOT / 'js/modules/character-spell-component-data.js').write_text(
    '// Mechanical component flags only; no non-SRD material descriptions.\n'
    + 'var CharacterSpellComponentData=' + body + ';\n'
    + "if(typeof module!=='undefined'&&module.exports)module.exports=CharacterSpellComponentData;\n")
print(json.dumps({'spells': len(flags), 'material': sum(v[0] for v in flags.values()), 'costly': sum(v[1] for v in flags.values()), 'consumed': sum(v[2] is True for v in flags.values()), 'conditional': sum(v[2] == 'optional' for v in flags.values())}))
