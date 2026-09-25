'use strict';
const characterSheetStore = createCharacterSheetStore(window.__DND_VAULT_DEPS__);
let sheetSession = null;
let sheetGeneration = 0;
const sheetEscape = value => escapeHtml(String(value ?? ''));
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
  sheetSession = null;
  const dialog = document.getElementById('characterSheetDialog');
  if (dialog) {
    if (dialog.open)
      dialog.close();
    dialog.remove();
  }
  document.body.classList.remove('printing-character-sheet');
  return true;
}
async function openCharacterSheet(characterId) {
  const character = characters.find(c => c.id === characterId);
  if (!activeCampaign || !character || !canManageCampaign() && character.userId !== auth.currentUser?.uid)
    return;
  if (!closeCharacterSheet())
    return;
  const generation = ++sheetGeneration, campaignId = activeCampaign.id;
  const dialog = document.createElement('dialog');
  dialog.id = 'characterSheetDialog';
  dialog.className = 'character-sheet';
  dialog.setAttribute('aria-labelledby', 'sheetTitle');
  dialog.innerHTML = '<header class="sheet-header"><div><span class="sheet-eyebrow">CHARACTER JOURNAL</span><h2 id="sheetTitle">Opening your sheet\u2026</h2></div><button type="button" data-sheet-close aria-label="Close character sheet">Close</button></header><p role="status" id="sheetStatus">Loading private character data\u2026</p>';
  document.body.appendChild(dialog);
  dialog.showModal();
  dialog.querySelector('[data-sheet-close]').onclick = () => closeCharacterSheet();
  dialog.addEventListener('cancel', event => {
    event.preventDefault();
    closeCharacterSheet();
  });
  try {
    const stored = await characterSheetStore.load(campaignId, characterId);
    if (generation !== sheetGeneration || activeCampaign?.id !== campaignId)
      return;
    if (![
        1,
        2
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
    if (!stored.revision)
      sheetSession.data.build.scoreMode = 'base';
    renderCharacterSheet();
  } catch (error) {
    if (generation === sheetGeneration)
      sheetStatus(`Could not open sheet: ${ error.message }${ error.code === 'permission-denied' ? ' Publish the character-sheet Firestore rules and confirm campaign access.' : '' }`, true);
  }
}
function sheetField(label, path, type = 'text', options = {}) {
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
  dialog.innerHTML = `<form id="characterSheetForm" novalidate><header class="sheet-header"><div><span class="sheet-eyebrow">${ sheetEscape(activeCampaign.name) } · PRIVATE CHARACTER JOURNAL</span><h2 id="sheetTitle">${ sheetEscape(s.character.name) }</h2><p>${ sheetEscape(s.character.class || 'Adventurer') } · Level ${ sheetEscape(s.character.level || 1) }${ s.character.active === false ? ' \xB7 Archived' : '' }</p></div><div class="sheet-actions"><button type="button" id="sheetExport">Export JSON</button><button type="button" id="sheetPrint">Print</button><button type="button" data-sheet-close>Close</button><button type="submit" class="btn-primary" id="sheetSave">Save sheet</button></div></header>
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
      'story',
      'Story & notes'
    ]
  ].map(([key, label], i) => `<button type="button" role="tab" id="sheet-tab-${ key }" data-sheet-tab="${ key }" aria-controls="sheet-${ key }" aria-selected="${ i === 0 }" tabindex="${ i === 0 ? 0 : -1 }">${ label }</button>`).join('') }</nav>
  <div class="sheet-body">
  ${ sheetSection('overview', 'The adventurer', `<div class="sheet-grid sheet-identity">${ field('Character name', 'identity.name') }${ field('Class / subclasses', 'identity.class') }${ field('Level', 'identity.level', 'number', {
    min: 1,
    max: 20
  }) }${ field('Custom race / notes', 'species') }${ field('Background', 'background') }${ field('Alignment', 'alignment') }${ field('Experience', 'experience') }</div><div id="sheetBuildControls"></div><div id="sheetBuildSummary" class="sheet-rule-summary"></div><div class="sheet-metrics"><div><span>Proficiency</span><strong data-derived="pb"></strong></div><div><span>Initiative</span><strong data-derived="initiative"></strong></div><div><span>Passive perception</span><strong data-derived="passive"></strong></div><div><span>Spell save DC</span><strong data-derived="spellDC"></strong></div></div><div class="sheet-grid">${ field('Maximum HP', 'hpMax', 'number', { min: 0 }) }${ field('Current HP', 'hpCurrent', 'number', { min: 0 }) }${ field('Temporary HP', 'hpTemp', 'number', { min: 0 }) }${ field('Armor class', 'ac', 'number', { min: 0 }) }${ field('Speed (ft)', 'speed', 'number', { min: 0 }) }${ field('Inspiration', 'inspiration', 'checkbox') }</div><div class="sheet-hp-tools"><label>Amount <input id="sheetHpAmount" type="number" min="0" step="1" value="1"></label><button type="button" id="sheetDamage">Take damage</button><button type="button" id="sheetHeal">Heal</button><small>Damage uses temporary HP first. Save to keep these changes.</small></div><div class="sheet-grid two">${ field('Features & traits', 'features', 'textarea', { rows: 7 }) }${ field('Limited resources \u2014 maximum / used / recovery', 'resources', 'textarea', { rows: 7 }) }${ field('Languages', 'languages', 'textarea') }${ field('Armor, weapon & tool proficiencies', 'proficiencies', 'textarea') }</div>`) }
  ${ sheetSection('skills', 'Abilities, saving throws & skills', `<div class="sheet-abilities">${ abilityOptions.map(([key, label]) => `<div class="sheet-ability">${ field(label, `abilities.${ key }`, 'number', {
    min: 1,
    max: 30
  }) }<strong data-derived="mods.${ key }"></strong></div>`).join('') }</div><div class="sheet-grid two"><div><h4>Saving throws</h4>${ abilityOptions.map(([key, label]) => `<div class="sheet-check-row"><strong>${ label }</strong>${ field('Proficient', `saves.${ key }.proficient`, 'checkbox') }${ field('Bonus', `saves.${ key }.bonus`, 'number') }<output data-derived="saves.${ key }"></output></div>`).join('') }</div><div><h4>Skills</h4>${ Object.entries(M.skills).map(([key, [label, ability]]) => `<div class="sheet-check-row"><strong>${ label }<small>${ ability.toUpperCase() }</small></strong>${ field('Training', `skills.${ key }.rank`, 'select', {
    values: [
      [
        0,
        'None'
      ],
      [
        0.5,
        'Half'
      ],
      [
        1,
        'Proficient'
      ],
      [
        2,
        'Expertise'
      ]
    ]
  }) }${ field('Bonus', `skills.${ key }.bonus`, 'number') }<output data-derived="skills.${ key }"></output></div>`).join('') }</div></div>${ field('Passive perception bonus', 'passiveBonus', 'number') }`) }
  ${ sheetSection('combat', 'Ready for the next encounter', `<div class="sheet-grid">${ field('Initiative bonus', 'initiativeBonus', 'number') }${ field('Death save successes', 'deathSuccess', 'number', {
    min: 0,
    max: 3
  }) }${ field('Death save failures', 'deathFailure', 'number', {
    min: 0,
    max: 3
  }) }${ field('Hit dice \u2014 total / spent', 'hitDice') }${ field('Conditions', 'conditions') }${ field('Resistances & immunities', 'resistances') }</div><h4>Attacks & actions</h4><p class="sheet-help">Attack bonuses use the chosen ability, proficiency and extra bonus. Enter damage dice and special effects yourself.</p><div id="sheetAttackRows"></div><button type="button" id="sheetAddAttack">+ Add attack</button>`) }
  ${ sheetSection('spells', 'Spellbook', `<div class="sheet-grid">${ field('Spellcasting ability', 'spellAbility', 'select', { values: abilityOptions }) }${ field('Spell attack bonus adjustment', 'spellAttackBonus', 'number') }${ field('Spell save DC adjustment', 'spellDCBonus', 'number') }</div><div class="sheet-metrics"><div><span>Spell attack</span><strong data-derived="spellAttack"></strong></div><div><span>Spell save DC</span><strong data-derived="spellDC"></strong></div></div><h4>Spell slots</h4><p class="sheet-help">Set totals for your class and level. Track spent slots here; recovery and class features are manual.</p><div class="sheet-slot-grid">${ s.data.slots.map((slot, i) => `<div><strong>Level ${ i + 1 }</strong>${ field('Total', `slots.${ i }.max`, 'number', {
    min: 0,
    max: 99
  }) }${ field('Spent', `slots.${ i }.used`, 'number', {
    min: 0,
    max: 99
  }) }</div>`).join('') }</div><h4>Known & prepared spells</h4><div id="sheetSpellRows"></div><button type="button" id="sheetAddSpell">+ Add spell</button>`) }
  ${ sheetSection('inventory', 'Equipment & treasure', `<p class="sheet-help">Campaign loot below comes directly from this character’s inventory. Use the item controls to consume, assign or return loot.</p><div id="sheetInventory" class="character-loot-grid"></div><h4>Coins</h4><div class="sheet-grid">${ [
    'cp',
    'sp',
    'ep',
    'gp',
    'pp'
  ].map(key => field(key.toUpperCase(), `coins.${ key }`, 'number', { min: 0 })).join('') }</div>${ field('Other equipment & supplies', 'equipment', 'textarea', { rows: 8 }) }`) }
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
    [
      'backstory',
      'Backstory'
    ],
    [
      'notes',
      'Session notes'
    ]
  ].map(([key, label]) => field(label, key, 'textarea', { rows: 5 })).join('') }</div>`) }
  </div></form>`;
  renderSheetBuildControls();
  renderSheetRows();
  fillSheetForm();
  refreshCharacterSheetInventory();
  selectSheetTab('overview');
  updateSheetCalculations();
  const form = document.getElementById('characterSheetForm');
  form.addEventListener('input', event => {
    if (!event.target.name)
      return;
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
  dialog.querySelector('[data-sheet-close]').onclick = () => closeCharacterSheet();
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
  dialog.querySelector('#sheetAddAttack').onclick = () => addSheetRow('attacks');
  dialog.querySelector('#sheetAddSpell').onclick = () => addSheetRow('spells');
  dialog.querySelector('#sheetDamage').onclick = () => changeSheetHP('damage');
  dialog.querySelector('#sheetHeal').onclick = () => changeSheetHP('heal');
  dialog.querySelector('#sheetExport').onclick = exportCharacterSheet;
  dialog.querySelector('#sheetPrint').onclick = () => {
    readSheetForm();
    prepareSheetPrint();
    window.print();
  };
}
function selectSheetTab(key) {
  const dialog = document.getElementById('characterSheetDialog');
  if (!dialog)
    return;
  dialog.querySelectorAll('[data-sheet-section]').forEach(panel => panel.hidden = panel.dataset.sheetSection !== key);
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
  document.getElementById('sheetAttackRows').innerHTML = s.data.attacks.map((a, i) => `<article class="sheet-repeat"><div class="sheet-repeat-title"><h4>Attack ${ i + 1 } <output data-derived="attacks.${ i }"></output></h4><button type="button" data-remove-row="attacks" data-index="${ i }">Remove attack</button></div><div class="sheet-grid">${ field('Name', `attacks.${ i }.name`) }${ field('Ability', `attacks.${ i }.ability`, 'select', { values: Object.entries(CharacterSheetModel.abilities) }) }${ field('Proficient', `attacks.${ i }.proficient`, 'checkbox') }${ field('Extra attack bonus', `attacks.${ i }.bonus`, 'number') }${ field('Damage / type', `attacks.${ i }.damage`) }${ field('Range', `attacks.${ i }.range`) }</div>${ field('Description', `attacks.${ i }.notes`, 'textarea') }</article>`).join('');
  document.getElementById('sheetSpellRows').innerHTML = s.data.spells.map((spell, i) => `<article class="sheet-repeat"><div class="sheet-repeat-title"><h4>Spell ${ i + 1 }</h4><button type="button" data-remove-row="spells" data-index="${ i }">Remove spell</button></div><div class="sheet-grid">${ field('Name', `spells.${ i }.name`) }${ field('Level (0 = cantrip)', `spells.${ i }.level`, 'number', {
    min: 0,
    max: 9
  }) }${ field('Prepared', `spells.${ i }.prepared`, 'checkbox') }${ field('Casting time', `spells.${ i }.casting`) }${ field('Range', `spells.${ i }.range`) }${ field('Duration', `spells.${ i }.duration`) }${ field('Components', `spells.${ i }.components`) }</div>${ field('Spell description', `spells.${ i }.notes`, 'textarea') }</article>`).join('');
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
    else
      input.value = value ?? '';
  });
}
function readSheetForm() {
  const s = sheetSession;
  if (!s)
    return;
  const data = structuredClone(s.data);
  data.identity = { ...s.identity || s.character };
  document.querySelectorAll('#characterSheetForm [name]').forEach(input => {
    if (input.name === 'speed' && input.readOnly)
      return;
    const keys = input.name.split('.'), last = keys.pop();
    let target = data;
    for (const key of keys)
      target = target[key];
    target[last] = input.type === 'checkbox' ? input.checked : input.type === 'number' || input.name.endsWith('.rank') ? Number(input.value) : input.value;
  });
  s.identity = {
    name: String(data.identity.name).trim(),
    class: String(data.identity.class).trim(),
    level: Number(data.identity.level)
  };
  s.data = CharacterSheetModel.normalize(data);
}
function updateSheetCalculations() {
  const s = sheetSession;
  if (!s)
    return;
  const d = CharacterSheetModel.derive(s.data, s.identity?.level || s.character.level || 1);
  updateSheetBuildSummary(d);
  document.querySelectorAll('#characterSheetDialog [data-derived]').forEach(el => {
    const path = el.dataset.derived, value = path.split('.').reduce((v, key) => v?.[key], d);
    el.textContent = [
      'spellDC',
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
function changeSheetHP(action) {
  const amount = Number(document.getElementById('sheetHpAmount').value);
  if (!Number.isSafeInteger(amount) || amount < 0) {
    sheetStatus('Enter a non-negative whole number for HP.', true);
    return;
  }
  readSheetForm();
  sheetSession.data = CharacterSheetModel[action](sheetSession.data, amount, sheetSession.identity?.level || sheetSession.character.level);
  sheetSession.dirty = true;
  fillSheetForm();
  updateSheetCalculations();
  sheetStatus('HP updated \u2014 save to keep this change.');
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
  const entries = inventory.filter(entry => entry.characterId === s.characterId);
  if (!entries.length) {
    el.innerHTML = '<p class="sheet-empty">No campaign loot yet. Claim an available item from the Library or ask your DM to assign one.</p>';
    return;
  }
  el.replaceChildren(...entries.map(entry => createCard(inventoryItem(entry), { inventoryEntry: entry })));
  observePendingImages(el);
}
function exportCharacterSheet() {
  if (!sheetSession)
    return;
  readSheetForm();
  const s = sheetSession;
  const blob = new Blob([JSON.stringify({
      format: 'dnd-vault-character-sheet',
      schemaVersion: 2,
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
window.addEventListener('afterprint', () => document.body.classList.remove('printing-character-sheet'));
function prepareSheetPrint() {
  if (!sheetSession)
    return;
  const dialog = document.getElementById('characterSheetDialog');
  dialog.querySelectorAll('.sheet-print-value').forEach(el => el.remove());
  dialog.querySelectorAll('textarea').forEach(input => {
    const mirror = document.createElement('div');
    mirror.className = 'sheet-print-value';
    mirror.textContent = input.value;
    input.after(mirror);
  });
  document.body.classList.add('printing-character-sheet');
}
window.addEventListener('beforeprint', prepareSheetPrint);
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
  document.getElementById('sheetBuildControls').innerHTML = `<h4>Character builder · 2014 rules</h4><p class="sheet-help">The nine base race options in your reference PDF, with SRD 5.1 traits. Choose Custom / manual for other books or homebrew. This builder handles a single class; keep multiclass builds manual.</p><div class="sheet-grid">${ f('Race / subrace', 'build.race', 'select', { values: options(R.races) }) }${ f('Class', 'build.classId', 'select', { values: options(R.classes) }) }${ f('Background', 'build.background', 'select', {
    values: [
      [
        '',
        'Custom / manual'
      ],
      [
        'acolyte',
        'Acolyte'
      ]
    ]
  }) }${ f('How your numbers are entered', 'build.scoreMode', 'select', {
    values: [
      [
        'total',
        'Final totals \u2014 racial ability / HP bonuses already included'
      ],
      [
        'base',
        'Base scores / HP \u2014 add racial bonuses automatically'
      ]
    ]
  }) }${ f('Calculate class spell slots', 'build.autoSlots', 'checkbox') }</div>
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
  <div class="sheet-grid two" data-build-for="hill-dwarf">${ f('Dwarven tool training', 'build.tool', 'select', {
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
  <div class="sheet-grid two" data-build-for="dragonborn">${ f('Draconic ancestry', 'build.dragon', 'select', {
    values: Object.keys(R.dragons).map(key => [
      key,
      key[0].toUpperCase() + key.slice(1)
    ])
  }) }</div>
  <div class="sheet-grid two" id="sheetClassSkills">${ Array.from({ length: 4 }, (_, i) => f(`Class skill ${ i + 1 }`, `build.classSkills.${ i }`, 'select', { values: skillChoices })).join('') }</div>
  <div class="sheet-grid two" id="sheetBackgroundChoices">${ f('Background language 1', 'build.backgroundLanguages.0', 'select', { values: languageChoices }) }${ f('Background language 2', 'build.backgroundLanguages.1', 'select', { values: languageChoices }) }</div>`;
}
function updateSheetBuildSummary(derived) {
  const s = sheetSession;
  if (!s)
    return;
  const b = s.data.build, R = CharacterRules, e = derived.effects, c = e.classData, form = document.getElementById('characterSheetForm');
  form.querySelectorAll('[data-build-for]').forEach(el => el.hidden = !el.dataset.buildFor.split(',').includes(b.race));
  document.getElementById('sheetBackgroundChoices').hidden = b.background !== 'acolyte';
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
  const breath = e.breath ? `<p><strong>Breath weapon:</strong> ${ e.breath.dice }d6 ${ sheetEscape(e.breath.type) } · ${ sheetEscape(e.breath.area) } · ${ e.breath.save.toUpperCase() } save DC ${ 8 + derived.pb + derived.mods.con }. Half damage on success; once per short or long rest.</p>` : '';
  document.getElementById('sheetBuildSummary').innerHTML = `<h4>Calculated from your choices</h4><p>${ b.scoreMode === 'base' ? 'Racial bonuses are added to base abilities and base maximum HP.' : 'Your entered ability scores and maximum HP are treated as final totals; racial bonuses are shown for reference only.' } Manual notes and proficiencies remain separate.</p><div class="sheet-metrics">${ stat('Race bonuses', asi) }${ stat('Walking speed', `${ e.speed } ft`) }${ stat('Size', e.size) }${ stat('Darkvision', e.darkvision ? `${ e.darkvision } ft` : 'None') }${ stat('Effective maximum HP', derived.hpMax) }${ stat('Hit dice', c ? `${ s.identity?.level || s.character.level || 1 }d${ c.die }` : s.data.hitDice || 'Manual') }</div><p><strong>Automatic skills:</strong> ${ sheetEscape(learnedSkills) }</p><p><strong>Class saving throws:</strong> ${ sheetEscape(e.saves.map(key => CharacterSheetModel.abilities[key]).join(', ') || 'Manual') }</p><p><strong>Languages:</strong> ${ sheetEscape(e.languages.join(', ') || 'Manual') }</p><p><strong>Equipment / tool proficiencies:</strong> ${ sheetEscape(e.proficiencies.join(', ') || 'Manual') }</p><p><strong>Resistances:</strong> ${ sheetEscape(e.resistances.join(', ') || 'None from race') }</p><ul>${ e.traits.map(trait => `<li>${ sheetEscape(trait) }</li>`).join('') }</ul>${ breath }${ e.innate.length ? `<p><strong>Granted racial spells:</strong> ${ sheetEscape(e.innate.join('; ')) }</p>` : '' }${ e.pact ? `<p><strong>Pact Magic:</strong> ${ e.pact.count } slot(s), level ${ e.pact.level }; recover on a short or long rest. Mystic Arcanum spells are separate and tracked manually.</p>` : '' }<p class="sheet-help">Class features, subclasses, feats, ASIs from leveling, armor effects and rest recovery still require manual entry. <a href="rules-attribution.html" target="_blank" rel="noopener">Rules source & attribution</a></p>${ e.warnings.length ? `<div class="sheet-build-warning">${ e.warnings.map(w => `<p>${ sheetEscape(w) }</p>`).join('') }</div>` : '' }`;
  for (const [key, label] of Object.entries(CharacterSheetModel.abilities)) {
    const input = form.querySelector(`[name="abilities.${ key }"]`);
    let output = input.parentElement.querySelector('.sheet-ability-total');
    if (!output) {
      output = document.createElement('small');
      output.className = 'sheet-ability-total';
      input.parentElement.appendChild(output);
    }
    output.textContent = `Total ${ derived.scores[key] }${ b.scoreMode === 'base' && e.asi[key] ? ` (includes +${ e.asi[key] } race)` : '' }`;
  }
  const speed = form.querySelector('[name="speed"]');
  speed.readOnly = !!e.race;
  speed.value = e.race ? e.speed : s.data.speed;
}
