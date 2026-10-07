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
  if(part==='enabled'){current.enabled=!current.enabled;if(current.enabled&&!current.showName&&!current.showDescription)current.showName=true;}
  else if(['showName','showDescription'].includes(part)){if(!current.enabled){current.showName=false;current.showDescription=false;}current[part]=!current[part];current.enabled=current.showName||current.showDescription;}
  else return;
  s.data.adobe.overviewFeatures[key]=current;s.dirty=true;updateSheetCalculations();sheetStatus('Class feature display updated. Save the sheet to keep it.');
}
function renderCharacterOverview(d) {
  const s=sheetSession,host=document.getElementById('sheetOverviewReadout');if(!s||!host)return;
  const M=CharacterSheetModel,b=s.data.build,e=d.effects,esc=sheetEscape,sign=M.signed;
  const bg=CharacterBackgrounds.get(b.background);
  const metric=(label,value)=>`<div><span>${esc(label)}</span><strong>${esc(value)}</strong></div>`;
  const skills=Object.entries(M.skills).map(([key,[name,ability]])=>{
    const rank=Math.max(s.data.skills[key].rank,e.skills.includes(key)?1:0,d.feats.expertise.includes(key)?2:0);
    return `<div class="sheet-summary-skill"><span title="${rank===2?'Expertise':rank===1?'Proficient':rank===.5?'Half proficiency':'Not proficient'}">${rank===2?'◆':rank===1?'●':rank===.5?'◐':'○'}</span><span>${esc(name)} <small>${ability.toUpperCase()}</small></span><strong>${sign(d.skills[key])}</strong></div>`;
  }).join('');
  const attackRow=(name,hit,damage,range)=>`<tr><td>${esc(name)}</td><td>${esc(hit)}</td><td>${esc(damage)}</td><td>${esc(range)}</td></tr>`;
  const attacks=d.gear.attacks.filter(a=>a.equipped&&!s.data.actions.some(v=>v.kind==='loot'&&v.ref===a.id)).map(a=>attackRow(a.name,a.attack===null?'—':sign(a.attack),a.damage,a.range)).concat(s.data.attacks.map((a,i)=>attackRow(a.name,sign(d.attacks[i]),a.damage,a.range)));
  const featNames=[...new Set([...(e.originFeats||[]),...d.feats.reports.map(r=>r.def?.name).filter(Boolean)])];
  const slotTotals=d.effects?.slotMax||[];
  const showSlots=s.data.adobe?.showSpellSlotsOnOverview===true&&slotTotals.some(Number);
  const slotMarkup=showSlots?`<section class="sheet-summary-box sheet-overview-spell-slots"><div class="sheet-overview-slot-head"><div><span class="sheet-eyebrow">SPELLCASTING</span><h4>Spell slots</h4></div><small>Click a slot to mark it used or available</small></div><div class="sheet-overview-slot-grid">${slotTotals.map((max,i)=>{max=Number(max)||0;if(!max)return'';const used=Math.min(max,Number(s.data.slots[i]?.used)||0);return `<div class="sheet-overview-slot-level"><span>${i+1}<sup>${i===0?'st':i===1?'nd':i===2?'rd':'th'}</sup></span><div class="sheet-slot-orb-row">${Array.from({length:max},(_,j)=>`<button type="button" class="sheet-slot-orb" data-overview-slot-level="${i}" data-overview-slot-number="${j}" aria-label="Level ${i+1} spell slot ${j+1}, ${j<used?'used':'available'}" aria-pressed="${j<used}"></button>`).join('')}</div><small>${max-used}/${max}</small></div>`;}).join('')}</div></section>`:'';
  const featMarkup=featNames.length?`<div class="sheet-overview-feat-list">${featNames.map(name=>`<span>${esc(name)}</span>`).join('')}</div>`:'<p>No feats selected.</p>';
  const pinned=CharacterClassProgression.overviewFeatures(s.data,d.progression?.classLevels||[]);
  const classFeatureMarkup=pinned.length?`<section class="sheet-summary-box sheet-overview-class-features"><h4>Class features</h4>${pinned.map(row=>`<article class="sheet-overview-class-feature"><div>${row.showName?`<strong>${esc(row.name)}</strong>`:''}<small>${esc(CharacterAdobeEngine.className(row.classId))} · Level ${row.level}</small><button type="button" data-remove-overview-feature="${esc(row.key)}" aria-label="Remove ${esc(row.name)} from Overview">Remove</button></div>${row.showDescription?`<p class="sheet-rule-text">${esc(row.summary||'Feature information is being added to the catalogue.')}</p>`:''}${row.showDescription&&(row.action||row.recharge)?`<small>${[row.action,row.recharge].filter(Boolean).map(esc).join(' · ')}</small>`:''}</article>`).join('')}</section>`:'';
  const calculatedOpen=host.querySelector('#sheetOverviewCalculated')?.open===true;
  const calculatedMarkup=s.data.adobe?.showCalculatedOnOverview?`<section class="sheet-summary-box sheet-overview-calculated"><div class="sheet-overview-pin-heading"><details id="sheetOverviewCalculated" ${calculatedOpen?'open':''}><summary>Calculated from your choices · ${esc(b.edition)}</summary><div>${document.getElementById('sheetBuildSummaryContent')?.innerHTML||''}</div></details><button type="button" data-overview-calculated aria-pressed="true">Remove from Overview</button></div></section>`:'';
  const validation=globalThis.CharacterBuildValidation?.check?.(s.data,d,s.identity)||{complete:true,count:0,issues:[]};
  const importantMarkup=!validation.complete?`<section class="sheet-overview-important" aria-label="Important character setup warnings"><header><div><span class="sheet-eyebrow">IMPORTANT</span><h4>Character setup needs attention</h4></div><strong>${validation.count} item${validation.count===1?'':'s'}</strong></header><div class="sheet-overview-important-list">${validation.issues.slice(0,6).map((issue,i)=>`<div class="sheet-overview-important-row"><span class="sheet-overview-important-icon" aria-hidden="true">!</span><div><small>${esc(issue.category)}</small><p>${esc(issue.message)}</p></div><button type="button" data-build-warning-tab="${esc(issue.tab||'builder')}" data-build-warning-index="${i}">Fix</button></div>`).join('')}${validation.issues.length>6?`<p class="sheet-overview-important-more">+${validation.issues.length-6} more unfinished choice${validation.issues.length-6===1?'':'s'}.</p>`:''}</div></section>`:'';
  attacks.push(...d.actions.map((a,i)=>`<tr class="${a.available?'':'sheet-action-unavailable'}"><td><strong>${esc(a.name)}</strong><small>${esc(a.ability?a.ability.toUpperCase():'')}</small><div class="sheet-action-controls"><button type="button" data-edit-action="${i}">Edit</button><button type="button" data-remove-action="${i}">Remove</button></div><details><summary>Details</summary>${a.notes.map(n=>`<p>${esc(n)}</p>`).join('')}</details></td><td>${esc(a.hit)}</td><td>${esc(a.damage)}</td><td>${esc(a.range)}</td></tr>`));
  host.innerHTML=`<header class="sheet-summary-identity"><div><small>CHARACTER</small><h3>${esc(s.identity.name||'Unnamed adventurer')}</h3><p>${esc(s.identity.class||'Choose class')} · Level ${s.identity.level} · ${b.edition}</p></div><dl><div><dt>Species</dt><dd>${esc(e.race?.name||s.data.species||'—')}</dd></div><div><dt>Background</dt><dd>${esc(bg?.name||s.data.background||'—')}</dd></div><div><dt>Alignment</dt><dd>${esc(s.data.alignment||'—')}</dd></div><div><dt>Experience</dt><dd>${esc(s.data.experience||'—')}</dd></div></dl></header>
  ${importantMarkup}
  <div class="sheet-summary-columns"><aside class="sheet-summary-abilities">${Object.entries(M.abilities).map(([key,name])=>`<div class="sheet-summary-ability">${abilityEmblem(key)}<h4>${esc(name)}</h4><strong>${sign(d.mods[key])}</strong><span>${d.scores[key]}</span></div>`).join('')}</aside>
  <div class="sheet-summary-checks"><section class="sheet-summary-box"><h4>Saving throws</h4>${Object.entries(M.abilities).map(([key,name])=>`<div class="sheet-summary-skill"><span>${s.data.saves[key].proficient||e.saves.includes(key)?'●':'○'}</span><span>${name}</span><strong>${sign(d.saves[key])}</strong></div>`).join('')}</section><section class="sheet-summary-box"><h4>Skills</h4>${skills}</section><section class="sheet-summary-box"><h4>Senses</h4><p>Passive perception <strong>${d.passive}</strong></p><p>Darkvision ${e.darkvision||0} ft</p></section></div>
  <div class="sheet-summary-main"><section class="sheet-summary-metrics">${metric('Armor Class',d.ac)}${metric('Initiative',sign(d.initiative))}${metric('Proficiency',sign(d.pb))}${metric('HP',d.hpMax)}${metric('Speed',e.speed+' ft')}<button type="button" id="sheetOverviewInspiration" class="sheet-summary-toggle" aria-pressed="${s.data.inspiration}"><span>Inspiration</span><strong>${s.data.inspiration?'Yes':'—'}</strong></button>${metric('Spell save DC',d.spellDC)}${metric('Spell attack',sign(d.spellAttack))}</section>
  ${slotMarkup}
  ${classFeatureMarkup}${calculatedMarkup}
  <section class="sheet-summary-box"><h4>Armor & defenses</h4><p>${esc(d.gear.baseLabel)} ${d.gear.base} · shield ${d.gear.shield} · items ${sign(d.gear.bonus)} · Defense ${sign(d.gear.defense)} · adjustment ${sign(d.gear.adjustment)}</p><p><strong>Conditions:</strong> ${esc(s.data.conditions||'None recorded')}</p><p><strong>Resistances:</strong> ${esc([...e.resistances,s.data.resistances].filter(Boolean).join('; ')||'—')}</p><p><strong>Death saves:</strong> ${s.data.deathSuccess} successes / ${s.data.deathFailure} failures · <strong>Hit dice:</strong> ${esc(s.data.hitDice||'—')}</p></section>
  <section class="sheet-summary-box"><h4>Attacks & actions <button type="button" id="sheetOverviewAddAttack">+ Add attack</button></h4><div class="sheet-summary-table-wrap"><table><thead><tr><th>Weapon / action</th><th>To hit / save</th><th>Damage</th><th>Range</th></tr></thead><tbody>${attacks.join('')||'<tr><td colspan="4">Equip a looted weapon in Inventory or add an action in Combat.</td></tr>'}</tbody></table></div></section>
  <section class="sheet-summary-box"><h4>Proficiencies & languages</h4><p>${esc([...e.proficiencies,s.data.proficiencies].filter(Boolean).join(' · ')||'—')}</p><p>${esc([...e.languages,s.data.languages].filter(Boolean).join(' · ')||'—')}</p></section>
  <section class="sheet-summary-box sheet-overview-feats"><h4>Feats</h4>${featMarkup}</section>
  <section class="sheet-summary-box"><h4>Features & resources</h4><p class="sheet-rule-text">${esc(s.data.resources||s.data.features||'Manage feat resources in Combat and feat choices on the Feats page.')}</p>${d.feats.reports.filter(r=>CharacterFeatRules.resource(r.def,s.identity.level)).map(r=>{const v=CharacterFeatRules.resource(r.def,s.identity.level);return `<p>${esc(r.def.name)}: ${Math.max(0,v.max-r.choice.used)} / ${v.max}</p>`;}).join('')}</section></div></div><p class="sheet-help">HP shows maximum hit points only. Inspiration can be toggled here. Add or edit attacks here; edit other values in their dedicated tabs.</p>`;
 host.querySelectorAll('[data-build-warning-tab]').forEach(button=>button.onclick=()=>{const tab=button.dataset.buildWarningTab||'builder';selectSheetTab(tab);document.querySelector('[data-sheet-tab="'+tab+'"]')?.focus();});
 const inspiration=document.getElementById('sheetOverviewInspiration');if(inspiration)inspiration.onclick=()=>{readSheetForm();s.data.inspiration=!s.data.inspiration;const input=document.querySelector('[name="inspiration"]');if(input)input.checked=s.data.inspiration;s.dirty=true;updateSheetCalculations();sheetStatus('Inspiration updated. Save the character sheet to keep it.');};
  host.querySelectorAll('[data-overview-slot-level]').forEach(button=>button.onclick=()=>{readSheetForm();const i=Number(button.dataset.overviewSlotLevel),j=Number(button.dataset.overviewSlotNumber),slot=s.data.slots[i],max=Number(d.effects?.slotMax?.[i])||0;if(!slot)return;slot.used=Math.max(0,Math.min(max,j<(Number(slot.used)||0)?j:j+1));s.dirty=true;updateSheetCalculations();sheetStatus('Spell slot use changed. Save to keep it.');});
 bindOverviewAttacks();
 host.querySelector('[data-overview-calculated]')?.addEventListener('click',toggleCalculatedOverview);
 host.querySelectorAll('[data-remove-overview-feature]').forEach(button=>button.onclick=()=>toggleClassFeatureOverview(button.dataset.removeOverviewFeature,'enabled'));
}
function closeSpellInformation(){const d=document.getElementById('sheetSpellInformation');if(d){if(d.open)d.close();d.remove();}}
function openSpellInformation({catalogId='',index=null}={}) {
  if(!sheetSession)return;readSheetForm();
  const row=index===null?null:sheetSession.data.spells[index],spell=CharacterCatalog.find(catalogId||row?.catalogId);
  if(!row&&!spell)return;
  closeSpellInformation();const d=document.createElement('dialog');d.id='sheetSpellInformation';d.className='vault-dialog sheet-spell-information';d.setAttribute('aria-labelledby','sheetSpellInformationTitle');
  const esc=sheetEscape,title=spell?spell.name+' · '+spell.edition:row.name;
  const description=spell?.description||row?.notes||'This catalogue entry contains a source reference only. Consult the listed book for complete spell effects.';
  d.innerHTML=`<header><h2 id="sheetSpellInformationTitle">${esc(title)}</h2><button type="button" aria-label="Close spell information">Close</button></header><div class="sheet-spell-facts">${[['Level',spell?.level??row?.level],['School',spell?.school],['Casting',spell?.casting||row?.casting],['Range',spell?.range||row?.range],['Components',spell?.components||row?.components],['Duration',spell?.duration||row?.duration]].filter(([,v])=>v!==undefined&&v!=='').map(([k,v])=>`<p><strong>${k}:</strong> ${esc(v)}</p>`).join('')}</div><div class="sheet-rule-text">${esc(description)}</div>${spell?`<p class="sheet-help">${esc(spell.book)} · p. ${spell.page}${spell.license?' · '+esc(spell.license):' · Source reference'}</p>`:''}${spell&&row?.notes&&row.notes!==CharacterCatalog.spellRow(spell).notes?`<details><summary>Your saved notes</summary><p class="sheet-rule-text">${esc(row.notes)}</p></details>`:''}`;
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
function skillAutomaticRank(d,key){return Math.max(d.effects.skills.includes(key)?1:0,d.feats.expertise.includes(key)?2:0);}
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
  detail.innerHTML=`<span>${s.data.abilities[key]} ${base?'base':'entered total'}</span><span>${sheetEscape(source+(originName?' · '+originName:''))} ${M.signed(base?origin:d.effects.asi[key]||0)}${base?'':' · reference only'}</span>${sources.map(v=>`<span>${sheetEscape(v)}</span>`).join('')}<strong>Final score ${d.scores[key]}</strong>`;

 }
 const notice=document.getElementById('sheetScoreModeNotice');
 notice.innerHTML=base?'Automatic scores: enter your scores before bonuses below. The large numbers include valid race/background and feat increases, with their limits applied.':'Final totals mode: your entered scores already include bonuses. To calculate them automatically, select Base scores / HP below and enter scores before bonuses.';
 renderPointBuySummary(d);
 for(const key of Object.keys(M.skills)){
  const automatic=skillAutomaticRank(d,key),manual=s.data.skills[key].rank,effective=Math.max(automatic,manual);
  const source=document.querySelector(`[data-skill-source="${key}"]`);if(source){source.textContent=automatic?' · Auto':'';source.title=automatic?'Training granted by Character builder or Feats.':'';}
  document.querySelectorAll(`[data-skill="${key}"]`).forEach(button=>{
   const rank=Number(button.dataset.rank);button.setAttribute('aria-pressed',String(rank===effective));
   button.disabled=rank<automatic||rank===automatic&&manual<=automatic;
   button.classList.toggle('sheet-orb-automatic',rank===automatic&&automatic>0);
   button.title=button.disabled?'Granted training cannot be reduced here. Edit its source in Character builder or Feats.':rank===manual?'Click to remove your manual training choice.':'Set '+({0.5:'half proficiency',1:'proficiency',2:'expertise'}[rank]);
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
 const enabled=s.data.build.scoreMethod==='pointBuy',base=s.data.build.scoreMode==='base',p=CharacterSheetModel.pointBuy(s.data.abilities);
 const total=Object.values(s.data.abilities).reduce((a,b)=>a+b,0),final=Object.values(d.scores).reduce((a,b)=>a+b,0);
 host.innerHTML=`<div class="sheet-point-metrics"><div><small>${base?'Base score':'Entered score'} total</small><strong>${total}</strong></div><div><small>Final score total</small><strong>${final}</strong></div>${enabled&&base?`<div class="${p.valid?'':'sheet-point-invalid'}"><small>Point-buy spent</small><strong>${p.invalid.length?'—':p.spent} <em>/ 27</em></strong></div><div><small>Points remaining</small><strong>${p.invalid.length?'—':p.remaining}</strong></div>`:''}</div>${enabled?base?`<progress max="27" value="${Math.min(27,p.spent)}" aria-label="Point-buy points spent"></progress><p class="sheet-help">Point costs: 8 → 0 · 9 → 1 · 10 → 2 · 11 → 3 · 12 → 4 · 13 → 5 · 14 → 7 · 15 → 9. Bonuses are excluded.</p>${p.invalid.length?`<p class="sheet-build-warning">Point buy requires base scores from 8 to 15. Check ${p.invalid.map(k=>k.toUpperCase()).join(', ')}. Your entered scores have been preserved.</p>`:p.spent>27?`<p class="sheet-build-warning">${p.spent-27} points over budget. Lower base scores to use standard point buy.</p>`:''}`:'<p class="sheet-build-warning">Point buy needs scores before bonuses. Choose Base scores / HP and enter your original base scores; final totals cannot be priced reliably.</p>':'<p class="sheet-help">Manual / rolled scores: no point-buy budget is enforced.</p>'}<p class="sheet-help">Class ASIs appear under each ability when selected in Feats. Increases already included in an entered base score cannot be separated automatically. Other class features require manual entry unless supported.</p>`;
 for(const [key] of Object.entries(CharacterSheetModel.abilities)){const label=document.querySelector(`[name="abilities.${key}"]`)?.closest('label');if(!label)continue;let cost=label.querySelector('.sheet-point-cost');if(!cost){cost=document.createElement('small');cost.className='sheet-point-cost';label.append(cost);}cost.textContent=enabled&&base?(p.rows.find(r=>r.key===key).cost??'Invalid')+' point-buy cost':'';}
}
