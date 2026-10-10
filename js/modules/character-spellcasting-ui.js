'use strict';
/* Adobe-inspired generated spell sheet workflow.
 * Spell choices are class-aware, and preparation controls only appear where the class needs them. */
(()=>{
  const S=typeof CharacterSpellcasting!=='undefined'?CharacterSpellcasting:null;
  if(!S)return;
  let generatorClassId='';
  let generatorDrafts=new Map();

  function draftMap(classId){
    if(!generatorDrafts.has(classId)){
      const rows=currentClassSpells(classId).filter(row=>row.catalogId).map(row=>[row.catalogId,{...row}]);
      generatorDrafts.set(classId,new Map(rows));
    }
    const map=generatorDrafts.get(classId),p=classProfile(classId);
    for(const spell of grants(p))map.set(spell.id,{...(map.get(spell.id)||CharacterCatalog.spellRow(spell)),classId,prepared:true});
    return map;
  }
  function grants(p){return S.automaticGrants(p,CharacterCatalog.rawData?.spells||[]);}
  function counted(p,rows){return S.countedSelections(p,rows,CharacterCatalog.rawData?.spells||[]);}
  function draftRows(classId){return [...draftMap(classId).values()];}
  function setDraftSpell(profile,spellId,selected){
    if(grants(profile).some(s=>s.id===spellId))return;
    const map=draftMap(profile.classId),spell=CharacterCatalog.find(spellId);
    if(selected&&spell&&CampaignRules.allowed(spell)){
      const current=map.get(spell.id);
      map.set(spell.id,{...(current||CharacterCatalog.spellRow(spell)),classId:profile.classId});
    }else map.delete(spellId);
  }

  const esc=value=>sheetEscape(String(value??''));
  const signed=value=>CharacterSheetModel.signed(Number(value)||0);
  const abilityName=key=>CharacterSheetModel.abilities[key]||String(key||'').toUpperCase();
  function stats(){return sheetSession?CharacterSheetModel.derive(sheetSession.data,sheetSession.identity.level,sheetEquipmentLoot()):null;}
  function profiles(d=stats()){return sheetSession&&d?S.profiles(sheetSession.data,d.progression?.targetLevel||sheetSession.identity.level,d.scores):[];}
  function currentClassSpells(id){return sheetSession.data.spells.filter(spell=>spell.classId===id);}
  function classProfile(id,d=stats()){const rows=profiles(d);return rows.find(p=>p.classId===id)||(!id&&rows.length===1?rows[0]:null);}

  function setup(){
    const panel=document.getElementById('sheet-spells');
    if(!panel||document.getElementById('sheetSpellGeneration'))return;
    const box=document.createElement('section');
    box.id='sheetSpellGeneration';
    box.className='sheet-spell-generation';
    box.innerHTML='<div class="sheet-repeat-title"><div><span class="sheet-eyebrow">SPELLCASTING</span><h4>Generated spell sheets</h4></div><button type="button" id="sheetGenerateSpells" class="btn-primary">Generate spell sheet</button></div><div id="sheetSpellClassSummary" class="sheet-spell-class-summary"></div><div id="sheetAutoSlotSummary" class="sheet-auto-slot-summary"></div>';
    panel.querySelector('h3')?.after(box);

    const manual=panel.querySelector(':scope > .sheet-grid');
    if(manual){manual.hidden=true;manual.dataset.engineManaged='spellcasting';}
    const legacyMetrics=panel.querySelector(':scope > .sheet-metrics');if(legacyMetrics)legacyMetrics.hidden=true;
    const oldSlots=panel.querySelector('.sheet-slot-grid');
    if(oldSlots){oldSlots.hidden=true;const details=oldSlots.closest('details');if(details)details.hidden=true;}
    const oldSlotHeading=[...panel.querySelectorAll('h4')].find(h=>h.textContent.trim()==='Spell slots');if(oldSlotHeading)oldSlotHeading.hidden=true;
    const oldHelp=[...panel.querySelectorAll('.sheet-help')].find(p=>/Set totals for your class and level|Spell-slot totals are calculated/i.test(p.textContent));if(oldHelp)oldHelp.hidden=true;
    const oldHeading=[...panel.querySelectorAll('h4')].find(h=>/Known & prepared spells/i.test(h.textContent));if(oldHeading)oldHeading.hidden=true;
    const add=document.getElementById('sheetAddSpell');
    if(add){add.textContent='+ Manual / DM-approved spell';add.title='For a granted spell, homebrew spell, or other exception.';}

    const dialog=document.createElement('dialog');
    dialog.id='sheetSpellGenerator';
    dialog.className='sheet-spell-generator';
    dialog.innerHTML='<div class="sheet-page-manager-head"><div><span class="sheet-eyebrow">SPELL BUILDER</span><h3>Generate spell sheet</h3></div><button type="button" data-close-generator aria-label="Close">×</button></div><div class="sheet-spell-generator-body"><div class="sheet-spell-generator-filters"><label class="sheet-field"><span>Spellcasting class</span><select id="spellGeneratorClass"></select></label><label class="sheet-field"><span>Spell level</span><select id="spellGeneratorLevel"><option value="">All reachable levels</option><option value="0">Cantrips</option>'+Array.from({length:9},(_,i)=>'<option value="'+(i+1)+'">Level '+(i+1)+'</option>').join('')+'</select></label><label class="sheet-field"><span>School of magic</span><select id="spellGeneratorSchool"><option value="">All schools</option>'+CharacterCatalog.schools.map(s=>'<option value="'+esc(s)+'">'+esc(s)+'</option>').join('')+'</select></label><label class="sheet-field sheet-spell-search-field"><span>Find spell</span><input id="spellGeneratorSearch" type="search" placeholder="Name, school, damage type…" autocomplete="off"></label></div><div id="spellGeneratorRequirement" class="sheet-spell-generator-requirement"></div><div id="spellGeneratorCount" class="sheet-spell-generator-count" aria-live="polite"></div><div id="spellGeneratorResults" class="sheet-spell-generator-results"></div></div><div class="sheet-page-manager-actions"><button type="button" data-close-generator>Cancel</button><button type="button" id="spellGeneratorApply" class="btn-primary">Generate / update sheet</button></div>';
    document.getElementById('characterSheetDialog').append(dialog);
    document.getElementById('sheetGenerateSpells').onclick=()=>openGenerator();
    dialog.querySelectorAll('[data-close-generator]').forEach(button=>button.onclick=()=>dialog.close());
    dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});
    dialog.querySelector('#spellGeneratorClass').onchange=event=>{generatorClassId=event.target.value;renderGenerator();};
    dialog.querySelector('#spellGeneratorSearch').oninput=renderList;
    dialog.querySelector('#spellGeneratorLevel').onchange=renderList;
    dialog.querySelector('#spellGeneratorSchool').onchange=renderList;
    dialog.querySelector('#spellGeneratorApply').onclick=applyGenerated;
  }

  async function openGenerator(classId=''){
    if(!sheetSession)return;
    try{if(!CharacterCatalog.data)await CharacterCatalog.load();}catch(error){sheetStatus('Could not load spell catalogue: '+error.message,true);return;}
    readSheetForm();
    if(!CampaignRules.editions().includes(sheetSession.data.build.edition)){sheetStatus('This character uses an edition that the DM has hidden. Existing spells are retained; choose an available rules edition before generating new spells.',true);return;}
    const rows=profiles();
    if(!rows.length){sheetStatus('This character has no spellcasting class to generate from.',true);return;}
    generatorDrafts=new Map();
    if(rows.some(p=>p.classId===classId))generatorClassId=classId;
    if(!rows.some(p=>p.classId===generatorClassId))generatorClassId=rows[0].classId;
    const select=document.getElementById('spellGeneratorClass');
    select.innerHTML=rows.map(p=>'<option value="'+esc(p.classId)+'">'+esc(p.name)+' · level '+p.level+'</option>').join('');
    select.value=generatorClassId;
    document.getElementById('spellGeneratorSearch').value='';
    document.getElementById('spellGeneratorLevel').value='';
    document.getElementById('spellGeneratorSchool').value='';
    renderGenerator();
    document.getElementById('sheetSpellGenerator').showModal();
  }

  function currentProfile(){return classProfile(generatorClassId);}
  function renderGenerator(){
    const p=currentProfile();
    if(!p)return;
    const existing=counted(p,draftRows(p.classId)),cantrips=existing.filter(s=>s.level===0).length,leveled=existing.filter(s=>s.level>0).length,prepared=existing.filter(s=>s.level>0&&s.prepared).length;
    const detail=[],casting=S.castingStats(p,stats(),sheetSession.data);
    document.querySelector('#sheetSpellGenerator h3').textContent=p.name+' spell sheet';
    document.getElementById('spellGeneratorApply').textContent='Update '+p.name+' sheet';
    if(p.cantrips)detail.push(p.cantrips+' cantrip'+(p.cantrips===1?'':'s'));
    if(p.mode==='spellbook')detail.push('at least '+p.bookMinimum+' spellbook spells from leveling','prepare '+p.spellCount);
    else detail.push(p.spellCount+' '+S.modeLabel(p).toLowerCase());
    document.getElementById('spellGeneratorRequirement').innerHTML='<strong>'+esc(p.name)+' '+p.level+' · '+esc(p.edition)+'</strong><span>'+detail.join(' · ')+'</span><small>Reachable spell level: '+(p.maxSpellLevel||'cantrips only')+' · Spellcasting ability: '+esc(abilityName(p.ability))+' '+signed(casting.modifier)+' · Spell attack '+signed(casting.attack)+' · Save DC '+casting.dc+' · '+(p.changeTiming==='long-rest'?'List can be changed after a long rest.':'List normally changes when you gain a class level.')+'</small><small>Selected in this builder: '+cantrips+' cantrips · '+leveled+' level 1+ spells'+(p.mode==='spellbook'?' · '+prepared+' prepared':'')+'.</small>';
    renderList();
  }

  function eligible(p){
    if(!CharacterCatalog.data)return[];
    return CharacterCatalog.spells({edition:sheetSession.data.build.edition,classId:p.classId}).filter(spell=>Number(spell.level)<=p.maxSpellLevel);
  }
  function renderList(){
    const p=currentProfile(),host=document.getElementById('spellGeneratorResults');
    if(!p||!host||!CharacterCatalog.data)return;
    const q=(document.getElementById('spellGeneratorSearch').value||'').trim();
    const lvl=document.getElementById('spellGeneratorLevel').value;
    const school=document.getElementById('spellGeneratorSchool').value;
    const existing=draftMap(p.classId);
    let rows=CharacterCatalog.spells({
      edition:sheetSession.data.build.edition,
      classId:p.classId,
      level:lvl,
      school,
      search:q
    }).filter(spell=>Number(spell.level)<=p.maxSpellLevel);
    for(const spell of grants(p))if(!rows.some(s=>s.id===spell.id)&&(lvl===''||String(spell.level)===lvl)&&(!school||spell.school===school)&&(!q||spell.name.toLowerCase().includes(q.toLowerCase())))rows.push(spell);
    rows.sort((a,b)=>a.level-b.level||a.name.localeCompare(b.name));
    host.innerHTML=rows.map(spell=>{
      const old=existing.get(spell.id),checked=!!old,automatic=grants(p).some(s=>s.id===spell.id);
      const prep=p.mode==='spellbook'&&spell.level>0?'<label class="sheet-spell-prepared-choice"><input type="checkbox" data-spell-prepared data-spell-id="'+esc(spell.id)+'" '+(old?.prepared?'checked ':'')+(checked?'':'disabled')+'><span>Prepared</span></label>':'';
      return '<article class="sheet-spell-generator-row"><label><input type="checkbox" data-spell-pick data-spell-id="'+esc(spell.id)+'" '+(checked?'checked':'')+(automatic?' disabled':'')+'><span><strong>'+esc(spell.name)+'</strong><small>'+(spell.level?'Level '+spell.level:'Cantrip')+' · '+esc(spell.school||'')+' · '+esc(spell.source||spell.book||'')+(automatic?' · Always prepared':'')+'</small></span></label>'+prep+'<button type="button" class="sheet-info-button" data-spell-info="'+esc(spell.id)+'">i</button></article>';
    }).join('')||'<p class="sheet-empty">No eligible spells match this filter.</p>';
    host.querySelectorAll('[data-spell-info]').forEach(button=>button.onclick=()=>openSpellInformation({catalogId:button.dataset.spellInfo}));
    host.querySelectorAll('[data-spell-pick]').forEach(input=>input.onchange=()=>{
      setDraftSpell(p,input.dataset.spellId,input.checked);
      const prep=[...host.querySelectorAll('[data-spell-prepared]')].find(el=>el.dataset.spellId===input.dataset.spellId);
      if(prep){
        prep.disabled=!input.checked;
        if(!input.checked)prep.checked=false;
        const row=draftMap(p.classId).get(input.dataset.spellId);
        if(row)row.prepared=prep.checked;
      }
      updateCount();
    });
    host.querySelectorAll('[data-spell-prepared]').forEach(input=>input.onchange=()=>{
      const row=draftMap(p.classId).get(input.dataset.spellId);
      if(row)row.prepared=input.checked;
      updateCount();
    });
    updateCount();
  }

  function selections(){
    const p=currentProfile();
    return p?draftRows(p.classId):[];
  }
  function selectionError(p,rows){
    rows=counted(p,rows);
    const cantrips=rows.filter(s=>s.level===0),leveled=rows.filter(s=>s.level>0),prepared=leveled.filter(s=>s.prepared);
    if(cantrips.length>p.cantrips)return 'Too many cantrips: choose at most '+p.cantrips+'. You currently have '+cantrips.length+'.';
    if(p.mode==='spellbook'){
      if(prepared.length>p.spellCount)return 'Too many prepared Wizard spells: prepare at most '+p.spellCount+'. You currently have '+prepared.length+'.';
    }else if(leveled.length>p.spellCount)return 'Too many level 1+ spells: choose at most '+p.spellCount+'. You currently have '+leveled.length+'.';
    return'';
  }
  function completionNotice(p,rows){
    rows=counted(p,rows);
    const cantrips=rows.filter(s=>s.level===0),leveled=rows.filter(s=>s.level>0),prepared=leveled.filter(s=>s.prepared),parts=[];
    if(cantrips.length<p.cantrips)parts.push((p.cantrips-cantrips.length)+' cantrip'+(p.cantrips-cantrips.length===1?'':'s')+' remaining');
    if(p.mode==='spellbook'){
      if(leveled.length<p.bookMinimum)parts.push((p.bookMinimum-leveled.length)+' spellbook spell'+(p.bookMinimum-leveled.length===1?'':'s')+' remaining from level progression');
      if(prepared.length<p.spellCount)parts.push((p.spellCount-prepared.length)+' prepared spell'+(p.spellCount-prepared.length===1?'':'s')+' remaining');
    }else if(leveled.length<p.spellCount)parts.push((p.spellCount-leveled.length)+' '+S.modeLabel(p).toLowerCase()+' remaining');
    return parts.length?'Incomplete: '+parts.join(' · ')+'. You can still generate and continue later.':'Ready to generate.';
  }
  function updateCount(){
    const p=currentProfile(),count=document.getElementById('spellGeneratorCount');
    if(!p||!count)return;
    const rows=counted(p,selections()),cantrips=rows.filter(s=>s.level===0).length,leveled=rows.filter(s=>s.level>0).length,prepared=rows.filter(s=>s.level>0&&s.prepared).length;
    const parts=['Cantrips '+cantrips+'/'+p.cantrips];
    if(p.mode==='spellbook')parts.push('Spellbook '+leveled+'/'+p.bookMinimum+' minimum','Prepared '+prepared+'/'+p.spellCount);
    else parts.push(S.modeLabel(p)+' '+leveled+'/'+p.spellCount);
    if(grants(p).length)parts.push(grants(p).length+' always prepared · additional to allowance');
    const error=selectionError(p,rows),notice=completionNotice(p,rows);
    count.innerHTML='<strong>'+parts.join(' · ')+'</strong><small>'+esc(error||notice)+'</small>';
    count.classList.toggle('is-invalid',!!error);
    count.classList.toggle('is-incomplete',!error&&notice.startsWith('Incomplete:'));
  }
  function applyGenerated(){
    const p=currentProfile();
    if(!p)return;
    const rows=selections(),error=selectionError(p,rows),notice=completionNotice(p,rows);
    if(error){sheetStatus(error,true);updateCount();return;}
    readSheetForm();
    const other=sheetSession.data.spells.filter(spell=>spell.classId!==p.classId);
    for(const row of rows){
      row.classId=p.classId;
      if(p.mode!=='spellbook')row.prepared=p.mode==='prepared'||p.mode==='fixed-prepared';
    }
    const manual=sheetSession.data.spells.filter(spell=>spell.classId===p.classId&&!spell.catalogId);
    if(other.length+rows.length+manual.length>150){sheetStatus('Too many spell rows. Remove unused spells before generating.',true);return;}
    sheetSession.data.spells=[...other,...manual,...rows];
    sheetSession.dirty=true;
    renderSheetRows();fillSheetForm();updateSheetCalculations();
    document.getElementById('sheetSpellGenerator').close();
    sheetStatus((notice.startsWith('Incomplete:')?p.name+' partial spell sheet updated. ':p.name+' spell sheet generated. ')+(notice.startsWith('Incomplete:')?notice+' ':'')+'Save the character sheet to keep it.');
  }

  function syncSlots(d){
    const totals=d.effects?.slotMax||[];
    totals.forEach((max,i)=>{
      if(!sheetSession.data.slots[i])return;
      max=Math.max(0,Number(max)||0);
      sheetSession.data.slots[i].max=max;
      sheetSession.data.slots[i].used=Math.min(max,Number(sheetSession.data.slots[i].used)||0);
      const maxInput=document.querySelector('[name="slots.'+i+'.max"]'),usedInput=document.querySelector('[name="slots.'+i+'.used"]');
      if(maxInput)maxInput.value=max;
      if(usedInput)usedInput.value=sheetSession.data.slots[i].used;
    });
  }
  function renderSummary(d){
    const host=document.getElementById('sheetSpellClassSummary'),slotHost=document.getElementById('sheetAutoSlotSummary');
    if(!host||!slotHost||!sheetSession)return;
    const rows=profiles(d);
    if(!rows.length){host.innerHTML='<p class="sheet-help">No spellcasting class detected.</p>';slotHost.innerHTML='';return;}
    host.hidden=true;host.innerHTML=''; // Per-class counts and casting statistics now live with each spell sheet.
    syncSlots(d);
    const totals=d.effects?.slotMax||[];
    if(d.progression?.pact)sheetSession.data.adobe.pactSlotsUsed=d.progression.pact.used;
    slotHost.innerHTML='<div class="sheet-repeat-title"><h4>'+(rows.filter(p=>p.classId!=='warlock').length>1?'Shared spell slots':'Spell slots')+'</h4><div class="sheet-slot-actions"><button type="button" data-reset-slots>Long rest · restore all</button><button type="button" data-toggle-overview-slots>'+(sheetSession.data.adobe?.showSpellSlotsOnOverview?'Remove spell slots from Overview':'Add spell slots to Overview')+'</button></div></div><div class="sheet-auto-slot-grid sheet-auto-slot-orbs">'+totals.map((max,i)=>{
      max=Number(max)||0;if(!max)return'';
      const used=Math.min(max,Number(sheetSession.data.slots[i]?.used)||0),left=max-used;
      return '<article><span>Level '+(i+1)+'</span><div class="sheet-slot-orb-row">'+Array.from({length:max},(_,j)=>'<button type="button" class="sheet-slot-orb" data-auto-slot-level="'+i+'" data-auto-slot-number="'+j+'" aria-label="Level '+(i+1)+' spell slot '+(j+1)+', '+(j<used?'used':'available')+'" aria-pressed="'+(j<used)+'"></button>').join('')+'</div><small>'+left+' / '+max+' available</small></article>';
    }).join('')+'</div>'+(d.progression?.pact?'<section class="sheet-pact-slot-pool"><div class="sheet-repeat-title"><h4>Warlock · Pact Magic slots</h4><button type="button" data-reset-pact>Short rest · restore Pact Magic</button></div><p class="sheet-help">Level '+d.progression.pact.slotLevel+' · Separate from Spellcasting slots · Short or long rest recovery</p><div class="sheet-slot-orb-row">'+Array.from({length:d.progression.pact.count},(_,j)=>'<button type="button" class="sheet-slot-orb" data-pact-slot="'+j+'" aria-label="Warlock Pact Magic slot '+(j+1)+', '+(j<d.progression.pact.used?'used':'available')+'" aria-pressed="'+(j<d.progression.pact.used)+'"></button>').join('')+'</div><small>'+(d.progression.pact.count-d.progression.pact.used)+' / '+d.progression.pact.count+' available</small></section>':'');
    slotHost.querySelector('[data-reset-slots]')?.addEventListener('click',()=>{readSheetForm();for(const slot of sheetSession.data.slots)slot.used=0;sheetSession.data.adobe.pactSlotsUsed=0;sheetSession.dirty=true;updateSheetCalculations();sheetStatus('Spell slots restored. Save to keep the change.');});
    slotHost.querySelector('[data-reset-pact]')?.addEventListener('click',()=>{readSheetForm();sheetSession.data.adobe.pactSlotsUsed=0;sheetSession.dirty=true;updateSheetCalculations();sheetStatus('Pact Magic slots restored. Save to keep the change.');});
    slotHost.querySelectorAll('[data-pact-slot]').forEach(button=>button.onclick=()=>{readSheetForm();const j=Number(button.dataset.pactSlot),used=sheetSession.data.adobe.pactSlotsUsed;sheetSession.data.adobe.pactSlotsUsed=j<used?j:j+1;sheetSession.dirty=true;updateSheetCalculations();sheetStatus('Pact Magic slot use changed. Save to keep it.');});
    slotHost.querySelector('[data-toggle-overview-slots]')?.addEventListener('click',()=>{readSheetForm();sheetSession.data.adobe.showSpellSlotsOnOverview=!sheetSession.data.adobe.showSpellSlotsOnOverview;sheetSession.dirty=true;updateSheetCalculations();sheetStatus((sheetSession.data.adobe.showSpellSlotsOnOverview?'Spell slots added to':'Spell slots removed from')+' Overview. Save the character sheet to keep this preference.');});
    slotHost.querySelectorAll('[data-auto-slot-level]').forEach(button=>button.onclick=()=>{
      readSheetForm();const i=Number(button.dataset.autoSlotLevel),j=Number(button.dataset.autoSlotNumber),slot=sheetSession.data.slots[i],max=Number(d.effects.slotMax?.[i])||0;
      if(!slot)return;slot.used=Math.max(0,Math.min(max,j<(Number(slot.used)||0)?j:j+1));
      sheetSession.dirty=true;updateSheetCalculations();sheetStatus('Spell slot use changed. Save to keep it.');
    });
  }

  function adoptLegacySpells(d){
    const rows=profiles(d);
    if(rows.length!==1)return;
    let changed=false;
    for(const spell of sheetSession.data.spells)if(!spell.classId){spell.classId=rows[0].classId;changed=true;}
    if(changed)sheetSession.dirty=true;
  }

  function renderGeneratedTable(d){
    const host=document.getElementById('sheetSpellReadout');
    if(!host||!sheetSession)return;
    adoptLegacySpells(d);
    const all=sheetSession.data.spells.map((spell,i)=>({spell,i}));
    const classProfiles=profiles(d),known=new Set(classProfiles.map(p=>p.classId));
    const other=all.filter(({spell})=>!known.has(spell.classId));
    const sheets=classProfiles.map(p=>({profile:p,rows:all.filter(({spell})=>spell.classId===p.classId)}));
    if(other.length)sheets.push({profile:null,rows:other});
    host.innerHTML=sheets.map(({profile:p,rows})=>{
      const showPrepared=p?.mode==='spellbook',colspan=showPrepared?12:11;
      rows.sort((a,b)=>a.spell.level-b.spell.level||a.spell.name.localeCompare(b.spell.name));
      const casting=p?S.castingStats(p,d,sheetSession.data):null,counts=p?S.selectionCounts(p,rows.map(row=>row.spell),CharacterCatalog.rawData?.spells||[]):null;
      const amount=p?.mode==='known'?counts.leveled:counts?.prepared;
      const count=p?counts.cantrips+'/'+p.cantrips+' cantrips · '+amount+'/'+p.spellCount+' '+(p.mode==='spellbook'?'prepared spells':S.modeLabel(p).toLowerCase())+(p.mode==='spellbook'?' · '+counts.leveled+' in spellbook':'')+(counts.automatic?' · '+counts.automatic+' always prepared (extra)':''):'';
      const pool=p?(p.classId==='warlock'?'Pact Magic: '+(d.progression?.pact?.count||0)+' slots at level '+(d.progression?.pact?.slotLevel||1)+' · Separate pool above':(classProfiles.filter(profile=>profile.classId!=='warlock').length>1?'Shared Spellcasting slots above':'Spellcasting slots above')):'';
      const header=p?'<header class="sheet-class-spell-header"><div><span class="sheet-eyebrow">'+esc(p.name)+' · Level '+p.level+' · '+esc(p.edition)+'</span><h4>'+esc(p.name)+' spell sheet</h4><p>'+esc(count)+'</p></div><button type="button" class="btn-primary" data-generate-class="'+esc(p.classId)+'">Generate / update '+esc(p.name)+'</button></header><dl class="sheet-class-spell-metrics"><div><dt>Spellcasting ability</dt><dd>'+esc(abilityName(casting.ability))+' '+signed(casting.modifier)+'</dd></div><div><dt>Spell attack</dt><dd>'+signed(casting.attack)+'</dd></div><div><dt>Save DC</dt><dd>'+casting.dc+'</dd></div><div><dt>Maximum spell level</dt><dd>'+p.maxSpellLevel+'</dd></div></dl><p class="sheet-help">'+esc(pool)+'</p>':'<header class="sheet-class-spell-header"><div><h4>Other / unassigned spells</h4><p>Choose a class for each spell to use its preparation allowance and casting ability.</p></div></header>';
      const table=rows.map(({spell,i})=>{
        const catalog=CharacterCatalog.find(spell.catalogId),description=catalog?.shortDescription||catalog?.description||spell.notes||'Source reference only';
        const automatic=grants(p).some(s=>s.id===spell.catalogId);
        const prep=showPrepared?'<td>'+(spell.level===0?'—':automatic?'Always':'<button type="button" data-generated-prepare="'+i+'" class="sheet-slot-orb" aria-label="Prepare '+esc(spell.name)+' for '+esc(p.name)+'" aria-pressed="'+spell.prepared+'"></button>')+'</td>':'';
        const assignment=!p?'<select data-spell-assign="'+i+'" aria-label="Spellcasting class for '+esc(spell.name)+'"><option value="">'+esc(spell.classId||'Choose class')+'</option>'+classProfiles.map(profile=>'<option value="'+esc(profile.classId)+'">'+esc(profile.name)+'</option>').join('')+'</select>':'';
        return '<tr data-class-spell-index="'+i+'">'+prep+'<td>'+(spell.level||'C')+'</td><td class="sheet-class-spell-name"><strong>'+esc(spell.name)+'</strong><small>'+esc(catalog?.edition||'Custom')+(automatic?' · Always prepared':'')+'</small>'+assignment+'<button type="button" class="sheet-info-button" data-generated-spell-info="'+i+'" aria-label="Information about '+esc(spell.name)+'">i</button></td><td>'+esc(description.replace(/\s+/g,' ').slice(0,180))+(description.length>180?'…':'')+'</td><td>'+esc(catalog?.save||'—')+'</td><td>'+esc(catalog?.school||'—')+'</td><td>'+esc(spell.casting)+'</td><td>'+esc(spell.range)+'</td><td>'+esc(spell.components)+'</td><td>'+esc(spell.duration)+'</td><td title="'+esc(catalog?.book||'')+'">'+esc(catalog?.source||'—')+'</td><td>'+(catalog?.page?esc(catalog.page):'—')+'</td></tr>';
      }).join('')||'<tr><td colspan="'+colspan+'">'+(p?'Generate '+esc(p.name)+' spells to fill this class sheet.':'No spells assigned.')+'</td></tr>';
      return '<section class="sheet-class-spell-sheet" data-spell-sheet-class="'+esc(p?.classId||'unassigned')+'">'+header+'<div class="sheet-spell-table-wrap" tabindex="0" role="region" aria-label="'+esc(p?.name||'Unassigned')+' spell table"><table class="sheet-spell-table" aria-label="'+esc(p?.name||'Unassigned')+' spells"><thead><tr>'+(showPrepared?'<th scope="col">Prep</th>':'')+['Lv','Spell','Short description','Save','School','Time','Range','Comp','Duration','B','P'].map(t=>'<th scope="col">'+t+'</th>').join('')+'</tr></thead><tbody>'+table+'</tbody></table></div></section>';
    }).join('')||'<p class="sheet-help">No spellcasting class detected.</p>';
    host.querySelectorAll('[data-generate-class]').forEach(button=>button.onclick=()=>openGenerator(button.dataset.generateClass));
    host.querySelectorAll('[data-spell-assign]').forEach(select=>select.onchange=()=>{
      const classId=select.value,i=Number(select.dataset.spellAssign);if(!known.has(classId))return;
      readSheetForm();const spell=sheetSession.data.spells[i];if(!spell)return;spell.classId=classId;
      sheetSession.dirty=true;updateSheetCalculations();sheetStatus('Spell assigned to '+classProfile(classId).name+'. Save to keep it.');
    });
    host.querySelectorAll('[data-generated-spell-info]').forEach(button=>button.onclick=()=>openSpellInformation({index:Number(button.dataset.generatedSpellInfo)}));
    host.querySelectorAll('[data-generated-prepare]').forEach(button=>button.onclick=()=>{
      const i=Number(button.dataset.generatedPrepare);let spell=sheetSession.data.spells[i];const profile=spell&&classProfile(spell.classId,d);
      if(!spell||profile?.mode!=='spellbook'||spell.level===0||grants(profile).some(s=>s.id===spell.catalogId))return;
      readSheetForm();
      spell=sheetSession.data.spells[i];
      const current=counted(profile,currentClassSpells(profile.classId)).filter(row=>row.level>0&&row.prepared).length;
      if(!spell.prepared&&current>=profile.spellCount){sheetStatus('This Wizard can prepare '+profile.spellCount+' spells. Unprepare one first.',true);return;}
      spell.prepared=!spell.prepared;
      const hidden=document.querySelector('[name="spells.'+i+'.prepared"]');if(hidden)hidden.checked=spell.prepared;
      sheetSession.dirty=true;updateSheetCalculations();sheetStatus('Wizard preparation changed. Save to keep it.');
    });
  }

  function decorateRows(){
    const d=stats();if(!d||!sheetSession)return;
    document.querySelectorAll('#sheetSpellRows .sheet-repeat').forEach((article,i)=>{
      const spell=sheetSession.data.spells[i],p=spell&&classProfile(spell.classId,d);
      if(!spell||!p)return;
      const title=article.querySelector('h4');
      if(title&&!title.querySelector('.sheet-spell-class-badge'))title.insertAdjacentHTML('beforeend',' <span class="sheet-spell-class-badge">'+esc(p.name)+'</span>');
      const prepared=document.querySelector('[name="spells.'+i+'.prepared"]')?.closest('label');
      if(prepared){
        if(p.mode==='spellbook'){prepared.hidden=false;prepared.querySelector('span').textContent='Prepared from spellbook';}
        else prepared.hidden=true;
      }
    });
  }

  const baseRows=window.renderSheetRows;
  if(typeof baseRows==='function')window.renderSheetRows=function(...args){const result=baseRows.apply(this,args);decorateRows();return result;};
  const baseSetup=window.setupCharacterPlayUI;
  window.setupCharacterPlayUI=function(...args){const result=baseSetup?.apply(this,args);setup();return result;};
  const baseUpdate=window.updateCharacterPlayUI;
  window.updateCharacterPlayUI=function(d,...args){const result=baseUpdate?.call(this,d,...args);setup();adoptLegacySpells(d);renderSummary(d);renderGeneratedTable(d);decorateRows();return result;};
})();
