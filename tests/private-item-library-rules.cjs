const fs=require('node:fs'),assert=require('node:assert/strict');
const {initializeTestEnvironment,assertSucceeds,assertFails}=require('@firebase/rules-unit-testing');
const {doc,setDoc,getDoc,getDocs,collection,updateDoc,deleteDoc}=require('firebase/firestore');
const {ref,uploadBytes,getBytes,deleteObject}=require('firebase/storage');
(async()=>{
 const env=await initializeTestEnvironment({projectId:'demo-vault-test',firestore:{host:'127.0.0.1',port:8080,rules:fs.readFileSync('firestore.rules','utf8')},storage:{host:'127.0.0.1',port:9199,rules:fs.readFileSync('storage.rules','utf8')}});
 try{
  await env.clearFirestore();await env.clearStorage();
  const image='private-item-library-images/owner/'+'a'.repeat(64)+'/'+'b'.repeat(64);
  await env.withSecurityRulesDisabled(async c=>{
   await setDoc(doc(c.firestore(),'users/admin'),{role:['admin']});
   await setDoc(doc(c.firestore(),'campaigns/a'),{ownerId:'owner'});
   await setDoc(doc(c.firestore(),'campaigns/a/members/dm'),{role:'dm',status:'active'});
   for(const kind of ['records','originals','templates'])await setDoc(doc(c.firestore(),`privateItemLibraries/owner/${kind}/sample`),{ownerId:'owner',description:'Private original or reviewed template'});
   await uploadBytes(ref(c.storage(),image),new Uint8Array([1,2,3]),{contentType:'image/png'});
  });
  const owner=env.authenticatedContext('owner');
  for(const kind of ['records','originals','templates']){
   const path=`privateItemLibraries/owner/${kind}/sample`;
   assert.equal((await assertSucceeds(getDocs(collection(owner.firestore(),`privateItemLibraries/owner/${kind}`)))).size,1);
   await assertSucceeds(getDoc(doc(owner.firestore(),path)));
   for(const uid of ['dm','player','outsider','admin']){
    const context=env.authenticatedContext(uid);
    await assertFails(getDoc(doc(context.firestore(),path)));
    await assertFails(getDocs(collection(context.firestore(),`privateItemLibraries/owner/${kind}`)));
    await assertFails(setDoc(doc(context.firestore(),path),{ownerId:uid,reuseStatus:'reviewed-template'}));
   }
   await assertFails(getDoc(doc(env.unauthenticatedContext().firestore(),path)));
   await assertFails(setDoc(doc(owner.firestore(),path+'-new'),{ownerId:'owner'}));
   await assertFails(updateDoc(doc(owner.firestore(),path),{reuseStatus:'reviewed-template'}));
   await assertFails(deleteDoc(doc(owner.firestore(),path)));
  }
  await assertSucceeds(getBytes(ref(owner.storage(),image)));
  for(const uid of ['dm','player','outsider','admin'])await assertFails(getBytes(ref(env.authenticatedContext(uid).storage(),image)));
  await assertFails(getBytes(ref(env.unauthenticatedContext().storage(),image)));
  await assertFails(uploadBytes(ref(owner.storage(),image),new Uint8Array([4]),{contentType:'image/png'}));
  await assertFails(deleteObject(ref(owner.storage(),image)));
  await assertFails(uploadBytes(ref(owner.storage(),'private-item-library-images/owner/'+'c'.repeat(64)+'/'+'d'.repeat(64)),new Uint8Array([1]),{contentType:'image/png'}));
  await assertFails(getDoc(doc(owner.firestore(),'privateItemLibraries/owner/unknown/sample')));
  console.log('PASS Private library originals, records, templates and illustrations are owner-only; campaign roles/global admins cannot read, publish, overwrite or delete them');
 }finally{await env.cleanup();}
})().catch(error=>{console.error(error);process.exitCode=1;});
