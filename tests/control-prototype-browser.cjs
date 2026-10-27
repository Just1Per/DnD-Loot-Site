// Real + Page launcher and isolated, manual Adobe first-page prototype.
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




 const context=page.context(),requests=[];let failFields=true;
 await context.route('https://fixture.example.test/prototypes/character-control/**',route=>{
  const rel=new URL(route.request().url()).pathname.slice(1),file=path.join(root,rel.endsWith('/')?rel+'index.html':rel);requests.push(route.request().url());
  if(rel.endsWith('fields.json')&&failFields){failFields=false;return route.fulfill({status:503,body:'Temporary failure'})}
  return route.fulfill(fs.existsSync(file)?{path:file}:{status:404,body:'Not found'});
 });
 await page.evaluate(async()=>{auditSeed('player');await openCharacterSheet('c1')});
 const saved=await page.evaluate(()=>JSON.stringify(sheetSession.data)),dirty=await page.evaluate(()=>sheetSession.dirty);
 await page.locator('#sheetAddPageButton').click();const link=page.locator('#sheetControlPrototypeLink');assert.equal(await link.getAttribute('target'),'_blank');assert.equal(await link.getAttribute('rel'),'noopener');assert.ok((await link.boundingBox()).height>=44);
 const [prototype]=await Promise.all([page.waitForEvent('popup'),link.click()]);prototype.on('pageerror',e=>errors.push(e.message));prototype.setDefaultTimeout(7000);
 await prototype.locator('#retry').waitFor({state:'visible'});assert.equal(await prototype.locator('#paper').isHidden(),true);await prototype.locator('#retry').click();await prototype.locator('[data-field-id="PC Name"]').waitFor({state:'visible'});
 const definition=JSON.parse(fs.readFileSync(root+'/prototypes/character-control/fields.json','utf8'));
 assert.equal(await prototype.locator('[data-field-id]').count(),295);assert.equal(await prototype.locator('#fields select').count(),36);assert.equal(await prototype.locator('#fields textarea').count(),4);assert.equal(await prototype.locator('#fields input[type=checkbox]').count(),105);
 assert.equal(await prototype.evaluate(()=>[...document.querySelectorAll('[data-field-id]')].every(n=>n.type==='checkbox'?!n.checked:n.value==='')),true,'prototype starts blank rather than copying the supplied character');
 const byId=id=>prototype.locator('[data-field-id="'+id+'"]');
 await prototype.setViewportSize({width:1440,height:2200});await prototype.locator('.sheet-artwork').evaluate(n=>n.decode());
 await byId('PC Name').fill('Prototype tester');await byId('Character Level').fill('5');await byId('Class and Levels').fill('Fighter');await byId('Str').fill('18');
 assert.equal(await byId('Str Mod').inputValue(),'','no ability calculation is attached');assert.equal(await byId('Str ST Mod').inputValue(),'');
 await byId('Background').selectOption('Acolyte');await byId('Race').selectOption('Leonin');assert.equal(await byId('Language 1').inputValue(),'','race selection does not run character grants');
 await byId('Attack.1.Weapon Selection').selectOption('Longsword');assert.equal(await byId('Attack.1.Damage').inputValue(),'','weapon selection does not run damage calculations');
 await byId('Str ST Prof').check();await byId('Saving Throw advantages / disadvantages').fill('Manual notes for the visual test.');
 await byId('HP Max').fill('40');await byId('HP Current').fill('29');await byId('Proficiency Bonus').fill('+3');await byId('AC').fill('16');await byId('Speed').fill('30 ft');
 assert.equal(await page.evaluate(()=>JSON.stringify(sheetSession.data)),saved);assert.equal(await page.evaluate(()=>sheetSession.dirty),dirty);assert.equal(await prototype.evaluate(()=>window.opener),null,'prototype cannot change the character through its opener');
 assert.equal(await prototype.evaluate(()=>[...document.querySelectorAll('.prototype-field')].every(n=>{const r=n.getBoundingClientRect(),p=document.getElementById('paper').getBoundingClientRect();return r.left>=p.left-1&&r.top>=p.top-1&&r.right<=p.right+1&&r.bottom<=p.bottom+1})),true,'all source fields remain inside the source page');
 await byId('Spell DC 1 Mod').selectOption('Wisdom');assert.equal(await byId('Spell save DC 1').inputValue(),'');await byId('Spell DC 1 Mod').evaluate(n=>n.blur());
 await prototype.locator('#paper').screenshot({path:out+'/control-prototype-desktop.png'});
 const before=await prototype.locator('#paper').boundingBox();await prototype.locator('#zoom').selectOption('2');const after=await prototype.locator('#paper').boundingBox();assert.ok(after.width>before.width);
 for(const width of [390,320]){await prototype.setViewportSize({width,height:900});await prototype.locator('#zoom').selectOption('fit');assert.equal(await prototype.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);await prototype.locator('#zoom').selectOption('2');assert.equal(await prototype.locator('#viewport').evaluate(n=>n.scrollWidth>n.clientWidth),true);}
 await prototype.setViewportSize({width:1440,height:2200});await prototype.locator('#zoom').selectOption('fit');await byId('PC Name').focus();await prototype.keyboard.press('Tab');assert.equal(await prototype.evaluate(()=>document.activeElement.dataset.fieldId),'Character Level');
 const downloadEvent=prototype.waitForEvent('download');await prototype.locator('#download').click();const download=await downloadEvent;const draft=JSON.parse(fs.readFileSync(await download.path(),'utf8'));assert.equal(draft.fields['PC Name'],'Prototype tester');assert.equal(draft.fields['Str'],'18');assert.equal(draft.fields['Str Mod'],'');assert.equal(draft.fields['Str ST Prof'],true);
 prototype.once('dialog',d=>d.dismiss());await prototype.locator('#reset').click();assert.equal(await byId('PC Name').inputValue(),'Prototype tester');
 await prototype.pdf({path:out+'/control-prototype-print.pdf',preferCSSPageSize:true,printBackground:true});
 const {execFileSync}=require('node:child_process');assert.match(execFileSync('pdfinfo',[out+'/control-prototype-print.pdf'],{encoding:'utf8'}),/Pages:\s+1\b/);assert.match(execFileSync('pdftotext',[out+'/control-prototype-print.pdf','-'],{encoding:'utf8'}),/Prototype tester/);
 await prototype.addScriptTag({path:require.resolve(process.env.AXE_PATH||'axe-core/axe.min.js')});const violations=await prototype.evaluate(async()=>(await axe.run(document.body,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','best-practice']}})).violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)})));assert.deepEqual(violations,[]);
 prototype.once('dialog',d=>d.accept());await prototype.locator('#reset').click();assert.equal(await byId('PC Name').inputValue(),'');assert.equal(await byId('Str ST Prof').isChecked(),false);
 const chooserEvent=prototype.waitForEvent('filechooser');await prototype.locator('#openDraft').click();await (await chooserEvent).setFiles({name:'draft.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(draft))});await prototype.waitForFunction(()=>document.getElementById('status').textContent.startsWith('Prototype draft opened'));assert.equal(await byId('PC Name').inputValue(),'Prototype tester');assert.equal(await byId('Str ST Prof').isChecked(),true);
 await prototype.locator('#draftFile').setInputFiles({name:'invalid.json',mimeType:'application/json',buffer:Buffer.from('{"format":1,"prototype":"other","fields":{}}')});await prototype.waitForFunction(()=>document.getElementById('status').textContent.includes('not a valid'));assert.equal(await byId('PC Name').inputValue(),'Prototype tester');
 await prototype.locator('#draftFile').setInputFiles({name:'invalid-field.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({...draft,fields:{...draft.fields,'PC Name':'Must not apply',Str:18}}))});await prototype.waitForFunction(()=>document.getElementById('draftFile').value==='');assert.equal(await byId('PC Name').inputValue(),'Prototype tester','an invalid later field cannot partially replace earlier entries');
 await byId('PC Name').fill('Keep this draft');prototype.once('dialog',d=>d.dismiss());await prototype.locator('#draftFile').setInputFiles({name:'draft.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(draft))});await prototype.waitForFunction(()=>document.getElementById('draftFile').value==='');assert.equal(await byId('PC Name').inputValue(),'Keep this draft');
 assert.ok(requests.every(url=>url.startsWith('https://fixture.example.test/prototypes/character-control/')));assert.equal(await page.evaluate(()=>JSON.stringify(sheetSession.data)),saved);assert.deepEqual(errors,[]);
 console.log('PASS + Page launch, retry, 295 original-position fields/36 dropdowns, blank source privacy, manual inputs without engine effects, character isolation, zoom/mobile/keyboard, draft export, reset safeguards, one-page print and accessibility');
 }finally{await browser.close()}})().catch(error=>{console.error(error);process.exitCode=1});
