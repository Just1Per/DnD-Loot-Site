'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {audit,markdown}=require('../scripts/audit-adobe-popups.cjs');
const root=path.resolve(__dirname,'..'),current=audit();
test('popup ledger matches live dialog declarations, concrete flyouts and editor routes',()=>{
 assert.deepEqual(JSON.parse(fs.readFileSync(root+'/docs/adobe-inventory/popups.json','utf8')),current);
 assert.equal(fs.readFileSync(root+'/docs/adobe-inventory/popups-da.md','utf8'),markdown(current));
 for(const row of current.popups){assert.ok(fs.existsSync(root+'/'+row.file));assert.ok(row.entry&&row.notes&&row.category);}
});
test('native interceptors are distinguished from active Standard-body bridges',()=>{
 const route=id=>current.routes.find(row=>row.command===id);
 assert.equal(route('features').popup,'adobeClassDialog');assert.equal(route('features').implementation,'native');
 assert.equal(route('weight').implementation,'native');assert.equal(route('resources').implementation,'moves-standard-body');
 assert.equal(route('resources').selector,'#sheetFeatResources');assert.equal(route('spellSlots').selector,'#sheet-spells');
 const druid=current.popups.find(row=>row.id==='adobeDruidFormsDialog');assert.equal(druid.category,'moves-component');assert.match(druid.notes,/#sheetDruidWildShape/);
 const print=current.popups.find(row=>row.id==='sheetPrintDialog');assert.equal(print.category,'standard-only');
});
test('nested popup routes and indirect rest/preparation/Wild Shape handlers remain on the removal checklist',()=>{
 const ids=new Set(current.routes.map(row=>row.command));for(const call of current.editorCalls)if(call.command!=='dynamic')assert.ok(ids.has(call.command),call.command+' route missing');
 for(const key of ['data-combat-recover','data-generated-prepare','data-wild-end'])assert.ok(current.sharedCommands.some(call=>call.expression.includes(key)),key);
 assert.ok(current.infrastructure.some(row=>row.id==='characterSheetDialog'));assert.ok(current.infrastructure.some(row=>row.id==='siteConfirmationDialog'));
 assert.ok(current.popups.some(row=>row.id==='sheetSpellGenerator'&&row.category==='nested-standard-dialog'));
});
