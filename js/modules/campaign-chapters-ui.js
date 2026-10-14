'use strict';
(()=>{
 const W=CampaignWorkspace,e=value=>escapeHtml(String(value??'')),statuses=['Planned','Current','Completed'];
 const current=s=>W.session===s&&activeCampaign?.id===s.campaignId&&auth.currentUser?.uid===s.uid&&canManageCampaign();
 W.configs.chapter={title:'Chapter Tracker',tab:'dm-chapters',noun:'chapter',categories:[],fields:[['order','Chapter order','number',null,9999],['status','Story progress','select',['Planned','Current','Completed']],['startingLevel','Expected starting level','number'],['targetLevel','Milestone target level (0 = no level-up)','number'],['playerRecap','Player recap (share only after completion)','textarea'],['objectives','Objectives','textarea'],['scenes','Scenes','textarea'],['rewards','Planned rewards','textarea'],['sessionNotes','Private session notes','textarea']],content:'Chapter introduction',secret:'Private chapter preparation',help:'Link the same locations and creatures to several chapters. Completing a chapter records story progress; sharing its recap and approving milestones are separate actions.',normalize:data=>{
   const result=structuredClone(data||{});result.status=['Planned','Current','Completed'].includes(result.status)?result.status:'Planned';
   for(const [key,fallback,max]of [['order',1,9999],['startingLevel',1,20],['targetLevel',0,20]]){const n=result[key]==null?fallback:Number(result[key]);if(!Number.isInteger(n)||n<0||n>max)throw Error(`${key} must be a whole number from 0 to ${max}.`);result[key]=n;}return result;
 }};
 const config=W.configs.chapter;
 const textarea=(name,label,value,max=20000)=>`<label class="workspace-field"><span>${e(label)}</span><textarea name="${name}" maxlength="${max}">${e(value)}</textarea></label>`;
 function field(record,key){
   const [,label,type,options,max]=config.fields.find(([name])=>name===key),value=record.data?.[key];
   return `<label class="workspace-field"><span>${e(label)}</span>${type==='select'?`<select data-record-field="${key}">${options.map(option=>`<option ${option===value?'selected':''}>${e(option)}</option>`).join('')}</select>`:type==='number'?`<input data-record-field="${key}" type="number" min="0" max="${max||20}" step="1" value="${Number(value)||0}">`:`<textarea data-record-field="${key}" maxlength="20000">${e(value)}</textarea>`}</label>`;
 }
 config.editorBody=record=>`<p class="chapter-editor-state" data-chapter-editor-state role="status"></p><div class="chapter-editor-with-reference"><div class="chapter-editor-main">
   <section class="chapter-editor-section"><h3>Chapter details &amp; progress</h3><div class="workspace-fields"><label class="workspace-field workspace-full"><span>Title</span><input name="title" required maxlength="160" value="${e(record.title)}"></label>${field(record,'order')}${field(record,'status')}</div>${textarea('summary','Short summary',record.summary,1000)}<p>Title, summary and chapter order are included when you share a completed chapter. Completing it does not publish the recap or level up characters.</p></section>
   <section class="chapter-editor-section"><h3>Recap for players</h3><p>Write what the party discovered. Share the saved recap only when the chapter is completed; if it is empty, the chapter introduction is used.</p>${textarea('content','Chapter introduction',record.content)}${field(record,'playerRecap')}<div data-extra-editor></div></section>
   <section class="chapter-editor-section chapter-editor-private"><h3>Private chapter preparation</h3><p>Objectives, scenes, rewards, session notes and secrets stay in your DM workspace.</p><div class="workspace-fields">${['objectives','scenes','rewards','sessionNotes'].map(key=>field(record,key)).join('')}</div>${textarea('privateNotes','Private chapter preparation',record.privateNotes)}</section>
   <section class="chapter-editor-section chapter-editor-private"><h3>Locations, people &amp; encounters</h3><div data-chapter-prep-tools></div><section data-workspace-links></section></section>
   <section class="chapter-editor-section chapter-editor-private"><h3>Milestone approvals</h3><div class="workspace-fields">${field(record,'startingLevel')}${field(record,'targetLevel')}</div><p>Set 0 for no milestone. Approvals are separate from chapter completion and recap sharing.</p><div data-chapter-milestone-tools></div></section>
   <label class="workspace-field" data-private-print><span><input type="checkbox" data-print-private> Include private preparation and statistics in print</span></label></div><aside class="chapter-reference-panel" data-chapter-reference-panel aria-label="Linked campaign reference" hidden></aside></div>`;
 config.initialData=s=>({order:Math.min(9999,Math.max(0,...s.rows.map(row=>Number(row.data?.order)||0))+1)});
 config.hideNavigation=true;
 config.searchText=row=>[row.content,row.data?.playerRecap,row.data?.objectives,row.data?.scenes].join(' ');
 config.help='Prepare the story privately, track its progress, then share completed recaps with your players. Milestone approvals stay separate from publishing and character level choices.';
 config.toolbar=(host,s)=>{
   s.chapterProgress='';
   host.innerHTML=`<nav class="chapter-progress-shortcuts" aria-label="Chapter progress">${['',...statuses].map(status=>`<button type="button" data-chapter-progress="${status}" aria-pressed="${!status}">${status||'All chapters'} <span>0</span></button>`).join('')}</nav><div class="workspace-actions"><button type="button" data-chapter-encounters>Prepare encounters</button></div><p class="chapter-browse-status" data-chapter-results role="status"></p>`;
   host.querySelectorAll('[data-chapter-progress]').forEach(button=>button.onclick=()=>{s.chapterProgress=button.dataset.chapterProgress;W.renderList();});
   host.querySelector('[data-chapter-encounters]').onclick=()=>W.switchKind('encounter');
   s.host.querySelector('[data-workspace-category]').closest('label').hidden=true;
   for(const label of s.host.querySelectorAll('.workspace-sidebar label')){
     const span=document.createElement('span');for(const node of [...label.childNodes])if(node.nodeType===3)span.append(node);label.prepend(span);
     if(label.querySelector('[data-workspace-search]'))span.textContent='Search chapters';
     const checkbox=label.querySelector('[data-workspace-archived]');if(checkbox){span.prepend(checkbox);span.className='chapter-archived-filter';}
   }
 };
 config.onListed=s=>{
   if(!current(s))return;
   const archived=s.host.querySelector('[data-workspace-archived]').checked,rows=s.rows.filter(row=>!!row.archived===archived);
   const progress=row=>statuses.includes(row.data?.status)?row.data.status:'Planned';
   s.host.querySelectorAll('[data-chapter-progress]').forEach(button=>{
     const status=button.dataset.chapterProgress;button.setAttribute('aria-pressed',String(status===s.chapterProgress));button.querySelector('span').textContent=rows.filter(row=>!status||progress(row)===status).length;
   });
   const list=s.host.querySelector('[data-workspace-list]');let shown=0;
   list.querySelectorAll('[data-open-record]').forEach(button=>{
     const row=s.rows.find(row=>row.id===button.dataset.openRecord);if(!row)return;
     const order=document.createElement('span');order.className='chapter-list-order';order.textContent=`Chapter ${Number(row.data?.order)||0}`;button.prepend(order);
     button.querySelector('small').textContent=progress(row)+(row.summary?' · '+row.summary.slice(0,90):'');
     button.hidden=!!s.chapterProgress&&progress(row)!==s.chapterProgress;if(!button.hidden)shown++;
     if(row.id===s.record?.id)button.setAttribute('aria-current','true');
   });
   if(!shown){if(list.querySelector('p'))list.querySelector('p').textContent=s.rows.length?'No chapters match these filters.':'No chapters yet. Create your first chapter to begin.';else{const message=document.createElement('p');message.textContent='No chapters match these filters.';list.append(message);}}
   s.host.querySelector('[data-chapter-results]').textContent=`${shown} of ${rows.length} ${archived?'archived':'active'} chapters shown. Completion does not share recaps automatically.`;
 };
 const connected=(s,row,kind)=>(s.record.data.links||[]).some(link=>link.kind===kind&&link.id===row.id)||(row.data?.links||[]).some(link=>link.kind==='chapter'&&link.id===s.record.id);
 function paintReference(s){
   const host=s.host.querySelector('[data-chapter-reference-panel]');if(!current(s)||!host)return;
   const reference=s.chapterReference;
   if(!reference||reference.chapterId!==s.record.id||!connected(s,reference.record,reference.kind)){if(reference){s.chapterReference=null;s.chapterReferenceRequest=(s.chapterReferenceRequest||0)+1;}host.hidden=true;host.replaceChildren();return;}
   const focused=document.activeElement,restore=host.contains(focused)?focused.matches('[data-close-chapter-reference]')?'[data-close-chapter-reference]':focused.matches('[data-chapter-reference-title]')?'[data-chapter-reference-title]':null:null;
   const record=reference.record,data=record.data||{};
   const fields=reference.kind==='world'?[['connections','Related places and people']]:[['appearance','Appearance'],['personality','Personality'],['voice','Voice and mannerisms'],['goals','Goals'],['relationships','Relationships']];
   const prose=(label,value)=>value?'<section><h4>'+e(label)+'</h4><div class="workspace-prose">'+e(value)+'</div></section>':'';
   host.hidden=false;
   host.innerHTML='<div class="workspace-actions"><button type="button" data-close-chapter-reference>Close reference</button></div><p class="chapter-reference-caption">Saved DM reference'+(record.archived?' · Archived':'')+'</p><h3 tabindex="-1" data-chapter-reference-title>'+e(record.title)+'</h3><p>'+e(data.category||'Campaign entry')+'</p>'+prose('Summary',record.summary)+prose(reference.kind==='world'?'Description':'Story description',record.content)+fields.map(([key,label])=>prose(label,data[key])).join('')+(reference.kind==='creature'&&data.combatEnabled?'<section><h4>Combat preparation</h4><p>AC '+e(data.ac)+' · Maximum HP '+e(data.hp)+' · Speed '+e(data.speed)+' ft.</p></section>'+[['actions','Actions'],['traits','Traits'],['bonusActions','Bonus actions'],['reactions','Reactions'],['legendaryActions','Legendary actions'],['phases','Boss phases']].map(([key,label])=>prose(label,data[key])).join(''):'')+prose('Private notes',record.privateNotes)+(reference.loading?'<p data-chapter-reference-status role="status">Loading private notes…</p>':reference.error?'<p data-chapter-reference-status role="status">'+e(reference.error)+'</p>':'')+'<p>Viewing this reference keeps your chapter edits in place. Use Open to edit the linked entry.</p>';
   host.querySelector('[data-close-chapter-reference]').onclick=()=>{const trigger=reference.trigger;s.chapterReference=null;++s.chapterReferenceRequest;host.hidden=true;host.replaceChildren();if(trigger?.isConnected)trigger.focus();};
   if(restore)host.querySelector(restore)?.focus();
 }
 async function openReference(s,kind,id,trigger,focus=true){
   if(!current(s)||!['world','creature'].includes(kind))return;
   const row=s.chapterConnectionGroups?.find(group=>group.kind===kind)?.rows.find(record=>record.id===id&&connected(s,record,kind));
   const host=s.host.querySelector('[data-chapter-reference-panel]');if(!row||!host)return;
   const chapterId=s.record.id,token=(s.chapterReferenceRequest||0)+1;s.chapterReferenceRequest=token;
   const reference={chapterId,kind,id,record:row,loading:true,trigger};s.chapterReference=reference;paintReference(s);
   if(focus)host.querySelector('[data-chapter-reference-title]')?.focus();
   const active=()=>current(s)&&host.isConnected&&s.record.id===chapterId&&s.chapterReference===reference&&s.chapterReferenceRequest===token&&connected(s,reference.record,kind);
   try{const record=await W.store.load(s.campaignId,kind,id);if(!active())return;reference.record=record;reference.loading=false;paintReference(s);}
   catch(error){if(!active())return;reference.loading=false;reference.error='Private notes could not be loaded: '+error.message;paintReference(s);}
 }
 function paint(_host,s){
   if(!current(s))return;
   const prep=s.host.querySelector('[data-chapter-prep-tools]'),milestones=s.host.querySelector('[data-chapter-milestone-tools]');
   if(!prep||!milestones)return;
   const state=s.host.querySelector('[data-chapter-editor-state]');
   state.textContent=s.dirty?'Unsaved chapter changes · Save to keep your preparation.':s.record.revision?`Chapter ${Number(s.record.data.order)||0} · Saved progress: ${statuses.includes(s.record.data.status)?s.record.data.status:'Planned'}`:'New chapter · Save to keep your preparation.';
   const target=Number(W.draft()?.data.targetLevel)||0;
   paintReference(s);
   const prepKey=JSON.stringify([s.record.id,s.record.revision,s.record.data.links||[],s.chapterConnectionRefresh||0]);
   if(prep._chapterKey!==prepKey){
     prep._chapterKey=prepKey;
     prep.innerHTML=`<section class="workspace-card" data-chapter-prep><h3>Chapter preparation</h3><p>Linked NPCs, creatures, locations and encounters are listed below. Add or remove connections in <strong>Connected campaign entries</strong>.</p><div data-chapter-connections role="status">Loading connections…</div><button type="button" data-refresh-chapter-connections>Refresh linked entries</button></section>`;
     prep.querySelector('[data-refresh-chapter-connections]').onclick=()=>{if(!current(s)||s.busy)return;s.chapterConnectionsPromise=null;s.chapterConnectionRefresh=(s.chapterConnectionRefresh||0)+1;W.renderLinks();paint(null,s);};
     const chapterId=s.record.id,campaignId=s.campaignId,uid=s.uid,container=prep.querySelector('[data-chapter-connections]');
     const connections=s.chapterConnectionsPromise||(s.chapterConnectionsPromise=Promise.all(['world','creature','encounter'].map(async kind=>({kind,rows:await W.store.list(campaignId,kind)}))));
     connections.then(groups=>{
       if(!container.isConnected||!current(s)||s.record.id!==chapterId||activeCampaign?.id!==campaignId||auth.currentUser?.uid!==uid)return;
       s.chapterConnectionGroups=groups;
       const links=s.record.data.links||[],sections=[['world','Locations & lore'],['creature','NPCs & creatures'],['encounter','Encounters']];
       container.innerHTML=sections.map(([kind,label])=>{
         const group=groups.find(g=>g.kind===kind),rows=group.rows.filter(row=>(links.some(link=>link.kind===kind&&link.id===row.id)||(row.data?.links||[]).some(link=>link.kind==='chapter'&&link.id===chapterId)));
         return '<section class="workspace-card"><h4>'+escapeHtml(label)+' ('+rows.length+')</h4>'+(rows.map(row=>'<p>'+escapeHtml(row.title)+(row.archived?' · Archived':'')+(kind==='world'||kind==='creature'?' <button type="button" data-chapter-reference="'+escapeHtml(kind+':'+row.id)+'">View reference</button>':'')+' <button type="button" data-chapter-open="'+escapeHtml(kind+':'+row.id)+'">Open</button></p>').join('')||'<p>No linked entries yet.</p>')+'</section>';
       }).join('');
       container.querySelectorAll('[data-chapter-open]').forEach(button=>button.onclick=()=>{
         const [kind,id]=button.dataset.chapterOpen.split(':');
         W.navigateTo(kind,id);
       });
       container.querySelectorAll('[data-chapter-reference]').forEach(button=>button.onclick=()=>{const [kind,id]=button.dataset.chapterReference.split(':');openReference(s,kind,id,button);});
       const reference=s.chapterReference;
       if(reference?.chapterId===chapterId){
         const row=groups.find(group=>group.kind===reference.kind)?.rows.find(record=>record.id===reference.id&&connected(s,record,reference.kind));
         if(row)openReference(s,reference.kind,reference.id,container.querySelector('[data-chapter-reference="'+reference.kind+':'+reference.id+'"]'),false);
         else{s.chapterReference=null;++s.chapterReferenceRequest;paintReference(s);}
       }
     }).catch(error=>{if(container.isConnected&&current(s)&&s.record.id===chapterId){s.chapterConnectionsPromise=null;container.textContent='Could not load chapter connections: '+error.message;}});
   }
   const activeCharacters=characters.filter(character=>character.active!==false);
   const milestoneKey=JSON.stringify([target,s.busy,s.chapterPendingMilestone,s.record.data.milestones||[],activeCharacters.map(row=>[row.id,row.name,row.level])]);
   if(milestones._chapterKey!==milestoneKey){
     milestones._chapterKey=milestoneKey;
     milestones.innerHTML=`<section class="workspace-card"><h4>Character approvals</h4><p>Approving saves your current chapter edits and the approval. Apply class choices, HP and features in the character sheet; approval does not change the level.</p>${activeCharacters.map(character=>{const approval=(s.record.data.milestones||[]).find(row=>row.characterId===character.id);return `<p>${escapeHtml(character.name)} · level ${Number(character.level)||1}${approval?(s.chapterPendingMilestone===character.id?' · Approval saving…':' · Approved level '+Number(approval.targetLevel)):''} <button type="button" data-approve-milestone="${escapeHtml(character.id)}" ${s.busy||!target||Number(character.level)>=target||(approval?.targetLevel===target&&approval?.fromLevel===Number(character.level))?'disabled':''}>Approve milestone</button> <button type="button" data-milestone-sheet="${escapeHtml(character.id)}">Open sheet</button></p>`;}).join('')||'<p>No active campaign characters yet.</p>'}</section>`;
     milestones.querySelectorAll('[data-approve-milestone]').forEach(button=>button.onclick=async()=>{
       if(!current(s)||s.busy)return;
       const input=W.draft(),level=Number(input?.data.targetLevel),character=characters.find(row=>row.id===button.dataset.approveMilestone);
       if(!character||!level||level<=Number(character.level)){W.status('Choose a target above the character’s current level.',true);return;}
       if(!confirm(`Save this chapter and approve ${character.name} to advance to level ${level}? Apply their class choices and level in their sheet.`))return;
       const recordId=s.record.id,previous=s.record.data.milestones?structuredClone(s.record.data.milestones):null;
       s.record.data.milestones=(s.record.data.milestones||[]).filter(row=>row.characterId!==character.id);
       s.record.data.milestones.push({characterId:character.id,fromLevel:Number(character.level)||1,targetLevel:level,approvedBy:s.uid,approvedAt:Date.now()});
       s.chapterPendingMilestone=character.id;s.dirty=true;button.disabled=true;
       const saved=await W.save();s.chapterPendingMilestone=null;
       if(!current(s)||s.record.id!==recordId)return;
       if(!saved){if(previous)s.record.data.milestones=previous;else delete s.record.data.milestones;paint(null,s);}
       else if(!s.dirty)W.renderEditor();else paint(null,s);
     });
     milestones.querySelectorAll('[data-milestone-sheet]').forEach(button=>button.onclick=()=>{if(current(s)&&!s.busy)openCharacterSheet(button.dataset.milestoneSheet);});
   }
 }
 W.configs.chapter.extra=(host,s)=>{
   if(s.record.revision){const index=s.rows.findIndex(row=>row.id===s.record.id);if(index>=0)s.rows[index]={...s.rows[index],...s.record};}
   W.renderList();paint(host,s);
 };
 W.configs.chapter.playerContent=input=>input.data.playerRecap||input.content;
 W.configs.chapter.onEdit=paint;
 W.configs.chapter.onSaveSettled=paint;
})();
