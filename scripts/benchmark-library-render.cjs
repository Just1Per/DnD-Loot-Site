// Synthetic Library render benchmark. No production requests or writes; excludes image/network latency.
const fs=require('node:fs'),path=require('node:path');
const {createRequire}=require('node:module');
const requireTests=createRequire(path.resolve(__dirname,'../tests/package.json'));
const {chromium}=requireTests(process.env.PLAYWRIGHT_PATH||'playwright');
const root=path.resolve(__dirname,'..'),out=process.env.UI_OUTPUT_DIR||require('node:os').tmpdir()+'/campaignatlas-ui-checks';fs.mkdirSync(out,{recursive:true});
const assert=require('node:assert/strict');
const errors=[];
(async()=>{const browser=await chromium.launch({headless:true});try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}});page.setDefaultTimeout(7000);
 page.on('pageerror',error=>errors.push(error.message));
 let html=fs.readFileSync(path.join(root,'index.html'),'utf8').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<link\b[^>]*href="([^"]*)"[^>]*>/gi,(tag,href)=>href.startsWith('css/')?'<style data-audit-file="'+href.split('?')[0]+'">'+fs.readFileSync(path.join(root,href.split('?')[0]),'utf8')+'\n/*# sourceURL='+href.split('?')[0]+' */</style>':tag);
 await page.route('https://fixture.example.test/**',route=>{const rel=new URL(route.request().url()).pathname.slice(1),file=path.join(root,rel);return route.fulfill(rel&&fs.existsSync(file)&&fs.statSync(file).isFile()?{path:file}:{contentType:'text/html',body:html})});await page.goto('https://fixture.example.test/',{waitUntil:'domcontentloaded'});
 await page.evaluate(data=>{window.__testCatalog=data;window.print=()=>{};window.fetch=async()=>({ok:true,json:async()=>window.__testCatalog});window.alert=text=>{window.auditAlerts||=[];auditAlerts.push(text)};window.confirm=()=>true;window.prompt=()=> 'Sample note'},JSON.parse(fs.readFileSync(root+'/data/rules/catalog.json','utf8')));
 for(const file of ['dom-setup.js','dom-fixture.js'])await page.addScriptTag({path:root+'/tests/'+file});
 await page.evaluate(()=>{const d=window.__DND_VAULT_DEPS__;d.where=(field,op,value)=>({field,op,value});d.query=(path,...filters)=>({path,filters});d.getDocs=async q=>{const p=typeof q==='string'?q:q.path,f=q.filters||[];return {docs:Object.entries(testSheetDocs).filter(([key,data])=>key.startsWith(p+'/')&&!key.slice(p.length+1).includes('/')&&f.every(f=>{const v=f.field.split('.').reduce((d,k)=>d?.[k],data);return f.op==='array-contains'?v?.includes(f.value):v===f.value})).map(([key,data])=>({id:key.split('/').at(-1),data:()=>structuredClone(data)}))}};d.ref=(_,p)=>p;d.getBlob=async()=>new Blob();d.uploadBytes=async()=>{};});
 await page.evaluate(()=>{const sdk=window.__DND_VAULT_DEPS__,original=sdk.runTransaction;window.journalWatchers=[];window.failJournalWrite=false;sdk.runTransaction=async(...args)=>{if(window.failJournalWrite)throw Error('Simulated save failure');return original(...args)};sdk.onSnapshot=(path,next,error)=>{const watch={path,next,error,active:true};journalWatchers.push(watch);return()=>{watch.active=false}};});
 await page.addScriptTag({content:'function createCampaignStore(){return window.__DND_VAULT_DEPS__.vaultCall}'});
 const modules=JSON.parse(fs.readFileSync(root+'/tests/dom.cjs','utf8').match(/for\(const name of (\[[^\n]+?\])\)await run/)[1].replaceAll("'",'"'));
 for(const name of modules)await page.addScriptTag({path:root+'/js/modules/'+name+'.js'});
 await page.evaluate(()=>{CharacterCatalog.set(__testCatalog);document.getElementById('siteBootPanel')?.remove()});await page.addScriptTag({path:root+'/tests/dom-state.js'});
 await page.evaluate(data=>{window.__testMonsters=data;window.fetch=async u=>({ok:true,json:async()=>String(u).includes('monsters.json')?__testMonsters:__testCatalog});window.auditSeed=role=>{closeCharacterSheet(true);CampaignWorkspace.clear(true);SiteHelp.onLogout();seed(role);document.getElementById('loginControls').style.display='none';document.getElementById('logoutButton').style.display='inline-block';document.getElementById('adminTab').style.display=role==='admin'?'inline-block':'none';document.getElementById('userDisplay').textContent='Sample '+role;document.getElementById('activeCampaignName').textContent=activeCampaign.name;renderDMTools();SiteHelp.onLogin();};},JSON.parse(fs.readFileSync(root+'/data/rules/monsters.json','utf8')));




 await page.context().newCDPSession(page).then(session=>session.send('Emulation.setCPUThrottlingRate',{rate:4}));
 const measurements=await page.evaluate(()=>{
  auditSeed('dm');showTab('library');window.itemImageMarkup=()=>'';window.observePendingImages=()=>{};
  const result=[];
  for(const count of [100,500,1000,2000]){
   const base={...items[0],visible:true,name:'Harbor relic',category:'Wondrous Item',rarity:'Rare',description:'A reusable charm with a short description.',source:'Synthetic benchmark',properties:[{title:'Tide',text:'A useful item for the coast.'}],classes:['Wizard'],lootMode:'dm'};
   items=Array.from({length:count},(_,i)=>({...base,id:'bench-'+i,name:i%100===0?'Needle charm '+i:'Harbor relic '+i}));
   inventory=items.filter((_,i)=>i%3===0).map(item=>({itemId:item.id,userId:'player',characterId:'p1',quantity:1}));saves=items.filter((_,i)=>i%5===0).map(item=>({itemId:item.id,characterId:'p1',userId:'player'}));
   for(const query of ['unmatched search','needle','']){
    document.getElementById('search').value=query;renderCards();const values=[];
    for(let n=0;n<5;n++){const start=performance.now();renderCards();values.push(performance.now()-start);}
    values.sort((a,b)=>a-b);result.push({count,query:query||'all',cards:document.querySelectorAll('#card-container .item-card').length,medianMs:Math.round(values[2]),maxMs:Math.round(values[4])});
   }
  }
  return result;
 });
 assert.deepEqual(errors,[]);console.log(JSON.stringify(measurements,null,2));
 }finally{await browser.close()}})().catch(error=>{console.error(error);process.exitCode=1});
