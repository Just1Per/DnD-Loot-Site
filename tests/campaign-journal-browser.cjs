// Shared journal, author-owned recaps and notebook reading against an isolated Firebase fixture.
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const root=path.resolve(__dirname,'..'),out=process.env.UI_OUTPUT_DIR||require('node:os').tmpdir()+'/campaignatlas-ui-checks';fs.mkdirSync(out,{recursive:true});
const assert=require('node:assert/strict');
const errors=[];
(async()=>{const browser=await chromium.launch({headless:true,...process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}});try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}});page.setDefaultTimeout(7000);
 page.on('pageerror',error=>errors.push(error.message));
 let html=fs.readFileSync(path.join(root,'index.html'),'utf8').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<link\b[^>]*href="([^"]*)"[^>]*>/gi,(tag,href)=>href.startsWith('css/')?'<style data-audit-file="'+href.split('?')[0]+'">'+fs.readFileSync(path.join(root,href.split('?')[0]),'utf8')+'\n/*# sourceURL='+href.split('?')[0]+' */</style>':tag);
 await page.route('https://fixture.example.test/**',route=>{const rel=new URL(route.request().url()).pathname.slice(1),file=path.join(root,rel);return route.fulfill(rel&&fs.existsSync(file)&&fs.statSync(file).isFile()?{path:file}:{contentType:'text/html',body:html})});await page.goto('https://fixture.example.test/',{waitUntil:'domcontentloaded'});
 await page.evaluate(data=>{window.__testCatalog=data;window.print=()=>{};window.fetch=async()=>({ok:true,json:async()=>window.__testCatalog});window.alert=text=>{window.auditAlerts||=[];auditAlerts.push(text)};window.confirm=()=>true;window.prompt=()=> 'Sample note'},JSON.parse(fs.readFileSync(root+'/data/rules/catalog.json','utf8')));
 for(const file of ['dom-setup.js','dom-fixture.js'])await page.addScriptTag({path:root+'/tests/'+file});
 await page.evaluate(()=>{const d=window.__DND_VAULT_DEPS__;d.where=(field,op,value)=>({field,op,value});d.query=(path,...filters)=>({path,filters});d.getDocs=async q=>{const p=typeof q==='string'?q:q.path,f=q.filters||[];window.journalReads||=[];journalReads.push(p);if(window.denyJournal&&/\/(journalRecaps|entries)$/.test(p))throw Object.assign(Error('Journal denied'),{code:'permission-denied'});if(window.referenceFailure&&/\/(members)$/.test(p))throw Object.assign(Error('Reference denied'),{code:'permission-denied'});if(window.holdReferences&&/\/(members)$/.test(p))await new Promise(resolve=>{window.referenceReleases||=[];referenceReleases.push(resolve)});return {docs:Object.entries(testSheetDocs).filter(([key,data])=>key.startsWith(p+'/')&&!key.slice(p.length+1).includes('/')&&f.every(f=>{const v=f.field.split('.').reduce((d,k)=>d?.[k],data);return f.op==='array-contains'?v?.includes(f.value):v===f.value})).map(([key,data])=>({id:key.split('/').at(-1),data:()=>structuredClone(data)}))}};d.ref=(_,p)=>p;d.getBlob=async()=>new Blob();d.uploadBytes=async()=>{};});
 await page.evaluate(()=>{const sdk=window.__DND_VAULT_DEPS__,original=sdk.runTransaction;window.journalWatchers=[];window.failJournalWrite=false;sdk.runTransaction=async(...args)=>{if(window.failJournalWrite)throw Error('Simulated save failure');return original(...args)};sdk.onSnapshot=(path,next,error)=>{const watch={path,next,error,active:true};journalWatchers.push(watch);return()=>{watch.active=false}};});
 await page.addScriptTag({content:'function createCampaignStore(){return window.__DND_VAULT_DEPS__.vaultCall}'});
 const modules=JSON.parse(fs.readFileSync(root+'/tests/dom.cjs','utf8').match(/for\(const name of (\[[^\n]+?\])\)await run/)[1].replaceAll("'",'"'));
 for(const name of modules)await page.addScriptTag({path:root+'/js/modules/'+name+'.js'});
 await page.evaluate(()=>{CharacterCatalog.set(__testCatalog);document.getElementById('siteBootPanel')?.remove()});await page.addScriptTag({path:root+'/tests/dom-state.js'});
 await page.evaluate(data=>{window.__testMonsters=data;window.fetch=async u=>({ok:true,json:async()=>String(u).includes('monsters.json')?__testMonsters:__testCatalog});window.auditSeed=role=>{closeCharacterSheet(true);CampaignWorkspace.clear(true);SiteHelp.onLogout();seed(role);document.getElementById('loginControls').style.display='none';document.getElementById('logoutButton').style.display='inline-block';document.getElementById('adminTab').style.display=role==='admin'?'inline-block':'none';document.getElementById('userDisplay').textContent='Sample '+role;document.getElementById('activeCampaignName').textContent=activeCampaign.name;renderDMTools();SiteHelp.onLogin();};},JSON.parse(fs.readFileSync(root+'/data/rules/monsters.json','utf8')));
 await page.addScriptTag({path:require.resolve(process.env.AXE_PATH||'axe-core/axe.min.js')});

 const check=(name,value)=>{assert.ok(value,name);console.log('PASS',name)};
 await page.evaluate(()=>{auditSeed('player');testSheetDocs['campaigns/a']={ownerId:'dm'};for(const [uid,role]of Object.entries({player:'player',other:'player','assistant-dm':'dm','global-dm-player':'player'}))testSheetDocs['campaigns/a/members/'+uid]={role,status:'active'};
 const base={title:'Harbor DM recap',body:'DM session recap at the harbor.',authorName:'The DM',authorId:'dm',characterName:'',sessionNumber:1,sessionDate:'2026-10-17',remember:'',nextTime:'',revision:1,sourceRevision:1,updatedAt:1000};
 testSheetDocs['campaigns/a/journalRecaps/dm-legacy']={...base};testSheetDocs['campaigns/a/journalRecaps/member-dm-legacy']={...base,title:'Mountain DM recap',body:'A mountain session.',authorName:'Assistant DM',authorId:'assistant-dm'};testSheetDocs['campaigns/a/journalRecaps/global-player']={...base,title:'Player travels',body:'A player session.',authorName:'Player with global DM access',authorId:'global-dm-player'};testSheetDocs['users/global-dm-player']={role:['dm']};testSheetDocs['campaigns/a/playerInformation/letter']={title:'A letter at the inn',summary:'A message from the northern watch.',content:'Bring the compass.\n\nTrust no blue lantern.',category:'Lore',revision:1,sourceRevision:1,updatedBy:'dm',updatedAt:2000,image:{path:'campaign-journal-images/a/world/letter/shared-picture',alt:'The sealed letter',caption:'The northern watch seal'}};testSheetDocs['campaigns/a/playerChapters/harbor']={title:'Arrival at the harbor',summary:'The party freed the harbor.',content:'First paragraph.\n\nSecond paragraph.',category:'Completed',order:1,revision:1,sourceRevision:1,updatedBy:'dm',updatedAt:1000};showTab('journal')});
 await page.waitForFunction(()=>CampaignJournal.session?.ready&&CampaignJournal.session.authorGroups);
 check('Recaps shows existing DM recaps and excludes chapter snapshots',await page.locator('#tab-campaign-journal').isVisible()&&(await page.locator('[data-journal-content]').textContent()).includes('Harbor DM recap')&&!(await page.locator('[data-journal-content]').textContent()).includes('Arrival at the harbor'));
 check('Recaps never loads or watches chapter publications',!await page.evaluate(()=>journalWatchers.some(w=>String(w.path).endsWith('/playerChapters'))||journalReads.some(p=>String(p).endsWith('/playerChapters'))));
 check('World posts are not duplicated or loaded in Recaps',await page.locator('[data-journal-read="world:letter"]').count()===0&&!await page.evaluate(()=>journalWatchers.some(w=>w.active&&String(w.path).endsWith('/playerInformation'))));
 await page.locator('[data-journal-compose]').click();
 await page.locator('[data-journal-field=title]').fill('Our Blackwater session');
 await page.locator('[data-journal-field=body]').fill('We met the river spirit.\n\nThe compass points toward her.');
 await page.locator('[data-journal-extra] summary').click();
 await page.locator('[data-journal-field=authorName]').fill('Sophie');await page.locator('[data-journal-field=characterName]').fill('Elara');
 await page.locator('[data-journal-field=sessionNumber]').fill('12');await page.locator('[data-journal-field=sessionDate]').fill('2026-10-17');
 await page.locator('[data-journal-field=remember]').fill('Return before the first frost.');await page.locator('[data-journal-field=nextTime]').fill('Ask Mara about the compass.');
 check('Recap defaults to a private draft',await page.locator('[data-journal-audience]').inputValue()==='private');
 await page.locator('[data-journal-preview]').click();check('Preview preserves paragraphs and stays private',(await page.locator('.journal-preview').textContent()).includes('Only you')&&(await page.locator('.journal-preview .journal-prose').first().textContent()).includes('\n\n'));
 await page.keyboard.press('Escape');
 await page.evaluate(()=>showTab('library'));await page.waitForSelector('#journalLeaveDialog[open]');await page.keyboard.press('Escape');
 check('Escape from the leave prompt preserves the recap draft',await page.locator('[data-journal-field=body]').inputValue()==='We met the river spirit.\n\nThe compass points toward her.');
 await page.evaluate(()=>{window.failJournalWrite=true;showTab('library')});await page.locator('[data-leave-save]').click();await page.waitForFunction(()=>document.querySelector('[data-leave-status]')?.textContent.includes('Simulated save failure'));
 check('Failed save-and-leave keeps the editor and typed text',await page.locator('[data-journal-field=title]').inputValue()==='Our Blackwater session');
 await page.evaluate(()=>window.failJournalWrite=false);await page.locator('[data-leave-save]').click();await page.waitForSelector('#tab-library',{state:'visible'});
 check('Save-and-leave stores only a private draft',await page.evaluate(()=>Object.keys(testSheetDocs).some(p=>p.includes('/journalDrafts/player/entries/'))&&!Object.entries(testSheetDocs).some(([p,r])=>p.includes('/journalRecaps/')&&r.authorId==='player')));
 await page.evaluate(()=>showTab('journal'));await page.waitForFunction(()=>CampaignJournal.session?.ready);await page.locator('[data-journal-edit]').click();
 check('Saved draft reopens with its text',await page.locator('[data-journal-field=title]').inputValue()==='Our Blackwater session');
 await page.locator('[data-journal-audience]').selectOption('party');await page.locator('[data-journal-form] button[type=submit]').click();await page.waitForSelector('#journalEntryTitle');
 check('Explicit sharing opens the notebook reader with remember/next-time notes',(await page.locator('.journal-leaf').textContent()).includes('Ask Mara about the compass.'));
 for(const width of [1440,390,320]){
  await page.setViewportSize({width,height:900});
  check('Notebook fits '+width+'px',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));check('Journal controls have 44px targets',await page.locator('#tab-campaign-journal button:not(.vault-help-badge)').evaluateAll(nodes=>nodes.filter(n=>n.getClientRects().length).every(n=>n.getBoundingClientRect().height>=44)));
  const violations=await page.evaluate(async()=>(await axe.run('#tab-campaign-journal',{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}})).violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})));
  assert.deepEqual(violations,[]);await page.evaluate(()=>{document.activeElement?.blur();scrollTo(0,0)});await page.screenshot({path:out+'/journal-notebook-'+width+'.png',fullPage:true});
 }
 await page.locator('.journal-leaf [data-journal-edit]').click();await page.locator('[data-journal-field=body]').fill('A private correction.');
 await page.locator('[data-journal-form] button[type=submit]').click();await page.waitForFunction(()=>!CampaignJournal.session.busy);
 check('Saving a correction leaves the shared recap unchanged',await page.evaluate(()=>Object.entries(testSheetDocs).find(([p,r])=>p.includes('/journalRecaps/')&&r.authorId==='player')[1].body.includes('river spirit')));
 await page.locator('[data-journal-editor-back]').click();
 await page.locator('[data-journal-unshare]').click();await page.locator('[data-site-confirm]').click();await page.waitForSelector('[data-journal-edit]');
 check('Making private removes shared copy while keeping the author draft',await page.evaluate(()=>!Object.entries(testSheetDocs).some(([p,r])=>p.includes('/journalRecaps/')&&r.authorId==='player')&&Object.keys(testSheetDocs).some(p=>p.includes('/journalDrafts/player/entries/'))));
 await page.locator('[data-journal-filter=recap]').click();check('Player filter uses campaign membership, including a global DM acting as player',await page.locator('.journal-feed [data-journal-read]').count()===1&&(await page.locator('.journal-feed').textContent()).includes('Player travels'));await page.locator('[data-journal-filter=dm]').click();check('DM filter includes legacy recaps from the owner and a campaign DM, without chapters',await page.locator('.journal-feed [data-journal-read]').count()===2&&(await page.locator('.journal-feed').textContent()).includes('Mountain DM recap'));await page.locator('[data-journal-search]').fill('harbor');check('Journal search filters titles and body text',await page.locator('.journal-feed [data-journal-read]').count()===1);await page.locator('[data-journal-search]').fill('');await page.locator('[data-journal-filter=all]').click();
 for(const width of [1440,390,320]){
  await page.setViewportSize({width,height:900});check('Overview fits '+width+'px',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  const violations=await page.evaluate(async()=>(await axe.run('#tab-campaign-journal',{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}})).violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})));assert.deepEqual(violations,[]);
  await page.evaluate(()=>{document.activeElement?.blur();scrollTo(0,0)});await page.screenshot({path:out+'/journal-overview-'+width+'.png',fullPage:true});
 }
 await page.locator('[data-journal-edit]').click();
 for(const width of [390,320]){await page.setViewportSize({width,height:900});check('Recap editor fits '+width+'px',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));const violations=await page.evaluate(async()=>(await axe.run('#tab-campaign-journal',{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}})).violations.map(v=>v.id));assert.deepEqual(violations,[]);}
 await page.locator('[data-journal-field=body]').fill('Keep this draft if the network drops.');
 await page.evaluate(()=>journalWatchers.find(w=>w.active&&w.path.includes('/journalRecaps')).error({code:'unavailable'}));
 check('Transient subscription failure preserves unsaved text',await page.locator('[data-journal-field=body]').inputValue()==='Keep this draft if the network drops.');
 await page.evaluate(()=>journalWatchers.find(w=>w.active&&w.path.includes('/journalRecaps')).error({code:'permission-denied'}));
 check('Access revocation clears loaded and unsaved journal text',await page.locator('[data-journal-content]').textContent()===''&&await page.locator('[data-journal-compose]').isDisabled());
 await page.evaluate(()=>{CampaignJournal.clear();auditSeed('other');showTab('journal')});await page.waitForFunction(()=>CampaignJournal.session?.ready);
 check('Switching account does not show another author draft',await page.locator('[data-journal-edit]').count()===0);
 await page.evaluate(()=>{CampaignJournal.clear();auditSeed('player');showTab('journal')});await page.waitForFunction(()=>CampaignJournal.session?.ready);await page.locator('[data-journal-edit]').click();
 await page.locator('[data-journal-field=title]').fill('<img src=x onerror=alert(1)>');await page.locator('[data-journal-preview]').click();check('User text is escaped in preview',await page.locator('.journal-preview img').count()===0);
 await page.evaluate(()=>CampaignJournal.onAccountChanged('player'));check('Same-account auth updates preserve a working recap',await page.locator('[data-journal-field=title]').inputValue()==='<img src=x onerror=alert(1)>');
 await page.evaluate(()=>{auth.currentUser={uid:'other'};CampaignJournal.onAccountChanged('other');for(const w of journalWatchers)if(w.path.includes('/journalRecaps'))w.next({docs:[{id:'late',data:()=>({title:'Late account text',body:'Private old response'})}]})});check('Account cleanup closes previews and clears all journal markup',await page.locator('.journal-preview').count()===0&&await page.locator('#tab-campaign-journal').textContent()==='');
 // A DM authors through the real editor; a DM correction keeps a player's attribution/group.
 await page.evaluate(()=>{CampaignJournal.clear();auditSeed('dm');showTab('journal')});await page.waitForFunction(()=>CampaignJournal.session?.ready&&CampaignJournal.session.authorGroups);
 await page.locator('[data-journal-compose]').click();await page.locator('[data-journal-field=title]').fill('A fresh DM recap');await page.locator('[data-journal-field=body]').fill('The DM tells the session story.');await page.locator('[data-journal-audience]').selectOption('party');await page.locator('[data-journal-form] button[type=submit]').click();await page.waitForSelector('#journalEntryTitle');
 check('New DM-authored recaps open with the DM recap label',await page.locator('.journal-leaf > .journal-tag').textContent()==='DM recap · Shared with the campaign');
 await page.locator('[data-journal-back]').click();await page.locator('[data-journal-filter=dm]').click();check('New DM recaps appear under From the DM',await page.locator('.journal-feed').textContent().then(t=>t.includes('A fresh DM recap')));
 await page.locator('[data-journal-filter=recap]').click();check('New DM recaps are excluded from Player recaps',!await page.locator('.journal-feed').textContent().then(t=>t.includes('A fresh DM recap')));
 await page.locator('[data-journal-read="recap:global-player"]').click();await page.locator('[data-journal-moderate]').click();await page.locator('[data-journal-field=body]').fill('Corrected by a DM; still the player’s recap.');await page.locator('[data-journal-form] button[type=submit]').click();await page.waitForSelector('#journalEntryTitle');check('DM moderation preserves the player recap group',await page.locator('.journal-leaf > .journal-tag').textContent()==='Player recap · Shared with the campaign');
 await page.locator('[data-journal-back]').click();
 const beforeRoleUpdate=await page.evaluate(()=>JSON.stringify(testSheetDocs));
 await page.evaluate(()=>{journalWatchers.find(w=>w.active&&w.path==='campaigns/a').next({data:()=>({ownerId:'dm'})});journalWatchers.find(w=>w.active&&w.path==='campaigns/a/members').next({docs:[['dm','player'],['player','player'],['assistant-dm','player'],['global-dm-player','player']].map(([id,role])=>({id,data:()=>({role,status:'active'})}))});});
 check('Membership updates regroup old recaps, while campaign ownership retains DM grouping',await page.locator('.journal-feed').textContent().then(t=>t.includes('Mountain DM recap')&&!t.includes('A fresh DM recap')));
 check('Regrouping performs no writes or recap migration',await page.evaluate(()=>JSON.stringify(testSheetDocs))===beforeRoleUpdate);
 for(const role of ['player','dm']){
  await page.evaluate(role=>{CampaignJournal.clear();auditSeed(role);window.referenceFailure=true;showTab('journal')},role);
  await page.waitForFunction(()=>CampaignJournal.session?.ready);await page.waitForFunction(()=>document.querySelector('[data-journal-reference-status]').textContent.includes('unavailable'));
  await page.locator('[data-journal-compose]').click();await page.waitForSelector('[data-journal-form]');
  check(role+' can open a new recap when optional shared references are denied',await page.locator('[data-journal-field=title]').isVisible());
  await page.evaluate(()=>{CampaignJournal.clear();window.referenceFailure=false;window.holdReferences=true;showTab('journal')});
  await page.waitForFunction(()=>CampaignJournal.session?.ready&&window.referenceReleases?.length===1);await page.locator('[data-journal-compose]').click();await page.waitForSelector('[data-journal-form]');
  check(role+' can write while optional shared references are still loading',await page.locator('[data-journal-field=body]').isVisible());
  await page.evaluate(()=>{window.holdReferences=false;referenceReleases.splice(0).forEach(resolve=>resolve());CampaignJournal.clear();});
 }
 await page.evaluate(()=>{window.denyJournal=true;showTab('journal')});await page.waitForFunction(()=>CampaignJournal.session?.denied);check('Denied primary journal access remains blocked and explains the permission error',await page.locator('[data-journal-compose]').isDisabled()&&(await page.locator('[data-journal-status]').textContent()).includes('permission-denied'));
 assert.deepEqual(errors,[]);console.log('SUCCESS campaign journal browser checks');
 }finally{await browser.close()}})().catch(error=>{console.error(error);process.exitCode=1});
