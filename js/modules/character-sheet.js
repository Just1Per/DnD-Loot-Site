'use strict';
const characterSheetStore = createCharacterSheetStore(window.__DND_VAULT_DEPS__);
let sheetSession = null;
let sheetGeneration = 0;
const sheetEscape = value => escapeHtml(String(value ?? ''));
function sheetCharacters() {
  return characters.filter(c => canManageCampaign() || c.userId === auth.currentUser?.uid);
}
function renderCharacterSheetChooser(selectedId = sheetSession?.characterId) {
  const host=document.getElementById('characterSheetChooser');
  if(!host)return;
  const choices=sheetCharacters();
  host.innerHTML=`<label for="sheetCharacterSelect">Character sheet</label><select id="sheetCharacterSelect"><option value="">Choose a character</option>${choices.map(c=>`<option value="${sheetEscape(c.id)}" ${c.id===selectedId?'selected':''}>${sheetEscape(c.name)}${c.active===false?' · Archived':''}</option>`).join('')}</select><span>Private to the player and campaign DM</span>`;
  host.querySelector('select').onchange=event=>{if(event.target.value)openCharacterSheet(event.target.value);else renderCharacterSheetChooser();};
}
function renderCharacterSheetTab() {
  renderCharacterSheetChooser();
  if(sheetSession || document.getElementById('characterSheetDialog'))return;
  const choices=sheetCharacters(), character=choices.find(c=>c.id===selectedCharacter?.id)||choices.find(c=>c.userId===auth.currentUser?.uid&&c.active!==false)||choices[0];
  if(character){openCharacterSheet(character.id);return;}
  document.getElementById('characterSheetPage').innerHTML='<div class="sheet-empty"><h2>Your character sheet</h2><p>Create a character in this campaign to start your sheet.</p><button type="button" id="sheetGoToCharacters">Go to My Character</button></div>';
  document.getElementById('sheetGoToCharacters').onclick=()=>showTab('player');
}
function leaveCharacterSheet() {
  if(closeCharacterSheet())showTab('player');
}
function arrangeCharacterSheetPage() {
  const root=document.getElementById('characterSheetDialog'),body=root.querySelector('.sheet-body');
  const builder=document.createElement('section');
  builder.id='sheet-builder';builder.className='sheet-panel';builder.dataset.sheetSection='builder';builder.setAttribute('role','tabpanel');builder.setAttribute('aria-labelledby','sheet-tab-builder');
  builder.innerHTML='<h3>Character builder</h3><p>Set your identity, rules, class and origins here.</p>';
  const overview=document.getElementById('sheet-overview'),identity=root.querySelector('.sheet-identity');
  builder.append(document.getElementById('sheetBuildInfo'),identity,document.getElementById('sheetBuildControls'));
  body.appendChild(builder);
  const vitals=document.createElement('div');vitals.className='sheet-vital-editor';vitals.innerHTML='<h4>Vitals & character details</h4>';
  for(const child of [...overview.children])if(child.tagName!=='H3')vitals.appendChild(child);
  document.getElementById('sheet-combat').querySelector('h3').after(vitals);
  overview.innerHTML='<div id="sheetOverviewReadout"></div>';
  const feats=document.createElement('section');feats.id='sheet-feats';feats.className='sheet-panel';feats.dataset.sheetSection='feats';feats.setAttribute('role','tabpanel');feats.setAttribute('aria-labelledby','sheet-tab-feats');body.appendChild(feats);
  for(const key of ['overview','skills','combat','spells','inventory','builder','feats','story'])body.appendChild(document.getElementById('sheet-'+key));
}
function sheetStatus(message, error = false) {
  const el = document.getElementById('sheetStatus');
  if (!el)
    return;
  el.textContent = message;
  el.classList.toggle('sheet-error', error);
}
function closeCharacterSheet(force = false) {
  if (!force && sheetSession?.dirty && !confirm('Discard unsaved character sheet changes?'))
    return false;
  ++sheetGeneration;
  closeSpellInformation();
  if(typeof closeFeatInformation==='function')closeFeatInformation();
  closeAttackPicker();
  closeSheetPrintDialog();
  if(typeof stopEquipmentWatch!=='undefined'){stopEquipmentWatch?.();stopEquipmentWatch=null;}
  sheetSession = null;
  const dialog = document.getElementById('characterSheetDialog');
  if (dialog) {
    dialog.remove();
  }
  document.body.classList.remove('printing-character-sheet','printing-overview-only');
  document.getElementById('sheetOverviewReadout')?.style.removeProperty('zoom');
  document.getElementById('characterSheetChooser').replaceChildren();
  document.getElementById('characterSheetPage').innerHTML = '<p class="sheet-empty">Choose a character to open their sheet.</p>';
  return true;
}
async function openCharacterSheet(characterId) {
  const character = characters.find(c => c.id === characterId);
  if (!activeCampaign || !character || !canManageCampaign() && character.userId !== auth.currentUser?.uid)
    return;
  if(sheetSession?.characterId===characterId && sheetSession.campaignId===activeCampaign.id){showTab('character-sheet',false);renderCharacterSheetChooser();return;}
  if (!closeCharacterSheet()){renderCharacterSheetChooser();return;}
  const generation = ++sheetGeneration, campaignId = activeCampaign.id;
  const dialog = document.createElement('section');
  dialog.id = 'characterSheetDialog';
  dialog.className = 'character-sheet';
  dialog.setAttribute('aria-labelledby', 'sheetTitle');
  dialog.innerHTML = '<header class="sheet-header"><div><span class="sheet-eyebrow">CHARACTER JOURNAL</span><h2 id="sheetTitle">Opening your sheet\u2026</h2></div><button type="button" data-sheet-close aria-label="Close character sheet">Close</button></header><p role="status" id="sheetStatus">Loading private character data\u2026</p>';
  document.getElementById('characterSheetPage').replaceChildren(dialog);
  renderCharacterSheetChooser(characterId);
  showTab('character-sheet',false);
  dialog.querySelector('[data-sheet-close]').onclick = leaveCharacterSheet;
  try {
    const stored = await characterSheetStore.load(campaignId, characterId);
    if (generation !== sheetGeneration || activeCampaign?.id !== campaignId)
      return;
    if (![
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        10,
        11,
        12,
        13,
        14
      ].includes(stored.schemaVersion))
      throw Error('This sheet uses a newer format. Update the website before editing it.');
    sheetSession = {
      campaignId,
      characterId,
      character: { ...character },
      identity: {
        name: character.name || '',
        class: character.class || '',
        level: Number(character.level) || 1
      },
      revision: stored.revision || 0,
      data: CharacterSheetModel.normalize(stored.data),
      dirty: false,
      saving: false
    };
    if (!stored.revision) {
      sheetSession.data.build.scoreMode = 'base';
      sheetSession.data.build.edition = CampaignRules.editions().includes('2024')?'2024':'2014';
      sheetSession.data.equipmentState.acMode = 'equipment';
    }
    renderCharacterSheet();
    watchSheetEquipment();
  } catch (error) {
    if (generation === sheetGeneration)
      sheetStatus(`Could not open sheet: ${ error.message }${ error.code === 'permission-denied' ? ' Publish the character-sheet Firestore rules and confirm campaign access.' : '' }`, true);
  }
}
function sheetField(label, path, type = 'text', options = {}) {
  if(type==='select'&&typeof CampaignRules!=='undefined'){
    const record=v=>path==='build.edition'?{edition:v}:path==='build.race'?{edition:CharacterRules.races[v]?.edition||'2014'}:path==='build.background'?{edition:CharacterRules.modern.backgrounds[v]?'2024':'2014'}:path==='build.classId'&&v==='artificer'?{edition:'2014'}:null;
    options={...options,values:options.values.filter(([v])=>!v||CampaignRules.allowed(record(v)))};
  }
  const name = sheetEscape(path), attrs = `name="${ name }" ${ options.min !== undefined ? `min="${ options.min }"` : '' } ${ options.max !== undefined ? `max="${ options.max }"` : '' }`;
  const input = type === 'textarea' ? `<textarea ${ attrs } rows="${ options.rows || 3 }"></textarea>` : type === 'select' ? `<select ${ attrs }>${ options.values.map(([v, l]) => `<option value="${ sheetEscape(v) }">${ sheetEscape(l) }</option>`).join('') }</select>` : `<input ${ attrs } type="${ type }" ${ type === 'number' ? 'step="1"' : '' }>`;
  return `<label class="sheet-field ${ type === 'checkbox' ? 'sheet-check' : '' }"><span>${ sheetEscape(label) }</span>${ input }</label>`;
}
function sheetSection(id, title, content) {
  return `<section class="sheet-panel" id="sheet-${ id }" data-sheet-section="${ id }" role="tabpanel" aria-labelledby="sheet-tab-${ id }"><h3>${ title }</h3>${ content }</section>`;
}
function renderCharacterSheet() {
  const s = sheetSession;
  if (!s)
    return;
  const M = CharacterSheetModel, dialog = document.getElementById('characterSheetDialog');
  const abilityOptions = Object.entries(M.abilities), field = sheetField;
  dialog.innerHTML = `<form id="characterSheetForm" novalidate><header class="sheet-header"><div><span class="sheet-eyebrow">${ sheetEscape(activeCampaign.name) } · PRIVATE CHARACTER JOURNAL</span><h2 id="sheetTitle">${ sheetEscape(s.character.name) }</h2><p>${ sheetEscape(s.character.class || 'Adventurer') } · Level ${ sheetEscape(s.character.level || 1) }${ s.character.active === false ? ' \xB7 Archived' : '' }</p></div><div class="sheet-actions"><button type="button" id="sheetExport">Export JSON</button><button type="button" id="sheetPrint">Print</button><button type="button" data-sheet-close>My characters</button><button type="submit" class="btn-primary" id="sheetSave">Save sheet</button></div></header>
  <div class="sheet-feedback"><p id="sheetStatus" role="status" aria-live="polite">${ s.revision ? 'Saved sheet loaded.' : 'New sheet \u2014 fill in your character and save.' }</p><span>Only you and your campaign DM can open this sheet.</span></div>
  <nav class="sheet-tabs" role="tablist" aria-label="Character sheet sections">${ [
    [
      'overview',
      'Overview'
    ],
    [
      'skills',
      'Abilities & skills'
    ],
    [
      'combat',
      'Combat'
    ],
    [
      'spells',
      'Spells'
    ],
    [
      'inventory',
      'Inventory'
    ],
    [
      'builder',
      'Character builder'
    ],
    [
      'feats',
      'Feats'
    ],
    [
      'story',
      'Story'
    ],['notes','Notes']
  ].map(([key, label], i) => `<button type="button" role="tab" id="sheet-tab-${ key }" data-sheet-tab="${ key }" aria-controls="sheet-${ key }" aria-selected="${ i === 0 }" tabindex="${ i === 0 ? 0 : -1 }">${ label }</button>`).join('') }</nav>
  <div class="sheet-body">
  ${ sheetSection('overview', 'The adventurer', `<div class="sheet-grid sheet-identity">${ field('Character name', 'identity.name') }${ field('Level', 'identity.level', 'number', {
    min: 1,
    max: 20
  }) }${ field('Alignment', 'alignment') }${ field('Experience', 'experience') }</div><div id="sheetBuildControls"></div><section id="sheetBuildInfo" class="sheet-build-info"><details id="sheetBuildSummary"><summary id="sheetBuildSummaryTitle">Calculated from your choices</summary><div id="sheetBuildSummaryContent" class="sheet-rule-summary"></div></details><button type="button" id="sheetBuildOverviewToggle" aria-pressed="false">Add to Overview</button></section><div class="sheet-metrics"><div><span>Proficiency</span><strong data-derived="pb"></strong></div><div><span>Initiative</span><strong data-derived="initiative"></strong></div><div><span>Passive perception</span><strong data-derived="passive"></strong></div><div><span>Spell save DC</span><strong data-derived="spellDC"></strong></div></div><div class="sheet-grid two sheet-combat-defenses"><section id="sheetHPDefense" class="sheet-summary-box sheet-defense-panel sheet-hp-panel" aria-label="Maximum hit point calculation"></section><p class="sheet-derived-readout"><span>Armor Class</span><strong><output data-derived="ac"></output></strong><small>Calculated from worn armor, Dexterity, class/race defenses, shield, feats and magic items.</small></p></div>`) }
  ${ sheetSection('skills', 'Abilities, saving throws & skills', `<section class="sheet-summary-box sheet-point-panel">${field('Score method','build.scoreMethod','select',{values:[['manual','Manual / rolled'],['pointBuy','Point buy']]})}<div id="sheetPointBuySummary" aria-live="polite"></div></section><div id="sheetScoreModeNotice" class="sheet-help"></div><div class="sheet-abilities">${abilityOptions.map(([key,label])=>`<article class="sheet-ability"><h4>${label}</h4><strong data-ability-score="${key}" aria-label="Effective ${label} score"></strong><div class="sheet-ability-mod">Modifier <output data-derived="mods.${key}"></output></div>${field('Base score',`abilities.${key}`,'number',{min:1,max:30})}<p class="sheet-ability-breakdown" data-ability-breakdown="${key}"></p></article>`).join('')}</div>
  <div class="sheet-training-layout"><section class="sheet-editor-box"><h4>Saving throws</h4>${abilityOptions.map(([key,label])=>`<div class="sheet-check-row sheet-save-row"><strong>${label}</strong>${field('Proficient',`saves.${key}.proficient`,'checkbox')}${field('Bonus',`saves.${key}.bonus`,'number')}<output data-derived="saves.${key}"></output></div>`).join('')}${field('Passive perception bonus','passiveBonus','number')}</section>
  <section class="sheet-editor-box"><h4>Skills</h4><p class="sheet-help">Choose a circle; click it again to clear your manual choice. Automatic training from your character cannot be lowered here.</p><div class="sheet-skill-heading"><span>Skill</span><span>Half</span><span>Proficient</span><span>Expertise</span><span>Total</span></div>${Object.entries(M.skills).map(([key,[label,ability]])=>`<div class="sheet-skill-edit" data-skill-row="${key}"><span>${label} <small>${ability.toUpperCase()}</small><small data-skill-source="${key}"></small></span><input type="hidden" name="skills.${key}.rank" value="0">${[[0.5,'Half'],[1,'Proficient'],[2,'Expertise']].map(([rank,name])=>`<button type="button" class="sheet-skill-orb" data-skill="${key}" data-rank="${rank}" aria-label="${label}: ${name}" aria-pressed="false"><span aria-hidden="true"></span></button>`).join('')}<output data-derived="skills.${key}"></output></div>`).join('')}
  <details class="sheet-skill-adjustments"><summary>Additional skill bonuses</summary><div class="sheet-grid">${Object.entries(M.skills).map(([key,[label]])=>field(label,`skills.${key}.bonus`,'number')).join('')}</div></details></section></div>`) }
  ${ sheetSection('combat', 'Ready for the next encounter', `<h4>Weapons from loot</h4><div id="sheetLootAttacks"></div><h4>Manual attacks & actions</h4><p class="sheet-help">Attack bonuses use the chosen ability, proficiency and extra bonus. Enter damage dice and special effects yourself.</p><div id="sheetAttackRows"></div><button type="button" id="sheetAddAttack">+ Add attack</button>`) }
  ${ sheetSection('spells', 'Spellbook', `<div class="sheet-grid">${ field('Spellcasting ability', 'spellAbility', 'select', { values: abilityOptions }) }${ field('Spell attack bonus adjustment', 'spellAttackBonus', 'number') }${ field('Spell save DC adjustment', 'spellDCBonus', 'number') }</div><div class="sheet-metrics"><div><span>Spell attack</span><strong data-derived="spellAttack"></strong></div><div><span>Spell save DC</span><strong data-derived="spellDC"></strong></div></div><h4>Spell slots</h4><p class="sheet-help">Set totals for your class and level. Track spent slots here; recovery and class features are manual.</p><div class="sheet-slot-grid">${ s.data.slots.map((slot, i) => `<div><strong>Level ${ i + 1 }</strong>${ field('Total', `slots.${ i }.max`, 'number', {
    min: 0,
    max: 99
  }) }${ field('Spent', `slots.${ i }.used`, 'number', {
    min: 0,
    max: 99
  }) }</div>`).join('') }</div><h4>Known & prepared spells</h4><div id="sheetSpellRows"></div><button type="button" id="sheetAddSpell">+ Add spell</button>`) }
  ${ sheetSection('inventory', 'Equipment & treasure', `<p class="sheet-help">Add starting gear, packs, and supplies directly to this character. Armor Class is calculated automatically from the equipment you wear and eligible character features. Campaign loot is included automatically.</p><div id="sheetInventory" class="character-loot-grid"></div><div id="sheetCoinSource" class="sheet-grid">${ [
    'cp',
    'sp',
    'ep',
    'gp',
    'pp'
  ].map(key => field(key.toUpperCase(), `coins.${ key }`, 'number', { min: 0 })).join('') }</div>${ field('Equipment notes', 'equipment', 'textarea', { rows: 8 }) }`) }
  ${ sheetSection('story', 'The person behind the adventure', `<div class="sheet-grid two">${ [
    [
      'appearance',
      'Appearance'
    ],
    [
      'personality',
      'Personality'
    ],
    [
      'ideals',
      'Ideals'
    ],
    [
      'bonds',
      'Bonds'
    ],
    [
      'flaws',
      'Flaws'
    ],
    [
      'allies',
      'Allies & organizations'
    ],
    ['enemies', 'Enemies'],
    [
      'backstory',
      'Backstory'
    ],

  ].map(([key, label]) => field(label, key, 'textarea', { rows: 5 })).join('') }</div>`) }
  ${sheetSection('notes','Adventure journal','<div id="sheetJournal"></div>')}
  </div></form>`;
  arrangeCharacterSheetPage();
  renderSheetBuildControls();
  moveOriginFeatControls();
  refineCharacterBuilder();
  setupCharacterPlayUI();
  setupCharacterJournal();
  if (typeof renderSheetCatalog === 'function') renderSheetCatalog();
  renderSheetRows();
  fillSheetForm();
  bindSkillOrbs();
  refreshCharacterSheetInventory();
  selectSheetTab('overview');
  updateSheetCalculations();
  const form = document.getElementById('characterSheetForm');
  form.addEventListener('input', event => {
    if (!event.target.name)
      return;
    delete event.target.dataset.archivedValue;
    readSheetForm();
    if (event.target.name === 'build.classId' && CharacterRules.classes[s.data.build.classId]) {
      const selected = CharacterRules.classes[s.data.build.classId];
      s.identity.class = selected.name;
      form.querySelector('[name="identity.class"]').value = selected.name;
      if (selected.ability) {
        s.data.spellAbility = selected.ability;
        form.querySelector('[name="spellAbility"]').value = selected.ability;
      }
    }
    s.dirty = true;
    sheetStatus('Unsaved changes');
    updateSheetCalculations();
  });
  form.addEventListener('change', event => {
    if (!event.target.name)
      return;
    delete event.target.dataset.archivedValue;
    readSheetForm();
    if (event.target.name === 'build.classId' && CharacterRules.classes[s.data.build.classId]) {
      const selected = CharacterRules.classes[s.data.build.classId];
      s.identity.class = selected.name;
      form.querySelector('[name="identity.class"]').value = selected.name;
      if (selected.ability) {
        s.data.spellAbility = selected.ability;
        form.querySelector('[name="spellAbility"]').value = selected.ability;
      }
    }
    s.dirty = true;
    sheetStatus('Unsaved changes');
    updateSheetCalculations();
  });
  form.addEventListener('submit', event => {
    event.preventDefault();
    saveCharacterSheet();
  });
  dialog.querySelector('[data-sheet-close]').onclick = leaveCharacterSheet;
  dialog.querySelectorAll('[data-sheet-tab]').forEach(button => {
    button.onclick = () => selectSheetTab(button.dataset.sheetTab);
    button.onkeydown = event => {
      const tabs = [...dialog.querySelectorAll('[data-sheet-tab]')], i = tabs.indexOf(button);
      let next;
      if (event.key === 'ArrowRight')
        next = (i + 1) % tabs.length;
      if (event.key === 'ArrowLeft')
        next = (i + tabs.length - 1) % tabs.length;
      if (event.key === 'Home')
        next = 0;
      if (event.key === 'End')
        next = tabs.length - 1;
      if (next !== undefined) {
        event.preventDefault();
        selectSheetTab(tabs[next].dataset.sheetTab);
        tabs[next].focus();
      }
    };
  });
  dialog.querySelector('#sheetAddAttack').onclick = () => openAttackPicker();
  dialog.querySelector('#sheetAddSpell').onclick = () => addSheetRow('spells');
  dialog.querySelector('#sheetExport').onclick = exportCharacterSheet;
  dialog.querySelector('#sheetPrint').onclick = () => {
    readSheetForm();
    openSheetPrintDialog();
  };
}
function selectSheetTab(key) {
  const dialog = document.getElementById('characterSheetDialog');
  if (!dialog)
    return;
  dialog.querySelector('.sheet-body').classList.toggle('sheet-readonly-page',key==='overview');
  dialog.querySelectorAll('[data-sheet-section]').forEach(panel => panel.hidden = panel.dataset.sheetSection!==key);
  dialog.querySelectorAll('[data-sheet-tab]').forEach(button => {
    const selected = button.dataset.sheetTab === key;
    button.setAttribute('aria-selected', String(selected));
    button.tabIndex = selected ? 0 : -1;
  });
}
function renderSheetRows() {
  const s = sheetSession, field = sheetField;
  if (!s)
    return;
  document.getElementById('sheetAttackRows').innerHTML = s.data.attacks.map((a, i) => `<article class="sheet-repeat"><div class="sheet-repeat-title"><h4>Attack ${ i + 1 } <output data-derived="attacks.${ i }"></output></h4><button type="button" data-remove-row="attacks" data-index="${ i }">Remove attack</button></div><div class="sheet-grid">${ field('Name', `attacks.${ i }.name`) }${ field('Ability', `attacks.${ i }.ability`, 'select', { values: Object.entries(CharacterSheetModel.abilities) }) }${ field('Proficient', `attacks.${ i }.proficient`, 'checkbox') }${ field('Ranged weapon (not a spell)', `attacks.${ i }.rangedWeapon`, 'checkbox') }${ field('Extra attack bonus', `attacks.${ i }.bonus`, 'number') }${ field('Damage / type', `attacks.${ i }.damage`) }${ field('Range', `attacks.${ i }.range`) }</div>${ field('Description', `attacks.${ i }.notes`, 'textarea') }</article>`).join('');
  document.getElementById('sheetSpellRows').innerHTML = s.data.spells.map((spell, i) => `<article class="sheet-repeat"><div class="sheet-repeat-title"><h4>Spell ${ i + 1 } <button type="button" class="sheet-info-button" data-spell-info-index="${i}" aria-label="Spell information">i</button></h4><button type="button" data-remove-row="spells" data-index="${ i }">Remove spell</button></div><div class="sheet-grid">${ field('Name', `spells.${ i }.name`) }${ field('Level (0 = cantrip)', `spells.${ i }.level`, 'number', {
    min: 0,
    max: 9
  }) }${ field('Prepared', `spells.${ i }.prepared`, 'checkbox') }${ field('Casting time', `spells.${ i }.casting`) }${ field('Range', `spells.${ i }.range`) }${ field('Duration', `spells.${ i }.duration`) }${ field('Components', `spells.${ i }.components`) }</div>${ field('Spell description', `spells.${ i }.notes`, 'textarea') }</article>`).join('');
  document.querySelectorAll('[data-spell-info-index]').forEach(button=>button.onclick=()=>openSpellInformation({index:Number(button.dataset.spellInfoIndex)}));
  document.querySelectorAll('#characterSheetDialog [data-remove-row]').forEach(button => button.onclick = () => {
    readSheetForm();
    s.data[button.dataset.removeRow].splice(Number(button.dataset.index), 1);
    s.dirty = true;
    renderSheetRows();
    fillSheetForm();
    updateSheetCalculations();
    sheetStatus('Unsaved changes');
  });
}
function fillSheetForm() {
  if (!sheetSession)
    return;
  const data = {
    ...sheetSession.data,
    identity: sheetSession.identity || sheetSession.character
  };
  document.querySelectorAll('#characterSheetForm [name]').forEach(input => {
    const value = input.name.split('.').reduce((v, key) => v?.[key], data);
    if (input.type === 'checkbox')
      input.checked = !!value;
    else {
      if(input.tagName==='SELECT'&&value&&!Array.from(input.options).some(o=>o.value===String(value))){input.dataset.archivedValue=String(value);if(!Array.from(input.options).some(o=>o.value===''))input.insertAdjacentHTML('afterbegin','<option value="">Existing choice unavailable in this campaign</option>');input.value='';}
      else {delete input.dataset.archivedValue;input.value = value ?? '';}
    }
  });
}
function readSheetForm() {
  const s = sheetSession;
  if (!s)
    return;
  // Restore all nested sections (including persisted Adobe settings) before reading fields.
  const data = structuredClone(CharacterSheetModel.normalize(s.data));
  data.identity = { ...s.identity || s.character };
  document.querySelectorAll('#characterSheetForm [name]').forEach(input => {
    // Feats page owns these choices; legacy hidden selects cannot represent every source feat.
    if(input.closest('[data-feat-catalogue-managed="true"]'))return;
    if(input.dataset.archivedValue)return;
    const keys = input.name.split('.'), last = keys.pop();
    let target = data;
    for (const key of keys)
      target = target[key];
    target[last] = input.type === 'checkbox' ? input.checked : input.type === 'number' || input.name.endsWith('.rank') ? Number(input.value) : input.value;
  });
  if(!canManageCampaign())data.advancement.asiSpent=CharacterPlayRules.normalizeAdvancement(s.data.advancement).asiSpent;
  s.identity = {
    name: String(data.identity.name).trim(),
    class: String(data.identity.class).trim(),
    level: Number(data.identity.level)
  };
  s.data = CharacterSheetModel.normalize(data);
  renderCharacterJournal();
}
function updateSheetCalculations() {
  const s = sheetSession;
  if (!s)
    return;
  const d = CharacterSheetModel.derive(s.data, s.identity?.level || s.character.level || 1, sheetEquipmentLoot());
  renderEquipmentCalculations(d);
  updateSheetBuildSummary(d);
  renderCharacterOverview(d);
  updateCharacterPortrait();
  updateCharacterPlayUI(d);
  updateInventoryTotals(d);
  renderInventoryDefense(d);
  if (typeof updateSheetCatalogGrants === 'function') updateSheetCatalogGrants();
  document.querySelectorAll('#characterSheetDialog [data-derived]').forEach(el => {
    const path = el.dataset.derived, value = path.split('.').reduce((v, key) => v?.[key], d);
    el.textContent = [
      'spellDC',
      'ac',
      'effects.speed',
      'passive'
    ].includes(path) ? value : CharacterSheetModel.signed(value);
  });
}
function addSheetRow(key) {
  readSheetForm();
  const s = sheetSession;
  if (s.data[key].length >= (key === 'attacks' ? 30 : 150)) {
    sheetStatus('The maximum number of rows has been reached.', true);
    return;
  }
  s.data[key].push({});
  s.data = CharacterSheetModel.normalize(s.data);
  s.dirty = true;
  renderSheetRows();
  fillSheetForm();
  updateSheetCalculations();
  sheetStatus('Unsaved changes');
  document.querySelector(`#${ key === 'attacks' ? 'sheetAttackRows' : 'sheetSpellRows' } article:last-child input`)?.focus();
}
async function saveCharacterSheet() {
  const s = sheetSession;
  if (!s || s.saving)
    return;
  const form = document.getElementById('characterSheetForm');
  const invalid = [...form.querySelectorAll('input,select,textarea')].find(input => !input.checkValidity());
  if (invalid) {
    selectSheetTab(invalid.closest('[data-sheet-section]').dataset.sheetSection);
    invalid.reportValidity();
    return;
  }
  readSheetForm();
  if (!s.identity.name) {
    sheetStatus('Enter a character name.', true);
    return;
  }
  if (!Number.isInteger(s.identity.level) || s.identity.level < 1 || s.identity.level > 20) {
    sheetStatus('Level must be from 1 to 20.', true);
    return;
  }
  if (s.data.slots.some((slot, i) => Number(form.querySelector(`[name="slots.${ i }.used"]`).value) > slot.max)) {
    sheetStatus('Spent spell slots cannot exceed the total.', true);
    return;
  }
  const identity = { ...s.identity }, data = structuredClone(s.data), version = JSON.stringify({
      identity,
      data
    });
  s.saving = true;
  document.getElementById('sheetSave').disabled = true;
  sheetStatus('Saving\u2026');
  try {
    const revision = await characterSheetStore.save({
      campaignId: s.campaignId,
      characterId: s.characterId,
      revision: s.revision,
      data,
      identity,
      previousIdentity: s.character
    });
    if (sheetSession !== s || activeCampaign?.id !== s.campaignId)
      return;
    s.revision = revision;
    s.character = {
      ...s.character,
      ...identity
    };
    readSheetForm();
    s.dirty = version !== JSON.stringify({
      identity: s.identity,
      data: s.data
    });
    const character = characters.find(c => c.id === s.characterId);
    if (character)
      Object.assign(character, identity);
    if (selectedCharacter?.id === s.characterId)
      Object.assign(selectedCharacter, identity);
    document.getElementById('sheetTitle').textContent = identity.name;
    renderCharacterList();
    renderDMCharacters();
    populateOwnerFilter();
    sheetStatus(s.dirty ? 'Saved. Newer edits are still unsaved.' : 'All changes saved.');
  } catch (error) {
    if (sheetSession === s)
      sheetStatus(`Could not save: ${ error.message }`, true);
  } finally {
    s.saving = false;
    if (sheetSession === s)
      document.getElementById('sheetSave').disabled = false;
  }
}
function refreshCharacterSheetInventory() {
  const s = sheetSession, el = document.getElementById('sheetInventory');
  if (!s || !el || activeCampaign?.id !== s.campaignId)
    return;
  renderSheetGearPicker();
  renderCharacterInventory();
  updateSheetCalculations();
}
function exportCharacterSheet() {
  if (!sheetSession)
    return;
  readSheetForm();
  const s = sheetSession;
  const blob = new Blob([JSON.stringify({
      format: 'dnd-vault-character-sheet',
      schemaVersion: 11,
      character: s.identity,
      campaign: activeCampaign.name,
      data: s.data,
      inventory: inventory.filter(e => e.characterId === s.characterId)
    }, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob), link = document.createElement('a');
  link.href = url;
  link.download = (s.identity.name.replace(/[^a-z0-9_-]/gi, '_') || 'character') + '-sheet.json';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
window.addEventListener('beforeunload', event => {
  if (sheetSession?.dirty) {
    event.preventDefault();
    event.returnValue = '';
  }
});
function clearSheetPrintSelection() {
  document.querySelectorAll('#characterSheetDialog [data-sheet-section].sheet-print-excluded').forEach(panel=>panel.classList.remove('sheet-print-excluded'));
}
window.addEventListener('afterprint', () => {
  document.body.classList.remove('printing-character-sheet','printing-overview-only');
  document.getElementById('sheetOverviewReadout')?.style.removeProperty('zoom');
  clearSheetPrintSelection();
});
function prepareSheetPrint(selectedSections = null) {
  if (!sheetSession || document.getElementById('tab-character-sheet').style.display === 'none')
    return;
  const dialog = document.getElementById('characterSheetDialog');
  clearSheetPrintSelection();
  if (selectedSections instanceof Set) {
    dialog.querySelectorAll('[data-sheet-section]').forEach(panel=>{
      panel.classList.toggle('sheet-print-excluded',!selectedSections.has(panel.dataset.sheetSection));
    });
  }
  dialog.querySelectorAll('.sheet-print-value').forEach(el => el.remove());
  dialog.querySelectorAll('textarea').forEach(input => {
    const mirror = document.createElement('div');
    mirror.className = 'sheet-print-value';
    mirror.textContent = input.value;
    input.after(mirror);
  });
  document.body.classList.add('printing-character-sheet');
  document.body.classList.toggle('printing-overview-only',selectedSections instanceof Set&&selectedSections.size===1&&selectedSections.has('overview'));
}
function sheetPrintPageOptions() {
  const dialog=document.getElementById('characterSheetDialog');
  if(!dialog)return[];
  return [...dialog.querySelectorAll('[data-sheet-section]')].map(panel=>{
    const key=panel.dataset.sheetSection;
    const tab=[...dialog.querySelectorAll('[data-sheet-tab]')].find(button=>button.dataset.sheetTab===key);
    const heading=panel.querySelector(':scope > h3');
    return {key,label:(tab?.textContent||heading?.textContent||key).trim()};
  });
}
function closeSheetPrintDialog() {
  const printDialog=document.getElementById('sheetPrintDialog');
  if(printDialog?.open)printDialog.close();
  printDialog?.remove();
}
function openSheetPrintDialog() {
  if(!sheetSession)return;
  closeSheetPrintDialog();
  const pages=sheetPrintPageOptions();
  if(!pages.length)return;
  const printDialog=document.createElement('dialog');
  printDialog.id='sheetPrintDialog';
  printDialog.className='vault-dialog sheet-print-dialog';
  printDialog.setAttribute('aria-labelledby','sheetPrintDialogTitle');
  printDialog.innerHTML=`<form method="dialog" class="sheet-print-dialog-card">
    <header><div><span class="sheet-eyebrow">PRINT CHARACTER SHEET</span><h2 id="sheetPrintDialogTitle">Choose pages to print</h2><p>Select the character-sheet sections you want included.</p></div><button type="button" data-print-close aria-label="Close">×</button></header>
    <div class="sheet-print-dialog-tools"><button type="button" data-print-overview>One-page Overview</button><button type="button" data-print-all>Select all</button><button type="button" data-print-none>Clear all</button><span data-print-count></span></div>
    <div class="sheet-print-page-grid">${pages.map((page,i)=>`<label class="sheet-print-page-option"><input type="checkbox" value="${sheetEscape(page.key)}" ${page.key==='overview'?'checked':''}><span><strong>${sheetEscape(page.label)}</strong><small>Page ${i+1}</small></span></label>`).join('')}</div>
    <p class="sheet-print-dialog-note">Your browser print window will open after this. You can still choose printer, copies, orientation and paper size there.</p>
    <footer><button type="button" data-print-cancel>Cancel</button><button type="button" class="btn-primary" data-print-confirm>Print selected pages</button></footer>
  </form>`;
  document.body.appendChild(printDialog);
  const checks=[...printDialog.querySelectorAll('input[type="checkbox"]')];
  const count=printDialog.querySelector('[data-print-count]');
  const confirm=printDialog.querySelector('[data-print-confirm]');
  const update=()=>{const n=checks.filter(box=>box.checked).length;count.textContent=n+' of '+checks.length+' selected';confirm.disabled=n===0;};
  checks.forEach(box=>box.addEventListener('change',update));
  printDialog.querySelector('[data-print-overview]').onclick=()=>{checks.forEach(box=>box.checked=box.value==='overview');update();};
  printDialog.querySelector('[data-print-all]').onclick=()=>{checks.forEach(box=>box.checked=true);update();};
  printDialog.querySelector('[data-print-none]').onclick=()=>{checks.forEach(box=>box.checked=false);update();};
  printDialog.querySelector('[data-print-close]').onclick=closeSheetPrintDialog;
  printDialog.querySelector('[data-print-cancel]').onclick=closeSheetPrintDialog;
  printDialog.addEventListener('cancel',event=>{event.preventDefault();closeSheetPrintDialog();});
  confirm.onclick=()=>{
    const selected=new Set(checks.filter(box=>box.checked).map(box=>box.value));
    if(!selected.size)return;
    closeSheetPrintDialog();
    prepareSheetPrint(selected);
    window.print();
  };
  update();
  printDialog.showModal();
}
window.addEventListener('beforeprint', () => {
  if (!document.body.classList.contains('printing-character-sheet')) prepareSheetPrint(new Set(['overview']));
});
function renderSheetBuildControls() {
  const R = CharacterRules, M = CharacterSheetModel, f = sheetField;
  const options = object => [
    [
      '',
      'Custom / manual'
    ],
    ...Object.entries(object).map(([key, value]) => [
      key,
      value.name
    ])
  ];
  const abilityChoices = [
    [
      '',
      'Choose ability'
    ],
    ...Object.entries(M.abilities).filter(([key]) => key !== 'cha')
  ];
  const skillChoices = [
    [
      '',
      'Choose skill'
    ],
    ...Object.entries(M.skills).map(([key, [label]]) => [
      key,
      label
    ])
  ];
  const languageChoices = [
    [
      '',
      'Choose language'
    ],
    ...R.languages.map(name => [
      name,
      name
    ])
  ];
  document.getElementById('sheetBuildControls').innerHTML = `<h4>Character builder</h4><p class="sheet-help">Choices follow the editions allowed by your campaign DM. Existing saved choices are retained when their edition is hidden. In 2024, ability increases come from your background, including when using a legacy race. Class levels, multiclassing and subclasses are managed below. Expanded-book options are labelled with their source; mechanics that are not yet automated stay clearly marked as source/manual.</p><div class="sheet-grid">${ f('Rules version', 'build.edition', 'select', {
    values: [
      [
        '2024',
        '2024 \u2014 current'
      ],
      [
        '2014',
        '2014 \u2014 legacy'
      ]
    ]
  }) }${ f('Race / species', 'build.race', 'select', { values: options(R.races) }) }${ f('Class', 'build.classId', 'select', { values: options(R.classes) }) }${ f('Background', 'build.background', 'select', {
    values: [
      [
        '',
        'Custom / manual'
      ],
      ...Object.entries(R.modern.backgrounds).map(([id, bg]) => [
        id,
        bg.name + ' \u2014 2024'
      ]),
      ...Object.entries(CharacterBackgrounds.legacy).map(([id,bg])=>[id,bg.name+' — 2014'])
    ]
  }) }<input type="hidden" name="build.scoreMode" value="base">${ f('Calculate class spell slots', 'build.autoSlots', 'checkbox') }</div><div class="sheet-grid" id="sheetManualIdentity">${ f('Custom class / subclasses', 'identity.class') }${ f('Custom race', 'species') }${ f('Custom background', 'background') }</div>
  <div class="sheet-grid two" data-build-for="half-elf">${ f('Ability +1 choice 1', 'build.abilityChoices.0', 'select', { values: abilityChoices }) }${ f('Ability +1 choice 2', 'build.abilityChoices.1', 'select', { values: abilityChoices }) }${ f('Racial skill choice 1', 'build.skillChoices.0', 'select', { values: skillChoices }) }${ f('Racial skill choice 2', 'build.skillChoices.1', 'select', { values: skillChoices }) }</div>
  <div class="sheet-grid two" data-build-for="human,half-elf,high-elf">${ f('Extra race language', 'build.extraLanguage', 'select', { values: languageChoices }) }</div>
  <div class="sheet-grid two" data-build-for="high-elf">${ f('Wizard cantrip (Intelligence)', 'build.cantrip', 'select', {
    values: [
      [
        '',
        'Choose cantrip'
      ],
      ...R.cantrips.map(name => [
        name,
        name
      ])
    ]
  }) }</div>
  <div class="sheet-grid two" data-build-for="hill-dwarf,mountain-dwarf">${ f('Dwarven tool training', 'build.tool', 'select', {
    values: [
      [
        '',
        'Choose tool'
      ],
      ...[
        'Smith\u2019s tools',
        'Brewer\u2019s supplies',
        'Mason\u2019s tools'
      ].map(name => [
        name,
        name
      ])
    ]
  }) }</div>
  <div class="sheet-grid two" data-build-for="dragonborn,dragonborn-2024">${ f('Draconic ancestry', 'build.dragon', 'select', {
    values: Object.keys(R.dragons).map(key => [
      key,
      key[0].toUpperCase() + key.slice(1)
    ])
  }) }</div>
  <div class="sheet-grid two" id="sheetRaceChoices">
  ${ f('Ability bonus pattern', 'build.asiPattern', 'select', {
    values: [
      [
        '21',
        '+2 and +1'
      ],
      [
        '111',
        '+1, +1 and +1'
      ]
    ]
  }) }
  ${ [
    0,
    1,
    2
  ].map(i => f(`Ability bonus ${ i + 1 }`, `build.flexibleChoices.${ i }`, 'select', {
    values: [
      [
        '',
        'Choose ability'
      ],
      ...Object.entries(M.abilities)
    ]
  })).join('') }
  ${ f('Race size', 'build.raceSize', 'select', {
    values: [
      [
        '',
        'Choose size'
      ],
      [
        'Small',
        'Small'
      ],
      [
        'Medium',
        'Medium'
      ]
    ]
  }) }
  ${ f('Racial feature', 'build.raceFeature', 'select', {
    values: [[
        '',
        'Choose feature'
      ]]
  }) }
  ${ f('Second racial feature (level 5)', 'build.raceFeature2', 'select', {
    values: [[
        '',
        'Choose feature'
      ]]
  }) }
  ${ [
    0,
    1
  ].map(i => f(`Race skill ${ i + 1 }`, `build.raceSkills.${ i }`, 'select', { values: skillChoices })).join('') }
  ${ [
    0,
    1
  ].map(i => f(`Race tool / weapon ${ i + 1 }`, `build.raceTools.${ i }`, 'select', {
    values: [[
        '',
        'Choose proficiency'
      ]]
  })).join('') }
  ${ f('Racial spell / feature ability', 'build.raceAbility', 'select', {
    values: [
      [
        '',
        'Choose ability'
      ],
      ...Object.entries(M.abilities).filter(([key]) => [
        'int',
        'wis',
        'cha'
      ].includes(key))
    ]
  }) }
  ${ f('Racial cantrip', 'build.raceCantrip', 'select', {
    values: [[
        '',
        'Choose cantrip'
      ]]
  }) }
  ${ f('Racial feat (apply effects manually)', 'build.raceFeat') }
  </div>
  <div class="sheet-grid two" id="sheetModernOrigin">
  ${ f('Background ability pattern', 'build.backgroundPattern', 'select', {
    values: [
      [
        '21',
        '+2 and +1'
      ],
      [
        '111',
        '+1, +1 and +1'
      ]
    ]
  }) }
  ${ [
    0,
    1,
    2
  ].map(i => f(`Background ability ${ i + 1 }`, `build.backgroundAbilities.${ i }`, 'select', {
    values: [
      [
        '',
        'Choose ability'
      ],
      ...Object.entries(M.abilities)
    ]
  })).join('') }
  ${ [
    0,
    1
  ].map(i => f(`Standard language ${ i + 1 }`, `build.standardLanguages.${ i }`, 'select', {
    values: [
      [
        '',
        'Choose language'
      ],
      ...R.modern.standardLanguages.map(n => [
        n,
        n
      ])
    ]
  })).join('') }
  ${ f('Background Origin feat', 'build.backgroundFeat', 'select', {
    values: [
      [
        '',
        'Choose Origin feat'
      ],
      ...R.modern.originFeats.map(n => [
        n,
        n
      ])
    ]
  }) }
  ${ f('Human additional Origin feat', 'build.humanOriginFeat', 'select', {
    values: [
      [
        '',
        'Choose Origin feat'
      ],
      ...R.modern.originFeats.map(n => [
        n,
        n
      ])
    ]
  }) }
  ${ [
    'background',
    'human'
  ].map(scope => [
    0,
    1,
    2
  ].map(i => f(`${ scope === 'human' ? 'Human' : 'Background' } Skilled proficiency ${ i + 1 }`, `build.${ scope }FeatChoices.${ i }`, 'select', {
    values: [
      [
        '',
        'Choose skill or tool'
      ],
      ...Object.entries(M.skills).map(([id, [name]]) => [
        'skill:' + id,
        name
      ]),
      ...R.tools.map(n => [
        'tool:' + n,
        n
      ])
    ]
  })).join('')).join('') }
  </div>
  <div class="sheet-grid two" id="sheetClassSkills">${ Array.from({ length: 4 }, (_, i) => f(`Class skill ${ i + 1 }`, `build.classSkills.${ i }`, 'select', { values: skillChoices })).join('') }</div>
  <div id="sheetBackgroundSummary" class="sheet-rule-summary"></div><div id="sheetBackgroundTraining" class="sheet-grid">${[0,1].map(i=>f('Background tool choice '+(i+1),`build.backgroundTools.${i}`,'select',{values:[['','Choose tool'],...R.tools.map(t=>[t,t]),['Additional language','Additional language']]})).join('')}${[0,1].map(i=>f('Replacement background skill '+(i+1),`build.backgroundReplacementSkills.${i}`,'select',{values:skillChoices})).join('')}</div>
  <div class="sheet-grid two" id="sheetBackgroundChoices">${ f('Background language 1', 'build.backgroundLanguages.0', 'select', { values: languageChoices }) }${ f('Background language 2', 'build.backgroundLanguages.1', 'select', { values: languageChoices }) }</div>`;
  const raceSelect = document.querySelector('[name="build.race"]');
  raceSelect.innerHTML = '<option value="">Custom / manual</option>' + [
    '2024',
    'Common',
    'Exotic',
    'Monstrous',
    'Setting specific',
    'Custom'
  ].map(category => `<optgroup label="${ sheetEscape(category) }">${ Object.entries(R.races).filter(([, r]) => r.category === category&&CampaignRules.allowed({edition:r.edition||'2014'})).sort((a, b) => a[1].name.localeCompare(b[1].name)).map(([id, r]) => `<option value="${ sheetEscape(id) }">${ sheetEscape(r.name) } — ${ sheetEscape((r.edition === '2024' ? '2024 · ' : '2014 · ') + (r.source || r.book || 'D&D')) }</option>`).join('') }</optgroup>`).join('');
  raceSelect.querySelectorAll('optgroup').forEach(group=>{if(!group.querySelector('option'))group.remove();});
  const backgroundSelect = document.querySelector('[name="build.background"]');
  const expandedBackgrounds = Object.entries(CharacterBackgrounds.expanded || {});
  const backgroundGroups = [
    ['2024 Player’s Handbook', Object.entries(R.modern.backgrounds)],
    ['Current expanded D&D', expandedBackgrounds.filter(([,bg])=>bg.edition==='2024')],
    ['2014 Player’s Handbook', Object.entries(CharacterBackgrounds.legacy)],
    ['Legacy expanded D&D', expandedBackgrounds.filter(([,bg])=>bg.edition==='2014')]
  ];
  backgroundSelect.innerHTML = '<option value="">Custom / manual</option>' + backgroundGroups.map(([label,rawEntries]) => {const entries=rawEntries.filter(([,bg])=>CampaignRules.backgroundAllowed({...bg,edition:bg.edition||(label.includes('2024')?'2024':'2014')}));return entries.length ? `<optgroup label="${sheetEscape(label)}">${entries.sort((a,b)=>a[1].name.localeCompare(b[1].name)).map(([id,bg]) =>
      `<option value="${sheetEscape(id)}">${sheetEscape(bg.name)} — ${sheetEscape(CharacterBackgrounds.sourceName(bg))}</option>`
    ).join('')}</optgroup>` : ''
  }).join('');
}
function updateSheetBuildSummary(derived) {
  const s = sheetSession;
  if (!s)
    return;
  const b = s.data.build, R = CharacterRules, e = derived.effects, c = e.classData, form = document.getElementById('characterSheetForm');
  form.querySelectorAll('[data-build-for]').forEach(el => el.hidden = !el.dataset.buildFor.split(',').includes(b.race));
  const race = e.race, baseRace = R.races[b.race], level = s.identity?.level || s.character.level || 1;
  const show = (name, visible) => {
    const el = form.querySelector(`[name="${ name }"]`);
    el.closest('label').hidden = !visible;
    return el;
  };
  const setOptions = (name, values, value, prompt) => {
    const el = form.querySelector(`[name="${ name }"]`), html = `<option value="">${ sheetEscape(prompt) }</option>` + values.map(([key, label]) => `<option value="${ sheetEscape(key) }">${ sheetEscape(label) }</option>`).join('');
    if (el.dataset.options !== html) {
      el.innerHTML = html;
      el.dataset.options = html;
    }
    el.value = value;
  };
  show('build.asiPattern', b.edition === '2014' && race?.flexible);
  const bonuses = b.edition === '2024' ? [] : race?.flexible ? b.asiPattern === '111' ? [
    1,
    1,
    1
  ] : [
    2,
    1
  ] : race?.choiceBonuses || [];
  for (let i = 0; i < 3; i++) {
    const el = show(`build.flexibleChoices.${ i }`, i < bonuses.length);
    el.closest('label').querySelector('span').textContent = `Ability bonus +${ bonuses[i] || 1 }`;
    for (const option of el.querySelectorAll('option'))
      option.disabled = race?.excludeAbilities?.includes(option.value) || false;
  }
  show('build.raceSize', race?.sizeChoice);
  show('build.raceFeature', baseRace?.optionChoices && level >= (baseRace.optionLevel || 1));
  setOptions('build.raceFeature', Object.entries(baseRace?.optionChoices || {}).map(([key, o]) => [
    key,
    o.name
  ]), b.raceFeature, 'Choose feature');
  show('build.raceFeature2', baseRace?.secondOptionChoices && level >= (baseRace.secondOptionLevel || 1));
  setOptions('build.raceFeature2', Object.entries(baseRace?.secondOptionChoices || {}).filter(([key]) => key !== b.raceFeature).map(([key, o]) => [
    key,
    o.name
  ]), b.raceFeature2, 'Choose feature');
  for (let i = 0; i < 2; i++) {
    const el = show(`build.raceSkills.${ i }`, i < (race?.skillCount || 0));
    const pool = race?.skillPool === 'any' ? Object.keys(CharacterSheetModel.skills) : race?.skillPool || [];
    for (const option of el.querySelectorAll('option'))
      option.disabled = !!option.value && (!pool.includes(option.value) || (race?.skills || []).includes(option.value));
    show(`build.raceTools.${ i }`, i < (race?.toolCount || 0));
    const toolPool = race?.instrumentOnly ? R.instruments : race?.weaponTool ? [
      ...R.tools,
      ...R.weapons
    ] : R.tools;
    setOptions(`build.raceTools.${ i }`, toolPool.map(t => [
      t,
      t
    ]), b.raceTools[i], 'Choose proficiency');
  }
  show('build.raceAbility', race?.spellChoice || race?.cantripPool || race?.spells?.some(spell => spell.ability === 'choice'));
  show('build.raceCantrip', race?.cantripPool);
  setOptions('build.raceCantrip', (race?.cantripPool === 'sorcerer' ? [
    ...R.cantrips,
    'Blade Ward',
    'Friends'
  ] : race?.cantripPool || []).map(n => [
    n,
    n
  ]), b.raceCantrip || race?.defaultCantrip || '', 'Choose cantrip');
  show('build.raceFeat', false);
  const extra = form.querySelector('[name="build.extraLanguage"]');
  extra.closest('[data-build-for]').hidden = !race?.extraLanguage && ![
    'human',
    'half-elf',
    'high-elf'
  ].includes(b.race);
  for (const option of extra.querySelectorAll('option'))
    option.disabled = !!option.value && (e.race?.languagePool ? !e.race.languagePool.includes(option.value) : false);
  updateBackgroundControls(derived);
  for (const name of [
      'build.abilityChoices.0',
      'build.abilityChoices.1'
    ])
    show(name, b.race === 'half-elf' && b.edition === '2014');
  show('identity.class', !b.classId);
  show('species', !b.race);
  show('background', !b.background);
  document.getElementById('sheetModernOrigin').hidden = b.edition !== '2024';
  const bg = CharacterBackgrounds.get(b.background);
  for (let i = 0; i < 3; i++) {
    const el = show(`build.backgroundAbilities.${ i }`, b.backgroundPattern === '111' || i < 2);
    el.closest('label').querySelector('span').textContent = `Background ability +${ b.backgroundPattern === '111' || i === 1 ? 1 : 2 }`;
    for (const option of el.querySelectorAll('option'))
      option.disabled = !!option.value && !!bg?.abilities?.length && !bg.abilities.includes(option.value);
  }
  show('build.backgroundFeat', false);
  show('build.humanOriginFeat', false);
  for (let i = 0; i < 3; i++) {
    show(`build.backgroundFeatChoices.${ i }`, false);
    show(`build.humanFeatChoices.${ i }`, false);
  }
  for (const option of form.querySelector('[name="build.race"]').querySelectorAll('option'))
    option.disabled = b.edition === '2014' && R.races[option.value]?.edition === '2024';
  for (const option of form.querySelector('[name="build.background"]').querySelectorAll('option')) {
    const optionBackground = CharacterBackgrounds.get(option.value);
    option.disabled = b.edition === '2014' && optionBackground?.edition === '2024';
  }
  for (let i = 0; i < 4; i++) {
    const input = form.querySelector(`[name="build.classSkills.${ i }"]`), available = c ? c.skills === 'any' ? Object.keys(CharacterSheetModel.skills) : c.skills : [];
    input.closest('label').hidden = !c || i >= c.count;
    for (const option of input.querySelectorAll('option'))
      option.disabled = !!option.value && !available.includes(option.value);
  }
  if (e.slotMax)
    for (let i = 0; i < 9; i++) {
      const max = form.querySelector(`[name="slots.${ i }.max"]`), used = form.querySelector(`[name="slots.${ i }.used"]`);
      max.value = e.slotMax[i];
      used.max = e.slotMax[i];
      max.readOnly = true;
    }
  else
    for (let i = 0; i < 9; i++) {
      form.querySelector(`[name="slots.${ i }.max"]`).readOnly = false;
      form.querySelector(`[name="slots.${ i }.used"]`).max = 99;
    }
  const stat = (label, value) => `<div><span>${ sheetEscape(label) }</span><strong>${ sheetEscape(value) }</strong></div>`;
  const asi = Object.entries(e.asi).map(([key, value]) => `${ key.toUpperCase() } +${ value }`).join(', ') || 'None';
  const learnedSkills = e.skills.map(key => CharacterSheetModel.skills[key]?.[0] || key).join(', ') || 'None';
  const breath = e.breath ? `<p><strong>Breath weapon:</strong> ${ e.breath.dice }d${ e.breath.die || 6 } ${ sheetEscape(e.breath.type) } · ${ sheetEscape(e.breath.area) } · ${ e.breath.save.toUpperCase() } save DC ${ 8 + derived.pb + derived.mods.con }. Half damage on success; ${ sheetEscape(e.breath.usage || 'once per short or long rest') }.</p>` : '';
  const raceInfo = race ? `<p><strong>${ sheetEscape(race.name) }</strong> · ${ sheetEscape(race.source) } · ${ sheetEscape(race.creatureType) }${ race.url ? ` · <a href="${ sheetEscape(race.url) }" target="_blank" rel="noopener">Race reference</a>` : '' }</p>${race.partial?'<p class="sheet-help">Expanded source option: supported statistics are calculated here; source-specific conditional mechanics remain manual until their rules adapter is added.</p>':''}` : '';
  const movement = [
    [
      'Flight',
      e.fly
    ],
    [
      'Swim',
      e.swim
    ],
    [
      'Climb',
      e.climb
    ]
  ].filter(([, n]) => n).map(([label, n]) => `${ label } ${ n } ft`).join(' \xB7 ');
  const naturalAC = e.naturalArmor ? e.naturalArmor.base + (e.naturalArmor.ability ? derived.mods[e.naturalArmor.ability] : 0) : null;
  const additional = `${ movement ? `<p><strong>Other movement:</strong> ${ sheetEscape(movement) }. See racial restrictions below.</p>` : '' }${ naturalAC !== null ? `<p><strong>Natural armor reference:</strong> AC ${ naturalAC } before shield or other effects. The automatic AC engine compares this against other legal formulas.</p>` : '' }${ e.immunities.length ? `<p><strong>Immunities:</strong> ${ sheetEscape(e.immunities.join(', ')) }</p>` : '' }${ e.raceAbility ? `<p><strong>Racial magic / feature:</strong> ${ sheetEscape(e.raceAbility.toUpperCase()) } · DC ${ 8 + derived.pb + derived.mods[e.raceAbility] } · spell attack ${ CharacterSheetModel.signed(derived.pb + derived.mods[e.raceAbility]) }</p>` : '' }`;
  document.getElementById('sheetBuildSummaryTitle').textContent='Calculated from your choices · '+b.edition;
  const overviewToggle=document.getElementById('sheetBuildOverviewToggle'),pinned=s.data.adobe?.showCalculatedOnOverview===true;
  overviewToggle.textContent=pinned?'Remove from Overview':'Add to Overview';overviewToggle.setAttribute('aria-pressed',String(pinned));
  document.getElementById('sheetBuildSummaryContent').innerHTML = `${ raceInfo }${ additional }<p><strong>Class:</strong> ${ sheetEscape(c ? c.name + ' \u2014 ' + b.edition : 'Custom / manual') } · <strong>Background:</strong> ${ sheetEscape(bg ? bg.name + ' — ' + CharacterBackgrounds.sourceName(bg) : 'Custom / manual') }</p>${ e.originFeats?.length ? `<p><strong>Origin feats:</strong> ${ sheetEscape(e.originFeats.join(', ')) }</p>` : '' }<p>${ b.scoreMode === 'base' ? 'Origin bonuses are added to base abilities (up to 20) and base maximum HP.' : 'Your entered ability scores and maximum HP are treated as final totals; origin bonuses are shown for reference only.' } Manual notes and proficiencies remain separate.</p><div class="sheet-metrics">${ stat(b.edition === '2024' ? 'Background bonuses' : 'Race bonuses', asi) }${ stat('Walking speed', `${ e.speed } ft`) }${ stat('Size', e.size) }${ stat('Darkvision', e.darkvision ? `${ e.darkvision } ft` : 'None') }${ stat('Effective maximum HP', derived.hpMax) }${ stat('Hit dice', derived.progression?.hitDice || s.data.hitDice || 'Manual') }</div><p><strong>Automatic skills:</strong> ${ sheetEscape(learnedSkills) }</p><p><strong>Class saving throws:</strong> ${ sheetEscape(e.saves.map(key => CharacterSheetModel.abilities[key]).join(', ') || 'Manual') }</p><p><strong>Languages:</strong> ${ sheetEscape(e.languages.join(', ') || 'Manual') }</p><p><strong>Equipment / tool proficiencies:</strong> ${ sheetEscape(e.proficiencies.join(', ') || 'Manual') }</p><p><strong>Resistances:</strong> ${ sheetEscape(e.resistances.join(', ') || 'None from race') }</p><ul>${ e.traits.map(trait => `<li>${ sheetEscape(trait) }</li>`).join('') }</ul>${ breath }${ e.innate.length ? `<p><strong>Granted racial spells:</strong> ${ sheetEscape(e.innate.join('; ')) }</p>` : '' }${ e.pact ? `<p><strong>Pact Magic:</strong> ${ e.pact.count } slot(s), level ${ e.pact.level }; recover on a short or long rest. Mystic Arcanum spells are separate and tracked manually.</p>` : '' }<p class="sheet-help">Traits below are reminders, not action buttons. Conditional bonuses, racial attacks, class features and unsupported conditional effects require manual entry. PB means proficiency bonus. <a href="rules-attribution.html" target="_blank" rel="noopener">Rules source & attribution</a></p>${ e.warnings.length ? `<div class="sheet-build-warning">${ e.warnings.map(w => `<p>${ sheetEscape(w) } ${CharacterBuildValidation.check(s.data,derived,s.identity).issues.some(issue=>issue.message===w)?`<button type="button" data-sheet-fix-message="${sheetEscape(w)}">Fix</button>`:''}</p>`).join('') }</div>` : '' }`;
  document.querySelectorAll('[data-sheet-fix-message]').forEach(button=>button.onclick=()=>focusSheetBuildIssue(CharacterBuildValidation.check(s.data,derived,s.identity).issues.find(issue=>issue.message===button.dataset.sheetFixMessage)));
  updateAbilityAndSkillControls(derived);
}
