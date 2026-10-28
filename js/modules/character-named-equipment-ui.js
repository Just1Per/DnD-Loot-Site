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
  const template=sheetBaseGear().find(row=>{const m=CharacterEquipment.infer(row);return m.kind===kind&&m.base===mechanics.base&&row.edition===session.data.build.edition})||sheetBaseGear().find(row=>{const m=CharacterEquipment.infer(row);return m.kind===kind&&m.base===mechanics.base});
  const item={id:'personal-'+crypto.randomUUID(),name,quantity:1,weight:Number(template?.weight)||0,location:'Worn',carried:true,notes:'',edition:session.data.build.edition,inventorySide:'left'};
  session.data.personalGear.push(item);chosen=personalGearEntries().find(entry=>entry.id===item.id);created=true;
 }else{const personal=session.data.personalGear.find(row=>row.id===chosen.id);if(personal){personal.carried=true;personal.location='Worn';}}
 const chosenId=chosen.id;setSheetEquipmentChoice(chosenId,'equipped',true);
 if(kind==='weapon'){ensureCharacterAttackIds(session.data);session.data.adobe.paperCombat.attackSlots=CharacterPaperAttacks.select(session.data.adobe.paperCombat.attackSlots,slot,'gear:'+chosenId,chosen.item.name);}
 session.dirty=true;refreshCharacterSheetInventory();sheetStatus((created?'Added '+name+' to personal gear and equipped it.':'Equipped '+chosen.item.name+'.')+' Save sheet to keep changes. Coins and campaign stock are unchanged.');
}
