// Deterministic SDK fixture only: no Firebase network, credentials or production writes.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),{execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),baseline=process.argv[2],delay=25;
const read=(file,ref)=>ref?execFileSync('git',['show',ref+':js/modules/'+file],{cwd:root,encoding:'utf8'}):fs.readFileSync(root+'/js/modules/'+file,'utf8');
async function run(ref){
 const rows=[];
 for(let i=0;i<3;i++){
  const reads=[],installed=[];let writes=0;
  const wait=()=>new Promise(resolve=>setTimeout(resolve,delay));
  const context=vm.createContext({console:{warn(){}},structuredClone,Map,Set,Date,currentUser:null,db:{},isAdmin:()=>false,normalizeEmail:v=>String(v||'').toLowerCase(),
    doc:(_, ...p)=>p.join('/'),collection:(_, ...p)=>p.join('/'),
    getDoc:async key=>{reads.push(key);await wait();return {exists:()=>true,data:()=>key.startsWith('users/')?{name:'Fixture player',role:['player']}:{version:2026100901}};},
    getDocs:async key=>{reads.push(key);await wait();const id=key.endsWith('/classes')?'fighter':'champion';return {docs:[{id,data:()=>({id,catalogVersion:2026100901})}]};},setDoc:async()=>{writes++;await wait();},
    CharacterClassProgression:{installReference:edition=>installed.push(edition)}});
  context.window=context;context.__DND_VAULT_DEPS__={db:context.db,doc:context.doc,collection:context.collection,getDoc:context.getDoc,getDocs:context.getDocs};
  vm.runInContext(read('character-rules-catalog-store.js',ref),context);vm.runInContext(read('data.js',ref),context);
  const start=performance.now();await context.loadCurrentUser({uid:'fixture-user'});
  if(installed.length!==2||writes!==1)throw Error('Unexpected fixture behavior');
  rows.push({ms:Math.round(performance.now()-start),reads:reads.length,rulesReads:reads.filter(x=>x.startsWith('rulesCatalog/')).length});
 }
 return {ref:ref||'working tree',simulatedSdkLatencyMs:delay,rows};
}
(async()=>{if(baseline)console.log(JSON.stringify(await run(baseline)));console.log(JSON.stringify(await run()));})().catch(e=>{console.error(e.message);process.exitCode=1;});
