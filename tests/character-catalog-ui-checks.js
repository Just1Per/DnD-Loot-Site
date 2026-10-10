(async()=>{
const results=JSON.parse(document.getElementById('test-results').textContent);
const check=(name,ok)=>{results.push({name,pass:!!ok});if(!ok)throw Error(name)};
try {
 seed('player');delete testSheetDocs['campaigns/a/characterSheets/c1'];testSheetDocs['campaigns/a/characters/c1']={name:'Thorin',class:'Fighter',level:7,userId:'player'};
 await openCharacterSheet('c1');await Promise.resolve();
 let form=document.getElementById('characterSheetForm');
 const change=(name,value)=>{const el=form.querySelector(`[name="${name}"]`);el.value=value;el.dispatchEvent(new Event('change',{bubbles:true}));};
 change('build.classId','cleric');document.getElementById('catalogSpellEdition').value='2024';document.getElementById('catalogSpellClass').value='cleric';document.getElementById('catalogSpellLevel').value='';renderCatalogSpellResults();check('Spell catalogue loads eligible class spells',document.querySelectorAll('[data-add-catalog-spell]').length>0);
 document.getElementById('catalogSpellSearch').value='Cure Wounds';renderCatalogSpellResults();document.querySelector('[data-add-catalog-spell]').onclick();
 check('Choosing spell creates editable versioned snapshot',sheetSession.data.spells[0].name==='Cure Wounds [2024]'&&sheetSession.data.spells[0].notes.includes('2d8'));
 document.querySelector('[data-add-catalog-spell]').onclick();check('Catalogue avoids adding the same spell twice',sheetSession.data.spells.length===1);
 change('build.race','human-2024');chooseBuildFeat('humanOriginFeat','Magic Initiate');
 check('Human Magic Initiate opens three actual spell selectors',document.querySelectorAll('[data-grant="human"] [data-grant-field^="spell"]').length===3);
 const grantClass=document.querySelector('[data-grant="human"] [data-grant-field="classId"]');grantClass.value='wizard';grantClass.onchange();
 const picks=[...CharacterCatalog.spells({edition:'2024',classId:'wizard',level:0}).slice(0,2),CharacterCatalog.spells({edition:'2024',classId:'wizard',level:1})[0]];
 for(let i=0;i<3;i++){const el=document.querySelector(`[data-grant="human"] [data-grant-field="spell${i}"]`);el.value=picks[i].id;el.onchange();}
 document.querySelector('[data-grant="human"] [data-use-grant]').onclick();
 check('Free cast tracks an independent long-rest resource',sheetSession.data.rulesChoices.grants.human.used===1);
 for(const el of form.querySelectorAll('input,select,textarea'))el.checkValidity=()=>true;await saveCharacterSheet();closeCharacterSheet(true);await openCharacterSheet('c1');await Promise.resolve();form=document.getElementById('characterSheetForm');
 check('Catalogue choices and resource usage survive save and reopen',sheetSession.data.rulesChoices.grants.human.used===1&&sheetSession.data.rulesChoices.grants.human.spells[2]===picks[2].id&&sheetSession.data.spells[0].catalogId);
 const before=sheetSession.data.hpCurrent;CharacterCatalog.longRest(sheetSession.data);sheetCatalogSignature='';updateSheetCatalogGrants();check('Long rest restores Magic Initiate without changing HP',sheetSession.data.rulesChoices.grants.human.used===0&&sheetSession.data.hpCurrent===before);
 change('build.classId','fighter');change('abilities.str',13);document.getElementById('catalogFeatEdition').value='2024';document.getElementById('catalogFeatSearch').value='Grappler';renderCatalogFeatResults();document.querySelector('[data-add-catalog-feat]').onclick();
 check('Feat catalogue stores a distinct 2024 selection',sheetSession.data.rulesChoices.feats.length===1&&CharacterCatalog.find(sheetSession.data.rulesChoices.feats[0],'feats').edition==='2024');
 closeCharacterSheet(true);
}catch(e){results.push({name:e.stack,pass:false});}
document.getElementById('test-results').textContent=JSON.stringify(results,null,2);
})();
