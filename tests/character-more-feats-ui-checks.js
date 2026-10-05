(async()=>{
const results=JSON.parse(document.getElementById('test-results').textContent);
const check=(name,ok)=>{results.push({name,pass:!!ok});if(!ok)throw Error(name)};
try {
 seed('player');closeCharacterSheet(true);delete testSheetDocs['campaigns/a/characterSheets/c1'];testSheetDocs['campaigns/a/characters/c1']={name:'Thorin',class:'Fighter',level:7,userId:'player'};
 await openCharacterSheet('c1');await Promise.resolve();let form=document.getElementById('characterSheetForm');
 const change=(name,value)=>{const el=form.querySelector(`[name="${name}"]`);el.value=value;el.dispatchEvent(new Event('change',{bubbles:true}));};
 selectSheetTab('combat');
 change('build.race','human-2024');change('build.humanOriginFeat','Lucky');
 check('Human Origin Lucky exposes a three-point pool directly on the combat page',document.getElementById('sheetFeatResources').textContent.includes('3 / 3')&&!document.getElementById('sheet-combat').hidden);
 const use=()=>document.querySelector('[data-combat-feat="origin-human"][data-delta="1"]');
 for(let i=0;i<3;i++)use().onclick();use().onclick();
 check('Combat uses stop at capacity without negative resources',sheetSession.data.rulesChoices.effects['origin-human'].used===3&&use().hasAttribute('disabled'));
 document.querySelector('[data-combat-feat="origin-human"][data-delta="-1"]').onclick();
 check('Undo restores one point, not the entire pool',sheetSession.data.rulesChoices.effects['origin-human'].used===2);
 for(const el of form.querySelectorAll('input,select,textarea'))el.checkValidity=()=>true;await saveCharacterSheet();closeCharacterSheet(true);await openCharacterSheet('c1');await Promise.resolve();form=document.getElementById('characterSheetForm');
 check('Multiple spent points survive schema-eleven save and reopen',sheetSession.data.rulesChoices.effects['origin-human'].used===2&&testSheetDocs['campaigns/a/characterSheets/c1'].schemaVersion===11&&document.getElementById('sheetFeatResources').textContent.includes('1 / 3'));
 document.querySelector('[data-combat-recover="short"]').onclick();check('Short rest does not refill Lucky',sheetSession.data.rulesChoices.effects['origin-human'].used===2);
 const hp=sheetSession.data.hpCurrent;sheetSession.data.rulesChoices.grants.human={classId:'wizard',ability:'int',spells:['','',''],used:1};document.querySelector('[data-combat-recover="long"]').onclick();
 check('Long-rest feat reset restores Lucky and Magic Initiate without healing',sheetSession.data.rulesChoices.effects['origin-human'].used===0&&sheetSession.data.rulesChoices.grants.human.used===0&&sheetSession.data.hpCurrent===hp);
 change('build.humanOriginFeat','Crafter');let select=document.querySelector('[data-feat-key="origin-human"] [data-feat-choice="training0"]');check('Crafter chooser has eight eligible tools and excludes instruments',select.querySelectorAll('option').length===9&&!select.innerHTML.includes('Flute'));
 change('build.humanOriginFeat','Musician');for(const [i,name] of ['Flute','Lute','Drum'].entries()){const el=document.querySelector(`[data-feat-key="origin-human"] [data-feat-choice="training${i}"]`);el.value='tool:'+name;el.onchange();}
 check('Musician Origin tool choices immediately reach derived proficiencies',CharacterSheetModel.derive(sheetSession.data,7).effects.proficiencies.includes('Lute')&&document.getElementById('sheetBuildSummary').textContent.includes('Flute'));
 closeCharacterSheet(true);
 seed('dm');await openCharacterSheet('c1');await Promise.resolve();await Promise.resolve();
 const dmPlus=document.querySelector('[data-dm-grant="feat"][data-delta="1"]');
 check('Campaign DM gets bonus feat and ASI approval controls on the Feats page',!!dmPlus&&!!document.querySelector('[data-dm-grant="asi"][data-delta="1"]'));
 const before=CharacterPlayRules.budget(sheetSession.data,sheetSession.identity.level,CharacterCatalog.data.feats).remaining;dmPlus.click();
 check('DM confirmation grants one additional feat choice',sheetSession.data.rulesChoices.grants.__dm.bonusFeats===1&&CharacterPlayRules.budget(sheetSession.data,sheetSession.identity.level,CharacterCatalog.data.feats).remaining===before+1);
 closeCharacterSheet(true);
}catch(e){results.push({name:e.stack,pass:false});}
document.getElementById('test-results').textContent=JSON.stringify(results,null,2);
})();
