'use strict';
/* Adobe creature catalogue picker for Companion / Familiar / Wild Shape. */
(()=>{
  const C=typeof CharacterCreatureData!=='undefined'?CharacterCreatureData:null;
  if(!C)return;
  const ABILITIES=['str','dex','con','int','wis','cha'];
  const FAMILIARS=new Set([
    'bat','cat','crab','frog','toad','hawk','lizard','octopus','owl','poisonous-snake',
    'quipper','fish','rat','raven','sea-horse','spider','weasel',
    'imp','pseudodragon','quasit','sprite'
  ]);
  const slug=value=>String(value||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');

  function speedNumber(text){const match=String(text||'').match(/(?:^|,\s*)(\d+)\s*ft/i)||String(text||'').match(/(\d+)\s*ft/i);return match?Number(match[1]):30;}
  function damageText(d){if(!Array.isArray(d)||!d.length)return'';if(typeof d[0]==='number'){const dice=d[1]?`${d[0]}d${d[1]}`:String(d[0]);return `${dice}${d[2]?' '+d[2]:''}`.trim();}return [d[0],d[2]].filter(Boolean).join(' · ');}
  function attackText(row){const damage=damageText(row.d);return `${row.n}${row.r?' · '+row.r:''}${damage?' · '+damage:''}`;}
  function traitText(row){const lines=[];lines.push(`${row.type||'Creature'} · CR ${row.cr??'—'} · ${row.size||'Medium'}`);if(row.speed)lines.push(`Movement: ${row.speed}`);if(row.senses)lines.push(`Senses: ${row.senses}`);if(row.res)lines.push(`Resistances: ${row.res}`);if(row.imm)lines.push(`Immunities: ${row.imm}`);if(row.cimm)lines.push(`Condition immunities: ${row.cimm}`);if(row.traits?.length)lines.push(`Traits: ${row.traits.join(', ')}`);if(row.actions?.length)lines.push(`Special actions: ${row.actions.join(', ')}`);return lines.join('\n');}

  function typeRows(){
    const type=sheetSession?.data?.adobe?.companion?.type||'companion';
    let rows=C.rows.slice();
    if(type==='wildshape')rows=rows.filter(row=>row.type==='Beast');
    if(type==='familiar')rows=rows.filter(row=>FAMILIARS.has(slug(row.id||row.name))||FAMILIARS.has(slug(row.name)));
    return rows.sort((a,b)=>a.name.localeCompare(b.name));
  }

  function filteredRows(query=''){
    const q=String(query||'').trim().toLowerCase();
    return q?typeRows().filter(row=>row.name.toLowerCase().includes(q)||String(row.type||'').toLowerCase().includes(q)):typeRows();
  }

  function creatureLabel(type){
    if(type==='familiar')return'Available familiar';
    if(type==='wildshape')return'Available Wild Shape form';
    return'Available companion';
  }

  function selectedCreature(){
    const name=sheetSession?.data?.adobe?.companion?.creature||'';
    return C.rows.find(row=>row.name===name)||null;
  }

  function renderAttackPicker(row){
    const select=document.getElementById('sheetCreatureAttack'),detail=document.getElementById('sheetCreatureAttackDetail');
    if(!select||!detail)return;
    const attacks=row?.attacks||[];
    select.innerHTML='<option value="">Choose an attack to inspect</option>'+attacks.map((attack,index)=>`<option value="${index}">${sheetEscape(attack.n)}${attack.r?' · '+sheetEscape(attack.r):''}</option>`).join('');
    select.disabled=!attacks.length;
    detail.textContent=attacks.length?'Choose an attack to see its stored range and damage.':'This creature has no stored attack entry in the Adobe catalogue.';
    select.onchange=()=>{
      const attack=attacks[Number(select.value)];
      detail.textContent=attack?attackText(attack):'Choose an attack to see its stored range and damage.';
    };
  }

  function renderPicker(){
    const select=document.getElementById('sheetCreatureSelect'),search=document.getElementById('sheetCreatureSearch'),count=document.getElementById('sheetCreatureCount');
    if(!select||!search||!sheetSession)return;
    const type=sheetSession.data.adobe.companion.type,rows=filteredRows(search.value),all=typeRows(),current=selectedCreature();
    const label=document.querySelector('[for="sheetCreatureSelect"] span');if(label)label.textContent=creatureLabel(type);
    select.innerHTML='<option value="">Choose from the Adobe creature database</option>'+rows.map(row=>`<option value="${sheetEscape(row.id)}">${sheetEscape(row.name)} · ${sheetEscape(row.type)} · CR ${sheetEscape(row.cr)}</option>`).join('');
    if(current&&rows.some(row=>row.id===current.id))select.value=current.id;
    if(count)count.textContent=`${all.length} ${type==='wildshape'?'Beast forms':type==='familiar'?'familiar options':'creatures'} available${rows.length!==all.length?` · ${rows.length} matching filter`:''}`;
    renderAttackPicker(current);
  }

  function setupPicker(){
    const panel=document.getElementById('sheet-companion');
    if(!panel||document.getElementById('sheetCreaturePicker'))return;
    const intro=panel.querySelector('.sheet-help'),box=document.createElement('section');
    box.id='sheetCreaturePicker';box.className='sheet-summary-box sheet-creature-picker';
    box.innerHTML=`<div class="sheet-repeat-title"><h4>Creature database</h4><span id="sheetCreatureCount"></span></div>
      <p class="sheet-help">The list changes with Companion, Familiar or Wild Shape. Selecting a creature copies its stored Adobe statistics and attack list into this page.</p>
      <div class="sheet-grid two">
        <label class="sheet-field"><span>Filter list</span><input id="sheetCreatureSearch" type="search" placeholder="Search by name or type…" autocomplete="off"></label>
        <label class="sheet-field" for="sheetCreatureSelect"><span>Available companion</span><select id="sheetCreatureSelect"></select></label>
      </div>
      <div class="sheet-creature-attack-picker">
        <label class="sheet-field"><span>Available attacks</span><select id="sheetCreatureAttack"></select></label>
        <p id="sheetCreatureAttackDetail" class="sheet-help"></p>
      </div>`;
    intro?.after(box);
    box.querySelector('#sheetCreatureSearch').addEventListener('input',renderPicker);
    box.querySelector('#sheetCreatureSelect').addEventListener('change',event=>{if(event.target.value)applyCreature(event.target.value);});
    renderPicker();
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
    renderPicker();
    sheetStatus(`${row.name} loaded from the Adobe creature database with ${row.attacks?.length||0} stored attack option${row.attacks?.length===1?'':'s'}. Save the sheet to keep it.`);
  }

  function updatePicker(){
    if(!document.getElementById('sheetCreaturePicker'))setupPicker();
    renderPicker();
  }

  const baseSetup=window.setupCharacterPlayUI;
  window.setupCharacterPlayUI=function(...args){const result=baseSetup?.apply(this,args);setupPicker();return result;};
  const baseUpdate=window.updateCharacterPlayUI;
  window.updateCharacterPlayUI=function(derived,...args){const result=baseUpdate?.call(this,derived,...args);updatePicker();return result;};
  document.addEventListener('change',event=>{
    if(event.target?.name==='adobe.companion.type'&&sheetSession){
      readSheetForm();
      const companion=sheetSession.data.adobe.companion;
      companion.creature='';
      companion.attacks='';
      companion.traits='';
      sheetSession.dirty=true;
      renderPicker();
      sheetStatus('Companion type changed. Choose a creature from the matching database list.');
    }
  },true);
})();
