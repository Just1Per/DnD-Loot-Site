'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const report=require('../docs/subclass-mechanics-audit.json');
test('mechanics audit inventories every selectable 2014 and 2024 subclass',()=>{
 assert.equal(report.summary.total,186);assert.equal(report.summary.referenceOnly,0);assert.equal(report.summary.partialMechanics,186);assert.ok(report.subclasses.some(row=>row.id==='berserker'&&row.edition==='2014'));assert.ok(report.subclasses.some(row=>row.id==='berserker-2024'&&row.edition==='2024'));
 for(const row of report.subclasses){assert.ok(Array.isArray(row.featureLevels),row.id);assert.ok(row.sourceReview?.revision==='b9061583536101068b3a59d27e886d1fa664e366',row.id);assert.ok(row.sourceReview?.path.includes('class-'),row.id);assert.ok(row.limitations.length>0,row.id);for(const value of Object.values(row.mechanics))assert.equal(typeof value,'boolean',row.id);assert.ok(['partial-mechanics','reference-only'].includes(row.status),row.id);}
});
