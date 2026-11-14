'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),acorn=require('acorn'),Magic=require('../js/modules/character-magic-items');
const source=fs.readFileSync(require.resolve('../js/modules/campaign-items.js'),'utf8'),node=acorn.parse(source,{ecmaVersion:'latest'}).body.find(n=>n.type==='FunctionDeclaration'&&n.id.name==='inventoryItem');
function resolve(items,entry){return vm.runInNewContext(source.slice(node.start,node.end)+';inventoryItem',{items,activeCampaign:{name:'Coast'},CharacterMagicItems:Magic})(entry);}
const current=()=>({id:'relic',name:'Custom relic',edition:'2014',attunement:true,description:'Current catalogue description',updatedAt:10});
const owned=()=>({id:'owned-relic',itemId:'relic',quantity:2,item:{name:'Custom relic',edition:'2014',attunement:false,description:'Kept owned snapshot note',mechanics:{acBonus:2},updatedAt:999}});
test('old loot inherits only the matching readable item attunement requirement without re-looting or changing snapshots',()=>{
 const item=current(),entry=owned(),before=JSON.stringify({item,entry}),result=resolve([item],entry);assert.equal(result.attunement,true);assert.equal(result.description,entry.item.description);assert.equal(result.updatedAt,999);assert.deepEqual(result.mechanics,entry.item.mechanics);assert.equal(JSON.stringify({item,entry}),before);
});
test('missing or different-name/source-edition catalogue rows cannot change an owned snapshot requirement',()=>{
 const entry=owned();assert.equal(resolve([],entry).attunement,false);assert.equal(resolve([{...current(),name:'Different relic'}],entry).attunement,false);assert.equal(resolve([{...current(),edition:'2024'}],entry).attunement,false);assert.equal(resolve([{...current(),id:'other'}],entry).attunement,false);
});
test('existing snapshot requirement details and normal newer-catalogue selection remain intact',()=>{
 const entry=owned();entry.item.attunement='requires attunement by a spellcaster';assert.equal(resolve([current()],entry).attunement,entry.item.attunement);const fresh={...current(),updatedAt:1000};assert.equal(resolve([fresh],entry),fresh);assert.equal(resolve([{...current(),attunement:false}],owned()).attunement,false);
});
