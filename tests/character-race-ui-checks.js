(async () => {
  const results=JSON.parse(document.getElementById('test-results').textContent);
  const check=(name,ok)=>{results.push({name,pass:!!ok});if(!ok)throw Error(name)};
  try {
    seed('player'); delete testSheetDocs['campaigns/a/characterSheets/c1'];
    testSheetDocs['campaigns/a/characters/c1']={name:'Thorin',class:'Fighter',level:7,userId:'player'};
    await openCharacterSheet('c1');
    let form=document.getElementById('characterSheetForm');
    const field=name=>form.querySelector(`[name="${name}"]`);
    const change=(name,value)=>{field(name).value=value;field(name).dispatchEvent(new Event('change',{bubbles:true}));};
    const visible=name=>!field(name).closest('label').hidden;
    check('Race selector groups entries by category and displays book version',field('build.race').querySelectorAll('optgroup').length===6&&field('build.race').textContent.includes('MPMM'));
    change('build.edition','2014');
    change('identity.level','5');
    change('build.race','fairy-mpmm'); change('abilities.dex','14');change('build.flexibleChoices.0','dex');change('build.flexibleChoices.1','con');change('build.raceAbility','wis');
    check('Flexible race choices update ability total and racial spells',CharacterSheetModel.derive(sheetSession.data,5).scores.dex===16&&document.getElementById('sheetBuildSummary').textContent.includes('Enlarge/Reduce'));
    change('build.asiPattern','111');change('build.flexibleChoices.2','cha');
    check('Three-way allocation displays third choice and recalculates',visible('build.flexibleChoices.2')&&CharacterSheetModel.derive(sheetSession.data,5).scores.dex===15);
    change('build.race','kobold-mpmm');change('build.raceFeature','craftiness');change('build.raceSkills.0','arcana');
    check('Kobold skill option shows restricted racial skill control',visible('build.raceSkills.0')&&!visible('build.raceCantrip')&&field('build.raceSkills.0').querySelector('[value="athletics"]').disabled);
    change('build.raceFeature','sorcery');change('build.raceCantrip','Fire Bolt');change('build.raceAbility','cha');
    check('Changing legacy removes earlier skill and shows cantrip',!visible('build.raceSkills.0')&&visible('build.raceCantrip')&&CharacterSheetModel.derive(sheetSession.data,5).effects.skills.length===0);
    change('notes','Keep these notes');change('ac','19');
    for(const el of form.querySelectorAll('input,select,textarea'))el.checkValidity=()=>true;
    await saveCharacterSheet();closeCharacterSheet(true);await openCharacterSheet('c1');form=document.getElementById('characterSheetForm');
    check('Expanded race selections survive actual UI save/reopen',field('build.race').value==='kobold-mpmm'&&field('build.raceFeature').value==='sorcery'&&field('build.raceCantrip').value==='Fire Bolt'&&field('build.flexibleChoices.2').value==='cha'&&field('notes').value==='Keep these notes');
    change('build.race','simic-hybrid');change('build.raceFeature','climb');change('build.raceFeature2','water');change('build.extraLanguage','Vedalken');
    check('Simic second enhancement applies at level five',CharacterSheetModel.derive(sheetSession.data,5).effects.swim===30&&visible('build.raceFeature2'));
    change('identity.level','4');check('Level-down removes unavailable enhancement',!visible('build.raceFeature2')&&CharacterSheetModel.derive(sheetSession.data,4).effects.swim===0);
    change('build.race','tortle-mpmm');check('Natural armor reference preserves manually entered AC',field('ac').value==='19'&&document.getElementById('sheetBuildSummary').textContent.includes('AC 17'));
    change('build.race','grung');check('Poison immunity is shown separately from resistance',document.getElementById('sheetBuildSummary').textContent.includes('Immunities: Poison damage, Poisoned'));
    change('build.race','variant-human');change('build.raceFeat','<img src=x onerror=alert(1)>');check('Feat text renders safely',!document.getElementById('sheetBuildSummary').querySelector('img')&&document.getElementById('sheetBuildSummary').textContent.includes('<img'));
    for(const race of Object.keys(CharacterRules.races)) {
      change('build.edition',CharacterRules.races[race].edition);
      change('build.race',race);
      if(!document.getElementById('sheetBuildSummary').textContent.includes(CharacterRules.races[race].name))throw Error('Race summary missing: '+race);
    }
    check('All 79 race entries render without throwing or changing manual notes',field('notes').value==='Keep these notes');
    closeCharacterSheet(true);
  } catch(e) {results.push({name:e.stack,pass:false});}
  document.getElementById('test-results').textContent=JSON.stringify(results,null,2);
})();
