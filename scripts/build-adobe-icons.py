#!/usr/bin/env python3
"""Render only whitelisted generic built-in icons; never execute PDF actions."""
import argparse, io, json, pathlib
import fitz
from PIL import Image
from pypdf import PdfReader, PdfWriter
from pypdf.generic import DictionaryObject, NameObject, DecodedStreamObject

CLASSES = ['Artificer', 'Barbarian', 'Bard', 'Cleric', 'Druid', 'Fighter',
           'Monk', 'Paladin', 'Ranger', 'Rogue', 'Sorcerer', 'Warlock', 'Wizard']
FACTIONS = {'emeraldenclave': 'Emerald Enclave', 'harpers': 'Harpers',
            'lordsalliance': "Lords’ Alliance", 'ordergauntlet': 'Order of the Gauntlet',
            'zhentarim': 'Zhentarim'}
SEASONS = {'tod': '1 · Tyranny of Dragons', 'ee': '2 · Elemental Evil',
           'rod': '3 · Rage of Demons', 'cos': '4 · Curse of Strahd',
           'skt': '5 · Storm King’s Thunder', 'totyp': '6 · Tales from the Yawning Portal',
           'toa': '7 · Tomb of Annihilation', 'wda': '8 · Waterdeep Adventures',
           'dia': '9 · Descent into Avernus', 'rotf': '10 · Rime of the Frostmaiden'}

def allowed():
    rows = {'SaveIMG.ClassIcon.' + name.lower():
            {'id': 'class-' + name.lower(), 'group': 'Class', 'label': name}
            for name in CLASSES}
    for key, label in FACTIONS.items():
        for variant in ['symbol', 'banner', 'icon']:
            rows['SaveIMG.Faction.' + key + '.' + variant] = {
                'id': 'faction-' + key + '-' + variant,
                'group': 'Faction ' + variant, 'label': label}
    for key, label in SEASONS.items():
        rows['SaveIMG.ALicon.' + key] = {
            'id': 'season-' + key, 'group': 'Adventure League season', 'label': label}
    return rows

def obj(value):
    return value.get_object() if hasattr(value, 'get_object') else value

def widgets(reader):
    seen = set()
    def visit(ref, prefix=''):
        node = obj(ref)
        identity = getattr(ref, 'idnum', id(node))
        if identity in seen:
            return
        seen.add(identity)
        name = '.'.join(part for part in [prefix, str(node.get('/T', ''))] if part)
        if node.get('/MK'):
            yield name, node
        for child in node.get('/Kids', []):
            yield from visit(child, name)
    form = obj(reader.trailer['/Root'].get('/AcroForm', {}))
    for ref in form.get('/Fields', []):
        yield from visit(ref)

def render(form, target):
    if form.get('/Subtype') != '/Form':
        raise ValueError('Expected a generic icon Form XObject')
    box = [float(value) for value in form['/BBox']]
    x, y, right, top = box
    width, height = right-x, top-y
    if not (0 < width <= 2000 and 0 < height <= 2000):
        raise ValueError('Invalid generic icon bounds')
    writer = PdfWriter()
    page = writer.add_blank_page(width=width, height=height)
    icon = form.clone(writer)
    # Only the icon XObject is copied into a new blank document. Its original
    # centering matrix belongs to the Acrobat button, not the cropped export.
    icon.pop('/Matrix', None)
    page[NameObject('/Resources')] = DictionaryObject({
        NameObject('/XObject'): DictionaryObject({NameObject('/Icon'): icon.indirect_reference})})
    stream = DecodedStreamObject()
    stream.set_data(('q 1 0 0 1 %s %s cm /Icon Do Q' % (-x, -y)).encode('ascii'))
    page[NameObject('/Contents')] = writer._add_object(stream)
    memory = io.BytesIO()
    writer.write(memory)
    with fitz.open(stream=memory.getvalue(), filetype='pdf') as doc:
        scale = 384/max(width, height)
        pix = doc[0].get_pixmap(matrix=fitz.Matrix(scale, scale), alpha=True)
        image = Image.frombytes('RGBA', [pix.width, pix.height], pix.samples)
        image.save(target, format='WEBP', lossless=True)
        return image.width, image.height

def export(source, target):
    reader = PdfReader(source)
    pending, found = allowed(), {}
    for name, field in widgets(reader):
        if name not in pending:
            continue
        if name in found:
            raise ValueError('Duplicate generic built-in icon')
        icon = obj(obj(field['/MK']).get('/I'))
        if not icon:
            raise ValueError('Missing generic built-in icon appearance')
        found[name] = icon
    if set(found) != set(pending):
        raise ValueError('The reference does not contain all 38 expected generic icons')
    target.mkdir(parents=True, exist_ok=True)
    rows = []
    for name, row in pending.items():
        asset = row['id'] + '.webp'
        width, height = render(found[name], target/asset)
        rows.append({**row, 'asset': asset, 'width': width, 'height': height})
    result = {'format': 1, 'source': 'MPMB v13.0.4 Printer Friendly', 'icons': rows}
    (target/'icons.json').write_text(json.dumps(result, ensure_ascii=False, indent=2)+'\n')
    return result

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('pdf', type=pathlib.Path)
    parser.add_argument('--output', type=pathlib.Path, required=True)
    args = parser.parse_args()
    result = export(args.pdf, args.output)
    print('Exported %s whitelisted generic icons; no field values, portraits or PDF actions.' % len(result['icons']))
