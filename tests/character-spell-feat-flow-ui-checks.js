(async()=>{
 const results=JSON.parse(document.getElementById('test-results').textContent),check=(name,ok)=>{results.push({name,pass:!!ok});if(!ok)throw Error(name)};
 try{
  closeCharacterSheet(true);seed('player');delete testSheetDocs['campaigns/a/characterSheets/c1'];
  testSheetDocs['campaigns/a/characters/c1']={name:'Mira',class:'Sorcerer',level:3,userId:'player'};
  await openCharacterSheet('c1');await Promise.resolve();await Promise.resolve();
  const form=document.getElementById('characterSheetForm');
  const change=(name,value)=>{const el=form.querySelector(`[name="${name}"]`);el.value=value;el.dispatchEvent(new Event('change',{bubbles:true}));};
  sheetSession.data.build.edition='2024';
  sheetSession.data.build.classId='sorcerer';
  sheetSession.identity.level=3;sheetSession.character.level=3;
  sheetSession.data.adobe.classLevels=[{classId:'sorcerer',level:3,subclassId:''}];
  fillSheetForm();updateSheetCalculations();
  await document.getElementById('sheetGenerateSpells').onclick();
  const dialog=document.getElementById('sheetSpellGenerator');
  check('Generate spell sheet opens a responsive dialog with all eight magic schools',dialog.open&&dialog.querySelectorAll('#spellGeneratorSchool option').length===9&&CharacterCatalog.schools.length===8);
  const first=dialog.querySelector('[data-spell-pick]');
  check('Spell generator provides eligible spell choices',!!first);
  first.checked=true;first.onchange();const chosenId=first.dataset.spellId;
  const search=dialog.querySelector('#spellGeneratorSearch');
  search.value='zzzz-no-spell';search.oninput();
  check('Filtering does not erase the in-progress selected spell',document.getElementById('spellGeneratorCount').textContent.includes('1/'));
  search.value='';search.oninput();
  const restored=[...dialog.querySelectorAll('[data-spell-pick]')].find(el=>el.dataset.spellId===chosenId);
  check('Clearing search restores the selected checkbox instead of resetting it',restored?.checked===true);
  const school=dialog.querySelector('#spellGeneratorSchool');school.value='Evocation';school.onchange();
  const visible=[...dialog.querySelectorAll('.sheet-spell-generator-row')];
  check('School filter limits generator results to Evocation',visible.length>0&&visible.every(row=>row.textContent.includes('Evocation')));
  school.value='';search.value='necrotic';search.oninput();
  const damageRows=[...dialog.querySelectorAll('[data-spell-pick]')].map(el=>CharacterCatalog.find(el.dataset.spellId));
  check('Spell search can match necrotic damage type, not only spell name',damageRows.length>0&&damageRows.some(spell=>(spell.combat?.types||[]).includes('necrotic')));
  school.value='';search.value='';search.oninput();
  dialog.querySelector('#spellGeneratorApply').onclick();
  check('A partial spell sheet can be generated before every allowed spell is chosen',!dialog.open&&sheetSession.data.spells.some(spell=>spell.catalogId===chosenId));

  change('build.race','human-2024');renderBuildFeatChoices();
  const human=document.querySelector('[data-build-feat-field="humanOriginFeat"]');
  check('Character Builder hides direct feat inputs and points to the Feats page',form.querySelector('[name="build.humanOriginFeat"]').closest('label').hidden&&!!document.getElementById('sheetBuilderFeatNotice')&&!!human);
  human.value='Lucky';human.onchange();
  check('Choosing a build-granted feat in Feat catalogue updates the character build',sheetSession.data.build.humanOriginFeat==='Lucky');
  check('Generic feat reset buttons are no longer shown on the Feats page',!document.querySelector('[data-feat-reset]'));
  closeCharacterSheet(true);
 }catch(e){results.push({name:e.stack,pass:false});}
 document.getElementById('test-results').textContent=JSON.stringify(results,null,2);
})();