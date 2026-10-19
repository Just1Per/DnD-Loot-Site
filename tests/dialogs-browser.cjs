// Non-Overview regression and visual checks against an isolated Firebase fixture.
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
 await page.addScriptTag({content:'function createCampaignStore(){return window.__DND_VAULT_DEPS__.vaultCall}'});
 const modules=JSON.parse(fs.readFileSync(root+'/tests/dom.cjs','utf8').match(/for\(const name of (\[[^\n]+?\])\)await run/)[1].replaceAll("'",'"'));
 for(const name of modules)await page.addScriptTag({path:root+'/js/modules/'+name+'.js'});
 await page.evaluate(()=>{CharacterCatalog.set(__testCatalog);document.getElementById('siteBootPanel')?.remove()});await page.addScriptTag({path:root+'/tests/dom-state.js'});
 await page.evaluate(data=>{window.__testMonsters=data;window.fetch=async u=>({ok:true,json:async()=>String(u).includes('monsters.json')?__testMonsters:__testCatalog});window.auditSeed=role=>{closeCharacterSheet(true);CampaignWorkspace.clear(true);SiteHelp.onLogout();seed(role);document.getElementById('loginControls').style.display='none';document.getElementById('logoutButton').style.display='inline-block';document.getElementById('adminTab').style.display=role==='admin'?'inline-block':'none';document.getElementById('userDisplay').textContent='Sample '+role;document.getElementById('activeCampaignName').textContent=activeCampaign.name;renderDMTools();SiteHelp.onLogin();};},JSON.parse(fs.readFileSync(root+'/data/rules/monsters.json','utf8')));
 await page.addScriptTag({path:require.resolve(process.env.AXE_PATH||'axe-core/axe.min.js')});


 async function centered(selector){
  const bounds=await page.locator(selector).boundingBox(),viewport=page.viewportSize();
  assert.ok(bounds,selector+' is visible');
  assert.ok(Math.abs(bounds.x+bounds.width/2-viewport.width/2)<2,selector+' horizontally centered: '+JSON.stringify(bounds));
  assert.ok(Math.abs(bounds.y+bounds.height/2-viewport.height/2)<2,selector+' vertically centered: '+JSON.stringify(bounds));
  assert.ok(bounds.x>=8&&bounds.y>=8&&bounds.x+bounds.width<=viewport.width-8&&bounds.y+bounds.height<=viewport.height-8,selector+' fits viewport');
  const style=await page.locator(selector).evaluate(node=>{const s=getComputedStyle(node);return {background:s.backgroundColor,border:s.borderTopWidth,overflow:node.scrollWidth>node.clientWidth+1}});
  assert.notEqual(style.background,'rgba(0, 0, 0, 0)');assert.notEqual(style.border,'0px');assert.equal(style.overflow,false,selector+' has no horizontal overflow');
 }
 await page.evaluate(()=>{auditSeed('player');testSheetDocs['campaigns/a/characters/c1']={...characters[0]}});await page.evaluate(()=>openCharacterSheet('c1'));
 await page.evaluate(()=>{sheetSession.data.build.classId='druid';sheetSession.data.adobe.classLevels=[{classId:'druid',level:3,subclassId:''}];renderCharacterSheet()});
 for(const viewport of [{width:1440,height:1000},{width:390,height:844},{width:320,height:568}]){
  await page.setViewportSize(viewport);
  await page.evaluate(()=>{window.popupResult=null;SiteConfirmation.ask({title:'Archive this saved entry?',paragraphs:['The entry, private notes and illustrations are kept.'],confirmLabel:'Archive entry'}).then(result=>window.popupResult=result)});
  await centered('#siteConfirmationDialog');await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>window.popupResult),false);
  await page.evaluate(()=>{sheetSession.dirty=true;SheetNavigation.guard(()=>window.unexpectedLeave=true)});
  await centered('#sheetLeaveDialog');assert.equal(await page.locator('[data-sheet-leave-stay]').evaluate(node=>node===document.activeElement),true);
  await page.locator('[data-sheet-leave-stay]').click();assert.equal(await page.evaluate(()=>sheetSession.dirty),true);
  const spellId=await page.evaluate(()=>CharacterCatalog.data.spells.find(row=>row.description)?.id);
  await page.evaluate(id=>openSpellInformation({catalogId:id}),spellId);await centered('#sheetSpellInformation');
  assert.ok((await page.locator('#sheetSpellInformation .sheet-rule-text').textContent()).length>0);
  await page.screenshot({path:out+'/spell-popup-'+viewport.width+'.png',fullPage:false});await page.locator('#sheetSpellInformation header button').click();
  await page.evaluate(()=>selectSheetTab('spells'));await page.locator('#sheetGenerateSpells').click();await page.waitForSelector('#sheetSpellGenerator[open]');await centered('#sheetSpellGenerator');
  await page.locator('#sheetSpellGenerator [data-close-generator]').first().click();
  // Cover the remaining dialog families using the actual shared stylesheet cascade.
  for(const className of ['workspace-sheet-dialog','dm-advancement-dialog','sheet-page-manager','sheet-personal-gear-editor','ai-lookup-dialog','vault-help-dialog']){
   await page.evaluate(className=>{const d=document.createElement('dialog');d.id='popupFamilyProbe';d.className=className;d.innerHTML='<h2>Saved entry</h2><p>Private details stay in the campaign.</p><button type="button">Close</button>';document.body.append(d);d.showModal()},className);
   await centered('#popupFamilyProbe');await page.evaluate(()=>document.getElementById('popupFamilyProbe').remove());
  }
  console.log('PASS Native dialog centering, style and viewport fit at '+viewport.width+'px; SRD details/generator and unsaved-draft decisions remain usable');
 }
 await page.setViewportSize({width:390,height:568});
 await page.evaluate(()=>{SiteConfirmation.ask({title:'A longer confirmation',paragraphs:Array(25).fill('Saved notes remain private and are kept when this entry is archived.'),confirmLabel:'Archive entry'});});
 await centered('#siteConfirmationDialog');assert.ok(await page.locator('#siteConfirmationDialog').evaluate(d=>d.scrollHeight>d.clientHeight));
 await page.locator('[data-site-cancel]').click();
 assert.equal(await page.locator('dialog:not([open])').evaluateAll(nodes=>nodes.every(node=>getComputedStyle(node).display==='none')),true);
 assert.equal(await page.evaluate(()=>!!window.unexpectedLeave),false);assert.deepEqual(errors,[]);
 console.log('PASS Long dialog content scrolls; closed dialogs remain hidden; cancel keeps the dirty draft');
 }finally{await browser.close()}})().catch(error=>{console.error(error);process.exitCode=1});
