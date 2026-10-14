const fs=require('node:fs');
const {initializeTestEnvironment,assertFails,assertSucceeds}=require('@firebase/rules-unit-testing');
const {doc,setDoc}=require('firebase/firestore');
const {ref,uploadBytes,getBytes,deleteObject}=require('firebase/storage');

(async()=>{
 const env=await initializeTestEnvironment({
  projectId:'demo-vault-test',
  firestore:{host:'127.0.0.1',port:8080,rules:fs.readFileSync('firestore.rules','utf8')},
  storage:{host:'127.0.0.1',port:9199,rules:fs.readFileSync('storage.rules','utf8')}
 });
 try{
  await env.clearFirestore();await env.clearStorage();
  await env.withSecurityRulesDisabled(async context=>{
   for(const [p,data] of Object.entries({
    'users/admin':{role:['admin']},
    'campaigns/a':{ownerId:'owner'},
    'campaigns/b':{ownerId:'other'},
    'campaigns/a/members/dm':{role:'dm',status:'active'},
    'campaigns/a/members/player':{role:'player',status:'active'},
    'campaigns/a/members/inactiveDm':{role:'dm',status:'inactive'}
   }))await setDoc(doc(context.firestore(),p),data);
  });
  const storage=Object.fromEntries(['admin','owner','dm','player','inactiveDm','outsider'].map(uid=>[uid,env.authenticatedContext(uid).storage()]));
  const anon=env.unauthenticatedContext().storage();
  const png=new Uint8Array([1,2,3]),contentType='image/png';
  const upload=(uid,path,bytes=png,mime=contentType)=>uploadBytes(ref(storage[uid],path),bytes,{contentType:mime});

  // Preserve root catalog public reads, administrator writes and removal.
  await assertSucceeds(upload('admin','dnd-item-images/sword.png'));
  await assertSucceeds(getBytes(ref(anon,'dnd-item-images/sword.png')));
  await assertFails(upload('dm','dnd-item-images/forged.png'));
  await assertSucceeds(upload('admin','dnd-item-images/sword.png',new Uint8Array([4])));
  await assertFails(deleteObject(ref(storage.player,'dnd-item-images/sword.png')));
  await assertSucceeds(deleteObject(ref(storage.admin,'dnd-item-images/sword.png')));

  // Preserve item-image uploads by campaign owner/active DM and reads by active members.
  await assertSucceeds(upload('owner','campaign-item-images/a/owner.png'));
  await assertSucceeds(upload('dm','campaign-item-images/a/dm.png'));
  await assertSucceeds(getBytes(ref(storage.player,'campaign-item-images/a/dm.png')));
  await assertFails(getBytes(ref(storage.outsider,'campaign-item-images/a/dm.png')));
  await assertFails(upload('player','campaign-item-images/a/forged.png'));
  await assertFails(upload('inactiveDm','campaign-item-images/a/inactive.png'));
  await assertFails(upload('dm','campaign-item-images/b/other.png'));
  await assertSucceeds(upload('dm','campaign-item-images/a/dm.png',new Uint8Array([5])));
  await assertSucceeds(deleteObject(ref(storage.owner,'campaign-item-images/a/dm.png')));

  // Allow private world maps for owner and active DM, but not players or non-members.
  await assertSucceeds(upload('dm','campaign-world-images/a/north/map'));
  await assertSucceeds(upload('owner','campaign-world-images/a/north/owner-map'));
  await assertSucceeds(getBytes(ref(storage.owner,'campaign-world-images/a/north/map')));
  await assertSucceeds(getBytes(ref(storage.dm,'campaign-world-images/a/north/owner-map')));
  for(const uid of ['player','inactiveDm','outsider']){
   await assertFails(getBytes(ref(storage[uid],'campaign-world-images/a/north/map')));
   await assertFails(upload(uid,'campaign-world-images/a/north/forged-'+uid));
  }
  await assertFails(upload('dm','campaign-world-images/b/north/wrong-campaign'));
  await assertFails(upload('dm','campaign-world-images/a/north/not-image',png,'text/plain'));
  await assertFails(upload('dm','campaign-world-images/a/north/svg',png,'image/svg+xml'));
  await assertFails(upload('dm','campaign-world-images/a/north/too-large',new Uint8Array(5*1024*1024+1)));
  await assertFails(upload('dm','campaign-world-images/a/north/map')); // Immutable uploads
  await assertFails(deleteObject(ref(storage.owner,'campaign-world-images/a/north/map')));

  // Journal illustrations are isolated by campaign, record type and entry ID.
  for(const kind of ['world','creature','chapter','encounter']){
    const path='campaign-journal-images/a/'+kind+'/entry-'+kind+'/illustration';
    await assertSucceeds(upload('dm',path));
    await assertSucceeds(getBytes(ref(storage.owner,path)));
    await assertFails(upload('dm',path)); // Immutable path, never overwrite
    await assertFails(deleteObject(ref(storage.owner,path)));
    for(const uid of ['player','inactiveDm','outsider']){
      await assertFails(getBytes(ref(storage[uid],path)));
      await assertFails(upload(uid,'campaign-journal-images/a/'+kind+'/entry-'+kind+'/forged-'+uid));
    }
    await assertFails(getBytes(ref(anon,path)));
    await assertFails(upload('dm','campaign-journal-images/b/'+kind+'/other/foreign'));
  }
  await assertFails(upload('dm','campaign-journal-images/a/invalid/entry/file'));
  await assertFails(upload('dm','campaign-journal-images/a/world/map/not-an-image',png,'text/plain'));
  await assertFails(upload('dm','campaign-journal-images/a/world/map/too-big',new Uint8Array(5*1024*1024)));
  console.log('PASS Campaign-bound journal images: private DM reads, immutable uploads and strict campaign isolation');

  // Covers are member-readable and immutable; players cannot upload or delete.
  await assertSucceeds(upload('dm','campaign-cover-images/a/cover'));
  await assertSucceeds(upload('owner','campaign-cover-images/a/owner-cover'));
  await assertSucceeds(getBytes(ref(storage.player,'campaign-cover-images/a/cover')));
  for(const uid of ['admin','inactiveDm','outsider']){
   await assertFails(getBytes(ref(storage[uid],'campaign-cover-images/a/cover')));
   await assertFails(upload(uid,'campaign-cover-images/a/forged-'+uid));
  }
  await assertFails(getBytes(ref(anon,'campaign-cover-images/a/cover')));
  await assertFails(upload('player','campaign-cover-images/a/player'));
  await assertFails(upload('dm','campaign-cover-images/b/wrong-campaign'));
  await assertFails(upload('dm','campaign-cover-images/a/cover'));
  await assertFails(upload('dm','campaign-cover-images/a/svg',png,'image/svg+xml'));
  await assertFails(upload('dm','campaign-cover-images/a/too-large',new Uint8Array(5*1024*1024)));
  await assertFails(deleteObject(ref(storage.owner,'campaign-cover-images/a/cover')));
  console.log('PASS Campaign covers: member reads, manager uploads, immutable paths, MIME/size limits');

  // Default deny remains in force.
  await assertFails(upload('admin','other/private.png'));
  console.log('PASS Combined Storage rules: root images, campaign images, private world maps, unchanged access controls');
 }finally{await env.cleanup();}
})().catch(error=>{console.error(error);process.exitCode=1});
