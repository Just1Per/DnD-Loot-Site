'use strict';
/* Optional MPMB-inspired web pages and presentation helpers.
 * Reimplements useful character-sheet relationships for the browser. */
(()=>{
  const E=CharacterAdobeEngine,A=E.A,MENTAL=new Set(['int','wis','cha']);
  const OPTIONAL={spells:'Spell sheet',companion:'Companion / Familiar / Wild Shape',rules:'Player rules'};

  function pageManagerMarkup(){
    return `<dialog id="sheetPageManager" class="sheet-page-manager" aria-labelledby="sheetPageManagerTitle">
      <div class="sheet-page-manager-head"><div><span class="sheet-eyebrow">SHEET PAGES</span><h3 id="sheetPageManagerTitle">Choose extra pages</h3></div><button type="button" data-close-page-manager aria-label="Close">×</button></div>
      <p class="sheet-help">Add or remove optional pages here. Drag the tabs themselves to rearrange their order.</p>
      <div class="sheet-page-manager-options">
        ${Object.entries(OPTIONAL).map(([key,label])=>`<label><input type="checkbox" data-toggle-page="${key}"><span><strong>${label}</strong><small data-page-note="${key}"></small></span></label>`).join('')}
      </div>
      <div class="sheet-page-manager-actions"><button type="button" class="btn-primary" data-close-page-manager>Done</button></div>
    </dialog>`;
  }

  function setupPages(){
    const dialog=document.getElementById('characterSheetDialog');
    if(!dialog||document.getElementById('sheet-companion'))return;
    const body=dialog.querySelector('.sheet-body'),f=sheetField;
    const companion=document.createElement('section');
    companion.id='sheet-companion';companion.className='sheet-panel';companion.dataset.sheetSection='companion';companion.setAttribute('role','tabpanel');
    companion.innerHTML=`<div class="sheet-repeat-title"><h3>Companion / Familiar / Wild Shape</h3></div><p class="sheet-help">Choose the page type, then choose a creature from the Adobe creature database. Its defenses, abilities and available attacks are copied into the sheet. Wild Shape uses your character's mental ability scores and the better applicable skill training.</p><div class="sheet-grid">${f('Type','adobe.companion.type','select',{values:[['companion','Companion'],['familiar','Familiar'],['wildshape','Wild Shape']]})}${f('Name','adobe.companion.name')}${f('Size','adobe.companion.size','select',{values:[['Tiny','Tiny'],['Small','Small'],['Medium','Medium'],['Large','Large'],['Huge','Huge']]})}${f('Proficiency bonus','adobe.companion.profBonus','number',{min:0,max:10})}${f('Armor Class','adobe.companion.ac','number',{min:0})}${f('Maximum HP','adobe.companion.hpMax','number',{min:0})}${f('Current HP','adobe.companion.hpCurrent','number',{min:0})}${f('Temporary HP','adobe.companion.hpTemp','number',{min:0})}${f('Speed','adobe.companion.speed','number',{min:0})}${f('Initiative bonus','adobe.companion.initiativeBonus','number')}</div><h4>Abilities & saving throws</h4><div class="sheet-abilities">${A.map(k=>`<article class="sheet-ability"><h4>${CharacterSheetModel.abilities[k]}</h4>${f('Score',`adobe.companion.abilities.${k}`,'number',{min:1,max:30})}${f('Save proficient',`adobe.companion.saveProficient.${k}`,'checkbox')}<p><strong data-comp-mod="${k}"></strong></p></article>`).join('')}</div><h4>Skills</h4><div class="sheet-companion-skills">${Object.entries(CharacterSheetModel.skills).map(([k,[name,ability]])=>`<div class="sheet-skill-edit"><span>${name} <small>${ability.toUpperCase()}</small></span>${f('Training',`adobe.companion.skillRank.${k}`,'select',{values:[[0,'None'],[1,'Proficient'],[2,'Expertise']]})}${f('Bonus',`adobe.companion.skillBonus.${k}`,'number')}<output data-comp-skill="${k}"></output></div>`).join('')}</div><div class="sheet-grid two">${f('Attacks','adobe.companion.attacks','textarea',{rows:5})}${f('Traits & features','adobe.companion.traits','textarea',{rows:5})}${f('Notes','adobe.companion.notes','textarea',{rows:5})}</div>`;
    body.append(companion);

    const rules=document.createElement('section');
    rules.id='sheet-rules';rules.className='sheet-panel';rules.dataset.sheetSection='rules';rules.setAttribute('role','tabpanel');
    rules.innerHTML=`<div class="sheet-repeat-title"><h3>Player rules reference</h3></div><p class="sheet-help">Compact play reference using the same broad categories as the Adobe reference page. Exact wording and edition-specific exceptions remain in your rules source.</p><div class="sheet-rules-grid"><section><h4>Combat actions</h4><p>Attack, Cast a Spell, Dash, Disengage, Dodge, Help, Hide, Ready and Search use your action economy. Reactions and bonus actions require a feature that grants them.</p></section><section><h4>Movement</h4><p>Movement can be split around actions. Difficult terrain and some climbing, swimming or crawling cost extra movement. Standing from prone costs part of your movement.</p></section><section><h4>Cover & vision</h4><p>Cover can improve defenses or prevent direct targeting. Darkness and special senses such as Darkvision, Blindsight and Truesight change what a creature can perceive.</p></section><section><h4>Conditions</h4><p>Track common conditions such as Blinded, Charmed, Frightened, Grappled, Incapacitated, Invisible, Paralyzed, Poisoned, Prone, Restrained, Stunned and Unconscious.</p></section><section><h4>Rest & travel</h4><p>Short and long rests recover different resources. Travel pace, forced marching, food, water, falling and suffocation can impose checks, damage, exhaustion or other consequences.</p></section></div>`;
    body.append(rules);

    const nav=dialog.querySelector('.sheet-tabs'),plus=document.createElement('button');
    plus.type='button';plus.id='sheetAddPageButton';plus.className='sheet-add-page-button';plus.textContent='+ Page';plus.setAttribute('aria-haspopup','dialog');plus.setAttribute('aria-controls','sheetPageManager');
    nav.append(plus);
    dialog.insertAdjacentHTML('beforeend',pageManagerMarkup());
    const manager=dialog.querySelector('#sheetPageManager');
    plus.onclick=()=>{syncPageManager();manager.showModal();};
    manager.querySelectorAll('[data-close-page-manager]').forEach(button=>button.onclick=()=>manager.close());
    manager.addEventListener('click',event=>{if(event.target===manager)manager.close();});
    manager.querySelectorAll('[data-toggle-page]').forEach(input=>input.addEventListener('change',()=>{
      readSheetForm();
      const key=input.dataset.togglePage,derived=CharacterSheetModel.derive(sheetSession.data,sheetSession.identity.level);
      if(key==='spells'&&derived.progression.isSpellcaster){input.checked=true;return;}
      sheetSession.data.adobe.pages[key]=input.checked;
      sheetSession.dirty=true;
      updateSheetCalculations();
      if(input.checked)selectSheetTab(key);
      else if(document.querySelector('[data-sheet-tab][aria-selected="true"]')?.dataset.sheetTab===key)selectSheetTab('overview');
      sheetStatus(`${OPTIONAL[key]} ${input.checked?'added':'removed'}. Save the sheet to keep it.`);
    }));
    setupTabDragging();
  }

  function ensureTab(key,label){
    const nav=document.querySelector('#characterSheetDialog .sheet-tabs');let button=nav?.querySelector(`[data-sheet-tab="${key}"]`);
    if(!button&&nav){button=document.createElement('button');button.type='button';button.setAttribute('role','tab');button.dataset.sheetTab=key;button.textContent=label;button.setAttribute('aria-selected','false');button.tabIndex=-1;nav.querySelector('#sheetAddPageButton')?.before(button);button.onclick=()=>selectSheetTab(key);makeTabDraggable(button);}
    return button;
  }

  function makeTabDraggable(button){
    if(!button||button.dataset.dragReady==='1')return;
    button.dataset.dragReady='1';button.draggable=true;button.title=button.title||'Drag to move this tab';
    button.addEventListener('dragstart',event=>{button.classList.add('is-dragging');event.dataTransfer.effectAllowed='move';event.dataTransfer.setData('text/plain',button.dataset.sheetTab);});
    button.addEventListener('dragend',()=>button.classList.remove('is-dragging'));
    button.addEventListener('dragover',event=>{event.preventDefault();event.dataTransfer.dropEffect='move';button.classList.add('is-drag-target');});
    button.addEventListener('dragleave',()=>button.classList.remove('is-drag-target'));
    button.addEventListener('drop',event=>{
      event.preventDefault();button.classList.remove('is-drag-target');
      const nav=button.closest('.sheet-tabs'),key=event.dataTransfer.getData('text/plain'),dragged=nav?.querySelector(`[data-sheet-tab="${key}"]`);
      if(!nav||!dragged||dragged===button)return;
      const rect=button.getBoundingClientRect(),after=event.clientX>rect.left+rect.width/2;
      nav.insertBefore(dragged,after?button.nextSibling:button);
      persistTabOrder();
    });
  }

  function setupTabDragging(){document.querySelectorAll('#characterSheetDialog [data-sheet-tab]').forEach(makeTabDraggable);applyTabOrder();}

  function persistTabOrder(){
    const nav=document.querySelector('#characterSheetDialog .sheet-tabs');if(!nav||!sheetSession)return;
    sheetSession.data.adobe.tabOrder=[...nav.querySelectorAll('[data-sheet-tab]')].map(button=>button.dataset.sheetTab);
    sheetSession.dirty=true;sheetStatus('Tab order changed. Save the sheet to keep it.');
  }

  function applyTabOrder(){
    const nav=document.querySelector('#characterSheetDialog .sheet-tabs'),order=sheetSession?.data?.adobe?.tabOrder||[];if(!nav)return;
    const plus=nav.querySelector('#sheetAddPageButton');
    for(const key of order){const button=nav.querySelector(`[data-sheet-tab="${key}"]`);if(button)nav.insertBefore(button,plus);}
  }

  function syncPageManager(derived){
    const root=document.getElementById('sheetPageManager');if(!root||!sheetSession)return;
    derived ||= CharacterSheetModel.derive(sheetSession.data,sheetSession.identity.level);
    for(const [key,label] of Object.entries(OPTIONAL)){
      const input=root.querySelector(`[data-toggle-page="${key}"]`),note=root.querySelector(`[data-page-note="${key}"]`);
      if(!input)continue;
      const required=key==='spells'&&derived.progression.isSpellcaster;
      input.disabled=required;input.checked=required||sheetSession.data.adobe.pages[key];
      if(note)note.textContent=required?'Required by this character’s spellcasting class.':input.checked?'Currently shown — uncheck to remove.':'Optional — check to add.';
    }
  }

  function updatePages(derived){
    const session=sheetSession,root=document.getElementById('characterSheetDialog');if(!session||!root)return;
    const spellTab=root.querySelector('[data-sheet-tab="spells"]'),showSpell=derived.progression.isSpellcaster||session.data.adobe.pages.spells;if(spellTab)spellTab.hidden=!showSpell;
    const companionTab=ensureTab('companion','Companion'),rulesTab=ensureTab('rules','Rules');if(companionTab)companionTab.hidden=!session.data.adobe.pages.companion;if(rulesTab)rulesTab.hidden=!session.data.adobe.pages.rules;
    applyTabOrder();syncPageManager(derived);
    if(root.querySelector('[data-sheet-tab][aria-selected="true"]')?.hidden)selectSheetTab('overview');
    const active=root.querySelector('[data-sheet-tab][aria-selected="true"]')?.dataset.sheetTab||'overview',companion=document.getElementById('sheet-companion'),rules=document.getElementById('sheet-rules');
    if(companion)companion.hidden=active!=='companion';if(rules)rules.hidden=active!=='rules';
  }

  function updateCompanion(derived){const session=sheetSession;if(!session||!document.getElementById('sheet-companion'))return;const companion=session.data.adobe.companion,pb=companion.type==='wildshape'?derived.pb:companion.profBonus,characterRank={};for(const key of Object.keys(CharacterSheetModel.skills))characterRank[key]=Math.max(session.data.skills[key].rank,derived.effects.skills.includes(key)?1:0,derived.feats.expertise.includes(key)?2:0);for(const key of A){const score=companion.type==='wildshape'&&MENTAL.has(key)?derived.scores[key]:companion.abilities[key],input=document.querySelector(`[name="adobe.companion.abilities.${key}"]`);if(input){input.readOnly=companion.type==='wildshape'&&MENTAL.has(key);if(input.readOnly)input.value=score;}const output=document.querySelector(`[data-comp-mod="${key}"]`);if(output)output.textContent=`Mod ${CharacterSheetModel.signed(CharacterSheetModel.mod(score))} · Save ${CharacterSheetModel.signed(CharacterSheetModel.mod(score)+(companion.saveProficient[key]?pb:0))}`;}for(const [key,[,ability]] of Object.entries(CharacterSheetModel.skills)){const score=companion.type==='wildshape'&&MENTAL.has(ability)?derived.scores[ability]:companion.abilities[ability],rank=companion.type==='wildshape'?Math.max(companion.skillRank[key]||0,characterRank[key]||0):companion.skillRank[key]||0,total=CharacterSheetModel.mod(score)+rank*pb+(companion.skillBonus[key]||0),output=document.querySelector(`[data-comp-skill="${key}"]`);if(output)output.textContent=CharacterSheetModel.signed(total);}}

  function cleanFeatTab(){const host=document.getElementById('catalogSelectedFeats');if(!host)return;const title=host.querySelector('h4');if(title)title.textContent='Selected feats';const intro=title?.nextElementSibling;if(intro?.tagName==='P')intro.textContent='Choose and configure feats here. Calculated effects appear on Ability Scores, Combat, Spells or Overview where they are useful.';host.querySelector(':scope > .sheet-actions')?.remove();host.querySelectorAll('[data-feat-use]').forEach(node=>node.remove());}

  function featSummary(report,derived){if(report.warnings?.length)return'';const name=report.def?.name||report.id,automated=report.automated||[];if(name==='Tough')return`Tough: +${2*derived.progression.targetLevel} maximum HP`;if(name==='Archery')return'Archery: +2 to ranged weapon attack rolls';if(name==='Defense')return derived.feats.acBonus?'Defense: +1 AC while wearing eligible armor':'';if(name==='Alert')return`Alert: initiative ${CharacterSheetModel.signed(derived.initiative)}`;if(name==='Savage Attacker')return'Savage Attacker: once per turn, use the feat when resolving eligible weapon damage';if(name==='Mobile'||name==='Speedy'||name==='Boon of Speed')return`${name}: speed ${derived.effects.speed} ft`;const ability=Object.entries(report.appliedAbilityIncreases||{}).filter(([,v])=>v).map(([k,v])=>`${k.toUpperCase()} ${CharacterSheetModel.signed(v)}`).join(', ');if(ability)return`${name}: ${ability}`;if(automated.some(v=>/saving throw proficiency/i.test(v)))return`${name}: saving throw proficiency applied`;if(automated.some(v=>/skill|expertise/i.test(v)))return`${name}: skill training applied`;return'';}

  function updateOverview(derived){const session=sheetSession,root=document.getElementById('sheetOverviewReadout');if(!session||!root)return;const identity=root.querySelector('.sheet-summary-identity > div > p');if(identity)identity.textContent=`${derived.progression.classLevels.map(entry=>`${E.className(entry.classId)} ${entry.level}`).join(' / ')||session.identity.class} · Level ${derived.progression.targetLevel} · ${session.data.build.edition}`;for(const dt of root.querySelectorAll('dt'))if(dt.textContent.trim()==='Experience')dt.parentElement.hidden=!session.data.adobe.useExperience;const summaries=(derived.feats?.reports||[]).map(report=>featSummary(report,derived)).filter(Boolean);for(const section of root.querySelectorAll('.sheet-summary-box')){const heading=section.querySelector('h4');if(!heading?.textContent.startsWith('Features & resources'))continue;let list=section.querySelector('.sheet-overview-feat-summary');if(!list){list=document.createElement('div');list.className='sheet-overview-feat-summary';heading.after(list);}list.innerHTML=summaries.length?`<ul>${summaries.map(text=>`<li>${sheetEscape(text)}</li>`).join('')}</ul>`:'<p class="sheet-help">No feat effect needs an Overview reminder.</p>';}}

  function setupSpellEligibility(){const spellHost=document.getElementById('sheetSpellCatalog');if(!spellHost||document.getElementById('catalogSpellBrowseAll'))return;const controls=spellHost.querySelector('.sheet-grid');if(!controls)return;const label=document.createElement('label');label.className='sheet-field sheet-check';label.innerHTML='<span>Spell catalogue</span><input id="catalogSpellBrowseAll" type="checkbox"> <small>Browse all spells (DM / special feature)</small>';controls.append(label);label.querySelector('input').addEventListener('change',()=>renderCatalogSpellResults());const intro=spellHost.querySelector('h4 + p');if(intro)intro.textContent='By default this list follows your class levels and reachable spell levels. Turn on Browse all for feats, homebrew, multiclass exceptions or DM-approved spells.';}

  function eligibleSpells(){const session=sheetSession;if(!session||!CharacterCatalog.data)return[];const browseAll=document.getElementById('catalogSpellBrowseAll')?.checked===true,edition=document.getElementById('catalogSpellEdition')?.value||session.data.build.edition,classFilter=document.getElementById('catalogSpellClass')?.value||'',levelFilter=document.getElementById('catalogSpellLevel')?.value??'',search=(document.getElementById('catalogSpellSearch')?.value||'').trim();if(browseAll)return CharacterCatalog.spells({edition,classId:classFilter,level:levelFilter,search});const derived=CharacterSheetModel.derive(session.data,session.identity.level),seen=new Map();for(const entry of derived.progression.spellAccess){if(classFilter&&entry.classId!==classFilter)continue;for(const spell of CharacterCatalog.spells({edition,classId:entry.classId,level:levelFilter,search}))if(Number(spell.level)<=entry.maxSpellLevel)seen.set(spell.id,spell);}return[...seen.values()].sort((a,b)=>Number(a.level)-Number(b.level)||a.name.localeCompare(b.name));}

  function installSpellFilter(){if(typeof window.renderCatalogSpellResults!=='function'||window.renderCatalogSpellResults.__adobeFiltered)return;const replacement=function(){const host=document.getElementById('catalogSpellResults');if(!host)return;const rows=eligibleSpells(),browseAll=document.getElementById('catalogSpellBrowseAll')?.checked===true;host.innerHTML=`<p>${rows.length} ${browseAll?'catalogue':'character-eligible'} matches${rows.length>60?' · Showing first 60; narrow your search':''}</p><div class="sheet-catalog-results">${rows.slice(0,60).map(spell=>`<article><strong>${sheetEscape(spell.name)}</strong> <span>${spell.edition} · ${Number(spell.level)||'Cantrip'} · ${sheetEscape(spell.source)}</span><button type="button" class="sheet-info-button" data-spell-info="${sheetEscape(spell.id)}" aria-label="Information about ${sheetEscape(spell.name)}">i</button><button type="button" data-add-catalog-spell="${sheetEscape(spell.id)}">Add spell</button></article>`).join('')}</div>`;host.querySelectorAll('[data-spell-info]').forEach(button=>button.onclick=()=>openSpellInformation({catalogId:button.dataset.spellInfo}));host.querySelectorAll('[data-add-catalog-spell]').forEach(button=>button.onclick=()=>addCatalogSpells([button.dataset.addCatalogSpell]));};replacement.__adobeFiltered=true;window.renderCatalogSpellResults=replacement;}

  const baseSetupPlay=window.setupCharacterPlayUI;
  window.setupCharacterPlayUI=function(...args){const result=baseSetupPlay?.apply(this,args);setupPages();return result;};
  const baseUpdatePlay=window.updateCharacterPlayUI;
  window.updateCharacterPlayUI=function(derived,...args){const result=baseUpdatePlay?.call(this,derived,...args);updatePages(derived);updateCompanion(derived);cleanFeatTab();updateOverview(derived);setupSpellEligibility();return result;};
  const baseCatalogControls=window.renderSheetCatalogControls;
  if(typeof baseCatalogControls==='function')window.renderSheetCatalogControls=function(...args){const result=baseCatalogControls.apply(this,args);installSpellFilter();setupSpellEligibility();renderCatalogSpellResults();cleanFeatTab();return result;};
  const baseCatalogGrants=window.updateSheetCatalogGrants;
  if(typeof baseCatalogGrants==='function')window.updateSheetCatalogGrants=function(...args){const result=baseCatalogGrants.apply(this,args);cleanFeatTab();return result;};
  installSpellFilter();
})();
