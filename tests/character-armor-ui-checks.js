(async()=>{
 const results=JSON.parse(document.getElementById('test-results').textContent),check=(name,ok)=>{results.push({name,pass:!!ok});if(!ok)throw Error(name);};
 try{
 closeCharacterSheet(true);seed('player');delete testSheetDocs['campaigns/a/characterSheets/c1'];testSheetDocs['campaigns/a/characters/c1']={...characters[0]};await openCharacterSheet('c1');await Promise.resolve();
 const field=n=>document.querySelector(`[name="${n}"]`),change=(n,v)=>{field(n).value=v;field(n).dispatchEvent(new Event('change',{bubbles:true}));};
 change('build.classId','fighter');change('build.background','custom');change('build.race','');change('abilities.dex',16);
 const choose=(kind,value)=>{const el=document.getElementById(kind==='armor'?'sheetArmorSelect':'sheetShieldSelect');el.value=value;el.onchange({target:el});},ac=()=>Number(document.querySelector('[data-derived="ac"]').textContent);
 check('Armor controls show a shield badge and automatic unarmored AC',!!document.querySelector('#sheetInventoryDefense svg')&&ac()===13);
 choose('armor','base:equipment-leather');check('Selecting standard light armor adds, equips and applies full DEX',ac()===14&&sheetSession.data.personalGear.some(g=>g.name==='Leather')&&document.querySelector('.sheet-defense-formula').textContent.includes('DEX +3'));
 choose('armor','base:equipment-scale-mail');check('Medium armor caps positive DEX at two',ac()===16&&document.querySelector('.sheet-defense-formula').textContent.includes('maximum +2'));
 choose('shield','base:equipment-shield');check('Shield adds two and stays in sync with Overview',ac()===18&&document.querySelector('.sheet-defense-emblem strong').textContent==='18');
 choose('armor','base:equipment-plate');check('Heavy armor excludes DEX',ac()===20&&document.querySelector('.sheet-defense-formula').textContent.includes('not applied'));
 const count=sheetSession.data.personalGear.length,id=sheetSession.data.personalGear.find(g=>g.name==='Leather').id;choose('armor',id);check('Reselecting owned armor does not duplicate it',sheetSession.data.personalGear.length===count&&ac()===16);
 change('abilities.dex',8);choose('armor',sheetSession.data.personalGear.find(g=>g.name==='Scale Mail').id);check('Medium armor still applies negative DEX',ac()===15);
 choose('armor','');choose('shield','');check('Unarmored and no shield clear worn selections without deleting gear',ac()===9&&sheetSession.data.personalGear.length===count);
 const magic={id:'armor-magic',name:'Leather +1',properties:[],visible:true,updatedAt:1,mechanics:CharacterEquipment.normalize({kind:'armor',base:'leather',acBonus:1})};items.push(magic);inventory.push({id:'magic-owned',characterId:'c1',userId:'player',quantity:1,itemId:magic.id,item:magic});refreshCharacterSheetInventory();choose('armor','magic-owned');check('Owned magical armor is selectable and its bonus applies once',ac()===11&&document.querySelector('.sheet-defense-formula').textContent.includes('item bonuses +1'));
 choose('armor',id);for(const el of document.querySelectorAll('#characterSheetForm input,select,textarea'))el.checkValidity=()=>true;await saveCharacterSheet();closeCharacterSheet(true);await openCharacterSheet('c1');await Promise.resolve();check('Armor selection and AC survive saving and reopening',document.getElementById('sheetArmorSelect').value===id&&ac()===10);
 closeCharacterSheet(true);
 }catch(e){results.push({name:e.stack,pass:false});}
 document.getElementById('test-results').textContent=JSON.stringify(results,null,2);
})();
