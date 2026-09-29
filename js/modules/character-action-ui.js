'use strict';
function closeAttackPicker(){const d=document.getElementById('sheetAttackPicker');if(d){if(d.open)d.close();d.remove();}}
function openAttackPicker(index=null){
 if(!sheetSession)return;readSheetForm();closeAttackPicker();const session=sheetSession,esc=sheetEscape;
 const initial=index===null?null:session.data.actions[index];
 const dialog=document.createElement('dialog');dialog.id='sheetAttackPicker';dialog.className='vault-dialog sheet-attack-picker';dialog.setAttribute('aria-labelledby','sheetAttackPickerTitle');
 dialog.innerHTML=`<header><h2 id="sheetAttackPickerTitle">${initial?'Edit':'Add'} attack / action</h2><button type="button" data-close-attack>Close</button></header><div class="sheet-grid"><label class="sheet-field">Attack source<select id="attackKind"><option value="loot">Owned inventory item</option><option value="weapon">Standard weapon reference</option><option value="cantrip">Selected cantrip</option><option value="spell">Selected spell</option><option value="racial">Species action</option><option value="improvised">Improvised weapon</option><option value="unarmed">Unarmed strike</option><option value="manual">Custom / manual attack</option></select></label><label class="sheet-field" id="attackRefLabel">Choose<select id="attackRef"></select></label><label class="sheet-field" id="attackModeLabel">Use<select id="attackMode"></select></label><label class="sheet-field" id="attackAbilityLabel">Ability<select id="attackAbility"><option value="auto">Automatic</option>${Object.entries(CharacterSheetModel.abilities).map(([v,n])=>`<option value="${v}">${n} (feature override)</option>`).join('')}</select></label><label class="sheet-field" id="attackSlotLabel">Cast at level<select id="attackSlot"></select></label></div><div id="attackManual" hidden class="sheet-grid"><label class="sheet-field">Name<input id="attackName" maxlength="200"></label><label class="sheet-check"><input id="attackProficient" type="checkbox">Proficient</label><label class="sheet-field">Extra to-hit bonus<input id="attackBonus" type="number" value="0" min="-30" max="30"></label><label class="sheet-field">Damage / effect<input id="attackDamage" maxlength="200"></label><label class="sheet-field">Range<input id="attackRange" maxlength="200"></label></div><div id="attackPreview" class="sheet-editor-box" aria-live="polite"></div><p class="sheet-help">Formulas update from current scores and proficiency. Adding an action does not expend ammunition, spell slots or racial uses. Standard weapon references do not grant inventory.</p><p id="attackPickerError" role="alert"></p><button type="button" id="attackConfirm">${initial?'Update':'Add to Overview'}</button>`;
 document.body.appendChild(dialog);dialog.querySelector('[data-close-attack]').onclick=closeAttackPicker;
 const get=id=>dialog.querySelector('#'+id),kind=get('attackKind'),ref=get('attackRef'),mode=get('attackMode'),ability=get('attackAbility'),slot=get('attackSlot');
 const current=()=>({kind:kind.value==='cantrip'?'spell':kind.value,ref:ref.value,mode:mode.value,ability:ability.value,slot:Number(slot.value),name:get('attackName').value});
 const stats=()=>CharacterSheetModel.derive(session.data,session.identity.level,sheetEquipmentLoot());
 function preview(){
  if(sheetSession!==session)return closeAttackPicker();
  const s=stats(),a=current();let result;
  if(kind.value==='manual'){const key=a.ability==='auto'?'str':a.ability;result={available:!!a.name.trim(),name:a.name||'Custom attack',hit:CharacterSheetModel.signed(s.mods[key]+(get('attackProficient').checked?s.pb:0)+(Number(get('attackBonus').value)||0)),damage:get('attackDamage').value||'Enter damage manually',range:get('attackRange').value,notes:['Custom damage is stored as text. Use a supported weapon or spell for automated damage.']};}
  else result=CharacterActions.resolve(a,session.data,session.identity.level,s,sheetEquipmentLoot(),CharacterCatalog.data?.spells||[]);
  get('attackPreview').innerHTML=`<h3>${esc(result.name)}</h3><div class="sheet-spell-heading"><div><small>To hit / save</small><strong>${esc(result.hit)}</strong></div><div><small>Damage / effect</small><strong>${esc(result.damage)}</strong></div><div><small>Range</small><strong>${esc(result.range)}</strong></div></div>${result.ability?`<p>Ability: ${esc(CharacterSheetModel.abilities[result.ability])}</p>`:''}${result.notes.map(n=>`<p class="sheet-help">${esc(n)}</p>`).join('')}`;
  get('attackConfirm').disabled=!result.available||(!ref.value&&['loot','weapon','spell','cantrip','racial'].includes(kind.value));
 }
 function modes(){
  const old=mode.value,a=current(),item=kind.value==='loot'?sheetEquipmentLoot().find(e=>e.id===ref.value)?.item:kind.value==='weapon'?{name:CharacterEquipment.weapons[ref.value]?.name}:null;
  const p=item?CharacterEquipment.profile(CharacterEquipment.infer(item),session.data.build.edition):null;
  let values=[['normal',p?.props.includes('twoHanded')?'Normal (two hands required)':'Normal']];
  if(p?.versatile)values.push(['twoHanded','Two hands (versatile)']);
  if(p?.props.includes('thrown')||kind.value==='improvised'||kind.value==='loot'&&!p)values.push(['thrown','Thrown']);
  if(p?.props.includes('light'))values.push(['offhand','Extra Light-weapon attack']);
  mode.innerHTML=values.map(([v,n])=>`<option value="${v}">${n}</option>`).join('');if(values.some(([v])=>v===old))mode.value=old;
  get('attackModeLabel').hidden=['spell','cantrip','racial','manual'].includes(kind.value);
  const spell=CharacterCatalog.find(ref.value);get('attackSlotLabel').hidden=kind.value!=='spell';
  slot.innerHTML=kind.value==='spell'&&spell?Array.from({length:10-spell.level},(_,i)=>`<option value="${spell.level+i}">${spell.level+i}</option>`).join(''):'';
  preview();
 }
 function choices(){
  let rows=[];const d=stats();
  if(kind.value==='loot')rows=sheetEquipmentLoot().map(e=>[e.id,e.item.name+' · '+e.quantity+' owned']);
  if(kind.value==='weapon')rows=Object.entries(CharacterEquipment.weapons).map(([k,v])=>[k,v.name]);
  if(['spell','cantrip'].includes(kind.value))rows=session.data.spells.map(r=>CharacterCatalog.find(r.catalogId)).filter(s=>s&&(kind.value==='cantrip'?s.level===0:s.level>0)).map(s=>[s.id,s.name+' · '+s.edition]);
  if(kind.value==='racial'&&d.effects.breath)rows=[['breath','Dragonborn breath weapon']];
  ref.innerHTML=rows.length?rows.map(([v,n])=>`<option value="${esc(v)}">${esc(n)}</option>`).join(''):'<option value="">No available choices — select spells / loot / species first</option>';
  get('attackRefLabel').hidden=['improvised','unarmed','manual'].includes(kind.value);get('attackManual').hidden=kind.value!=='manual';get('attackAbilityLabel').hidden=kind.value==='racial';
  modes();
 }
 kind.onchange=()=>{get('attackName').value='';choices();};ref.onchange=modes;for(const el of [mode,ability,slot,...get('attackManual').querySelectorAll('input')])el.addEventListener('input',preview);for(const el of [mode,ability,slot])el.addEventListener('change',preview);
 get('attackConfirm').onclick=()=>{
  if(sheetSession!==session||get('attackConfirm').disabled)return;
  readSheetForm();
  if(kind.value==='manual'){
   if(session.data.attacks.length>=30){get('attackPickerError').textContent='Maximum 30 custom attacks.';return;}
   if(index!==null)session.data.actions.splice(index,1);
   session.data.attacks.push({name:get('attackName').value,ability:ability.value==='auto'?'str':ability.value,proficient:get('attackProficient').checked,bonus:Number(get('attackBonus').value)||0,damage:get('attackDamage').value,range:get('attackRange').value});session.data=CharacterSheetModel.normalize(session.data);renderSheetRows();fillSheetForm();
  }else{
   const value=CharacterActions.normalize([current()])[0];
   if(!value.name)value.name=CharacterActions.resolve(value,session.data,session.identity.level,stats(),sheetEquipmentLoot(),CharacterCatalog.data?.spells||[]).name;
   if(index===null){if(session.data.actions.length>=60){get('attackPickerError').textContent='Maximum 60 automatic actions.';return;}session.data.actions.push(value);}else session.data.actions[index]=value;
  }
  closeAttackPicker();session.dirty=true;updateSheetCalculations();sheetStatus('Attack updated. Save sheet to keep it.');
 };
 if(initial){kind.value=initial.kind==='spell'&&CharacterCatalog.find(initial.ref)?.level===0?'cantrip':initial.kind;choices();if(![...ref.querySelectorAll('option')].some(o=>o.value===initial.ref)){const o=document.createElement('option');o.value=initial.ref;o.textContent='Unavailable saved source';ref.appendChild(o);}ref.value=initial.ref;modes();mode.value=initial.mode;ability.value=initial.ability;slot.value=String(initial.slot||CharacterCatalog.find(initial.ref)?.level||0);get('attackName').value=initial.name;preview();}else choices();
 dialog.showModal();kind.focus();
}
function bindOverviewAttacks(){
 document.getElementById('sheetOverviewAddAttack')?.addEventListener('click',()=>openAttackPicker());
 document.querySelectorAll('[data-edit-action]').forEach(b=>b.onclick=()=>openAttackPicker(Number(b.dataset.editAction)));
 document.querySelectorAll('[data-remove-action]').forEach(b=>b.onclick=()=>{readSheetForm();sheetSession.data.actions.splice(Number(b.dataset.removeAction),1);sheetSession.dirty=true;updateSheetCalculations();sheetStatus('Attack removed. Save to keep changes.');});
}
