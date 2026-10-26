function focusSheetBuildIssue(issue){
 if(!issue)return;
 const root=document.getElementById('characterSheetDialog');
 const tab=issue.tab||'builder';
 const page=root?.querySelector('#sheet-'+tab);
 const tabButton=root?.querySelector('[data-sheet-tab="'+tab+'"]');
 if(!page||!tabButton||tabButton.hidden){sheetStatus('This setup notice has no available destination. Please report it.');return;}
 selectSheetTab(tab);
 // Target only the active character sheet, never an unrelated or hidden form.
 let targets=[];
 try{if(issue.target)targets=[...page.querySelectorAll(issue.target)];}catch(error){console.warn('Invalid character warning target',issue.target,error);}
 let field=targets.find(el=>!el.disabled&&!el.hidden&&('value' in el)&&!el.value)||targets.find(el=>!el.disabled&&!el.hidden);
 if(!field){sheetStatus('Could not locate the setting for this notice. Please report it.');console.warn('Unresolved character warning',issue);return;}
 for(let node=field;node&&node!==root;node=node.parentElement){if(node.tagName==='DETAILS')node.open=true;if(node.hidden)node.hidden=false;}
 if(!['INPUT','SELECT','TEXTAREA','BUTTON'].includes(field.tagName))field=field.querySelector('select:not([disabled]),input:not([disabled]),button:not([disabled])')||field;
 field.scrollIntoView?.({block:'center',behavior:'smooth'});field.focus?.();field.classList.add('sheet-fix-target');
 setTimeout(()=>field.classList.remove('sheet-fix-target'),2500);
}
/* A display-only journal page. Editable fields remain in their dedicated tabs. */
function toggleCalculatedOverview(){
  if(!sheetSession)return;readSheetForm();
  sheetSession.data.adobe.showCalculatedOnOverview=!sheetSession.data.adobe.showCalculatedOnOverview;
  sheetSession.dirty=true;updateSheetCalculations();sheetStatus('Overview information updated. Save the sheet to keep it.');
}
function toggleClassFeatureOverview(key,part){
  if(!sheetSession)return;readSheetForm();
  const s=sheetSession,CP=CharacterClassProgression,d=CharacterSheetModel.derive(s.data,s.identity.level);
  if(!d.progression.classLevels.some(entry=>CP.unlocked(entry.classId,entry.level,entry.subclassId,s.data.build.edition).some(row=>CP.overviewKey(entry,row,s.data.build.edition)===key)))return;
  const current=CP.normalizeOverview(s.data.adobe.overviewFeatures)[key]||{enabled:false,showName:true,showDescription:false};
  if(part==='remove'){
    current.enabled=false;current.showName=false;current.showDescription=false;
  }
  else if(part==='enabled'){
    // Add/remove both pieces together; the individual controls remain independent.
    const addBoth=!(current.enabled&&current.showName&&current.showDescription);
    current.enabled=addBoth;current.showName=addBoth;current.showDescription=addBoth;
  }
  else if(['showName','showDescription'].includes(part)){
    // Disabled entries may retain legacy default flags; start with neither part visible.
    if(!current.enabled){current.showName=false;current.showDescription=false;}
    current[part]=!current[part];
    current.enabled=current.showName||current.showDescription;
  }
  else return;
  s.data.adobe.overviewFeatures[key]=current;s.dirty=true;updateSheetCalculations();sheetStatus('Class feature display updated. Save the sheet to keep it.');
}
function markUnfinishedCharacterFields(issues){
 const root=document.getElementById('characterSheetDialog');if(!root)return;
 root.querySelectorAll('.sheet-required-marker').forEach(marker=>marker.remove());
 root.querySelectorAll('.sheet-field-needs-attention').forEach(el=>el.classList.remove('sheet-field-needs-attention'));
 for(const issue of issues||[]){
   if(!issue.target||!issue.tab)continue;
   const page=root.querySelector('#sheet-'+issue.tab);if(!page)continue;
   let candidates=[];
   try{candidates=[...page.querySelectorAll(issue.target)];}catch(error){continue;}
   const field=candidates.find(el=>!el.disabled&&!el.hidden&&'value' in el&&!el.value)||candidates.find(el=>!el.disabled&&!el.hidden);
   if(!field)continue;
   const wrapper=field.closest('label')||field.closest('.sheet-field')||field.parentElement;
   if(!wrapper||wrapper.querySelector('.sheet-required-marker'))continue;
   wrapper.classList.add('sheet-field-needs-attention');
   const marker=document.createElement('span');marker.className='sheet-required-marker';marker.textContent='!';
   marker.title=issue.message;marker.setAttribute('aria-label','Needs attention: '+issue.message);
   wrapper.appendChild(marker);
 }
}
function renderCharacterOverview(d) {
  const s=sheetSession,host=document.getElementById('sheetOverviewReadout');if(!s||!host)return;
  const M=CharacterSheetModel,b=s.data.build,e=d.effects,esc=sheetEscape,sign=M.signed;
  const bg=CharacterBackgrounds.get(b.background);
  const metric=(label,value)=>`<div><span>${esc(label)}</span><strong>${esc(value)}</strong></div>`;
  const skills=Object.entries(M.skills).map(([key,[name,ability]])=>{
    const rank=Math.max(s.data.skills[key].rank,e.skills.includes(key)?1:0,d.feats.expertise.includes(key)?2:0,d.classExpertise?.skills.includes(key)?2:0,d.effects.halfSkillProficiency?.5:0);
    return `<div class="sheet-summary-skill"><span title="${rank===2?'Expertise':rank===1?'Proficient':rank===.5?'Half proficiency':'Not proficient'}">${rank===2?'◆':rank===1?'●':rank===.5?'◐':'○'}</span><span>${esc(name)} <small>${ability.toUpperCase()}</small></span><strong>${sign(d.skills[key])}</strong></div>`;
  }).join('');
  const attackRow=(name,hit,damage,range)=>`<tr><td>${esc(name)}</td><td>${esc(hit)}</td><td>${esc(damage)}</td><td>${esc(range)}</td></tr>`;
  const attacks=d.gear.attacks.filter(a=>a.equipped&&!s.data.actions.some(v=>v.kind==='loot'&&v.ref===a.id)).map(a=>attackRow(a.name,a.attack===null?'—':sign(a.attack),a.damage,a.range)).concat(s.data.attacks.map((a,i)=>attackRow(a.name,sign(d.attacks[i]),a.damage,a.range)));
  const featNames=[...new Set([...(e.originFeats||[]).filter(name=>!d.feats.reports.some(r=>r.def?.name===name)),...d.feats.reports.map(r=>r.def?.displayName||r.def?.name).filter(Boolean)])];
  const slotTotals=d.effects?.slotMax||[];
  const pact=d.progression?.pact;
  const showSlots=s.data.adobe?.showSpellSlotsOnOverview===true&&(slotTotals.some(Number)||pact?.count);
  const slotMarkup=showSlots?`<section class="sheet-summary-box sheet-overview-spell-slots"><div class="sheet-overview-slot-head"><div><span class="sheet-eyebrow">SPELLCASTING</span><h4>Spell slots</h4></div><small>Click a slot to mark it used or available</small></div><div class="sheet-overview-slot-grid">${slotTotals.map((max,i)=>{max=Number(max)||0;if(!max)return'';const used=Math.min(max,Number(s.data.slots[i]?.used)||0);return `<div class="sheet-overview-slot-level"><span>${i+1}<sup>${i===0?'st':i===1?'nd':i===2?'rd':'th'}</sup></span><div class="sheet-slot-orb-row">${Array.from({length:max},(_,j)=>`<button type="button" class="sheet-slot-orb" data-overview-slot-level="${i}" data-overview-slot-number="${j}" aria-label="Level ${i+1} spell slot ${j+1}, ${j<used?'used':'available'}" aria-pressed="${j<used}"></button>`).join('')}</div><small>${max-used}/${max}</small></div>`;}).join('')}</div>${pact?`<h4>Warlock · Pact Magic · Level ${pact.slotLevel}</h4><div class="sheet-slot-orb-row">${Array.from({length:pact.count},(_,j)=>`<button type="button" class="sheet-slot-orb" data-overview-pact-slot="${j}" aria-label="Warlock Pact Magic slot ${j+1}, ${j<pact.used?'used':'available'}" aria-pressed="${j<pact.used}"></button>`).join('')}</div><small>${pact.count-pact.used}/${pact.count} · Short or long rest recovery</small>`:''}</section>`:'';
  const featDescriptions=[...new Map(d.feats.reports.filter(report=>s.data.adobe.overviewFeatDescriptions.includes(report.id)).map(report=>[report.id,report])).values()];
  const featMarkup=featNames.length?`<div class="sheet-overview-feat-list">${featNames.map(name=>`<span>${esc(name)}</span>`).join('')}</div>`:'<p>No feats selected.</p>';
  const featDescriptionMarkup=featDescriptions.map(report=>`<article class="sheet-overview-feat-description"><div><strong>${esc(report.def.displayName||report.def.name)} · ${esc(report.def.edition)}</strong><button type="button" data-remove-feat-description="${esc(report.id)}">Remove description</button></div><p class="sheet-rule-text">${esc(featOverviewDescription(report.id))}</p></article>`).join('');
  const pinned=CharacterClassProgression.overviewFeatures(s.data,d.progression?.classLevels||[]);
  const classFeatureMarkup=pinned.length?`<section class="sheet-summary-box sheet-overview-class-features"><h4>Class features</h4>${pinned.map(row=>`<article class="sheet-overview-class-feature"><div>${row.showName?`<strong>${esc(row.name)}</strong>`:''}<small>${esc(CharacterAdobeEngine.className(row.classId))} · Level ${row.level}</small><button type="button" data-remove-overview-feature="${esc(row.key)}" aria-label="Remove ${esc(row.name)} from Overview">Remove</button></div>${row.showDescription?`<p class="sheet-rule-text">${esc(row.summary||'Feature information is being added to the catalogue.')}</p>`:''}${row.showDescription&&(row.action||row.recharge)?`<small>${[row.action,row.recharge].filter(Boolean).map(esc).join(' · ')}</small>`:''}</article>`).join('')}</section>`:'';
  const calculatedOpen=host.querySelector('#sheetOverviewCalculated')?.open===true;
  const calculatedMarkup=s.data.adobe?.showCalculatedOnOverview?`<section class="sheet-summary-box sheet-overview-calculated"><div class="sheet-overview-pin-heading"><details id="sheetOverviewCalculated" ${calculatedOpen?'open':''}><summary>Calculated from your choices · ${esc(b.edition)}</summary><div>${document.getElementById('sheetBuildSummaryContent')?.innerHTML||''}</div></details><button type="button" data-overview-calculated aria-pressed="true">Remove from Overview</button></div></section>`:'';
  const validation=globalThis.CharacterBuildValidation?.check?.(s.data,d,s.identity)||{complete:true,count:0,issues:[]};
  markUnfinishedCharacterFields(validation.issues);
  const warningKey=issue=>JSON.stringify([issue.category,issue.message,issue.tab]);
  const readWarnings=s.data.adobe.readBuildWarnings;
  const unread=validation.issues.filter(issue=>!readWarnings.includes(warningKey(issue))).length;
  const importantMarkup=!validation.complete?`<details class="sheet-overview-important" ${s.data.adobe.importantCollapsed?'':'open'} aria-label="Important character setup warnings"><summary><span>Character setup needs attention</span><strong>${unread} unread / ${validation.count} notices</strong></summary><div class="sheet-overview-important-list">${validation.issues.map((issue,i)=>`<div class="sheet-overview-important-row ${readWarnings.includes(warningKey(issue))?'sheet-warning-read':''}"><span class="sheet-overview-important-icon" aria-hidden="true">!</span><div><small>${esc(issue.category)}</small><p>${esc(issue.message)}</p></div><label class="sheet-warning-ack"><input type="checkbox" data-warning-read="${i}" ${readWarnings.includes(warningKey(issue))?'checked':''}>Read</label><button type="button" data-build-warning-index="${i}" data-build-warning-tab="${esc(issue.tab||'builder')}">Fix</button></div>`).join('')}</div></details>`:'';
  attacks.push(...d.actions.map((a,i)=>`<tr class="${a.available?'':'sheet-action-unavailable'}"><td><strong>${esc(a.name)}</strong><small>${esc(a.ability?a.ability.toUpperCase():'')}</small><div class="sheet-action-controls"><button type="button" data-edit-action="${i}">Edit</button><button type="button" data-remove-action="${i}">Remove</button></div><details><summary>Details</summary>${a.notes.map(n=>`<p>${esc(n)}</p>`).join('')}</details></td><td>${esc(a.hit)}</td><td>${esc(a.damage)}</td><td>${esc(a.range)}</td></tr>`));
  host.innerHTML=`<header class="sheet-summary-identity"><div><small>CHARACTER</small><h3>${esc(s.identity.name||'Unnamed adventurer')}</h3><p>${esc(s.identity.class||'Choose class')} · Level ${s.identity.level} · ${b.edition}</p></div><dl><div><dt>Species</dt><dd>${esc(e.race?.name||s.data.species||'—')}</dd></div><div><dt>Background</dt><dd>${esc(bg?.name||s.data.background||'—')}</dd></div><div><dt>Alignment</dt><dd>${esc(s.data.alignment||'—')}</dd></div><div><dt>Experience</dt><dd>${esc(s.data.experience||'—')}</dd></div></dl>${s.data.adobe.showPortraitOnOverview&&s.data.adobe.portrait?`<img class="sheet-overview-portrait" src="${esc(s.data.adobe.portrait)}" alt="Portrait of ${esc(s.identity.name||'your character')}">`:''}</header>
  ${importantMarkup}
  <div class="sheet-summary-columns"><aside class="sheet-summary-abilities">${Object.entries(M.abilities).map(([key,name])=>`<div class="sheet-summary-ability">${abilityEmblem(key)}<h4>${esc(name)}</h4><strong>${sign(d.mods[key])}</strong><span>${d.scores[key]}</span></div>`).join('')}</aside>
  <div class="sheet-summary-checks"><section class="sheet-summary-box"><h4>Saving throws</h4>${Object.entries(M.abilities).map(([key,name])=>`<div class="sheet-summary-skill"><span>${s.data.saves[key].proficient||e.saves.includes(key)?'●':'○'}</span><span>${name}</span><strong>${sign(d.saves[key])}</strong></div>`).join('')}${(d.saveTraining?.reports||[]).map(row=>`<p class="sheet-help" data-class-save-training="${row.id}"><strong>${esc(row.name)}:</strong> ${esc(row.detail)}</p>`).join('')}${d.paladinAuras?.available?`<p class="sheet-help" data-paladin-aura-readout>${esc(CharacterPaladinAuras.describe(d.paladinAuras))}</p>`:''}${d.deathSaveBonus?`<p class="sheet-help">Death saves: bonus ${sign(d.deathSaveBonus)}</p>`:''}</section><section class="sheet-summary-box"><h4>Skills</h4>${skills}${(d.classOrders?.reports||[]).map(row=>`<p class="sheet-help" data-class-order="${row.id}"><strong>${esc(row.name)} · ${esc(row.choice)}:</strong> ${esc(row.detail)}${row.skills.length?' Current check bonus +'+row.bonus+'.':''}</p>`).join('')}</section><section class="sheet-summary-box"><h4>Senses</h4><p>Passive perception <strong>${d.passive}</strong></p><p>Darkvision ${e.darkvision||0} ft</p>${(e.specialSenses||[]).map(sense=>`<p data-invocation-sense="${sense.id}"><strong>${esc(sense.name)}:</strong> ${esc(sense.detail)}</p>`).join('')}</section></div>
  <div class="sheet-summary-main"><section class="sheet-summary-metrics">${metric('Armor Class',d.ac)}${metric('Initiative',sign(d.initiative))}${metric('Proficiency',sign(d.pb))}${metric('HP',d.hpMax)}${metric('Speed',e.speed+' ft')}<button type="button" id="sheetOverviewInspiration" class="sheet-summary-toggle" aria-pressed="${s.data.inspiration}"><span>Inspiration</span><strong>${s.data.inspiration?'Yes':'—'}</strong></button>${metric('Spell save DC',d.spellDC)}${metric('Spell attack',sign(d.spellAttack))}</section>
  ${slotMarkup}
  ${classFeatureMarkup}${calculatedMarkup}
  <section class="sheet-summary-box"><h4>Armor & defenses</h4><p>${esc(d.gear.baseLabel)} ${d.gear.base} · shield ${d.gear.shield} · items ${sign(d.gear.bonus)} · Defense ${sign(d.gear.defense)} · adjustment ${sign(d.gear.adjustment)}</p><p><strong>Conditions:</strong> ${esc(s.data.conditions||'None recorded')}</p><p><strong>Resistances:</strong> ${esc([...e.resistances,s.data.resistances].filter(Boolean).join('; ')||'—')}</p><p><strong>Death saves:</strong> ${s.data.deathSuccess} successes / ${s.data.deathFailure} failures · <strong>Hit dice:</strong> ${esc(s.data.hitDice||'—')}</p></section>
  <section class="sheet-summary-box"><h4>Attacks & actions <button type="button" id="sheetOverviewAddAttack">+ Add attack</button></h4>${attackActionSummaryMarkup(d)}<div class="sheet-summary-table-wrap"><table><thead><tr><th>Weapon / action</th><th>To hit / save</th><th>Damage</th><th>Range</th></tr></thead><tbody>${attacks.join('')||'<tr><td colspan="4">Equip a looted weapon in Inventory or add an action in Combat.</td></tr>'}</tbody></table></div></section>
  <section class="sheet-summary-box"><h4>Proficiencies & languages</h4><p>${esc([...e.proficiencies,s.data.proficiencies].filter(Boolean).join(' · ')||'—')}</p><p>${esc([...e.languages,s.data.languages].filter(Boolean).join(' · ')||'—')}</p>${d.weaponTraining?.masteries.length?`<p><strong>Weapon Mastery:</strong> ${d.weaponTraining.masteries.map(v=>esc(v.name+' · '+v.property)).join('; ')}</p>`:''}${d.weaponTraining?.reports.length?'<button type="button" id="sheetOverviewWeaponTraining">Choose weapon training</button>':''}</section>
  ${d.cantripInvocations?.reports.length?`<section class="sheet-summary-box"><h4>Cantrip invocations</h4>${d.cantripInvocations.reports.map(row=>`<p><strong>${esc(row.name)}:</strong> ${esc(row.detail)}</p>`).join('')}${d.cantripInvocations.reports.some(row=>row.required)?'<button type="button" id="sheetOverviewCantripInvocations">Choose invocation cantrips</button>':''}</section>`:''}
  <section class="sheet-summary-box sheet-overview-feats"><h4>Feats</h4>${featMarkup}${featDescriptionMarkup}</section>
  ${d.invocationEffects?.reports.some(row=>!d.invocationEffects.senses.some(sense=>sense.id===row.id))?`<section class="sheet-summary-box"><h4>Invocation effects</h4>${d.invocationEffects.reports.filter(row=>!d.invocationEffects.senses.some(sense=>sense.id===row.id)).map(row=>`<p><strong>${esc(row.name)}:</strong> ${esc(row.detail)}</p>`).join('')}<p class="sheet-help">Sensory invocations appear in Senses. Choose invocations in Character Builder; effects follow your current Warlock level and rules edition.</p></section>`:''}<section class="sheet-summary-box"><h4>Features & resources</h4><p class="sheet-rule-text">${esc(s.data.resources||s.data.features||'Manage feature resources in Combat and feat choices on the Feats page.')}</p>${(d.classAbilityFeatures||[]).map(row=>`<p data-class-ability-feature="${row.id}"><strong>${esc(row.name)}:</strong> ${esc(row.abilities.map(key=>M.abilities[key]).join(' and '))} +${row.increase} · maximum ${row.max} · ${row.automatic?'included in Base scores':'reference only; entered totals already include bonuses'}</p>`).join('')}${(d.classResources||[]).map(row=>`<p><strong>${esc(row.name)}:</strong> ${row.unlimited?'Unlimited '+esc(row.unit):row.remaining+' / '+row.max+' '+esc(row.unit)}${row.die?' · '+esc(row.die):''}${Number.isFinite(row.bonus)?' · bonus '+CharacterSheetModel.signed(row.bonus):''} · ${esc(row.recovery)}${row.dc?' · Save DC '+row.dc:''}</p>`).join('')}${d.druidElementalFury?.available?`<p data-druid-elemental-fury><strong>Elemental Fury:</strong> ${esc(d.druidElementalFury.detail)}</p>`:""}${(d.rangerFeatures?.reports||[]).map(row=>`<p data-ranger-feature="${row.id}"><strong>${esc(row.name)}:</strong> ${esc(row.detail)}</p>`).join('')}${d.feats.reports.filter(r=>CharacterFeatRules.resource(r.def,s.identity.level)).map(r=>{const v=CharacterFeatRules.resource(r.def,s.identity.level);return `<p>${esc(r.def.name)}: ${Math.max(0,v.max-r.choice.used)} / ${v.max}</p>`;}).join('')}</section></div></div><p class="sheet-help">HP shows maximum hit points only. Inspiration can be toggled here. Add or edit attacks here; edit other values in their dedicated tabs.</p>`;
 const important=host.querySelector('.sheet-overview-important');
 if(important)important.ontoggle=()=>{if(sheetSession===s&&important.isConnected){const collapsed=!important.open;if(s.data.adobe.importantCollapsed!==collapsed){s.data.adobe.importantCollapsed=collapsed;s.dirty=true;}}};
 host.querySelectorAll('[data-warning-read]').forEach(input=>input.onchange=()=>{readSheetForm();const key=warningKey(validation.issues[Number(input.dataset.warningRead)]);s.data.adobe.readBuildWarnings=s.data.adobe.readBuildWarnings.filter(v=>v!==key);if(input.checked)s.data.adobe.readBuildWarnings.push(key);s.dirty=true;updateSheetCalculations();sheetStatus('Notice updated. Save the sheet to keep it.');});
 host.querySelectorAll('[data-build-warning-tab]').forEach(button=>button.onclick=()=>{focusSheetBuildIssue(validation.issues[Number(button.dataset.buildWarningIndex)]);});
 const weaponTraining=document.getElementById('sheetOverviewWeaponTraining');if(weaponTraining)weaponTraining.onclick=()=>{selectSheetTab('skills');document.querySelector('[data-weapon-training]')?.focus();};
 const invocationButton=document.getElementById('sheetOverviewCantripInvocations');if(invocationButton)invocationButton.onclick=()=>{selectSheetTab('builder');const target=d.cantripInvocations.reports.find(row=>row.required&&!row.valid)||d.cantripInvocations.reports.find(row=>row.required);if(target)[...document.querySelectorAll('[data-invocation-cantrip]')].find(node=>node.dataset.invocationCantrip===target.key&&Number(node.dataset.invocationSlot)===target.slot)?.focus();};
 const inspiration=document.getElementById('sheetOverviewInspiration');if(inspiration)inspiration.onclick=()=>{readSheetForm();s.data.inspiration=!s.data.inspiration;const input=document.querySelector('[name="inspiration"]');if(input)input.checked=s.data.inspiration;s.dirty=true;updateSheetCalculations();sheetStatus('Inspiration updated. Save the character sheet to keep it.');};
  host.querySelectorAll('[data-overview-pact-slot]').forEach(button=>button.onclick=()=>{readSheetForm();const j=Number(button.dataset.overviewPactSlot),used=s.data.adobe.pactSlotsUsed;s.data.adobe.pactSlotsUsed=j<used?j:j+1;s.dirty=true;updateSheetCalculations();sheetStatus('Pact Magic slot use changed. Save to keep it.');});
  host.querySelectorAll('[data-overview-slot-level]').forEach(button=>button.onclick=()=>{readSheetForm();const i=Number(button.dataset.overviewSlotLevel),j=Number(button.dataset.overviewSlotNumber),slot=s.data.slots[i],max=Number(d.effects?.slotMax?.[i])||0;if(!slot)return;slot.used=Math.max(0,Math.min(max,j<(Number(slot.used)||0)?j:j+1));s.dirty=true;updateSheetCalculations();sheetStatus('Spell slot use changed. Save to keep it.');});
 host.querySelectorAll('[data-remove-feat-description]').forEach(button=>button.onclick=()=>toggleFeatOverviewDescription(button.dataset.removeFeatDescription));
 bindOverviewAttacks();
 host.querySelector('[data-overview-calculated]')?.addEventListener('click',toggleCalculatedOverview);
 host.querySelectorAll('[data-remove-overview-feature]').forEach(button=>button.onclick=()=>toggleClassFeatureOverview(button.dataset.removeOverviewFeature,'remove'));
}
function closeSpellInformation(){const d=document.getElementById('sheetSpellInformation');if(d){if(d.open)d.close();d.remove();}}
function openSpellInformation({catalogId='',index=null}={}) {
  if(!sheetSession)return;readSheetForm();
  const row=index===null?null:sheetSession.data.spells[index],spell=CharacterCatalog.find(catalogId||row?.catalogId);
  if(!row&&!spell)return;
  closeSpellInformation();const d=document.createElement('dialog');d.id='sheetSpellInformation';d.className='vault-dialog sheet-spell-information';d.setAttribute('aria-labelledby','sheetSpellInformationTitle');
  const esc=sheetEscape,title=spell?spell.name+' · '+spell.edition:row.name;
  const description=spell?.description||row?.notes||'This catalogue entry contains a source reference only. Consult the listed book for complete spell effects.';
  const mark=CharacterClassFeatureChoices.huntersMarkEffect(sheetSession.data,spell,{level:sheetSession.identity.level,classId:row?.classId||''});
  d.innerHTML=`<header><h2 id="sheetSpellInformationTitle">${esc(title)}</h2><button type="button" aria-label="Close spell information">Close</button></header><div class="sheet-spell-facts">${[['Level',spell?.level??row?.level],['School',spell?.school],['Casting',spell?.casting||row?.casting],['Range',spell?.range||row?.range],['Components',spell?.components||row?.components],['Duration',spell?.duration||row?.duration]].filter(([,v])=>v!==undefined&&v!=='').map(([k,v])=>`<p><strong>${k}:</strong> ${esc(v)}</p>`).join('')}</div><div class="sheet-rule-text">${esc(description)}</div>${mark?`<p class="sheet-help" data-class-spell-effect>${esc([mark.detail,...mark.notes].join(' '))}</p>`:''}${spell?`<p class="sheet-help">${esc(spell.book)} · p. ${spell.page}${spell.license?' · '+esc(spell.license):' · Source reference'}</p>`:''}${spell&&row?.notes&&row.notes!==CharacterCatalog.spellRow(spell).notes?`<details><summary>Your saved notes</summary><p class="sheet-rule-text">${esc(row.notes)}</p></details>`:''}`;
  document.body.appendChild(d);d.querySelector('button').onclick=closeSpellInformation;d.addEventListener('click',event=>{if(event.target===d)closeSpellInformation();});d.showModal();d.querySelector('button').focus();
}
function moveOriginFeatControls() {
 const form=document.getElementById('characterSheetForm'),host=document.getElementById('sheetBuildControls');
 for(const name of ['build.backgroundFeat','build.humanOriginFeat','build.raceFeat',...[0,1,2].flatMap(i=>[`build.backgroundFeatChoices.${i}`,`build.humanFeatChoices.${i}`])]){
  const label=form.querySelector(`[name="${name}"]`)?.closest('label');
  if(label){label.hidden=true;label.dataset.featCatalogueManaged='true';}
 }
 let note=document.getElementById('sheetBuilderFeatNotice');
 if(!note){
  note=document.createElement('section');
  note.id='sheetBuilderFeatNotice';
  note.className='sheet-editor-box sheet-builder-feat-notice';
  note.innerHTML='<div><span class="sheet-eyebrow">FEAT CHOICES</span><h4>Choose feats on the Feats page</h4><p>Your background, species and level progression determine when you receive a feat. The actual feat selection and feat-specific choices are now kept together in the Feat catalogue.</p></div><button type="button" data-open-feat-page>Open Feats</button>';
  host.append(note);
  note.querySelector('[data-open-feat-page]').onclick=()=>document.querySelector('[data-sheet-tab="feats"]')?.click();
 }
}
function updateBackgroundControls(d) {
 const b=sheetSession.data.build,bg=CharacterBackgrounds.get(b.background),form=document.getElementById('characterSheetForm'),R=CharacterRules;
 const active=bg&&!(b.edition==='2014'&&bg.edition==='2024');
 let count=active?Number(bg.languages||0):0;
 for(let i=0;i<2;i++){
  const input=form.querySelector(`[name="build.backgroundTools.${i}"]`),kind=active?(bg.toolChoices||[])[i]:null;
  const options=CharacterBackgrounds.toolOptions(kind,R);input.closest('label').hidden=!kind;
  for(const option of input.querySelectorAll('option'))option.disabled=!!option.value&&!options.includes(option.value);
  if(kind==='merchant'&&b.backgroundTools[i]==='Additional language')count++;
  const replacement=form.querySelector(`[name="build.backgroundReplacementSkills.${i}"]`);replacement.closest('label').hidden=!active||!d.effects.backgroundDuplicates?.includes(i);
 }
 document.getElementById('sheetBackgroundChoices').hidden=!count;
 for(let i=0;i<2;i++)form.querySelector(`[name="build.backgroundLanguages.${i}"]`).closest('label').hidden=i>=count;
 const summary=document.getElementById('sheetBackgroundSummary');
 if(bg){
  const fixedSkills=(bg.skills||[]).map(k=>CharacterSheetModel.skills[k]?.[0]||k);
  const optionalSkills=(bg.skillOptions||[]).map(k=>CharacterSheetModel.skills[k]?.[0]||k);
  const skillText=[fixedSkills.join(', '),optionalSkills.length?`choose ${bg.skillChoiceCount||1} from ${optionalSkills.join(', ')}`:''].filter(Boolean).join(' · ')||'Source/manual';
  const toolText=[...(bg.fixedTools||[]).map(t=>CharacterBackgrounds.toolName(t,R.tools)),...(bg.toolChoices||[]).map(t=>({anyArtisansTool:'Choose one artisan tool',anyMusicalInstrument:'Choose one musical instrument',anyGamingSet:'Choose one gaming set',merchant:'Choose artisan/navigator tools or one extra language'}[t]||t))].join(', ')||'Source/manual';
  const source=CharacterBackgrounds.sourceName(bg),ref=bg.page?`${source}, p. ${bg.page}`:source;
  let mechanics='';
  if(bg.edition==='2024'){
   mechanics=bg.abilities?.length
    ?`<p><strong>Ability increases:</strong> +2/+1 or +1/+1/+1 among ${bg.abilities.map(k=>CharacterSheetModel.abilities[k]).join(', ')}; capped at 20 in Base mode.</p>`
    :'<p><strong>Ability increases:</strong> this expanded 2024 background is selectable, but its source-specific ability list is not automated yet; choose the source-legal abilities in Character builder.</p>';
   if(bg.featChoices?.length){const selected=b.backgroundFeat;mechanics+=`<p><strong>Origin feat:</strong> choose ${sheetEscape(bg.featLabel||bg.featChoices.join(' or '))} on the Feats page.${selected?' Selected: <strong>'+sheetEscape(selected)+'</strong>.':''}</p>`;}else mechanics+=bg.feat?`<p><strong>Origin feat:</strong> ${sheetEscape(bg.feat)}${bg.fixedFeat?' (fixed by this background)':''}. ${R.modern.originFeats.includes(bg.feat)?'Supported effects apply automatically where implemented.':'Source-specific feat effects are shown on the Feats page; automated effects apply where an adapter exists.'}</p>`:'<p><strong>Origin feat:</strong> choose the source-legal feat on the Feats page.</p>';
  }else{
   mechanics=bg.feature?`<p><strong>Feature:</strong> ${sheetEscape(bg.feature)}. Narrative/source-specific benefits require DM agreement. No background ability increase or Origin feat under 2014 rules.</p>`:'<p><strong>Background feature:</strong> consult the listed source for remaining source-specific details.</p>';
  }
  summary.innerHTML=`<h4>${sheetEscape(bg.name)} · ${sheetEscape(bg.edition)} · ${sheetEscape(source)}</h4><p><strong>Skills:</strong> ${sheetEscape(skillText)}</p><p><strong>Tools:</strong> ${sheetEscape(toolText)}</p><p><strong>Additional languages:</strong> ${count}</p>${mechanics}<p class="sheet-help">${sheetEscape(ref)}. Factual options are loaded into the builder; source-specific prose, equipment and mechanics not represented by the rules engine remain manual. Starting equipment is not added to campaign loot automatically.</p>`;
 }else summary.innerHTML='<p>Custom background: record skills and tools in Abilities & skills / Combat notes. Under 2024 rules, select ability increases here and choose the Origin feat on the Feats page.</p>';
 form.querySelectorAll('[data-feat-catalogue-managed="true"]').forEach(label=>label.hidden=true);
}
function refineCharacterBuilder() {
 const root=document.getElementById('sheetBuildControls');
 const group=(title,nodes)=>{const section=document.createElement('section');section.className='sheet-builder-group sheet-editor-box';const heading=document.createElement('h4');heading.textContent=title;section.appendChild(heading);for(const node of nodes)if(node)section.appendChild(node);root.appendChild(section);return section;};
 const grids=[...root.children];
 group('Rules & character',[grids.find(n=>n.classList.contains('sheet-grid')),document.getElementById('sheetManualIdentity')]);
 const race=group('Species & ancestry choices',[...root.querySelectorAll(':scope > [data-build-for]'),document.getElementById('sheetRaceChoices')]);race.id='sheetSpeciesEditorGroup';
 group('Class training',[document.getElementById('sheetClassSkills')]);
 group('Background & ability increases',[document.getElementById('sheetModernOrigin'),document.getElementById('sheetBackgroundSummary'),document.getElementById('sheetBackgroundTraining'),document.getElementById('sheetBackgroundChoices')]);
 const summary=document.getElementById('sheetBuildSummary');summary.classList.add('sheet-build-information');
 document.getElementById('sheetBuildOverviewToggle').onclick=toggleCalculatedOverview;
}
function skillAutomaticRank(d,key){return Math.max(d.effects.skills.includes(key)?1:0,d.feats.expertise.includes(key)?2:0,d.classExpertise?.skills.includes(key)?2:0,d.effects.halfSkillProficiency?.5:0);}
function bindSkillOrbs() {
 document.querySelectorAll('[data-skill][data-rank]').forEach(button=>button.onclick=()=>{
  readSheetForm();const s=sheetSession,key=button.dataset.skill,rank=Number(button.dataset.rank);
  const d=CharacterSheetModel.derive(s.data,s.identity.level),automatic=skillAutomaticRank(d,key);
  if(rank<automatic||rank===automatic&&s.data.skills[key].rank<=automatic)return;
  s.data.skills[key].rank=s.data.skills[key].rank===rank?0:rank;
  document.querySelector(`[name="skills.${key}.rank"]`).value=s.data.skills[key].rank;
  s.dirty=true;updateSheetCalculations();sheetStatus('Unsaved skill training change');
 });
}
function renderToolTraining(d){
 let host=document.getElementById('sheetToolTraining'),anchor=document.getElementById('sheetClassExpertise')?.parentElement;
 if(!host&&anchor){host=document.createElement('section');host.id='sheetToolTraining';host.className='sheet-editor-box';anchor.after(host);}if(!host)return;
 const focusId=document.activeElement?.dataset.toolAbility,training=d.toolTraining||{tools:[]};host.hidden=!training.tools.length;if(host.hidden){host.innerHTML='';return;}
 host.innerHTML='<h4>Artificer tool checks</h4><p class="sheet-help">Choose the ability the DM calls for. Your proficiency contribution is automatic; Tool Expertise doubles it once from Artificer level 6. This does not roll a die or add bonuses from temporary effects.</p><div class="sheet-grid">'+training.tools.map(tool=>'<label class="sheet-field"><span>'+sheetEscape(tool.name)+(tool.expertise?' · Expertise':'')+'</span><select data-tool-ability="'+tool.id+'"><option value="">Choose check ability</option>'+Object.entries(CharacterSheetModel.abilities).map(([id,name])=>'<option value="'+id+'" '+(id===tool.ability?'selected':'')+'>'+name+'</option>').join('')+'</select><small>Proficiency '+CharacterSheetModel.signed(tool.bonus)+'</small><output data-tool-total="'+tool.id+'">'+(tool.total===null?'Choose ability':'Check bonus '+CharacterSheetModel.signed(tool.total))+'</output></label>').join('')+'</div>';
 host.querySelectorAll('[data-tool-ability]').forEach(select=>select.onchange=()=>{readSheetForm();const context={level:sheetSession.identity.level,effects:d.effects,mods:d.mods,classExpertise:d.classExpertise};if(!CharacterClassFeatureChoices.setToolAbility(sheetSession.data,select.dataset.toolAbility,select.value,context))return sheetStatus('This tool is no longer proficient for this character.',true);sheetSession.dirty=true;updateSheetCalculations();sheetStatus('Tool check updated. Save the sheet to keep it.');});
 if(focusId)[...host.querySelectorAll('[data-tool-ability]')].find(control=>control.dataset.toolAbility===focusId)?.focus({preventScroll:true});
}
function renderClassExpertise(d){
 renderToolTraining(d);
 const host=document.getElementById('sheetClassExpertise'),s=sheetSession;if(!host||!s)return;
 const result=d.classExpertise||{reports:[],tools:[],reminders:[]},focus=document.activeElement?.closest('[data-class-expertise]'),focusKey=focus?.dataset.classExpertise,focusSlot=focus?.dataset.expertiseSlot;
 const label=option=>option.skill?CharacterSheetModel.skills[option.skill]?.[0]||option.skill:option.tool;
 host.innerHTML=result.reports.length||result.reminders.length?`<section class="sheet-class-expertise" aria-label="Class Expertise choices"><h4>Class Expertise</h4><p>Choose from your proficient skills. Totals and Expertise circles update automatically. Existing manual markings are kept; Expertise never stacks.</p>${result.reports.map(group=>`<section class="sheet-expertise-source"><strong>${sheetEscape(group.className)} · ${sheetEscape(group.name)} · Level ${group.level}</strong><p class="sheet-help" data-expertise-progress="${group.key}">${group.allowed-group.missing} of ${group.allowed} chosen${group.missing?' · '+group.missing+' remaining':''}${group.overflow?' · Review saved choices from a higher level':''}</p><div class="sheet-grid">${group.slots.map((slot,index)=>`<label><span>${sheetEscape(group.className)} ${sheetEscape(group.name)} choice ${index+1}</span><select data-class-expertise="${group.key}" data-expertise-slot="${index}" ${s.saving?'disabled':''}><option value="">Choose proficiency</option>${slot.value&&!group.options.some(o=>o.id===slot.value)?`<option value="${sheetEscape(slot.value)}" selected>Saved choice · unavailable</option>`:''}${group.options.map(option=>{const duplicate=group.slots.some((other,i)=>i!==index&&other.valid&&other.value===option.id),reason=duplicate?'Already selected':option.reason;return `<option value="${option.id}" ${slot.value===option.id?'selected':''} ${!option.eligible||duplicate?'disabled':''}>${sheetEscape(label(option))}${reason?' · '+sheetEscape(reason):''}</option>`;}).join('')}</select></label>`).join('')}</div></section>`).join('')}${result.tools.map(tool=>`<p class="sheet-expertise-tool"><strong>${sheetEscape(tool.name)}:</strong> proficiency contribution ${CharacterSheetModel.signed(tool.bonus)}. Add the ability modifier for the tool check.</p>`).join('')}${result.reminders.map(text=>`<p class="sheet-help sheet-expertise-reminder">${sheetEscape(text)}</p>`).join('')}</section>`:'';
 host.querySelectorAll('[data-class-expertise]').forEach(select=>select.onchange=()=>{
  readSheetForm();const active=sheetSession;if(active!==s||s.saving)return;
  const context={level:d.progression?.targetLevel||s.identity.level,effects:d.effects,feats:d.feats};
  if(!CharacterClassFeatureChoices.setExpertise(s.data,select.dataset.classExpertise,Number(select.dataset.expertiseSlot),select.value,context)){sheetStatus('Choose a different proficiency that qualifies for this Expertise feature.',true);renderClassExpertise(d);return;}
  s.dirty=true;updateSheetCalculations();sheetStatus('Expertise updated. Save your character to keep it.');
 });
 if(focusKey)[...host.querySelectorAll('[data-class-expertise]')].find(node=>node.dataset.classExpertise===focusKey&&node.dataset.expertiseSlot===focusSlot)?.focus({preventScroll:true});
}
function renderWeaponTraining(d){
 const host=document.getElementById('sheetWeaponTraining'),s=sheetSession;if(!host||!s)return;
 const training=d.weaponTraining||{reports:[]},focus=document.activeElement?.closest('[data-weapon-training]'),key=focus?.dataset.weaponTraining,slot=focus?.dataset.weaponSlot;
 host.innerHTML=training.reports.length?`<section class="sheet-class-expertise sheet-weapon-training" aria-label="Weapon training and mastery"><h4>Weapon training & mastery</h4><p>Choose the weapon kinds granted by your class or feat. Weapon Mastery unlocks a weapon’s special property; it does not grant weapon proficiency. Changes are saved with your character.</p>${training.reports.map(group=>`<section class="sheet-expertise-source"><h5>${sheetEscape(group.name)}</h5><p class="sheet-help">${group.allowed-group.missing} of ${group.allowed} chosen${group.missing?' · '+group.missing+' remaining':''}${group.overflow?' · Review saved choices from a higher level':''}</p><div class="sheet-grid">${group.slots.map((selected,index)=>`<label class="sheet-field"><span>${sheetEscape(group.name)} · weapon ${index+1}</span><select data-weapon-training="${group.key}" data-weapon-slot="${index}" ${s.saving?'disabled':''}><option value="">Choose weapon kind</option>${selected.value&&!group.options.some(o=>o.id===selected.value)?`<option value="${sheetEscape(selected.value)}" selected>Saved choice · unavailable</option>`:''}${group.options.map(option=>{const duplicate=group.slots.some((v,i)=>i!==index&&v.valid&&v.value===option.id),reason=duplicate?'Already selected':option.reason;return `<option value="${option.id}" ${selected.value===option.id?'selected':''} ${!option.eligible||duplicate?'disabled':''}>${sheetEscape(option.name)}${option.property?' · '+sheetEscape(option.property):''}${reason?' · '+sheetEscape(reason):''}</option>`;}).join('')}</select>${selected.valid&&group.kind==='mastery'?`<small>${sheetEscape(CharacterClassFeatureChoices.masteryHelp[group.options.find(o=>o.id===selected.value)?.property]||'Resolve this property at the table.')}</small>`:''}</label>`).join('')}</div></section>`).join('')}<p class="sheet-help">Class and feat allowances use their own rules and levels. Replace choices when your rules allow, usually after a Long Rest. Mastery effects are reminders; attacks and target conditions are resolved at the table.</p></section>`:'';
 host.querySelectorAll('[data-weapon-training]').forEach(control=>control.onchange=()=>{
  readSheetForm();if(sheetSession!==s||s.saving)return;
  const context={level:d.progression?.targetLevel||s.identity.level,effects:{...d.effects,proficiencies:d.weaponTraining.baseProficiencies},feats:d.feats};
  if(!CharacterClassFeatureChoices.setWeaponTraining(s.data,control.dataset.weaponTraining,Number(control.dataset.weaponSlot),control.value,context)){sheetStatus('Choose a different eligible weapon. Existing choices must still qualify.',true);renderWeaponTraining(d);return;}
  s.dirty=true;updateSheetCalculations();sheetStatus('Weapon training updated. Save your character to keep it.');
 });
 if(key)[...host.querySelectorAll('[data-weapon-training]')].find(n=>n.dataset.weaponTraining===key&&n.dataset.weaponSlot===slot)?.focus({preventScroll:true});
}
function updateAbilityAndSkillControls(d) {
 const s=sheetSession,base=s.data.build.scoreMode==='base',M=CharacterSheetModel;
 for(const key of Object.keys(M.abilities)){
  const input=document.querySelector(`[name="abilities.${key}"]`),score=document.querySelector(`[data-ability-score="${key}"]`),detail=document.querySelector(`[data-ability-breakdown="${key}"]`);
  if(!input||!score)continue;
  input.closest('label').querySelector('span').textContent=base?'Base score':'Entered total';score.textContent=d.scores[key];
  const origin=base?Math.min(d.effects.asi[key]||0,Math.max(0,20-s.data.abilities[key])):0;
  const feat=base?d.scores[key]-s.data.abilities[key]-origin:0;
  const source=s.data.build.edition==='2024'?'background':'race';
  const originName=s.data.build.edition==='2024'?CharacterRules.modern.backgrounds[s.data.build.background]?.name:d.effects.race?.name;
  const sources=d.feats.reports.filter(r=>r.abilityIncreases?.[key]).map(r=>`${r.def.name} (${r.def.edition}) ${M.signed(base?r.appliedAbilityIncreases[key]||0:r.abilityIncreases[key])}${base&&r.appliedAbilityIncreases[key]<r.abilityIncreases[key]?' · capped':''}${base?'':' · reference only'}`);
  sources.push(...(d.classAbilityFeatures||[]).filter(row=>row.abilities.includes(key)).map(row=>row.name+' ('+row.edition+') '+M.signed(base?row.appliedAbilityIncreases[key]:row.increase)+' · maximum '+row.max+(base&&row.appliedAbilityIncreases[key]<row.increase?' · capped':'')+(base?'':' · reference only')));
  detail.innerHTML=`<span>${s.data.abilities[key]} ${base?'base':'entered total'}</span><span>${sheetEscape(source+(originName?' · '+originName:''))} ${M.signed(base?origin:d.effects.asi[key]||0)}${base?'':' · reference only'}</span>${sources.map(v=>`<span>${sheetEscape(v)}</span>`).join('')}<strong>Final score ${d.scores[key]}</strong>`;

 }
 const notice=document.getElementById('sheetScoreModeNotice');
 notice.innerHTML=base?'Automatic scores: enter your scores before bonuses below. The large numbers include valid race/background and feat increases, with their limits applied.':'Final totals mode: your entered scores already include bonuses. To calculate them automatically, select Base scores / HP below and enter scores before bonuses.';
 renderPointBuySummary(d);
 renderClassExpertise(d);
 const halfNotice=document.getElementById('sheetClassTrainingNotice');if(halfNotice){halfNotice.hidden=!d.effects.halfSkillProficiency;halfNotice.textContent=d.effects.halfSkillProficiency?'Jack of All Trades: untrained skill checks include half proficiency ('+Math.floor(d.pb/2)+'), rounded down. Proficient and Expertise skills keep their higher bonus. '+(s.data.build.edition==='2014'?'Initiative also includes this benefit unless proficiency is already included. Apply it manually to other eligible untrained ability/tool checks.':'Under 2024 rules this applies to skill checks, not initiative or other ability checks.'):'';}
 renderWeaponTraining(d);
 for(const key of Object.keys(M.skills)){
  const automatic=skillAutomaticRank(d,key),manual=s.data.skills[key].rank,effective=Math.max(automatic,manual);
  const source=document.querySelector(`[data-skill-source="${key}"]`);if(source){source.textContent=d.classExpertise?.skills.includes(key)?' · Class Expertise':effective===.5&&d.effects.halfSkillProficiency?' · Jack of All Trades':d.invocationEffects?.skills.includes(key)?' · Beguiling Influence':automatic>=1?' · Auto':'';source.textContent+=(d.classOrders?.reports||[]).filter(row=>row.skills.includes(key)).map(row=>' · '+row.choice+' +'+row.bonus).join('');source.title=automatic?'Automatic class, builder or feat training. Half proficiency from Jack of All Trades is rounded down and never stacks with trained skills.':'';}
  document.querySelectorAll(`[data-skill="${key}"]`).forEach(button=>{
   const rank=Number(button.dataset.rank);button.setAttribute('aria-pressed',String(rank===effective));
   button.disabled=rank<automatic||rank===automatic&&manual<=automatic;
   button.classList.toggle('sheet-orb-automatic',rank===automatic&&automatic>0);
   button.title=button.disabled?'Granted training cannot be reduced here. Edit its source in Class Expertise, Character builder or Feats.':rank===manual?'Click to remove your manual training choice.':'Set '+({0.5:'half proficiency',1:'proficiency',2:'expertise'}[rank]);
  });
 }
 const group=document.getElementById('sheetSpeciesEditorGroup');
 if(group){group.hidden=false;group.hidden=![...group.querySelectorAll('input,select')].some(input=>{const hidden=input.closest('[hidden]');return !hidden||!group.contains(hidden);});}
}

