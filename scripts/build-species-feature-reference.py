#!/usr/bin/env python3
"""Build names/metadata plus original summaries; never emit pinned source entries."""
import argparse
import copy
import json
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parents[1]
CACHE = ROOT / 'scripts/.source-cache/5etools-v1/races.json'
raw = json.loads(CACHE.read_text())
races = {(r['name'], r['source']): r for r in raw['race']}
subs = {(r.get('name', ''), r.get('source'), r.get('raceName'), r.get('raceSource')): r for r in raw['subrace']}


def resolve(row, seen=()):
    key = (row['name'], row['source'])
    if key in seen:
        raise ValueError('Cyclic race inheritance: ' + str(key))
    if '_copy' not in row:
        return copy.deepcopy(row)
    parent = resolve(races[(row['_copy']['name'], row['_copy']['source'])], seen + (key,))
    out = {**parent, **copy.deepcopy(row)}
    entries = copy.deepcopy(parent.get('entries', []))
    for field, operations in row['_copy'].get('_mod', {}).items():
        if field != 'entries':
            continue
        for op in operations if isinstance(operations, list) else [operations]:
            items = copy.deepcopy(op.get('items', []))
            items = items if isinstance(items, list) else [items]
            if op['mode'] == 'replaceArr':
                indices = [i for i, e in enumerate(entries) if isinstance(e, dict) and e.get('name') == op['replace']]
                if len(indices) != 1:
                    raise ValueError('Unresolved entry replacement ' + str(key) + ' ' + str(op['replace']))
                i = indices[0]
                entries[i:i + 1] = items
            elif op['mode'] == 'appendArr':
                entries.extend(items)
            elif op['mode'] == 'prependArr':
                entries = items + entries
            elif op['mode'] == 'removeArr':
                entries = [e for e in entries if not isinstance(e, dict) or e.get('name') not in op.get('names', [op.get('name')])]
            elif op['mode'] == 'insertArr':
                i = op.get('index', 0)
                entries[i:i] = items
            else:
                raise ValueError('Review entry modifier ' + str(key) + ' ' + op['mode'])
    out['entries'] = copy.deepcopy(row.get('entries', entries))
    return out


SKIP = {'age', 'alignment', 'size', 'speed', 'languages', 'creaturetype', 'abilityscoreincrease', 'abilityscoreincreases', 'abilityscores'}
EXTRAS = {
    'human': ['Versatile Ability Scores', 'Extra Language'],
    'half-elf': ['Ability Choices'],
    'hill-dwarf': ['Dwarven Speed'],
    'mountain-dwarf': ['Dwarven Speed'],
    'verdan': ['Growth'],
}


def source_record(binding):
    base = resolve(races[(binding['name'], binding['source'])])
    entries = base.get('entries', [])
    sources = [{'name': base['name'], 'source': base['source'], 'page': base.get('page', 0)}]
    facts = {k: base[k] for k in ['darkvision', 'creatureTypes', 'creatureTypeTags'] if k in base}
    if binding.get('subrace') is not None:
        sub = subs[(binding['subrace'], binding.get('subSource', binding['source']), binding['name'], binding['source'])]
        facts.update({k: sub[k] for k in facts.keys() | {'darkvision'} if k in sub})
        for e in sub.get('entries', []):
            target = e.get('data', {}).get('overwrite') if isinstance(e, dict) else None
            if target:
                entries = [x for x in entries if not isinstance(x, dict) or x.get('name') != target]
            entries.append(e)
        sources.append({'name': sub['name'], 'source': sub['source'], 'page': sub.get('page', 0)})
    headings = []

    def visit(e, top=False):
        if not isinstance(e, dict):
            return
        name = e.get('name')
        # Item-style options belong to their parent's explanation. RHW nests the
        # independent spell grant Hex Magic inside Eerie Token's option list.
        if (top or e.get('type') == 'entries' or name == 'Hex Magic') and isinstance(name, str):
            if re.sub('[^a-z]', '', name.lower()) not in SKIP and name not in headings:
                headings.append(name)
        for child in e.get('entries', []) + e.get('items', []):
            visit(child)
    for e in entries:
        visit(e, True)
    return {'sources': sources, 'features': headings, 'facts': facts}


def read_summaries():
    sections = {}
    for number, line in enumerate((ROOT / 'scripts/species-feature-summaries.txt').read_text().splitlines(), 1):
        if not line or line.startswith('#'):
            continue
        if line.startswith('[') and line.endswith(']'):
            section = sections.setdefault(line[1:-1], {})
            continue
        name, summary = line.split('|', 1)
        if name in section:
            raise ValueError(f'Duplicate summary at line {number}: {name}')
        if len(summary) < 18 or re.search(r'\{@|use the (normal|legacy)|check the source|details remain manual', summary, re.I):
            raise ValueError(f'Incomplete summary at line {number}: {name}')
        section[name] = summary
    return sections


def build():
    bindings = json.loads((ROOT / 'data/rules/species-source-bindings.json').read_text())
    summaries = read_summaries()
    rows, texts, indices, compiled = {}, [], {}, {}
    for id, binding in bindings.items():
        row = source_record(binding)
        choices = {**summaries['shared']}
        for source in row['sources']:
            choices.update(summaries.get('source ' + source['source'], {}))
        choices.update(summaries.get('race ' + id, {}))
        names = row['features'] + EXTRAS.get(id, [])
        types = row['facts'].get('creatureTypes', ['humanoid'])
        if types != ['humanoid'] and 'Fey' not in names:
            names = names + ['Creature Type']
            choices['Creature Type'] = 'Your creature type is ' + ' or '.join(t.title() for t in types) + '. Effects that depend on creature type use this type.'
        ids = []
        for name in names:
            if name not in choices:
                raise ValueError(f'Missing original summary: {id} / {name}')
            text = choices[name]
            if re.search(r'\{(?!darkvision\})', text):
                raise ValueError(f'Unresolved template: {id} / {name}')
            pair = (name, text)
            if pair not in indices:
                indices[pair] = len(texts)
                texts.append(list(pair))
            ids.append(indices[pair])
        rows[id] = row
        compiled[id] = {'features': ids, 'darkvision': row['facts'].get('darkvision', 0)}
    revision = json.loads((ROOT / 'data/rules/sources/5etools-v1.json').read_text())['revision']
    return {'revision': revision, 'races': rows}, {'revision': revision, 'features': texts, 'races': compiled}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true', help='Fail when generated data differs; needs the pinned source cache.')
    args = parser.parse_args()
    reference, data = build()
    output = "'use strict';\n/* Generated by scripts/build-species-feature-reference.py.\n * Feature names, source metadata and original concise explanations; no source entries. */\nconst CharacterSpeciesFeatureData = " + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + ";\nif(typeof module!=='undefined'&&module.exports)module.exports=CharacterSpeciesFeatureData;\n"
    path = ROOT / 'js/modules/character-species-feature-data.js'
    refpath = ROOT / 'data/rules/species-feature-reference.json'
    reftext = json.dumps(reference, ensure_ascii=False, indent=2) + '\n'
    if args.check:
        if path.read_text() != output or refpath.read_text() != reftext:
            raise SystemExit('Species feature reference is stale; run this generator.')
    else:
        path.write_text(output)
        refpath.write_text(reftext)
    print(json.dumps({'races': len(reference['races']), 'sourceFeatures': sum(len(r['features']) for r in reference['races'].values()), 'originalSummaries': len(data['features'])}))


if __name__ == '__main__':
    main()
