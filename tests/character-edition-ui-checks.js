(async()=>{
 const results=JSON.parse(document.getElementById('test-results').textContent);
 const check=(name,ok)=>{results.push({name,pass:!!ok});if(!ok)throw Error(name)};
 try{
 seed('player');delete testSheetDocs['campaigns/a/characterSheets/c1'];testSheetDocs['campaigns/a/characters/c1']={name:'Thorin',class:'Fighter',level:7,userId:'player'};
 await openCharacterSheet('c1');let form=document.getElementById('characterSheetForm');
 const field=n=>form.querySelector(`[name="${n}"]`);const change=(n,v)=>{field(n).value=v;field(n).dispatchEvent(new Event('change',{bubbles:true}));};
 const visible=n=>!field(n).closest('label').hidden;
 check('New sheets default to 2024 and labels identify both Human versions',field('build.edition').value==='2024'&&field('build.race').querySelector('[value="human-2024"]').textContent.includes('2024')&&field('build.race').querySelector('[value="variant-human"]').textContent.includes('2014'));
 change('species','My custom race');change('background','My custom history');change('build.race','human-2024');change('build.classId','wizard');change('build.background','criminal-2024');
 check('Dropdown selections hide duplicate class race and background text fields',!visible('identity.class')&&!visible('species')&&!visible('background')&&form.querySelectorAll('[name="identity.class"]').length===1);
 check('2024 Human exposes Origin feat and hides 2014 racial ability controls',visible('build.humanOriginFeat')&&!visible('build.raceFeat')&&!visible('build.flexibleChoices.0'));
 change('build.backgroundAbilities.0','dex');change('build.backgroundAbilities.1','con');change('build.raceSize','Medium');change('build.raceSkills.0','perception');change('build.humanOriginFeat','Skilled');change('build.humanFeatChoices.0','skill:arcana');change('build.humanFeatChoices.1','skill:history');change('build.humanFeatChoices.2','tool:Flute');change('build.standardLanguages.0','Elvish');change('build.standardLanguages.1','Orc');
 check('Human feat training and background feat both appear in summary',visible('build.humanFeatChoices.0')&&document.getElementById('sheetBuildSummary').textContent.includes('Alert, Skilled')&&CharacterSheetModel.derive(sheetSession.data,7).effects.proficiencies.includes('Flute'));
 for(const el of form.querySelectorAll('input,select,textarea'))el.checkValidity=()=>true;await saveCharacterSheet();
 check('2024 data saves with protected schema version three',testSheetDocs['campaigns/a/characterSheets/c1'].schemaVersion===3);
 closeCharacterSheet(true);await openCharacterSheet('c1');form=document.getElementById('characterSheetForm');
 check('2024 edition and Origin feat choices survive reopening',field('build.edition').value==='2024'&&field('build.humanOriginFeat').value==='Skilled'&&field('build.humanFeatChoices.2').value==='tool:Flute'&&!visible('species'));
 change('build.race','');change('build.classId','');change('build.background','');
 check('Custom fields reappear with preserved race and background text',visible('identity.class')&&visible('species')&&visible('background')&&field('species').value==='My custom race'&&field('background').value==='My custom history');
 change('build.edition','2014');change('build.race','variant-human');
 check('2014 Variant Human shows manual feat and two ability bonuses',visible('build.raceFeat')&&visible('build.flexibleChoices.0')&&visible('build.flexibleChoices.1')&&!visible('build.flexibleChoices.2')&&document.getElementById('sheetModernOrigin').hidden);
 change('build.flexibleChoices.0','dex');change('build.flexibleChoices.1','con');change('build.raceFeat','Lucky');
 for(const el of form.querySelectorAll('input,select,textarea'))el.checkValidity=()=>true;await saveCharacterSheet();check('Switching back to 2014 does not downgrade schema protection',testSheetDocs['campaigns/a/characterSheets/c1'].schemaVersion===3);
 closeCharacterSheet(true);
 }catch(e){results.push({name:e.stack,pass:false});}
 document.getElementById('test-results').textContent=JSON.stringify(results,null,2);
})();
