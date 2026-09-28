const assert=require('node:assert/strict'),data=require('../data/rules/adobe-reference.json');
(async()=>{
 const {initializeApp}=await import('../scripts/node_modules/firebase-admin/lib/app/index.js'),{getFirestore}=await import('../scripts/node_modules/firebase-admin/lib/firestore/index.js');
 const {gearTemplates,publishGear}=await import('../scripts/import-base-gear.mjs');initializeApp({projectId:'demo-vault-test'});const db=getFirestore(),rows=gearTemplates(data);
 await db.doc('items/'+rows[0].id).set({name:'Custom existing template'});const first=await publishGear(db,rows),second=await publishGear(db,rows);
 assert.equal(first.created,157);assert.equal(second.created,0);assert.equal(second.existing,158);assert.equal((await db.doc('items/'+rows[0].id).get()).data().name,'Custom existing template');assert.equal((await db.doc('items/srd-armor-shield').get()).data().mechanics.kind,'shield');await db.terminate();console.log('PASS real Firestore gear import, preserved edits and retry');
})().catch(e=>{console.error(e);process.exitCode=1;});
