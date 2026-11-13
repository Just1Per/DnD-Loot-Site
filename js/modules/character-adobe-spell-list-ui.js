'use strict';
/* A readable, grouped reference to the same saved spell rows. No second spell store. */
var CharacterAdobeSpellListUI=(()=>{
 let current=null;
 const esc=value=>sheetEscape(String(value??''));
 function destroy(target=current){if(target!==current){target?.remove();return;}const dialog=current;current=null;if(dialog){if(dialog.open)dialog.close();dialog.remove();}}
 function open(initialClass='all'){
  const session=sheetSession;if(!characterHPCurrent(session)||session.saving||!CharacterAdobeView.active()||!CharacterAdobeView.validate())return;
  readSheetForm();destroy();
  const opener=document.activeElement?.shadowRoot?.activeElement||document.activeElement,dialog=document.createElement('dialog');current=dialog;
  dialog.id='adobeSpellListDialog';dialog.className='vault-dialog adobe-spell-list-dialog';dialog.setAttribute('aria-labelledby','adobeSpellListTitle');dialog.dataset.noContextHelp='';
  const valid=()=>current===dialog&&dialog.isConnected&&characterHPCurrent(session)&&CharacterAdobeView.active();
  const close=()=>{const returnFocus=valid();destroy(dialog);if(returnFocus&&opener?.isConnected)opener.focus({preventScroll:true});};
  const derived=CharacterSheetModel.derive(session.data,session.identity.level,sheetEquipmentLoot()),profiles=CharacterSpellcasting.profiles(session.data,derived.progression.targetLevel,derived.scores),rows=characterSpellPresentation(session.data,derived,session.identity.level),S=CharacterSpellSummaries;
  const classes=[...profiles.map(p=>({id:p.classId,name:p.name})),...new Set(rows.map(r=>r.spell.classId||'unassigned').filter(id=>!profiles.some(p=>p.classId===id)))].map(p=>typeof p==='string'?{id:p,name:p==='unassigned'?'Unassigned / personal':CharacterAdobeEngine.className(p)}:p);
  let classId=classes.some(p=>p.id===initialClass)?initialClass:'all',query='';
  const facts=row=>[['Save',row.save||'—'],['School',row.school||'—'],['Casting time',row.spell.casting||'—'],['Range',row.range||'—'],['Components',row.spell.components||'—'],['Duration',row.spell.duration||'—']];
  dialog.innerHTML='<header><div><span class="sheet-eyebrow">SPELL REFERENCE</span><h2 id="adobeSpellListTitle">Spell list</h2><p>Short reminders by spell level. Select a spell name for full information and your notes.</p></div><button type="button" data-spell-list-close aria-label="Close spell list">×</button></header><div class="adobe-spell-list-filters"><label>Caster<select data-spell-list-caster><option value="all">All selected spells</option>'+classes.map(p=>'<option value="'+esc(p.id)+'">'+esc(p.name)+'</option>').join('')+'</select></label><label>Find a spell<input type="search" data-spell-list-search placeholder="Name, effect or school"></label></div><p class="adobe-spell-list-count" data-spell-list-count role="status"></p><div class="adobe-spell-list-scroll" data-spell-list-results></div><footer><button type="button" data-spell-list-done>Done</button></footer>';
  const select=dialog.querySelector('[data-spell-list-caster]');select.value=classId;
  function draw(){
   if(!valid()){destroy(dialog);return;}
   const selected=rows.filter(row=>(classId==='all'||(row.spell.classId||'unassigned')===classId)&&(!query||[row.spell.name,row.shortDescription,row.school,row.save].join(' ').toLowerCase().includes(query)));
   dialog.querySelector('[data-spell-list-count]').textContent=selected.length+' selected spell'+(selected.length===1?'':'s')+' · '+session.data.build.edition+' rules';
   const groups=[...new Set(selected.map(row=>row.spell.level))].sort((a,b)=>a-b);
   dialog.querySelector('[data-spell-list-results]').innerHTML=groups.map(level=>{
    const group=selected.filter(row=>row.spell.level===level);
    return'<section class="adobe-spell-level" data-spell-list-level="'+level+'"><h3>'+S.levelLabel(level)+' <span>'+group.length+'</span></h3><div class="adobe-spell-list-columns" aria-hidden="true"><span>Spell</span><span>Short description</span>'+['Save','School','Time','Range','Comp.','Duration'].map(label=>'<span>'+label+'</span>').join('')+'</div>'+group.map(row=>{
     const spell=row.spell,id='spell-reference-'+row.i,notes=[row.invocation?CharacterClassFeatureChoices.cantripModifierText(row.invocation):'',row.mark?[row.mark.detail,...row.mark.notes].join(' '):'',row.beast?.relevant?row.beast.label:''].filter(Boolean),state=level===0?'Cantrip':row.automatic?'Always prepared':spell.prepared?'Prepared':row.profile?.mode==='known'?'Known':'Not prepared';
     return'<article class="adobe-spell-list-row" data-spell-list-index="'+row.i+'" aria-labelledby="'+id+'"><div class="adobe-spell-list-name"><button type="button" id="'+id+'" data-spell-list-full="'+row.i+'" aria-expanded="false" aria-controls="'+id+'-details">'+esc(spell.name.replace(/\s*\[(2014|2024)\]$/,''))+'</button><small>'+esc([state,row.profile?.name||spell.classId||'Personal',row.c?.edition||'Personal'].join(' · '))+'</small></div><div class="adobe-spell-list-summary" data-spell-list-summary>'+esc(row.shortDescription)+notes.map(note=>'<small>'+esc(note)+'</small>').join('')+'</div><dl>'+facts(row).map(([label,value])=>'<div><dt>'+label+'</dt><dd title="'+esc(value)+'">'+esc(label==='Casting time'?S.compact('time',value):value)+'</dd></div>').join('')+'</dl><div class="adobe-spell-list-detail" id="'+id+'-details" hidden><h4>Full information &amp; notes</h4><dl>'+facts(row).map(([label,value])=>'<div><dt>'+label+'</dt><dd>'+esc(value)+'</dd></div>').join('')+'</dl><p>'+esc(row.description)+'</p><p class="adobe-spell-list-source">'+esc([row.c?.book||row.book,row.page?'p. '+row.page:'',row.c?.edition,row.c?.license].filter(Boolean).join(' · '))+'</p></div></article>';
    }).join('')+'</section>';
   }).join('')||'<p class="adobe-spell-list-empty">'+(rows.length?'No spells match these filters.':'No spells selected. Use Choose spells on the spell sheet to add them.')+'</p>';
   for(const button of dialog.querySelectorAll('[data-spell-list-full]'))button.onclick=()=>{if(!valid()){destroy(dialog);return;}const details=document.getElementById(button.getAttribute('aria-controls'));details.hidden=!details.hidden;button.setAttribute('aria-expanded',String(!details.hidden));};
  }
  select.onchange=()=>{classId=select.value;draw();};dialog.querySelector('[data-spell-list-search]').oninput=event=>{query=event.target.value.trim().toLowerCase();draw();};
  for(const button of dialog.querySelectorAll('[data-spell-list-close],[data-spell-list-done]'))button.onclick=close;
  dialog.addEventListener('cancel',event=>{event.preventDefault();close();});dialog.addEventListener('close',()=>{if(current===dialog)destroy();});
  document.body.append(dialog);draw();if(typeof SiteHelp!=='undefined')SiteHelp.hide();dialog.showModal();dialog.querySelector('[data-spell-list-search]').focus();
 }
 return{open,destroy};
})();
if(typeof globalThis!=='undefined')globalThis.CharacterAdobeSpellListUI=CharacterAdobeSpellListUI;
