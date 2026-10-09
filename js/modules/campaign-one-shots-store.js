'use strict';
/** One-shot invitations and characters have their own namespace and bounded roster counter. */
function createCampaignOneShotStore(sdk){
 const {db,auth,doc,collection,getDoc,getDocs,query,where,runTransaction}=sdk;
 const uid=()=>{if(!auth.currentUser?.uid)throw Error('Sign in first.');return auth.currentUser.uid;};
 const valid=value=>{if(!/^[a-zA-Z0-9_-]{1,100}$/.test(value||''))throw Error('Invalid one-shot path.');return value;};
 const base=(campaignId,shotId)=>['campaigns',valid(campaignId),'oneShots',valid(shotId)];
 async function accessible(campaignId,dm=false){const actor=uid(),root=collection(db,'campaigns',valid(campaignId),'oneShots');const lists=dm?[await getDocs(root)]:await Promise.all([getDocs(query(root,where('createdBy','==',actor))),getDocs(query(root,where('data.hostUid','==',actor))),getDocs(query(root,where('data.participantUids','array-contains',actor)))]);return [...new Map(lists.flatMap(list=>list.docs.map(row=>[row.id,{...row.data(),id:row.id}]))).values()];}
 async function invite(campaignId,shotId,participantUid){const actor=uid();valid(participantUid);return runTransaction(db,async tx=>{const shotRef=doc(db,...base(campaignId,shotId)),shot=await tx.get(shotRef);if(!shot.exists())throw Error('One-shot not found.');const target=doc(db,...base(campaignId,shotId),'participants',participantUid),old=await tx.get(target);const data=shot.data();data.data.participantUids||=[];if(!data.data.participantUids.includes(participantUid))data.data.participantUids.push(participantUid);if(data.data.participantUids.length>20)throw Error('One-shot limit: 20 invited participants.');data.revision++;data.updatedBy=actor;data.updatedAt=Date.now();tx.set(shotRef,data);if(!old.exists())tx.set(target,{uid:participantUid,status:'invited',invitedBy:actor,updatedAt:Date.now()});});}
 async function respond(campaignId,shotId,status){const actor=uid();if(!['accepted','declined'].includes(status))throw Error('Choose accept or decline.');return runTransaction(db,async tx=>{const target=doc(db,...base(campaignId,shotId),'participants',actor),old=await tx.get(target);if(!old.exists())throw Error('Invitation not found.');tx.update(target,{status,updatedAt:Date.now()});});}
 async function roster(campaignId,shotId,manager){const actor=uid(),root=collection(db,...base(campaignId,shotId),'characters'),result=await getDocs(manager?root:query(root,where('userId','==',actor)));return result.docs.map(row=>({...row.data(),id:row.id}));}
 async function createCharacter({campaignId,shotId,id,userId='',name='New one-shot character'}){const actor=uid();valid(id);return runTransaction(db,async tx=>{const root=base(campaignId,shotId),shot=await tx.get(doc(db,...root)),counterRef=doc(db,...root,'rosterState','main'),counter=await tx.get(counterRef),target=doc(db,...root,'characters',id);if(!shot.exists())throw Error('Invalid or existing one-shot character.');const count=(counter.data()?.count||0)+1;if(count>20)throw Error('A one-shot supports up to 20 character sheets.');const character={name:String(name).trim().slice(0,160)||'New one-shot character',class:'',level:1,userId,createdBy:actor,createdAt:Date.now(),active:true,sequence:count};tx.set(counterRef,{count,lastCharacterId:id,updatedBy:actor});tx.set(target,character);return{...character,id};});}
 async function assign(campaignId,shotId,id,userId){uid();return runTransaction(db,async tx=>{const target=doc(db,...base(campaignId,shotId),'characters',valid(id)),old=await tx.get(target);if(!old.exists())throw Error('Character not found.');tx.update(target,{userId});});}
 /** Combat copies are host-private documents; templates and campaign combat remain untouched. */
 function encounters(campaignId,shotId){
  const root=base(campaignId,shotId).concat('encounters'),normalizer=(typeof module!=='undefined'?require('./campaign-workspace-store').createCampaignWorkspaceStore:createCampaignWorkspaceStore)(sdk);
  return {
   async list(){uid();const result=await getDocs(collection(db,...root));return result.docs.map(row=>({...row.data(),id:row.id}));},
   async load(_,kind,id){uid();const row=await getDoc(doc(db,...root,valid(id)));if(!row.exists())throw Error('Encounter not found.');const record={...row.data(),id};record.privateNotes=record.data.runNotes||'';return record;},
   async save({id,revision,input}){const actor=uid(),fields=normalizer.normalize('encounter',input);return runTransaction(db,async tx=>{
    const target=doc(db,...root,valid(id)),snapshot=await tx.get(target),old=snapshot.data();
    if((old?.revision||0)!==revision)throw Error('Encounter changed in another window. Reload after copying your draft.');
    const now=Date.now(),{privateNotes,...publicFields}=fields;publicFields.data.runNotes=privateNotes;
    const next={...publicFields,kind:'encounter',schemaVersion:1,revision:revision+1,createdBy:old?.createdBy||actor,createdAt:old?.createdAt||now,updatedBy:actor,updatedAt:now};
    tx.set(target,next);return {...next,id,privateNotes};
   });}
  };
 }
 return{accessible,invite,respond,roster,createCharacter,assign,encounters};
}
if(typeof module!=='undefined')module.exports={createCampaignOneShotStore};
