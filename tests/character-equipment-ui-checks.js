(async()=>{
 const results=JSON.parse(document.getElementById('test-results').textContent),check=(name,ok)=>{results.push({name,pass:!!ok});if(!ok)throw Error(name)};
 try {
  closeCharacterSheet(true);seed('player');delete testSheetDocs['campaigns/a/characterSheets/c1'];testSheetDocs['campaigns/a/characters/c1']={...characters[0]};
  const sword={id:'sword',campaignId:'a',name:'Longsword +1',visible:true,lootMode:'player',properties:[]};
  const ring={id:'ring',campaignId:'a',name:'Ward <img src=x>',visible:true,lootMode:'player',attunement:true,mechanics:CharacterEquipment.normalize({kind:'accessory',acBonus:1}),properties:[]};
  fixtureItems.push(sword,ring);items.push(sword,ring);
  fixtureInventory.push({id:'c1__sword',itemId:'sword',userId:'player',characterId:'c1',quantity:1,item:sword},{id:'c1__ring',itemId:'ring',userId:'player',characterId:'c1',quantity:4,item:ring});await loadCampaignInventory();
  await openCharacterSheet('c1');
  check('Owned weapon appears automatically without adding manual attack rows',document.querySelector('[data-active-gear="c1__sword"]').textContent.includes('Longsword +1')&&sheetSession.data.attacks.length===0);
  check('New sheets use automatic unarmored AC while loot starts in backpack',sheetSession.data.equipmentState.acMode==='equipment'&&document.querySelector('[data-derived="ac"]').textContent==='10');
  const setGear=(id,key,value)=>{const button=document.querySelector(`[data-active-${key==='equipped'?'equip':'attune'}="${id}"]`);if((button.getAttribute('aria-pressed')==='true')!==value)button.click();};
  setGear('c1__ring','equipped',true);check('Unattuned magic item grants no AC',document.querySelector('[data-derived="ac"]').textContent==='10');
  setGear('c1__ring','attuned',true);check('Equipped attuned AC bonus applies once for a stack of four',document.querySelector('[data-derived="ac"]').textContent==='11'&&!document.querySelector('#sheetEquipmentSummary img'));
  const field=document.querySelector('[name="abilities.str"]');field.value='18';field.dispatchEvent(new Event('input',{bubbles:true}));setGear('c1__sword','equipped',true);
  check('Equipment toggles preserve unsaved stats and calculate weapon damage',sheetSession.data.abilities.str===18&&CharacterSheetModel.derive(sheetSession.data,sheetSession.identity.level,sheetEquipmentLoot()).gear.attacks.some(a=>a.damage==='1d8 + 5 slashing'));
  for(const el of document.querySelectorAll('#characterSheetForm input,select,textarea'))el.checkValidity=()=>true;
  await saveCharacterSheet();closeCharacterSheet(true);await openCharacterSheet('c1');
  check('Equipped and attuned states survive current-schema save and reopen',testSheetDocs['campaigns/a/characterSheets/c1'].schemaVersion===14&&document.querySelector('[data-derived="ac"]').textContent==='11');
  // Install listener test adapter only for this fixture; all callbacks are explicit.
  closeCharacterSheet(true);const listeners=[];equipmentSDK.onSnapshot=(q,next,error)=>{const l={next,error,stopped:false};listeners.push(l);return()=>l.stopped=true;};
  await openCharacterSheet('c1');
  check('Opening sheet subscribes to inventory and permitted items',listeners.length===2);
  const snap=list=>({docs:list.map(e=>({id:e.id,data:()=>e}))});
  listeners[0].next(snap(fixtureInventory.filter(e=>e.characterId==='c1'&&e.itemId!=='ring')));
  check('Live unloot removes AC immediately without deleting manual draft',document.querySelector('[data-derived="ac"]').textContent==='10'&&sheetSession.data.abilities.str===18);
  listeners[0].next(snap(fixtureInventory.filter(e=>e.characterId==='c1')));
  listeners[1].next(snap(fixtureItems.map(i=>i.id==='ring'?{...i,updatedAt:10,mechanics:CharacterEquipment.normalize({kind:'accessory',acBonus:2})}:i)));
  check('Live DM equipment edit recalculates AC',document.querySelector('[data-derived="ac"]').textContent==='12');
  listeners[0].error(Error('denied'));check('Lost inventory access clears derived bonuses',document.querySelector('[data-derived="ac"]').textContent==='10'&&document.getElementById('sheetStatus').textContent.includes('failed'));
  closeCharacterSheet(true);check('Closing sheet stops listeners and rejects late private callbacks',listeners.every(l=>l.stopped));listeners[0].next(snap(fixtureInventory));check('Late callback cannot reopen a closed sheet',!sheetSession&&!document.getElementById('sheetLootAttacks'));delete equipmentSDK.onSnapshot;
  seed('dm');openItemModal(fixtureItems[0]);document.getElementById('mechanic-base').value='accessory';document.getElementById('mechanic-acBonus').value='1';await saveItemModal();
  check('DM item editor saves structured AC mechanics in campaign scope',callLog.at(-1).name==='vaultSaveCampaignItem'&&callLog.at(-1).data.item.mechanics.acBonus===1&&callLog.at(-1).data.campaignId==='a');
  seed('player');openItemModal(items[0]);check('Players cannot open the DM mechanics editor',itemEditor===null);
 }catch(e){results.push({name:e.stack,pass:false});}
 document.getElementById('test-results').textContent=JSON.stringify(results,null,2);
})();
