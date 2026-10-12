const fs = require('node:fs'), assert = require('node:assert/strict');
const {initializeTestEnvironment, assertFails, assertSucceeds} = require('@firebase/rules-unit-testing');
const {doc, setDoc, getDoc, updateDoc} = require('firebase/firestore');

(async () => {
  const env = await initializeTestEnvironment({projectId:'demo-vault-test', firestore:{host:'127.0.0.1', port:8080, rules:fs.readFileSync('firestore.rules','utf8')}});
  let count = 0;
  const check = async (name, fn) => {await fn(); console.log('PASS', name); count++;};
  try {
    await env.clearFirestore();
    await env.withSecurityRulesDisabled(async context => {
      for (const [path, data] of Object.entries({
        'campaigns/a':{name:'Storm Coast',ownerId:'owner',dmId:'owner'},
        'campaigns/b':{name:'Another campaign',ownerId:'other',dmId:'other'},
        'campaigns/a/members/dm':{role:'dm',status:'active'},
        'campaigns/a/members/player':{role:'player',status:'active'},
        'campaigns/a/members/revoked':{role:'dm',status:'inactive'},
        'users/admin':{role:['admin']}
      })) await setDoc(doc(context.firestore(), path), data);
    });
    const db = Object.fromEntries(['owner','dm','player','revoked','admin','outsider'].map(uid=>[uid,env.authenticatedContext(uid).firestore()]));
    const page = {tagline:'Beyond the horizon',introduction:'Welcome to the coast.',expectations:'Weekly sessions.',imageUrl:'https://art.example.test/cover.png',imageAlt:'A golden coastal sky',imageCredit:'Campaign DM',revision:1};
    const write = (uid, frontPage=page, campaign='a', extra={}) => updateDoc(doc(db[uid],'campaigns',campaign),{frontPage,...extra});
    await check('Owner publishes a first front page; active players can read it', async()=>{
      await assertSucceeds(write('owner'));
      assert.deepEqual((await assertSucceeds(getDoc(doc(db.player,'campaigns/a')))).data().frontPage,page);
    });
    await check('Active DM updates the front page without changing campaign settings', async()=>{
      await assertSucceeds(write('dm',{...page,revision:2,tagline:'A new chapter'}));
      const saved=(await getDoc(doc(db.owner,'campaigns/a'))).data();
      assert.equal(saved.ownerId,'owner'); assert.equal(saved.name,'Storm Coast');
    });
    await check('Players, removed DMs, outsiders and global admins cannot edit', async()=>{
      for(const uid of ['player','revoked','outsider','admin'])await assertFails(write(uid,{...page,revision:3}));
      for(const uid of ['revoked','outsider','admin'])await assertFails(getDoc(doc(db[uid],'campaigns/a')));
    });
    await check('Cross-campaign edits and owner transfers remain denied', async()=>{
      await assertFails(write('dm',page,'b'));
      await assertFails(write('dm',{...page,revision:3},'a',{ownerId:'dm'}));
    });
    await check('Stale and skipped revisions cannot overwrite newer content', async()=>{
      await assertFails(write('dm',{...page,revision:2}));
      await assertFails(write('dm',{...page,revision:4}));
    });
    await check('Unsafe images, missing descriptions and oversized or extra fields fail', async()=>{
      for(const bad of [{imageUrl:'javascript:alert(1)'},{imageUrl:'http://art.example.test/x'},{imageUrl:'https://name:password@art.example.test/x'},{imageAlt:''},{introduction:'x'.repeat(6001)},{privateNotes:'Secret'}])await assertFails(write('dm',{...page,revision:3,...bad}));
    });
    await check('Cover artwork can be removed; normal campaign settings still save', async()=>{
      await assertSucceeds(write('dm',{...page,revision:3,imageUrl:'',imageAlt:'',imageCredit:''}));
      await assertSucceeds(updateDoc(doc(db.dm,'campaigns/a'),{description:'Updated summary',defaultItemVisible:false}));
    });
    console.log('SUCCESS',count,'campaign front-page permission checks');
  } finally {await env.cleanup();}
})().catch(error=>{console.error(error);process.exitCode=1});
