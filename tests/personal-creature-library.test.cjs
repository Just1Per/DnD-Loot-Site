'use strict';
/* Run: node tests/personal-creature-library.test.cjs */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const rows=new Map();
let user='dm-1';
const sdk={
 auth:{currentUser:{get uid(){return user;}}},
 db:{},
 collection:(_db,...parts)=>parts.join('/'),
 doc:(collection,id)=>collection+'/'+id,
 getDocs:async path=>({docs:[...rows].filter(([key])=>key.startsWith(path+'/')).map(([key,value])=>({id:key.split('/').at(-1),data:()=>structuredClone(value)}))}),
 getDoc:async path=>({exists:()=>rows.has(path),data:()=>rows.get(path)}),
 setDoc:async(path,value)=>{rows.set(path,structuredClone(value));},
 updateDoc:async(path,changes)=>{if(!rows.has(path))throw Error('Not found');rows.set(path,{...rows.get(path),...structuredClone(changes)});},
 deleteDoc:async path=>{rows.delete(path);}
};
const scope={window:{__DND_VAULT_DEPS__:sdk},CampaignCreatures:{normalize:value=>structuredClone(value)},structuredClone,crypto:require('node:crypto').webcrypto,console,process};
vm.createContext(scope);
vm.runInContext(fs.readFileSync('js/modules/personal-creature-library.js','utf8'),scope);
const lib=scope.PersonalCreatureLibrary;
(async()=>{
 const creature={title:'Goblin Captain',summary:'First campaign',content:'Private preparation',data:{category:'Boss',hp:30,links:[{kind:'chapter',id:'old-chapter'}],chapterIds:['private-old-chapter'],source:{provider:'SRD'}}};
 const id=await lib.add(creature);
 assert.equal((await lib.list()).length,1);
 creature.data.hp=1;
 assert.equal((await lib.list())[0].data.hp,30,'saved templates are independent snapshots');
 assert.equal((await lib.list())[0].data.links,undefined,'campaign-specific links are stripped');
 assert.equal((await lib.list())[0].data.chapterIds,undefined,'chapter IDs are stripped');
 assert.equal((await lib.list())[0].data.source.provider,'SRD','source attribution is preserved');
 await lib.update(id,{...creature,title:'Goblin Warlord',data:{hp:50}});
 assert.equal((await lib.list())[0].title,'Goblin Warlord');
 assert.equal((await lib.list())[0].data.hp,50);
 assert.equal((await lib.list())[0].createdBy,'dm-1');
 const duplicateId=await lib.add({...await lib.list().then(rows=>rows.find(row=>row.id===id)),title:'Goblin Warlord (Copy)'});
 assert.notEqual(duplicateId,id,'duplicate has its own ID');
 await lib.update(id,{...creature,title:'Changed original',data:{hp:80}});
 const copy=(await lib.list()).find(row=>row.id===duplicateId);
 assert.equal(copy.title,'Goblin Warlord (Copy)','duplicate remains unchanged');
 assert.equal(copy.data.hp,50,'duplicate stats remain independent');
 user='dm-2';
 assert.equal((await lib.list()).length,0,'another DM cannot list the first DM templates');
 user='dm-1';
 await assert.rejects(()=>lib.add({...creature,title:''}),/name/);
 await lib.remove(id);
 assert.equal((await lib.list()).length,1,'deleting source does not delete duplicate');
 await lib.remove(duplicateId);
 assert.equal((await lib.list()).length,0);
 console.log('Personal creature library store tests passed.');
})().catch(error=>{console.error(error);process.exitCode=1;});
