/* Connect private inventory to sheet calculations without copying loot into manual attacks. */
function sheetEquipmentLoot() {
  const s=sheetSession;
  if(!s||activeCampaign?.id!==s.campaignId)return [];
  return inventory.filter(e=>e.characterId===s.characterId&&e.quantity>0).map(e=>({...e,item:inventoryItem(e)})).concat(personalGearEntries());
}
function renderEquipmentCalculations(stats) {
  let host=document.getElementById('sheetEquipmentSummary');
  if(!host)return;
  const e=stats.gear;
  const manualAC=document.querySelector('#characterSheetForm [name="ac"]');
  if(manualAC){manualAC.readOnly=sheetSession.data.equipmentState.acMode==='equipment';manualAC.title=manualAC.readOnly?'Automatic AC is selected in Equipment & treasure. Your manual base is preserved.':'';}
  const magic=stats.magicItems?.reports||[];
  host.innerHTML=`<p><strong>AC ${stats.ac}</strong> = ${sheetEscape(e.baseLabel)} ${e.base} + shield ${e.shield} + item bonuses ${e.bonus} + Defense ${e.defense} + adjustment ${e.adjustment}.</p>${e.sources.length?'<p>'+e.sources.map(v=>sheetEscape(v.name)+' '+CharacterSheetModel.signed(v.value)).join(' · ')+'</p>':''}<p>Attuned: ${e.attuned}/3. Bonuses apply once per item, regardless of quantity.</p>${magic.length?'<p><strong>Active magic items:</strong> '+magic.map(v=>sheetEscape(v.name)+' — '+v.effects.map(sheetEscape).join(', ')).join(' · ')+'</p>':''}${e.warnings.map(w=>`<p class="sheet-build-warning">${sheetEscape(w)}</p>`).join('')}`;
  host=document.getElementById('sheetLootAttacks');
  host.innerHTML=e.attacks.map(a=>`<article class="sheet-repeat"><h4>${sheetEscape(a.name)} · ${a.equipped?'Equipped':'In backpack'} · ${sheetEscape(a.edition)}</h4><div class="sheet-metrics"><div><span>To hit (${a.ability.toUpperCase()}${a.proficient?' + proficiency':''})</span><strong>${a.attack===null?'—':CharacterSheetModel.signed(a.attack)}</strong></div><div><span>Damage</span><strong>${sheetEscape(a.damage)}</strong></div><div><span>Range / reach</span><strong>${sheetEscape(a.range)}</strong></div></div><p>${sheetEscape(a.properties)}</p>${a.notes.map(n=>`<p class="sheet-help">${sheetEscape(n)}</p>`).join('')}</article>`).join('')||'<p class="sheet-help">Loot a weapon to show its attack here. For homebrew, the DM sets its base weapon and bonuses in the item editor.</p>';
}
function equipmentControls(entry) {
  const state=sheetSession.data.equipmentState,c=state.loadout.find(v=>v.id===entry.id)||CharacterEquipment.choices({loadout:[{id:entry.id}]}).loadout[0];
  const item=entry.personal?entry.item:inventoryItem(entry),m=CharacterEquipment.infer(item),p=CharacterEquipment.profile(m,sheetSession.data.build.edition),needsAttunement=(typeof CharacterMagicItems!=='undefined'&&CharacterMagicItems.requiresAttunement(item))||!!item.attunement;
  const el=document.createElement('div');el.className='sheet-equipment-controls';el.dataset.equipmentId=entry.id;
  const select=(label,key,options)=>`<label>${label}<select data-gear="${key}">${options.map(([value,name])=>`<option value="${value}" ${c[key]===value?'selected':''}>${sheetEscape(name)}</option>`).join('')}</select></label>`;
  el.innerHTML=`<label><input type="checkbox" data-gear="equipped" ${c.equipped?'checked':''}> Equipped / worn</label>${needsAttunement?`<label><input type="checkbox" data-gear="attuned" ${c.attuned?'checked':''}> Attuned</label>`:''}${m.kind==='weapon'&&p?select('Attack ability','ability',[['auto','Automatic (STR / DEX)'],...Object.entries(CharacterSheetModel.abilities)])+select('Weapon proficiency','proficiency',[['auto','From class / feats'],['yes','Proficient (other feature / DM)'],['no','Not proficient']])+select('Attack use','mode',[['normal','Normal'],...(p.versatile?[['twoHanded','Two-handed (versatile)']]:[]),...(p.props.includes('thrown')?[['thrown','Thrown']]:[]),...(p.props.includes('light')?[['offhand','Extra Light-weapon attack']]:[]),...(m.base==='lance'?[['mounted','Mounted']]:[])]):''}<small>${m.kind==='none'?'No automatic mechanics configured. Ask the DM to set the equipment fields on this item.':m.inferred?'Standard item recognized by its exact name. DM can customize its mechanics.':'Uses the equipment mechanics set by the DM.'}</small>`;
  el.querySelectorAll('[data-gear]').forEach(input=>input.onchange=()=>{
    readSheetForm();const s=sheetSession;
    if(!sheetEquipmentLoot().some(e=>e.id===entry.id))return;
    const state=s.data.equipmentState;let v=state.loadout.find(v=>v.id===entry.id);
    if(!v){if(state.loadout.length>=200){sheetStatus('Equipment selection limit reached.',true);return;}v=CharacterEquipment.choices({loadout:[{id:entry.id}]}).loadout[0];state.loadout.push(v);}
    if(input.dataset.gear==='attuned'&&input.checked){const owned=sheetEquipmentLoot();const count=state.loadout.filter(v=>v.attuned&&owned.some(e=>e.id===v.id&&(((typeof CharacterMagicItems!=='undefined'&&CharacterMagicItems.requiresAttunement(e.item))||!!e.item.attunement)))).length;if(count>=3){input.checked=false;sheetStatus('You already have three attuned items. End one attunement first.',true);return;}}
    v[input.dataset.gear]=input.type==='checkbox'?input.checked:input.value;
    if(v.equipped&&input.dataset.gear==='equipped'&&['armor','shield'].includes(m.kind))for(const other of state.loadout){const loot=sheetEquipmentLoot().find(e=>e.id===other.id);if(other.id!==v.id&&loot&&CharacterEquipment.infer(loot.item).kind===m.kind)other.equipped=false;}
    s.dirty=true;refreshCharacterSheetInventory();sheetStatus('Unsaved equipment changes');
  });
  return el;
}
function renderItemMechanicsEditor(item) {
  let host=document.getElementById('itemMechanicsEditor');
  if(!host){host=document.createElement('fieldset');host.id='itemMechanicsEditor';host.className='modal-label full';document.querySelector('#itemModal .modal-form-grid').appendChild(host);}
  const m=CharacterEquipment.infer(item||{}),options=[['none','No automatic mechanics'],['accessory','Accessory / other equipment'],['shield','Shield'],...Object.entries(CharacterEquipment.armor).map(([k,v])=>['armor:'+k,v.name+' armor']),...Object.entries(CharacterEquipment.weapons).map(([k,v])=>['weapon:'+k,v.name])];
  const selected=['weapon','armor'].includes(m.kind)?m.kind+':'+m.base:m.kind;
  host.innerHTML=`<legend>Character sheet equipment</legend><p>Set permanent bonuses here. The owner equips the item on their sheet. Conditions, charges and triggered damage remain manual.</p><label>Base equipment<select id="mechanic-base">${options.map(([k,v])=>`<option value="${k}" ${k===selected?'selected':''}>${escapeHtml(v)}</option>`).join('')}</select></label><label>Weapon rules<select id="mechanic-edition"><option value="character">Follow character edition</option><option value="2014">2014</option><option value="2024">2024</option></select></label>${[['acBonus','AC bonus (in addition to armor / shield)'],['attackBonus','Weapon attack bonus'],['damageBonus','Weapon damage bonus']].map(([k,label])=>`<label>${label}<input type="number" id="mechanic-${k}" min="-30" max="30" step="1" value="${m[k]}"></label>`).join('')}${[['damage','Override base weapon dice (e.g. 2d6)'],['damageType','Override damage type'],['extraDamage','Always-on extra damage (e.g. 1d6 fire)'],['notes','Conditional effects / reminders']].map(([k,label])=>`<label>${label}<input id="mechanic-${k}" maxlength="200" value="${escapeHtml(m[k])}"></label>`).join('')}<small>Example: Ring of Protection → Accessory → AC bonus 1, and Requires Attunement. Set only AC here; other effects need their own support. Descriptive properties do not change sheet numbers.</small>`;
  host.querySelector('#mechanic-edition').value=m.edition;
}
function readItemMechanicsEditor() {
  const [kind,base='']=document.getElementById('mechanic-base').value.split(':');
  const raw={kind,base};for(const k of ['edition','acBonus','attackBonus','damageBonus','damage','damageType','extraDamage','notes'])raw[k]=document.getElementById('mechanic-'+k).value;
  for(const k of ['acBonus','attackBonus','damageBonus'])if(!Number.isInteger(Number(raw[k]))||Math.abs(Number(raw[k]))>30)throw Error('Equipment bonuses must be whole numbers between -30 and 30.');
  return CharacterEquipment.normalize(raw);
}

