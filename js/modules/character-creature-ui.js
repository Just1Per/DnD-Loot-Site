'use strict';
/* Adobe creature catalogue picker for Companion / Familiar / Wild Shape. */
(()=>{
  const C=typeof CharacterCreatureData!=='undefined'?CharacterCreatureData:null;
  if(!C)return;
  const ABILITIES=['str','dex','con','int','wis','cha'];

  function speedNumber(text){const match=String(text||'').match(/(?:^|,\s*)(\d+)\s*ft/i)||String(text||'').match(/(\d+)\s*ft/i);return match?Number(match[1]):30;}
  function damageText(d){if(!Array.isArray(d)||!d.length)return'';if(typeof d[0]==='number'){const dice=d[1]?`${d[0]}d${d[1]}`:String(d[0]);return `${dice}${d[2]?' '+d[2]:''}`.trim();}return [d[0],d[2]].filter(Boolean).join(' · ');}
  function attackText(row){const damage=damageText(row.d);return `${row.n}${row.r?' · '+row.r:''}${damage?' · '+damage:''}`;}
  function traitText(row){const lines=[];lines.push(`${row.type||'Creature'} · CR ${row.cr??'—'} · ${row.size||'Medium'}`);if(row.speed)lines.push(`Movement: ${row.speed}`);if(row.senses)lines.push(`Senses: ${row.senses}`);if(row.res)lines.push(`Resistances: ${row.res}`);if(row.imm)lines.push(`Immunities: ${row.imm}`);if(row.cimm)lines.push(`Condition immunities: ${row.cimm}`);if(row.traits?.length)lines.push(`Traits: ${row.traits.join(', ')}`);if(row.actions?.length)lines.push(`Special actions: ${row.actions.join(', ')}`);return lines.join('\n');}

  function candidates(query){
    const type=sheetSession?.data?.adobe?.companion?.type;
    let rows=C.search(query);
    if(type==='wildshape')rows=rows.filter(row=>row.type==='Beast');
    return rows.sort((a,b)=>a.name.localeCompare(b.name));
  }

  function renderResults(){
    const host=document.getElementById('sheetCreatureResults'),input=document.getElementById('sheetCreatureSearch');
    if(!host||!input)return;
    const rows=candidates(input.value).slice(0,18),type=sheetSession?.data?.adobe?.companion?.type;
    host.innerHTML=`<p class="sheet-help">${C.rows.length} Adobe creatures available${type==='wildshape'?' · showing Beast forms for Wild Shape':''}. ${rows.length?`Showing ${rows.length}${candidates(input.value).length>18?' of '+candidates(input.value).length:''}.`:'No matching creatures.'}</p><div class="sheet-catalog-results">${rows.map(row=>`<article><div><strong>${sheetEscape(row.name)}</strong><span>${sheetEscape(row.type)} · ${sheetEscape(row.size)} · CR ${sheetEscape(row.cr)}</span></div><button type="button" data-creature="${sheetEscape(row.id)}">Use stats</button></article>`).join('')}</div>`;
    host.querySelectorAll('[data-creature]').forEach(button=>button.onclick=()=>applyCreature(button.dataset.creature));
  }

  function setupPicker(){
    const panel=document.getElementById('sheet-companion');
    if(!panel||document.getElementById('sheetCreaturePicker'))return;
    const intro=panel.querySelector('.sheet-help'),box=document.createElement('section');
    box.id='sheetCreaturePicker';box.className='sheet-summary-box';
    box.innerHTML=`<div class="sheet-repeat-title"><h4>Adobe creature catalogue</h4><span>${C.rows.length} creatures</span></div><p class="sheet-help">Search the creature data from the Adobe sheet and copy its mechanical stats into this page. You can still edit the copied values afterward.</p><label class="sheet-field"><span>Find creature or form</span><input id="sheetCreatureSearch" type="search" placeholder="Brown Bear, Owl, Air Elemental…" autocomplete="off"></label><div id="sheetCreatureResults"></div>`;
    intro?.after(box);
    box.querySelector('#sheetCreatureSearch').addEventListener('input',renderResults);
    renderResults();
  }

  function applyCreature(id){
    const row=C.find(id),session=sheetSession;if(!row||!session)return;
    readSheetForm();
    const companion=session.data.adobe.companion;
    companion.creature=row.name;
    if(!String(companion.name||'').trim())companion.name=row.name;
    companion.size=row.size||'Medium';
    companion.profBonus=Number(row.pb||2);
    companion.ac=Number(row.ac||10);
    companion.hpMax=Math.max(1,Number(row.hp||1));
    companion.hpCurrent=companion.hpMax;
    companion.hpTemp=0;
    companion.speed=speedNumber(row.speed);
    for(let i=0;i<ABILITIES.length;i++)companion.abilities[ABILITIES[i]]=Math.max(1,Math.min(30,Number(row.scores?.[i]||10)));
    companion.attacks=(row.attacks||[]).map(attackText).join('\n');
    companion.traits=traitText(row);
    session.dirty=true;
    fillSheetForm();
    updateSheetCalculations();
    const search=document.getElementById('sheetCreatureSearch');if(search)search.value=row.name;
    renderResults();
    sheetStatus(`${row.name} stats copied from the Adobe creature catalogue. Review any feature-specific changes, then save.`);
  }

  function updatePicker(){
    if(!document.getElementById('sheetCreaturePicker'))setupPicker();
    const current=document.getElementById('sheetCreatureSearch');
    if(current&&!current.matches(':focus')&&!current.value)current.value=sheetSession?.data?.adobe?.companion?.creature||'';
    renderResults();
  }

  const baseSetup=window.setupCharacterPlayUI;
  window.setupCharacterPlayUI=function(...args){const result=baseSetup?.apply(this,args);setupPicker();return result;};
  const baseUpdate=window.updateCharacterPlayUI;
  window.updateCharacterPlayUI=function(derived,...args){const result=baseUpdate?.call(this,derived,...args);updatePicker();return result;};
})();
