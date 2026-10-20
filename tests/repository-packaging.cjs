'use strict';
// Check Firebase's actual Hosting file selection, without uploading anything.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {listFiles}=require('firebase-tools/lib/listFiles');
const root=path.resolve(__dirname,'..');
const config=JSON.parse(fs.readFileSync(path.join(root,'firebase.json'),'utf8'));
const files=new Set(listFiles(root,config.hosting.ignore));
for(const file of ['index.html','404.html','rules-attribution.html','js/app.js','js/firebase.js','js/boot-status.js','logo.png','favicon.png','placeholder.png','data/rules/catalog.json','data/rules/monsters.json','data/rules/adobe-reference.json'])assert.ok(files.has(file),'Required public asset excluded: '+file);
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
for(const [,file]of html.matchAll(/href="(css\/[^"?]+)(?:\?[^\"]*)?"/g))assert.ok(files.has(file),'Required stylesheet excluded: '+file);
const app=fs.readFileSync(path.join(root,'js/app.js'),'utf8');
for(const [,file]of app.matchAll(/"\.\/(modules\/[^\"]+\.js)"/g))assert.ok(files.has('js/'+file),'Required feature module excluded: '+file);
for(const file of files)assert.ok(!/^(?:functions|scripts|tests|docs|design)\//.test(file)&&!/^README/.test(file)&&!file.endsWith('.log')&&!['firestore.rules','storage.rules','data/rules/adobe-parity-baseline.json','data/rules/srd-magic-item-text-hashes.json'].includes(file),'Operational artifact selected for Hosting: '+file);
console.log('PASS Hosting selection retains runtime modules/styles, reference data and legal assets while excluding operational artifacts.');
