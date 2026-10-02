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
    return generatorDrafts.get(classId);
  }
  function draftRows(classId){return [...draftMap(classId).values()];}
  function setDraftSpell(profile,spellId,selected){
    const map=draftMap(profile.classId),spell=CharacterCatalog.find(spellId);
    if(selected&&spell){
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
  function classProfile(id,d=stats()){const rows=profiles(d);return rows.find(p=>p.classId===id)||rows[0]||null;}

  function setup(){
    const panel=document.getElementById('sheet-spells');
    if(!panel||document.getElementById('sheetSpellGeneration'))return;
    const box=document.createElement('section');
    box.id='sheetSpellGeneration';
    box.className='sheet-spell-generation';
    box.innerHTML='<div class="sheet-repeat-title"><div><span class="sheet-eyebrow">SPELLCASTING</span><h4>Generated spell sheet</h4></div><button type="button" id="sheetGenerateSpells" class="btn-primary">Generate spell sheet</button></div><div id="sheetSpellClassSummary" class="sheet-spell-class-summary"></div><div id="sheetAutoSlotSummary" class="sheet-auto-slot-summary"></div>';
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
    document.getElementById('sheetGenerateSpells').onclick=openGenerator;
    dialog.querySelectorAll('[data-close-generator]').forEach(button=>button.onclick=()=>dialog.close());
    dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});
    dialog.querySelector('#spellGeneratorClass').onchange=event=>{generatorClassId=event.target.value;renderGenerator();};
    dialog.querySelector('#spellGeneratorSearch').oninput=renderList;
    dialog.querySelector('#spellGeneratorLevel').onchange=renderList;
    dialog.querySelector('#spellGeneratorSchool').onchange=renderList;
    dialog.querySelector('#spellGeneratorApply').onclick=applyGenerated;
  }

  async function openGenerator(){
    if(!sheetSession)return;
    try{if(!CharacterCatalog.data)await CharacterCatalog.load();}catch(error){sheetStatus('Could not load spell catalogue: '+error.message,true);return;}
    readSheetForm();
    const rows=profiles();
    if(!rows.length){sheetStatus('This character has no spellcasting class to generate from.',true);return;}
    generatorDrafts=new Map();
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
    const existing=draftRows(p.classId),cantrips=existing.filter(s=>s.level===0).length,leveled=existing.filter(s=>s.level>0).length,prepared=existing.filter(s=>s.level>0&&s.prepared).length;
    const detail=[];
    if(p.cantrips)detail.push(p.cantrips+' cantrip'+(p.cantrips===1?'':'s'));
    if(p.mode==='spellbook')detail.push('at least '+p.bookMinimum+' spellbook spells from leveling','prepare '+p.spellCount);
    else detail.push(p.spellCount+' '+S.modeLabel(p).toLowerCase());
    document.getElementById('spellGeneratorRequirement').innerHTML='<strong>'+esc(p.name)+' '+p.level+' · '+esc(p.edition)+'</strong><span>'+detail.join(' · ')+'</span><small>Reachable spell level: '+(p.maxSpellLevel||'cantrips only')+' · Spellcasting ability: '+esc(abilityName(p.ability))+' · '+(p.changeTiming==='long-rest'?'List can be changed after a long rest.':'List normally changes when you gain a class level.')+'</small><small>Selected in this builder: '+cantrips+' cantrips · '+leveled+' level 1+ spells'+(p.mode==='spellbook'?' · '+prepared+' prepared':'')+'.</small>';
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
    rows.sort((a,b)=>a.level-b.level||a.name.localeCompare(b.name));
    host.innerHTML=rows.map(spell=>{
      const old=existing.get(spell.id),checked=!!old;
      const prep=p.mode==='spellbook'&&spell.level>0?'<label class="sheet-spell-prepared-choice"><input type="checkbox" data-spell-prepared data-spell-id="'+esc(spell.id)+'" '+(old?.prepared?'checked ':'')+(checked?'':'disabled')+'><span>Prepared</span></label>':'';
      return '<article class="sheet-spell-generator-row"><label><input type="checkbox" data-spell-pick data-spell-id="'+esc(spell.id)+'" '+(checked?'checked':'')+'><span><strong>'+esc(spell.name)+'</strong><small>'+(spell.level?'Level '+spell.level:'Cantrip')+' · '+esc(spell.school||'')+' · '+esc(spell.source||spell.book||'')+'</small></span></label>'+prep+'<button type="button" class="sheet-info-button" data-spell-info="'+esc(spell.id)+'">i</button></article>';
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
    const cantrips=rows.filter(s=>s.level===0),leveled=rows.filter(s=>s.level>0),prepared=leveled.filter(s=>s.prepared);
    if(cantrips.length>p.cantrips)return 'Too many cantrips: choose at most '+p.cantrips+'. You currently have '+cantrips.length+'.';
    if(p.mode==='spellbook'){
      if(prepared.length>p.spellCount)return 'Too many prepared Wizard spells: prepare at most '+p.spellCount+'. You currently have '+prepared.length+'.';
    }else if(leveled.length>p.spellCount)return 'Too many level 1+ spells: choose at most '+p.spellCount+'. You currently have '+leveled.length+'.';
    return'';
  }
  function completionNotice(p,rows){
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
    const rows=selections(),cantrips=rows.filter(s=>s.level===0).length,leveled=rows.filter(s=>s.level>0).length,prepared=rows.filter(s=>s.level>0&&s.prepared).length;
    const parts=['Cantrips '+cantrips+'/'+p.cantrips];
    if(p.mode==='spellbook')parts.push('Spellbook '+leveled+'/'+p.bookMinimum+' minimum','Prepared '+prepared+'/'+p.spellCount);
    else parts.push(S.modeLabel(p)+' '+leveled+'/'+p.spellCount);
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
    sheetSession.data.spells=[...other,...rows].slice(0,150);
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
    host.innerHTML=rows.map(p=>{
      const mod=d.mods[p.ability]??0,attack=mod+d.pb,dc=8+mod+d.pb,stored=currentClassSpells(p.classId);
      const cantrips=stored.filter(s=>s.level===0).length,leveled=stored.filter(s=>s.level>0).length,prepared=stored.filter(s=>s.level>0&&s.prepared).length;
      const count=p.mode==='spellbook'?cantrips+'/'+p.cantrips+' cantrips · '+leveled+' book spells · '+prepared+'/'+p.spellCount+' prepared':cantrips+'/'+p.cantrips+' cantrips · '+leveled+'/'+p.spellCount+' '+S.modeLabel(p).toLowerCase();
      return '<article><div><span>'+esc(p.name)+' · Level '+p.level+'</span><strong>'+esc(abilityName(p.ability))+' '+signed(mod)+'</strong></div><dl><div><dt>Spell attack</dt><dd>'+signed(attack)+'</dd></div><div><dt>Save DC</dt><dd>'+dc+'</dd></div><div><dt>Spells</dt><dd>'+esc(count)+'</dd></div></dl></article>';
    }).join('');
    syncSlots(d);
    const totals=d.effects?.slotMax||[];
    slotHost.innerHTML='<div class="sheet-repeat-title"><h4>Spell slots</h4><button type="button" data-reset-slots>Long rest · restore slots</button></div><div class="sheet-auto-slot-grid">'+totals.map((max,i)=>{
      max=Number(max)||0;if(!max)return'';
      const used=Math.min(max,Number(sheetSession.data.slots[i]?.used)||0),left=max-used;
      return '<article><span>Level '+(i+1)+'</span><strong>'+left+' / '+max+'</strong><small>available</small><div><button type="button" data-slot-use="'+i+'" '+(used>=max?'disabled':'')+'>Use</button><button type="button" data-slot-restore="'+i+'" '+(used<=0?'disabled':'')+'>Restore</button></div></article>';
    }).join('')+'</div>'+(d.progression?.pact?'<p class="sheet-help">Pact Magic: '+d.progression.pact.count+' slot'+(d.progression.pact.count===1?'':'s')+' at level '+d.progression.pact.slotLevel+'. Pact slots recover on a short or long rest.</p>':'');
    slotHost.querySelector('[data-reset-slots]')?.addEventListener('click',()=>{readSheetForm();for(const slot of sheetSession.data.slots)slot.used=0;sheetSession.dirty=true;updateSheetCalculations();sheetStatus('Spell slots restored. Save to keep the change.');});
    slotHost.querySelectorAll('[data-slot-use],[data-slot-restore]').forEach(button=>button.onclick=()=>{
      readSheetForm();
      const i=Number(button.dataset.slotUse??button.dataset.slotRestore),slot=sheetSession.data.slots[i],max=Number(d.effects.slotMax?.[i])||0;
      if(!slot)return;
      slot.used=Math.max(0,Math.min(max,(Number(slot.used)||0)+(button.dataset.slotUse!==undefined?1:-1)));
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
    const rows=sheetSession.data.spells.map((spell,i)=>({spell,i})).sort((a,b)=>a.spell.level-b.spell.level||a.spell.name.localeCompare(b.spell.name));
    const showPrepared=rows.some(({spell})=>classProfile(spell.classId,d)?.mode==='spellbook');
    const prepHead=showPrepared?'<th scope="col">Prep</th>':'';
    const colspan=showPrepared?12:11;
    host.innerHTML='<div class="sheet-spell-table-wrap"><table class="sheet-spell-table"><thead><tr>'+prepHead+['Lv','Spell','Short description','Save','School','Time','Range','Comp','Duration','B','P'].map(t=>'<th scope="col">'+t+'</th>').join('')+'</tr></thead><tbody>'+(
      rows.map(({spell:p,i})=>{
        const catalog=CharacterCatalog.find(p.catalogId),description=catalog?.shortDescription||catalog?.description||p.notes||'Source reference only',profile=classProfile(p.classId,d);
        const prep=showPrepared?(profile?.mode==='spellbook'?'<td><button type="button" data-generated-prepare="'+i+'" class="sheet-slot-orb" aria-label="Prepare '+esc(p.name)+'" aria-pressed="'+p.prepared+'"></button></td>':'<td>—</td>'):'';
        return '<tr>'+prep+'<td>'+(p.level||'C')+'</td><td><strong>'+esc(p.name)+'</strong><small>'+(profile?esc(profile.name)+' · ':'')+esc(catalog?.edition||'Custom')+'</small><button type="button" class="sheet-info-button" data-generated-spell-info="'+i+'" aria-label="Information about '+esc(p.name)+'">i</button></td><td>'+esc(description.replace(/\s+/g,' ').slice(0,180))+(description.length>180?'…':'')+'</td><td>'+esc(catalog?.save||'—')+'</td><td>'+esc(catalog?.school||'—')+'</td><td>'+esc(p.casting)+'</td><td>'+esc(p.range)+'</td><td>'+esc(p.components)+'</td><td>'+esc(p.duration)+'</td><td title="'+esc(catalog?.book||'')+'">'+esc(catalog?.source||'—')+'</td><td>'+(catalog?.page?esc(catalog.page):'—')+'</td></tr>';
      }).join('')||'<tr><td colspan="'+colspan+'">Use Generate spell sheet to choose the spells available to this character.</td></tr>'
    )+'</tbody></table></div>';
    host.querySelectorAll('[data-generated-spell-info]').forEach(button=>button.onclick=()=>openSpellInformation({index:Number(button.dataset.generatedSpellInfo)}));
    host.querySelectorAll('[data-generated-prepare]').forEach(button=>button.onclick=()=>{
      const i=Number(button.dataset.generatedPrepare),spell=sheetSession.data.spells[i],profile=spell&&classProfile(spell.classId,d);
      if(!spell||profile?.mode!=='spellbook')return;
      readSheetForm();
      const current=sheetSession.data.spells.filter(row=>row.classId===profile.classId&&row.level>0&&row.prepared).length;
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
