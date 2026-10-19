// Responsive site and campaign audit against an isolated Firebase fixture.
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

 const results=[];
 for(const width of [1440,390,320]){
  await page.setViewportSize({width,height:900});
  for(const [role,tab] of [['dm','dm'],['dm','dm-settings'],['dm','dm-world'],['dm','dm-party'],['dm','dm-one-shots'],['dm','library'],['player','campaign-home'],['player','campaign-information'],['player','campaign-npcs'],['player','campaign-chapters'],['player','player']]){
   await page.evaluate(({role,tab})=>{auditSeed(role);showTab(tab)}, {role,tab});
   await page.waitForFunction(()=>!document.querySelector('#mainApp [aria-busy=true]'));
   const state=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,controls:[...document.querySelectorAll('button,input:not([type=hidden]),select,textarea')].filter(n=>n.getClientRects().length&&getComputedStyle(n).visibility!=='hidden').map(n=>{const b=n.getBoundingClientRect(),s=getComputedStyle(n);return {id:n.id,text:(n.textContent||n.getAttribute('aria-label')||n.placeholder||'').trim().slice(0,65),tag:n.tagName,width:Math.round(b.width),height:Math.round(b.height),font:s.fontSize,color:s.color,background:s.backgroundColor,right:Math.round(b.right)}})}));
   const violations=await page.evaluate(async()=>(await axe.run('#mainApp',{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}})).violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))})));
   results.push({width,role,tab,...state,violations});
   await page.screenshot({path:out+'/audit-'+tab+'-'+width+'.png',fullPage:true});
   console.log(tab,width,'overflow',state.overflow,'violations',JSON.stringify(violations));
  }
 }
 fs.writeFileSync(out+'/consistency-audit.json',JSON.stringify({results,errors},null,2));
 for(const result of results){
  assert.equal(result.overflow,false,result.tab+' fits '+result.width+'px');
  assert.deepEqual(result.violations,[],result.tab+' accessibility at '+result.width+'px');
  if(result.width<=650) assert.ok(result.controls.filter(c=>c.tag==='BUTTON'&&c.text!=='?').every(c=>c.height>=44),'mobile action targets: '+result.tab);
 }
 for(const width of [1440,390,320]){
  await page.setViewportSize({width,height:900});
  await page.evaluate(()=>{auditSeed('dm');characters[0].name='A'.repeat(90);campaignMembers[1].displayName='B'.repeat(90);renderDMCharacters();showTab('dm-party')});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'long party names fit');
  assert.equal(await page.locator('#dmCharacterList .admin-char-btns button').evaluateAll(nodes=>nodes.every(node=>{const b=node.getBoundingClientRect(),parent=node.closest('.dm-character-group').getBoundingClientRect();return b.height>=44&&b.left>=parent.left&&b.right<=parent.right})),true,'all character actions fit their cards and have touch targets');
  await page.locator('[data-dm-saved="c1"]').click();
  await page.waitForSelector('#tab-character-wishlist', {state:'visible'});
  assert.ok((await page.locator('#tab-character-wishlist').textContent()).includes('Wishlist'),'saved action opens the character wishlist');
  await page.evaluate(()=>showTab('dm-party'));
  if(width<=650){
   assert.ok(await page.locator('#logoutButton').evaluate(n=>n.getBoundingClientRect().height>=44),'header logout touch target');
   await page.evaluate(()=>showTab('dm-world'));
   assert.equal(await page.locator('#tab-dm-world input[type=search],#tab-dm-world input[type=text]').first().evaluate(n=>getComputedStyle(n).fontSize),'16px','mobile editor fields avoid small-text zoom');
  }
 }
 assert.deepEqual(errors,[]);
 console.log('PASS 33 campaign/site states fit desktop and mobile with no axe violations; long party names, touch targets, wishlist navigation and mobile field sizes pass');
 }finally{await browser.close()}})().catch(error=>{console.error(error);process.exitCode=1});
