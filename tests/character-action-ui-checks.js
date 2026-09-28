(async()=>{
 const results=JSON.parse(document.getElementById('test-results').textContent),check=(name,ok)=>{results.push({name,pass:!!ok});if(!ok)throw Error(name);};
 try{
 closeCharacterSheet(true);seed('player');delete testSheetDocs['campaigns/a/characterSheets/c1'];testSheetDocs['campaigns/a/characters/c1']={...characters[0]};await openCharacterSheet('c1');await Promise.resolve();
 let form=document.getElementById('characterSheetForm');const change=(n,v)=>{const el=form.querySelector(`[name="${n}"]`);el.value=v;el.dispatchEvent(new Event('change',{bubbles:true}));};
 change('build.classId','fighter');change('build.scoreMode','base');change('abilities.str',18);change('build.background','criminal-2024');
 check('Criminal background changes all four story suggestion lists',document.getElementById('sheetStoryPreset').textContent.includes('Criminal')&&['personality','ideals','bonds','flaws'].every(k=>document.querySelector(`[data-story-choice="${k}"]`).textContent.includes(CharacterStory.get('criminal-2024')[k][0])));
 const trait=document.querySelector('[data-story-choice="personality"]');trait.value='0';trait.onchange();const selected=sheetSession.data.personality;change('build.background','noble-2024');
 check('Changing background refreshes suggestions without erasing saved writing',document.getElementById('sheetStoryPreset').textContent.includes('Noble')&&sheetSession.data.personality===selected&&trait.value==='other');
 change('build.background','acolyte');check('Acolyte still uses the actual uploaded Adobe table',document.querySelector('[data-story-choice="personality"]').textContent.includes(CharacterAdobeData.story.acolyte.personality[0]));
 document.getElementById('sheetOverviewAddAttack').click();check('Overview Add attack opens the picker without switching tabs',document.getElementById('sheetAttackPicker').open&&!document.getElementById('sheet-overview').hidden);
 const choose=(id,value)=>{const el=document.getElementById(id);el.value=value;if(el.onchange)el.onchange();else el.dispatchEvent(new Event('change',{bubbles:true}));};
 choose('attackKind','weapon');choose('attackRef','battleaxe');check('Battleaxe picker previews Strength attack and damage',document.getElementById('attackPreview').textContent.includes('1d8 + 4 slashing')&&document.getElementById('attackPreview').textContent.includes('+7'));
 choose('attackMode','twoHanded');check('Versatile mode previews the larger die',document.getElementById('attackPreview').textContent.includes('1d10 + 4 slashing'));
 document.getElementById('attackConfirm').click();check('Adding action shows automatic formula directly on Overview',sheetSession.data.actions.length===1&&document.getElementById('sheetOverviewReadout').textContent.includes('1d10 + 4 slashing')&&!document.getElementById('sheetAttackPicker'));
 change('abilities.str',12);check('Overview attack responds to ability changes',document.getElementById('sheetOverviewReadout').textContent.includes('1d10 + 1 slashing'));
 document.querySelector('[data-edit-action="0"]').click();choose('attackMode','normal');document.getElementById('attackConfirm').click();check('Editing replaces the chosen action instead of duplicating it',sheetSession.data.actions.length===1&&sheetSession.data.actions[0].mode==='normal');
 const fire=CharacterCatalog.data.spells.find(s=>s.name==='Fire Bolt'&&s.edition==='2024');addCatalogSpells([fire.id]);change('abilities.int',16);change('spellAbility','int');openAttackPicker();choose('attackKind','cantrip');choose('attackRef',fire.id);check('Selected cantrip previews casting ability and scaled damage',document.getElementById('attackPreview').textContent.includes('+6')&&document.getElementById('attackPreview').textContent.includes('2d10 fire'));document.getElementById('attackConfirm').click();
 fixtureItems.push({id:'axe',name:'Battleaxe +1',visible:true,lootMode:'player'});fixtureInventory.push({id:'owned-axe',itemId:'axe',characterId:'c1',userId:'player',quantity:1,item:fixtureItems.at(-1)});await refreshCampaignData();openAttackPicker();choose('attackKind','loot');choose('attackRef','owned-axe');document.getElementById('attackConfirm').click();
 check('Loot picker never shows another player’s private item',sheetSession.data.actions[2].ref==='owned-axe');
 fixtureInventory=fixtureInventory.filter(e=>e.id!=='owned-axe');await refreshCampaignData();check('Returning loot disables its pinned attack without deleting the reference',CharacterSheetModel.derive(sheetSession.data,7,sheetEquipmentLoot()).actions[2].available===false&&document.getElementById('sheetOverviewReadout').textContent.includes('no longer in this character'));
 for(const e of form.querySelectorAll('input,select,textarea'))e.checkValidity=()=>true;await saveCharacterSheet();closeCharacterSheet(true);await openCharacterSheet('c1');await Promise.resolve();form=document.getElementById('characterSheetForm');
 check('Actions and source references survive schema-ten save and reopen',testSheetDocs['campaigns/a/characterSheets/c1'].schemaVersion===10&&sheetSession.data.actions.length===3&&sheetSession.data.actions[1].ref===fire.id);
 document.querySelector('[data-remove-action="2"]').click();check('Removing one action preserves the others',sheetSession.data.actions.length===2);
 openAttackPicker();closeCharacterSheet(true);check('Closing the sheet removes the private attack picker',!document.getElementById('sheetAttackPicker'));
 }catch(e){results.push({name:e.stack,pass:false});}
 document.getElementById('test-results').textContent=JSON.stringify(results,null,2);
})();
