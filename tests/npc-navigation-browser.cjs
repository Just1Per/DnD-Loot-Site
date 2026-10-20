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
 await page.addScriptTag({content:'function createCampaignStore(){return window.__DND_VAULT_DEPS__.vaultCall}'});
 const modules=JSON.parse(fs.readFileSync(root+'/tests/dom.cjs','utf8').match(/for\(const name of (\[[^\n]+?\])\)await run/)[1].replaceAll("'",'"'));
 for(const name of modules)await page.addScriptTag({path:root+'/js/modules/'+name+'.js'});
 await page.evaluate(()=>{CharacterCatalog.set(__testCatalog);document.getElementById('siteBootPanel')?.remove()});await page.addScriptTag({path:root+'/tests/dom-state.js'});
 await page.evaluate(data=>{window.__testMonsters=data;window.fetch=async u=>({ok:true,json:async()=>String(u).includes('monsters.json')?__testMonsters:__testCatalog});window.auditSeed=role=>{closeCharacterSheet(true);CampaignWorkspace.clear(true);SiteHelp.onLogout();seed(role);document.getElementById('loginControls').style.display='none';document.getElementById('logoutButton').style.display='inline-block';document.getElementById('adminTab').style.display=role==='admin'?'inline-block':'none';document.getElementById('userDisplay').textContent='Sample '+role;document.getElementById('activeCampaignName').textContent=activeCampaign.name;renderDMTools();SiteHelp.onLogin();};},JSON.parse(fs.readFileSync(root+'/data/rules/monsters.json','utf8')));
 await page.addScriptTag({path:require.resolve(process.env.AXE_PATH||'axe-core/axe.min.js')});


 await page.evaluate(async()=>{
  auditSeed('dm');
  await CampaignWorkspace.store.save({campaignId:'a',kind:'creature',id:'elowen',revision:0,input:{title:'Captain Elowen',summary:'Commander of the harbor watch.',content:'Elowen welcomes the party.\n\nShe asks for help with a missing ship.',privateNotes:'PRIVATE betrayal',data:{category:'Story NPC',goals:'PRIVATE goal',journalImage:{path:'campaign-journal-images/a/creature/elowen/portrait',alt:'Captain Elowen in her blue coat',caption:'Captain of the harbor watch.'}}}});
  await CampaignInformation.npcStore.publish({campaignId:'a',id:'elowen',sourceRevision:1});
  await CampaignInformation.npcStore.shareImage({campaignId:'a',id:'elowen',sourceRevision:1,publishedRevision:1});
  for(let i=0;i<12;i++)testSheetDocs['campaigns/a/playerNPCs/sailor'+i]={title:'Sailor '+i,summary:'A member of the harbor watch.',content:'A shared story.',category:'Story NPC',revision:1,sourceRevision:1,updatedBy:'dm',updatedAt:1};
  __DND_VAULT_DEPS__.getBlob=async()=>new Blob(['<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600"><rect width="400" height="600" fill="#829caa"/><circle cx="200" cy="180" r="65" fill="#e3c5a6"/><path d="M60 600V380Q200 260 340 380V600" fill="#33495e"/></svg>'],{type:'image/svg+xml'});
  showTab('campaign-npcs');
 });
 await page.waitForSelector('[data-read-npc=elowen]');
 await page.locator('[data-information-search]').fill('harbor');await page.locator('[data-information-category]').selectOption('Story NPC');
 await page.evaluate(()=>document.fonts.ready);await page.evaluate(()=>scrollTo(0,350));
 // Playwright may scroll the whole card into view before dispatching the click.
 // Capture the user's actual list position before the application click handler.
 await page.locator('[data-read-npc=elowen]').evaluate(button=>button.addEventListener('click',()=>window.npcListScrollAtClick=scrollY,{capture:true,once:true}));
 await page.locator('[data-read-npc=elowen]').click();const listScroll=await page.evaluate(()=>npcListScrollAtClick);
 await page.waitForSelector('.npc-post-reader img');
 assert.equal(await page.locator('.npc-post-reader .campaign-book-prose p').count(),2);
 assert.equal(await page.locator('.npc-post-reader figcaption').textContent(),'Captain of the harbor watch.');
 assert.ok(!(await page.locator('.npc-post-reader').textContent()).includes('PRIVATE'));
 await page.screenshot({path:out+'/npc-reader-desktop.png',fullPage:true});
 await page.locator('[data-npc-edit]').click();await page.waitForFunction(()=>CampaignWorkspace.session?.record?.id==='elowen');
 assert.equal(await page.locator('[name=title]').inputValue(),'Captain Elowen');
 assert.equal(await page.locator('[data-back-to-npcs]').count(),1);
 await page.locator('[name=content]').fill('A new shared discovery.\n\nThe missing ship has returned.');
 await page.evaluate(()=>window.confirm=()=>false);await page.locator('[data-back-to-npcs]').click();
 assert.equal(await page.locator('[name=content]').inputValue(),'A new shared discovery.\n\nThe missing ship has returned.');assert.ok(await page.locator('[data-save-record]').isVisible());
 await page.evaluate(()=>window.confirm=()=>true);
 await page.locator('[data-save-record]').click();await page.waitForFunction(()=>CampaignWorkspace.session.record.revision===2);
 assert.equal(await page.evaluate(()=>testSheetDocs['campaigns/a/playerNPCs/elowen'].sourceRevision),1);
 await page.waitForFunction(()=>!document.querySelector('[data-publish-npc]').disabled);
 await page.locator('[data-publish-npc]').click();await page.waitForFunction(()=>document.querySelector('[data-sharing-status]').textContent.includes('Shared with campaign members'));
 assert.equal(await page.evaluate(()=>testSheetDocs['campaigns/a/playerNPCs/elowen'].content),'A new shared discovery.\n\nThe missing ship has returned.');
 await page.locator('[data-back-to-npcs]').click();await page.waitForSelector('[data-read-npc=elowen]');
 assert.equal(await page.locator('[data-information-search]').inputValue(),'harbor');assert.equal(await page.locator('[data-information-category]').inputValue(),'Story NPC');
 assert.equal(await page.evaluate(()=>document.activeElement?.dataset.readNpc),'elowen');
 await page.waitForFunction(expected=>Math.abs(scrollY-expected)<5,listScroll).catch(async error=>{throw Error('NPC return scroll '+JSON.stringify({expected:listScroll,...await page.evaluate(()=>({actual:scrollY,height:innerHeight,pageHeight:document.documentElement.scrollHeight,focus:document.activeElement?.dataset.readNpc}))})+' '+error.message)});
 assert.ok(Math.abs(await page.evaluate(()=>scrollY)-listScroll)<5,'editor return restores the list position at the originating click');
 await page.locator('[data-read-npc=elowen]').focus();await page.keyboard.press('Enter');await page.waitForSelector('.npc-post-reader');await page.locator('[data-npc-back]').click();
 assert.equal(await page.evaluate(()=>document.activeElement?.dataset.readNpc),'elowen');
 console.log('PASS NPC reader, exact editor, private draft isolation, explicit reveal, retained filters, scroll and focus');
 await page.evaluate(()=>{CampaignWorkspace.clear(true);auditSeed('player');showTab('campaign-npcs')});
 await page.waitForSelector('[data-read-npc=elowen]');await page.locator('[data-read-npc=elowen]').click();
 assert.equal(await page.locator('[data-npc-edit]').count(),0);
 for(const width of [1440,390,320]){
  await page.setViewportSize({width,height:1000});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  const violations=await page.evaluate(async()=>(await axe.run('.campaign-information-shell',{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}})).violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})));assert.deepEqual(violations,[]);
  if(width===390)await page.screenshot({path:out+'/npc-reader-mobile.png',fullPage:true});
 }
 await page.evaluate(()=>{delete testSheetDocs['campaigns/a/playerNPCs/elowen'];const w=journalWatchers.findLast(w=>w.active&&w.path==='campaigns/a/playerNPCs');w.next({docs:[]})});
 assert.equal(await page.locator('.npc-post-reader').count(),0);assert.equal(await page.locator('.npc-post-reader img').count(),0);
 await page.evaluate(()=>{CampaignInformation.clear(true);activeCampaign={...activeCampaign,id:'b'};showTab('campaign-npcs')});
 await page.waitForFunction(()=>document.querySelector('[data-information-status]')?.textContent==='0 of 0 shared NPCs.');
 assert.equal(await page.locator('[data-information-search]').inputValue(),'');assert.equal(await page.locator('[data-read-npc]').count(),0);
 assert.deepEqual(errors,[]);console.log('PASS Player boundaries, revoked entries, campaign isolation, desktop/mobile layout and WCAG checks');
 }finally{await browser.close()}})().catch(error=>{console.error(error);process.exitCode=1});
