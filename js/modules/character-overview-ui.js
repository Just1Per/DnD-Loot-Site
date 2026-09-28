/* A display-only journal page. Editable fields remain in their dedicated tabs. */
function renderCharacterOverview(d) {
  const s=sheetSession,host=document.getElementById('sheetOverviewReadout');if(!s||!host)return;
  const M=CharacterSheetModel,b=s.data.build,e=d.effects,esc=sheetEscape,sign=M.signed;
  const bg=CharacterRules.modern.backgrounds[b.background]||CharacterBackgrounds.legacy[b.background];
  const metric=(label,value)=>`<div><span>${esc(label)}</span><strong>${esc(value)}</strong></div>`;
  const skills=Object.entries(M.skills).map(([key,[name,ability]])=>{
    const rank=Math.max(s.data.skills[key].rank,e.skills.includes(key)?1:0,d.feats.expertise.includes(key)?2:0);
    return `<div class="sheet-summary-skill"><span title="${rank===2?'Expertise':rank===1?'Proficient':rank===.5?'Half proficiency':'Not proficient'}">${rank===2?'◆':rank===1?'●':rank===.5?'◐':'○'}</span><span>${esc(name)} <small>${ability.toUpperCase()}</small></span><strong>${sign(d.skills[key])}</strong></div>`;
  }).join('');
  const attackRow=(name,hit,damage,range)=>`<tr><td>${esc(name)}</td><td>${esc(hit)}</td><td>${esc(damage)}</td><td>${esc(range)}</td></tr>`;
  const attacks=d.gear.attacks.filter(a=>a.equipped).map(a=>attackRow(a.name,a.attack===null?'—':sign(a.attack),a.damage,a.range)).concat(s.data.attacks.map((a,i)=>attackRow(a.name,sign(d.attacks[i]),a.damage,a.range)));
  host.innerHTML=`<header class="sheet-summary-identity"><div><small>CHARACTER</small><h3>${esc(s.identity.name||'Unnamed adventurer')}</h3><p>${esc(s.identity.class||'Choose class')} · Level ${s.identity.level} · ${b.edition}</p></div><dl><div><dt>Species</dt><dd>${esc(e.race?.name||s.data.species||'—')}</dd></div><div><dt>Background</dt><dd>${esc(bg?.name||s.data.background||'—')}</dd></div><div><dt>Alignment</dt><dd>${esc(s.data.alignment||'—')}</dd></div><div><dt>Experience</dt><dd>${esc(s.data.experience||'—')}</dd></div></dl></header>
  <div class="sheet-summary-columns"><aside class="sheet-summary-abilities">${Object.entries(M.abilities).map(([key,name])=>`<div class="sheet-summary-ability"><h4>${esc(name)}</h4><strong>${sign(d.mods[key])}</strong><span>${d.scores[key]}</span></div>`).join('')}</aside>
  <div class="sheet-summary-checks"><section class="sheet-summary-box"><h4>Saving throws</h4>${Object.entries(M.abilities).map(([key,name])=>`<div class="sheet-summary-skill"><span>${s.data.saves[key].proficient||e.saves.includes(key)?'●':'○'}</span><span>${name}</span><strong>${sign(d.saves[key])}</strong></div>`).join('')}</section><section class="sheet-summary-box"><h4>Skills</h4>${skills}</section><section class="sheet-summary-box"><h4>Senses</h4><p>Passive perception <strong>${d.passive}</strong></p><p>Darkvision ${e.darkvision||0} ft</p></section></div>
  <div class="sheet-summary-main"><section class="sheet-summary-metrics">${metric('Armor Class',d.ac)}${metric('Initiative',sign(d.initiative))}${metric('Proficiency',sign(d.pb))}${metric('Hit points',s.data.hpCurrent+' / '+d.hpMax)}${metric('Temporary HP',s.data.hpTemp)}${metric('Speed',e.speed+' ft')}${metric('Inspiration',s.data.inspiration?'Yes':'—')}${metric('Spell save DC',d.spellDC)}${metric('Spell attack',sign(d.spellAttack))}</section>
  <section class="sheet-summary-box"><h4>Armor & defenses</h4><p>${esc(d.gear.baseLabel)} ${d.gear.base} · shield ${d.gear.shield} · items ${sign(d.gear.bonus)} · Defense ${sign(d.gear.defense)} · adjustment ${sign(d.gear.adjustment)}</p><p><strong>Conditions:</strong> ${esc(s.data.conditions||'None recorded')}</p><p><strong>Resistances:</strong> ${esc([...e.resistances,s.data.resistances].filter(Boolean).join('; ')||'—')}</p><p><strong>Death saves:</strong> ${s.data.deathSuccess} successes / ${s.data.deathFailure} failures · <strong>Hit dice:</strong> ${esc(s.data.hitDice||'—')}</p></section>
  <section class="sheet-summary-box"><h4>Attacks</h4><div class="sheet-summary-table-wrap"><table><thead><tr><th>Weapon / action</th><th>To hit</th><th>Damage</th><th>Range</th></tr></thead><tbody>${attacks.join('')||'<tr><td colspan="4">Equip a looted weapon in Inventory or add an action in Combat.</td></tr>'}</tbody></table></div></section>
  <section class="sheet-summary-box"><h4>Proficiencies & languages</h4><p>${esc([...e.proficiencies,s.data.proficiencies].filter(Boolean).join(' · ')||'—')}</p><p>${esc([...e.languages,s.data.languages].filter(Boolean).join(' · ')||'—')}</p></section>
  <section class="sheet-summary-box"><h4>Features & resources</h4><p>${esc((e.originFeats||[]).join(' · ')||'No Origin feats selected')}</p><p class="sheet-rule-text">${esc(s.data.resources||s.data.features||'Manage feat resources in Combat and feat choices in Character builder.')}</p>${d.feats.reports.filter(r=>CharacterFeatRules.resource(r.def,s.identity.level)).map(r=>{const v=CharacterFeatRules.resource(r.def,s.identity.level);return `<p>${esc(r.def.name)}: ${Math.max(0,v.max-r.choice.used)} / ${v.max}</p>`;}).join('')}</section></div></div><p class="sheet-help">Overview is read-only. Edit identity and background in Character builder, scores in Abilities & skills, and HP/actions in Combat.</p>`;
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
 const modern=document.createElement('section');modern.id='sheetOriginFeatChoices';modern.innerHTML='<h3>Origin feat choices</h3><p>Your background grants its listed feat automatically. Make additional Human or custom-background choices here.</p>';
 const legacy=document.createElement('section');legacy.id='sheetLegacyFeatChoice';legacy.innerHTML='<h3>Variant Human feat</h3>';
 for(const name of ['build.backgroundFeat','build.humanOriginFeat',...[0,1,2].flatMap(i=>[`build.backgroundFeatChoices.${i}`,`build.humanFeatChoices.${i}`])]){const label=form.querySelector(`[name="${name}"]`)?.closest('label');if(label)modern.appendChild(label);}
 const race=form.querySelector('[name="build.raceFeat"]')?.closest('label');if(race)legacy.appendChild(race);
 host.append(modern,legacy);
}
function updateBackgroundControls(d) {
 const b=sheetSession.data.build,bg=CharacterBackgrounds.get(b.background),form=document.getElementById('characterSheetForm'),R=CharacterRules;
 const active=bg&&!(b.edition==='2014'&&bg.edition==='2024');
 let count=active?bg.languages:0;
 for(let i=0;i<2;i++){
  const input=form.querySelector(`[name="build.backgroundTools.${i}"]`),kind=active?bg.toolChoices[i]:null;
  const options=CharacterBackgrounds.toolOptions(kind,R);input.closest('label').hidden=!kind;
  for(const option of input.querySelectorAll('option'))option.disabled=!!option.value&&!options.includes(option.value);
  if(kind==='merchant'&&b.backgroundTools[i]==='Additional language')count++;
  const replacement=form.querySelector(`[name="build.backgroundReplacementSkills.${i}"]`);replacement.closest('label').hidden=!active||!d.effects.backgroundDuplicates?.includes(i);
 }
 document.getElementById('sheetBackgroundChoices').hidden=!count;
 for(let i=0;i<2;i++)form.querySelector(`[name="build.backgroundLanguages.${i}"]`).closest('label').hidden=i>=count;
 const summary=document.getElementById('sheetBackgroundSummary');
 summary.innerHTML=bg?`<h4>${sheetEscape(bg.name)} · ${bg.edition}</h4><p><strong>Skills:</strong> ${bg.skills.map(k=>sheetEscape(CharacterSheetModel.skills[k]?.[0]||k)).join(', ')}</p><p><strong>Tools:</strong> ${sheetEscape([...bg.fixedTools.map(t=>CharacterBackgrounds.toolName(t,R.tools)),...bg.toolChoices.map(t=>({anyArtisansTool:'Choose one artisan tool',anyMusicalInstrument:'Choose one musical instrument',anyGamingSet:'Choose one gaming set',merchant:'Choose artisan/navigator tools or one extra language'}[t]))].join(', ')||'None')}</p><p><strong>Additional languages:</strong> ${count}</p>${bg.abilities?`<p><strong>Ability increases:</strong> +2/+1 or +1/+1/+1 among ${bg.abilities.map(k=>CharacterSheetModel.abilities[k]).join(', ')}; capped at 20 in Base mode.</p><p><strong>Origin feat:</strong> ${sheetEscape(bg.feat)}. Choose the origin in Character builder; see Feats for its effects.</p>`:`<p><strong>Feature:</strong> ${sheetEscape(bg.feature)}. Narrative benefits require DM agreement.${b.edition==='2024'?' Your 2024 rules additionally grant background ability increases and an Origin feat choice in Character builder.':' No background ability increase or Origin feat under 2014 rules.'}</p>`}<p class="sheet-help">${bg.source}, p. ${bg.page}. Skills, tools, languages and supported feat effects are derived from your selections. Starting equipment is not added to campaign loot automatically; arrange it with the DM.</p>`:'<p>Custom background: record skills and tools in Abilities & skills / Combat notes. Under 2024 rules, select ability increases here and an Origin feat in Character builder.</p>';
 document.getElementById('sheetOriginFeatChoices').hidden=b.edition!=='2024';
 document.getElementById('sheetLegacyFeatChoice').hidden=b.edition!=='2014'||b.race!=='variant-human';
}
function refineCharacterBuilder() {
 const root=document.getElementById('sheetBuildControls');
 const group=(title,nodes)=>{const section=document.createElement('section');section.className='sheet-builder-group sheet-editor-box';const heading=document.createElement('h4');heading.textContent=title;section.appendChild(heading);for(const node of nodes)if(node)section.appendChild(node);root.appendChild(section);return section;};
 const grids=[...root.children];
 group('Rules & character',[grids.find(n=>n.classList.contains('sheet-grid')),document.getElementById('sheetManualIdentity')]);
 const race=group('Species & ancestry choices',[...root.querySelectorAll(':scope > [data-build-for]'),document.getElementById('sheetRaceChoices')]);race.id='sheetSpeciesEditorGroup';
 group('Class training',[document.getElementById('sheetClassSkills')]);
 group('Background & ability increases',[document.getElementById('sheetModernOrigin'),document.getElementById('sheetBackgroundSummary'),document.getElementById('sheetBackgroundTraining'),document.getElementById('sheetBackgroundChoices')]);
 const summary=document.getElementById('sheetBuildSummary');summary.classList.add('sheet-editor-box');
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
  detail.textContent=base?`${s.data.abilities[key]} base + ${origin} ${s.data.build.edition==='2024'?'background':'race'}${feat?' '+M.signed(feat)+' feats':''} = ${d.scores[key]}`:'Bonuses already included in your entered total.';
 }
 const notice=document.getElementById('sheetScoreModeNotice');
 notice.innerHTML=base?'Automatic scores: enter your scores before bonuses below. The large numbers include valid race/background and feat increases, with their limits applied.':'Final totals mode: your entered scores already include bonuses. To calculate them automatically, select Base scores / HP in Character builder and enter scores before bonuses.';
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
