'use strict';
const characterNoteCategories=['General','NPCs','Locations','Sessions','Quests','Factions','Items','Lore','Ideas'];
function setupCharacterJournal(){
 const story=document.getElementById('sheet-story'),portrait=document.createElement('section');portrait.id='sheetPortraitEditor';portrait.className='sheet-portrait-editor';
 portrait.innerHTML='<div class="sheet-portrait-preview"><span>Character portrait</span></div><div><h4>Character portrait</h4><label class="sheet-field">Choose picture<input id="sheetPortraitUpload" type="file" accept="image/png,image/jpeg,image/webp"></label><button type="button" id="sheetPortraitOverviewToggle">Add picture to Overview</button><button type="button" id="sheetPortraitRemove">Remove picture</button><p class="sheet-help" id="sheetPortraitStatus">Saved privately with your character sheet.</p></div>';
 story.querySelector('.sheet-story-left').prepend(portrait);
 document.getElementById('sheetPortraitOverviewToggle').onclick=()=>{readSheetForm();sheetSession.data.adobe.showPortraitOnOverview=!sheetSession.data.adobe.showPortraitOnOverview;sheetSession.dirty=true;updateSheetCalculations();sheetStatus('Portrait display updated. Save to keep it.');};
 document.getElementById('sheetPortraitRemove').onclick=()=>{readSheetForm();sheetSession.data.adobe.portrait='';sheetSession.data.adobe.showPortraitOnOverview=false;sheetSession.dirty=true;updateSheetCalculations();};
 document.getElementById('sheetPortraitUpload').onchange=async event=>{
  const file=event.target.files?.[0],session=sheetSession;if(!file)return;
  const status=document.getElementById('sheetPortraitStatus');
  try{
   if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw Error('Choose a PNG, JPEG or WebP image.');
   if(file.size>15*1024*1024)throw Error('Choose an image smaller than 15 MB.');
   const image=new Image(),url=URL.createObjectURL(file);
   try{await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=()=>reject(Error('This image could not be opened.'));image.src=url;});}finally{URL.revokeObjectURL(url);}
   if(sheetSession!==session)return;
   const canvas=document.createElement('canvas'),scale=Math.min(1,480/Math.max(image.naturalWidth,image.naturalHeight));canvas.width=Math.max(1,Math.round(image.naturalWidth*scale));canvas.height=Math.max(1,Math.round(image.naturalHeight*scale));
   const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(image,0,0,canvas.width,canvas.height);
   let value=canvas.toDataURL('image/jpeg',.8);if(value.length>160000)value=canvas.toDataURL('image/jpeg',.5);if(value.length>160000)throw Error('This image is too detailed. Try a smaller picture.');
   readSheetForm();session.data.adobe.portrait=value;session.dirty=true;updateSheetCalculations();status.textContent='Picture added. Save your character sheet to keep it.';
  }catch(error){status.textContent=error.message;}finally{event.target.value='';}
 };
 const host=document.getElementById('sheetJournal');host.dataset.category='All';host.dataset.selected='';renderCharacterJournal();updateCharacterPortrait();
}
function updateCharacterPortrait(){
 if(!sheetSession)return;const host=document.getElementById('sheetPortraitEditor');if(!host)return;
 const data=sheetSession.data.adobe,preview=host.querySelector('.sheet-portrait-preview');
 preview.innerHTML=data.portrait?`<img src="${sheetEscape(data.portrait)}" alt="Character portrait">`:'<span>Character portrait</span>';
 const toggle=document.getElementById('sheetPortraitOverviewToggle');toggle.disabled=!data.portrait;toggle.setAttribute('aria-pressed',String(data.showPortraitOnOverview));toggle.textContent=data.showPortraitOnOverview?'Remove picture from Overview':'Add picture to Overview';document.getElementById('sheetPortraitRemove').disabled=!data.portrait;
}
function renderCharacterJournal(){
 const host=document.getElementById('sheetJournal');if(!host||!sheetSession)return;
 const notes=sheetSession.data.adobe.journal,esc=sheetEscape,categories=[...new Set([...characterNoteCategories,...notes.map(n=>n.category)])],category=host.dataset.category||'All',search=host.dataset.search||'';
 const matches=notes.filter(n=>(category==='All'||n.category===category)&&(!search||(n.title+' '+n.text).toLowerCase().includes(search.toLowerCase())));
 let selected=matches.find(n=>n.id===host.dataset.selected)||matches[0];host.dataset.selected=selected?.id||'';
 host.innerHTML=`<div class="sheet-journal-toolbar"><label class="sheet-field">Search notes<input id="sheetJournalSearch" type="search" value="${esc(search)}"></label><button type="button" id="sheetJournalAdd">+ Add note</button></div><div class="sheet-journal-categories" aria-label="Note categories">${['All',...categories].map(c=>`<button type="button" data-note-category="${esc(c)}" aria-pressed="${c===category}">${esc(c)} <small>${notes.filter(n=>c==='All'||n.category===c).length}</small></button>`).join('')}</div><div class="sheet-journal-layout"><nav aria-label="Your notes" class="sheet-journal-list">${matches.map(n=>`<button type="button" data-open-note="${esc(n.id)}" aria-current="${n.id===selected?.id}"><strong>${esc(n.title)}</strong><small>${esc(n.category)}</small></button>`).join('')||'<p>No notes here yet.</p>'}</nav><section class="sheet-journal-editor">${selected?`<div class="sheet-grid two"><label class="sheet-field">Note title<input id="sheetJournalTitle" maxlength="150" value="${esc(selected.title)}"></label><label class="sheet-field">Category<select id="sheetJournalCategory">${categories.map(c=>`<option value="${esc(c)}" ${c===selected.category?'selected':''}>${esc(c)}</option>`).join('')}<option value="__custom">Create a category…</option></select></label></div><label class="sheet-field" id="sheetJournalCustomLabel" hidden>New category name<input id="sheetJournalCustom" maxlength="60"></label><label class="sheet-field">Notes<textarea id="sheetJournalText" maxlength="20000" rows="18">${esc(selected.text)}</textarea></label><p class="sheet-help" id="sheetJournalStatus">Save the character sheet to keep your notes.</p><button type="button" id="sheetJournalDelete">Delete this note</button>`:'<p>Create a note to start recording your adventures.</p>'}</section></div>`;
 host.querySelectorAll('[data-note-category]').forEach(b=>b.onclick=()=>{host.dataset.category=b.dataset.noteCategory;host.dataset.selected='';renderCharacterJournal();});
 host.querySelectorAll('[data-open-note]').forEach(b=>b.onclick=()=>{host.dataset.selected=b.dataset.openNote;renderCharacterJournal();});
 const searchInput=host.querySelector('#sheetJournalSearch');searchInput.oninput=()=>{const cursor=searchInput.selectionStart;host.dataset.search=searchInput.value;renderCharacterJournal();const next=host.querySelector('#sheetJournalSearch');next.focus();next.setSelectionRange?.(cursor,cursor);};
 host.querySelector('#sheetJournalAdd').onclick=()=>{if(sheetSession.data.adobe.journal.length>=300)return sheetStatus('This journal has reached 300 entries. Export a backup before removing older notes.',true);const note={id:crypto.randomUUID(),title:'New note',category:category==='All'?'General':category,text:''};sheetSession.data.adobe.journal.push(note);host.dataset.selected=note.id;host.dataset.search='';sheetSession.dirty=true;renderCharacterJournal();host.querySelector('#sheetJournalTitle').focus();};
 if(!selected)return;
 const currentNotes=()=>sheetSession.data.adobe.journal,currentNote=()=>currentNotes().find(n=>n.id===selected.id);
 const dirty=()=>{sheetSession.dirty=true;host.querySelector('#sheetJournalStatus').textContent='Unsaved notes. Save the character sheet to keep them.';};
 host.querySelector('#sheetJournalTitle').oninput=event=>{currentNote().title=event.target.value;host.querySelector('[data-open-note="'+selected.id+'"] strong').textContent=currentNote().title||'Untitled note';dirty();};
 host.querySelector('#sheetJournalText').oninput=event=>{const total=currentNotes().reduce((sum,n)=>sum+(n.id===selected.id?event.target.value:n.text).length,0);event.target.setCustomValidity(total>180000?'The journal is full. Export a backup and remove older notes before adding more.':'');if(total<=180000){currentNote().text=event.target.value;dirty();}};
 host.querySelector('#sheetJournalCategory').onchange=event=>{const custom=event.target.value==='__custom';host.querySelector('#sheetJournalCustomLabel').hidden=!custom;if(custom){host.querySelector('#sheetJournalCustom').focus();return;}currentNote().category=event.target.value;host.dataset.category='All';dirty();renderCharacterJournal();};
 host.querySelector('#sheetJournalCustom').onchange=event=>{const name=event.target.value.trim();if(!name)return;currentNote().category=name;host.dataset.category=name;dirty();renderCharacterJournal();};
 host.querySelector('#sheetJournalDelete').onclick=()=>{sheetSession.data.adobe.journal=currentNotes().filter(n=>n.id!==selected.id);sheetSession.dirty=true;host.dataset.selected='';renderCharacterJournal();};
}
