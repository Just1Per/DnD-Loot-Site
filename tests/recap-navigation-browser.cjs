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
 await page.evaluate(()=>{const d=window.__DND_VAULT_DEPS__;d.where=(field,op,value)=>({field,op,value});d.query=(path,...filters)=>({path,filters});d.getDocs=async q=>{const p=typeof q==='string'?q:q.path,f=q.filters||[];if(window.pauseJournalRead&&String(p).endsWith('/journalRecaps'))await new Promise(resolve=>{window.releaseJournalRead=resolve});return {docs:Object.entries(testSheetDocs).filter(([key,data])=>key.startsWith(p+'/')&&!key.slice(p.length+1).includes('/')&&f.every(f=>{const v=f.field.split('.').reduce((d,k)=>d?.[k],data);return f.op==='array-contains'?v?.includes(f.value):v===f.value})).map(([key,data])=>({id:key.split('/').at(-1),data:()=>structuredClone(data)}))}};d.ref=(_,p)=>p;d.getBlob=async()=>new Blob();d.uploadBytes=async()=>{};});
 await page.evaluate(()=>{const sdk=window.__DND_VAULT_DEPS__,original=sdk.runTransaction;window.journalWatchers=[];window.failJournalWrite=false;sdk.runTransaction=async(...args)=>{if(window.failJournalWrite)throw Error('Simulated save failure');return original(...args)};sdk.onSnapshot=(path,next,error)=>{const watch={path,next,error,active:true};journalWatchers.push(watch);return()=>{watch.active=false}};});
 await page.addScriptTag({content:'function createCampaignStore(){return window.__DND_VAULT_DEPS__.vaultCall}'});
 const modules=JSON.parse(fs.readFileSync(root+'/tests/dom.cjs','utf8').match(/for\(const name of (\[[^\n]+?\])\)await run/)[1].replaceAll("'",'"'));
 for(const name of modules)await page.addScriptTag({path:root+'/js/modules/'+name+'.js'});
 await page.evaluate(()=>{CharacterCatalog.set(__testCatalog);document.getElementById('siteBootPanel')?.remove()});await page.addScriptTag({path:root+'/tests/dom-state.js'});
 await page.evaluate(data=>{window.__testMonsters=data;window.fetch=async u=>({ok:true,json:async()=>String(u).includes('monsters.json')?__testMonsters:__testCatalog});window.auditSeed=role=>{closeCharacterSheet(true);CampaignWorkspace.clear(true);SiteHelp.onLogout();seed(role);document.getElementById('loginControls').style.display='none';document.getElementById('logoutButton').style.display='inline-block';document.getElementById('adminTab').style.display=role==='admin'?'inline-block':'none';document.getElementById('userDisplay').textContent='Sample '+role;document.getElementById('activeCampaignName').textContent=activeCampaign.name;renderDMTools();SiteHelp.onLogin();};},JSON.parse(fs.readFileSync(root+'/data/rules/monsters.json','utf8')));
 await page.addScriptTag({path:require.resolve(process.env.AXE_PATH||'axe-core/axe.min.js')});


 await page.evaluate(async()=>{
  auditSeed('player');testSheetDocs['campaigns/a']={ownerId:'dm'};testSheetDocs['campaigns/a/members/player']={role:'player',status:'active'};const store=createCampaignJournalStore(__DND_VAULT_DEPS__);
  for(let i=0;i<14;i++){const id='recap'+i;await store.save({campaignId:'a',id,revision:0,input:{title:'Harbor evening '+i,body:'We reached the harbor.\n\nA sailor brought news. <img src=x onerror=unsafe()>',sessionNumber:i+1,sessionDate:'2026-10-20',authorName:'Sophie',characterName:'Elara',remember:'Bring the compass.',nextTime:'Visit the watch.'}});await store.publish({campaignId:'a',id,revision:1,publishedRevision:0});}
  window.pauseJournalRead=true;showTab('campaign-journal');
 });
 await page.waitForFunction(()=>typeof releaseJournalRead==='function');
 assert.match(await page.locator('.journal-feed').textContent(),/Opening your journal/);
 assert.equal(await page.locator('.journal-feed').filter({hasText:'Your story starts here'}).count(),0);
 await page.evaluate(()=>{pauseJournalRead=false;releaseJournalRead()});
 await page.waitForFunction(()=>CampaignJournal.session?.ready&&CampaignJournal.session.authorGroups);
 await page.locator('[data-journal-filter=recap]').click();await page.locator('[data-journal-search]').fill('harbor');
 const read=page.locator('.journal-feed [data-journal-read]').first(),key=await read.getAttribute('data-journal-read');
 await read.click();const listScroll=await page.evaluate(()=>CampaignJournal.session.listScroll);
 assert.equal(await page.locator('.journal-reading-prose p').count(),2);assert.equal(await page.locator('.journal-reading-prose img').count(),0);
 assert.equal(await page.locator('.journal-hero').isVisible(),false);assert.equal(await page.locator('.journal-index').evaluate(n=>n.open),false);
 await page.locator('.journal-leaf [data-journal-edit]').click();await page.locator('[data-journal-field=body]').fill('A private correction.');await page.locator('[data-journal-form] button[type=submit]').click();await page.waitForFunction(()=>!CampaignJournal.session.busy);
 assert.ok(await page.evaluate(key=>testSheetDocs['campaigns/a/journalRecaps/'+key.split(':')[1]].body.includes('reached the harbor'),key));
 await page.locator('[data-journal-editor-back]').click();assert.equal(await page.locator('#journalEntryTitle').evaluate(n=>n===document.activeElement),true);
 await page.locator('[data-journal-back]').click();assert.equal(await page.locator('[data-journal-search]').inputValue(),'harbor');assert.equal(await page.locator('[data-journal-filter=recap]').getAttribute('aria-pressed'),'true');
 assert.equal(await page.evaluate(()=>document.activeElement.dataset.journalRead),key);assert.ok(Math.abs(await page.evaluate(()=>scrollY)-listScroll)<5);
 await page.evaluate(()=>showTab('library'));await page.evaluate(()=>showTab('campaign-journal'));await page.waitForFunction(()=>CampaignJournal.session?.ready);
 assert.equal(await page.locator('[data-journal-search]').inputValue(),'harbor');assert.equal(await page.locator('[data-journal-filter=recap]').getAttribute('aria-pressed'),'true');
 await page.locator('[data-journal-refresh]').click();await page.waitForFunction(()=>CampaignJournal.session?.ready);assert.equal(await page.locator('[data-journal-search]').inputValue(),'harbor');
 await page.locator('.journal-feed [data-journal-read]').first().focus();await page.keyboard.press('Enter');await page.waitForSelector('#journalEntryTitle');
 for(const width of [1440,390,320]){await page.setViewportSize({width,height:1000});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));const violations=await page.evaluate(async()=>(await axe.run('#tab-campaign-journal',{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}})).violations.map(v=>v.id));assert.deepEqual(violations,[]);if(width===390)await page.screenshot({path:out+'/recap-reader-mobile.png',fullPage:true});}
 await page.evaluate(()=>journalWatchers.findLast(w=>w.active&&w.path.includes('/journalRecaps')).error({code:'unavailable'}));
 assert.ok(await page.locator('.journal-leaf').isVisible(),'temporary failure retains the current reading');
 assert.match(await page.locator('[data-journal-status]').textContent(),/last loaded entries/);
 assert.ok(await page.locator('[data-journal-retry]').isVisible(),'recovery remains accessible with the list header hidden');
 await page.locator('[data-journal-retry]').click();await page.waitForFunction(()=>CampaignJournal.session?.ready);
 assert.equal(await page.locator('[data-journal-search]').inputValue(),'harbor');
 assert.equal(await page.locator('[data-journal-filter=recap]').getAttribute('aria-pressed'),'true');
 assert.equal(await page.locator('[data-journal-retry]').isVisible(),false);
 await page.locator('.journal-feed [data-journal-read]').first().click();
 await page.locator('.journal-index summary').click();assert.ok(await page.locator('.journal-index [data-journal-read]').first().isVisible());
 await page.evaluate(()=>journalWatchers.findLast(w=>w.active&&w.path.includes('/journalRecaps')).error({code:'permission-denied'}));assert.equal(await page.locator('.journal-leaf').count(),0);
 assert.ok(await page.locator('[data-journal-retry]').isVisible(),'revoked access clears text but retains a visible recovery action');
 await page.locator('[data-journal-retry]').click();await page.waitForFunction(()=>CampaignJournal.session?.ready);
 assert.ok(await page.locator('.journal-feed [data-journal-read]').count()>0);
 await page.evaluate(()=>{CampaignJournal.clear();auditSeed('other');showTab('campaign-journal')});await page.waitForFunction(()=>CampaignJournal.session?.ready);assert.equal(await page.locator('[data-journal-search]').inputValue(),'');assert.equal(await page.locator('[data-journal-filter=all]').getAttribute('aria-pressed'),'true');
 await page.locator('.journal-feed [data-journal-read]').first().click();assert.equal(await page.locator('.journal-leaf [data-journal-edit]').count(),0);
 await page.evaluate(()=>{CampaignJournal.clear();activeCampaign={...activeCampaign,id:'b'};showTab('campaign-journal')});await page.waitForFunction(()=>CampaignJournal.session?.ready);assert.equal(await page.locator('.journal-feed [data-journal-read]').count(),0);
 assert.deepEqual(errors,[]);console.log('PASS Recap paragraph reader, escaped content, optional contents, exact own-draft editing, snapshot isolation, retained search/filter/scroll/focus, refresh, keyboard, account/campaign boundaries, loading state, visible reader recovery, revoked access and mobile/WCAG');
 }finally{await browser.close()}})().catch(error=>{console.error(error);process.exitCode=1});
