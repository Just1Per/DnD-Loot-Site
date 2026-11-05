#!/usr/bin/env python3
"""Build a pinned, prose-free 5etools metadata release for later catalogue import.

The committed source manifest is the only network input. Downloaded upstream JSON
stays in scripts/.source-cache; generated metadata is deterministic and contains
names, source pointers and structured numeric/category facts only.
"""
import argparse
import hashlib
import json
import pathlib
import re
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[1]
DEFAULT_MANIFEST = ROOT / 'data/rules/sources/5etools-v1.json'

def stable_id(kind, source, name):
    digest = hashlib.sha256((str(source).lower() + '\0' + str(name).lower()).encode()).hexdigest()[:20]
    return kind + '-' + re.sub(r'[^a-z0-9]+', '-', str(source).lower()).strip('-') + '-' + digest

def scalar(value, maximum=240):
    return value if isinstance(value, str) and len(value) <= maximum else ''

def number(value):
    return value if isinstance(value, (int, float)) and not isinstance(value, bool) else None

def flat_names(groups):
    values = []
    for group in groups if isinstance(groups, list) else []:
        if not isinstance(group, dict):
            continue
        for key, value in group.items():
            if value is True and isinstance(key, str):
                values.append(key)
    return sorted(set(values))

def edition(source, books):
    # Use the same published-date boundary as the existing spell/feat catalogue.
    # Unknown source IDs remain in the legacy family until the manifest is updated.
    published = books.get(source, {}).get('published', '')
    return '2024' if isinstance(published, str) and published >= '2024-09-17' else '2014'

def source_record(kind, row, books):
    name, source = scalar(row.get('name')), scalar(row.get('source'), 60)
    if not name or not source:
        return None
    result = {
        'id': stable_id(kind, source, name), 'name': name, 'source': source,
        'page': number(row.get('page')) or 0, 'edition': edition(source, books)
    }
    return result

