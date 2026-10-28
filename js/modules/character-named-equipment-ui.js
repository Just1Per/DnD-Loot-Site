'use strict';
/* Typing equipment names uses the existing personal inventory and equip controller. */
function characterEquipmentNameKey(name){const parsed=CharacterEquipment.parseName(name);return parsed.key||'named:'+String(name||'').trim().toLowerCase().replace(/\s+/g,' ');}
function characterPaperAttackCandidates(data,derived){return CharacterPaperAttacks.candidates(data,derived);}
function characterPaperAttackRows(data,derived){return CharacterPaperAttacks.rows(data.adobe.paperCombat.attackSlots,characterPaperAttackCandidates(data,derived));}
function characterNamedEquipmentChoices(kind,derived){
 const base=kind==='weapon'?Object.values(CharacterEquipment.weapons).map(row=>row.name):kind==='shield'?['Shield']:Object.values(CharacterEquipment.armor).map(row=>row.name);
 const names=derived.gear.entries.filter(row=>row.mechanics.kind===kind).map(row=>row.item.name);
 return [...new Set([...(kind==='armor'?['Unarmored']:kind==='shield'?['No shield']:[]),...names,...(kind==='weapon'?derived.actions.map(row=>row.name):[]),...base.flatMap(name=>[name,name+' +1',name+' +2',name+' +3'])])];
}
function characterNamedPersonalGear(name,kind,mechanics,session,location){
 const templates=sheetBaseGear().filter(row=>{const m=CharacterEquipment.infer(row);return m.kind===kind&&m.base===mechanics.base}),template=templates.find(row=>row.edition===session.data.build.edition)||templates[0];
 return{id:'personal-'+crypto.randomUUID(),name,quantity:1,weight:Number(template?.weight)||0,location,inventorySide:location==='Backpack'?'right':'left',carried:true,notes:'',edition:session.data.build.edition};
}
function characterPaperAttackInventoryName(row,data){
 if(!row||row.unavailable)return '';
 if(row.origin==='gear')return row.name;
 if(row.origin==='action'){const action=data.actions[row.index];if(action?.kind==='weapon')return CharacterEquipment.weapons[action.ref]?.name||'';if(action?.kind==='loot'){const entry=sheetEquipmentLoot().find(entry=>entry.id===action.ref);return entry&&CharacterEquipment.infer(entry.item).kind==='weapon'?entry.item.name:'';}return '';}
 return row.origin==='manual'&&CharacterEquipment.infer({name:row.name}).kind==='weapon'?row.name:'';
}
function copyCharacterPaperAttackToInventory(index){
 const session=sheetSession;if(!characterPaperCombatCurrent(session))throw Error('The character session changed. Reopen the sheet.');readSheetForm();
 const derived=CharacterSheetModel.derive(session.data,session.identity.level,sheetEquipmentLoot()),row=characterPaperAttackRows(session.data,derived)[index],name=characterPaperAttackInventoryName(row,session.data);
 if(!name)throw Error('This row has no recognized physical weapon to copy. Add custom gear through Inventory.');
 const all=[...sheetEquipmentLoot(),...personalGearEntries(true).filter(entry=>entry.quantity>0)],existing=row.origin==='gear'?all.find(entry=>entry.id===row.entryId):all.find(entry=>characterEquipmentNameKey(entry.item.name)===characterEquipmentNameKey(name));
 if(existing){sheetStatus('This weapon is already listed in Inventory. No duplicate was added.');return 'This weapon is already listed in Inventory. No duplicate was added.';}
 if(session.data.personalGear.length>=200)throw Error('Personal inventory is full. Remove an unused row before copying equipment.');
 const mechanics=CharacterEquipment.infer({name});if(name.length>160||mechanics.kind!=='weapon'||!CharacterEquipment.profile(mechanics,session.data.build.edition))throw Error('Use Inventory to configure this custom weapon.');
 session.data.personalGear.push(characterNamedPersonalGear(name,'weapon',mechanics,session,'Backpack'));session.dirty=true;refreshCharacterSheetInventory();const message='Copied '+name+' to personal Inventory. It is carried, not equipped. Coins, campaign stock and attack references are unchanged. Save sheet to keep changes.';sheetStatus(message);return message;
}
function ensureCharacterAttackIds(data){const seen=new Set();for(const row of [...data.attacks,...data.actions]){if(!row.id||seen.has(row.id))row.id='attack-'+crypto.randomUUID();seen.add(row.id);}}
function setCharacterEquipmentByName(kind,value,slot=null){
 const session=sheetSession;if(!characterPaperCombatCurrent(session))throw Error('The character session changed. Reopen the sheet.');
 const name=String(value||'').trim();if(!['armor','shield','weapon'].includes(kind)||name.length>200||kind==='weapon'&&(!Number.isInteger(slot)||slot<0||slot>4))throw Error('Choose an available equipment field.');
 readSheetForm();let derived=CharacterSheetModel.derive(session.data,session.identity.level,sheetEquipmentLoot());
 if(!name||kind==='armor'&&/^(?:unarmored|unarmoured|none)$/i.test(name)||kind==='shield'&&/^(?:no shield|none)$/i.test(name)){
  if(kind==='weapon'){ensureCharacterAttackIds(session.data);derived=CharacterSheetModel.derive(session.data,session.identity.level,sheetEquipmentLoot());const row=characterPaperAttackRows(session.data,derived)[slot];session.data.adobe.paperCombat.attackSlots=CharacterPaperAttacks.select(session.data.adobe.paperCombat.attackSlots,slot,row?.key||'',row?.name||'',true);session.dirty=true;refreshCharacterSheetInventory();sheetStatus('Paper attack row cleared. Equipment and other attacks are kept. Save sheet to keep changes.');return;}
  selectInventoryDefense(kind,'');return;
 }
 const folded=text=>String(text||'').trim().toLowerCase().replace(/\s+/g,' '),all=[...sheetEquipmentLoot(),...personalGearEntries(true).filter(entry=>entry.quantity>0&&!session.data.personalGear.find(row=>row.id===entry.id)?.carried)],eligible=all.filter(entry=>CharacterEquipment.infer(entry.item).kind===kind);
 let matches=eligible.filter(entry=>folded(entry.item.name)===folded(name));if(!matches.length)matches=eligible.filter(entry=>characterEquipmentNameKey(entry.item.name)===characterEquipmentNameKey(name));
 const current=kind==='weapon'?characterPaperAttackRows(session.data,derived)[slot]:null,activeId=current?.entryId||derived.gear.entries.find(row=>row.active&&row.mechanics.kind===kind)?.entry.id;
 let chosen=matches.find(entry=>entry.id===activeId)||(matches.length===1?matches[0]:null);
 if(matches.length>1&&!chosen)throw Error('Several owned items share this name. Equip the intended one in Inventory first.');
 if(kind==='weapon'&&!chosen){
  const rows=characterPaperAttackCandidates(session.data,derived),same=rows.filter(row=>row.origin!=='gear'&&folded(row.name)===folded(name)),currentMatch=same.find(row=>row.key===current?.key),existing=currentMatch||(same.length===1?same[0]:null);
  if(existing){ensureCharacterAttackIds(session.data);derived=CharacterSheetModel.derive(session.data,session.identity.level,sheetEquipmentLoot());const row=characterPaperAttackCandidates(session.data,derived).find(row=>row.origin===existing.origin&&row.index===existing.index);session.data.adobe.paperCombat.attackSlots=CharacterPaperAttacks.select(session.data.adobe.paperCombat.attackSlots,slot,row.key,row.name);session.dirty=true;refreshCharacterSheetInventory();sheetStatus('Existing attack reference selected. Save sheet to keep its paper position.');return;}
  if(same.length>1)throw Error('Several attack references share this name. Edit or distinguish them in the shared Combat controls.');
 }
 const mechanics=chosen?CharacterEquipment.infer(chosen.item):CharacterEquipment.infer({name});
 if(mechanics.kind!==kind||kind!=='shield'&&!CharacterEquipment.profile(mechanics,session.data.build.edition))throw Error('Name not recognized as '+kind+'. Choose a suggestion or configure custom equipment/attacks in the shared controls.');
 const state=session.data.equipmentState;
 if(!chosen&&name.length>160)throw Error('A new personal item name can contain up to 160 characters.');
 if(!chosen&&session.data.personalGear.length>=200)throw Error('Personal inventory is full. Remove an unused row before adding equipment.');
 if((!chosen||!state.loadout.some(row=>row.id===chosen.id))&&state.loadout.length>=200)throw Error('Equipment selection limit reached. Remove an unused selection first.');
 // Every validation completes before adding/carrying an item or changing a row.
 let created=false;
 if(!chosen){
  const item=characterNamedPersonalGear(name,kind,mechanics,session,'Worn');
  session.data.personalGear.push(item);chosen=personalGearEntries().find(entry=>entry.id===item.id);created=true;
 }else{const personal=session.data.personalGear.find(row=>row.id===chosen.id);if(personal){personal.carried=true;personal.location='Worn';}}
 const chosenId=chosen.id;setSheetEquipmentChoice(chosenId,'equipped',true);
 if(kind==='weapon'){ensureCharacterAttackIds(session.data);session.data.adobe.paperCombat.attackSlots=CharacterPaperAttacks.select(session.data.adobe.paperCombat.attackSlots,slot,'gear:'+chosenId,chosen.item.name);}
 session.dirty=true;refreshCharacterSheetInventory();sheetStatus((created?'Added '+name+' to personal gear and equipped it.':'Equipped '+chosen.item.name+'.')+' Save sheet to keep changes. Coins and campaign stock are unchanged.');
}

