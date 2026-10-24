'use strict';
/*
 * Reports how much of the user-supplied Adobe/MPMB reference is represented
 * by the web character system. This is intentionally a coverage audit, not a
 * copy of Acrobat JavaScript.
 */
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const json=p=>JSON.parse(read(p));
const baseline=json('data/rules/adobe-parity-baseline.json');
const catalog=json('data/rules/catalog.json');
const adobe=json('data/rules/adobe-reference.json');
const model=read('js/modules/character-sheet-model.js');
const rules=read('js/modules/character-rules.js');
const races=read('js/modules/character-race-catalog.js');
const backgrounds=read('js/modules/character-background-data.js');
const equipment=read('js/modules/character-equipment.js');
const classProgression=fs.existsSync(path.join(root,'js/modules/character-class-progression.js'))?read('js/modules/character-class-progression.js'):'';
const report=[];
const add=(category,status,detail)=>report.push({category,status,detail});
const norm=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,'');
const hasAll=(text,names)=>names.filter(name=>!norm(text).includes(norm(name)));

let missing=hasAll(model,baseline.standardSkills);
add('skills',missing.length?'missing':'covered',missing.length?`Missing: ${missing.join(', ')}`:`${baseline.categories.skills} standard skills found in the sheet model.`);

missing=hasAll(rules,baseline.baseClasses);
add('classes',missing.length?'missing':'covered',missing.length?`Missing: ${missing.join(', ')}`:`All ${baseline.categories.classes} Adobe base classes are represented.`);
const classFeatureCoverage=baseline.baseClasses.filter(name=>norm(classProgression).includes(norm(name))).length;
add('class progression',classFeatureCoverage===baseline.categories.classes?'covered':'partial',`${classFeatureCoverage}/${baseline.categories.classes} base classes have Adobe feature unlock references.`);

missing=hasAll(rules+'\n'+races,baseline.baseRaces);
add('races',missing.length?'missing':'covered',missing.length?`Missing: ${missing.join(', ')}`:`All ${baseline.categories.races} Adobe base races are represented; the web catalogue also contains additional races/species.`);

missing=hasAll(backgrounds,'Acolyte'.split('|'));
add('backgrounds',missing.length?'missing':'covered',missing.length?'Acolyte is missing.':'Adobe base background Acolyte is represented; the site contains a larger background catalogue.');

const spells2014=catalog.spells.filter(s=>s.edition==='2014');
add('spells',spells2014.length>=baseline.categories.spells?'covered':'missing',`${spells2014.length} 2014 spell records available; Adobe base list contains ${baseline.categories.spells}.`);
const grappler=catalog.feats.some(f=>f.edition==='2014'&&norm(f.name)==='grappler');
add('feats',grappler?'covered':'missing',`${catalog.feats.filter(f=>f.edition==='2014').length} 2014 feat records available; Adobe base feat Grappler ${grappler?'is':'is not'} present.`);

const gearCount=Array.isArray(adobe.gear)?adobe.gear.length:0;
const baseEquipment=Array.isArray(adobe.baseEquipment)?adobe.baseEquipment.length:0;
add('gear',gearCount>=baseline.categories.gear?'covered':'partial',`${gearCount} Adobe adventuring-gear records imported.`);
add('weapons & armor',norm(equipment).includes('breastplate')&&norm(equipment).includes('plate')?'covered':'partial',`${baseEquipment} base equipment records imported; AC/weapon mechanics are handled by the equipment engine.`);

const subclassPath='js/modules/character-subclass-data.js';
const subclassText=fs.existsSync(path.join(root,subclassPath))?read(subclassPath):'';
missing=hasAll(subclassText,baseline.baseSubclasses);
add('subclasses',missing.length?'partial':'covered',missing.length?`Structured Adobe base subclasses still missing: ${missing.join(', ')}`:`All ${baseline.categories.subclasses} Adobe base subclasses are structured for class-level selection.`);

const creaturePaths=Array.from({length:4},(_,i)=>`js/modules/character-creature-data-${i+1}.js`);
const creatureFilesPresent=creaturePaths.every(p=>fs.existsSync(path.join(root,p)));
const creatureText=creatureFilesPresent?creaturePaths.map(read).join('\n'):'';
const creatureCount=(creatureText.match(/\"id\":/g)||[]).length;
const creatureUI=fs.existsSync(path.join(root,'js/modules/character-creature-ui.js'));
add('creatures',creatureFilesPresent&&creatureUI&&creatureCount===baseline.categories.creatures?'covered':'partial',creatureFilesPresent?`${creatureCount}/${baseline.categories.creatures} Adobe creature records imported${creatureUI?' with':' without'} the Companion/Familiar/Wild Shape picker.`:`${baseline.categories.creatures} Adobe base creatures still need a complete structured web catalogue.`);

const magicItemMechanics=path.join(root,'data/rules/adobe-magic-item-reference.json');
let magicItemReference=null;
if(fs.existsSync(magicItemMechanics))try{magicItemReference=JSON.parse(fs.readFileSync(magicItemMechanics,'utf8'));}catch{}
const magicItemCount=Array.isArray(magicItemReference?.names)?magicItemReference.names.length:0;
const magicAutomationCount=magicItemReference?.automation&&typeof magicItemReference.automation==='object'?Object.keys(magicItemReference.automation).length:0;
add('magic items',magicItemCount>=baseline.categories.magicItems?'covered':'partial',magicItemCount?`${magicItemCount}/${baseline.categories.magicItems} Adobe base magic items indexed; ${magicAutomationCount} high-confidence automatic effect profiles plus generic armor/weapon variants.`:`${baseline.categories.magicItems} Adobe base magic items are not yet represented by one complete structured mechanics reference; root-library item data and equipment effects are currently split.`);

// Adobe inventory presence cannot verify access control or a deployed rules version.
// The former revision-comment/schema-allowlist heuristic became stale when rules
// moved to a stable, versioned document envelope; it produced a false rules gap.
add('Firestore permissions','not-assessed','Outside this metadata inventory. Use the existing permission/emulator checks; this scan cannot identify deployed production rules.');

console.log('Adobe/MPMB metadata inventory only. PRESENT means records/names are available, not that every mechanic is implemented.');
for(const row of report)console.log(`${(row.status==='covered'?'present':row.status).toUpperCase().padEnd(12)} ${row.category}: ${row.detail}`);
const assessed=report.filter(row=>row.status!=='not-assessed'),incomplete=assessed.filter(row=>row.status!=='covered');
console.log(`\nAdobe inventory: ${assessed.length-incomplete.length}/${assessed.length} metadata categories present; ${incomplete.length} inventory gaps.`);
console.log('Class-feature mechanics, source-specific rules and authorization require their separate audits/tests.');
if(process.argv.includes('--strict')&&incomplete.length)process.exitCode=1;