def metadata(kind, row, books):
    out = source_record(kind, row, books)
    if not out:
        return None
    if kind == 'spell':
        out.update(level=number(row.get('level')) or 0, school=scalar(row.get('school'), 20),
                   ritual=bool((row.get('meta') or {}).get('ritual')), components=sorted(k for k in ('v', 's', 'm') if (row.get('components') or {}).get(k)),
                   savingThrows=sorted(x for x in row.get('savingThrow', []) if isinstance(x, str)),
                   damageTypes=sorted(x for x in row.get('damageInflict', []) if isinstance(x, str)))
    elif kind == 'feat':
        prerequisites = row.get('prerequisite') if isinstance(row.get('prerequisite'), list) else []
        levels = [p.get('level') for p in prerequisites if isinstance(p, dict) and isinstance(p.get('level'), int)]
        out.update(category=scalar(row.get('category'), 40), minimumLevel=max(levels, default=0),
                   requiresReview=bool(prerequisites), repeatable=bool(row.get('repeatable')))
    elif kind == 'background':
        out.update(skills=flat_names(row.get('skillProficiencies')), tools=flat_names(row.get('toolProficiencies')),
                   languages=flat_names(row.get('languageProficiencies')),
                   hasAbilityChoices=bool(row.get('ability')), hasStartingEquipment=bool(row.get('startingEquipment')))
    elif kind in {'item', 'baseItem'}:
        out.update(itemType=scalar(row.get('type'), 40), rarity=scalar(row.get('rarity'), 40),
                   weight=number(row.get('weight')), value=number(row.get('value')),
                   requiresAttunement=bool(row.get('reqAttune')))
    elif kind == 'species':
        sizes = row.get('size') if isinstance(row.get('size'), list) else []
        speed = row.get('speed')
        out.update(size=sorted(x for x in sizes if isinstance(x, str)), speed=speed if isinstance(speed, (int, float, dict)) else None,
                   hasHeightWeight=bool(row.get('heightAndWeight')))
    elif kind == 'class':
        hd = row.get('hd') if isinstance(row.get('hd'), dict) else {}
        out.update(hitDie=number(hd.get('faces')), spellcastingAbility=scalar((row.get('spellcastingAbility') or ''), 20))
    elif kind == 'subclass':
        out.update(className=scalar(row.get('className')), classSource=scalar(row.get('classSource'), 60), shortName=scalar(row.get('shortName')))
    return out

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--manifest', type=pathlib.Path, default=DEFAULT_MANIFEST)
    parser.add_argument('--cache', type=pathlib.Path, default=ROOT / 'scripts/.source-cache/5etools-v1')
    parser.add_argument('--output', type=pathlib.Path, default=ROOT / 'data/rules/5etools/metadata.json')
    parser.add_argument('--refresh', action='store_true', help='Refresh the pinned local cache before building.')
    args = parser.parse_args()
    config = json.loads(args.manifest.read_text())
    if config.get('format') != 1 or not re.fullmatch(r'[0-9a-f]{40}', config.get('revision', '')):
        raise ValueError('Unsupported 5etools source manifest')
    base = 'https://raw.githubusercontent.com/5etools-mirror-3/5etools-src/' + config['revision'] + '/data/'
    args.cache.mkdir(parents=True, exist_ok=True)
    source_hashes = {}

    def read(relative):
        target = args.cache / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        if args.refresh or not target.exists():
            with urllib.request.urlopen(base + relative, timeout=60) as response:
                target.write_bytes(response.read())
        raw = target.read_bytes()
        source_hashes[relative] = hashlib.sha256(raw).hexdigest()
        return json.loads(raw)

    domains = config['domains']
    books = {row.get('id'): row for row in read(domains['books']['path']).get(domains['books']['key'], []) if isinstance(row, dict) and isinstance(row.get('id'), str)}
    output = {key: [] for key in ('spells', 'feats', 'backgrounds', 'items', 'baseItems', 'species', 'classes', 'subclasses')}
    spell_index = read(domains['spells']['index'])
    if not isinstance(spell_index, dict):
        raise ValueError('Invalid spell index')
    for relative in sorted(set(spell_index.values())):
        for row in read(domains['spells']['directory'] + '/' + relative).get(domains['spells']['key'], []):
            record = metadata('spell', row, books)
            if record:
                output['spells'].append(record)
    for domain, kind, output_key in [
        ('feats', 'feat', 'feats'), ('backgrounds', 'background', 'backgrounds'),
        ('items', 'item', 'items'), ('baseItems', 'baseItem', 'baseItems'),
        ('species', 'species', 'species')
    ]:
        definition = domains[domain]
        for row in read(definition['path']).get(definition['key'], []):
            record = metadata(kind, row, books)
            if record:
                output[output_key].append(record)
    class_index = read(domains['classes']['index'])
    if not isinstance(class_index, dict):
        raise ValueError('Invalid class index')
    class_files = sorted(set(class_index.values()))
    for relative in class_files:
        document = read(domains['classes']['directory'] + '/' + relative)
        for domain, kind, output_key in [('classes', 'class', 'classes'), ('subclasses', 'subclass', 'subclasses')]:
            for row in document.get(domains[domain]['key'], []):
                record = metadata(kind, row, books)
                if record:
                    output[output_key].append(record)
    for rows in output.values():
        rows.sort(key=lambda row: (row['name'].lower(), row['source'], row['id']))
    try:
        manifest_name = str(args.manifest.relative_to(ROOT))
    except ValueError:
        manifest_name = str(args.manifest)
    release = {
        'format': 1, 'source': {'id': config['id'], 'repository': config['repository'], 'revision': config['revision'], 'manifest': manifest_name},
        'policy': config['licensePolicy'], 'sourceSha256': dict(sorted(source_hashes.items())), 'kinds': output
    }
    body = json.dumps(release, ensure_ascii=False, separators=(',', ':')) + '\n'
    release['release'] = hashlib.sha256(body.encode()).hexdigest()
    body = json.dumps(release, ensure_ascii=False, indent=2) + '\n'
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(body)
    print(json.dumps({'output': str(args.output), 'release': release['release'], 'counts': {key: len(value) for key, value in output.items()}}, indent=2))

if __name__ == '__main__':
    main()
