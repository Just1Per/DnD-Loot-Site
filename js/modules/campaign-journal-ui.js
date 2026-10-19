'use strict';
var CampaignJournal=(()=>{
  const store=createCampaignJournalStore(window.__DND_VAULT_DEPS__);
  const world=createCampaignInformationStore(window.__DND_VAULT_DEPS__);
  const chapters=createCampaignInformationStore(window.__DND_VAULT_DEPS__,'chapter');
  const escape=value=>escapeHtml(String(value??''));
  let session=null,leavePrompt=null;
  const current=s=>session===s&&activeCampaign?.id===s.campaignId&&auth.currentUser?.uid===s.uid;
  const allowed=s=>current(s)&&!s.denied;
  const today=()=>{const date=new Date();return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;};
  function cancelLeave(){if(!leavePrompt)return;const p=leavePrompt;leavePrompt=null;if(p.dialog.open)p.dialog.close();p.dialog.remove();if(p.opener?.isConnected)p.opener.focus();}
  function revokeImages(s){for(const url of s?.imageUrls||[])URL.revokeObjectURL(url);if(s)s.imageUrls=[];}
  function clear(){revokeImages(session);cancelLeave();document.querySelectorAll('.journal-preview').forEach(dialog=>{dialog.close();dialog.remove();});session?.stops.forEach(stop=>stop());session=null;document.getElementById('tab-campaign-journal')?.replaceChildren();}
  function guard(action){
    const s=session;if(!s)return true;if(!current(s)){clear();return true;}if(s.busy)return false;
    if(!s.editor?.dirty)return true;if(leavePrompt)return false;
    const dialog=document.createElement('dialog');dialog.className='journal-leave-dialog';dialog.id='journalLeaveDialog';dialog.setAttribute('aria-labelledby','journalLeaveTitle');
    dialog.innerHTML='<h2 id="journalLeaveTitle">Keep your recap before leaving?</h2><p>Your changes have not been saved. Saving a draft keeps it private and does not update the party’s copy.</p><p role="status" data-leave-status></p><div class="journal-actions"><button type="button" data-leave-save>Save private draft &amp; continue</button><button type="button" data-leave-discard>Discard changes</button><button type="button" data-leave-stay>Stay here</button></div>';
    const p={dialog,opener:document.activeElement,busy:false};leavePrompt=p;
    const proceed=()=>{if(!allowed(s)||leavePrompt!==p)return;s.editor=null;cancelLeave();action();};
    dialog.querySelector('[data-leave-stay]').onclick=()=>{if(!p.busy)cancelLeave();};
    dialog.querySelector('[data-leave-discard]').onclick=()=>{if(!p.busy)proceed();};
    dialog.querySelector('[data-leave-save]').onclick=async()=>{
      if(p.busy||!allowed(s))return;p.busy=true;dialog.querySelectorAll('button').forEach(b=>b.disabled=true);
      const saved=await saveDraft(s);if(leavePrompt!==p)return;p.busy=false;
      if(saved){proceed();return;}dialog.querySelector('[data-leave-status]').textContent=s.message;dialog.querySelectorAll('button').forEach(b=>b.disabled=false);
    };
    dialog.addEventListener('cancel',event=>{event.preventDefault();if(!p.busy)cancelLeave();});
    document.body.append(dialog);dialog.showModal();dialog.querySelector('[data-leave-stay]').focus();return false;
  }
  function beforeNavigate(tab){if(tab==='campaign-journal')return true;if(!guard(()=>showTab(tab)))return false;clear();return true;}
  const byDate=(a,b)=>String(b.sessionDate||'').localeCompare(String(a.sessionDate||''))||(b.sessionNumber||0)-(a.sessionNumber||0)||(b.updatedAt||0)-(a.updatedAt||0)||a.title.localeCompare(b.title);
  function publishedRow(row,type){const date=new Date(row.updatedAt||0);return {...row,key:type+':'+row.id,type,body:row.content,sessionDate:Number.isFinite(date.getTime())?date.toISOString().slice(0,10):''};}
  function entries(s){return [...s.shared.map(row=>({...row,key:'recap:'+row.id,type:'recap'})),...s.chapters.map(row=>publishedRow(row,'chapter')),...s.world.map(row=>publishedRow(row,'world'))].sort(byDate);}
  const subtitle=row=>row.type==='recap'?`${row.authorName}${row.characterName?' as '+row.characterName:''} · Session ${row.sessionNumber} · ${row.sessionDate}`:`DM · ${row.type==='chapter'?'Shared chapter':'Shared '+row.category}`;
  async function loadImage(s,row){
    const host=s.root.querySelector('[data-journal-image]');if(!host||!row.image)return;
    const prefix=`campaign-journal-images/${s.campaignId}/${row.type==='chapter'?'chapter':'world'}/${row.id}/`,image=row.image;
    if(typeof image.path!=='string'||!image.path.startsWith(prefix)||!/^[A-Za-z0-9_-]{1,100}$/.test(image.path.slice(prefix.length))){host.textContent='Illustration unavailable.';return;}
    try{const sdk=window.__DND_VAULT_DEPS__,blob=await sdk.getBlob(sdk.ref(sdk.storage,image.path),6*1024*1024);if(!allowed(s)||!host.isConnected||s.selected!==row.key)return;
      const url=URL.createObjectURL(blob);s.imageUrls.push(url);const img=document.createElement('img');img.src=url;img.alt=image.alt||'Shared campaign illustration';host.replaceChildren(img);
      if(image.caption){const caption=document.createElement('figcaption');caption.textContent=image.caption;host.append(caption);}
    }catch{if(allowed(s)&&host.isConnected)host.textContent='Illustration unavailable.';}
  }
  function card(row,index){return `<article class="journal-card ${index===0?'journal-feature':''}"><span class="journal-tag ${row.type==='recap'?'journal-player':''}">${row.type==='recap'?'Player account':row.type==='chapter'?'DM chapter summary':'DM-shared page'}</span><h3>${escape(row.title)}</h3><p class="journal-excerpt">${escape((row.summary||row.body).slice(0,240))}${(row.summary||row.body).length>240?'…':''}</p><p class="journal-meta">${escape(subtitle(row))}</p><button type="button" data-journal-read="${escape(row.key)}">Read ${row.type==='recap'?'recap':row.type==='chapter'?'chapter':'page'} →</button></article>`;}
  function sidebar(s){const next=s.shared.filter(row=>row.nextTime).sort(byDate)[0];return `<aside class="journal-sidebar">${next?`<section class="journal-card journal-soft"><p class="journal-eyebrow">For the next session</p><h3>A thread to pick up</h3><p class="journal-excerpt">${escape(next.nextTime)}</p><p class="journal-meta">From ${escape(next.authorName)}’s Session ${next.sessionNumber} recap</p><button type="button" data-journal-read="recap:${escape(next.id)}">Read the recap</button></section>`:''}<section class="journal-card journal-soft"><p class="journal-eyebrow">Campaign reference</p><h3>The world we know</h3><p>Explore the lore, people and chapters your DM has shared.</p><div class="journal-actions journal-reference"><button type="button" data-journal-route="campaign-information">Places &amp; lore</button><button type="button" data-journal-route="campaign-npcs">Known NPCs</button><button type="button" data-journal-route="campaign-chapters">Completed chapters &amp; notes</button></div></section><section class="journal-card"><p class="journal-eyebrow">Only you</p><h3>Your recap drafts</h3><p>DMs and other players cannot read your private drafts. Shared copies appear in the journal until you make them private.</p><div class="journal-drafts">${s.drafts.length?s.drafts.slice().sort(byDate).map(row=>`<button type="button" data-journal-edit="${escape(row.id)}"><strong>${escape(row.title)}</strong><span>Session ${row.sessionNumber} · ${s.shared.some(shared=>shared.id===row.id)?'Has a shared copy':'Private draft'}</span></button>`).join(''):'<p class="journal-muted">No drafts yet. A few memorable moments are enough to start.</p>'}</div></section></aside>`;}
  function paint(s){
    if(!allowed(s)||s.editor)return;
    revokeImages(s);
    const rows=entries(s),selected=rows.find(row=>row.key===s.selected);
    const body=s.root.querySelector('[data-journal-content]');
    s.root.querySelector('[data-journal-status]').textContent=s.message;
    s.root.querySelector('[data-journal-compose]').disabled=!s.ready||s.busy;
    s.root.querySelector('[data-journal-refresh]').disabled=s.busy;
    if(selected){
      body.innerHTML=`<div class="journal-reader-heading"><button type="button" data-journal-back>← All journal entries</button></div><div class="journal-notebook"><nav class="journal-index" aria-label="Journal entries"><p class="journal-eyebrow">Contents</p>${rows.map(row=>`<button type="button" data-journal-read="${escape(row.key)}" ${row.key===selected.key?'aria-current="page"':''}>${escape(row.title)}</button>`).join('')}</nav><article class="journal-leaf" aria-labelledby="journalEntryTitle"><span class="journal-tag ${selected.type==='recap'?'journal-player':''}">${selected.type==='recap'?'Player account · Shared with the campaign':selected.type==='chapter'?'Official shared chapter':'From your DM'}</span><h3 id="journalEntryTitle" tabindex="-1">${escape(selected.title)}</h3><p class="journal-meta">${escape(subtitle(selected))}</p><div class="journal-prose">${escape(selected.body)}</div>${selected.image?'<figure data-journal-image>Loading shared illustration…</figure>':''}${selected.type==='recap'&&(selected.remember||selected.nextTime)?`<div class="journal-note-grid">${selected.remember?`<section class="journal-note"><h4>Remember this</h4><div class="journal-prose">${escape(selected.remember)}</div></section>`:''}${selected.nextTime?`<section class="journal-note"><h4>For next time</h4><div class="journal-prose">${escape(selected.nextTime)}</div></section>`:''}</div>`:''}<div class="journal-actions">${selected.type==='recap'&&selected.authorId===s.uid?`<button type="button" data-journal-edit="${escape(selected.id)}">Edit your draft</button><button type="button" data-journal-unshare="${escape(selected.id)}">Make private</button>`:''}${selected.type==='chapter'?'<button type="button" data-journal-route="campaign-chapters">Open chapters &amp; private notes</button>':selected.type==='world'?'<button type="button" data-journal-route="campaign-information">Explore places &amp; lore</button>':''}</div></article></div>`;
    }else{
      s.selected=null;const visible=rows.filter(row=>(s.filter==='all'||(s.filter==='dm'?row.type!=='recap':row.type===s.filter))&&[row.title,row.body,row.authorName,row.characterName,row.sessionNumber].join(' ').toLowerCase().includes(s.search.toLowerCase()));
      body.innerHTML=`<div class="journal-grid"><section aria-label="Shared journal entries" class="journal-feed">${visible.length?visible.map(card).join(''):`<section class="journal-card journal-empty"><h3>${rows.length?'No entries match your search':'Your story starts here'}</h3><p>${rows.length?'Try another search or show all entries.':'Write your first session recap, or explore the campaign references. Completed chapters appear here when your DM shares them.'}</p></section>`}</section>${sidebar(s)}</div>`;
    }
    bindContent(s);if(selected?.image)loadImage(s,selected);
  }
  function bindContent(s){
    const host=s.root.querySelector('[data-journal-content]');
    host.querySelectorAll('[data-journal-read]').forEach(button=>button.onclick=()=>{if(!allowed(s))return;s.selected=button.dataset.journalRead;paint(s);s.root.querySelector('#journalEntryTitle')?.focus();});
    host.querySelector('[data-journal-back]')?.addEventListener('click',()=>{s.selected=null;paint(s);s.root.querySelector('[data-journal-compose]')?.focus();});
    host.querySelectorAll('[data-journal-edit]').forEach(button=>button.onclick=()=>edit(s,button.dataset.journalEdit));
    host.querySelectorAll('[data-journal-route]').forEach(button=>button.onclick=()=>showTab(button.dataset.journalRoute));
    host.querySelectorAll('[data-journal-unshare]').forEach(button=>button.onclick=()=>unshare(s,button.dataset.journalUnshare));
  }
  function editorState(s){
    if(!allowed(s)||!s.editor)return;
    s.root.querySelectorAll('[data-journal-form] input,[data-journal-form] textarea,[data-journal-form] select,[data-journal-form] button').forEach(node=>node.disabled=s.busy);
    s.root.querySelector('[data-journal-status]').textContent=s.message;
    const submit=s.root.querySelector('[data-journal-form] button[type=submit]');
    submit.textContent=s.editor.audience==='party'?'Share recap':'Save draft';
    s.root.querySelector('[data-journal-compose]').disabled=s.busy;
    s.root.querySelector('[data-journal-refresh]').disabled=s.busy;
  }
  function edit(s,id){
    if(!allowed(s)||!s.ready||!guard(()=>edit(s,id)))return;
    const row=id?s.drafts.find(row=>row.id===id):null;
    if(id&&!row){s.message='Your saved draft is unavailable. Refresh the journal before editing.';paint(s);return;}
    s.editor={...(row||{id:crypto.randomUUID(),revision:0,title:'',body:'',authorName:String(currentUser?.name||auth.currentUser?.displayName||'Player').slice(0,100),characterName:'',sessionNumber:Math.min(9999,[...s.shared,...s.drafts].reduce((max,row)=>Math.max(max,row.sessionNumber||0),0)+1),sessionDate:today(),remember:'',nextTime:''}),audience:'private',dirty:false};
    s.message='Write your recap, choose who can read it, then save.';
    revokeImages(s);const e=s.editor,fields=[['sessionNumber','Session number','number',9999],['sessionDate','Session date','date',10],['authorName','Your name','text',100],['characterName','Character perspective (optional)','text',100]];
    s.root.querySelector('[data-journal-content]').innerHTML=`<section class="journal-editor"><div class="journal-reader-heading"><button type="button" data-journal-editor-back>${s.selected?'← Back to reading':'← Back to the journal'}</button><span class="journal-tag">Private working draft</span></div><h3>Write your session recap</h3><p>Other players may tell the same evening differently. This is your account of the adventure.</p><form data-journal-form><label><span>Title</span><input data-journal-field="title" maxlength="160" value="${escape(e.title)}" required placeholder="What happened this session?"></label><label><span>Your recap</span><textarea data-journal-field="body" maxlength="12000" rows="10" required placeholder="Tell the story in your own words…">${escape(e.body)}</textarea></label><label><span>Who can read this?</span><select data-journal-audience><option value="private">Only me · Draft</option><option value="party">Everyone in this campaign</option></select></label><details data-journal-extra><summary>Session details &amp; extra notes (optional)</summary><div class="journal-field-grid">${fields.map(([key,label,type,max])=>`<label><span>${label}</span><input data-journal-field="${key}" type="${type}" value="${escape(e[key])}" ${type==='number'?'min="1" max="9999"':`maxlength="${max}"`} ${key==='characterName'?'':'required'}></label>`).join('')}</div><div class="journal-field-grid"><label><span>Remember this</span><textarea data-journal-field="remember" maxlength="2000" rows="3">${escape(e.remember)}</textarea></label><label><span>For next time</span><textarea data-journal-field="nextTime" maxlength="2000" rows="3">${escape(e.nextTime)}</textarea></label></div></details><p class="journal-muted">Drafts are only visible to you. Shared recaps can be read by everyone in this campaign. Editing a draft keeps the existing shared copy unchanged until you choose to share again.</p><div class="journal-actions"><button type="submit" class="btn-primary">Save draft</button><button type="button" data-journal-preview>Preview</button></div></form></section>`;
    const form=s.root.querySelector('[data-journal-form]');
    form.oninput=event=>{const key=event.target.dataset.journalField;if(!key||!allowed(s)||s.busy)return;s.editor[key]=key==='sessionNumber'?Number(event.target.value):event.target.value;s.editor.dirty=true;s.message='Unsaved changes. Your party’s shared copy has not changed.';editorState(s);};
    form.addEventListener('invalid',event=>{const details=event.target.closest('details');if(details)details.open=true;},true);
    form.onsubmit=async event=>{event.preventDefault();const e=s.editor,share=e.audience==='party';if(await saveDraft(s)&&share&&allowed(s)&&s.editor===e)await publish(s);};
    s.root.querySelector('[data-journal-audience]').onchange=event=>{s.editor.audience=event.target.value;editorState(s);};
    s.root.querySelector('[data-journal-editor-back]').onclick=()=>{if(!guard(()=>{s.editor=null;paint(s);}))return;s.editor=null;paint(s);};
    s.root.querySelector('[data-journal-preview]').onclick=()=>preview(s);
    editorState(s);s.root.querySelector('[data-journal-field="title"]').focus();
  }
  async function saveDraft(s){
    if(!allowed(s)||!s.editor||s.busy)return false;
    const e=s.editor;s.busy=true;s.message='Saving your private draft…';editorState(s);
    try{
      const saved=await store.save({campaignId:s.campaignId,id:e.id,input:e,revision:e.revision,isCurrent:()=>allowed(s)});
      if(!allowed(s))return false;s.drafts=s.drafts.filter(row=>row.id!==saved.id).concat(saved);Object.assign(e,saved,{dirty:false});s.message='Private draft saved. Sharing with the party is a separate action.';return true;
    }catch(error){if(allowed(s))s.message='Could not save: '+error.message;return false;}
    finally{s.busy=false;editorState(s);}
  }
  async function publish(s){
    const e=s.editor;if(!allowed(s)||!e||e.dirty||!e.revision||s.busy)return;
    const expected=s.shared.find(row=>row.id===e.id)?.revision||0;
    s.busy=true;s.message='Sharing your saved recap…';editorState(s);
    try{const shared=await store.publish({campaignId:s.campaignId,id:e.id,revision:e.revision,publishedRevision:expected,isCurrent:()=>allowed(s)});if(!allowed(s))return;s.shared=s.shared.filter(row=>row.id!==e.id).concat(shared);s.editor=null;s.selected='recap:'+shared.id;s.message='Your recap is shared with the campaign.';paint(s);s.root.querySelector('#journalEntryTitle')?.focus();}
    catch(error){if(allowed(s))s.message='Could not share: '+error.message;}
    finally{s.busy=false;if(s.editor)editorState(s);else paint(s);}
  }
  async function unshare(s,id){
    const row=s.shared.find(row=>row.id===id);if(!allowed(s)||!row||row.authorId!==s.uid||s.busy)return;
    const yes=await SiteConfirmation.ask({title:'Make your recap private?',paragraphs:['The campaign’s shared copy will be removed. Your private saved draft stays in your journal.'],confirmLabel:'Make private'});
    if(!yes||!allowed(s)||s.busy)return;s.busy=true;
    try{await store.unpublish({campaignId:s.campaignId,id,publishedRevision:row.revision,isCurrent:()=>allowed(s)});if(!allowed(s))return;s.shared=s.shared.filter(row=>row.id!==id);s.selected=null;s.message='The shared copy was removed. Your private draft is kept.';}
    catch(error){if(allowed(s))s.message='Could not make private: '+error.message;}
    finally{s.busy=false;paint(s);}
  }
  function preview(s){
    if(!allowed(s)||!s.editor)return;const e=s.editor;
    const dialog=document.createElement('dialog');dialog.className='journal-preview';dialog.setAttribute('aria-labelledby','journalPreviewTitle');
    dialog.innerHTML=`<p class="journal-eyebrow">Preview · Only you</p><h2 id="journalPreviewTitle">${escape(e.title||'Untitled recap')}</h2><p class="journal-meta">${escape(subtitle({...e,type:'recap'}))}</p><div class="journal-prose">${escape(e.body)}</div>${e.remember?`<h3>Remember this</h3><div class="journal-prose">${escape(e.remember)}</div>`:''}${e.nextTime?`<h3>For next time</h3><div class="journal-prose">${escape(e.nextTime)}</div>`:''}<button type="button">Back to writing</button>`;
    const opener=document.activeElement;dialog.querySelector('button').onclick=()=>dialog.close();dialog.addEventListener('close',()=>{dialog.remove();if(opener?.isConnected)opener.focus();});document.body.append(dialog);dialog.showModal();
  }
  async function render(){
    if(!guard(render))return;clear();if(!activeCampaign||!auth.currentUser)return;
    const root=document.getElementById('tab-campaign-journal');
    const s={campaignId:activeCampaign.id,uid:auth.currentUser.uid,root,drafts:[],shared:[],chapters:[],world:[],imageUrls:[],stops:[],ready:false,denied:false,busy:false,editor:null,selected:null,filter:'all',search:'',message:'Loading your campaign journal…'};session=s;
    root.innerHTML=`<section class="campaign-journal" aria-labelledby="campaignJournalTitle"><header class="journal-hero"><p class="journal-eyebrow">${escape(activeCampaign.name)} · Our shared story</p><h2 id="campaignJournalTitle">The party journal</h2><p>What we discovered. Who we trusted. The stories we will tell when the dice are put away.</p><div class="journal-toolbar"><div class="journal-filters" role="group" aria-label="Filter journal entries"><button type="button" data-journal-filter="all" aria-pressed="true">All entries</button><button type="button" data-journal-filter="recap" aria-pressed="false">Player recaps</button><button type="button" data-journal-filter="dm" aria-pressed="false">From the DM</button></div><button type="button" class="btn-primary" data-journal-compose disabled>+ Write a session recap</button></div><div class="journal-search"><label><span>Search the journal</span><input type="search" data-journal-search placeholder="Title, session or a familiar name…"></label><button type="button" data-journal-refresh>Refresh</button></div></header><p class="journal-status" role="status" aria-live="polite" data-journal-status></p><div data-journal-content></div></section>`;
    root.querySelector('[data-journal-compose]').onclick=()=>edit(s);
    root.querySelector('[data-journal-refresh]').onclick=()=>render();
    root.querySelector('[data-journal-search]').oninput=event=>{s.search=event.target.value;paint(s);};
    root.querySelectorAll('[data-journal-filter]').forEach(button=>button.onclick=()=>{s.filter=button.dataset.journalFilter;root.querySelectorAll('[data-journal-filter]').forEach(n=>n.setAttribute('aria-pressed',String(n===button)));paint(s);});
    paint(s);
    const failed=error=>{if(!current(s))return;const denied=error?.code==='permission-denied'||error?.code==='unauthenticated';if(!denied&&s.ready){s.message='Connection interrupted. Your draft is kept here; save or refresh when your connection returns.';if(s.editor)editorState(s);else paint(s);return;}s.message='Journal unavailable. '+(denied?'Campaign access could not be verified.':'Check your connection and refresh to try again.');
      // A failed subscription must not leave private or shared text on screen after access is revoked.
      s.denied=true;s.ready=false;s.stops.forEach(stop=>stop());s.stops=[];s.drafts=[];s.shared=[];s.chapters=[];s.world=[];revokeImages(s);s.editor=null;s.selected=null;cancelLeave();document.querySelectorAll('.journal-preview').forEach(dialog=>{dialog.close();dialog.remove();});root.querySelector('[data-journal-content]').replaceChildren();root.querySelector('[data-journal-compose]').disabled=true;root.querySelector('[data-journal-status]').textContent=s.message;
    };
    try{const [data,chapterRows,worldRows]=await Promise.all([store.list(s.campaignId),chapters.list(s.campaignId),world.list(s.campaignId)]);if(!current(s))return;
      Object.assign(s,data,{chapters:chapterRows,world:worldRows,ready:true,message:'Player accounts and deliberately shared DM pages. Your drafts stay private.'});paint(s);
      s.stops.push(store.watch(s.campaignId,rows=>{if(allowed(s)){s.drafts=rows;paint(s);}},rows=>{if(allowed(s)){s.shared=rows;paint(s);}},failed));
      s.stops.push(world.watch(s.campaignId,rows=>{if(allowed(s)){s.world=rows;paint(s);}},failed));
      s.stops.push(chapters.watch(s.campaignId,rows=>{if(allowed(s)){s.chapters=rows;paint(s);}},failed));
    }catch(error){failed(error);}
  }
  window.addEventListener('beforeunload',event=>{if(session?.editor?.dirty||session?.busy){event.preventDefault();event.returnValue='';}});
  return {render,clear,guard,beforeNavigate,onAccountChanged(uid){if(session&&session.uid!==uid)clear();},get session(){return session;}};
})();
