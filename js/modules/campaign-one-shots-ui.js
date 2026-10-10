'use strict';
var CampaignOneShots=(()=>{
 const sdk=window.__DND_VAULT_DEPS__,store=createCampaignOneShotStore(sdk),W=CampaignWorkspace;
 const manager=record=>canManageCampaign()||record.data?.approved&&record.data?.hostUid===auth.currentUser?.uid;
 const prep=record=>manager(record)||!record.data?.approved&&record.createdBy===auth.currentUser?.uid;
 function normalize(input={}){const d=structuredClone(input);d.status||='Draft';d.rosterMode||='Mixed';d.hostUid||='';d.participantUids||=[];d.approved=!!d.approved;for(const[key,fallback,max]of [['targetLevel',1,20],['players',4,20],['duration',240,1440]]){const n=d[key]==null?fallback:Number(d[key]);if(!Number.isInteger(n)||n<1||n>max)throw Error(`${key} must be from 1 to ${max}.`);d[key]=n;}return d;}
 async function loadRecord(campaignId,id){const record=await sdk.getDoc(sdk.doc(sdk.db,'campaigns',campaignId,'oneShots',id));if(!record.exists())throw Error('One-shot not found.');const row={...record.data(),id};if(prep(row)){const secret=await sdk.getDoc(sdk.doc(sdk.db,'campaigns',campaignId,'workspaceSecrets','oneShot-'+id));row.privateNotes=secret.data()?.notes||'';}else row.privateNotes='';return row;}
 async function paint(host,s){
  if(!host?.isConnected)return;const e=escapeHtml,recordId=s.record.id,manage=manager(s.record);
  if(!s.record.revision){host.innerHTML='<p>Save the one-shot before inviting participants or adding character sheets.</p>';return;}
  host.innerHTML='<p>Loading one-shot roster…</p>';
  try{
   const parent=await sdk.getDoc(sdk.doc(sdk.db,'campaigns',s.campaignId,'oneShots',recordId));if(!parent.exists())return;const metadata=parent.data();
   const participant=await sdk.getDoc(sdk.doc(sdk.db,'campaigns',s.campaignId,'oneShots',recordId,'participants',auth.currentUser.uid));
   const members=canManageCampaign()?campaignMembers.filter(row=>row.status!=='inactive'):[];
   const accepted=participant.data()?.status==='accepted';
   const characters=manage||accepted?await store.roster(s.campaignId,recordId,manage):[];
   if(W.session!==s||s.record.id!==recordId||!host.isConnected)return;
   const self=auth.currentUser.uid;
   host.innerHTML=`<section class="workspace-card"><h3>One-shot participants &amp; character sheets</h3><p>Sheets belong only to this adventure. Their HP, resources, notes, inventory and leveling do not update campaign characters.</p>${canManageCampaign()?`<div class="workspace-fields"><label class="workspace-field">Approved one-shot host<select data-shot-host><option value="">Campaign DM runs this adventure</option>${members.map(row=>`<option value="${e(row.uid||row.id)}" ${(row.uid||row.id)===metadata.data.hostUid?'selected':''}>${e(memberLabel(row))}</option>`).join('')}</select></label><label class="workspace-field">Participant to invite<select data-shot-invite>${members.map(row=>`<option value="${e(row.uid||row.id)}">${e(memberLabel(row))}</option>`).join('')}</select></label></div><div class="workspace-actions"><button type="button" data-approve-shot>${metadata.data.approved?'Save host approval':'Approve adventure'}</button><button type="button" data-invite-shot>Invite participant</button></div>`:''}${participant.exists()?`<p>Your invitation: ${e(participant.data().status)}</p><div class="workspace-actions"><button type="button" data-accept-shot>Accept invitation</button><button type="button" data-decline-shot>Decline invitation</button></div>`:''}<div class="workspace-actions">${manage?'<button type="button" data-new-shot-character>+ Pre-generated character sheet</button>':''}${accepted&&metadata.data.approved&&['Player-created','Mixed'].includes(metadata.data.rosterMode)?'<button type="button" data-new-own-shot-character>+ Create my character sheet</button>':''}</div>${characters.map(character=>`<div class="workspace-card"><strong>${e(character.name)}</strong> · ${e(character.class||'Choose class in sheet')} · Level ${Number(character.level)}<div class="workspace-actions"><button type="button" data-open-shot-sheet="${e(character.id)}">Character sheet</button>${manage?`<select data-shot-assignee="${e(character.id)}" aria-label="Assign ${e(character.name)}"><option value="">Unassigned pre-generated sheet</option>${(metadata.data.participantUids||[]).map(uid=>`<option value="${e(uid)}" ${character.userId===uid?'selected':''}>${e(members.find(row=>(row.uid||row.id)===uid)?.displayName||uid)}</option>`).join('')}</select><button type="button" data-assign-shot-sheet="${e(character.id)}">Assign</button>`:''}</div></div>`).join('')||'<p>No accessible character sheets yet.</p>'}</section>`;
   async function action(fn){if(s.busy)return;if(s.dirty){W.status('Save your one-shot changes before updating its roster.',true);return;}s.busy=true;try{await fn();if(W.session!==s)return;s.record=await loadRecord(s.campaignId,recordId);W.renderEditor();}catch(error){if(W.session===s)W.status(error.message,true)}finally{s.busy=false;}}
   if(manage){
    const section=document.createElement('section');section.className='workspace-card';section.innerHTML='<h3>Adventure encounters</h3><p>Run private copies with separate HP, conditions and rounds. Copying does not reveal campaign secrets to participants.</p><div class="workspace-actions"><button type="button" data-shot-encounters>Open adventure encounters</button></div>';host.append(section);
    section.querySelector('[data-shot-encounters]').onclick=()=>openEncounters(s);
    if(canManageCampaign()){
     const records=await W.store.list(s.campaignId,'encounter');if(W.session!==s||!section.isConnected)return;
     section.insertAdjacentHTML('beforeend',`<div class="workspace-actions"><select data-copy-shot-encounter aria-label="Campaign encounter to copy"><option value="">Choose a campaign encounter…</option>${records.filter(row=>!row.archived).map(row=>`<option value="${e(row.id)}">${e(row.title)}</option>`).join('')}</select><button type="button" data-copy-encounter>Copy into this adventure</button></div>`);
     section.querySelector('[data-copy-encounter]').onclick=()=>action(async()=>{const source=section.querySelector('select').value;if(!source)return;const master=await W.store.load(s.campaignId,'encounter',source);await store.encounters(s.campaignId,recordId).save({id:W.id(),revision:0,input:{...master,data:{...master.data,sourceEncounterId:source,sourceEncounterRevision:master.revision,links:[]}}});});
    }
   }
   host.querySelector('[data-approve-shot]')?.addEventListener('click',async()=>{s.record.data.approved=true;s.record.data.hostUid=host.querySelector('[data-shot-host]').value;s.dirty=true;await W.save();if(!s.dirty)W.renderEditor();});
   host.querySelector('[data-invite-shot]')?.addEventListener('click',()=>action(()=>store.invite(s.campaignId,recordId,host.querySelector('[data-shot-invite]').value)));
   host.querySelector('[data-accept-shot]')?.addEventListener('click',()=>action(()=>store.respond(s.campaignId,recordId,'accepted')));
   host.querySelector('[data-decline-shot]')?.addEventListener('click',()=>action(()=>store.respond(s.campaignId,recordId,'declined')));
   host.querySelector('[data-new-shot-character]')?.addEventListener('click',()=>action(()=>store.createCharacter({campaignId:s.campaignId,shotId:recordId,id:W.id()})));
   host.querySelector('[data-new-own-shot-character]')?.addEventListener('click',()=>action(()=>store.createCharacter({campaignId:s.campaignId,shotId:recordId,id:W.id(),userId:self})));
   host.querySelectorAll('[data-assign-shot-sheet]').forEach(button=>button.onclick=()=>action(()=>store.assign(s.campaignId,recordId,button.dataset.assignShotSheet,host.querySelector(`[data-shot-assignee="${button.dataset.assignShotSheet}"]`).value)));
   host.querySelectorAll('[data-open-shot-sheet]').forEach(button=>button.onclick=()=>{const character=characters.find(row=>row.id===button.dataset.openShotSheet);openCharacterSheet(character.id,{adventureId:recordId,character,oneShot:{...metadata,id:recordId}});});
  }catch(error){if(host.isConnected)host.textContent='Could not load roster: '+error.message;}
 }
 W.configs.oneShot={title:'One Shots',tab:'dm-one-shots',noun:'one-shot',categories:[],fields:[['status','Adventure status','select',['Draft','Ready','Running','Completed']],['targetLevel','Character level limit','number'],['players','Intended player count','number'],['duration','Session length (minutes)','number',null,1440],['rosterMode','Character creation mode','select',['DM pre-generated','Player-created','Mixed']]],content:'Player hook and adventure introduction',secret:'Private scenes, encounters, rewards and run notes',help:'Create a side adventure, approve its host and invite participants. Character sheets live in this one-shot and remain independent of the main campaign.',normalize,extra:paint,onSaved:paint,lockFields:record=>record.data.approved&&!canManageCampaign()?['targetLevel','rosterMode']:[],canUse:()=>activeCampaign&&canManageCampaign(),canEdit:prep,showPrivate:prep,list:campaignId=>store.accessible(campaignId,canManageCampaign()),loadRecord};
 // Players enter their own scoped adventures from My Characters, never a DM planning tab.
 W.configs.playerAdventure={...W.configs.oneShot,title:'My One Shots',tab:'player-adventures',hideNavigation:true,hideLinks:true,help:'Propose a side adventure, respond to invitations and open your assigned sheets. Only an approved host can prepare and run an adventure; campaign DM tools remain private.',canUse:()=>activeCampaign&&canUseCharacters(),saveRecord:args=>W.store.save({...args,kind:'oneShot'})};
 /** Reuse the tracker UI with an adventure-scoped store and the server-enforced host grant. */
 async function openEncounters(s){
  if(s.busy||!manager(s.record)||!W.clear())return;
  const scoped=store.encounters(s.campaignId,s.record.id),campaignId=s.campaignId,uid=s.uid,record=s.record,returnTab=W.configs[s.kind].tab;
  W.configs.adventureEncounter={...W.configs.encounter,title:record.title+' · Encounters',tab:returnTab,hideLinks:true,hideNavigation:true,canUse:()=>activeCampaign?.id===campaignId&&auth.currentUser?.uid===uid&&canUseCharacters()&&manager(record),list:()=>scoped.list(),loadRecord:(campaignId,id)=>scoped.load(campaignId,'encounter',id),saveRecord:args=>scoped.save(args)};
  showTab(returnTab,false);await W.render('adventureEncounter');
  if(W.session?.kind!=='adventureEncounter')return;
  const button=document.createElement('button');button.type='button';button.textContent='Back to one-shots';button.dataset.backOneShots='';button.onclick=()=>{if(W.clear())showTab(returnTab)};W.session.host.querySelector('.workspace-heading').append(button);
 }
 return{store,manager,prep,openEncounters};
})();
