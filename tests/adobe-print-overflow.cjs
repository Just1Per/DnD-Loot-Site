'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),P=require('../js/modules/character-adobe-print-overflow');
test('text pagination keeps every character and prefers a nearby word boundary',()=>{
 const text='A long paragraph with spaces and\nnew lines. '+('More text. '.repeat(40));let remaining=text;const parts=[];
 while(remaining){const part=P.take(remaining,s=>s.length<=53);assert.ok(part.head.length>0&&part.head.length<=53);parts.push(part.head);remaining=part.tail;}
 assert.equal(parts.join(''),text);assert.equal(P.take('one two three four five',s=>s.length<=20).head,'one two three four ');
});
test('flow does not split surrogate pairs, combining letters or emoji graphemes',()=>{
 const text='Æ 👨‍👩‍👧‍👦 e\u0301 🌲 τέλος';let remaining=text;const chunks=[];
 while(remaining){const part=P.take(remaining,s=>[...new Intl.Segmenter(undefined,{granularity:'grapheme'}).segment(s)].length<=3);assert.ok(part.head);chunks.push(part.head);remaining=part.tail;}
 assert.equal(chunks.join(''),text);assert.ok(chunks.some(s=>s.includes('👨‍👩‍👧‍👦')));assert.ok(chunks.some(s=>s.includes('e\u0301')));
});
test('a field with no available space reports no progress instead of dropping text',()=>{
 assert.deepEqual(P.take('Unchanged',()=>false),{head:'',tail:'Unchanged'});assert.deepEqual(P.take('',()=>true),{head:'',tail:''});assert.deepEqual(P.take('Fits',s=>s.length<=4),{head:'Fits',tail:''});
});