function abilityEmblem(key){
 const paths={
 str:'M12 33l5-14 5-3 5 3-1 6 7 2 4-7 4 4-1 12c-8 6-20 7-28-3Z M18 20l-4-5 2-6 8-1 3 5-5 3 M27 25c-6-3-10 0-10 4',
 dex:'M12 37L34 11c9 1 6 10 2 13L20 35Z M16 32l10-1 M22 25l10-1 M27 19l9-1 M10 40l7-8',
 con:'M24 38S7 28 7 17c0-10 13-12 17-3 4-9 17-7 17 3 0 11-17 21-17 21Z M12 24h7l3-8 4 15 3-7h7',
 int:'M24 13c-6-4-12-5-18-3v26c7-2 12-1 18 3 6-4 11-5 18-3V10c-6-2-12-1-18 3v26 M11 17l8 2 M11 23l8 2 M29 19l8-2 M29 25l8-2',
 wis:'M5 24c10-16 28-16 38 0-10 16-28 16-38 0Z M30 24a6 6 0 1 1-12 0 6 6 0 0 1 12 0 M24 5v5 M9 10l4 5 M39 10l-4 5',
 cha:'M24 5l5 12 14 2-10 9 3 14-12-7-12 7 3-14-10-9 14-2Z M24 16v12 M20 23h8'
 };
 return `<svg class="sheet-ability-emblem" viewBox="0 0 48 48" aria-hidden="true" focusable="false"><path d="${paths[key]||paths.cha}"/></svg>`;
}
function renderPointBuySummary(d){
 const host=document.getElementById('sheetPointBuySummary'),s=sheetSession;if(!host||!s)return;
 const enabled=s.data.build.scoreMethod==='pointBuy',p=CharacterSheetModel.pointBuy(s.data.abilities);
 host.innerHTML=enabled?`<div class="sheet-point-metrics"><div class="${p.valid?'':'sheet-point-invalid'}"><small>Point-buy spent</small><strong>${p.invalid.length?'—':p.spent} <em>/ 27</em></strong></div><div><small>Points remaining</small><strong>${p.invalid.length?'—':p.remaining}</strong></div></div><progress max="27" value="${Math.min(27,p.spent)}" aria-label="Point-buy points spent"></progress><p class="sheet-help">Point costs: 8 → 0 · 9 → 1 · 10 → 2 · 11 → 3 · 12 → 4 · 13 → 5 · 14 → 7 · 15 → 9. Bonuses are added afterward.</p>${p.invalid.length?'<p class="sheet-build-warning">Point buy requires base scores from 8 to 15.</p>':p.spent>27?'<p class="sheet-build-warning">'+(p.spent-27)+' points over budget.</p>':''}`:'<p class="sheet-help">Enter your rolled base scores. Species, background and feat bonuses are added automatically.</p>';

}
