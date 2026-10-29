'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const M=require('../js/modules/character-sheet-model'),vm=require('node:vm');
const context=vm.createContext({CharacterSheetModel:{__adobeIntegrated:true},CharacterProgression:require('../js/modules/character-progression'),CharacterPaperCombat:require('../js/modules/character-paper-combat'),CharacterItemResources:require('../js/modules/character-item-resources'),CharacterAdventureLog:require('../js/modules/character-adventure-log'),CharacterFeatRules:require('../js/modules/character-feat-rules'),CharacterClassProgression:require('../js/modules/character-class-progression'),CharacterClassFeatureChoices:require('../js/modules/character-class-feature-choices')});
vm.runInContext(fs.readFileSync(path.join(__dirname,'../js/modules/character-adobe-engine.js'),'utf8'),context);const E=context.CharacterAdobeEngine;
const manifest=require('../data/adobe-icons/icons.json');
test('the built-in artwork contains exactly the original 13 classes, 15 faction variants and 10 seasons',()=>{
 assert.equal(manifest.icons.length,38);assert.equal(new Set(manifest.icons.map(row=>row.id)).size,38);
 assert.equal(manifest.icons.filter(row=>row.group==='Class').length,13);assert.equal(manifest.icons.filter(row=>row.group.startsWith('Faction ')).length,15);
 for(const row of manifest.icons){assert.equal(E.paperIcon({builtin:row.id}).builtin,row.id);assert.equal(row.asset,row.id+'.webp');assert.ok(row.width>0&&row.height>0&&Math.max(row.width,row.height)===384);const bytes=fs.readFileSync(path.join(__dirname,'../data/adobe-icons',row.asset));assert.equal(bytes.subarray(0,4).toString(),'RIFF');assert.equal(bytes.subarray(8,12).toString(),'WEBP');}
 assert.doesNotMatch(JSON.stringify(manifest),/Malakor|Portrait|javascript|data:image|SaveIMG/);
});
test('icon preferences use bounded generic references or the existing private image whitelist',()=>{
 for(const builtin of ['../../secret','class-unknown','https://example.test/image','class-fighter.png','__proto__'])assert.equal(E.paperIcon({builtin}).builtin,'');
 const image='data:image/png;base64,YQ==';assert.deepEqual(JSON.parse(JSON.stringify(E.paperIcon({builtin:'class-fighter',image,print:true}))),{builtin:'',image,print:true});
 for(const image of ['data:image/svg+xml;base64,YQ==','https://example.test/image','data:image/png;base64,'+'a'.repeat(160000)])assert.equal(E.paperIcon({image}).image,'');
 assert.equal(E.paperIcon({builtin:'class-fighter',print:'true'}).print,false);
});
test('appearance preferences round-trip through Adobe normalization without changing character rules',()=>{
 const d=M.normalize({build:{classId:'fighter'},abilities:{str:16}}),before=M.derive(d,5);d.adobe=E.normalize({paperIcons:{header:{builtin:'class-wizard',print:true},log:{builtin:'season-rotf',print:false}}});
 const saved=E.normalize(JSON.parse(JSON.stringify(d.adobe))),after=M.derive(d,5);assert.equal(saved.paperIcons.header.builtin,'class-wizard');assert.equal(saved.paperIcons.header.print,true);assert.equal(saved.paperIcons.log.builtin,'season-rotf');assert.equal(d.build.classId,'fighter');
 for(const key of ['scores','ac','hpMax','attacks','pb'])assert.deepEqual(after[key],before[key]);
});