// Watch only the opened character's private loot and the permitted campaign catalogue.
const equipmentSDK=window.__DND_VAULT_DEPS__;
let stopEquipmentWatch=null;
function watchSheetEquipment() {
  stopEquipmentWatch?.();stopEquipmentWatch=null;
  const s=sheetSession, sdk=equipmentSDK;
  if(!s||!sdk.onSnapshot)return;
  const valid=()=>sheetSession===s&&activeCampaign?.id===s.campaignId&&sdk.auth.currentUser;
  const inventoryRef=sdk.collection(sdk.db,'campaigns',s.campaignId,'inventory');
  const filters=[sdk.where('characterId','==',s.characterId)];
  if(!canManageCampaign())filters.push(sdk.where('userId','==',sdk.auth.currentUser.uid));
  const invStop=sdk.onSnapshot(sdk.query(inventoryRef,...filters),snapshot=>{
    if(!valid())return;
    readSheetForm();
    inventory=inventory.filter(e=>e.characterId!==s.characterId).concat(snapshot.docs.map(d=>({...d.data(),id:d.id})));
    refreshCharacterSheetInventory();
  },()=>{
    if(!valid())return;
    inventory=inventory.filter(e=>e.characterId!==s.characterId);
    refreshCharacterSheetInventory();sheetStatus('Live inventory access failed. Equipment bonuses have been cleared; refresh campaign access before saving.',true);
  });
  const itemRef=sdk.collection(sdk.db,'campaigns',s.campaignId,'items');
  const itemStop=sdk.onSnapshot(canManageCampaign()?itemRef:sdk.query(itemRef,sdk.where('visible','==',true)),snapshot=>{
    if(!valid())return;
    readSheetForm();items=snapshot.docs.map(d=>({...d.data(),id:d.id,campaign:activeCampaign.name}));refreshCharacterSheetInventory();
  },()=>{if(valid())sheetStatus('Live item updates failed. Refresh campaign loot to retry.',true);});
  stopEquipmentWatch=()=>{invStop();itemStop();};
}