function applyCharacterPaperAttackOperation(index,command){
 const session=sheetSession;if(!characterPaperCombatCurrent(session))throw Error('The character session changed. Reopen the sheet.');readSheetForm();
 // Work on a candidate copy: invalid/full-row operations never replace live data.
 const data=structuredClone(session.data);ensureCharacterAttackIds(data);const derived=CharacterSheetModel.derive(data,session.identity.level,sheetEquipmentLoot()),result=CharacterPaperAttacks.operation(data.adobe.paperCombat.attackSlots,characterPaperAttackCandidates(data,derived),index,command);
 session.data.attacks=data.attacks;session.data.actions=data.actions;session.data.adobe.paperCombat.attackSlots=result.slots;session.dirty=true;refreshCharacterSheetInventory();sheetStatus('Paper attack order updated. Equipment and shared attacks are kept. Save sheet to keep changes.');return result.index;
}
function openCharacterPaperAttackMenu(index){
 const session=sheetSession;if(!characterPaperCombatCurrent(session)||!Number.isInteger(index)||index<0||index>4)return;
 document.getElementById('sheetPaperAttackMenu')?.remove();const dialog=document.createElement('dialog'),opener=document.activeElement?.shadowRoot?.activeElement||document.activeElement;dialog.id='sheetPaperAttackMenu';dialog.className='vault-dialog sheet-paper-action-menu';dialog.setAttribute('aria-labelledby','sheetPaperAttackMenuTitle');let selected=index;
 const signature=()=>JSON.stringify({data:CharacterSheetModel.normalize(session.data),identity:session.identity,loot:sheetEquipmentLoot()}),close=()=>{if(dialog.open)dialog.close();dialog.remove();if(opener?.isConnected)opener.focus();};let snapshot=signature();
 const allowed=()=>characterPaperCombatCurrent(session)&&dialog.isConnected&&signature()===snapshot;
 const render=()=>{
  const derived=CharacterSheetModel.derive(session.data,session.identity.level,sheetEquipmentLoot()),rows=characterPaperAttackRows(session.data,derived),row=rows[selected],esc=sheetEscape;
  dialog.innerHTML='<h2 id="sheetPaperAttackMenuTitle">Attack '+(selected+1)+' options</h2><p>Arrange the five paper rows. Clearing or deleting a paper row keeps its owned equipment and shared Combat reference.</p><div class="sheet-inline-controls">'+[['up','Move up',selected===0],['down','Move down',selected===4],['insert','Insert empty attack',!row||!rows.some((value,i)=>i>selected&&!value)],['delete','Delete paper row',!row],['clear','Clear paper row',!row]].map(([command,label,disabled])=>'<button type="button" data-paper-attack-command="'+command+'" '+(disabled?'disabled':'')+'>'+label+'</button>').join('')+'</div><details data-paper-attack-calculation><summary>Show what affects this attack</summary>'+(row?'<h3>'+esc(row.name)+'</h3><p>To hit / save: '+esc(row.hit||'—')+' · Damage: '+esc(row.damage||'—')+' '+esc(row.damageType||'')+' · Range: '+esc(row.range||'—')+'</p><p>Ability: '+esc(row.ability?.toUpperCase()||'—')+' · Proficiency bonus: '+esc(derived.pb)+(row.proficient===true?' (proficient)':row.proficient===false?' (not proficient)':' (see action rules)')+'</p>'+[...(Array.isArray(row.notes)?row.notes:[row.notes]),row.properties].filter(Boolean).map(text=>'<p>'+esc(text)+'</p>').join(''):'<p>This paper row is empty. Type a weapon name or choose an existing attack in its name field.</p>')+'</details><div class="sheet-inline-controls"><button type="button" data-paper-attack-copy '+(characterPaperAttackInventoryName(row,session.data)?'':'disabled')+'>Copy to Adventuring Gear (page 2)</button>'+ (row?.origin==='gear'?'<button type="button" data-paper-attack-information>Item information</button>':'')+'<button type="button" data-paper-attack-editor>Open shared Combat controls</button></div><p data-paper-attack-status role="status"></p><button type="button" data-paper-attack-done>Done</button>';
  dialog.querySelector('[data-paper-attack-copy]').onclick=()=>{if(!allowed()){close();return;}try{const message=copyCharacterPaperAttackToInventory(selected);snapshot=signature();render();dialog.querySelector('[data-paper-attack-status]').textContent=message;}catch(error){dialog.querySelector('[data-paper-attack-status]').textContent=error.message;}};
  dialog.querySelector('[data-paper-attack-done]').onclick=close;dialog.querySelector('[data-paper-attack-editor]').onclick=()=>{if(!allowed()){close();return;}close();CharacterAdobeView.openEditor('attacks');};const info=dialog.querySelector('[data-paper-attack-information]');if(info)info.onclick=()=>{if(!allowed()){close();return;}close();openInventoryItemInformation(row.entryId);};
  for(const button of dialog.querySelectorAll('[data-paper-attack-command]'))button.onclick=async()=>{
   if(!allowed()){close();return;}const command=button.dataset.paperAttackCommand;
   if(['delete','clear'].includes(command)&&!await SiteConfirmation.ask({title:command==='delete'?'Delete this paper attack row?':'Clear this paper attack row?',paragraphs:[row?.name||'Empty attack',command==='delete'?'Later paper rows move up. Owned equipment and shared Combat references are kept.':'This paper position stays empty. Owned equipment and shared Combat references are kept.'],confirmLabel:command==='delete'?'Delete paper row':'Clear paper row',isCurrent:allowed}))return;
   if(!allowed()){close();return;}try{selected=applyCharacterPaperAttackOperation(selected,command);snapshot=signature();render();dialog.querySelector('[data-paper-attack-command="'+command+'"]')?.focus();}catch(error){dialog.querySelector('[data-paper-attack-status]').textContent=error.message;}
  };
 };
 dialog.addEventListener('cancel',event=>{event.preventDefault();close();});dialog.addEventListener('close',()=>dialog.remove());document.body.append(dialog);render();dialog.showModal();dialog.querySelector('button:not(:disabled)')?.focus();
}
