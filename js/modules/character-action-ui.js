'use strict';
function closeAttackPicker(){const d=document.getElementById('sheetAttackPicker');if(d){if(d.open)d.close();d.remove();}}
function openAttackPicker(index=null){
 if(!sheetSession)return;readSheetForm();closeAttackPicker();const session=sheetSession,esc=sheetEscape;
 const initial=index===null?null:session.data.actions[index];
 const dialog=document.createElement('dialog');dialog.id='sheetAttackPicker';dialog.className='vault-dialog sheet-attack-picker';dialog.setAttribute('aria-labelledby','sheetAttackPickerTitle');
 dialog.innerHTML=`<header><h2 id="sheetAttackPickerTitle">${initial?'Edit':'Add'} attack / action</h2><button type="button" data-close-attack>Close</button></header><div class="sheet-grid"><label class="sheet-field">Attack source<select id="attackKind"><option value="loot">Owned inventory item</option><option value="weapon">Standard weapon reference</option><option value="cantrip">Selected cantrip</option><option value="spell">Selected spell</option><option value="granted-spell">Granted spell (class, race or feat)</option><option value="racial">Species action</option><option value="improvised">Improvised weapon</option><option value="unarmed">Unarmed strike</option><option value="grapple">Grapple</option><option value="shove">Shove</option><option value="manual">Custom / manual attack</option></select></label><label class="sheet-field" id="attackRefLabel">Choose<select id="attackRef"></select></label><label class="sheet-field" id="attackModeLabel">Use<select id="attackMode"></select></label><label class="sheet-field" id="attackAbilityLabel">Ability<select id="attackAbility"><option value="auto">Automatic</option>${Object.entries(CharacterSheetModel.abilities).map(([v,n])=>`<option value="${v}">${n} (feature override)</option>`).join('')}</select></label><label class="sheet-field" id="attackSlotLabel">Cast at level<select id="attackSlot"></select></label></div><div id="attackManual" hidden class="sheet-grid"><label class="sheet-field">Name<input id="attackName" maxlength="200"></label><label class="sheet-check"><input id="attackProficient" type="checkbox">Proficient</label><label class="sheet-field">Extra to-hit bonus<input id="attackBonus" type="number" value="0" min="-30" max="30"></label><label class="sheet-field">Damage / effect<input id="attackDamage" maxlength="200"></label><label class="sheet-field">Range<input id="attackRange" maxlength="200"></label></div><div id="attackPreview" class="sheet-editor-box" aria-live="polite"></div><p class="sheet-help">Formulas update from current scores and proficiency. Adding an action does not expend ammunition, spell slots or racial uses. Standard weapon references do not grant inventory.</p><p id="attackPickerError" role="alert"></p><button type="button" id="attackConfirm">${initial?'Update':'Add to Overview'}</button>`;
 document.body.appendChild(dialog);dialog.querySelector('[data-close-attack]').onclick=closeAttackPicker;
 const get=id=>dialog.querySelector('#'+id),kind=get('attackKind'),ref=get('attackRef'),mode=get('attackMode'),ability=get('attackAbility'),slot=get('attackSlot');
 const current=()=>({kind:kind.value==='cantrip'?'spell':kind.value,ref:ref.value,mode:mode.value,ability:ability.value,slot:Number(slot.value),name:get('attackName').value});
 const stats=()=>CharacterSheetModel.derive(session.data,session.identity.level,sheetEquipmentLoot());
 function preview(){
  if(sheetSession!==session)return closeAttackPicker();
  const s=stats(),a=current();let result;
  if(kind.value==='manual'){const key=a.ability==='auto'?'str':a.ability;result={available:!!a.name.trim(),name:a.name||'Custom attack',hit:CharacterSheetModel.signed(s.mods[key]+(get('attackProficient').checked?s.pb:0)+(Number(get('attackBonus').value)||0)),damage:get('attackDamage').value||'Enter damage manually',range:get('attackRange').value,notes:['Custom damage is stored as text. Use a supported weapon or spell for automated damage.']};}
  else {const typed=['spell','cantrip','granted-spell'].includes(kind.value),candidate=typed?CharacterAttackAccess.spells(session.data,session.identity.level,s).find(row=>row.kind===a.kind&&row.ref===a.ref):null,projected=candidate?.assignClass?{...session.data,spells:session.data.spells.map((row,i)=>i===candidate.rowIndex?{...row,classId:candidate.classId}:row)}:session.data;result=typed&&!candidate?{available:false,name:a.name||'Unavailable saved spell',hit:'—',damage:'—',range:'—',notes:['This spell has no current class, level, race or feat access. Choose an available source.']}:CharacterActions.resolve(a,projected,session.identity.level,s,sheetEquipmentLoot(),CharacterCatalog.data?.spells||[]);}
  get('attackPreview').innerHTML=`<h3>${esc(result.name)}</h3><div class="sheet-spell-heading"><div><small>To hit / save</small><strong>${esc(result.hit)}</strong></div><div><small>Damage / effect</small><strong>${esc(result.damage)}</strong></div><div><small>Range</small><strong>${esc(result.range)}</strong></div></div>${result.ability?`<p>Ability: ${esc(CharacterSheetModel.abilities[result.ability])}</p>`:''}${result.notes.map(n=>`<p class="sheet-help">${esc(n)}</p>`).join('')}`;
  get('attackConfirm').disabled=!result.available||(!ref.value&&['loot','weapon','spell','cantrip','racial'].includes(kind.value));
 }
 function modes(){
  const old=mode.value,a=current(),item=kind.value==='loot'?sheetEquipmentLoot().find(e=>e.id===ref.value)?.item:kind.value==='weapon'&&CharacterEquipment.weapons[ref.value]?{name:CharacterEquipment.weapons[ref.value].name}:null;
  const cleaver=(ref.value==='barbarian-elemental-cleaver'||ref.value.startsWith('barbarian-cleaver-owned:'))?CharacterBarbarianSubclasses.context(session.data,{level:session.identity.level}).pick('cleaver-weapon'):'';
  const p=cleaver?CharacterEquipment.weapons[cleaver]:item?CharacterEquipment.profile(CharacterEquipment.infer(item),session.data.build.edition):null;
  const props=Array.isArray(p?.props)?p.props:[];
  let values=[['normal',props.includes('twoHanded')?'Normal (two hands required)':'Normal']];
  if(p?.versatile)values.push(['twoHanded','Two hands (versatile)']);
  if(ref.value==='barbarian-elemental-cleaver'||ref.value.startsWith('barbarian-cleaver-owned:')||props.includes('thrown')||kind.value==='improvised'||kind.value==='loot'&&!p)values.push(['thrown','Thrown']);
  if(props.includes('light'))values.push(['offhand','Extra Light-weapon attack']);
  mode.innerHTML=values.map(([v,n])=>`<option value="${v}">${n}</option>`).join('');if(values.some(([v])=>v===old))mode.value=old;
  get('attackModeLabel').hidden=['spell','cantrip','racial','manual','grapple','shove','granted-spell'].includes(kind.value);
  const spell=CharacterCatalog.find(CharacterActions.spellReference(ref.value).spellId);get('attackSlotLabel').hidden=kind.value!=='spell';
  slot.innerHTML=kind.value==='spell'&&spell?Array.from({length:10-spell.level},(_,i)=>`<option value="${spell.level+i}">${spell.level+i}</option>`).join(''):'';
  preview();
 }
 function choices(){
  let rows=[];const d=stats();
  if(kind.value==='loot')rows=sheetEquipmentLoot().map(e=>[e.id,e.item.name+' · '+e.quantity+' owned']);
  if(kind.value==='weapon')rows=[...Object.entries(CharacterEquipment.weapons).map(([k,v])=>[k,v.name]),...(globalThis.CharacterBarbarianSubclasses?.attackReferences(session.data,{level:session.identity.level,loot:sheetEquipmentLoot()})||[]).map(r=>[r.ref,r.name])];
  if(['spell','cantrip'].includes(kind.value))rows=CharacterAttackAccess.spells(session.data,session.identity.level,d).filter(row=>row.kind==='spell'&&(kind.value==='cantrip'?row.spell.level===0:row.spell.level>0)).map(row=>[row.ref,row.spell.name+' · '+row.source]);
  if(kind.value==='granted-spell')rows=CharacterAttackAccess.spells(session.data,session.identity.level,d).filter(row=>row.kind==='granted-spell').map(row=>[row.ref,row.spell.name+' · '+row.source]);
  if(kind.value==='racial'&&d.effects.breath)rows=[['breath','Dragonborn breath weapon']];
  ref.innerHTML=rows.length?rows.map(([v,n])=>`<option value="${esc(v)}">${esc(n)}</option>`).join(''):'<option value="">No available choices — select spells / loot / species first</option>';
  get('attackRefLabel').hidden=['improvised','unarmed','manual','grapple','shove'].includes(kind.value);get('attackManual').hidden=kind.value!=='manual';get('attackAbilityLabel').hidden=['racial','grapple','shove','granted-spell'].includes(kind.value);
  modes();
 }
 kind.onchange=()=>{get('attackName').value='';choices();};ref.onchange=modes;for(const el of [mode,ability,slot,...get('attackManual').querySelectorAll('input')])el.addEventListener('input',preview);for(const el of [mode,ability,slot])el.addEventListener('change',preview);
 get('attackConfirm').onclick=()=>{
  if(sheetSession!==session||get('attackConfirm').disabled)return;
  readSheetForm();
  if(kind.value==='manual'){
   if(session.data.attacks.length>=30){get('attackPickerError').textContent='Maximum 30 custom attacks.';return;}
   if(index!==null)session.data.actions.splice(index,1);
   session.data.attacks.push({...(initial?.id?{id:initial.id}:{}),name:get('attackName').value,ability:ability.value==='auto'?'str':ability.value,proficient:get('attackProficient').checked,bonus:Number(get('attackBonus').value)||0,damage:get('attackDamage').value,range:get('attackRange').value});session.data=CharacterSheetModel.normalize(session.data);renderSheetRows();fillSheetForm();
  }else{
   const value=CharacterActions.normalize([current()])[0],candidate=['spell','granted-spell'].includes(value.kind)?CharacterAttackAccess.spells(session.data,session.identity.level,stats()).find(row=>row.kind===value.kind&&row.ref===value.ref):null;if(['spell','granted-spell'].includes(value.kind)&&!candidate){get('attackPickerError').textContent='This spell is no longer accessible. Reopen attack choices.';return;}if(candidate?.assignClass)session.data.spells[candidate.rowIndex].classId=candidate.classId;if(initial?.id)value.id=initial.id;
   if(!value.name)value.name=CharacterActions.resolve(value,session.data,session.identity.level,stats(),sheetEquipmentLoot(),CharacterCatalog.data?.spells||[]).name;
   if(index===null){if(session.data.actions.length>=60){get('attackPickerError').textContent='Maximum 60 automatic actions.';return;}session.data.actions.push(value);}else session.data.actions[index]=value;
  }
  closeAttackPicker();session.dirty=true;updateSheetCalculations();sheetStatus('Attack updated. Save sheet to keep it.');
 };
 if(initial){const parsed=CharacterActions.spellReference(initial.ref);kind.value=initial.kind==='spell'&&CharacterCatalog.find(parsed.spellId)?.level===0?'cantrip':initial.kind;choices();const options=[...ref.querySelectorAll('option')];let selected=options.find(option=>option.value===initial.ref);if(!selected&&initial.kind==='spell')selected=options.find(option=>{const candidate=CharacterActions.spellReference(option.value);return candidate.spellId===parsed.spellId&&(!parsed.classId||candidate.classId===parsed.classId)});if(!selected){selected=document.createElement('option');selected.value=initial.ref;selected.textContent='Unavailable saved source';ref.appendChild(selected);}ref.value=selected.value;modes();mode.value=initial.mode;ability.value=initial.ability;slot.value=String(initial.slot||CharacterCatalog.find(parsed.spellId)?.level||0);get('attackName').value=initial.name;preview();}else choices();
 dialog.showModal();kind.focus();
}
function bindOverviewAttacks(){
 document.getElementById('sheetOverviewAddAttack')?.addEventListener('click',()=>openAttackPicker());
 document.querySelectorAll('[data-edit-action]').forEach(b=>b.onclick=()=>openAttackPicker(Number(b.dataset.editAction)));
 document.querySelectorAll('[data-remove-action]').forEach(b=>b.onclick=()=>{readSheetForm();sheetSession.data.actions.splice(Number(b.dataset.removeAction),1);sheetSession.dirty=true;updateSheetCalculations();sheetStatus('Attack removed. Save to keep changes.');});
}

function attackActionSummaryMarkup(d,help=false){
 const lines=CharacterAttackProgression.describe(d.attackAction);if(!lines.length)return'';
 return '<div class="sheet-attack-action-summary" data-attack-action-summary><strong'+(help?' data-context-help="attack action" data-help-label="Attack action"':'')+'>'+sheetEscape(lines[0])+'</strong>'+lines.slice(1).map(line=>'<p class="sheet-help">'+(line.startsWith('With your pact weapon:')?'<strong>'+sheetEscape(line)+'</strong>':sheetEscape(line))+'</p>').join('')+'</div>';
}
function renderAttackActionSummary(d){
 const panel=document.getElementById('sheet-combat');if(!panel)return;let host=document.getElementById('sheetAttackActionSummary');
 if(!host){host=document.createElement('div');host.id='sheetAttackActionSummary';panel.querySelector('h3')?.after(host);}
 host.innerHTML=attackActionSummaryMarkup(d,true);host.hidden=!host.innerHTML;
}
