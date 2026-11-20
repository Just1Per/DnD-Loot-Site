'use strict';
function createAccountNotificationFeed(sdk,{changed=()=>{},failed=()=>{}}={}){
 const {db,auth,doc,collection,query,where,orderBy,limit,onSnapshot,runTransaction,getDoc}=sdk;
 let session=null,generation=0;
 const sourceKey=parts=>parts.map(v=>encodeURIComponent(String(v)).replace(/[!~]/g,c=>c==='!'?'%21':'%7E')).join('~');
 const rows=snap=>snap.docs.map(d=>({...d.data(),id:d.id}));
 const live=s=>session===s&&auth.currentUser?.uid===s.uid;
 function stopNode(node){if(!node?.alive)return;node.alive=false;for(const child of node.children.values())stopNode(child);node.stops.forEach(stop=>stop());node.tokens.forEach(t=>{node.session.pending.delete(t);node.session.errors.delete(t);});if(node.group)node.session.groups.delete(node.group.key);}
 function node(s,parent){const n={session:s,alive:true,stops:[],children:new Map(),tokens:[]};n.current=()=>live(s)&&n.alive&&(!parent||parent.current());return n;}
 function watch(n,reference,next,label,onError){
  const token={};n.tokens.push(token);n.session.pending.add(token);
  n.stops.push(onSnapshot(reference,value=>{if(n.current()){n.session.pending.delete(token);n.session.errors.delete(token);next(value);changed();}},error=>{if(n.current()){n.session.pending.delete(token);if(onError)onError(error);else{for(const child of n.children.values())stopNode(child);n.children.clear();if(n.group)n.group.items=[];}n.session.errors.set(token,label);failed(label,error);changed();}}));
 }
 function group(s,parent,parts,context=()=>({})){
  const n=node(s,parent),key=sourceKey(parts),g={key,node:n,items:[],read:new Set(),dismissed:new Set(),stateReady:!s.available,context};n.group=g;s.groups.set(key,g);
  if(s.available)watch(n,doc(db,'users',s.uid,'notificationState',key),snap=>{const d=snap.data()||{};g.read=new Set(Array.isArray(d.read)?d.read.filter(x=>typeof x==='string'):[]);g.dismissed=new Set(Array.isArray(d.dismissed)?d.dismissed.filter(x=>typeof x==='string'):[]);g.stateReady=true;},'Notification read state');
  return n;
 }
 function set(n,items){if(n.current())n.group.items=items.filter(row=>typeof row.id==='string'&&Number.isSafeInteger(row.createdAt)&&row.createdAt>0&&Number.isFinite(new Date(row.createdAt).getTime())&&row.actorId!==n.session.uid);}
 function reconcile(parent,records,build,update=()=>{}){
  const ids=new Set(records.map(r=>r.id));for(const [key,child] of parent.children)if(!ids.has(key)){stopNode(child);parent.children.delete(key);}
  for(const record of records){let child=parent.children.get(record.id);if(!child){child=build(record);parent.children.set(record.id,child);}update(child,record);}
 }
 function ownCharacters(s,parent,base,campaign,adventureId=null,adventure=null){
  const n=node(s,parent);
  watch(n,query(collection(db,...base,'characters'),where('userId','==',s.uid)),snap=>{
   reconcile(n,rows(snap).filter(c=>c.active!==false&&c.userId===s.uid),character=>{
    const child=group(s,n,['character',campaign.id,adventureId?'adventure':'campaign',adventureId||'',character.id],()=>({campaignId:campaign.id,campaignName:campaign.data.name||'Campaign',characterId:character.id,characterName:child.character.name||'Character',adventureId,adventureName:adventure?.title||''}));child.character=character;
    watch(child,query(collection(db,...base,'characterNotifications',character.id,'entries'),orderBy('createdAt','desc'),limit(20)),events=>{const entries=rows(events),latestNote=entries.filter(e=>e.kind==='dm-notes').sort((a,b)=>b.version-a.version)[0];set(child,entries.filter(e=>e.kind==='loot'||e===latestNote).map(e=>({id:e.id,kind:e.kind,createdAt:e.createdAt,actorId:e.actorId,sourceId:e.sourceId,quantity:e.quantity})));}, 'Character notifications');
    return child;
   },(child,character)=>{child.character=character;});
  },'Character notification access');return n;
 }
 function campaign(s,parent,id){
  const n=node(s,parent),c={id,data:{},member:null};let started=false,managerRole=null;
  const refresh=()=>{
   if(!c.data.ownerId)return;
   const manager=c.data.ownerId===s.uid||c.member?.status==='active'&&c.member.role==='dm';
   if(!manager&&c.member?.status!=='active'){for(const ch of n.children.values())stopNode(ch);n.children.clear();started=false;return;}
   if(started&&managerRole!==manager){for(const ch of n.children.values())stopNode(ch);n.children.clear();started=false;}
   if(started)return;started=true;managerRole=manager;
   n.children.set('main',ownCharacters(s,n,['campaigns',id],c));
   const shots=node(s,n),parts=new Map();n.children.set('adventures',shots);
   const updateShots=()=>{
    const all=new Map();for(const list of parts.values())for(const shot of list)if((all.get(shot.id)?.revision||0)<shot.revision)all.set(shot.id,shot);
    reconcile(shots,[...all.values()].filter(r=>r.data?.approved),shot=>{
     const a=node(s,shots),base=['campaigns',id,'oneShots',shot.id];a.shot=shot;
     const setup=participant=>{
      a.participant=participant;
      const permitted=manager||a.shot.data?.hostUid===s.uid||participant?.status==='accepted';
      if(!permitted){for(const ch of a.children.values())stopNode(ch);a.children.clear();return;}
      if(!a.children.has('characters'))a.children.set('characters',ownCharacters(s,a,base,c,shot.id,a.shot));
     };
     a.refresh=()=>setup(a.participant);
     watch(a,doc(db,...base,'participants',s.uid),participant=>setup(participant.data()),'Adventure notification access');return a;
    },(a,shot)=>{Object.assign(a.shot,shot);a.refresh?.();});
   };
   for(const [field,op] of [['createdBy','=='],['data.hostUid','=='],['data.participantUids','array-contains']])watch(shots,query(collection(db,'campaigns',id,'oneShots'),where(field,op,s.uid)),snap=>{parts.set(field,rows(snap));updateShots();},'Adventure notifications');
  };
  watch(n,doc(db,'campaigns',id),snap=>{if(!snap.exists()||snap.data().deletedAt){c.data={};for(const ch of n.children.values())stopNode(ch);n.children.clear();started=false;return;}c.data=snap.data();refresh();},'Campaign notification access');
  watch(n,doc(db,'campaigns',id,'members',s.uid),snap=>{c.member=snap.data();refresh();},'Campaign membership');return n;
 }
 async function start({uid,email=''}){
  stop();if(!uid||auth.currentUser?.uid!==uid)return;
  const s={uid,generation:++generation,groups:new Map(),errors:new Map(),pending:new Set(),available:false};session=s;s.root=node(s);
  try{await getDoc(doc(db,'users',uid,'notificationState','_capability'));if(!live(s))return;s.available=true;}
  catch(error){if(!live(s))return;s.errors.set('capability','Notification read state');failed('Notification read state',error);}
  const index=node(s,s.root);s.root.children.set('campaigns',index);
  watch(index,collection(db,'users',uid,'campaigns'),snap=>reconcile(index,rows(snap).filter(c=>c.status==='active'),c=>campaign(s,index,c.id)),'Campaign notifications');
  const invites=group(s,s.root,['invitations']),parts=new Map();s.root.children.set('invitations',invites);
  const updateInvites=()=>{const all=new Map();for(const list of parts.values())for(const r of list){const time=x=>Math.max(x.createdAt||0,x.acceptedAt||0,x.declinedAt||0,x.canceledAt||0);if(!all.has(r.id)||time(r)>=time(all.get(r.id)))all.set(r.id,r);}set(invites,[...all.values()].filter(i=>i.status==='pending').sort((a,b)=>b.createdAt-a.createdAt).slice(0,100).map(i=>({id:i.id+'_'+i.createdAt,inviteId:i.id,kind:'invitation',createdAt:i.createdAt,campaignId:i.campaignId,campaignName:i.campaignName||'Campaign'})));};
  for(const [field,value] of [['targetUid',uid],['emailLower',email.trim().toLowerCase()]])if(value)watch(invites,query(collection(db,'campaignInvites'),where(field,'==',value)),snap=>{parts.set(field,rows(snap));updateInvites();},'Campaign invitations',()=>{parts.delete(field);updateInvites();});
  const own=group(s,s.root,['approval']),admin=node(s,s.root);s.root.children.set('approval',own);s.root.children.set('admin',admin);
  watch(own,doc(db,'dmRequests',uid),snap=>{const r=snap.data();set(own,r&&['approved','rejected','revoked'].includes(r.status)?[{id:r.status+'_'+(r.reviewedAt||r.updatedAt),kind:'approval',status:r.status,createdAt:r.reviewedAt||r.updatedAt}]:[]);},'DM application status');
  watch(admin,doc(db,'users',uid),snap=>{
   const roles=snap.data()?.role,isAdmin=Array.isArray(roles)?roles.includes('admin'):roles==='admin';
   if(!isAdmin){for(const ch of admin.children.values())stopNode(ch);admin.children.clear();return;}
   if(admin.children.has('requests'))return;const requests=group(s,admin,['admin-approvals']);admin.children.set('requests',requests);
   watch(requests,query(collection(db,'dmRequests'),where('status','==','pending'),limit(50)),snap=>set(requests,rows(snap).map(r=>({id:r.id+'_'+r.submittedAt,kind:'approval-request',createdAt:r.submittedAt,applicantName:r.name||'Player',applicantUid:r.id}))), 'DM applications');
  },'Account notification access');changed();
 }
 function stop(){const old=session;session=null;++generation;if(old)stopNode(old.root);changed();}
 function all(){const s=session;if(!s||!live(s))return[];return [...s.groups.values()].flatMap(g=>!g.stateReady?[]:g.items.map(row=>({...row,...g.context(),groupKey:g.key,key:g.key+'!'+row.id,read:g.read.has(row.id),dismissed:g.dismissed.has(row.id)}))).sort((a,b)=>b.createdAt-a.createdAt||a.key.localeCompare(b.key));}
 async function mark(keys,{dismiss=false}={}){
  const s=session;if(!s||!live(s)||!s.available)throw Error('Notification read state is unavailable. Try Refresh.');
  const selected=all().filter(r=>keys.includes(r.key)),byGroup=new Map();for(const row of selected){if(!byGroup.has(row.groupKey))byGroup.set(row.groupKey,[]);byGroup.get(row.groupKey).push(row.id);}
  const result=await Promise.allSettled([...byGroup].map(([key,ids])=>runTransaction(db,async tx=>{
   const path=doc(db,'users',s.uid,'notificationState',key),previous=await tx.get(path);if(!live(s))throw Error('Account changed.');
   const value=previous.data()||{},clean=a=>Array.isArray(a)?a.filter(x=>typeof x==='string'&&x.length<=700):[];
   const read=[...new Set([...clean(value.read),...ids])].slice(-200),dismissed=[...new Set([...clean(value.dismissed),...(dismiss?ids:[])])].slice(-200);
   tx.set(path,{read,dismissed,updatedAt:Date.now()});
  })));
  if(!live(s))return;const rejection=result.find(r=>r.status==='rejected');if(rejection)throw rejection.reason;
  // Real snapshots synchronize other devices; also paint promptly after a commit.
  for(const row of selected){const g=s.groups.get(row.groupKey);if(g){g.read.add(row.id);if(dismiss)g.dismissed.add(row.id);}}changed();
 }
 return{start,stop,mark,all,sourceKey,get available(){return !!session&&live(session)&&session.available;},get loading(){return !!session&&live(session)&&session.pending.size>0;},get errors(){return session?[...new Set(session.errors.values())]:[];}};
}
if(typeof module!=='undefined')module.exports={createAccountNotificationFeed};
