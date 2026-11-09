'use strict';
// Check Firebase's actual Hosting file selection, without uploading anything.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {listFiles}=require('firebase-tools/lib/listFiles');
const root=path.resolve(__dirname,'..');
const config=JSON.parse(fs.readFileSync(path.join(root,'firebase.json'),'utf8'));
const files=new Set(listFiles(root,config.hosting.ignore));
for(const file of ['index.html','404.html','rules-attribution.html','js/app.js','js/firebase.js','js/boot-status.js','logo.png','favicon.png','placeholder.png','assets/ui/logo-144-v1.webp','assets/ui/favicon-48-v1.png','assets/ui/placeholder-384-v1.webp','data/rules/catalog.json','data/rules/monsters.json','data/rules/wild-shapes-v1.json','data/rules/adobe-reference.json'])assert.ok(files.has(file),'Required public asset excluded: '+file);
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
for(const [,file]of html.matchAll(/href="(css\/[^"?]+)(?:\?[^\"]*)?"/g))assert.ok(files.has(file),'Required stylesheet excluded: '+file);
const app=fs.readFileSync(path.join(root,'js/app.js'),'utf8');
for(const [,file]of app.matchAll(/"\.\/(modules\/[^\"]+\.js)"/g))assert.ok(files.has('js/'+file),'Required feature module excluded: '+file);
for(const file of files)assert.ok(!file.split('/').some(part=>part.startsWith('.')),'Hidden/internal file selected for Hosting: '+file);
for(const file of files)assert.ok(!/^(?:functions|scripts|tests|docs|design|work|attachments|coverage|test-results|playwright-report)\//.test(file)&&!/^README/.test(file)&&!file.endsWith('.log')&&!['firestore.rules','storage.rules','data/rules/adobe-parity-baseline.json','data/rules/srd-magic-item-text-hashes.json'].includes(file),'Operational artifact selected for Hosting: '+file);
console.log('PASS Hosting selection retains runtime modules/styles, reference data and legal assets while excluding operational artifacts.');

// Exercise Firebase's selector with temporary report files, even in a clean CI checkout.
const {randomUUID}=require('node:crypto');
for(const dir of ['work','attachments','coverage','test-results','playwright-report','.hosting-packaging-probe-'+randomUUID()+'/nested']){const folder=path.join(root,dir),existed=fs.existsSync(folder),file=path.join(folder,'packaging-probe-'+randomUUID()+'.txt');fs.mkdirSync(folder,{recursive:true});try{fs.writeFileSync(file,'local-only test report');assert.ok(!listFiles(root,config.hosting.ignore).includes(path.relative(root,file).split(path.sep).join('/')),'Local report selected for Hosting: '+dir);}finally{fs.unlinkSync(file);if(!existed){fs.rmdirSync(folder);if(dir.startsWith('.hosting-packaging-probe-'))fs.rmdirSync(path.dirname(folder));}}}
console.log('PASS local work, attachments and test report folders stay out of Hosting even when present.');
