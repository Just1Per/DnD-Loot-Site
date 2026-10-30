'use strict';
let sheetCatalogSignature='';
let sheetFeatInformationFocus=null;
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
  const name=String(feat?.name||'').toLowerCase(),summary=String(ref?.summary||feat?.description||'').toLowerCase();
  if(/^magic initiate/.test(name)||/spell|cantrip|magic|invocation|casting/.test(summary))tags.add('spells');
  if(/weapon|fighting|attack|damage|initiative|mastery|combat/.test(summary))tags.add('combat');
  if(/armor|shield/.test(summary)||def?.armorTraining?.length)tags.add('armor');
  if(/hit point|health|resistance|saving throw|defen[cs]|ward|ac /.test(summary))tags.add('defense');
  if(/speed|movement|jump|teleport|fly|climb|swim/.test(summary))tags.add('movement');
  if(/skill|proficiency|expertise|tool|language/.test(summary)||def?.toolChoices?.length)tags.add('skills');
  if(!tags.size)tags.add('other');
  return [...tags];
}
function featPreviewText(feat){
  const ref=featReference(feat),def=CharacterFeatRules.definitions?.[feat?.id],parts=[];
  const originSummary=feat?.edition==='2024'&&feat?.source==='XPHB'?CharacterRules.modern.featSummary?.(def?.name||feat.name):'';
  if(originSummary)parts.push(originSummary);else if(ref?.summary)parts.push(ref.summary);
  if(!parts.length&&feat?.description)parts.push(feat.description.replace(/\s+/g,' ').trim());
  if(!parts.length&&def?.ability?.length)parts.push('Includes an ability-score increase; configure the allowed ability choice after selecting the feat.');
  if(!parts.length)parts.push('Structured feat metadata is available below; use the listed source and page for complete source-book wording.');
  return parts.join(' ');
}
// Reuse the feat reference text, keeping full bundled descriptions when available.
function featOverviewDescription(id){
  const feat=CharacterCatalog.find(id,'feats'),def=CharacterFeatRules.definitions[id];
  if(!feat&&!def)return '';
  const text=String(feat?.description||'').trim();
  if(text&&!/consult the source|source reference only|complete rules/i.test(text))return text;
  const ref=featReference(feat||def);
  return [...new Set([ref?.summary,...(ref?.facts||[])].filter(Boolean))].join('\n')||(feat?featPreviewText(feat):'');
}
function toggleFeatOverviewDescription(id){
  if(!sheetSession)return;readSheetForm();
  if(!CharacterFeatRules.entries(sheetSession.data).some(entry=>entry.id===id))return;
  const selected=sheetSession.data.adobe.overviewFeatDescriptions;
  sheetSession.data.adobe.overviewFeatDescriptions=selected.includes(id)?selected.filter(value=>value!==id):[...selected,id];
  catalogChanged('Feat description display updated. Save the sheet to keep it.');
}
// A read-only view joins all feat sources, including references without an adapter.
function featInformationRecord(id) {
  const found=CharacterCatalog.find(id,'feats');if(found)return found;
  const def=CharacterFeatRules.definitions?.[id];if(def)return {id,...def,name:def.displayName||def.name,book:def.source};
  if(String(id).startsWith('reference:')){
    const [edition,...parts]=String(id).slice(10).split('|');
    return {id,edition,name:parts.join('|'),source:'Source reference',book:'Source reference'};
  }
  return {id,name:String(id),edition:'Unknown',source:'Saved feat reference'};
}
function selectedFeatCards(data,stats) {
  const bg=CharacterBackgrounds.get(data.build.background),race=CharacterRules.races?.[data.build.race];
  const sourceLabel=report=>report.key==='origin-background'?'Background · '+(bg?.name||'Custom background'):report.key==='origin-human'?'Race · Human Versatile':report.classFeature?'Class · Fighting Style':report.origin?'Race · '+(race?.name||report.originLabel||'Granted feat'):'Chosen feat';
  const cards=stats.feats.reports.map(report=>{
    const feat=featInformationRecord(report.id),source=[feat.book||feat.source,feat.page?'p. '+feat.page:''].filter(Boolean).join(' · ');
    return {id:report.id,key:report.key,name:feat.name||report.def.displayName||report.def.name,edition:feat.edition||report.def.edition,source,origin:sourceLabel(report),summary:featPreviewText(feat),report};
  });
  const append=(key,name,origin)=>{
    if(!name||cards.some(card=>card.key===key))return;
    const base=String(name).replace(/ \((?:Cleric|Druid|Wizard)\)$/,''),rows=CharacterCatalog.data?.feats||[],found=rows.find(f=>f.edition===data.build.edition&&(f.name===name||(CharacterFeatRules.definitions[f.id]?.name||f.name)===name))||rows.find(f=>f.edition===data.build.edition&&f.name===base),id=found?.id||'reference:'+data.build.edition+'|'+name;
    const feat=found||featInformationRecord(id);
    cards.push({id,key,name,edition:data.build.edition,source:[feat.book||feat.source,feat.page?'p. '+feat.page:''].filter(Boolean).join(' · '),origin,summary:featPreviewText(feat),report:null});
  };
  if(data.build.edition==='2024'){
    const name=bg?.featChoices?.length?(bg.featChoices.includes(data.build.backgroundFeat)?data.build.backgroundFeat:''):(bg?.feat||data.build.backgroundFeat);
    append('origin-background',name,'Background · '+(bg?.name||'Custom background'));
    if(data.build.race==='human-2024')append('origin-human',data.build.humanOriginFeat,'Race · Human Versatile');
  }else if(data.build.race==='variant-human'||race?.feat)append('variant',data.build.raceFeat,'Race · '+(race?.name||'Variant Human'));
  return cards;
}
function closeFeatInformation(){const d=document.getElementById('sheetFeatInformation');if(d){if(d.open)d.close();d.remove();if(sheetFeatInformationFocus?.isConnected)sheetFeatInformationFocus.focus({preventScroll:true});sheetFeatInformationFocus=null;}}
function openFeatInformation(featId){
  const feat=featInformationRecord(featId);if(!feat)return;
  closeFeatInformation();sheetFeatInformationFocus=document.activeElement;
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
  const licensed=String(feat.description||'').trim(),referenceSummary=featPreviewText(feat), completeText=!!licensed&&!/consult the source|source reference only|complete rules/i.test(licensed);
  d.innerHTML=`<header><div><span class="sheet-eyebrow">FEAT REFERENCE</span><h2 id="sheetFeatInformationTitle">${sheetEscape(feat.name)}</h2></div><button type="button" aria-label="Close feat information">Close</button></header>
    <div class="sheet-feat-facts"><p><strong>Rules:</strong> ${sheetEscape(feat.edition)}</p><p><strong>Category:</strong> ${sheetEscape(featCategoryLabel(feat))}</p><p><strong>Source:</strong> ${sheetEscape(feat.book||feat.source)}${feat.page?' · p. '+sheetEscape(feat.page):''}</p><p><strong>Minimum level:</strong> ${feat.minimumLevel||'None'}</p></div>
    <section class="sheet-summary-box"><h3>Quick summary</h3><p>${sheetEscape(featPreviewText(feat))}</p></section>
    ${facts.length?`<section class="sheet-summary-box"><h3>Structured benefits</h3><ul>${[...new Set(facts)].map(v=>'<li>'+sheetEscape(v)+'</li>').join('')}</ul></section>`:''}
    ${ref?.features?.length?`<section class="sheet-summary-box"><h3>Named features</h3><p>${ref.features.map(sheetEscape).join(' · ')}</p></section>`:''}
    ${req.length?`<section class="sheet-summary-box"><h3>Prerequisites</h3><p>${req.map(sheetEscape).join(' · ')}</p></section>`:''}
    ${completeText?`<details open><summary>Bundled rules text</summary><p class="sheet-rule-text">${sheetEscape(licensed)}</p></details>`:`<p class="sheet-help">${sheetEscape(referenceSummary)} The exact published wording remains in the listed source.</p><button type="button" data-feat-lookup>Look up full feat rules</button><p class="sheet-help">Opens the existing rules lookup; verify the result against the listed source.</p>`}`;
  document.body.appendChild(d);d.addEventListener('cancel',event=>{event.preventDefault();closeFeatInformation();});d.querySelector('header button').onclick=closeFeatInformation;d.addEventListener('click',event=>{if(event.target===d)closeFeatInformation();});d.querySelector('[data-feat-lookup]')?.addEventListener('click',event=>{const context={kind:'feat',name:feat.name,source:feat.book||feat.source||'',edition:feat.edition||'',extra:'Read the full feat benefits, prerequisites and choices.'};closeFeatInformation();if(globalThis.AiLookup?.open)AiLookup.open(context,document.querySelector('[data-selected-feat-info="'+CSS.escape(featId)+'"]'));else window.open('https://www.google.com/search?q='+encodeURIComponent('D&D '+feat.edition+' '+feat.name+' '+(feat.book||feat.source||'')), '_blank','noopener,noreferrer');});d.showModal();d.querySelector('header button').focus();
}
function dmFeatGrant(){
  const grants=sheetSession?.data?.rulesChoices?.grants||(sheetSession.data.rulesChoices.grants={});
  return grants.__dm||(grants.__dm={bonusFeats:0,bonusAsis:0,usedAsis:0,approvedBy:'',updatedAt:0});
}
function renderDmFeatApproval(){
 const host=document.getElementById('sheetDmFeatApproval');if(!host||!sheetSession)return;
 const grant=dmFeatGrant(),budget=CharacterPlayRules.budget(sheetSession.data,sheetSession.identity.level,CharacterCatalog.data?.feats||[]);
 host.innerHTML=`<h4>Advancement choices</h4><p class="sheet-help">Normal ASI choices used: ${sheetSession.data.advancement.asiSpent} · Bonus feat choices: ${grant.bonusFeats||0} · Bonus ASIs: ${grant.usedAsis||0}/${grant.bonusAsis||0} · Remaining feat choices: ${budget.remaining}. Your campaign DM manages extra advancement in DM Tools.</p>`;
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
  const editions=CampaignRules.editions().map(v=>'<option value="'+v+'">'+v+'</option>').join('');
  const sources=[...new Set(C.data.feats.map(f=>f.source).filter(Boolean))].sort();
  const categories=[...new Set(C.data.feats.map(f=>String(f.category||'')))].sort((a,b)=>featCategoryLabel({category:a}).localeCompare(featCategoryLabel({category:b})));
  feats.innerHTML=`<section id="catalogSelectedFeats" aria-label="Your feats"></section><div id="catalogFeatGrants"></div>
    <section class="sheet-feat-choose" aria-labelledby="sheetChooseFeatsTitle"><h3 id="sheetChooseFeatsTitle">Choose & manage feats</h3><p class="sheet-help">Choose a background or species feat, or use the catalogue for advancement. Every selected feat appears in Your feats above.</p>
    <div id="catalogBuildFeatChoices" class="sheet-build-feat-choices"></div>
    <section id="sheetDmFeatApproval" class="sheet-dm-feat-approval"></section>
    <p id="sheetFeatBudget" role="status"></p><details class="sheet-feat-browser" open><summary>Browse the feat catalogue</summary><p class="sheet-help">${C.data.feats.length} campaign-approved feats. Filter the list and use <strong>i</strong> to read before choosing.</p>
    <div class="sheet-grid sheet-feat-filters">
      <label class="sheet-field">Rules<select id="catalogFeatEdition">${editions}${CampaignRules.editions().length===2?'<option value="">Both editions</option>':''}</select></label>
      <label class="sheet-field">Category<select id="catalogFeatCategory"><option value="">All categories</option>${categories.map(v=>`<option value="${esc(v)}">${esc(featCategoryLabel({category:v}))}</option>`).join('')}</select></label>
      <label class="sheet-field">Effect<select id="catalogFeatEffect"><option value="">Any effect</option><option value="ability">Ability increase</option><option value="armor">Armor / shields</option><option value="spells">Spells / magic</option><option value="skills">Skills / tools</option><option value="combat">Weapons / combat</option><option value="defense">Defense / HP</option><option value="movement">Movement</option><option value="other">Other</option></select></label>
      <label class="sheet-field">Source<select id="catalogFeatSource"><option value="">Any source</option>${sources.map(v=>`<option value="${esc(v)}">${esc(v)}</option>`).join('')}</select></label>
      <label class="sheet-field">Minimum level<select id="catalogFeatLevel"><option value="">Any</option><option value="0">No level prerequisite</option>${[4,8,12,16,19].map(v=>`<option value="${v}">Level ${v} or lower</option>`).join('')}</select></label>
      <label class="sheet-field">Find feat<input id="catalogFeatSearch" type="search" placeholder="Name, feature, benefit"></label>
    </div>
    <div id="catalogFeatResults"></div></details></section>`;
  spells.innerHTML=`<h4>Choose spells from the catalogue</h4><p>Campaign-approved editions are shown. Search matches spell names, schools and damage types. Adding a spell here is for exceptions/DM-approved additions and does not replace the class-aware Generate spell sheet workflow.</p><div class="sheet-grid"><label class="sheet-field">Rules<select id="catalogSpellEdition">${editions}${CampaignRules.editions().length===2?'<option value="">Both editions</option>':''}</select></label><label class="sheet-field">Class<select id="catalogSpellClass"><option value="">Any class</option>${['artificer','bard','cleric','druid','paladin','ranger','sorcerer','warlock','wizard'].filter(c=>c!=='artificer'||CampaignRules.editions().includes('2014')).map(c=>`<option value="${c}">${c}</option>`).join('')}</select></label><label class="sheet-field">Level<select id="catalogSpellLevel"><option value="">Any level</option>${Array.from({length:10},(_,i)=>`<option value="${i}">${i||'Cantrip'}</option>`).join('')}</select></label><label class="sheet-field">School<select id="catalogSpellSchool"><option value="">Any school</option>${C.schools.map(s=>`<option value="${esc(s)}">${esc(s)}</option>`).join('')}</select></label><label class="sheet-field">Find spell<input id="catalogSpellSearch" type="search" placeholder="Name, school, damage type"></label></div><div id="catalogSpellResults"></div><button type="button" id="catalogLongRest">Long rest: restore slots & tracked features</button>`;
  document.getElementById('catalogFeatEdition').value='';
  document.getElementById('catalogSpellEdition').value=sheetSession.data.build.edition;
  for(const id of ['catalogSpellEdition','catalogSpellClass','catalogSpellLevel','catalogSpellSchool','catalogSpellSearch'])document.getElementById(id).addEventListener(id.endsWith('Search')?'input':'change',renderCatalogSpellResults);
  for(const id of ['catalogFeatEdition','catalogFeatCategory','catalogFeatEffect','catalogFeatSource','catalogFeatLevel','catalogFeatSearch'])document.getElementById(id).addEventListener(id.endsWith('Search')?'input':'change',renderCatalogFeatResults);
  document.getElementById('catalogLongRest').onclick=()=>{
    readSheetForm();if(!confirm('Record one completed Long Rest? Restore spell slots and tracked Long Rest features, and advance Divine Intervention recovery once. HP is unchanged.'))return;
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
    const spell=CharacterCatalog.find(id);if(!spell || !CampaignRules.allowed(spell)||sheetSession.data.spells.some(s=>s.catalogId===id))continue;
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
    const options=[['',prompt],...rows.map(f=>[CharacterFeatRules.definitions[f.id]?.name||f.name,f.name+' · '+(f.source||f.book||f.edition)])];
    if(current&&!options.some(([value])=>value===current))options.push(['','Existing choice unavailable in this campaign']);
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
    const backgroundChoices=Array.isArray(bg?.featChoices)?uniqueByName(allFeats.filter(f=>f.edition==='2024'&&bg.featChoices.includes(CharacterFeatRules.definitions[f.id]?.name||f.name))):[];
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
  host.querySelectorAll('[data-build-feat-field]').forEach(select=>{
    if(!select.value)return;
    const feat=(CharacterCatalog.data.feats||[]).find(f=>f.edition===b.edition&&(CharacterFeatRules.definitions[f.id]?.name||f.name)===select.value);
    if(!feat)return;
    const preview=document.createElement('p');preview.className='sheet-build-feat-selection';
    preview.innerHTML='<strong>Selected: '+sheetEscape(feat.name)+'</strong><button type="button" class="sheet-info-button" aria-label="Information about '+sheetEscape(feat.name)+'">i</button><small>Shown in Your feats above.</small>';
    preview.querySelector('button').onclick=()=>openFeatInformation(feat.id);select.closest('article').append(preview);
  });
  host.querySelectorAll('[data-build-feat-field]').forEach(select=>select.onchange=()=>{
    readSheetForm();
    const field=select.dataset.buildFeatField;
    sheetSession.data.build[field]=select.value;
    if(field==='backgroundFeat'){sheetSession.data.build.backgroundFeatChoices=['','',''];if(sheetSession.data.rulesChoices.effects['origin-background'])delete sheetSession.data.rulesChoices.effects['origin-background'].training;}
    if(field==='humanOriginFeat'){sheetSession.data.build.humanFeatChoices=['','',''];if(sheetSession.data.rulesChoices.effects['origin-human'])delete sheetSession.data.rulesChoices.effects['origin-human'].training;}
    if(field==='raceFeat'&&sheetSession.data.rulesChoices?.effects)delete sheetSession.data.rulesChoices.effects.variant;
    fillSheetForm();
    sheetCatalogSignature='';
    catalogChanged((select.value?'Selected '+select.value+'. Shown in Your feats above.':'Feat choice cleared.')+' Save the character sheet to keep it.');
    renderCatalogFeatResults();
    host.querySelector('[data-build-feat-field="'+field+'"]')?.focus({preventScroll:true});
  });
  host.querySelectorAll('[data-build-feat-array]').forEach(select=>select.onchange=()=>{
    readSheetForm();
    const field=select.dataset.buildFeatArray,index=Number(select.dataset.buildFeatIndex);
    const values=sheetSession.data.build[field]||['','',''];
    values[index]=select.value;
    sheetSession.data.build[field]=values;
    const originKey=field==='humanFeatChoices'?'origin-human':'origin-background';
    if(sheetSession.data.rulesChoices.effects[originKey])delete sheetSession.data.rulesChoices.effects[originKey].training;
    fillSheetForm();
    sheetCatalogSignature='';
    catalogChanged('Feat proficiency choices changed. Save the character sheet to keep them.');
    host.querySelector('[data-build-feat-array="'+field+'"][data-build-feat-index="'+index+'"]')?.focus({preventScroll:true});
  });
}

function renderCatalogFeatResults() {
  const host=document.getElementById('catalogFeatResults');if(!host)return;
  const get=id=>document.getElementById(id)?.value||'';
  const edition=get('catalogFeatEdition'),category=get('catalogFeatCategory'),effect=get('catalogFeatEffect'),source=get('catalogFeatSource'),level=get('catalogFeatLevel'),search=get('catalogFeatSearch').trim().toLowerCase();
  const scores=CharacterSheetModel.derive(sheetSession.data,sheetSession.identity.level).scores;
  const rows=CharacterCatalog.data.feats.filter(f=>{
    const ref=featReference(f),hay=[f.name,f.source,f.book,featCategoryLabel(f),featPreviewText(f),...(ref?.features||[]),...(ref?.facts||[])].filter(Boolean).join(' ').toLowerCase();
    return (!edition||f.edition===edition)&&(!category||String(f.category||'')===category)&&(!effect||featEffectTags(f).includes(effect))&&(!source||f.source===source)&&
      (level===''||(level==='0'?Number(f.minimumLevel||0)===0:Number(f.minimumLevel||0)<=Number(level)))&&(!search||hay.includes(search));
  }).sort((a,b)=>a.name.localeCompare(b.name)||a.edition.localeCompare(b.edition));
  host.innerHTML=`<div class="sheet-repeat-title"><h4>Browse feats</h4><span>${rows.length} of ${CharacterCatalog.data.feats.length} shown</span></div><div class="sheet-catalog-results sheet-feat-results">${rows.map(f=>{
    const denied=CharacterPlayRules.eligible(sheetSession.data,sheetSession.identity.level,f,CharacterCatalog.data.feats,scores),tags=featEffectTags(f);
    return `<article><div class="sheet-feat-result-copy"><strong>${sheetEscape(f.name)}</strong><span>${f.edition} · ${sheetEscape(featCategoryLabel(f))} · ${sheetEscape(f.source)}${f.minimumLevel?' · Level '+f.minimumLevel+'+':''}</span><small>${sheetEscape(featPreviewText(f).slice(0,180))}${featPreviewText(f).length>180?'…':''}</small>${tags.length?'<div class="sheet-feat-tags">'+tags.map(t=>'<span>'+sheetEscape(t)+'</span>').join('')+'</div>':''}</div><button type="button" class="sheet-info-button" data-feat-info="${sheetEscape(f.id)}" aria-label="Information about ${sheetEscape(f.name)}">i</button><button type="button" data-add-catalog-feat="${sheetEscape(f.id)}" ${denied?'disabled':''} title="${sheetEscape(denied||'Choose this feat')}">Choose feat</button></article>`;
  }).join('')||'<p class="sheet-empty">No feats match these filters.</p>'}</div>`;
  host.querySelectorAll('[data-feat-info]').forEach(button=>button.onclick=()=>openFeatInformation(button.dataset.featInfo));
  host.querySelectorAll('[data-add-catalog-feat]').forEach(button=>button.onclick=()=>{
    readSheetForm();const feat=CharacterCatalog.find(button.dataset.addCatalogFeat,'feats'),data=sheetSession.data;
    if(!CampaignRules.selectableFeat(feat?.id,CharacterCatalog.rawData.feats))return sheetStatus('This feat is not available in this campaign.',true);
    const denied=CharacterPlayRules.eligible(data,Number(sheetSession.identity.level),feat,CharacterCatalog.data.feats,CharacterSheetModel.derive(data,Number(sheetSession.identity.level)).scores);if(denied){sheetStatus(denied,true);return;}
    if(feat.minimumLevel>Number(sheetSession.identity.level)){sheetStatus(`This feat requires level ${feat.minimumLevel}.`,true);return;}
    if(data.build.edition==='2014' && data.build.race==='variant-human' && feat.edition==='2014' && !data.build.raceFeat){data.build.raceFeat=feat.name;fillSheetForm();}
    else {
      if(data.rulesChoices.feats.includes(feat.id)&&!CharacterFeatRules.definitions[feat.id]?.repeatable){sheetStatus('This feat is already selected.');return;}
      if(data.rulesChoices.feats.length>=30){sheetStatus('Maximum 30 additional feats.',true);return;}
      data.rulesChoices.feats.push(feat.id);
    }
    catalogChanged('Feat selected. Review its choices, then save.');renderCatalogFeatResults();
  });
}
function updateSheetCatalogGrants() {
  const host=document.getElementById('catalogFeatGrants');
  if(!host || !CharacterCatalog.data || !sheetSession)return;
  const data=sheetSession.data, C=CharacterCatalog;
  renderBuildFeatChoices();renderDmFeatApproval();
  const stats=CharacterSheetModel.derive(data,sheetSession.identity.level);
  const signature=JSON.stringify([stats.scores,stats.pb,stats.feats.reports.map(r=>[r.key,r.id,r.warnings,r.automated,r.choice]),sheetSession.identity.level,data.build.edition,data.build.race,data.build.background,data.build.backgroundFeat,data.build.humanOriginFeat,data.build.raceFeat,data.rulesChoices,data.adobe.overviewFeatDescriptions]);
  if(signature===sheetCatalogSignature)return;
  sheetCatalogSignature=signature;
  const feats=document.getElementById('catalogSelectedFeats');
  const openChoices=new Map([...feats.querySelectorAll('[data-selected-feat-choices]')].map(node=>[node.dataset.selectedFeatChoices,node.open]));
  const activeChoice=document.activeElement?.closest('[data-feat-key]')?.dataset.featKey,activeField=document.activeElement?.dataset.featChoice;
  const cards=selectedFeatCards(data,stats);
  feats.innerHTML='<header class="sheet-selected-feats-heading"><div><span class="sheet-eyebrow">YOUR CHARACTER</span><h3>Your feats <span class="sheet-feat-count">'+cards.length+'</span></h3><p class="sheet-help">Background, species, class and chosen feats, together. Open <strong>i</strong> to read the rules; expand choices to configure a benefit.</p></div><button type="button" data-go-feat-choices>Choose or change a feat ↓</button></header>'+(cards.length?'<div class="sheet-selected-feat-grid">'+cards.map(card=>{
    const report=card.report,controls=report?renderFeatEffectControls(report,sheetSession.identity.level):'',needsChoices=/<select|data-open-granted-training/.test(controls)||!!report?.warnings.length;
    return `<article class="sheet-repeat sheet-selected-feat" data-feat-key="${sheetEscape(card.key)}"><header><div><span class="sheet-eyebrow">${sheetEscape(card.origin)}</span><h4>${sheetEscape(card.name)}</h4><small>${sheetEscape(card.edition)} · ${sheetEscape(card.source)}</small></div><button type="button" class="sheet-info-button" data-selected-feat-info="${sheetEscape(card.id)}" aria-label="Information about ${sheetEscape(card.name)}">i</button></header><p class="sheet-feat-summary">${sheetEscape(card.summary.slice(0,320)+(card.summary.length>320?'…':''))}</p>${report?`<details data-selected-feat-choices="${sheetEscape(card.key+'::'+card.id)}" ${(openChoices.has(card.key+'::'+card.id)?openChoices.get(card.key+'::'+card.id):needsChoices)?'open':''}><summary>Choices & sheet effects${report.warnings.length?' · review needed':''}</summary>${controls}${report.def.name==='Weapon Master'&&report.eligible?'<button type="button" data-open-weapon-training>Choose weapon training</button>':''}</details><div class="sheet-selected-feat-actions"><button type="button" data-feat-overview-description="${sheetEscape(card.id)}" aria-pressed="${data.adobe.overviewFeatDescriptions.includes(card.id)}">${data.adobe.overviewFeatDescriptions.includes(card.id)?'Remove description from Overview':'Add description to Overview'}</button>${report.origin?'':`<button type="button" data-remove-feat="${sheetEscape(report.key)}">Remove feat</button>`}</div>`:'<p class="sheet-help">Reference only. Read its rules and record any unsupported effects with your DM.</p>'}</article>`;
  }).join('')+'</div>':'<p class="sheet-feat-empty">No feats selected yet. Choose a granted feat or an advancement feat below; it will appear here.</p>');
  feats.querySelector('[data-go-feat-choices]').onclick=()=>{const heading=document.getElementById('sheetChooseFeatsTitle');heading.tabIndex=-1;heading.scrollIntoView?.({block:'start',behavior:'smooth'});heading.focus({preventScroll:true});};
  feats.querySelectorAll('[data-open-granted-training]').forEach(button=>button.onclick=()=>{const field=document.querySelector('[data-build-feat-array="'+button.dataset.openGrantedTraining+'"]');field?.scrollIntoView?.({block:'center'});field?.focus({preventScroll:true});});
  feats.querySelectorAll('[data-feat-overview-description]').forEach(button=>button.onclick=()=>toggleFeatOverviewDescription(button.dataset.featOverviewDescription));
  feats.querySelectorAll('[data-open-weapon-training]').forEach(button=>button.onclick=()=>{selectSheetTab('skills');(document.querySelector('[data-weapon-training*="feat-weapon-master"]')||document.querySelector('[data-weapon-training]'))?.focus();});
  feats.querySelectorAll('[data-selected-feat-info]').forEach(button=>button.onclick=()=>openFeatInformation(button.dataset.selectedFeatInfo));
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
  if(activeChoice&&activeField)[...feats.querySelectorAll('[data-feat-key]')].find(node=>node.dataset.featKey===activeChoice)?.querySelector('[data-feat-choice="'+activeField+'"]')?.focus({preventScroll:true});
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
function renderFeatEffectControls(report,level,data=sheetSession.data) {
  const {def,choice:c,warnings,automated}=report,esc=sheetEscape;
  const select=(label,field,rows,value)=>`<label class="sheet-field">${esc(label)}<select data-feat-choice="${field}">${rows.map(([key,text])=>`<option value="${esc(key)}" ${String(key)===String(value)?'selected':''}>${esc(text)}</option>`).join('')}</select></label>`;
  if(report.managedOrigin&&def.name==='Skilled'){const field=report.key==='origin-human'?'humanFeatChoices':'backgroundFeatChoices',values=data.build[field]||[];return '<p class="sheet-help">Selected training: '+values.map(value=>esc(value.startsWith('skill:')?CharacterSheetModel.skills[value.slice(6)]?.[0]||value:value.replace(/^tool:/,''))).filter(Boolean).join(' · ')+'</p>'+(warnings.length?'<p class="sheet-error">'+warnings.map(esc).join(' ')+'</p>':'')+'<button type="button" data-open-granted-training="'+field+'">Change granted training below</button>'; }
  let html='<div class="sheet-grid">';
  const prereqs=featReference(CharacterCatalog.find(report.id,'feats')||def)?.requirements||[];
  if(prereqs.length)html+='<p class="sheet-help"><strong>Prerequisites:</strong> '+prereqs.map(esc).join(' · ')+'. Review these when choosing this feat.</p>';
  if(report.prerequisiteInfo?.length)html+='<p class="sheet-help">'+report.prerequisiteInfo.map(esc).join(' · ')+'</p>';
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
  const used=CharacterFeatRules.choice(sheetSession.data.rulesChoices.effects[key]).used;
  if(Number.isInteger(delta)&&CharacterFeatRules.setUsed(sheetSession.data,key,used+delta,{level:sheetSession.identity.level,reports:stats.feats.reports}))catalogChanged();
}
function renderFeatCombatResources(stats) {
  let host=document.getElementById('sheetFeatResources');
  if(!host){host=document.createElement('section');host.id='sheetFeatResources';host.className='sheet-resource-panel';document.getElementById('sheet-combat').appendChild(host);}
  const rows=stats.feats.reports.map(report=>({report,resource:CharacterFeatRules.resource(report.def,sheetSession.identity.level)})).filter(x=>x.resource);
  const classRows=stats.classResources||[],recovery=new Set([...classRows.flatMap(row=>row.resets),...rows.flatMap(row=>row.resource.resets)]);
  const bardContext={level:sheetSession.identity.level,mods:stats.mods,slotMax:stats.effects.slotMax,pact:stats.progression?.pact},bardSlots=CharacterClassFeatureChoices.bardSlotRecovery(sheetSession.data,bardContext),selectedSlot=host.querySelector('[data-bard-slot]')?.value||bardSlots.find(row=>row.available)?.value||'';
  const bardRecovery=row=>!row.slotRecovery?'':`<div class="sheet-class-resource-actions sheet-bard-slot-recovery"><label class="sheet-field"><span>Font of Inspiration · expend a slot</span><select data-bard-slot><option value="">Choose slot</option>${bardSlots.map(slot=>`<option value="${slot.value}" ${selectedSlot===slot.value?'selected':''} ${!slot.available?'disabled':''}>${sheetEscape(slot.label)}</option>`).join('')}</select></label><button type="button" data-bard-slot-recover ${!row.used||!bardSlots.some(slot=>slot.value===selectedSlot&&slot.available)?'disabled':''}>Restore 1 inspiration use</button></div>`;
  const metamagicRows=classRows.find(row=>row.id==='sorcery-points')?.metamagic||[],selectedMetamagic=host.querySelector('[data-metamagic]')?.value||metamagicRows[0]?.id||'',selectedSpellLevel=host.querySelector('[data-metamagic-level]')?.value||'0';
  const metamagicControls=row=>row.id!=='sorcery-points'||!metamagicRows.length?'':`<div class="sheet-class-resource-actions sheet-metamagic-controls"><label class="sheet-field"><span>Chosen Metamagic</span><select data-metamagic>${metamagicRows.map(choice=>`<option value="${choice.id}" ${choice.id===selectedMetamagic?'selected':''}>${sheetEscape(choice.name)} · ${choice.cost===null?'spell level, minimum 1':choice.cost} ${choice.cost===1?'point':'points'}</option>`).join('')}</select></label><label class="sheet-field" data-metamagic-level-field><span>Spell level as cast · Twinned Spell</span><select data-metamagic-level>${Array.from({length:10},(_,i)=>`<option value="${i}" ${String(i)===selectedSpellLevel?'selected':''}>${i?'Level '+i:'Cantrip'}</option>`).join('')}</select></label><button type="button" data-spend-metamagic>Use Metamagic</button><p class="sheet-help" data-metamagic-detail></p></div>`;
  const arcane=classRows.some(row=>row.id==='wizard-arcane-recovery')?CharacterClassFeatureChoices.arcaneRecovery(sheetSession.data,bardContext):null,arcaneOpen=host.querySelector('[data-arcane-options]')?.open||false,arcaneSelected=new Map([...host.querySelectorAll('[data-arcane-slot]')].map(input=>[input.dataset.arcaneSlot,Number(input.value)]));
  const arcaneControls=row=>!row.managedSlots?'':`<details class="sheet-arcane-options" data-arcane-options ${arcaneOpen?'open':''}><summary>Choose slots to recover · up to ${arcane.budget} levels</summary><div class="sheet-arcane-slots">${arcane.slots.map(slot=>`<label class="sheet-field"><span>${sheetEscape(slot.label)}</span><select data-arcane-slot="${slot.id}" aria-label="Recover ${slot.created?'created level '+slot.level:slot.id==='pact'?'Pact level '+slot.level:'level '+slot.level} slots" ${arcane.used?'disabled':''}>${Array.from({length:slot.used+1},(_,i)=>`<option value="${i}" ${Math.min(slot.used,arcaneSelected.get(slot.id)||0)===i?'selected':''}>${i} slot${i===1?'':'s'}</option>`).join('')}</select></label>`).join('')}</div><p class="sheet-help" data-arcane-budget></p><button type="button" data-arcane-recover>Recover selected slots</button></details>${arcane.edition==='2014'?`<button type="button" data-arcane-new-day ${!arcane.used?'disabled':''}>New day · reset recovery</button>`:''}`;
  const channelSelected=new Map([...host.querySelectorAll('[data-channel-effect]')].map(input=>[input.dataset.channelEffect,input.value]));
  const channelControls=row=>!row.channelEffects?'':`<div class="sheet-class-resource-actions sheet-channel-controls"><label class="sheet-field"><span>Channel Divinity effect</span><select data-channel-effect="${row.id}">${row.channelEffects.length?row.channelEffects.map(effect=>`<option value="${effect.id}" ${(channelSelected.get(row.id)||(sheetSession.data.adobe?.classFeatureChoices||{})[row.effectKey]?.[0]||row.channelEffects[0].id)===effect.id?'selected':''}>${sheetEscape(effect.name)}</option>`).join(''):'<option value="">Choose an oath in Character Builder</option>'}</select></label><p class="sheet-help" data-channel-detail="${row.id}"></p><button type="button" data-channel-use="${row.id}" ${!row.remaining||!row.channelEffects.length?'disabled':''}>Use selected effect</button><button type="button" data-class-resource="${row.id}" data-delta="-1" ${!row.used?'disabled':''}>Undo use</button></div>`;
  const selectedAmounts=new Map([...host.querySelectorAll('[data-class-resource-amount]')].map(input=>[input.dataset.classResourceAmount,input.value]));
  const amountControl=row=>!row.variableCost?'':`<label class="sheet-field sheet-resource-amount"><span>Points to spend or undo</span><input type="number" min="1" max="${row.max}" step="1" inputmode="numeric" data-class-resource-amount="${row.id}" value="${sheetEscape(selectedAmounts.get(row.id)??'1')}" aria-label="${sheetEscape(row.name)} points to spend or undo"></label>`;
  const openResourceRules=new Set([...host.querySelectorAll('[data-resource-rules][open]')].map(node=>node.dataset.resourceRules));
  const resourceRules=row=>!row.additionalRules?.length?'':`<details class="sheet-class-resource-rules" data-resource-rules="${row.id}" ${openResourceRules.has(row.id)?'open':''}><summary>${sheetEscape(row.rulesLabel||"Hunter’s Mark feature rules")}</summary>${row.additionalRules.map(rule=>`<p class="sheet-help"><strong>${sheetEscape(rule.name)}:</strong> ${sheetEscape(rule.detail)}</p>`).join('')}</details>`;
  const familiarHelper=globalThis.CharacterWildCompanion,familiarState=familiarHelper?.state(sheetSession.data),showFamiliar=familiarHelper?.capability(sheetSession.data,{level:stats.progression?.targetLevel||sheetSession.identity.level}).available||familiarState?.alive;
  host.hidden=!rows.length&&!classRows.length&&!showFamiliar;
  host.innerHTML='<h4>Feature resources</h4><p>Spend a use or point when the feature’s conditions apply. Resolve rolls and targets at the table.</p>'+(showFamiliar?'<div class="sheet-wc-resource-link"><strong>Wild Companion</strong><p class="sheet-help">Magic action · One Wild Shape use or spell slot · Fey familiar until Long Rest.</p><button type="button" data-open-wild-companion>'+(familiarState?.alive?'Manage familiar in Companions':'Summon familiar in Companions')+'</button></div>':'')+(stats.druidElementalFury?.available?'<p class="sheet-help" data-druid-elemental-fury><strong>Elemental Fury:</strong> '+sheetEscape(stats.druidElementalFury.detail)+'</p>':'')+classRows.map(row=>`<div class="sheet-resource-row sheet-class-resource"><span><strong>${sheetEscape(row.name)}${row.die?' · '+sheetEscape(row.die):''}${Number.isFinite(row.bonus)?' · bonus '+CharacterSheetModel.signed(row.bonus):''}</strong><small>${sheetEscape(row.source)} · ${sheetEscape(row.levelSummary||row.className+' level '+row.level)} · ${sheetEscape(row.recovery)}</small><small>${sheetEscape(row.description)}</small></span><output aria-label="${sheetEscape(row.name)} ${row.variableCost?'healing points':'uses'} remaining">${row.unlimited?'Unlimited':row.remaining+' / '+row.max}</output><div class="sheet-class-resource-actions">${row.unlimited||row.managedSlots||row.managedWildShape||row.channelEffects?'':`${amountControl(row)}<button type="button" data-class-resource="${row.id}" data-delta="1" ${!row.remaining?'disabled':''}>${sheetEscape(row.useLabel)}</button><button type="button" data-class-resource="${row.id}" data-delta="-1" ${!row.used?'disabled':''}>${sheetEscape(row.undoLabel)}</button>${row.extraAction?`<button type="button" data-class-resource="${row.id}" data-delta="1" data-resource-action="${row.extraAction.id}" ${!row.remaining?'disabled':''}>${sheetEscape(row.extraAction.label)}</button>`:''}${row.reroll?`<button type="button" data-class-resource="${row.id}" data-delta="1" data-save-reroll ${!row.remaining?'disabled':''}>Reroll failed save · 1 point</button>`:''}`}</div>${row.managedWildShape?`<button type="button" data-open-wild-shape>Choose form in Companions</button>`:''}${row.rageInitiativeRecovery?`<button type="button" data-rage-initiative ${row.rageRecoveryUsed||!row.used?'disabled':''}>Initiative · regain all Rage uses${row.rageRecoveryUsed?' (used until Long Rest)':' (once per Long Rest)'}</button>`:''}${arcaneControls(row)}${channelControls(row)}${bardRecovery(row)}${metamagicControls(row)}${resourceRules(row)}</div>`).join('')+rows.map(({report:r,resource:v})=>`<div class="sheet-resource-row"><span><strong>${sheetEscape(r.def.name)} · ${r.def.edition}${r.origin?' · '+sheetEscape(r.originLabel||'Variant Human'):''}</strong><small>${sheetEscape(v.label)} · recovery: ${sheetEscape(v.resets.join(', '))}</small></span><output>${Math.max(0,v.max-r.choice.used)} / ${v.max}</output><button type="button" data-combat-feat="${sheetEscape(r.key)}" data-delta="1" ${r.warnings.length||r.choice.used>=v.max?'disabled':''}>Use</button><button type="button" data-combat-feat="${sheetEscape(r.key)}" data-delta="-1" ${!r.choice.used?'disabled':''}>Undo</button></div>`).join('')+'<div class="sheet-actions">'+[['turn','Start my turn'],['initiative','Initiative: reset uses'],['short','Short rest: feature uses'],['long','Long rest: feature uses']].filter(([event])=>recovery.has(event)).map(([event,label])=>'<button type="button" data-combat-recover="'+event+'">'+label+'</button>').join('')+'</div>';
  host.querySelector('[data-rage-initiative]')?.addEventListener('click',()=>{readSheetForm();if(globalThis.CharacterBarbarianRage?.recoverAtInitiative(sheetSession.data,{level:sheetSession.identity.level,confirmed:true})){catalogChanged('Persistent Rage: all Rage uses restored for this Initiative. This recovery is unavailable until Long Rest. Save to keep the change.');host.querySelector('[data-class-resource="barbarian-rage"][data-delta="1"]')?.focus({preventScroll:true});}});
  host.querySelectorAll('[data-class-resource]').forEach(button=>button.onclick=()=>{const amount=host.querySelector('[data-class-resource-amount="'+button.dataset.classResource+'"]'),delta=Number(button.dataset.delta)*(amount?Number(amount.value):1);if(amount&&!amount.checkValidity())return;readSheetForm();const current=CharacterSheetModel.derive(sheetSession.data,sheetSession.identity.level,typeof sheetEquipmentLoot==='function'?sheetEquipmentLoot():[]);if(CharacterClassFeatureChoices.changeClassResource(sheetSession.data,button.dataset.classResource,delta,{level:sheetSession.identity.level,mods:current.mods})){catalogChanged(button.dataset.resourceAction?current.classResources.find(row=>row.id===button.dataset.classResource)?.extraAction?.message||'Class feature used. Save to keep this change.':button.hasAttribute('data-save-reroll')?'Spent 1 point for a failed-save reroll. Roll again and use the new result. Save to keep this change.':'Class feature points/uses updated. Resolve the chosen feature at the table. Save to keep this change.');const next=[...host.querySelectorAll('[data-class-resource]')].find(control=>control.dataset.classResource===button.dataset.classResource&&control.dataset.delta===button.dataset.delta&&control.hasAttribute('data-save-reroll')===button.hasAttribute('data-save-reroll')&&control.dataset.resourceAction===button.dataset.resourceAction&&!control.disabled)||[...host.querySelectorAll('[data-class-resource]')].find(control=>control.dataset.classResource===button.dataset.classResource&&!control.disabled);next?.focus({preventScroll:true});}});
  host.querySelectorAll('[data-class-resource-amount]').forEach(input=>{const refresh=()=>{const row=classRows.find(row=>row.id===input.dataset.classResourceAmount),amount=Number(input.value),valid=input.checkValidity()&&Number.isInteger(amount);host.querySelectorAll('[data-class-resource="'+row.id+'"]').forEach(button=>{button.disabled=!valid||(Number(button.dataset.delta)>0?amount>row.remaining:amount>row.used);});};input.addEventListener('input',refresh);refresh();});
  const metamagicSelect=host.querySelector('[data-metamagic]'),spellLevelSelect=host.querySelector('[data-metamagic-level]'),spendMetamagic=host.querySelector('[data-spend-metamagic]');
  const refreshMetamagic=()=>{if(!metamagicSelect)return;const choice=metamagicRows.find(row=>row.id===metamagicSelect.value),cost=choice?.cost===null?Math.max(1,Number(spellLevelSelect.value)):choice?.cost;host.querySelector('[data-metamagic-level-field]').hidden=choice?.cost!==null;host.querySelector('[data-metamagic-detail]').textContent=choice?.detail||'';spendMetamagic.disabled=!choice||(stats.classResources.find(row=>row.id==='sorcery-points')?.remaining||0)<cost;spendMetamagic.textContent='Use Metamagic · '+cost+' point'+(cost===1?'':'s');};
  if(metamagicSelect){metamagicSelect.onchange=refreshMetamagic;spellLevelSelect.onchange=refreshMetamagic;refreshMetamagic();spendMetamagic.onclick=()=>{readSheetForm();const current=CharacterSheetModel.derive(sheetSession.data,sheetSession.identity.level,typeof sheetEquipmentLoot==='function'?sheetEquipmentLoot():[]);if(CharacterClassFeatureChoices.spendMetamagic(sheetSession.data,metamagicSelect.value,Number(spellLevelSelect.value),{level:sheetSession.identity.level,mods:current.mods})){catalogChanged('Metamagic points spent. Apply this cast’s modification at the table. Save to keep the spending.');(host.querySelector('[data-spend-metamagic]:not(:disabled)')||host.querySelector('[data-metamagic]'))?.focus({preventScroll:true});}};}
  host.querySelector('[data-open-wild-companion]')?.addEventListener('click',()=>globalThis.CharacterWildCompanionUI?.open());
  host.querySelector('[data-open-wild-shape]')?.addEventListener('click',()=>globalThis.CharacterWildShapeUI?.open());
  host.querySelectorAll('[data-channel-effect]').forEach(select=>{const row=classRows.find(row=>row.id===select.dataset.channelEffect),button=host.querySelector('[data-channel-use="'+row.id+'"]'),refresh=()=>{const effect=row.channelEffects.find(effect=>effect.id===select.value);host.querySelector('[data-channel-detail="'+row.id+'"]').textContent=effect?.detail||'Choose the subclass in Character Builder before using its oath effect.';button.disabled=!effect||!row.remaining;};select.onchange=refresh;refresh();button.onclick=()=>{readSheetForm();const current=CharacterSheetModel.derive(sheetSession.data,sheetSession.identity.level,typeof sheetEquipmentLoot==='function'?sheetEquipmentLoot():[]);if(CharacterClassFeatureChoices.useChannelDivinity(sheetSession.data,row.id,select.value,{level:sheetSession.identity.level,mods:current.mods})){catalogChanged('Spent 1 Channel Divinity use. Resolve the selected effect at the table. Save to retain this use.');(host.querySelector('[data-channel-use="'+row.id+'"]:not(:disabled)')||host.querySelector('[data-channel-effect="'+row.id+'"]'))?.focus({preventScroll:true});}};});
  const arcaneRecover=host.querySelector('[data-arcane-recover]'),arcaneDay=host.querySelector('[data-arcane-new-day]');
  if(arcaneRecover){const plan=()=>Object.fromEntries([...host.querySelectorAll('[data-arcane-slot]')].map(input=>[input.dataset.arcaneSlot,Number(input.value)])),refreshArcane=()=>{const cost=arcane.slots.reduce((sum,row)=>sum+row.level*(plan()[row.id]||0),0);host.querySelector('[data-arcane-budget]').textContent=arcane.used?'Recovery used. '+(arcane.edition==='2024'?'Finish a Long Rest before using it again.':'Reset only when the next in-game day begins.'):arcane.slots.length?'Selected '+cost+' / '+arcane.budget+' slot levels. Choose the full recovery before applying.':'No eligible expended slots.';arcaneRecover.disabled=arcane.used||!cost||cost>arcane.budget;};host.querySelectorAll('[data-arcane-slot]').forEach(input=>input.onchange=refreshArcane);refreshArcane();arcaneRecover.onclick=()=>{const selected=plan();readSheetForm();const current=CharacterSheetModel.derive(sheetSession.data,sheetSession.identity.level,typeof sheetEquipmentLoot==='function'?sheetEquipmentLoot():[]);if(CharacterClassFeatureChoices.restoreArcaneSlots(sheetSession.data,selected,{level:sheetSession.identity.level,slotMax:current.effects.slotMax,pact:current.progression?.pact})){host.querySelectorAll('[data-arcane-slot]').forEach(input=>input.value='0');catalogChanged('Recovered the selected spell slots and used Arcane Recovery. Save to retain both changes.');host.querySelector('[data-arcane-options] > summary')?.focus({preventScroll:true});}};}
  if(arcaneDay)arcaneDay.onclick=()=>{readSheetForm();if(CharacterClassFeatureChoices.resetArcaneDay(sheetSession.data,{level:sheetSession.identity.level})){catalogChanged('Arcane Recovery is available for the new in-game day. Spell slots are unchanged. Save to retain this reset.');host.querySelector('[data-arcane-options] > summary')?.focus({preventScroll:true});}};
  const slotSelect=host.querySelector('[data-bard-slot]'),restore=host.querySelector('[data-bard-slot-recover]');
  if(slotSelect)slotSelect.onchange=()=>{restore.disabled=!(stats.classResources.find(row=>row.id==='bard-inspiration')?.used&&bardSlots.some(slot=>slot.value===slotSelect.value&&slot.available));};
  if(restore)restore.onclick=()=>{readSheetForm();const current=CharacterSheetModel.derive(sheetSession.data,sheetSession.identity.level,typeof sheetEquipmentLoot==='function'?sheetEquipmentLoot():[]),context={level:sheetSession.identity.level,mods:current.mods,slotMax:current.effects.slotMax,pact:current.progression?.pact};if(CharacterClassFeatureChoices.restoreBardFromSlot(sheetSession.data,slotSelect.value,context)){catalogChanged('Expended one spell slot and restored one Bardic Inspiration use. Save to keep both changes.');(host.querySelector('[data-bard-slot-recover]:not(:disabled)')||host.querySelector('[data-bard-slot]'))?.focus({preventScroll:true});}};
  host.querySelectorAll('[data-combat-feat]').forEach(button=>button.onclick=()=>changeFeatUse(button.dataset.combatFeat,Number(button.dataset.delta)));
  host.querySelectorAll('[data-combat-recover]').forEach(button=>button.onclick=()=>{readSheetForm();const current=CharacterSheetModel.derive(sheetSession.data,sheetSession.identity.level,typeof sheetEquipmentLoot==='function'?sheetEquipmentLoot():[]);const hadFamiliar=globalThis.CharacterWildCompanion?.state(sheetSession.data).alive;CharacterFeatRules.reset(sheetSession.data,button.dataset.combatRecover,{level:sheetSession.identity.level,mods:current.mods,classResources:current.classResources});catalogChanged('Feature uses reset.'+(hadFamiliar&&!globalThis.CharacterWildCompanion?.state(sheetSession.data).alive?' Wild Companion expired after Long Rest.':'')+' HP and spell slots are unchanged. Save to keep this change.');});
}
