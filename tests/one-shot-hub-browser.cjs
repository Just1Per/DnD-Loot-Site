// One-shot setup, invitations and reading against an isolated Firebase fixture.
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
 await page.evaluate(()=>{
  const sdk=__DND_VAULT_DEPS__,getDoc=sdk.getDoc,getDocs=sdk.getDocs;
  sdk.doc=(parent,...parts)=>[...(typeof parent==='string'?[parent]:[]),...parts].join('/');
  // Modules capture the SDK methods; delay/failure hooks are installed before starting a session.
  window.shotReads=[];
  sdk.getDoc=async p=>{shotReads.push(p);if(window.delayShotRead===p){delayShotRead=null;await new Promise(resolve=>window.releaseShotRead=resolve)}return getDoc(p)};
  sdk.getDocs=async q=>{const p=typeof q==='string'?q:q.path;if(window.failShotList===p){failShotList=null;throw Error('Temporary roster connection failure')}return getDocs(q)};
 });
 await page.addScriptTag({content:'function createCampaignStore(){return window.__DND_VAULT_DEPS__.vaultCall}'});
 const modules=JSON.parse(fs.readFileSync(root+'/tests/dom.cjs','utf8').match(/for\(const name of (\[[^\n]+?\])\)await run/)[1].replaceAll("'",'"'));
 for(const name of modules)await page.addScriptTag({path:root+'/js/modules/'+name+'.js'});
 await page.evaluate(()=>{CharacterCatalog.set(__testCatalog);document.getElementById('siteBootPanel')?.remove()});await page.addScriptTag({path:root+'/tests/dom-state.js'});
 await page.evaluate(data=>{window.__testMonsters=data;window.fetch=async u=>({ok:true,json:async()=>String(u).includes('monsters.json')?__testMonsters:__testCatalog});window.auditSeed=role=>{closeCharacterSheet(true);CampaignWorkspace.clear(true);SiteHelp.onLogout();seed(role,role==='other'?'player':role);document.getElementById('loginControls').style.display='none';document.getElementById('logoutButton').style.display='inline-block';document.getElementById('adminTab').style.display=role==='admin'?'inline-block':'none';document.getElementById('userDisplay').textContent='Sample '+role;document.getElementById('activeCampaignName').textContent=activeCampaign.name;renderDMTools();SiteHelp.onLogin();};},JSON.parse(fs.readFileSync(root+'/data/rules/monsters.json','utf8')));
 await page.addScriptTag({path:require.resolve(process.env.AXE_PATH||'axe-core/axe.min.js')});

 await page.evaluate(()=>{auditSeed('dm');showTab('dm-one-shots')});
 await page.evaluate(()=>SiteHelp.openGuide('dm'));assert.match(await page.locator('#siteGuideDialog').textContent(),/3–256 boundary corners/);await page.locator('[data-guide-action=dm-one-shots]').click();await page.waitForSelector('[data-new-record]');
 const waitSaved=()=>page.waitForFunction(()=>!CampaignWorkspace.session.busy&&!CampaignWorkspace.session.dirty);
 const privateBox=page.locator('.one-shot-private');
 await page.locator('[data-new-record]').click();
 assert.equal(await page.locator('[data-save-record]').textContent(),'Save adventure');
 assert.equal(await privateBox.evaluate(n=>n.open),false);
 assert.equal(await page.locator('[data-record-field=duration]').inputValue(),'240');
 await page.locator('[name=title]').fill('The Lanterns of Hollow Harbor');
 await page.locator('[name=summary]').fill('A single evening. A missing lighthouse keeper. A harbor full of secrets.');
 await page.locator('[name=content]').fill('The last lantern has gone dark.\n\nYour party arrives as the tide turns. Follow the old sea wall, find the keeper and bring the light home.');
 await page.locator('[data-record-field=targetLevel]').fill('3');
 await privateBox.locator('summary').click();await page.locator('[name=privateNotes]').fill('SECRET: The keeper is the sea witch.');
 await page.locator('[data-save-record]').click();await waitSaved();
 const shotId=await page.evaluate(()=>CampaignWorkspace.session.record.id);
 await page.waitForSelector('[data-shot-host]');
 assert.ok((await page.locator('[data-open-record]').textContent()).includes('A single evening'));
 await page.locator('[data-shot-host]').selectOption('player');await page.locator('[data-approve-shot]').click();await waitSaved();
 await page.waitForSelector('[data-shot-roster]');
 const management=page.locator('[data-shot-roster] .one-shot-management').first();
 assert.equal(await management.evaluate(n=>n.open),false,'approved host/invite controls are optional');
 await management.locator(':scope > summary').click();await page.locator('[data-shot-invite]').selectOption('other');await page.locator('[data-invite-shot]').click();
 await page.waitForFunction(()=>CampaignWorkspace.session.record.data.participantUids.includes('other')&&!CampaignWorkspace.session.busy);
 await page.locator('[data-new-shot-character]').click();await page.waitForSelector('[data-shot-assignee]',{state:'attached'});
 const assignment=page.locator('.one-shot-character .one-shot-management');await assignment.locator('summary').click();await page.locator('[data-shot-assignee]').selectOption('other');await page.locator('[data-assign-shot-sheet]').click();await page.waitForFunction(()=>!CampaignWorkspace.session.busy);
 assert.equal(await page.evaluate(id=>Object.entries(testSheetDocs).find(([p])=>p.startsWith('campaigns/a/oneShots/'+id+'/characters/'))[1].userId,shotId),'other');

 // Failed saves keep the typed draft and the existing persisted introduction.
 await page.locator('[name=summary]').fill('Unsaved invitation');await page.evaluate(()=>failJournalWrite=true);await page.locator('[data-save-record]').click();await page.waitForFunction(()=>!CampaignWorkspace.session.busy);
 assert.match(await page.locator('[data-workspace-status]').textContent(),/Could not save/);
 assert.equal(await page.locator('[name=summary]').inputValue(),'Unsaved invitation');
 await page.evaluate(()=>{window.confirm=()=>false;SiteHelp.openGuide('dm')});await page.locator('[data-guide-action=dm-world]').click();assert.equal(await page.locator('#tab-dm-one-shots').isVisible(),true);
 await page.evaluate(()=>{failJournalWrite=false;window.confirm=()=>true});await page.locator('[data-save-record]').click();await waitSaved();
 for(const width of [1440,390,320]){
  await page.setViewportSize({width,height:1000});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.locator('[name=content]').scrollIntoViewIfNeeded();const save=await page.locator('[data-save-record]').boundingBox();assert.ok(save.y>=0&&save.y+save.height<=1000,'save stays in view');
  assert.deepEqual(await page.evaluate(async()=>(await axe.run('#dmWorkspaceShell',{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}})).violations.map(v=>v.id)),[]);
  await page.evaluate(()=>scrollTo(0,0));if(width!==320)await page.screenshot({path:out+'/one-shot-host-'+width+'.png',fullPage:true});
 }
 console.log('PASS Adventure creation, approval, invitations, sheet assignment, private preparation, failed-save recovery, navigation guards and responsive host design');

 await page.setViewportSize({width:1440,height:1000});
 await page.evaluate(()=>{auditSeed('player');showTab('player-adventures')});await page.locator('[data-open-record]').click();await page.waitForSelector('[data-shot-encounters]');
 assert.equal(await page.locator('[data-shot-host],[data-invite-shot]').count(),0,'an approved host has no campaign approval/invite controls');
 assert.equal(await page.locator('[data-shot-editor]').isVisible(),true);await privateBox.locator('summary').click();assert.match(await page.locator('[name=privateNotes]').inputValue(),/sea witch/);
 assert.equal(await page.locator('#dmWorkspaceShell').isVisible(),false);

 // Participant reads an invitation, never the preparation editor or secret document.
 await page.evaluate(()=>{auditSeed('other');shotReads.length=0;showTab('player-adventures')});await page.locator('[data-open-record]').click();await page.waitForSelector('[data-accept-shot]');
 assert.equal(await page.locator('[data-shot-reader]').isVisible(),true);assert.equal(await page.locator('[data-shot-editor]').isVisible(),false);
 assert.equal(await page.locator('[data-save-record]').isVisible(),false);assert.equal(await page.locator('[name=privateNotes]').isVisible(),false);
 assert.equal(await page.evaluate(()=>shotReads.some(p=>p.includes('workspaceSecrets'))),false);
 assert.equal((await page.locator('[data-workspace-form]').innerText()).includes('sea witch'),false);await page.evaluate(()=>SiteHelp.openGuide('player'));assert.equal(await page.locator('[data-guide-action^=dm-]').count(),0);assert.match(await page.locator('#siteGuideDialog').textContent(),/World card/);await page.locator('[data-guide-action=player-adventures]').click();await page.waitForSelector('[data-accept-shot]');
 await page.locator('[data-accept-shot]').click();await page.waitForSelector('[data-open-shot-sheet]');assert.equal(await page.locator('[data-accept-shot]').count(),0);
 assert.match(await page.locator('.one-shot-invitation').textContent(),/You’re in/);
 for(const width of [1440,390,320]){
  await page.setViewportSize({width,height:1000});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  assert.deepEqual(await page.evaluate(async()=>(await axe.run('#tab-player-adventures',{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}})).violations.map(v=>v.id)),[]);
  await page.evaluate(()=>scrollTo(0,0));if(width!==320)await page.screenshot({path:out+'/one-shot-player-'+width+'.png',fullPage:true});
 }
 await page.locator('.one-shot-more>summary').click();await page.locator('[data-print-record]').click();assert.equal((await page.locator('#workspacePrintSurface').textContent()).includes('sea witch'),false);await page.evaluate(()=>dispatchEvent(new Event('afterprint')));
 await page.locator('[data-open-shot-sheet]').click();await page.waitForSelector('#characterSheetForm');assert.equal(await page.evaluate(()=>sheetSession.oneShot?.id),shotId);

 await page.locator('[data-sheet-tab=skills]').click();
 assert.equal(await page.locator('#sheet-skills .sheet-save-row .vault-help-badge,#sheet-skills .sheet-ability label .vault-help-badge,#sheet-skills .sheet-skill-adjustments label .vault-help-badge').count(),0);
 assert.equal(await page.locator('#sheet-skills h4').filter({hasText:'Saving throws'}).locator('.vault-help-badge').count(),1);
 const bonus=page.locator('[name="saves.str.bonus"]');await bonus.focus();assert.match(await page.locator('#vaultContextHelp').textContent(),/manual bonus/);await page.keyboard.press('Escape');assert.equal(await page.locator('#vaultContextHelp').isVisible(),false);
 await bonus.locator('..').hover();assert.equal(await page.locator('#vaultContextHelp').isVisible(),true);assert.match(await page.locator('#vaultContextHelp').textContent(),/manual bonus/);
 await bonus.fill('2');assert.equal(await page.evaluate(()=>sheetSession.data.saves.str.bonus),2);
 const proficient=page.locator('[name="saves.dex.proficient"]');await proficient.check();assert.equal(await proficient.isChecked(),true);await proficient.uncheck();assert.equal(await proficient.isChecked(),false);
 for(const width of [1440,390,320]){await page.setViewportSize({width,height:1000});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.deepEqual(await page.evaluate(async()=>(await axe.run('#sheet-skills',{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}})).violations.map(v=>v.id)),[]);await page.evaluate(()=>scrollTo(0,0));if(width!==320)await page.screenshot({path:out+'/sheet-compact-help-'+width+'.png',fullPage:true});}
 console.log('PASS Compact saving-throw, ability and bonus help: single section badge, hover, keyboard focus, Escape, working checkbox/number controls and responsive accessibility');
 console.log('PASS Approved-host scope, participant reading, acceptance, own sheet entry, public print, private-document isolation and desktop/mobile accessibility');

 await page.evaluate(()=>{auditSeed('dm');showTab('dm-one-shots')});await page.locator('[data-open-record]').click();await page.waitForSelector('[data-shot-roster]');
 await page.evaluate(id=>{failShotList='campaigns/a/oneShots/'+id+'/characters';CampaignWorkspace.renderEditor()},shotId);await page.waitForSelector('[data-retry-shot]');assert.match(await page.locator('[data-extra-editor]').textContent(),/saved preparation is kept/);
 await page.locator('[data-retry-shot]').click();await page.waitForSelector('[data-shot-roster]');
 await page.evaluate(id=>{delayShotRead='campaigns/a/oneShots/'+id;CampaignWorkspace.renderEditor()},shotId);await page.waitForFunction(()=>!!window.releaseShotRead);
 await page.evaluate(async()=>{CampaignWorkspace.clear(true);activeCampaign={id:'b',name:'Other campaign',ownerId:'dm'};showTab('dm-one-shots');releaseShotRead();await new Promise(requestAnimationFrame)});
 assert.equal(await page.locator('[data-shot-roster]').count(),0,'a late roster cannot appear after changing campaigns');
 assert.deepEqual(errors,[]);console.log('PASS Retryable roster failure and stale-response protection');
 }finally{await browser.close()}})().catch(error=>{console.error(error);process.exitCode=1});
