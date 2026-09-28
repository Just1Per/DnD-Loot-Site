(async()=>{
 const results=JSON.parse(document.getElementById('test-results').textContent),check=(name,ok)=>{results.push({name,pass:!!ok});if(!ok)throw Error(name);};
 try{
 closeCharacterSheet(true);seed('player');delete testSheetDocs['campaigns/a/characterSheets/c1'];testSheetDocs['campaigns/a/characters/c1']={...characters[0]};await openCharacterSheet('c1');await Promise.resolve();
 let form=document.getElementById('characterSheetForm');const field=n=>form.querySelector(`[name="${n}"]`),change=(n,v)=>{field(n).value=v;field(n).dispatchEvent(new Event('change',{bubbles:true}));};
 check('Story owns all physical fields and a single alignment dropdown',field('profile.gender').closest('[data-sheet-section]').id==='sheet-story'&&field('alignment').tagName==='SELECT'&&form.querySelectorAll('[name="alignment"]').length===1&&field('alignment').querySelectorAll('option').length===10);
 change('alignment','Chaotic Good');change('profile.hair','Silver');change('profile.height',181);
 check('Alignment immediately updates overview and explanatory text',document.getElementById('sheetOverviewReadout').textContent.includes('Chaotic Good')&&document.getElementById('sheetAlignmentHelp').textContent.includes('injustice'));
 change('build.background','acolyte-2024');
 const story=document.querySelector('[data-story-choice="personality"]');story.value='0';story.onchange();check('Adobe story choice fills the saved text',field('personality').value===CharacterAdobeData.story.acolyte.personality[0]&&field('personality').readOnly);
 story.value='other';story.onchange();change('personality','My custom personality');check('Other unlocks custom text',!field('personality').readOnly&&sheetSession.data.personality==='My custom personality');
 change('build.edition','2014');change('build.race','half-orc');change('build.scoreMode','base');change('abilities.str',10);updateSheetCalculations();updateSheetCalculations();
 check('2014 racial score increases update effective cards without compounding',document.querySelector('[data-ability-score="str"]').textContent==='12'&&field('abilities.str').value==='10');
 change('build.edition','2024');change('build.race','human-2024');change('build.background','farmer-2024');change('build.backgroundAbilities.0','str');change('build.backgroundAbilities.1','con');
 check('2024 background replaces racial increases',document.querySelector('[data-ability-score="str"]').textContent==='12'&&document.querySelector('[data-ability-breakdown="str"]').textContent.includes('background'));
 change('build.race','');change('build.race','dragonborn-2024');check('Hidden species group can reappear after switching race',!document.getElementById('sheetSpeciesEditorGroup').hidden);
 change('build.classId','wizard');change('identity.level',5);change('build.background','custom');change('build.race','');
 const orb=(skill,rank)=>document.querySelector(`[data-skill="${skill}"][data-rank="${rank}"]`);orb('acrobatics',.5).onclick();check('Half training rounds half of proficiency down',sheetSession.data.skills.acrobatics.rank===.5&&document.querySelector('[data-derived="skills.acrobatics"]').textContent==='+1');orb('acrobatics',2).onclick();check('Expertise replaces half proficiency',sheetSession.data.skills.acrobatics.rank===2&&orb('acrobatics',2).getAttribute('aria-pressed')==='true'&&orb('acrobatics',.5).getAttribute('aria-pressed')==='false');orb('acrobatics',2).onclick();check('Second click clears manual proficiency',sheetSession.data.skills.acrobatics.rank===0);
 change('build.background','acolyte-2024');check('Automatic background training prevents lowering rank',orb('insight',.5).disabled&&orb('insight',1).getAttribute('aria-pressed')==='true');orb('insight',2).onclick();orb('insight',2).onclick();check('Removing manual expertise restores automatic proficiency',orb('insight',1).getAttribute('aria-pressed')==='true');
 change('slots.0.max',3);document.querySelector('[data-slot-level="0"][data-slot-number="1"]').onclick();check('Slot circles spend slots and update numeric saved fields',sheetSession.data.slots[0].used===2&&field('slots.0.used').value==='2');
 const fire=CharacterCatalog.spells({edition:'2024',search:'Fireball'}).find(s=>s.name==='Fireball');addCatalogSpells([fire.id]);check('Spell sheet shows selected spells, save, school, book and page',document.querySelector('.sheet-spell-table').textContent.includes('Fireball')&&document.querySelector('.sheet-spell-table').textContent.includes('DEX')&&document.querySelector('.sheet-spell-table').textContent.includes('Evocation'));
 document.querySelector('[data-prepare-spell="0"]').onclick();check('Prepared state syncs with spell editor',sheetSession.data.spells[0].prepared&&field('spells.0.prepared').checked);
 change('identity.level',1);document.getElementById('catalogFeatEdition').value='';document.getElementById('catalogFeatSearch').value='Alert';renderCatalogFeatResults();check('Both editions are listed and unavailable feats are disabled',document.getElementById('catalogFeatResults').textContent.includes('2014')&&document.getElementById('catalogFeatResults').textContent.includes('2024')&&[...document.querySelectorAll('[data-add-catalog-feat]')].every(b=>b.disabled));
 check('Players cannot create campaign gear from template controls',!document.getElementById('sheetAddBaseGear')&&!document.getElementById('sheetAddGearPack'));
 const names=[...form.querySelectorAll('[name]')].map(n=>n.name);check('New layout has no duplicate named inputs',new Set(names).size===names.length);
 for(const el of form.querySelectorAll('input,select,textarea'))el.checkValidity=()=>true;await saveCharacterSheet();closeCharacterSheet(true);await openCharacterSheet('c1');await Promise.resolve();form=document.getElementById('characterSheetForm');
 check('Profile, custom story, slot and spell changes survive reopening',sheetSession.data.profile.hair==='Silver'&&sheetSession.data.profile.height===181&&sheetSession.data.personality==='My custom personality'&&sheetSession.data.slots[0].used===2&&sheetSession.data.spells[0].prepared&&field('alignment').value==='Chaotic Good');
 closeCharacterSheet(true);seed('dm');await openCharacterSheet('c1');await Promise.resolve();
 check('DM has gear and pack campaign-copy controls',!!document.getElementById('sheetAddBaseGear')&&!!document.getElementById('sheetAddGearPack'));
 const template=CharacterAdobeData.gear[0];await addSheetGearTemplates([template]);const copied=items.find(i=>i.id==='base-'+template.id),before=JSON.stringify(fixtureSupply[copied.id]);
 check('DM gear templates start hidden, finite and assignment-only',copied.campaignId==='a'&&!copied.visible&&copied.lootMode==='dm'&&!fixtureSupply[copied.id].unlimited);
 await addSheetGearTemplates([template]);check('Adding a gear template again preserves existing campaign stock',before===JSON.stringify(fixtureSupply[copied.id])&&items.filter(i=>i.id===copied.id).length===1);
 check('Spell catalogue is outside the collapsed spell editor',!document.getElementById('sheetSpellCatalog').closest('#sheetSpellEditor'));
 closeCharacterSheet(true);
 }catch(e){results.push({name:e.stack,pass:false});}
 document.getElementById('test-results').textContent=JSON.stringify(results,null,2);
})();
