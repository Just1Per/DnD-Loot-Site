'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const report=require('../docs/subclass-mechanics-audit.json');
test('mechanics audit inventories every selectable 2014 and 2024 subclass',()=>{
 assert.equal(report.summary.total,186);assert.ok(report.subclasses.some(row=>row.id==='berserker'&&row.edition==='2014'));assert.ok(report.subclasses.some(row=>row.id==='berserker-2024'&&row.edition==='2024'));
 for(const row of report.subclasses){assert.ok(Array.isArray(row.featureLevels),row.id);assert.ok(['partial-mechanics','reference-only'].includes(row.status),row.id);}
});
