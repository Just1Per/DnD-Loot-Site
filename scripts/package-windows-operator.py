#!/usr/bin/env python3
"""Rebuild the Windows ZIP from the pinned sanitized operator source package."""
import hashlib
from pathlib import Path
import zipfile

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / 'scripts/operator-packages/campaignatlas-library-migration-operator.zip'
EXPECTED_SOURCE = '4fa2812817308fe2aa5bffb152f668e3573c233050fb25bc9d0deda98a100cf0'
DESTINATION = ROOT / 'scripts/operator-packages/campaignatlas-windows-library-migration-operator.zip'
assert hashlib.sha256(SOURCE.read_bytes()).hexdigest() == EXPECTED_SOURCE, 'Pinned source ZIP changed'
files = {}
with zipfile.ZipFile(SOURCE) as source:
    for name in source.namelist():
        if name.endswith('/'):
            continue
        relative = name.split('/', 1)[1]
        assert not relative.startswith('/') and '..' not in Path(relative).parts
        files[relative] = source.read(name)
# Refresh the operator modules only, never any private exports or dependency tree.
for relative in list(files):
    current = ROOT / relative
    if ((relative.startswith('scripts/') and relative.endswith('.mjs')) or (relative.startswith('tests/') and relative.endswith('.cjs'))) and current.is_file():
        files[relative] = current.read_bytes()
for relative in ['Start-ItemMigration.ps1', 'scripts/private-output.mjs', 'scripts/private-output-windows.ps1',
                 'tests/private-output.cjs', 'docs/windows-item-library-operator.md',
                 'docs/authorized-library-migration.md']:
    files[relative] = (ROOT / relative).read_bytes()
files['README.md'] = (ROOT / 'docs/windows-item-library-operator.md').read_bytes()
assert all('node_modules' not in Path(name).parts and '.git' not in Path(name).parts for name in files)
assert all(Path(name).name not in {'root-snapshot.json', 'library-migration-plan.json', 'authorized-decisions.json'} for name in files)
with zipfile.ZipFile(DESTINATION, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as output:
    for relative, data in sorted(files.items()):
        info = zipfile.ZipInfo('campaignatlas-windows-library-migration-operator/' + relative, (2026, 10, 19, 0, 0, 0))
        info.compress_type = zipfile.ZIP_DEFLATED
        info.external_attr = 0o100644 << 16
        output.writestr(info, data)
checksum = hashlib.sha256(DESTINATION.read_bytes()).hexdigest()
DESTINATION.with_suffix('.sha256').write_text(checksum + '  ' + DESTINATION.name + '\n')
print(f'{DESTINATION.name}: {len(files)} files, SHA-256 {checksum}')
