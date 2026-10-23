'use strict';
var CampaignJournal=(()=>{
  const store=createCampaignJournalStore(window.__DND_VAULT_DEPS__);
  const escape=value=>escapeHtml(String(value??''));
  let session=null,leavePrompt=null,incomingNote=null;
  const browsing=new Map(),browseKey=()=>[auth.currentUser?.uid,activeCampaign?.id].join(':');
  const prose=value=>String(value||'').split(/\n\s*\n/).filter(Boolean).map(text=>'<p>'+escape(text).replaceAll('\n','<br>')+'</p>').join('');
  function remember(s){if(current(s))browsing.set(browseKey(),{search:s.search,filter:s.filter,focusId:s.focusId,scroll:s.selected||s.editor||s.root.querySelector('[data-journal-form]')?s.listScroll:window.scrollY});}
  function restoreList(s){
    const button=[...s.root.querySelectorAll('[data-journal-read],[data-journal-edit]')].find(n=>(n.dataset.journalRead||'draft:'+n.dataset.journalEdit)===s.focusId);
    (button||s.root.querySelector('[data-journal-compose]'))?.focus({preventScroll:true});window.scrollTo(0,s.listScroll||0);
  }
  function finishEditing(s){s.editor=null;paint(s);if(s.selected)s.root.querySelector('#journalEntryTitle')?.focus();else restoreList(s);}

  const current=s=>session===s&&activeCampaign?.id===s.campaignId&&auth.currentUser?.uid===s.uid;
  const allowed=s=>current(s)&&!s.denied;
  const today=()=>{const date=new Date();return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;};
  function cancelLeave(){if(!leavePrompt)return;const p=leavePrompt;leavePrompt=null;if(p.dialog.open)p.dialog.close();p.dialog.remove();if(p.opener?.isConnected)p.opener.focus();}
  function clear(){session?.editorResizeObserver?.disconnect();if(session)remember(session);cancelLeave();document.querySelectorAll('.journal-preview').forEach(dialog=>{dialog.close();dialog.remove();});session?.stops.forEach(stop=>stop());session=null;document.getElementById('tab-campaign-journal')?.replaceChildren();}
  function guard(action){
    const s=session;if(!s)return true;if(!current(s)){clear();return true;}if(s.busy)return false;
    if(!s.editor?.dirty)return true;if(leavePrompt)return false;
    const dialog=document.createElement('dialog');dialog.className='journal-leave-dialog';dialog.id='journalLeaveDialog';dialog.setAttribute('aria-labelledby','journalLeaveTitle');
    const moderation=s.editor.mode==='moderation';
    dialog.innerHTML='<h2 id="journalLeaveTitle">Keep your recap before leaving?</h2><p>'+ (moderation?'Saving updates the campaign’s shared recap. The author’s private original is kept.':'Your changes have not been saved. Saving a draft keeps it private and does not update the party’s copy.')+'</p><p role="status" data-leave-status></p><div class="journal-actions"><button type="button" data-leave-save>Save private draft &amp; continue</button><button type="button" data-leave-discard>Discard changes</button><button type="button" data-leave-stay>Stay here</button></div>';
    if(moderation)dialog.querySelector('[data-leave-save]').textContent='Save shared changes & continue';
    const p={dialog,opener:document.activeElement,busy:false};leavePrompt=p;
    const proceed=()=>{if(!allowed(s)||leavePrompt!==p)return;s.editor=null;cancelLeave();action();};
    dialog.querySelector('[data-leave-stay]').onclick=()=>{if(!p.busy)cancelLeave();};
    dialog.querySelector('[data-leave-discard]').onclick=()=>{if(!p.busy)proceed();};
    dialog.querySelector('[data-leave-save]').onclick=async()=>{
      if(p.busy||!allowed(s))return;p.busy=true;dialog.querySelectorAll('button').forEach(b=>b.disabled=true);
      const saved=await (moderation?saveModeration(s):saveDraft(s));if(leavePrompt!==p)return;p.busy=false;
      if(saved){proceed();return;}dialog.querySelector('[data-leave-status]').textContent=s.message;dialog.querySelectorAll('button').forEach(b=>b.disabled=false);
    };
    dialog.addEventListener('cancel',event=>{event.preventDefault();if(!p.busy)cancelLeave();});
    document.body.append(dialog);dialog.showModal();dialog.querySelector('[data-leave-stay]').focus();return false;
  }
  function beforeNavigate(tab){if(tab==='campaign-journal')return true;if(!guard(()=>showTab(tab)))return false;incomingNote=null;clear();return true;}
  const byDate=(a,b)=>String(b.sessionDate||'').localeCompare(String(a.sessionDate||''))||(b.sessionNumber||0)-(a.sessionNumber||0)||(b.updatedAt||0)-(a.updatedAt||0)||a.title.localeCompare(b.title);
  function entries(s){return s.shared.map(row=>({...row,key:'recap:'+row.id,type:'recap',authorGroup:s.authorGroups?.[row.authorId]||null})).sort(byDate);}
  const subtitle=row=>`${row.authorName}${row.characterName?' as '+row.characterName:''} · Session ${row.sessionNumber} · ${row.sessionDate}`;
  const recapLabel=row=>row.authorGroup==='dm'?'DM recap':row.authorGroup==='player'?'Player recap':'Recap';
  function visibleEntries(s){return entries(s).filter(row=>(s.filter==='all'||row.authorGroup===(s.filter==='recap'?'player':'dm'))&&[row.title,row.body,row.authorName,row.characterName,row.sessionNumber].join(' ').toLowerCase().includes(s.search.toLowerCase()));}
  function card(row,index){return `<article class="journal-card ${index===0?'journal-feature':''}"><span class="journal-tag ${row.authorGroup==='player'?'journal-player':''}">${recapLabel(row)}</span><h3>${escape(row.title)}</h3><p class="journal-excerpt">${escape((row.summary||row.body).slice(0,240))}${(row.summary||row.body).length>240?'…':''}</p><p class="journal-meta">${escape(subtitle(row))}</p><button type="button" data-journal-read="${escape(row.key)}">Read recap →</button></article>`;}
  function sidebar(s){const next=visibleEntries(s).filter(row=>row.nextTime).sort(byDate)[0];return `<aside class="journal-sidebar">${next?`<section class="journal-card journal-soft"><p class="journal-eyebrow">For the next session</p><h3>A thread to pick up</h3><p class="journal-excerpt">${escape(next.nextTime)}</p><p class="journal-meta">From ${escape(next.authorName)}’s Session ${next.sessionNumber} recap</p><button type="button" data-journal-read="recap:${escape(next.id)}">Read the recap</button></section>`:''}<section class="journal-card"><p class="journal-eyebrow">Only you</p><h3>Your recap drafts</h3><p>DMs and other players cannot read your private drafts. Shared copies appear in the campaign Journal. You can make them private again; campaign DMs can edit or remove those shared copies.</p><div class="journal-drafts">${s.drafts.length?s.drafts.slice().sort(byDate).map(row=>`<button type="button" data-journal-edit="${escape(row.id)}"><strong>${escape(row.title)}</strong><span>Session ${row.sessionNumber} · ${s.shared.some(shared=>shared.id===row.id)?'Has a shared copy':'Private draft'}</span></button>`).join(''):'<p class="journal-muted">No drafts yet. A few memorable moments are enough to start.</p>'}</div></section></aside>`;}
  function paint(s){
    if(!allowed(s)||s.editor)return;
    s.editorResizeObserver?.disconnect();
    const rows=entries(s),selected=rows.find(row=>row.key===s.selected);
    const focused=document.activeElement?.dataset.journalRead;
    s.root.querySelector('.journal-hero').hidden=!!selected;
    const body=s.root.querySelector('[data-journal-content]');
    s.root.querySelector('[data-journal-status]').textContent=s.message;
    const compose=s.root.querySelector('[data-journal-compose]');compose.disabled=!s.ready||s.busy;compose.title=s.ready?'Write your own session recap':'Loading your journal access…';
    s.root.querySelector('[data-journal-refresh]').disabled=s.busy;
    s.root.querySelector('[data-journal-retry]').hidden=!s.retry&&!s.referenceProblems.size;
    s.root.querySelector('[data-journal-retry]').disabled=s.busy;
    if(selected){
      body.innerHTML=`<div class="journal-reader-heading"><button type="button" data-journal-back>← Back to Recaps</button>${selected.type==='recap'&&canManageCampaign()&&selected.authorId!==s.uid?`<div class="journal-moderation-actions" role="group" aria-label="DM recap controls"><button type="button" data-journal-moderate="${escape(selected.id)}">Edit shared recap</button><button type="button" data-journal-remove="${escape(selected.id)}">Remove from Journal</button></div>`:''}</div><div class="journal-notebook"><details class="journal-index"><summary>Other journal entries</summary><nav aria-label="Journal entries">${rows.map(row=>`<button type="button" data-journal-read="${escape(row.key)}" ${row.key===selected.key?'aria-current="page"':''}>${escape(row.title)}</button>`).join('')}</nav></details><article class="journal-leaf" aria-labelledby="journalEntryTitle"><span class="journal-tag ${selected.authorGroup==='player'?'journal-player':''}">${recapLabel(selected)} · Shared with the campaign</span><p class="journal-eyebrow">Journal → Recaps</p><h3 id="journalEntryTitle" tabindex="-1">${escape(selected.title)}</h3><p class="journal-meta">${escape(subtitle(selected))}</p>${selected.moderatedBy?'<p class="journal-meta">Edited by a campaign DM · Author’s private original kept</p>':''}<div class="journal-prose journal-reading-prose">${prose(selected.body)}</div>${selected.type==='recap'&&(selected.remember||selected.nextTime)?`<div class="journal-note-grid">${selected.remember?`<section class="journal-note"><h4>Remember this</h4><div class="journal-prose">${escape(selected.remember)}</div></section>`:''}${selected.nextTime?`<section class="journal-note"><h4>For next time</h4><div class="journal-prose">${escape(selected.nextTime)}</div></section>`:''}</div>`:''}<div class="journal-actions">${selected.type==='recap'&&selected.authorId===s.uid?`<button type="button" data-journal-edit="${escape(selected.id)}">Edit your draft</button><button type="button" data-journal-unshare="${escape(selected.id)}">Make private</button>`:''}</div></article></div>`;
    }else{
      s.selected=null;const visible=visibleEntries(s);
      body.innerHTML=`<div class="journal-grid"><section aria-label="Shared journal entries" class="journal-feed">${!s.ready?'<section class="journal-card journal-empty"><h3>Opening your journal…</h3><p>Loading shared recaps and your private drafts.</p></section>':visible.length?visible.map(card).join(''):`<section class="journal-card journal-empty"><h3>${s.filter!=='all'&&s.groupsLoading?'Loading author groups…':rows.length?'No entries match your search':'Your story starts here'}</h3><p>${rows.length?'Try another search or show all entries.':'Write your first session recap. Read completed chapters in Journal → Chapters.'}</p></section>`}</section>${sidebar(s)}</div>`;
    }
    bindContent(s);if(focused)[...body.querySelectorAll('[data-journal-read]')].find(n=>n.dataset.journalRead===focused)?.focus({preventScroll:true});
  }
  function bindContent(s){
    const host=s.root.querySelector('[data-journal-content]');
    host.querySelectorAll('[data-journal-read]').forEach(button=>button.onclick=()=>{if(!allowed(s))return;if(!s.selected){s.listScroll=window.scrollY;s.focusId=button.dataset.journalRead;}s.selected=button.dataset.journalRead;paint(s);remember(s);s.root.querySelector('#journalEntryTitle')?.focus();});
    host.querySelector('[data-journal-back]')?.addEventListener('click',()=>{s.selected=null;paint(s);restoreList(s);remember(s);});
    host.querySelectorAll('[data-journal-edit]').forEach(button=>button.onclick=()=>edit(s,button.dataset.journalEdit));
    host.querySelectorAll('[data-journal-moderate]').forEach(button=>button.onclick=()=>edit(s,button.dataset.journalModerate,{mode:'moderation'}));
    host.querySelectorAll('[data-journal-remove]').forEach(button=>button.onclick=()=>unshare(s,button.dataset.journalRemove,true));
    host.querySelectorAll('[data-journal-route]').forEach(button=>button.onclick=()=>showTab(button.dataset.journalRoute));
    host.querySelectorAll('[data-journal-unshare]').forEach(button=>button.onclick=()=>unshare(s,button.dataset.journalUnshare));
  }
  function editorState(s){
    if(!allowed(s)||!s.editor)return;
    s.root.querySelectorAll('[data-journal-form] input,[data-journal-form] textarea,[data-journal-form] select,[data-journal-form] button').forEach(node=>node.disabled=s.busy);
    s.root.querySelector('[data-journal-status]').textContent=s.message;
    s.root.querySelector('[data-journal-field=body]').setCustomValidity(s.editor.body.length>12000?'Shorten this recap copy to 12,000 characters or fewer. Your original character note is unchanged.':'');
    const submit=s.root.querySelector('[data-journal-form] button[type=submit]');
    submit.textContent=s.editor.mode==='moderation'?'Save shared changes':s.editor.audience==='party'?'Share recap':'Save draft';
    if(s.editor.mode==='moderation')s.root.querySelectorAll('[data-journal-field=authorName],[data-journal-field=characterName]').forEach(node=>node.disabled=true);
    s.root.querySelector('[data-journal-compose]').disabled=s.busy;
    s.root.querySelector('[data-journal-refresh]').disabled=s.busy;
    s.root.querySelector('[data-journal-retry]').hidden=!s.retry&&!s.referenceProblems.size;
    s.root.querySelector('[data-journal-retry]').disabled=s.busy;
  }
  function edit(s,id,options={}){
    if(!allowed(s)||!s.ready||!guard(()=>edit(s,id,options)))return;
    const moderation=options.mode==='moderation';if(moderation&&!canManageCampaign())return;
    const row=id?(moderation?s.shared:s.drafts).find(row=>row.id===id):null;
    if(id&&!row){s.message='Your saved draft is unavailable. Refresh the journal before editing.';paint(s);return;}
    if(!s.selected&&!s.editor){s.listScroll=window.scrollY;s.focusId=id?'draft:'+id:'compose';}
    s.root.querySelector('.journal-hero').hidden=true;
    s.editor={...(row||{id:crypto.randomUUID(),revision:0,title:'',body:'',authorName:String(currentUser?.name||auth.currentUser?.displayName||'Player').slice(0,100),characterName:'',sessionNumber:Math.min(9999,[...s.shared,...s.drafts].reduce((max,row)=>Math.max(max,row.sessionNumber||0),0)+1),sessionDate:today(),remember:'',nextTime:''}),audience:moderation?'party':'private',mode:moderation?'moderation':'draft',dirty:!!options.note};
    if(options.note)Object.assign(s.editor,options.note);
    s.message=moderation?'Editing the shared copy. The author’s private notes and draft stay unchanged.':options.note?'Only the selected note was copied. Review it before choosing to share with the campaign.':'Write your recap, choose who can read it, then save.';
    if(options.note?.body.length>12000)s.message+=' This note exceeds the 12,000-character recap limit. Shorten this copy before saving; the original is unchanged.';
    const e=s.editor,fields=[['sessionNumber','Session number','number',9999],['sessionDate','Session date','date',10],['authorName','Your name','text',100],['characterName','Character perspective (optional)','text',100]];
    s.root.querySelector('[data-journal-content]').innerHTML=`<section class="journal-editor"><div class="journal-reader-heading"><button type="button" data-journal-editor-back>${s.selected?'← Back to reading':'← Back to Recaps'}</button><span class="journal-tag">${moderation?'DM · Shared copy':'Private working draft'}</span></div><h3>${moderation?'Edit shared recap':'Write your session recap'}</h3><p>${moderation?'Save shared changes updates the version everyone in this campaign reads. The author’s identity and private original are preserved.':'Other players may tell the same evening differently. This is your account of the adventure.'}</p><form data-journal-form><div class="journal-actions journal-editor-actions"><button type="submit" class="btn-primary">Save draft</button><button type="button" data-journal-preview>Preview</button></div><label><span>Title</span><input data-journal-field="title" maxlength="160" value="${escape(e.title)}" required placeholder="What happened this session?"></label><label><span>Your recap</span><textarea data-journal-field="body" maxlength="12000" rows="10" required placeholder="Tell the story in your own words…">${escape(e.body)}</textarea></label><label ${moderation?'hidden':''}><span>Who can read this?</span><select data-journal-audience><option value="private">Only me · Draft</option><option value="party">Everyone in this campaign</option></select></label><details data-journal-extra><summary>Session details &amp; extra notes (optional)</summary><div class="journal-field-grid">${fields.map(([key,label,type,max])=>`<label><span>${label}</span><input data-journal-field="${key}" type="${type}" value="${escape(e[key])}" ${type==='number'?'min="1" max="9999"':`maxlength="${max}"`} ${key==='characterName'?'':'required'}></label>`).join('')}</div><div class="journal-field-grid"><label><span>Remember this</span><textarea data-journal-field="remember" maxlength="2000" rows="3">${escape(e.remember)}</textarea></label><label><span>For next time</span><textarea data-journal-field="nextTime" maxlength="2000" rows="3">${escape(e.nextTime)}</textarea></label></div></details><p class="journal-muted">${moderation?'You are editing only the shared copy. The author can later choose to publish a new version from their own private draft.':'Drafts are only visible to you. Shared recaps can be read by everyone in this campaign and can be edited or removed by campaign DMs. Editing a draft keeps the shared copy unchanged until you choose to share again.'}</p></form></section>`;
    const form=s.root.querySelector('[data-journal-form]');
    s.editorResizeObserver?.disconnect();const offset=()=>{if(form.isConnected)form.style.setProperty('--recap-editor-top',((document.querySelector('.site-header')?.getBoundingClientRect().height||0)+8)+'px');};offset();if(typeof ResizeObserver!=='undefined'){s.editorResizeObserver=new ResizeObserver(offset);const header=document.querySelector('.site-header');if(header)s.editorResizeObserver.observe(header);}
    form.oninput=event=>{const key=event.target.dataset.journalField;if(!key||!allowed(s)||s.busy)return;s.editor[key]=key==='sessionNumber'?Number(event.target.value):event.target.value;s.editor.dirty=true;s.message='Unsaved changes. Your party’s shared copy has not changed.';editorState(s);};
    form.addEventListener('invalid',event=>{const details=event.target.closest('details');if(details)details.open=true;},true);
    form.onsubmit=async event=>{event.preventDefault();if(s.editor.mode==='moderation'){if(await saveModeration(s))finishEditing(s);return;}const e=s.editor,share=e.audience==='party';if(await saveDraft(s)&&share&&allowed(s)&&s.editor===e)await publish(s);};
    s.root.querySelector('[data-journal-audience]').onchange=event=>{s.editor.audience=event.target.value;editorState(s);};
    s.root.querySelector('[data-journal-editor-back]').onclick=()=>{if(!guard(()=>finishEditing(s)))return;finishEditing(s);};
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
  async function unshare(s,id,moderation=false){
    const row=s.shared.find(row=>row.id===id);if(!allowed(s)||!row||s.busy||(moderation?!canManageCampaign():row.authorId!==s.uid))return;
    const active=()=>allowed(s)&&(!moderation||canManageCampaign());
    const yes=await SiteConfirmation.ask({title:moderation?'Remove this recap from Journal?':'Make your recap private?',paragraphs:[moderation?'This removes the campaign’s shared copy. The author’s private draft and character notes are kept. They can choose to share again later.':'The campaign’s shared copy will be removed. Your private saved draft stays in your journal.'],confirmLabel:moderation?'Remove from Journal':'Make private',isCurrent:active});
    if(!yes||!active()||s.busy)return;s.busy=true;
    try{await (moderation?store.removeShared:store.unpublish)({campaignId:s.campaignId,id,publishedRevision:row.revision,isCurrent:active});if(!allowed(s))return;s.shared=s.shared.filter(row=>row.id!==id);s.selected=null;s.message=moderation?'The shared recap was removed. The author’s private original is kept.':'The shared copy was removed. Your private draft is kept.';}
    catch(error){if(allowed(s))s.message=(moderation?'Could not remove shared recap: ':'Could not make private: ')+error.message;}
    finally{s.busy=false;paint(s);}
  }
  async function saveModeration(s){
    if(!allowed(s)||!canManageCampaign()||s.editor?.mode!=='moderation'||s.busy)return false;
    const e=s.editor;s.busy=true;s.message='Saving shared changes…';editorState(s);
    try{const shared=await store.moderate({campaignId:s.campaignId,id:e.id,input:e,publishedRevision:e.revision,isCurrent:()=>allowed(s)&&canManageCampaign()});if(!allowed(s))return false;s.shared=s.shared.filter(row=>row.id!==e.id).concat(shared);Object.assign(e,shared,{dirty:false});s.selected='recap:'+e.id;s.message='Shared recap updated. The author’s private original is unchanged.';return true;}
    catch(error){if(allowed(s))s.message='Could not update shared recap: '+error.message;return false;}
    finally{s.busy=false;editorState(s);}
  }
  function fromCharacterNote(note){
    const source=sheetSession,uid=auth.currentUser?.uid,campaignId=activeCampaign?.id;
    if(!source||source.campaignId!==campaignId||source.uid!==uid||source.character.userId!==uid||!note||typeof note.title!=='string'||typeof note.text!=='string')return;
    const copy={title:note.title,body:note.text,characterName:String(source.identity.name||'').slice(0,100)};
    const open=async()=>{if(auth.currentUser?.uid!==uid||activeCampaign?.id!==campaignId||!canUseCharacters())return;incomingNote={uid,campaignId,copy};closeCharacterSheet(true);showTab('campaign-journal',false);if(AppShell.route!=='campaign-journal'){incomingNote=null;return;}await render();};
    if(SheetNavigation.guard(open))void open();
  }
  function preview(s){
    if(!allowed(s)||!s.editor)return;const e=s.editor;
    const dialog=document.createElement('dialog');dialog.className='journal-preview';dialog.setAttribute('aria-labelledby','journalPreviewTitle');
    dialog.innerHTML=`<p class="journal-eyebrow">Preview · Only you</p><h2 id="journalPreviewTitle">${escape(e.title||'Untitled recap')}</h2><p class="journal-meta">${escape(subtitle({...e,type:'recap'}))}</p><div class="journal-prose">${escape(e.body)}</div>${e.remember?`<h3>Remember this</h3><div class="journal-prose">${escape(e.remember)}</div>`:''}${e.nextTime?`<h3>For next time</h3><div class="journal-prose">${escape(e.nextTime)}</div>`:''}<button type="button">Back to writing</button>`;
    const opener=document.activeElement;dialog.querySelector('button').onclick=()=>dialog.close();dialog.addEventListener('close',()=>{dialog.remove();if(opener?.isConnected)opener.focus();});document.body.append(dialog);dialog.showModal();
  }
  function referenceStatus(s){
    if(!allowed(s))return;
    const message=s.referenceProblems.size?'The DM/player filters are unavailable. All entries still shows recaps, and you can keep writing. Refresh to retry the filters.':'';
    s.root.querySelector('[data-journal-reference-status]').textContent=message;
    s.root.querySelector('[data-journal-retry]').hidden=!s.retry&&!s.referenceProblems.size;
  }
  async function loadReferenceFeed(s,key,feed,label){
    const failed=()=>{if(!allowed(s))return;s.groupsLoading=false;s[key]=null;s.referenceProblems.add(label);referenceStatus(s);paint(s);};
    try{
      const rows=await feed.list(s.campaignId);if(!allowed(s))return;s.groupsLoading=false;s[key]=rows;paint(s);
      const stop=feed.watch(s.campaignId,rows=>{if(!allowed(s))return;s[key]=rows;s.referenceProblems.delete(label);referenceStatus(s);paint(s);},failed);
      if(allowed(s))s.stops.push(stop);else stop();
    }catch{failed();}
  }
  async function render(){
    if(!guard(render))return;clear();if(!activeCampaign||!auth.currentUser)return;
    if(incomingNote&&(incomingNote.uid!==auth.currentUser.uid||incomingNote.campaignId!==activeCampaign.id))incomingNote=null;
    const root=document.getElementById('tab-campaign-journal'),saved=browsing.get(browseKey());
    const s={campaignId:activeCampaign.id,uid:auth.currentUser.uid,root,drafts:[],shared:[],authorGroups:null,groupsLoading:true,stops:[],referenceProblems:new Set(),retry:false,ready:false,denied:false,busy:false,editor:null,selected:null,filter:saved?.filter||'all',search:saved?.search||'',focusId:saved?.focusId,listScroll:saved?.scroll||0,message:'Loading your campaign journal…'};session=s;
    root.innerHTML=`<section class="campaign-journal" aria-labelledby="campaignJournalTitle"><header class="journal-hero"><p class="journal-eyebrow">${escape(activeCampaign.name)} · Our shared story</p><h2 id="campaignJournalTitle">The party journal</h2><p>Session recaps from your DM and fellow players. Completed chapters have their own Journal section.</p><div class="journal-toolbar"><div class="journal-filters" role="group" aria-label="Filter journal entries"><button type="button" data-journal-filter="all" aria-pressed="true">All entries</button><button type="button" data-journal-filter="recap" aria-pressed="false">Player recaps</button><button type="button" data-journal-filter="dm" aria-pressed="false">From the DM</button></div><button type="button" class="btn-primary" data-journal-compose disabled>+ Write a session recap</button></div><div class="journal-search"><label><span>Search the journal</span><input type="search" data-journal-search placeholder="Title, session or a familiar name…"></label><button type="button" data-journal-refresh>Refresh</button></div></header><p class="journal-status" role="status" aria-live="polite" data-journal-status></p><p class="journal-status" role="status" data-journal-reference-status></p><button type="button" data-journal-retry hidden>Try loading Recaps again</button><div data-journal-content></div></section>`;
    root.querySelector('[data-journal-compose]').onclick=()=>edit(s);
    root.querySelector('[data-journal-refresh]').onclick=()=>render();
    root.querySelector('[data-journal-retry]').onclick=()=>render();
    root.querySelector('[data-journal-search]').oninput=event=>{s.search=event.target.value;paint(s);};
    root.querySelectorAll('[data-journal-filter]').forEach(button=>button.onclick=()=>{s.filter=button.dataset.journalFilter;root.querySelectorAll('[data-journal-filter]').forEach(n=>n.setAttribute('aria-pressed',String(n===button)));paint(s);});
    root.querySelector('[data-journal-search]').value=s.search;root.querySelectorAll('[data-journal-filter]').forEach(n=>n.setAttribute('aria-pressed',String(n.dataset.journalFilter===s.filter)));
    paint(s);
    const failed=error=>{if(!current(s))return;s.retry=true;root.querySelector('[data-journal-retry]').hidden=false;const denied=error?.code==='permission-denied'||error?.code==='unauthenticated';if(!denied&&s.ready){s.message=s.editor?'Connection interrupted. Your draft is kept here; save or refresh when your connection returns.':'Connection interrupted. The last loaded entries are still shown. Try loading Recaps again when your connection returns.';if(s.editor)editorState(s);else paint(s);return;}s.message='Journal unavailable. '+(denied?'Campaign access could not be verified.':'Check your connection and refresh to try again.');
      // A failed subscription must not leave private or shared text on screen after access is revoked.
      s.denied=true;s.ready=false;s.stops.forEach(stop=>stop());s.stops=[];s.drafts=[];s.shared=[];s.authorGroups=null;s.editor=null;s.selected=null;cancelLeave();document.querySelectorAll('.journal-preview').forEach(dialog=>{dialog.close();dialog.remove();});root.querySelector('[data-journal-content]').replaceChildren();root.querySelector('[data-journal-compose]').disabled=true;root.querySelector('[data-journal-compose]').title='Journal access is unavailable. Check campaign membership and journal permissions.';root.querySelector('[data-journal-reference-status]').textContent='';root.querySelector('[data-journal-status]').textContent=s.message+(error?.code?' ('+error.code+')':'');
    };
    try{const data=await store.list(s.campaignId);if(!current(s))return;
      Object.assign(s,data,{ready:true,message:'DM and player recaps. Your drafts stay private.'});paint(s);if(incomingNote){const note=incomingNote.copy;incomingNote=null;edit(s,null,{note});}else if(saved)restoreList(s);
      s.stops.push(store.watch(s.campaignId,rows=>{if(allowed(s)){s.drafts=rows;paint(s);}},rows=>{if(allowed(s)){s.shared=rows;paint(s);}},failed));
      void loadReferenceFeed(s,'authorGroups',{list:store.listAuthorGroups,watch:store.watchAuthorGroups},'author groups');
    }catch(error){failed(error);}
  }
  window.addEventListener('beforeunload',event=>{if(session?.editor?.dirty||session?.busy){event.preventDefault();event.returnValue='';}});
  return {render,clear,guard,beforeNavigate,fromCharacterNote,onAccountChanged(uid){incomingNote=null;if(session&&session.uid!==uid)clear();browsing.clear();},get session(){return session;}};
})();
