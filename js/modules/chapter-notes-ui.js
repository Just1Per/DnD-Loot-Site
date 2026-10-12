'use strict';
var CampaignChapterNotes = (()=>{
  const store=createChapterNotesStore(window.__DND_VAULT_DEPS__);
  const escape=value=>escapeHtml(String(value??''));
  const current=s=>s.isCurrent()&&!s.denied;
  const available=(s,id)=>current(s)&&s.rows.some(row=>row.id===id);
  function state(s,id){
    if(!s.notes.has(id))s.notes.set(id,{text:'',revision:0,dirty:false,busy:false,loaded:false,status:'Open the chapter to load your personal notes.'});
    return s.notes.get(id);
  }
  function controls(s,id){
    const note=state(s,id),visible=available(s,id);
    return `<section class="chapter-personal-notes" data-chapter-note-id="${escape(id)}" aria-label="Your personal chapter notes"><label>Your private notes<textarea data-note-text maxlength="8000" rows="5" ${!note.loaded||note.busy?'disabled':''}>${escape(note.text)}</textarea></label><p>Only you can read these notes, including when the DM also uses this page.</p><p data-note-status role="status" aria-live="polite">${escape(visible?note.status:'This chapter is no longer shared. Copy your unsaved draft before leaving, or discard it.')}</p><div class="workspace-actions"><button type="button" data-note-save ${!visible||!note.loaded||note.busy||!note.dirty?'disabled':''}>Save my notes</button><button type="button" data-note-reload ${!visible||note.busy?'disabled':''}>Reload saved notes</button>${!visible?'<button type="button" data-note-discard>Discard this draft</button>':''}</div></section>`;
  }
  function orphanDrafts(s){
    const orphanIds=[...s.notes].filter(([id,note])=>note.dirty&&!s.rows.some(row=>row.id===id)).map(([id])=>id);
    return orphanIds.length?`<aside class="chapter-note-recovery" aria-label="Unsaved personal note drafts"><h3>Unsaved notes from unavailable chapters</h3>${orphanIds.map(id=>controls(s,id)).join('')}</aside>`:'';
  }
  function draw(s,id){
    if(!current(s))return;
    const host=[...s.root.querySelectorAll('[data-chapter-note-id]')].find(node=>node.dataset.chapterNoteId===id),note=state(s,id);if(!host)return;
    host.querySelector('[data-note-text]').value=note.text;host.querySelector('[data-note-text]').disabled=!note.loaded||note.busy;
    host.querySelector('[data-note-status]').textContent=available(s,id)?note.status:'This chapter is no longer shared. Copy your unsaved draft before leaving, or discard it.';
    host.querySelector('[data-note-save]').disabled=!available(s,id)||!note.loaded||note.busy||!note.dirty;
    host.querySelector('[data-note-reload]').disabled=!available(s,id)||note.busy;
  }
  async function load(s,id,reload=false){
    const note=state(s,id);if(!available(s,id)||note.busy||(!reload&&note.loaded))return;
    if(reload&&note.dirty&&!confirm('Discard your unsaved notes and reload the saved version?'))return;
    note.busy=true;note.status='Loading your private notes…';draw(s,id);
    try{const saved=await store.load(s.id,id);if(!available(s,id))return;Object.assign(note,saved,{loaded:true,dirty:false,status:'Your notes are private. Changes are saved only when you select Save my notes.'});}
    catch(error){if(current(s))note.status=`Could not load your notes: ${error.message}`;}
    finally{note.busy=false;draw(s,id);}
  }
  async function save(s,id){
    const note=state(s,id);if(!available(s,id)||note.busy||!note.loaded||!note.dirty)return;
    note.busy=true;note.saving=true;note.status='Saving your private notes…';draw(s,id);
    try{const result=await store.save({campaignId:s.id,id,text:note.text,revision:note.revision,isCurrent:()=>available(s,id)});if(!current(s))return;Object.assign(note,result,{dirty:false,status:'Your personal notes are saved.'});}
    catch(error){if(current(s))note.status=`Could not save: ${error.message}`;}
    finally{note.busy=false;note.saving=false;draw(s,id);}
  }
  function bind(s){
    s.root.querySelectorAll('[data-chapter-note-id]').forEach(host=>{
      const id=host.dataset.chapterNoteId,note=state(s,id),details=host.closest('details');
      host.querySelector('[data-note-text]').oninput=event=>{if(!current(s)||note.busy||!note.loaded)return;note.text=event.target.value;note.dirty=true;note.status='Unsaved personal notes.';draw(s,id);};
      host.querySelector('[data-note-save]').onclick=()=>save(s,id);
      host.querySelector('[data-note-reload]').onclick=()=>load(s,id,true);
      host.querySelector('[data-note-discard]')?.addEventListener('click',()=>{if(confirm('Discard this unsaved note draft?')){s.notes.delete(id);host.remove();}});
      details?.addEventListener('toggle',()=>{if(details.open)load(s,id);});
      if(details?.open)load(s,id);
    });
  }
  function beforeClear(s,force=false){
    if(!s?.notes||force)return true;
    if([...s.notes.values()].some(note=>note.saving))return false;
    return ![...s.notes.values()].some(note=>note.dirty)||confirm('Discard unsaved personal chapter notes?');
  }
  window.addEventListener('beforeunload',event=>{if(CampaignInformation.hasUnsavedNotes()){event.preventDefault();event.returnValue='';}});
  return {controls,orphanDrafts,bind,beforeClear,store};
})();
