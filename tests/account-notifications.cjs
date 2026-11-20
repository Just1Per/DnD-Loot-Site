'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {createAccountNotificationFeed}=require('../js/modules/account-notification-feed');
const {createCharacterSheetStore}=require('../js/modules/character-sheet-store');
const {createCampaignStore}=require('../js/modules/campaign-store');
function fixture(seed={}){
 const docs=new Map(Object.entries(seed)),watchers=[],sdk={db:{},auth:{currentUser:{uid:'player'}},notificationsAvailable:()=>true,doc:(_,...p)=>p.join('/'),collection:(_,...p)=>p.join('/'),where:(field,op,value)=>({field,op,value}),orderBy:(order,direction)=>({order,direction}),limit:count=>({count}),query:(path,...filters)=>({path,filters}),increment:n=>({__increment:n})};
 const snapshot=path=>({id:path.split('/').at(-1),exists:()=>docs.has(path),data:()=>structuredClone(docs.get(path))});
 sdk.getDoc=async path=>{if(sdk.denyState&&path.includes('/notificationState/'))throw Object.assign(Error('Rules missing'),{code:'permission-denied'});return snapshot(path);};
 function deliver(w){if(!w.active)return;try{if(typeof w.ref==='string'&&w.ref.split('/').length%2===0)return w.next(snapshot(w.ref));const path=w.ref.path||w.ref,filters=w.ref.filters||[];let found=[...docs.keys()].filter(k=>k.startsWith(path+'/')&&!k.slice(path.length+1).includes('/')).map(snapshot);for(const f of filters){if(f.field)found=found.filter(s=>{const v=f.field.split('.').reduce((o,k)=>o?.[k],s.data());return f.op==='array-contains'?v?.includes(f.value):v===f.value;});if(f.order)found.sort((a,b)=>(a.data()[f.order]-b.data()[f.order])*(f.direction==='desc'?-1:1));if(f.count)found=found.slice(0,f.count);}w.next({docs:found});}catch(e){w.error(e);}}
 const emit=()=>watchers.filter(w=>w.active).forEach(w=>queueMicrotask(()=>deliver(w)));
 sdk.onSnapshot=(ref,next,error)=>{const w={ref,next,error,active:true};watchers.push(w);queueMicrotask(()=>deliver(w));return()=>{w.active=false;};};
 sdk.runTransaction=async(_,work)=>{const writes=[];const result=await work({get:async p=>{assert.equal(writes.length,0,'Firestore reads precede writes');return snapshot(p);},set:(p,d)=>writes.push([p,d]),update:(p,d)=>{const current={...docs.get(p)};for(const [k,v] of Object.entries(d))current[k]=v?.__increment!==undefined?(current[k]||0)+v.__increment:v;writes.push([p,current]);},delete:p=>writes.push([p,null])});for(const [p,d] of writes)if(d===null)docs.delete(p);else docs.set(p,structuredClone(d));emit();return result;};
 const flush=async()=>{for(let i=0;i<5;i++)await new Promise(r=>setTimeout(r,0));};
 return{sdk,docs,watchers,emit,flush};
}
const seed=()=>({
 'users/player':{role:['player']},'users/player/campaigns/a':{status:'active',role:'player'},'campaigns/a':{ownerId:'dm',name:'Coast'},'campaigns/a/members/player':{status:'active',role:'player'},
 'campaigns/a/characters/c1':{userId:'player',name:'Thorin',active:true},'campaigns/a/characters/c2':{userId:'other',name:'Secret',active:true},
 'campaigns/a/characterNotifications/c1/entries/notes_1':{kind:'dm-notes',createdAt:10,version:1,actorId:'dm',sourceId:'c1',quantity:0},
 'campaigns/a/characterNotifications/c1/entries/notes_2':{kind:'dm-notes',createdAt:20,version:2,actorId:'dm',sourceId:'c1',quantity:0},
 'campaigns/a/characterNotifications/c1/entries/loot_a':{kind:'loot',createdAt:30,version:30,actorId:'dm',sourceId:'c1__item',quantity:2},
 'campaigns/a/characterNotifications/c2/entries/notes_1':{kind:'dm-notes',createdAt:40,version:1,actorId:'dm',sourceId:'c2',quantity:0},
 'campaignInvites/i1':{targetUid:'player',emailLower:'p@example.test',status:'pending',createdAt:35,campaignId:'b',campaignName:'Other campaign'},
 'dmRequests/player':{status:'approved',reviewedAt:45}
});
test('Live feed deduplicates email/UID invitations, coalesces DM notes and reads only owned-character notices',async()=>{
 const f=fixture(seed()),feed=createAccountNotificationFeed(f.sdk);await feed.start({uid:'player',email:'p@example.test'});await f.flush();
 assert.equal(feed.loading,false);assert.notEqual(feed.sourceKey(['a~b','c']),feed.sourceKey(['a','b~c']));assert.notEqual(feed.sourceKey(['a!b']),feed.sourceKey(['a%21b']));assert.equal(feed.all().length,4);assert.deepEqual(new Set(feed.all().map(r=>r.kind)),new Set(['dm-notes','loot','invitation','approval']));
 assert.equal(feed.all().find(r=>r.kind==='dm-notes').id,'notes_2');assert.equal(feed.all().find(r=>r.kind==='loot').characterName,'Thorin');assert.ok(!f.watchers.some(w=>JSON.stringify(w.ref).includes('characterNotifications/c2')));
 f.docs.get('campaignInvites/i1').status='canceled';f.docs.get('campaignInvites/i1').canceledAt=50;f.emit();await f.flush();assert.equal(feed.all().filter(r=>r.kind==='invitation').length,0);feed.stop();
});
test('Read and dismissed state persists across devices without changing source content; new notes remain unread',async()=>{
 const f=fixture(seed()),one=createAccountNotificationFeed(f.sdk),two=createAccountNotificationFeed(f.sdk);await one.start({uid:'player',email:'p@example.test'});await two.start({uid:'player',email:'p@example.test'});await f.flush();
 const note=one.all().find(r=>r.kind==='dm-notes'),loot=one.all().find(r=>r.kind==='loot');await one.mark([note.key]);await f.flush();assert.equal(two.all().find(r=>r.key===note.key).read,true);
 await two.mark([loot.key],{dismiss:true});await f.flush();assert.equal(one.all().find(r=>r.key===loot.key).dismissed,true);assert.ok(f.docs.has('campaigns/a/characterNotifications/c1/entries/loot_a'));
 f.docs.set('campaigns/a/characterNotifications/c1/entries/notes_3',{kind:'dm-notes',createdAt:60,version:3,actorId:'dm',sourceId:'c1'});f.emit();await f.flush();assert.equal(one.all().find(r=>r.kind==='dm-notes').read,false);one.stop();two.stop();
});
test('Membership/ownership changes and account switching remove stale content and ignore late snapshots',async()=>{
 const f=fixture(seed()),feed=createAccountNotificationFeed(f.sdk);await feed.start({uid:'player'});await f.flush();
 f.docs.get('campaigns/a/characters/c1').userId='other';f.emit();await f.flush();assert.ok(feed.all().every(r=>!r.characterId));
 f.docs.get('campaigns/a/characters/c1').userId='player';f.emit();await f.flush();assert.ok(feed.all().some(r=>r.characterId==='c1'));
 f.docs.get('campaigns/a/members/player').status='inactive';f.emit();await f.flush();assert.ok(feed.all().every(r=>!r.characterId));
 const late=f.watchers.find(w=>JSON.stringify(w.ref).includes('characterNotifications/c1'));f.sdk.auth.currentUser={uid:'other'};feed.stop();late.next({docs:[{id:'secret',data:()=>({kind:'dm-notes',createdAt:100,actorId:'dm'})}]});assert.deepEqual(feed.all(),[]);assert.equal(feed.available,false);
});
test('Adventure sheets with reused character IDs have separate sources and lose notifications when participation ends',async()=>{
 const data=seed();Object.assign(data,{
  'campaigns/a/oneShots/main':{revision:1,title:'Island journey',createdBy:'dm',data:{approved:true,hostUid:'host',participantUids:['player']}},
  'campaigns/a/oneShots/main/participants/player':{status:'accepted'},
  'campaigns/a/oneShots/main/characters/c1':{userId:'player',name:'Adventure Thorin',active:true},
  'campaigns/a/oneShots/main/characterNotifications/c1/entries/notes_1':{kind:'dm-notes',version:1,createdAt:70,actorId:'host',sourceId:'c1'}
 });const f=fixture(data),feed=createAccountNotificationFeed(f.sdk);await feed.start({uid:'player'});await f.flush();
 const main=feed.all().find(r=>r.kind==='dm-notes'&&!r.adventureId),adventure=feed.all().find(r=>r.adventureId==='main');assert.ok(adventure);assert.notEqual(main.groupKey,adventure.groupKey);assert.equal(adventure.characterName,'Adventure Thorin');
 f.docs.get('campaigns/a/oneShots/main/participants/player').status='declined';f.emit();await f.flush();assert.ok(!feed.all().some(r=>r.adventureId));assert.ok(feed.all().some(r=>r.kind==='dm-notes'&&!r.adventureId));feed.stop();
});
test('Approval queues follow account admin role and missing notification rules degrade without granting writes',async()=>{
 const data=seed();data['users/player'].role=['admin'];data['dmRequests/other']={status:'pending',name:'Other',submittedAt:55};const f=fixture(data),feed=createAccountNotificationFeed(f.sdk);await feed.start({uid:'player'});await f.flush();assert.ok(feed.all().some(r=>r.kind==='approval-request'));
 f.docs.get('users/player').role=['player'];f.emit();await f.flush();assert.ok(!feed.all().some(r=>r.kind==='approval-request'));feed.stop();
 f.sdk.denyState=true;await feed.start({uid:'player'});await f.flush();assert.equal(feed.available,false);await assert.rejects(feed.mark(feed.all().map(r=>r.key)),/unavailable/);assert.ok(feed.errors.length);feed.stop();
});
test('Saved DM-note changes create reference-only events atomically; ordinary saves and self-edits do not',async()=>{
 const f=fixture({'campaigns/a/characters/c1':{userId:'player',name:'Thorin',class:'Wizard',level:4}});f.sdk.auth.currentUser={uid:'dm'};const store=createCharacterSheetStore(f.sdk),request={campaignId:'a',characterId:'c1',revision:0,data:{dmNotes:'Private text'},identity:{name:'Thorin',class:'Wizard',level:4},previousIdentity:{name:'Thorin',class:'Wizard',level:4}};
 await store.save(request);const event=f.docs.get('campaigns/a/characterNotifications/c1/entries/notes_1');assert.equal(event.kind,'dm-notes');assert.ok(!JSON.stringify(event).includes('Private text'));await store.save({...request,revision:1});assert.equal([...f.docs.keys()].filter(k=>k.includes('/entries/')).length,1);
 f.sdk.notificationsAvailable=()=>false;await store.save({...request,revision:2,data:{dmNotes:'Updated before notification rules'}});assert.equal([...f.docs.keys()].filter(k=>k.includes('/entries/')).length,1);
});
test('DM assignment and transfer notify the receiving character; claiming, consuming and self-assignment do not',async()=>{
 const data={'campaigns/a':{ownerId:'dm',inventoryVersion:2},'campaigns/a/characters/c1':{userId:'player',active:true},'campaigns/a/characters/c2':{userId:'other',active:true},'campaigns/a/characters/self':{userId:'dm',active:true},'campaigns/a/items/item':{name:'Sword',visible:true,lootMode:'player'},'campaigns/a/supply/item':{capacity:100,claimed:0,unlimited:false,revision:1}};
 const f=fixture(data);f.sdk.auth.currentUser={uid:'dm'};const call=createCampaignStore(f.sdk),request={campaignId:'a',itemId:'item',characterId:'c1',quantity:2};
 await call('vaultInventoryAction',{...request,action:'assign'});await call('vaultInventoryAction',{...request,action:'transfer',targetCharacterId:'c2',quantity:1});await call('vaultInventoryAction',{...request,action:'use',quantity:1});await call('vaultInventoryAction',{...request,action:'assign',characterId:'self',quantity:1});
 const events=[...f.docs.entries()].filter(([k])=>k.includes('/characterNotifications/'));assert.equal(events.length,2);assert.ok(events.some(([k,v])=>k.includes('/c1/')&&v.quantity===2));assert.ok(events.some(([k,v])=>k.includes('/c2/')&&v.quantity===1));
});
