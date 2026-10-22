const fs=require('node:fs'),assert=require('node:assert/strict');
const {initializeTestEnvironment,assertSucceeds,assertFails}=require('@firebase/rules-unit-testing');
const sdk=require('firebase/firestore'),storage=require('firebase/storage');
const {createCampaignMapStore}=require('../js/modules/campaign-map-store');
(async()=>{const env=await initializeTestEnvironment({projectId:'demo-vault-test',firestore:{host:'127.0.0.1',port:8080,rules:fs.readFileSync('firestore.rules','utf8')},storage:{host:'127.0.0.1',port:9199,rules:fs.readFileSync('storage.rules','utf8')}});let count=0;const check=async(name,work)=>{await work();count++;console.log('PASS',name)};
try{await env.clearFirestore();await env.clearStorage();await env.withSecurityRulesDisabled(async c=>{for(const [path,data] of Object.entries({'campaigns/a':{ownerId:'owner'},'campaigns/b':{ownerId:'outsider'},'campaigns/a/members/dm':{role:'dm',status:'active'},'campaigns/a/members/player':{role:'player',status:'active'},'campaigns/a/members/revoked':{role:'dm',status:'inactive'},'users/admin':{role:['admin']}}))await sdk.setDoc(sdk.doc(c.firestore(),path),data);});
 const contexts=Object.fromEntries(['dm','owner','player','outsider','revoked','admin'].map(uid=>[uid,env.authenticatedContext(uid)])),stores=Object.fromEntries(Object.keys(contexts).map(uid=>[uid,createCampaignMapStore({...sdk,db:contexts[uid].firestore(),auth:{currentUser:{uid}}})]));
 const path='campaign-maps/a/first',second='campaign-maps/a/second',upload=(uid,p=path,bytes=new Uint8Array([1,2,3]),type='image/png')=>storage.uploadBytes(storage.ref(contexts[uid].storage(),p),bytes,{contentType:type}),read=(uid,p=path)=>storage.getBytes(storage.ref(contexts[uid].storage(),p));
 const params={campaignId:'a',title:'Storm Coast',imagePath:path,revision:0},input={name:'Greyhaven',description:'A northern port.',x:25,y:60,imagePath:path};
 await check('Only DMs/owner upload immutable map images; pending images remain DM-only',async()=>{await assertSucceeds(upload('dm'));await assertSucceeds(upload('owner',second));await assertFails(read('player'));await assertFails(upload('dm'));for(const uid of ['player','outsider','revoked','admin'])await assertFails(upload(uid,'campaign-maps/a/'+uid));await assertFails(upload('dm','campaign-maps/a/bad',new Uint8Array([1]),'text/plain'));await assertFails(upload('dm','campaign-maps/a/empty',new Uint8Array([])));await assertSucceeds(upload('dm','campaign-maps/a/large',new Uint8Array(50*1024*1024)));await assertFails(upload('dm','campaign-maps/a/big',new Uint8Array(50*1024*1024+1)));await assertFails(upload('dm','campaign-maps/b/cross'));});
 await check('DM saves the map and members can read exactly its selected image',async()=>{await assertSucceeds(stores.dm.saveMap(params));assert.equal((await stores.player.load('a')).title,'Storm Coast');await assertSucceeds(read('player'));await assertFails(read('player',second));for(const uid of ['outsider','revoked','admin']){await assertFails(stores[uid].load('a'));await assertFails(read(uid));}await assertFails(stores.player.load('b'));await assertFails(storage.getBytes(storage.ref(env.unauthenticatedContext().storage(),path)));});
 await check('Players, revoked members and unrelated admins cannot modify maps or pin data',async()=>{for(const uid of ['player','revoked','outsider','admin']){await assertFails(stores[uid].saveMap({...params,revision:1}));await assertFails(stores[uid].savePin({campaignId:'a',id:'pin',input,revision:0}));}await assertFails(stores.dm.saveMap({...params,campaignId:'b',imagePath:'campaign-maps/b/cross'}));});
 await check('DM creates a pin; member queries must be scoped to the current map image',async()=>{await stores.dm.savePin({campaignId:'a',id:'pin',input,revision:0});assert.equal((await stores.player.listPins('a',path))[0].name,'Greyhaven');await assertFails(sdk.getDocs(sdk.collection(contexts.player.firestore(),'campaigns/a/campaignMaps/main/pins')));});
 await check('Rules reject out-of-range coordinates, injected fields, forged ownership and arbitrary map URLs',async()=>{const ref=sdk.doc(contexts.dm.firestore(),'campaigns/a/campaignMaps/main/pins/pin'),row=(await sdk.getDoc(ref)).data();for(const change of [{x:-1},{y:101},{x:'20'},{description:'x'.repeat(2001)},{name:''},{updatedBy:'player'},{privateNotes:'secret'},{imagePath:second}])await assertFails(sdk.setDoc(ref,{...row,revision:2,...change}));const mapRef=sdk.doc(contexts.dm.firestore(),'campaigns/a/campaignMaps/main'),map=(await sdk.getDoc(mapRef)).data();for(const change of [{imagePath:'https://example.com/map.png'},{imagePath:'campaign-maps/b/first'},{secret:'hidden'},{updatedBy:'player'}])await assertFails(sdk.setDoc(mapRef,{...map,revision:2,...change}));});
 await check('Revision conflicts and context changes cannot silently overwrite maps or places',async()=>{await assert.rejects(stores.dm.saveMap(params),/changed/);await assert.rejects(stores.dm.savePin({campaignId:'a',id:'pin',input,revision:0}),/changed/);await assert.rejects(stores.dm.saveMap({...params,revision:1,isCurrent:()=>false}),/changed/);await assert.rejects(stores.dm.removePin({campaignId:'a',id:'pin',revision:1,isCurrent:()=>false}),/changed/);await stores.owner.savePin({campaignId:'a',id:'pin',input:{...input,description:'An updated description.'},revision:1});});
 await check('Replacing a map hides previous image and its old pins from player access',async()=>{await stores.owner.saveMap({...params,imagePath:second,revision:1});await assertFails(read('player'));await assertSucceeds(read('player',second));assert.equal((await stores.player.listPins('a',second)).length,0);await assertFails(sdk.getDoc(sdk.doc(contexts.player.firestore(),'campaigns/a/campaignMaps/main/pins/pin')));await assertFails(stores.player.listPins('a',path));await assert.rejects(stores.dm.savePin({campaignId:'a',id:'stale-map',input,revision:0}),/image changed/);});
 await check('Saved pins can be removed only by a campaign DM; revocation ends image and pin access',async()=>{await stores.dm.savePin({campaignId:'a',id:'new-pin',input:{...input,imagePath:second},revision:0});await assertFails(stores.player.removePin({campaignId:'a',id:'new-pin',revision:1}));await stores.owner.removePin({campaignId:'a',id:'new-pin',revision:1});assert.equal((await stores.player.listPins('a',second)).length,0);await env.withSecurityRulesDisabled(c=>sdk.updateDoc(sdk.doc(c.firestore(),'campaigns/a/members/player'),{status:'inactive'}));await assertFails(read('player',second));await assertFails(stores.player.listPins('a',second));});

 await check('Private drafts and place pictures cannot be read or written by players, revoked members or unrelated admins',async()=>{
  await env.withSecurityRulesDisabled(c=>sdk.updateDoc(sdk.doc(c.firestore(),'campaigns/a/members/player'),{status:'active'}));
  const pin={id:'published-place',name:'Saltmere',description:'Published harbour.',x:45,y:60,type:'City',revealed:true,picturePath:'campaign-map-place-images/a/published-place/first',pictureAlt:'The harbour at dusk',worldEntryId:'shared-world'};
  await assertSucceeds(upload('dm',pin.picturePath));await assertFails(read('player',pin.picturePath));
  await env.withSecurityRulesDisabled(c=>sdk.setDoc(sdk.doc(c.firestore(),'campaigns/a/playerInformation/shared-world'),{title:'Saltmere',content:'Party-facing world text'}));
  const hidden={...pin,id:'hidden-place',name:'DM SECRET',revealed:false,picturePath:'',pictureAlt:'',worldEntryId:''};
  const draft=await stores.dm.saveDraft({campaignId:'a',input:{title:'Atlas',imagePath:second,pins:[pin,hidden]},revision:0,sourceRevision:2});
  assert.equal(draft.pins.length,2);assert.equal((await stores.player.load('a')).revision,2);
  for(const uid of ['player','revoked','outsider','admin']){await assertFails(stores[uid].loadDraft('a'));await assertFails(stores[uid].saveDraft({campaignId:'a',input:draft,revision:1,sourceRevision:2}));}
  await assert.rejects(stores.dm.saveDraft({campaignId:'a',input:draft,revision:0,sourceRevision:2}),/draft changed/);
 });
 await check('Publication is atomic, only revealed pins are sent, and exact published pictures become readable',async()=>{
  const result=await stores.dm.publish({campaignId:'a',draftRevision:1});assert.equal(result.map.schemaVersion,2);
  const map=await stores.player.load('a'),pins=await stores.player.listPins('a',map);assert.equal(pins.length,1);assert.equal(pins[0].name,'Saltmere');assert.equal(pins[0].worldEntryId,'shared-world');
  await assertSucceeds(read('player','campaign-map-place-images/a/published-place/first'));
  await assertFails(sdk.getDoc(sdk.doc(contexts.player.firestore(),'campaigns/a/campaignMaps/main/pins/hidden-place')));
  await assertFails(sdk.getDoc(sdk.doc(contexts.player.firestore(),'campaigns/a/campaignMaps/main/pins/pin')));
  await assertFails(stores.player.listPins('a',second));
  await assertFails(stores.player.publish({campaignId:'a',draftRevision:2}));
  await assertFails(stores.owner.removePin({campaignId:'a',id:'published-place',revision:map.revision}));
  await assert.rejects(stores.dm.publish({campaignId:'a',draftRevision:1}),/draft changed/);
  const ref=sdk.doc(contexts.dm.firestore(),'campaigns/a/campaignMaps/main/pins/published-place'),row=(await sdk.getDoc(ref)).data();
  await assertFails(sdk.setDoc(ref,{...row,description:'Cannot update without a new map publication'}));
 });
 await check('Draft edits and replacement images preserve published map until publish; unpublish removes pin and picture access',async()=>{
  const oldMap=await stores.player.load('a'),draft=await stores.dm.loadDraft('a');
  await upload('dm','campaign-maps/a/third');
  draft.imagePath='campaign-maps/a/third';draft.pins[0].revealed=false;
  const saved=await stores.dm.saveDraft({campaignId:'a',input:draft,revision:draft.revision,sourceRevision:draft.sourceRevision});
  assert.equal((await stores.player.load('a')).imagePath,second);await assertFails(read('player','campaign-maps/a/third'));
  assert.equal((await stores.player.listPins('a',oldMap)).length,1);
  await stores.dm.publish({campaignId:'a',draftRevision:saved.revision});const map=await stores.player.load('a');assert.equal((await stores.player.listPins('a',map)).length,0);
  await assertFails(read('player','campaign-map-place-images/a/published-place/first'));await assertFails(read('player',second));await assertSucceeds(read('player','campaign-maps/a/third'));
 });
 await check('Unavailable World links are omitted without sharing private content; direct publication rejects secret fields and cross-campaign pictures',async()=>{
  const draft=await stores.dm.loadDraft('a');draft.pins[0].revealed=true;draft.pins[0].worldEntryId='private-world';
  const saved=await stores.dm.saveDraft({campaignId:'a',input:draft,revision:draft.revision,sourceRevision:draft.sourceRevision});
  const result=await stores.dm.publish({campaignId:'a',draftRevision:saved.revision});assert.equal(result.pins[0].worldEntryId,'');
  const ref=sdk.doc(contexts.dm.firestore(),'campaigns/a/campaignMaps/main/pins/published-place'),row=(await sdk.getDoc(ref)).data();
  for(const change of [{privateNotes:'SECRET'},{revealed:false},{picturePath:'campaign-map-place-images/b/published-place/first'},{x:101}])await assertFails(sdk.setDoc(ref,{...row,...change}));
  await assert.rejects(stores.dm.publish({campaignId:'a',draftRevision:result.draft.revision,isCurrent:()=>false}),/access changed/);
  await env.withSecurityRulesDisabled(c=>sdk.updateDoc(sdk.doc(c.firestore(),'campaigns/a/members/player'),{status:'inactive'}));
  await assertFails(stores.player.load('a'));await assertFails(read('player','campaign-map-place-images/a/published-place/first'));
 });
 await check('A first publication supports 100 places atomically without a legacy map or permission-budget overflow',async()=>{
  await env.withSecurityRulesDisabled(c=>sdk.setDoc(sdk.doc(c.firestore(),'campaigns/fresh'),{ownerId:'owner'}));
  const pins=Array.from({length:100},(_,i)=>({id:'place-'+i,name:'Place '+i,description:'Public place',type:i%2?'Region':'City',x:i,y:50,revealed:true,picturePath:'',pictureAlt:'',worldEntryId:''}));
  const draft=await stores.owner.saveDraft({campaignId:'fresh',input:{title:'New atlas',imagePath:'campaign-maps/fresh/first',pins},revision:0,sourceRevision:0});
  const result=await stores.owner.publish({campaignId:'fresh',draftRevision:draft.revision});assert.equal(result.map.revision,1);assert.equal((await stores.owner.listPins('fresh',result.map)).length,100);
  const mapRef=sdk.doc(contexts.owner.firestore(),'campaigns/fresh/campaignMaps/main'),pinRef=sdk.doc(contexts.owner.firestore(),'campaigns/fresh/campaignMaps/main/pins/place-0');
  for(const invalid of [{privateNotes:'SECRET'},{picturePath:'campaign-map-place-images/a/place-0/pic'},{x:101},{type:'Secret'},{worldEntryId:'https://example.com'}]){
   await assertFails(sdk.runTransaction(contexts.owner.firestore(),async tx=>{const map=(await tx.get(mapRef)).data(),pin=(await tx.get(pinRef)).data();tx.set(mapRef,{...map,revision:2});tx.set(pinRef,{...pin,publishedRevision:2,revision:2,...invalid});}));
  }
  assert.equal((await stores.owner.load('fresh')).revision,1);
 });
 await check('All five marker styles and named region geometry publish atomically while hidden regions stay private',async()=>{
  const triangle=[{x:10,y:10},{x:70,y:10},{x:40,y:80}],base={description:'Public description',x:40,y:40,type:'City',revealed:true};
  const pins=stores.owner.markerStyles.map((markerStyle,i)=>({...base,id:'style-'+i,name:markerStyle,markerStyle}));
  pins.push({...base,id:'region',name:'Storm Coast',type:'Region',boundary:triangle});
  pins.push({...base,id:'secret-region',name:'Secret territory',type:'Region',boundary:triangle,revealed:false});
  const previous=await stores.owner.loadDraft('fresh'),saved=await stores.owner.saveDraft({campaignId:'fresh',input:{title:'Atlas',imagePath:'campaign-maps/fresh/first',pins},revision:previous.revision,sourceRevision:previous.sourceRevision});
  const result=await stores.owner.publish({campaignId:'fresh',draftRevision:saved.revision});
  const published=await stores.owner.listPins('fresh',result.map);assert.equal(published.length,6);assert.deepEqual(published.find(p=>p.id==='region').boundary,triangle);
  assert.equal(published.some(p=>p.name==='Secret territory'),false);
  for(const style of stores.owner.markerStyles)assert.ok(published.some(p=>p.markerStyle===style));
 });
 await check('Rules reject malformed region vertices, invalid styles and boundary fields outside published geometry',async()=>{
  const db=contexts.owner.firestore(),mapRef=sdk.doc(db,'campaigns/fresh/campaignMaps/main'),pinRef=sdk.doc(db,'campaigns/fresh/campaignMaps/main/pins/region');
  for(const invalid of [{markerStyle:'Injected'},{boundary:'bad'},{boundary:[{x:1,y:1}]},{boundary:[{x:-1,y:0},{x:20,y:20},{x:30,y:0}]},{boundary:Array.from({length:13},(_,i)=>({x:i,y:i}))},{boundary:[{x:0,y:0,secret:'SECRET'},{x:20,y:20},{x:30,y:0}]},{type:'City'}]){
   await assertFails(sdk.runTransaction(db,async tx=>{const map=(await tx.get(mapRef)).data(),pin=(await tx.get(pinRef)).data(),revision=map.revision+1;tx.set(mapRef,{...map,revision});tx.set(pinRef,{...pin,revision,publishedRevision:revision,...invalid});}));
  }
 });
 await check('Overview paths stay private in drafts, publish atomically, and follow replacement and revoked access',async()=>{
  await env.withSecurityRulesDisabled(async c=>{for(const [path,data] of Object.entries({'campaigns/preview':{ownerId:'owner'},'campaigns/preview/members/dm':{role:'dm',status:'active'},'campaigns/preview/members/player':{role:'player',status:'active'}}))await sdk.setDoc(sdk.doc(c.firestore(),path),data);});
  const original='campaign-maps/preview/original',overview='campaign-maps/preview/overview',unused='campaign-maps/preview/unreleased';
  for(const path of [original,overview,unused]){await assertSucceeds(upload('dm',path));await assertFails(read('player',path));}
  const draft=await stores.dm.saveDraft({campaignId:'preview',input:{title:'Overview atlas',imagePath:original,previewPath:overview,pins:[]},revision:0,sourceRevision:0});assert.equal(draft.previewPath,overview);
  const ref=sdk.doc(contexts.dm.firestore(),'campaigns/preview/campaignMapDrafts/main'),row=(await sdk.getDoc(ref)).data();
  for(const previewPath of ['campaign-maps/a/cross','https://example.com/map.png','',null,42,'campaign-maps/preview/'+ 'x'.repeat(101)])await assertFails(sdk.setDoc(ref,{...row,revision:2,previewPath}));
  for(const uid of ['player','revoked','outsider','admin']){await assertFails(stores[uid].loadDraft('preview'));await assertFails(stores[uid].saveDraft({campaignId:'preview',input:draft,revision:1,sourceRevision:0}));await assertFails(read(uid,overview));}
  const first=await stores.dm.publish({campaignId:'preview',draftRevision:draft.revision});assert.equal(first.map.previewPath,overview);
  for(const path of [original,overview])await assertSucceeds(read('player',path));await assertFails(read('player',unused));
  for(const uid of ['revoked','outsider','admin'])await assertFails(read(uid,overview));
  const mapRef=sdk.doc(contexts.dm.firestore(),'campaigns/preview/campaignMaps/main'),map=(await sdk.getDoc(mapRef)).data();
  for(const previewPath of ['campaign-maps/a/cross','https://example.com/map.png','',null,42])await assertFails(sdk.setDoc(mapRef,{...map,revision:2,previewPath}));
  const nextOriginal='campaign-maps/preview/next-original',nextOverview='campaign-maps/preview/next-overview';for(const path of [nextOriginal,nextOverview])await upload('dm',path);
  const next=await stores.dm.saveDraft({campaignId:'preview',input:{...first.draft,imagePath:nextOriginal,previewPath:nextOverview},revision:first.draft.revision,sourceRevision:first.draft.sourceRevision});
  await assertSucceeds(read('player',overview));await assertFails(read('player',nextOverview));
  await stores.dm.publish({campaignId:'preview',draftRevision:next.revision});
  for(const path of [nextOriginal,nextOverview])await assertSucceeds(read('player',path));
  for(const path of [original,overview]){await assertFails(read('player',path));await assertSucceeds(read('dm',path));}
  await env.withSecurityRulesDisabled(c=>sdk.updateDoc(sdk.doc(c.firestore(),'campaigns/preview/members/player'),{status:'inactive'}));
  for(const path of [nextOriginal,nextOverview])await assertFails(read('player',path));
  await env.withSecurityRulesDisabled(c=>sdk.updateDoc(sdk.doc(c.firestore(),'campaigns/preview'),{status:'deleted',deletedAt:sdk.Timestamp.now(),deletedBy:'owner'}));
  for(const uid of ['owner','dm','player'])for(const path of [nextOriginal,nextOverview])await assertFails(read(uid,path));
 });
 await check('Named maps have separate private drafts, images, places and atomic publications',async()=>{
  await env.withSecurityRulesDisabled(async c=>{for(const [path,data] of Object.entries({'campaigns/multi':{ownerId:'owner'},'campaigns/multi/members/dm':{role:'dm',status:'active'},'campaigns/multi/members/player':{role:'player',status:'active'}}))await sdk.setDoc(sdk.doc(c.firestore(),path),data);});
  const north=createCampaignMapStore({...sdk,db:contexts.dm.firestore(),auth:{currentUser:{uid:'dm'}}},{mapId:'north'}),south=createCampaignMapStore({...sdk,db:contexts.dm.firestore(),auth:{currentUser:{uid:'dm'}}},{mapId:'south'});
  const picture='campaign-map-place-images/multi/north/town/first',pin={id:'town',name:'North town',description:'Public northern town',x:30,y:40,type:'City',revealed:true,picturePath:picture,pictureAlt:'Northern town',worldEntryId:''};
  for(const path of ['campaign-maps/multi/north/original','campaign-maps/multi/north/overview','campaign-maps/multi/south/original',picture]){await upload('dm',path);await assertFails(read('player',path));}
  const draft=await north.saveDraft({campaignId:'multi',input:{title:'Northlands',imagePath:'campaign-maps/multi/north/original',previewPath:'campaign-maps/multi/north/overview',pins:[pin,{...pin,id:'secret',name:'PRIVATE NORTH',revealed:false,picturePath:'',pictureAlt:''}]},revision:0,sourceRevision:0});
  await south.saveDraft({campaignId:'multi',input:{title:'PRIVATE SOUTH',imagePath:'campaign-maps/multi/south/original',pins:[]},revision:0,sourceRevision:0});
  await north.publish({campaignId:'multi',draftRevision:draft.revision});
  assert.deepEqual((await stores.player.listMaps('multi')).map(row=>row.title),['Northlands']);assert.equal((await stores.dm.listMaps('multi',{drafts:true})).length,2);
  for(const uid of ['player','outsider','revoked','admin'])await assertFails(stores[uid].listMaps('multi',{drafts:true}));
  for(const path of ['campaign-maps/multi/north/original','campaign-maps/multi/north/overview',picture])await assertSucceeds(read('player',path));await assertFails(read('player','campaign-maps/multi/south/original'));
  const playerNorth=createCampaignMapStore({...sdk,db:contexts.player.firestore(),auth:{currentUser:{uid:'player'}}},{mapId:'north'});assert.equal((await playerNorth.listPins('multi',await playerNorth.load('multi'))).length,1);
  await assertFails(sdk.getDoc(sdk.doc(contexts.player.firestore(),'campaigns/multi/campaignMaps/north/pins/secret')));
  await assert.rejects(south.saveDraft({campaignId:'multi',input:{title:'Wrong map',imagePath:'campaign-maps/multi/north/original',pins:[]},revision:1,sourceRevision:0}),/belonging/);
  const ref=sdk.doc(contexts.dm.firestore(),'campaigns/multi/campaignMapDrafts/south'),old=(await sdk.getDoc(ref)).data();
  for(const imagePath of ['campaign-maps/multi/north/original','campaign-maps/a/first','https://example.com/map.png'])await assertFails(sdk.setDoc(ref,{...old,revision:2,imagePath}));
 });
 await check('Only campaign DMs organise maps; main selection requires a publication and rejects malformed or stale preferences',async()=>{
  let prefs=await stores.dm.savePreferences({campaignId:'multi',order:['south','north'],mainMapId:'north',revision:0});assert.equal((await stores.player.loadPreferences('multi')).mainMapId,'north');
  assert.equal((await sdk.getDoc(sdk.doc(contexts.dm.firestore(),'campaigns/multi/campaignMaps/north'))).data().revision,1,'Reordering never changes map/pin publication revisions');
  await assert.rejects(stores.dm.savePreferences({campaignId:'multi',order:['south','north'],mainMapId:'south',revision:1}),/Publish/);
  await assert.rejects(stores.dm.savePreferences({campaignId:'multi',order:['north'],mainMapId:'north',revision:0}),/changed/);
  await assert.rejects(stores.dm.savePreferences({campaignId:'multi',order:['north'],mainMapId:'north',revision:1,isCurrent:()=>false}),/access changed/);
  for(const uid of ['player','outsider','revoked','admin'])await assertFails(stores[uid].savePreferences({campaignId:'multi',order:['north'],mainMapId:'north',revision:1}));
  const ref=sdk.doc(contexts.dm.firestore(),'campaigns/multi/mapPreferences/main');
  for(const change of [{order:['north','north']},{order:[42]},{order:['bad/path']},{order:Array.from({length:51},(_,i)=>'map-'+i)},{mainMapId:'south'},{mainMapId:'bad/path'},{updatedBy:'player'},{privateNotes:'SECRET'}])await assertFails(sdk.setDoc(ref,{...prefs,revision:2,...change}));
  prefs=await stores.dm.savePreferences({campaignId:'multi',order:Array.from({length:50},(_,i)=>'map-'+i),mainMapId:'north',revision:1});assert.equal(prefs.order.length,50);
 });
 await check('Identical pin identifiers stay isolated across maps; replacement, revocation and campaign deletion protect all maps',async()=>{
  const make=(uid,mapId)=>createCampaignMapStore({...sdk,db:contexts[uid].firestore(),auth:{currentUser:{uid}}},{mapId}),north=make('dm','north'),south=make('dm','south');
  const picture='campaign-map-place-images/multi/south/town/first';await upload('dm',picture);
  const previous=await south.loadDraft('multi'),saved=await south.saveDraft({campaignId:'multi',input:{...previous,title:'Southlands',pins:[{id:'town',name:'South town',description:'Southern town',x:60,y:50,type:'City',revealed:true,picturePath:picture,pictureAlt:'South town',worldEntryId:''}]},revision:previous.revision,sourceRevision:previous.sourceRevision});await south.publish({campaignId:'multi',draftRevision:saved.revision});
  for(const key of ['north','south']){const store=make('player',key);assert.equal((await store.listPins('multi',await store.load('multi')))[0].name,key==='north'?'North town':'South town');}
  await assertSucceeds(read('player',picture));
  const draft=await north.loadDraft('multi');await upload('dm','campaign-maps/multi/north/replacement');delete draft.previewPath;draft.imagePath='campaign-maps/multi/north/replacement';draft.pins=[];
  const next=await north.saveDraft({campaignId:'multi',input:draft,revision:draft.revision,sourceRevision:draft.sourceRevision});await north.publish({campaignId:'multi',draftRevision:next.revision});
  await assertFails(read('player','campaign-maps/multi/north/original'));await assertFails(read('player','campaign-maps/multi/north/overview'));await assertFails(read('player','campaign-map-place-images/multi/north/town/first'));await assertSucceeds(read('player',picture));await assertSucceeds(read('player','campaign-maps/multi/south/original'));
  await env.withSecurityRulesDisabled(c=>sdk.updateDoc(sdk.doc(c.firestore(),'campaigns/multi/members/player'),{status:'inactive'}));
  await assertFails(stores.player.listMaps('multi'));await assertFails(stores.player.loadPreferences('multi'));await assertFails(read('player',picture));
  await env.withSecurityRulesDisabled(c=>sdk.updateDoc(sdk.doc(c.firestore(),'campaigns/multi'),{deletedAt:sdk.Timestamp.now(),deletedBy:'owner'}));
  for(const uid of ['owner','dm','player']){await assertFails(stores[uid].listMaps('multi'));await assertFails(read(uid,'campaign-maps/multi/south/original'));}
 });
 console.log('SUCCESS',count,'map Firestore/Storage permission checks');
}finally{await env.cleanup();}})().catch(e=>{console.error(e);process.exitCode=1});
