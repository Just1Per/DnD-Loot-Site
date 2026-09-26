'use strict';
let sheetCatalogSignature='';
function renderSheetCatalog() {
  const session=sheetSession;
  if(!session)return;
  sheetCatalogSignature='';
  const host=document.createElement('section');host.id='sheetFeatCatalog';host.className='sheet-catalog';
  host.innerHTML='<h3>Feats</h3><p role="status">Loading feat and spell choices…</p>';
  document.getElementById('sheet-overview').appendChild(host);
  const spellHost=document.createElement('section');spellHost.id='sheetSpellCatalog';spellHost.className='sheet-catalog';
  document.getElementById('sheetSpellRows').before(spellHost);
  CharacterCatalog.load().then(()=>{if(sheetSession===session && document.getElementById('sheetFeatCatalog')===host)renderSheetCatalogControls();}).catch(error=>{
    if(sheetSession===session){host.innerHTML=`<h3>Feats</h3><p role="alert">${sheetEscape(error.message)}. Manual fields remain available.</p><button type="button" id="sheetRetryCatalog">Retry catalogue</button>`;host.querySelector('button').onclick=()=>CharacterCatalog.load().then(()=>{if(sheetSession===session)renderSheetCatalogControls();}).catch(e=>sheetStatus(e.message,true));}
  });
}
function catalogChanged(message='Unsaved feat / spell changes') {
  sheetSession.dirty=true;sheetStatus(message);updateSheetCalculations();
}
function renderSheetCatalogControls() {
  const C=CharacterCatalog, esc=sheetEscape;
  const feats=document.getElementById('sheetFeatCatalog'), spells=document.getElementById('sheetSpellCatalog');
  if(!feats || !spells)return;
  const editions='<option value="2014">2014</option><option value="2024">2024</option>';
  feats.innerHTML=`<h3>Feat catalogue</h3><p>${esc(C.data.loadedFrom||'Rules catalogue')} · ${C.data.feats.length} feats. Source prerequisites and non-automated effects need DM review; adding a feat does not spend an ASI or change your scores.</p><div class="sheet-grid"><label class="sheet-field">Rules<select id="catalogFeatEdition">${editions}</select></label><label class="sheet-field">Find feat<input id="catalogFeatSearch" type="search" placeholder="Feat name"></label></div><div id="catalogFeatResults"></div><div id="catalogSelectedFeats"></div><div id="catalogFeatGrants"></div>`;
  spells.innerHTML=`<h4>Choose spells from the catalogue</h4><p>2014 and 2024 entries are separate. Adding a spell does not check class progression, preparation limits or DM approval.</p><div class="sheet-grid"><label class="sheet-field">Rules<select id="catalogSpellEdition">${editions}<option value="">Both editions</option></select></label><label class="sheet-field">Class<select id="catalogSpellClass"><option value="">Any class</option>${['artificer','bard','cleric','druid','paladin','ranger','sorcerer','warlock','wizard'].map(c=>`<option value="${c}">${c}</option>`).join('')}</select></label><label class="sheet-field">Level<select id="catalogSpellLevel"><option value="">Any level</option>${Array.from({length:10},(_,i)=>`<option value="${i}">${i||'Cantrip'}</option>`).join('')}</select></label><label class="sheet-field">Find spell<input id="catalogSpellSearch" type="search" placeholder="Spell name"></label></div><div id="catalogSpellResults"></div><button type="button" id="catalogLongRest">Long rest: reset spell slots & Magic Initiate uses</button>`;
  document.getElementById('catalogFeatEdition').value=sheetSession.data.build.edition;
  document.getElementById('catalogSpellEdition').value=sheetSession.data.build.edition;
  for(const id of ['catalogSpellEdition','catalogSpellClass','catalogSpellLevel','catalogSpellSearch'])document.getElementById(id).addEventListener(id.endsWith('Search')?'input':'change',renderCatalogSpellResults);
  for(const id of ['catalogFeatEdition','catalogFeatSearch'])document.getElementById(id).addEventListener(id.endsWith('Search')?'input':'change',renderCatalogFeatResults);
  document.getElementById('catalogLongRest').onclick=()=>{
    readSheetForm();if(!confirm('Reset spell slots and Magic Initiate free uses after a long rest? HP and other resources are unchanged.'))return;
    C.longRest(sheetSession.data);fillSheetForm();sheetCatalogSignature='';catalogChanged();
  };
  renderCatalogSpellResults();renderCatalogFeatResults();sheetCatalogSignature='';updateSheetCatalogGrants();
}
function renderCatalogSpellResults() {
  const host=document.getElementById('catalogSpellResults');if(!host)return;
  const get=id=>document.getElementById(id).value;
  const rows=CharacterCatalog.spells({edition:get('catalogSpellEdition'),classId:get('catalogSpellClass'),level:get('catalogSpellLevel'),search:get('catalogSpellSearch')});
  host.innerHTML=`<p>${rows.length} matches${rows.length>60?' · Showing first 60; narrow your search':''}</p><div class="sheet-catalog-results">${rows.slice(0,60).map(s=>`<article><strong>${sheetEscape(s.name)}</strong> <span>${s.edition} · Level ${s.level} · ${sheetEscape(s.source)}</span><button type="button" data-add-catalog-spell="${sheetEscape(s.id)}">Add spell</button></article>`).join('')}</div>`;
  host.querySelectorAll('[data-add-catalog-spell]').forEach(button=>button.onclick=()=>addCatalogSpells([button.dataset.addCatalogSpell]));
}
function addCatalogSpells(ids, preparedId='') {
  readSheetForm();let added=0;
  for(const id of ids) {
    const spell=CharacterCatalog.find(id);if(!spell || sheetSession.data.spells.some(s=>s.catalogId===id))continue;
    if(sheetSession.data.spells.length>=150){sheetStatus('Spellbook limit is 150 entries. Remove a spell first.',true);break;}
    const row=CharacterCatalog.spellRow(spell);if(id===preparedId)row.prepared=true;
    sheetSession.data.spells.push(row);added++;
  }
  if(added){renderSheetRows();fillSheetForm();catalogChanged(`Added ${added} spell(s). Save sheet to keep them.`);}else sheetStatus('These spells are already in your spellbook, or the book is full.');
}
function renderCatalogFeatResults() {
  const host=document.getElementById('catalogFeatResults');if(!host)return;
  const edition=document.getElementById('catalogFeatEdition').value, search=document.getElementById('catalogFeatSearch').value.toLowerCase();
  const rows=CharacterCatalog.data.feats.filter(f=>f.edition===edition && f.name.toLowerCase().includes(search));
  host.innerHTML=`<p>${rows.length} matches${rows.length>40?' · Showing first 40; narrow your search':''}</p><div class="sheet-catalog-results">${rows.slice(0,40).map(f=>`<article><strong>${sheetEscape(f.name)}</strong> <span>${f.edition} · ${sheetEscape(f.source)}${f.minimumLevel?' · Level '+f.minimumLevel+'+':''}</span><button type="button" data-add-catalog-feat="${sheetEscape(f.id)}">Choose feat</button></article>`).join('')}</div>`;
  host.querySelectorAll('[data-add-catalog-feat]').forEach(button=>button.onclick=()=>{
    readSheetForm();const feat=CharacterCatalog.find(button.dataset.addCatalogFeat,'feats'),data=sheetSession.data;
    if(feat.minimumLevel>Number(sheetSession.identity.level)){sheetStatus(`This feat requires level ${feat.minimumLevel}.`,true);return;}
    if(data.build.edition==='2014' && data.build.race==='variant-human' && feat.edition==='2014' && !data.build.raceFeat){data.build.raceFeat=feat.name;fillSheetForm();}
    else {
      if(data.rulesChoices.feats.includes(feat.id)){sheetStatus('This feat is already selected.');return;}
      if(data.rulesChoices.feats.length>=30){sheetStatus('Maximum 30 additional feats.',true);return;}
      data.rulesChoices.feats.push(feat.id);
    }
    catalogChanged('Feat selected. Review its prerequisites with your DM, then save.');
  });
}
function updateSheetCatalogGrants() {
  const host=document.getElementById('catalogFeatGrants');
  if(!host || !CharacterCatalog.data || !sheetSession)return;
  const data=sheetSession.data, C=CharacterCatalog;
  const stats=CharacterSheetModel.derive(data,sheetSession.identity.level);
  const signature=JSON.stringify([stats.mods,stats.pb,data.build.edition,data.build.race,data.build.background,data.build.backgroundFeat,data.build.humanOriginFeat,data.build.raceFeat,data.rulesChoices]);
  if(signature===sheetCatalogSignature)return;
  sheetCatalogSignature=signature;
  const feats=document.getElementById('catalogSelectedFeats');
  feats.innerHTML='<h4>Additional feats</h4>'+data.rulesChoices.feats.map(id=>{
    const f=C.find(id,'feats');return `<article class="sheet-repeat"><h4>${sheetEscape(f?f.name+' · '+f.edition:id)}</h4><p>${sheetEscape(f?f.book+', p. '+f.page:'Catalogue entry unavailable; selection preserved.')}</p><p class="sheet-rule-text">${sheetEscape(f?.description||'Consult the source for the full feat rules. Apply effects in the sheet’s manual fields; only Magic Initiate spell choices are automated here.')}</p><button type="button" data-remove-feat="${sheetEscape(id)}">Remove feat</button></article>`;
  }).join('');
  feats.querySelectorAll('[data-remove-feat]').forEach(button=>button.onclick=()=>{
    readSheetForm();const id=button.dataset.removeFeat;sheetSession.data.rulesChoices.feats=sheetSession.data.rulesChoices.feats.filter(f=>f!==id);delete sheetSession.data.rulesChoices.grants[id];catalogChanged();
  });
  const grants=C.grants(data);
  host.innerHTML=grants.map(g=>{
    const choice=data.rulesChoices.grants[g.key]||{classId:g.fixedClass,ability:'int',spells:['','',''],used:0};
    const valid=C.validateGrant(g,choice,data),classes=g.edition==='2024'?['cleric','druid','wizard']:['bard','cleric','druid','sorcerer','warlock','wizard'];
    const options=(rows,value)=>rows.map(([v,label])=>`<option value="${sheetEscape(v)}" ${v===value?'selected':''}>${sheetEscape(label)}</option>`).join('');
    const spellSelect=i=>{
      const rows=C.spells({edition:g.edition,classId:valid.classId,level:i===2?1:0});
      const choices=[['','Choose spell'],...rows.map(s=>[s.id,`${s.name} · ${s.edition} · ${s.source}`])];
      if(choice.spells[i] && !rows.some(s=>s.id===choice.spells[i]))choices.push([choice.spells[i],'Invalid / unavailable choice — choose again']);
      return `<label class="sheet-field">${i===2?'Level 1 spell':'Cantrip '+(i+1)}<select data-grant-field="spell${i}">${options(choices,choice.spells[i])}</select></label>`;
    };
    return `<article class="sheet-repeat" data-grant="${sheetEscape(g.key)}"><h4>${sheetEscape(g.label)} · ${g.edition}</h4><div class="sheet-grid"><label class="sheet-field">Spell class<select data-grant-field="classId" ${g.fixedClass?'disabled':''}>${options([['','Choose class'],...classes.map(c=>[c,c])],valid.classId)}</select></label>${g.edition==='2024'?`<label class="sheet-field">Casting ability<select data-grant-field="ability">${options([['int','Intelligence'],['wis','Wisdom'],['cha','Charisma']],choice.ability)}</select></label>`:`<p>Casting ability: ${sheetEscape(valid.ability||'choose class')}</p>`}${[0,1,2].map(spellSelect).join('')}</div><p>${g.edition==='2024'?'Level 1 spell is always prepared; you may also use spell slots.':'One free level 1 casting per long rest; other casting eligibility follows your class rules.'} Changing choices requires a permitted level-up change or DM approval.</p><p>Spell save DC: ${8+stats.pb+(stats.mods[valid.ability]||0)} · Spell attack: ${CharacterSheetModel.signed(stats.pb+(stats.mods[valid.ability]||0))}</p><p role="status">${sheetEscape(valid.errors.join(' ')||'Valid choices.')} Free use: ${choice.used?'0':'1'} / 1</p><button type="button" data-use-grant ${valid.errors.length||choice.used?'disabled':''}>Use free level 1 casting</button> <button type="button" data-undo-grant ${!choice.used?'disabled':''}>Undo use</button> <button type="button" data-copy-grant ${valid.errors.length?'disabled':''}>Add chosen spells to spellbook</button></article>`;
  }).join('');
  host.querySelectorAll('[data-grant]').forEach(article=>{
    const grant=grants.find(g=>g.key===article.dataset.grant);
    const getChoice=()=>sheetSession.data.rulesChoices.grants[grant.key] ||= {classId:grant.fixedClass,ability:'int',spells:['','',''],used:0};
    article.querySelectorAll('[data-grant-field]').forEach(input=>input.onchange=()=>{
      readSheetForm();const choice=getChoice(),field=input.dataset.grantField;
      if(field.startsWith('spell'))choice.spells[Number(field.slice(-1))]=input.value;
      else {choice[field]=input.value;if(field==='classId')choice.spells=['','',''];}
      catalogChanged();
    });
    article.querySelector('[data-use-grant]').onclick=()=>{readSheetForm();const choice=getChoice();if(!C.validateGrant(grant,choice,sheetSession.data).errors.length && !choice.used){choice.used=1;catalogChanged();}};
    article.querySelector('[data-undo-grant]').onclick=()=>{readSheetForm();getChoice().used=0;catalogChanged();};
    article.querySelector('[data-copy-grant]').onclick=()=>{const choice=getChoice();if(!C.validateGrant(grant,choice,sheetSession.data).errors.length)addCatalogSpells(choice.spells,grant.edition==='2024'?choice.spells[2]:'');};
  });
}
