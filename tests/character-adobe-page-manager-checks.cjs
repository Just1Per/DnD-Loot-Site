const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');

const pages=read('js/modules/character-adobe-pages.js');
assert.ok(pages.includes('sheetPageManager'),'Page manager dialog should replace the old drop-down menu');
assert.ok(pages.includes('data-toggle-page'),'Page manager should toggle optional pages on and off');
assert.ok(pages.includes('draggable=true'),'Character sheet tabs should be draggable');
assert.ok(pages.includes('tabOrder'),'Tab order should be persisted');

const creatures=read('js/modules/character-creature-ui.js');
assert.ok(creatures.includes('data-creature-select'),'Companion page should use a creature dropdown');
assert.ok(read('js/modules/character-adobe-pages.js').includes('data-comp-attacks'),'Companion page should expose stored attacks in a dropdown');
assert.ok(creatures.includes("x.type==='Beast'"),'Wild Shape should filter the Adobe catalogue to Beasts');
assert.ok(creatures.includes("c.type==='familiar'"),'Familiar should use its own catalogue filter');

const dm=read('js/modules/dm-tools.js');
assert.ok(dm.includes('hardDeleteDMCampaignCharacter'),'DM tools should expose permanent character deletion');
assert.ok(dm.includes("'characterSheets',character.id"),'Permanent deletion should remove the private sheet');
assert.ok(dm.includes("'inventory'"),'Permanent deletion should clean character inventory');
assert.ok(dm.includes("'saves'"),'Permanent deletion should clean character saved-item links');

const rules=read('firestore.rules');
assert.ok(/Firestore Rules Revision: \d+/.test(rules));
assert.ok(rules.includes('Character sheet schema: 14'));
console.log('SUCCESS page manager, draggable tabs, creature dropdowns and DM delete smoke checks');
