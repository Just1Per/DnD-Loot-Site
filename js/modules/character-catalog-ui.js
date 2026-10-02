'use strict';
let sheetCatalogSignature='';
const featCategoryLabels={O:'Origin',G:'General',FS:'Fighting Style','FS:P':'Fighting Style · Paladin','FS:R':'Fighting Style · Ranger',EB:'Epic Boon',DG:'Dark Gift',D:'Dragonmark / setting','':'Other / legacy'};
function featReference(feat){
  return (typeof CharacterFeatReference!=='undefined'&&CharacterFeatReference.records?.[feat?.source+'|'+feat?.name])||null;
}
function featCategoryLabel(feat){return featCategoryLabels[String(feat?.category||'')]||String(feat?.category||'Other');}
function featEffectTags(feat){
  const ref=featReference(feat),def=CharacterFeatRules.definitions?.[feat?.id],tags=new Set(ref?.tags||[]);
  if(def?.ability?.length)tags.add('ability');
  if(def?.armorTraining?.length)tags.add('armor');
  if(def?.toolChoices?.length)tags.add('skills');
  if(/^Magic Initiate/.test(feat?.name||''))tags.add('spells');
  return [...tags];
}
function featPreviewText(feat){
  const ref=featReference(feat),def=CharacterFeatRules.definitions?.[feat?.id],parts=[];
  if(ref?.summary)parts.push(ref.summary);
  if(!parts.length&&feat?.description)parts.push(feat.description.replace(/\s+/g,' ').trim());
  if(!parts.length&&def?.ability?.length)parts.push('Includes an ability-score increase; configure the allowed ability choice after selecting the feat.');
  if(!parts.length)parts.push('Structured feat metadata is available below; use the listed source and page for complete source-book wording.');
  return parts.join(' ');
}
function closeFeatInformation(){const d=document.getElementById('sheetFeatInformation');if(d){if(d.open)d.close();d.remove();}}
function openFeatInformation(featId){
  const feat=CharacterCatalog.find(featId,'feats');if(!feat)return;
  closeFeatInformation();
  const ref=featReference(feat),def=CharacterFeatRules.definitions?.[feat.id],d=document.createElement('dialog');
  d.id='sheetFeatInformation';d.className='vault-dialog sheet-feat-information';d.setAttribute('aria-labelledby','sheetFeatInformationTitle');
  const ability=(def?.ability||[]).map(option=>{
    const fixed=Object.entries(option).filter(([k,v])=>CharacterSheetModel.abilities[k]&&Number(v)).map(([k,v])=>CharacterSheetModel.abilities[k]+' +'+v);
    const choose=option.choose?.from?.length?'Choose '+(option.choose.count||1)+' from '+option.choose.from.map(k=>CharacterSheetModel.abilities[k]||k.toUpperCase()).join(', ')+' (+'+(option.choose.amount||1)+')':'';
    return [...fixed,choose].filter(Boolean).join(' · ');
  }).filter(Boolean);
  const req=[...(ref?.requirements||[])];
  if(!req.length&&feat.minimumLevel)req.push('Level '+feat.minimumLevel+'+');
  const facts=[...(ref?.facts||[])];
  if(def?.armorTraining?.length)facts.push('Armor training: '+def.armorTraining.map(v=>({light:'Light armor',medium:'Medium armor',heavy:'Heavy armor',shield:'Shields'}[v]||v)).join(', '));
  if(ability.length)facts.push(...ability);
  if(def?.repeatable)facts.push('Repeatable feat');
  const licensed=String(feat.description||'').trim();
  d.innerHTML=`<header><div><span class="sheet-eyebrow">FEAT REFERENCE</span><h2 id="sheetFeatInformationTitle">${sheetEscape(feat.name)}</h2></div><button type="button" aria-label="Close feat information">Close</button></header>
    <div class="sheet-feat-facts"><p><strong>Rules:</strong> ${sheetEscape(feat.edition)}</p><p><strong>Category:</strong> ${sheetEscape(featCategoryLabel(feat))}</p><p><strong>Source:</strong> ${sheetEscape(feat.book||feat.source)}${feat.page?' · p. '+sheetEscape(feat.page):''}</p><p><strong>Minimum level:</strong> ${feat.minimumLevel||'None'}</p></div>
    <section class="sheet-summary-box"><h4>Quick summary</h4><p>${sheetEscape(featPreviewText(feat))}</p></section>
    ${facts.length?`<section class="sheet-summary-box"><h4>Structured benefits</h4><ul>${[...new Set(facts)].map(v=>'<li>'+sheetEscape(v)+'</li>').join('')}</ul></section>`:''}
    ${ref?.features?.length?`<section class="sheet-summary-box"><h4>Named features</h4><p>${ref.features.map(sheetEscape).join(' · ')}</p></section>`:''}
    ${req.length?`<section class="sheet-summary-box"><h4>Prerequisites</h4><p>${req.map(sheetEscape).join(' · ')}</p></section>`:''}
    ${licensed?`<details open><summary>Licensed / bundled rules text</summary><p class="sheet-rule-text">${sheetEscape(licensed)}</p></details>`:'<p class="sheet-help">The site stores a concise mechanical reference for this non-SRD feat rather than copying the source book. Use the source/page above for the exact published wording.</p>'}`;
  document.body.appendChild(d);d.querySelector('header button').onclick=closeFeatInformation;d.addEventListener('click',event=>{if(event.target===d)closeFeatInformation();});d.showModal();d.querySelector('header button').focus();
}
function dmFeatGrant(){
  const grants=sheetSession?.data?.rulesChoices?.grants||(sheetSession.data.rulesChoices.grants={});
  return grants.__dm||(grants.__dm={bonusFeats:0,bonusAsis:0,approvedBy:'',updatedAt:0});
}
function renderDmFeatApproval(){
  const host=document.getElementById('sheetDmFeatApproval');if(!host||!sheetSession)return;
  const grant=dmFeatGrant(),budget=CharacterPlayRules.budget(sheetSession.data,sheetSession.identity.level,CharacterCatalog.data?.feats||[]);
  host.innerHTML=`<div class="sheet-repeat-title"><div><span class="sheet-eyebrow">DM APPROVALS</span><h4>Bonus advancement</h4></div><small>These are extra choices beyond normal class progression.</small></div>
    <div class="sheet-dm-approval-grid">
      <article><span>Bonus feat choices</span><strong>${grant.bonusFeats||0}</strong>${canManageCampaign()?'<div><button type="button" data-dm-grant="feat" data-delta="-1">−</button><button type="button" data-dm-grant="feat" data-delta="1">+</button></div>':''}</article>
      <article><span>Bonus ASI choices</span><strong>${grant.bonusAsis||0}</strong>${canManageCampaign()?'<div><button type="button" data-dm-grant="asi" data-delta="-1">−</button><button type="button" data-dm-grant="asi" data-delta="1">+</button></div>':''}</article>
      <article><span>ASI choices reserved</span><strong>${sheetSession.data.advancement.asiSpent}</strong><div><button type="button" data-asi-spend="-1" ${!sheetSession.data.advancement.asiSpent?'disabled':''}>Undo</button><button type="button" data-asi-spend="1" ${!budget.asiRemaining?'disabled':''}>Use ASI choice</button></div></article>
    </div>
    <p class="sheet-help">${canManageCampaign()?'As DM, use +/− to confirm extra feat or ASI allowances for this character. Save the character sheet after changing approvals.':'Only the campaign DM can change bonus allowances.'} An ASI choice reserves one advancement choice for ability scores; edit the actual scores on Abilities & skills.</p>`;
  host.querySelectorAll('[data-dm-grant]').forEach(button=>button.onclick=()=>{
    if(!canManageCampaign())return;
    readSheetForm();const g=dmFeatGrant(),key=button.dataset.dmGrant==='feat'?'bonusFeats':'bonusAsis',delta=Number(button.dataset.delta)||0;
    g[key]=Math.max(0,Math.min(10,(Number(g[key])||0)+delta));g.approvedBy=auth.currentUser?.uid||'';g.updatedAt=Date.now();
    catalogChanged('DM bonus advancement approval changed. Save the character sheet to keep it.');renderDmFeatApproval();renderCatalogFeatResults();
  });
  host.querySelectorAll('[data-asi-spend]').forEach(button=>button.onclick=()=>{
    readSheetForm();const delta=Number(button.dataset.asiSpend)||0,current=Number(sheetSession.data.advancement.asiSpent)||0;
    const b=CharacterPlayRules.budget(sheetSession.data,sheetSession.identity.level,CharacterCatalog.data?.feats||[]);
    if(delta>0&&!b.asiRemaining)return sheetStatus('No available ASI choice. Ask the DM for an additional ASI allowance.',true);
    sheetSession.data.advancement.asiSpent=Math.max(0,Math.min(17,current+delta));
    const input=document.querySelector('[name="advancement.asiSpent"]');if(input)input.value=sheetSession.data.advancement.asiSpent;
    catalogChanged('ASI choice reservation changed. Save the character sheet to keep it.');renderDmFeatApproval();renderCatalogFeatResults();
  });
}
function renderSheetCatalog() {
  const session=sheetSession;
  if(!session)return;
  sheetCatalogSignature='';
  const host=document.createElement('section');host.id='sheetFeatCatalog';host.className='sheet-catalog';
  host.innerHTML='<h3>Feats</h3><p role="status">Loading feat and spell choices…</p>';
  document.getElementById('sheet-feats').appendChild(host);
  const spellHost=document.createElement('section');spellHost.id='sheetSpellCatalog';spellHost.className='sheet-catalog';
  document.getElementById('sheetSpellEditor').before(spellHost);
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
  const sources=[...new Set(C.data.feats.map(f=>f.source).filter(Boolean))].sort();
  const categories=[...new Set(C.data.feats.map(f=>String(f.category||'')))].sort((a,b)=>featCategoryLabel({category:a}).localeCompare(featCategoryLabel({category:b})));
  feats.innerHTML=`<h3>Feat catalogue</h3><p>${esc(C.data.loadedFrom||'Rules catalogue')} · ${C.data.feats.length} feats. Every feat remains browseable; use the filters to narrow the list and the <strong>i</strong> button for a rules summary before choosing.</p>
    <div id="catalogBuildFeatChoices" class="sheet-build-feat-choices"></div>
    <section id="sheetDmFeatApproval" class="sheet-dm-feat-approval"></section>
    <div class="sheet-grid sheet-feat-filters">
      <label class="sheet-field">Rules<select id="catalogFeatEdition">${editions}<option value="">Both editions</option></select></label>
      <label class="sheet-field">Category<select id="catalogFeatCategory"><option value="">All categories</option>${categories.map(v=>`<option value="${esc(v)}">${esc(featCategoryLabel({category:v}))}</option>`).join('')}</select></label>
      <label class="sheet-field">Effect<select id="catalogFeatEffect"><option value="">Any effect</option><option value="ability">Ability increase</option><option value="armor">Armor / shields</option><option value="spells">Spells / magic</option><option value="skills">Skills / tools</option><option value="combat">Weapons / combat</option><option value="defense">Defense / HP</option><option value="movement">Movement</option><option value="other">Other</option></select></label>
      <label class="sheet-field">Source<select id="catalogFeatSource"><option value="">Any source</option>${sources.map(v=>`<option value="${esc(v)}">${esc(v)}</option>`).join('')}</select></label>
      <label class="sheet-field">Minimum level<select id="catalogFeatLevel"><option value="">Any</option><option value="0">No level prerequisite</option>${[4,8,12,16,19].map(v=>`<option value="${v}">Level ${v} or lower</option>`).join('')}</select></label>
      <label class="sheet-field">Find feat<input id="catalogFeatSearch" type="search" placeholder="Name, feature, benefit"></label>
    </div>
    <p id="sheetFeatBudget" role="status"></p><div id="catalogFeatResults"></div><div id="catalogSelectedFeats"></div><div id="catalogFeatGrants"></div>`;
  spells.innerHTML=`<h4>Choose spells from the catalogue</h4><p>2014 and 2024 entries are separate. Search matches spell names, schools and damage types. Adding a spell here is for exceptions/DM-approved additions and does not replace the class-aware Generate spell sheet workflow.</p><div class="sheet-grid"><label class="sheet-field">Rules<select id="catalogSpellEdition">${editions}<option value="">Both editions</option></select></label><label class="sheet-field">Class<select id="catalogSpellClass"><option value="">Any class</option>${['artificer','bard','cleric','druid','paladin','ranger','sorcerer','warlock','wizard'].map(c=>`<option value="${c}">${c}</option>`).join('')}</select></label><label class="sheet-field">Level<select id="catalogSpellLevel"><option value="">Any level</option>${Array.from({length:10},(_,i)=>`<option value="${i}">${i||'Cantrip'}</option>`).join('')}</select></label><label class="sheet-field">School<select id="catalogSpellSchool"><option value="">Any school</option>${C.schools.map(s=>`<option value="${esc(s)}">${esc(s)}</option>`).join('')}</select></label><label class="sheet-field">Find spell<input id="catalogSpellSearch" type="search" placeholder="Name, school, damage type"></label></div><div id="catalogSpellResults"></div><button type="button" id="catalogLongRest">Long rest: reset spell slots & Magic Initiate uses</button>`;
  document.getElementById('catalogFeatEdition').value=sheetSession.data.build.edition;
  document.getElementById('catalogSpellEdition').value=sheetSession.data.build.edition;
  for(const id of ['catalogSpellEdition','catalogSpellClass','catalogSpellLevel','catalogSpellSchool','catalogSpellSearch'])document.getElementById(id).addEventListener(id.endsWith('Search')?'input':'change',renderCatalogSpellResults);
  for(const id of ['catalogFeatEdition','catalogFeatCategory','catalogFeatEffect','catalogFeatSource','catalogFeatLevel','catalogFeatSearch'])document.getElementById(id).addEventListener(id.endsWith('Search')?'input':'change',renderCatalogFeatResults);
  document.getElementById('catalogLongRest').onclick=()=>{
    readSheetForm();if(!confirm('Reset spell slots and Magic Initiate free uses after a long rest? HP and other resources are unchanged.'))return;
    C.longRest(sheetSession.data);fillSheetForm();sheetCatalogSignature='';catalogChanged();
  };
  renderBuildFeatChoices();renderDmFeatApproval();renderCatalogSpellResults();renderCatalogFeatResults();sheetCatalogSignature='';updateSheetCalculations();
}
function renderCatalogSpellResults() {
  const host=document.getElementById('catalogSpellResults');if(!host)return;
  const get=id=>document.getElementById(id).value;
  const rows=CharacterCatalog.spells({edition:get('catalogSpellEdition'),classId:get('catalogSpellClass'),level:get('catalogSpellLevel'),school:get('catalogSpellSchool'),search:get('catalogSpellSearch')});
  host.innerHTML=`<p>${rows.length} matches${rows.length>60?' · Showing first 60; narrow your search':''}</p><div class="sheet-catalog-results">${rows.slice(0,60).map(s=>`<article><strong>${sheetEscape(s.name)}</strong> <span>${s.edition} · Level ${s.level} · ${sheetEscape(s.source)}</span><button type="button" class="sheet-info-button" data-spell-info="${sheetEscape(s.id)}" aria-label="Information about ${sheetEscape(s.name)}">i</button><button type="button" data-add-catalog-spell="${sheetEscape(s.id)}">Add spell</button></article>`).join('')}</div>`;
  host.querySelectorAll('[data-spell-info]').forEach(button=>button.onclick=()=>openSpellInformation({catalogId:button.dataset.spellInfo}));
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
function renderBuildFeatChoices() {
  const host=document.getElementById('catalogBuildFeatChoices');
  if(!host||!sheetSession||!CharacterCatalog.data)return;
  const data=sheetSession.data,b=data.build||{},bg=typeof CharacterBackgrounds!=='undefined'?CharacterBackgrounds.get(b.background):null;
  const race=typeof CharacterRules!=='undefined'?CharacterRules.races?.[b.race]:null;
  const allFeats=CharacterCatalog.data.feats||[];
  const uniqueByName=rows=>{
    const seen=new Set();
    return rows.filter(row=>{const key=row.name.toLowerCase();if(seen.has(key))return false;seen.add(key);return true;}).sort((a,b)=>a.name.localeCompare(b.name));
  };
  const originFeats=uniqueByName(allFeats.filter(f=>f.edition==='2024'&&(f.category==='O'||String(f.category).toLowerCase()==='origin')));
  const legacyFeats=uniqueByName(allFeats.filter(f=>f.edition==='2014'));
  const optionList=(rows,current,prompt)=>{
    const options=[['',prompt],...rows.map(f=>[f.name,f.name+' · '+(f.source||f.book||f.edition)])];
    if(current&&!options.some(([value])=>value===current))options.push([current,current+' · saved/manual']);
    return options.map(([value,label])=>'<option value="'+sheetEscape(value)+'" '+(value===current?'selected':'')+'>'+sheetEscape(label)+'</option>').join('');
  };
  const skillToolOptions=current=>{
    const rows=[
      ...Object.entries(CharacterSheetModel.skills).map(([id,[name]])=>['skill:'+id,name+' · skill']),
      ...CharacterRules.tools.map(name=>['tool:'+name,name+' · tool'])
    ];
    return '<option value="">Choose skill or tool</option>'+rows.map(([value,label])=>'<option value="'+sheetEscape(value)+'" '+(value===current?'selected':'')+'>'+sheetEscape(label)+'</option>').join('');
  };
  const cards=[];
  if(b.edition==='2024'){
    const fixed=bg?.feat||'';
    const backgroundChoices=Array.isArray(bg?.featChoices)?uniqueByName(allFeats.filter(f=>f.edition==='2024'&&bg.featChoices.includes(f.name))):[];
    if(backgroundChoices.length){
      cards.push('<article class="sheet-build-feat-card is-choice"><div><span class="sheet-eyebrow">BACKGROUND FEAT CHOICE</span><strong>'+sheetEscape(bg.featLabel||'Choose your background feat')+'</strong><small>'+sheetEscape(bg?.name||'Background')+' grants one feat from this source-specific list.</small></div><label class="sheet-field"><span>Feat</span><select data-build-feat-field="backgroundFeat">'+optionList(backgroundChoices,b.backgroundFeat,'Choose background feat')+'</select></label></article>');
    }else if(fixed){
      cards.push('<article class="sheet-build-feat-card is-granted"><div><span class="sheet-eyebrow">BACKGROUND FEAT</span><strong>'+sheetEscape(fixed)+'</strong><small>'+sheetEscape(bg?.name||'Background')+' grants this feat automatically.</small></div></article>');
    }else{
      cards.push('<article class="sheet-build-feat-card"><div><span class="sheet-eyebrow">BACKGROUND ORIGIN FEAT</span><strong>Choose your Origin feat</strong><small>Your background grants one Origin feat. Choose it here instead of in Character Builder.</small></div><label class="sheet-field"><span>Origin feat</span><select data-build-feat-field="backgroundFeat">'+optionList(originFeats,b.backgroundFeat,'Choose Origin feat')+'</select></label></article>');
    }
    if(b.race==='human-2024'){
      cards.push('<article class="sheet-build-feat-card"><div><span class="sheet-eyebrow">HUMAN VERSATILE</span><strong>Additional Origin feat</strong><small>2024 Human grants one additional Origin feat.</small></div><label class="sheet-field"><span>Origin feat</span><select data-build-feat-field="humanOriginFeat">'+optionList(originFeats,b.humanOriginFeat,'Choose Human Origin feat')+'</select></label></article>');
    }
  }
  if(b.edition==='2014'&&(b.race==='variant-human'||race?.feat)){
    const label=b.race==='variant-human'?'Variant Human feat':(race?.name||'Race')+' feat';
    cards.push('<article class="sheet-build-feat-card"><div><span class="sheet-eyebrow">RACE FEAT</span><strong>'+sheetEscape(label)+'</strong><small>Choose the feat granted by your race here.</small></div><label class="sheet-field"><span>Feat</span><select data-build-feat-field="raceFeat">'+optionList(legacyFeats,b.raceFeat,'Choose feat')+'</select></label></article>');
  }
  const skilled=[];
  const backgroundFeat=bg?.featChoices?.length?b.backgroundFeat:(bg?.feat||b.backgroundFeat);
  if(b.edition==='2024'&&backgroundFeat==='Skilled')skilled.push(['backgroundFeatChoices','Background Skilled',b.backgroundFeatChoices||[]]);
  if(b.edition==='2024'&&b.race==='human-2024'&&b.humanOriginFeat==='Skilled')skilled.push(['humanFeatChoices','Human Skilled',b.humanFeatChoices||[]]);
  for(const [field,label,values] of skilled){
    cards.push('<article class="sheet-build-feat-card is-choice"><div><span class="sheet-eyebrow">SKILLED CHOICES</span><strong>'+sheetEscape(label)+'</strong><small>Choose three different skill or tool proficiencies.</small></div><div class="sheet-grid">'+[0,1,2].map(i=>'<label class="sheet-field"><span>Training '+(i+1)+'</span><select data-build-feat-array="'+field+'" data-build-feat-index="'+i+'">'+skillToolOptions(values[i]||'')+'</select></label>').join('')+'</div></article>');
  }
  host.innerHTML=cards.length?'<div class="sheet-repeat-title"><div><span class="sheet-eyebrow">FROM YOUR BUILD</span><h4>Granted feat choices</h4></div><small>Character Builder tells you why you get a feat; the choice itself lives here.</small></div><div class="sheet-build-feat-grid">'+cards.join('')+'</div>':'<p class="sheet-help">No background or species feat choice is waiting right now. Level-up feat choices can still be selected from the catalogue below.</p>';
  host.querySelectorAll('[data-build-feat-field]').forEach(select=>select.onchange=()=>{
    readSheetForm();
    const field=select.dataset.buildFeatField;
    sheetSession.data.build[field]=select.value;
    if(field==='backgroundFeat')sheetSession.data.build.backgroundFeatChoices=['','',''];
    if(field==='humanOriginFeat')sheetSession.data.build.humanFeatChoices=['','',''];
    if(field==='raceFeat'&&sheetSession.data.rulesChoices?.effects)delete sheetSession.data.rulesChoices.effects.variant;
    fillSheetForm();
    sheetCatalogSignature='';
    catalogChanged('Build-granted feat changed. Save the character sheet to keep it.');
    renderBuildFeatChoices();
    renderCatalogFeatResults();
  });
  host.querySelectorAll('[data-build-feat-array]').forEach(select=>select.onchange=()=>{
    readSheetForm();
    const field=select.dataset.buildFeatArray,index=Number(select.dataset.buildFeatIndex);
    const values=sheetSession.data.build[field]||['','',''];
    values[index]=select.value;
    sheetSession.data.build[field]=values;
    fillSheetForm();
    sheetCatalogSignature='';
    catalogChanged('Feat proficiency choices changed. Save the character sheet to keep them.');
    renderBuildFeatChoices();
  });
}

function renderCatalogFeatResults() {
  const host=document.getElementById('catalogFeatResults');if(!host)return;
  const edition=document.getElementById('catalogFeatEdition').value, search=document.getElementById('catalogFeatSearch').value.toLowerCase();
  const scores=CharacterSheetModel.derive(sheetSession.data,sheetSession.identity.level).scores;
  const rows=CharacterCatalog.data.feats.filter(f=>(!edition||f.edition===edition) && f.name.toLowerCase().includes(search));
  host.innerHTML=`<p>${rows.length} matches${rows.length>40?' · Showing first 40; narrow your search':''}</p><div class="sheet-catalog-results">${rows.slice(0,40).map(f=>`<article><strong>${sheetEscape(f.name)}</strong> <span>${f.edition} · ${sheetEscape(f.source)}${f.minimumLevel?' · Level '+f.minimumLevel+'+':''}</span><button type="button" data-add-catalog-feat="${sheetEscape(f.id)}" ${CharacterPlayRules.eligible(sheetSession.data,sheetSession.identity.level,f,CharacterCatalog.data.feats,scores)?'disabled':''} title="${sheetEscape(CharacterPlayRules.eligible(sheetSession.data,sheetSession.identity.level,f,CharacterCatalog.data.feats,scores))}">Choose feat</button></article>`).join('')}</div>`;
  host.querySelectorAll('[data-add-catalog-feat]').forEach(button=>button.onclick=()=>{
    readSheetForm();const feat=CharacterCatalog.find(button.dataset.addCatalogFeat,'feats'),data=sheetSession.data;
    const denied=CharacterPlayRules.eligible(data,Number(sheetSession.identity.level),feat,CharacterCatalog.data.feats,CharacterSheetModel.derive(data,Number(sheetSession.identity.level)).scores);if(denied){sheetStatus(denied,true);return;}
    if(feat.minimumLevel>Number(sheetSession.identity.level)){sheetStatus(`This feat requires level ${feat.minimumLevel}.`,true);return;}
    if(data.build.edition==='2014' && data.build.race==='variant-human' && feat.edition==='2014' && !data.build.raceFeat){data.build.raceFeat=feat.name;fillSheetForm();}
    else {
      if(data.rulesChoices.feats.includes(feat.id)&&!CharacterFeatRules.definitions[feat.id]?.repeatable){sheetStatus('This feat is already selected.');return;}
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
  renderBuildFeatChoices();
  const stats=CharacterSheetModel.derive(data,sheetSession.identity.level);
  const signature=JSON.stringify([stats.scores,stats.pb,stats.feats.reports.map(r=>r.warnings),data.build.edition,data.build.race,data.build.background,data.build.backgroundFeat,data.build.humanOriginFeat,data.build.raceFeat,data.rulesChoices]);
  if(signature===sheetCatalogSignature)return;
  sheetCatalogSignature=signature;
  const feats=document.getElementById('catalogSelectedFeats');
  feats.innerHTML='<h4>Your selected feats</h4>'+(stats.feats.reports.length?'<p class="sheet-help">Configure feat-specific choices here. Combat resources and rest recovery are tracked on the relevant gameplay sections.</p>':'<p class="sheet-help">No feat with additional catalogue controls is selected yet.</p>')+stats.feats.reports.map(report=>{
    const f=C.find(report.id,'feats');return `<article class="sheet-repeat" data-feat-key="${sheetEscape(report.key)}"><h4>${sheetEscape((f?.name||report.def.name)+' · '+report.def.edition)}${report.origin?' · '+sheetEscape(report.originLabel||'Variant Human'):''}</h4><p>${sheetEscape(f?f.book+', p. '+f.page:report.def.source)}</p>${renderFeatEffectControls(report,sheetSession.identity.level)}<details><summary>Full rules / source reference</summary><p class="sheet-rule-text">${sheetEscape(f?.description||'Consult the source for complete rules. Effects not listed as automated remain manual.')}</p></details>${report.origin?'':`<button type="button" data-remove-feat="${sheetEscape(report.key)}">Remove feat</button>`}</article>`;
  }).join('');
  feats.querySelectorAll('[data-remove-feat]').forEach(button=>button.onclick=()=>{readSheetForm();CharacterFeatRules.remove(sheetSession.data,button.dataset.removeFeat);catalogChanged();});
  feats.querySelectorAll('[data-feat-key]').forEach(article=>{
    const key=article.dataset.featKey;
    article.querySelectorAll('[data-feat-choice]').forEach(input=>input.onchange=()=>{
      readSheetForm();const c=sheetSession.data.rulesChoices.effects[key] ||= CharacterFeatRules.choice();
      const field=input.dataset.featChoice, value=input.type==='checkbox'?input.checked:input.value;
      if(field.startsWith('ability'))c.abilities[Number(field.slice(-1))]=value;
      else if(field.startsWith('training'))c.training[Number(field.slice(-1))]=value;
      else c[field]=field==='option'?Number(value):value;
      catalogChanged();
    });
    article.querySelectorAll('[data-feat-use]').forEach(button=>button.onclick=()=>changeFeatUse(key,button.dataset.featUse==='use'?1:-1));
  });
  renderFeatCombatResources(stats);
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
function renderFeatEffectControls(report,level) {
  const {def,choice:c,warnings,automated}=report,esc=sheetEscape;
  const select=(label,field,rows,value)=>`<label class="sheet-field">${esc(label)}<select data-feat-choice="${field}">${rows.map(([key,text])=>`<option value="${esc(key)}" ${String(key)===String(value)?'selected':''}>${esc(text)}</option>`).join('')}</select></label>`;
  let html='<div class="sheet-grid">';
  const autoArmorPrereq=def.name==='Moderately Armored'&&['PHB','XPHB'].includes(def.source);
  if(def.requirements.some(r=>r.manual)&&!autoArmorPrereq)html+=`<label class="sheet-check"><input type="checkbox" data-feat-choice="confirmed" ${c.confirmed?'checked':''}> Other prerequisites checked with DM (class features, spellcasting, etc.)</label>`;
  if(autoArmorPrereq)html+='<p class="sheet-help">Prerequisite: Light armor training is checked automatically from your race, class and other feats.</p>';
  if(def.ability.length>1)html+=select('Ability increase pattern','option',[[0,'One ability +2'],[1,'Two different abilities +1']],c.option);
  const ability=def.ability[c.option]||def.ability[0];
  if(ability?.choose)for(let i=0;i<(ability.choose.count||1);i++)html+=select('Ability +'+(ability.choose.amount||1)+' (maximum '+ability.max+')','ability'+i,[['','Choose ability'],...ability.choose.from.map(a=>[a,CharacterSheetModel.abilities[a]])],c.abilities[i]);
  const skills=Object.entries(CharacterSheetModel.skills).map(([k,[label]])=>['skill:'+k,label]);
  if(def.name==='Skilled')for(let i=0;i<3;i++)html+=select('Training '+(i+1),'training'+i,[['','Choose skill/tool'],...skills,...CharacterRules.tools.map(t=>['tool:'+t,t])],c.training[i]);
  if(def.name==='Skill Expert'){
    html+=select('New skill','training0',[['','Choose skill'],...skills],c.training[0]);
    html+=select('Expertise (must be proficient)','expertise',[['','Choose skill'],...Object.entries(CharacterSheetModel.skills).map(([k,[label]])=>[k,label])],c.expertise);
  }
  if(['Crafter','Musician'].includes(def.name)&&def.source==='XPHB' || def.name==='Linguist'&&def.source==='PHB'){
    const options=CharacterFeatRules.trainingOptions(def,CharacterRules).map(v=>[v,v.split(':')[1]]);
    for(let i=0;i<3;i++)html+=select('Choose '+(def.name==='Linguist'?'language':'training')+' '+(i+1),'training'+i,[['','Choose'],...options],c.training[i]);
  }
  if(def.name==='Keen Mind'&&def.source==='XPHB')html+=select('Knowledge proficiency / expertise','training0',[['','Choose skill'],...skills.filter(([key])=>CharacterFeatRules.trainingOptions(def,CharacterRules).includes(key))],c.training[0]);
  if(def.name==='Boon of Skill'&&def.source==='XPHB')html+=select('Expertise','expertise',[['','Choose skill'],...Object.entries(CharacterSheetModel.skills).map(([k,[label]])=>[k,label])],c.expertise);
  if(def.name==='Observant'&&def.edition==='2024')html+=select('Proficiency / expertise','training0',[['','Choose skill'],...skills.filter(([key])=>['skill:insight','skill:investigation','skill:perception'].includes(key))],c.training[0]);
  if(def.name==='Defense'&&def.edition==='2024')html+=`<label class="sheet-check"><input type="checkbox" data-feat-choice="armored" ${c.armored?'checked':''}> Wearing Light/Medium/Heavy armor; my entered AC excludes this +1</label>`;
  html+='</div><p><strong>Automated sheet effects:</strong> '+esc(automated.join('; ')||(def.name==='Magic Initiate'?'Spell choices and free use below':'None applied yet'))+'.</p>';
  if(warnings.length)html+='<p role="status" class="sheet-error">'+esc(warnings.join(' '))+'</p>';
  const resource=CharacterFeatRules.resource(def,level);
  if(resource)html+=`<p>${esc(resource.label)} · remaining ${Math.max(0,resource.max-c.used)}/${resource.max} · resets: ${esc(resource.resets.join(', '))}. Apply only when the feat’s conditions are met.</p><button type="button" data-feat-use="use" ${c.used>=resource.max||warnings.length?'disabled':''}>Use feature</button> <button type="button" data-feat-use="undo" ${!c.used?'disabled':''}>Undo use</button>`;
  return html+'<p>Other effects and combat decisions are manual. In Base mode, a feat’s Constitution modifier increase also adds HP for every character level. Enter HP before these feat bonuses.</p>';
}

function changeFeatUse(key,delta) {
  readSheetForm();
  const stats=CharacterSheetModel.derive(sheetSession.data,sheetSession.identity.level);
  const report=stats.feats.reports.find(r=>r.key===key),resource=report&&CharacterFeatRules.resource(report.def,sheetSession.identity.level);
  if(!resource || delta>0&&report.warnings.length)return;
  const c=sheetSession.data.rulesChoices.effects[key] ||= CharacterFeatRules.choice();
  if(delta>0&&c.used>=resource.max)return;
  c.used=Math.max(0,Math.min(99,c.used+delta));catalogChanged();
}
function renderFeatCombatResources(stats) {
  let host=document.getElementById('sheetFeatResources');
  if(!host){host=document.createElement('section');host.id='sheetFeatResources';host.className='sheet-resource-panel';document.getElementById('sheet-combat').appendChild(host);}
  const rows=stats.feats.reports.map(report=>({report,resource:CharacterFeatRules.resource(report.def,sheetSession.identity.level)})).filter(x=>x.resource);
  host.hidden=!rows.length;
  host.innerHTML='<h4>Feat resources</h4><p>Use a point when the feat’s conditions apply. Rolls and targets remain your choice.</p>'+rows.map(({report:r,resource:v})=>`<div class="sheet-resource-row"><span><strong>${sheetEscape(r.def.name)} · ${r.def.edition}${r.origin?' · '+sheetEscape(r.originLabel||'Variant Human'):''}</strong><small>${sheetEscape(v.label)} · recovery: ${sheetEscape(v.resets.join(', '))}</small></span><output>${Math.max(0,v.max-r.choice.used)} / ${v.max}</output><button type="button" data-combat-feat="${sheetEscape(r.key)}" data-delta="1" ${r.warnings.length||r.choice.used>=v.max?'disabled':''}>Use</button><button type="button" data-combat-feat="${sheetEscape(r.key)}" data-delta="-1" ${!r.choice.used?'disabled':''}>Undo</button></div>`).join('')+'<div class="sheet-actions"><button type="button" data-combat-recover="turn">Start my turn</button><button type="button" data-combat-recover="initiative">Initiative: reset uses</button><button type="button" data-combat-recover="short">Short rest: feat uses</button><button type="button" data-combat-recover="long">Long rest: feat uses</button></div>';
  host.querySelectorAll('[data-combat-feat]').forEach(button=>button.onclick=()=>changeFeatUse(button.dataset.combatFeat,Number(button.dataset.delta)));
  host.querySelectorAll('[data-combat-recover]').forEach(button=>button.onclick=()=>{readSheetForm();CharacterFeatRules.reset(sheetSession.data,button.dataset.combatRecover);catalogChanged('Feat uses reset. HP and spell slots are unchanged. Save to keep this change.');});
}
