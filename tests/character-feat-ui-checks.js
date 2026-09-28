(async()=>{
const results=JSON.parse(document.getElementById('test-results').textContent);
const check=(name,ok)=>{results.push({name,pass:!!ok});if(!ok)throw Error(name)};
try {
 seed('player');delete testSheetDocs['campaigns/a/characterSheets/c1'];testSheetDocs['campaigns/a/characters/c1']={name:'Thorin',class:'Fighter',level:7,userId:'player'};
 await openCharacterSheet('c1');await Promise.resolve();let form=document.getElementById('characterSheetForm');
 const field=n=>form.querySelector(`[name="${n}"]`),change=(n,v)=>{field(n).value=v;field(n).dispatchEvent(new Event('change',{bubbles:true}));};
 change('build.classId','fighter');change('abilities.str',13);document.getElementById('catalogFeatSearch').value='Grappler';renderCatalogFeatResults();document.querySelector('[data-add-catalog-feat]').onclick();
 const key=sheetSession.data.rulesChoices.feats[0];let ability=document.querySelector(`[data-feat-key="${key}"] [data-feat-choice="ability0"]`);ability.value='str';ability.onchange();
 check('Feat ability choice updates displayed total without overwriting base score',CharacterSheetModel.derive(sheetSession.data,7).scores.str===14&&field('abilities.str').value==='13'&&document.querySelector('[data-ability-score="str"]').textContent==='14');
 for(const el of form.querySelectorAll('input,select,textarea'))el.checkValidity=()=>true;await saveCharacterSheet();closeCharacterSheet(true);await openCharacterSheet('c1');await Promise.resolve();form=document.getElementById('characterSheetForm');
 check('Automatic feat choices survive saving schema nine and reopening',sheetSession.data.rulesChoices.effects[key].abilities[0]==='str'&&testSheetDocs['campaigns/a/characterSheets/c1'].schemaVersion===9&&CharacterSheetModel.derive(sheetSession.data,7).scores.str===14);
 document.querySelector(`[data-remove-feat="${key}"]`).onclick();check('Removing feat removes calculated bonus and preserves base',CharacterSheetModel.derive(sheetSession.data,7).scores.str===13&&sheetSession.data.abilities.str===13);
 document.getElementById('catalogFeatSearch').value='Ability Score Improvement';renderCatalogFeatResults();document.querySelector('[data-add-catalog-feat]').onclick();document.querySelector('[data-add-catalog-feat]').onclick();
 check('Repeatable feat has separate choice controls per instance',document.querySelectorAll('[data-feat-choice="ability0"]').length===2&&sheetSession.data.rulesChoices.feats.length===2);
 closeCharacterSheet(true);
}catch(e){results.push({name:e.stack,pass:false});}
document.getElementById('test-results').textContent=JSON.stringify(results,null,2);
})();
