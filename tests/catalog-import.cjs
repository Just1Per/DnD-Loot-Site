const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
(async()=>{
 const {initializeApp}=await import('../scripts/node_modules/firebase-admin/lib/app/index.js');
 const {getFirestore}=await import('../scripts/node_modules/firebase-admin/lib/firestore/index.js');
 const {prepareCatalog,publishCatalog}=await import('../scripts/import-rules.mjs');
 initializeApp({projectId:'demo-vault-test'});const db=getFirestore();
 const p=prepareCatalog(fs.readFileSync(path.join(__dirname,'../data/rules/catalog.json'),'utf8'));
 await publishCatalog(db,p);await publishCatalog(db,p);
 const manifest=(await db.doc('rulesCatalog/current').get()).data();assert.equal(manifest.release,p.release);
 const parts=await db.collection(`rulesCatalog/${p.release}/parts`).orderBy('__name__').get();
 const reconstructed=parts.docs.map(d=>d.data().text).join('');assert.equal(prepareCatalog(reconstructed).release,p.release);assert.equal(parts.size,p.parts.length);
 assert.equal(JSON.parse(reconstructed).spells.length,969);
 await db.terminate();console.log('PASS real Firestore import, retry and exact reconstruction');
})().catch(e=>{console.error(e);process.exitCode=1;});
