// Deterministic authenticated app fixture for the connected Adobe browser checks.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
module.exports=async browser=>{const errors=[];
 const page=await browser.newPage({viewport:{width:1440,height:1000}});page.setDefaultTimeout(7000);
 page.on('pageerror',error=>errors.push(error.message));
 let html=fs.readFileSync(path.join(root,'index.html'),'utf8').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<link\b[^>]*href="([^"]*)"[^>]*>/gi,(tag,href)=>href.startsWith('css/')?'<style data-audit-file="'+href.split('?')[0]+'">'+fs.readFileSync(path.join(root,href.split('?')[0]),'utf8')+'\n/*# sourceURL='+href.split('?')[0]+' */</style>':tag);
 await page.route('https://fixture.example.test/**',route=>{const rel=new URL(route.request().url()).pathname.slice(1),file=path.join(root,rel);return route.fulfill(rel&&fs.existsSync(file)&&fs.statSync(file).isFile()?{path:file}:{contentType:'text/html',body:html})});await page.goto('https://fixture.example.test/',{waitUntil:'domcontentloaded'});
 await page.evaluate(data=>{window.__realFetch=window.fetch.bind(window);window.__testCatalog=data;window.print=()=>{};window.fetch=async()=>({ok:true,json:async()=>window.__testCatalog});window.alert=text=>{window.auditAlerts||=[];auditAlerts.push(text)};window.confirm=()=>true;window.prompt=()=> 'Sample note'},JSON.parse(fs.readFileSync(root+'/data/rules/catalog.json','utf8')));
 for(const file of ['dom-setup.js','dom-fixture.js'])await page.addScriptTag({path:root+'/tests/'+file});
 await page.evaluate(()=>{const d=window.__DND_VAULT_DEPS__;d.where=(field,op,value)=>({field,op,value});d.query=(path,...filters)=>({path,filters});d.getDocs=async q=>{const p=typeof q==='string'?q:q.path,f=q.filters||[];return {docs:Object.entries(testSheetDocs).filter(([key,data])=>key.startsWith(p+'/')&&!key.slice(p.length+1).includes('/')&&f.every(f=>{const v=f.field.split('.').reduce((d,k)=>d?.[k],data);return f.op==='array-contains'?v?.includes(f.value):v===f.value})).map(([key,data])=>({id:key.split('/').at(-1),data:()=>structuredClone(data)}))}};d.ref=(_,p)=>p;d.getBlob=async()=>new Blob();d.uploadBytes=async()=>{};});
 await page.evaluate(()=>{const sdk=window.__DND_VAULT_DEPS__,original=sdk.runTransaction;window.journalWatchers=[];window.failJournalWrite=false;sdk.runTransaction=async(...args)=>{if(window.failJournalWrite)throw Error('Simulated save failure');return original(...args)};sdk.onSnapshot=(path,next,error)=>{const watch={path,next,error,active:true};journalWatchers.push(watch);return()=>{watch.active=false}};});
 await page.evaluate(()=>{const sdk=__DND_VAULT_DEPS__,read=sdk.getDocs;window.recapReads=[];sdk.getDocs=async q=>{const p=typeof q==='string'?q:q.path;recapReads.push(p);if(window.failRecapRead===p){failRecapRead=null;throw Error('Temporary journal connection failure')}return read(q)};});
 await page.addScriptTag({content:'function createCampaignStore(){return window.__DND_VAULT_DEPS__.vaultCall}'});
 const modules=JSON.parse(fs.readFileSync(root+'/tests/dom.cjs','utf8').match(/for\(const name of (\[[^\n]+?\])\)await run/)[1].replaceAll("'",'"'));
 for(const name of modules)await page.addScriptTag({path:root+'/js/modules/'+name+'.js'});
 await page.evaluate(()=>{CharacterCatalog.set(__testCatalog);document.getElementById('siteBootPanel')?.remove()});await page.addScriptTag({path:root+'/tests/dom-state.js'});
 await page.evaluate(data=>{window.__testMonsters=data;window.fetch=async u=>String(u).includes('/data/adobe-pages/')?window.__realFetch(u):({ok:true,json:async()=>String(u).includes('monsters.json')?__testMonsters:__testCatalog});window.auditSeed=role=>{closeCharacterSheet(true);CampaignWorkspace.clear(true);SiteHelp.onLogout();seed(role,role==='other'?'player':role);document.getElementById('loginControls').style.display='none';document.getElementById('logoutButton').style.display='inline-block';document.getElementById('adminTab').style.display=role==='admin'?'inline-block':'none';document.getElementById('userDisplay').textContent='Sample '+role;document.getElementById('activeCampaignName').textContent=activeCampaign.name;renderDMTools();SiteHelp.onLogin();};},JSON.parse(fs.readFileSync(root+'/data/rules/monsters.json','utf8')));





 return {page,errors};
};
