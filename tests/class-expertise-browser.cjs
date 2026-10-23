// Shared journal, author-owned recaps and notebook reading against an isolated Firebase fixture.
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
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
 await page.evaluate(()=>{const sdk=__DND_VAULT_DEPS__,read=sdk.getDocs;window.recapReads=[];sdk.getDocs=async q=>{const p=typeof q==='string'?q:q.path;recapReads.push(p);if(window.failRecapRead===p){failRecapRead=null;throw Error('Temporary journal connection failure')}return read(q)};});
 await page.addScriptTag({content:'function createCampaignStore(){return window.__DND_VAULT_DEPS__.vaultCall}'});
 const modules=JSON.parse(fs.readFileSync(root+'/tests/dom.cjs','utf8').match(/for\(const name of (\[[^\n]+?\])\)await run/)[1].replaceAll("'",'"'));
 for(const name of modules)await page.addScriptTag({path:root+'/js/modules/'+name+'.js'});
 await page.evaluate(()=>{CharacterCatalog.set(__testCatalog);document.getElementById('siteBootPanel')?.remove()});await page.addScriptTag({path:root+'/tests/dom-state.js'});
 await page.evaluate(data=>{window.__testMonsters=data;window.fetch=async u=>({ok:true,json:async()=>String(u).includes('monsters.json')?__testMonsters:__testCatalog});window.auditSeed=role=>{closeCharacterSheet(true);CampaignWorkspace.clear(true);SiteHelp.onLogout();seed(role,role==='other'?'player':role);document.getElementById('loginControls').style.display='none';document.getElementById('logoutButton').style.display='inline-block';document.getElementById('adminTab').style.display=role==='admin'?'inline-block':'none';document.getElementById('userDisplay').textContent='Sample '+role;document.getElementById('activeCampaignName').textContent=activeCampaign.name;renderDMTools();SiteHelp.onLogin();};},JSON.parse(fs.readFileSync(root+'/data/rules/monsters.json','utf8')));
 await page.addScriptTag({path:require.resolve(process.env.AXE_PATH||'axe-core/axe.min.js')});

 await page.evaluate(async()=>{
  auditSeed('player');characters[0].level=5;characters[0].class='Rogue 1 / Fighter 4';testSheetDocs['campaigns/a/characters/c1']={...characters[0]};await openCharacterSheet('c1');
  const d=sheetSession.data;d.build.edition='2014';d.build.classId='rogue';d.abilities.dex=16;d.skills.stealth.rank=1;d.skills.perception.rank=1;d.languages='Harbor signs';
  d.adobe.classLevels=[{classId:'rogue',level:1,subclassId:''},{classId:'fighter',level:4,subclassId:''}];d.adobe.classFeatureChoices={};renderCharacterSheet();selectSheetTab('skills');
 });
 const choice=i=>page.locator('[data-class-expertise="2014:rogue:expertise"][data-expertise-slot="'+i+'"]');
 assert.equal(await choice(0).count(),1);await choice(0).selectOption('stealth');await choice(1).selectOption('perception');
 assert.equal(await page.evaluate(()=>CharacterSheetModel.derive(sheetSession.data,5).skills.stealth),9);
 assert.equal(await choice(1).locator('option[value=stealth]').evaluate(n=>n.disabled),true);
 assert.match(await page.locator('[data-skill-source=stealth]').textContent(),/Class Expertise/);
 await choice(0).selectOption('');assert.equal(await page.evaluate(()=>CharacterSheetModel.derive(sheetSession.data,5).skills.stealth),6);await choice(0).selectOption('stealth');
 await page.locator('#sheetSave').click();await page.waitForFunction(()=>!sheetSession.saving&&!sheetSession.dirty);
 await page.evaluate(async()=>{closeCharacterSheet(true);await openCharacterSheet('c1');selectSheetTab('skills')});
 assert.equal(await choice(0).inputValue(),'stealth');assert.equal(await choice(1).inputValue(),'perception');
 assert.equal(await page.evaluate(()=>CharacterSheetModel.derive(sheetSession.data,5).skills.stealth),9);
 await page.evaluate(()=>selectSheetTab('overview'));assert.match(await page.locator('#sheet-overview').textContent(),/Thieves’ Cant/);assert.match(await page.locator('#sheet-overview').textContent(),/Harbor signs/);
 await page.evaluate(()=>{CharacterSheetPrint.prepare(new Set(['skills']))});
 assert.match(await page.locator('[data-paper-section=skills]').textContent(),/Stealth/);assert.match(await page.locator('[data-paper-section=skills] tr').filter({hasText:'Stealth'}).textContent(),/Expertise.*\+9/);
 await page.evaluate(()=>{CharacterSheetPrint.clear();sheetSession.data.adobe.classLevels=[{classId:'rogue',level:1,subclassId:''},{classId:'druid',level:1,subclassId:''},{classId:'fighter',level:3,subclassId:''}];renderCharacterSheet();selectSheetTab('overview')});
 assert.match(await page.locator('#sheet-overview').textContent(),/Druidic/);
 await page.evaluate(()=>{CharacterSheetPrint.prepare(new Set(['overview']))});assert.match(await page.locator('#sheet-overview').textContent(),/Thieves’ Cant/);assert.match(await page.locator('#sheet-overview').textContent(),/Druidic/);
 await page.evaluate(()=>{CharacterSheetPrint.clear();sheetSession.data.adobe.companions=[{type:'wildshape',name:'Expert cat',abilities:{dex:14}}];sheetSession.data.adobe.pages.companion=true;sheetSession.data=CharacterSheetModel.normalize(sheetSession.data);renderCharacterSheet();selectSheetTab('companion')});
 assert.equal(await page.locator('[data-companion-index="0"] [data-comp-skill=stealth]').textContent(),'+8');
 await page.evaluate(()=>CharacterSheetPrint.prepare(new Set(['companion'])));assert.match(await page.locator('[data-paper-section=companion] tr').filter({hasText:'Stealth'}).textContent(),/\+8/);await page.evaluate(()=>CharacterSheetPrint.clear());

 await page.evaluate(()=>selectSheetTab('skills'));
 for(const width of [1440,390,320]){
  await page.setViewportSize({width,height:1000});await page.evaluate(()=>scrollTo(0,0));assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no horizontal scrolling at '+width);
  assert.deepEqual(await page.evaluate(async()=>(await axe.run('#sheetClassExpertise',{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}})).violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))),[]);
  if(width===390)await page.screenshot({path:out+'/class-expertise-mobile.png',fullPage:true});
 }
 await choice(0).focus();for(let i=0;i<3&&!await choice(1).evaluate(n=>n===document.activeElement);i++)await page.keyboard.press('Tab');assert.equal(await choice(1).evaluate(n=>n===document.activeElement),true);
 assert.deepEqual(errors,[]);console.log('PASS Class Expertise choices, total-level proficiency, clear/restore, duplicate prevention, save/reopen, automatic class languages, print, keyboard and mobile/WCAG');
 }finally{await browser.close()}})().catch(error=>{console.error(error);process.exitCode=1});
