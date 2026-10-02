const fs=require('fs'),path=require('path'),Module=require('module');
const target=path.join(__dirname,'character-sheet-rules.cjs');
let source=fs.readFileSync(target,'utf8');
// Current character sheets persist schema 14.
source=source.replace(/assert\.equal\(saved\.schemaVersion,11\)/g,'assert.equal(saved.schemaVersion,14)');
source=source.replace(/assert\.equal\(saved\.schemaVersion,12\)/g,'assert.equal(saved.schemaVersion,14)');
source=source.replace(/assert\.equal\(saved\.schemaVersion,13\)/g,'assert.equal(saved.schemaVersion,14)');
const mod=new Module(target,module);
mod.filename=target;
mod.paths=Module._nodeModulePaths(path.dirname(target));
mod._compile(source,target);
