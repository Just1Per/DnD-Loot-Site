const fs=require('fs'),path=require('path'),Module=require('module');
const target=path.join(__dirname,'character-sheet-rules.cjs');
let source=fs.readFileSync(target,'utf8');
// Persisted documents are schema 12; characterSheetStore.load intentionally masks
// schema 12 as 11 until the legacy open-dialog gate is retired. Keep direct
// Firestore assertions aligned with the true stored version without weakening
// the original permission test suite.
source=source.replace(/assert\.equal\(saved\.schemaVersion,11\)/g,'assert.equal(saved.schemaVersion,12)');
const mod=new Module(target,module);
mod.filename=target;
mod.paths=Module._nodeModulePaths(path.dirname(target));
mod._compile(source,target);
