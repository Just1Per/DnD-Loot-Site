#!/usr/bin/env node
// Builds a versioned local catalogue from the two approved SRD endpoints.
// Does not publish Firestore data or import artwork. Existing campaign copies are untouched.
const fs=require('node:fs'),path=require('node:path');
const {normalize}=require('../js/modules/campaign-monster-import');
const out=path.resolve(process.argv[2]||path.join(__dirname,'../data/rules/monsters.json'));
const cache=path.join(path.dirname(out),'.monster-import-cache');fs.mkdirSync(cache,{recursive:true});
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function read(url){for(let attempt=0;attempt<4;attempt++){try{const response=await fetch(url);if(!response.ok)throw Error(`HTTP ${response.status}`);return await response.json()}catch(error){if(attempt===3)throw Error(`${url}: ${error.message}`);await wait(300*(attempt+1))}}}
(async()=>{const records=[];for(const edition of ['2014','2024']){
 const index=await read(`https://www.dnd5eapi.co/api/${edition}/monsters`),queue=index.results.slice();let count=0;
 await Promise.all(Array.from({length:16},async()=>{while(queue.length){const entry=queue.shift(),file=path.join(cache,edition+'-'+entry.index+'.json');const raw=fs.existsSync(file)?JSON.parse(fs.readFileSync(file)):await read('https://www.dnd5eapi.co'+entry.url);if(!fs.existsSync(file))fs.writeFileSync(file,JSON.stringify(raw));records.push(normalize(raw,edition));if(++count%50===0)console.log(edition,count,'of',index.count)}}));console.log(edition,count,'approved SRD entries');
 }
 records.sort((a,b)=>a.id.localeCompare(b.id));if(new Set(records.map(row=>row.id)).size!==records.length)throw Error('Duplicate catalogue IDs');
 const payload={schemaVersion:1,generatedAt:new Date().toISOString(),sources:['SRD 5.1','SRD 5.2.1'],records};const temp=out+'.tmp';fs.writeFileSync(temp,JSON.stringify(payload));fs.renameSync(temp,out);console.log('Saved',records.length,'entries to',out);
})().catch(error=>{console.error(error);process.exitCode=1});
