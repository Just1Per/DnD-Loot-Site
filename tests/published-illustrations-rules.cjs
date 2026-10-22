const fs=require('node:fs'),assert=require('node:assert/strict');
const {initializeTestEnvironment,assertSucceeds,assertFails}=require('@firebase/rules-unit-testing');
const sdk=require('firebase/firestore');
const {createCampaignWorkspaceStore}=require('../js/modules/campaign-workspace-store');
const {createCampaignInformationStore}=require('../js/modules/campaign-information-store');
(async()=>{const env=await initializeTestEnvironment({projectId:'demo-vault-test',firestore:{host:'127.0.0.1',port:8080,rules:fs.readFileSync('firestore.rules','utf8')}});try{
 await env.clearFirestore();const seed=async(values)=>env.withSecurityRulesDisabled(async c=>{for(const [path,data] of Object.entries(values))await sdk.setDoc(sdk.doc(c.firestore(),path),data)});
 await seed({'campaigns/a':{ownerId:'owner'},'campaigns/b':{ownerId:'other'},'campaigns/a/members/dm':{status:'active',role:'dm'},'campaigns/a/members/player':{status:'active',role:'player'},'campaigns/a/members/revoked':{status:'inactive',role:'player'},'users/admin':{role:['admin']}});
 const db=env.authenticatedContext('dm').firestore(),auth={currentUser:{uid:'dm'}},workspace=createCampaignWorkspaceStore({...sdk,db,auth});
 const png='iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aWQAAAABJRU5ErkJggg==';
 for(const [kind,publication] of [['world','playerInformation'],['creature','playerNPCs'],['chapter','playerChapters']]){
  const id='illustrated-'+kind,path=`campaign-journal-images/a/${kind}/${id}/original`,store=createCampaignInformationStore({...sdk,db,auth},kind);
  const image={path,alt:'A shared illustration',caption:'Public caption',uploadedBy:'dm',uploadedAt:1},preparedImage={path,contentType:'image/png',data:png};
  const thumbnail=kind!=='chapter'?{...preparedImage}:null;
  if(thumbnail)preparedImage.thumbnail=thumbnail;
  const thumbRef=context=>sdk.doc(context.firestore(),'campaigns','a','playerIllustrationThumbnails',kind,'entries',id);
  let input={title:'Public title',summary:'Public introduction',content:'Public body',privateNotes:'SECRET',data:{category:kind==='creature'?'Story NPC':'Lore',status:'Completed',order:1,journalImage:image,goals:'PRIVATE GOAL'}};
  if(kind==='chapter')input.data.playerRecap='Public chapter recap';
  await workspace.save({campaignId:'a',kind,id,revision:0,input});
  let published=await assertSucceeds(store.publish({campaignId:'a',id,sourceRevision:1,includeImage:true,preparedImage}));
  const ref=context=>sdk.doc(context.firestore(),'campaigns','a','playerIllustrations',kind,'entries',id),player=env.authenticatedContext('player');
  assert.equal((await assertSucceeds(sdk.getDoc(ref(player)))).data().data,png);
  if(thumbnail){
   assert.equal(published.image.thumbnail,true);
   assert.equal((await assertSucceeds(sdk.getDoc(thumbRef(player)))).data().data,png);
   for(const context of [env.unauthenticatedContext(),env.authenticatedContext('outsider'),env.authenticatedContext('admin'),env.authenticatedContext('revoked')])await assertFails(sdk.getDoc(thumbRef(context)));
   await assertFails(sdk.getDocs(sdk.collection(player.firestore(),'campaigns','a','playerIllustrationThumbnails',kind,'entries')));
   await assertFails(sdk.setDoc(thumbRef(player),thumbnail));
   for(const invalid of [{...thumbnail,contentType:'text/html'},{...thumbnail,data:'A'.repeat(88001)},{...thumbnail,data:'bad!data'},{...thumbnail,secret:'private'},{...thumbnail,path:'campaign-journal-images/b/world/foreign/picture'}])await assertFails(sdk.setDoc(thumbRef(env.authenticatedContext('dm')),invalid));
   await assert.rejects(store.publish({campaignId:'a',id,sourceRevision:1,publishedRevision:published.revision,includeImage:true,preparedImage:{...preparedImage,thumbnail:{...thumbnail,path:path+'wrong'}}}),/valid thumbnail/);
  }
  const pubRef=sdk.doc(db,'campaigns','a',publication,id);
  if(thumbnail){
   const originalCopy=(await sdk.getDoc(thumbRef(env.authenticatedContext('dm')))).data();
   await sdk.deleteDoc(thumbRef(env.authenticatedContext('dm')));
   await assertFails(sdk.updateDoc(pubRef,{'image.thumbnail':true,revision:published.revision+1}));
   await seed({[`campaigns/a/playerIllustrationThumbnails/${kind}/entries/${id}`]:originalCopy});
   await assertFails(sdk.updateDoc(pubRef,{'image.thumbnail':false,revision:published.revision+1}));
   await assertFails(sdk.updateDoc(pubRef,{'image.thumbnail':'yes',revision:published.revision+1}));
  }else{
   await assertFails(sdk.setDoc(thumbRef(env.authenticatedContext('dm')),preparedImage));
   await assertFails(sdk.updateDoc(pubRef,{'image.thumbnail':true,revision:published.revision+1}));
  }
  assert.equal(JSON.stringify(published).includes('SECRET'),false);assert.equal(JSON.stringify(published).includes(png),false,'list snapshot must not carry image bytes');
  for(const context of [env.unauthenticatedContext(),env.authenticatedContext('outsider'),env.authenticatedContext('admin'),env.authenticatedContext('revoked')])await assertFails(sdk.getDoc(ref(context)));
  await assertFails(sdk.getDocs(sdk.collection(player.firestore(),'campaigns','a','playerIllustrations',kind,'entries')));
  await assertFails(sdk.setDoc(ref(player),preparedImage));
  await assert.rejects(store.publish({campaignId:'a',id,sourceRevision:1,publishedRevision:published.revision,includeImage:true,preparedImage:{...preparedImage,path:'campaign-journal-images/b/world/foreign/picture'}}),/valid saved illustration/);
  await assertFails(sdk.setDoc(ref(env.authenticatedContext('dm')),{path,contentType:'text/html',data:png}));
  await assertFails(sdk.setDoc(ref(env.authenticatedContext('dm')),{path,contentType:preparedImage.contentType,data:'A'.repeat(700001)}));
  await assertFails(sdk.setDoc(ref(env.authenticatedContext('dm')),{path,contentType:preparedImage.contentType,data:png,secret:'not image data'}));
  input={...input,content:'Changed private draft',data:{...input.data,journalImage:{...image,path:path+'2',caption:'Changed caption'}}};
  await workspace.save({campaignId:'a',kind,id,revision:1,input});
  assert.equal((await sdk.getDoc(sdk.doc(db,'campaigns','a',publication,id))).data().content,kind==='chapter'?'Public chapter recap':'Public body');
  if(kind==='chapter')assert.equal(published.introduction,'Public body');
  await assertSucceeds(sdk.getDoc(ref(player)));if(thumbnail)await assertSucceeds(sdk.getDoc(thumbRef(player)));
  await assert.rejects(store.publish({campaignId:'a',id,sourceRevision:1,publishedRevision:published.revision,includeImage:true,preparedImage}),/changed/);
  published=await store.publish({campaignId:'a',id,sourceRevision:2,publishedRevision:published.revision});
  assert.equal(published.image.path,path,'text-only updates preserve the released image');
  if(thumbnail){assert.equal(published.image.thumbnail,true);await assertSucceeds(sdk.getDoc(thumbRef(player)));}
  published=await store.publish({campaignId:'a',id,sourceRevision:2,publishedRevision:published.revision,includeImage:true,preparedImage:{...preparedImage,path:path+'2',...(thumbnail?{thumbnail:{...thumbnail,path:path+'2'}}:{})}});
  assert.equal((await sdk.getDoc(ref(player))).data().path,path+'2');
  await seed({'campaigns/a/members/player':{status:'inactive',role:'player'}});await assertFails(sdk.getDoc(ref(player)));if(thumbnail)await assertFails(sdk.getDoc(thumbRef(player)));
  await seed({'campaigns/a/members/player':{status:'active',role:'player'}});
  await store.unpublish({campaignId:'a',id,publishedRevision:published.revision});await assertFails(sdk.getDoc(ref(player)));if(thumbnail)await assertFails(sdk.getDoc(thumbRef(player)));
  published=await store.publish({campaignId:'a',id,sourceRevision:2,includeImage:true,preparedImage:{...preparedImage,path:path+'2',...(thumbnail?{thumbnail:{...thumbnail,path:path+'2'}}:{})}});
  await seed({'campaigns/a':{ownerId:'owner',deletedAt:1,deletedBy:'owner'}});await assertFails(sdk.getDoc(ref(player)));if(thumbnail)await assertFails(sdk.getDoc(thumbRef(player)));await assertFails(sdk.getDoc(ref(env.authenticatedContext('dm'))));
  await seed({'campaigns/a':{ownerId:'owner'}});
  await workspace.save({campaignId:'a',kind,id,revision:2,input:{...input,archived:true}});await assertFails(sdk.getDoc(ref(player)));if(thumbnail)await assertFails(sdk.getDoc(thumbRef(player)));
  console.log('PASS',kind,'atomic published copy, private draft isolation, MIME/size/schema, stale and cross-campaign writes, removed/anonymous/admin denial, unpublish/archive/deletion revocation');
 }
}finally{await env.cleanup()}})().catch(e=>{console.error(e);process.exitCode=1});
