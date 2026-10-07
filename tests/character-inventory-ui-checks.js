(async()=>{
 const results=JSON.parse(document.getElementById('test-results').textContent),check=(name,ok)=>{results.push({name,pass:!!ok});if(!ok)throw Error(name);};
 try{
 closeCharacterSheet(true);seed('player');delete testSheetDocs['campaigns/a/characterSheets/c1'];testSheetDocs['campaigns/a/characters/c1']={...characters[0]};await openCharacterSheet('c1');await Promise.resolve();
 const cls=document.querySelector('[name="build.classId"]');cls.value='fighter';cls.dispatchEvent(new Event('change',{bubbles:true}));
 const before=callLog.length,stock=JSON.stringify(fixtureSupply);
 const gp=document.querySelector('[name="coins.gp"]');gp.value=50;gp.dispatchEvent(new Event('change',{bubbles:true}));
 addSheetGearTemplates([{name:'Dagger',quantity:2,weight:1,edition:'2024'},{name:'Shield',quantity:1,weight:6,edition:'2024'}]);
 check('Player gear is private sheet data, without campaign writes or stock changes',sheetSession.data.personalGear.length===2&&callLog.length===before&&JSON.stringify(fixtureSupply)===stock);
 check('Coins survive inventory rerenders without duplicate fields',document.querySelector('[name="coins.gp"]').value==='50'&&document.querySelectorAll('[name="coins.gp"]').length===1);
 const dagger=sheetSession.data.personalGear[0].id,shield=sheetSession.data.personalGear[1].id;
 const edit=(id,key,value)=>{openPersonalGearEditor(id);const input=document.getElementById('personalEdit'+key[0].toUpperCase()+key.slice(1));if(input.type==='checkbox')input.checked=value;else input.value=value;savePersonalGearEditor();};
 edit(dagger,'quantity',3);edit(dagger,'location','Belt');
 check('Quantity and location edits persist, with aggregate coin and item weight',sheetSession.data.personalGear[0].quantity===3&&sheetSession.data.personalGear[0].location==='Belt'&&document.getElementById('sheetInventoryTotals').textContent.includes('10.00 lb'));
 document.querySelector(`[data-active-equip="${shield}"]`).click();
 check('Personal shield participates in automatic AC',document.querySelector('[data-derived="ac"]').textContent==='12');
 edit(shield,'carried',false);check('Stored gear loses AC bonuses and carried weight but remains editable',document.querySelector('[data-derived="ac"]').textContent==='10'&&document.getElementById('sheetInventoryTotals').textContent.includes('4.00 lb')&&document.querySelector(`[data-item-information="${shield}"]`));
 openAttackPicker();check('Personal weapons are selectable as owned attacks',document.getElementById('sheetAttackPicker').textContent.includes('Dagger'));closeAttackPicker();
 edit(dagger,'notes','Silver grip');
 document.getElementById('sheetAddGearPack').onclick();check('Pack expands into individual character rows',sheetSession.data.personalGear.length>3&&callLog.length===before&&JSON.stringify(fixtureSupply)===stock);
 for(const el of document.querySelectorAll('#characterSheetForm input,select,textarea'))el.checkValidity=()=>true;
 await saveCharacterSheet();closeCharacterSheet(true);await openCharacterSheet('c1');await Promise.resolve();
 check('Personal gear, fractional-ready weights, notes and location survive current-schema save',testSheetDocs['campaigns/a/characterSheets/c1'].schemaVersion===14&&sheetSession.data.personalGear[0].name==='Dagger'&&sheetSession.data.personalGear[0].notes==='Silver grip'&&sheetSession.data.personalGear[0].location==='Belt'&&sheetSession.data.coins.gp===50);
 openInventoryItemInformation(dagger);document.querySelector('[data-remove-info-item]').click();check('Removing personal gear does not alter campaign stock',!sheetSession.data.personalGear.some(g=>g.id===dagger)&&JSON.stringify(fixtureSupply)===stock);
 closeCharacterSheet(true);
 }catch(e){results.push({name:e.stack,pass:false});}
 document.getElementById('test-results').textContent=JSON.stringify(results,null,2);
})();
