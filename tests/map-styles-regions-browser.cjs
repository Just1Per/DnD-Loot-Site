// DM-managed shared map and named places against an isolated Firebase fixture.
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const root=path.resolve(__dirname,'..'),out=process.env.UI_OUTPUT_DIR||require('node:os').tmpdir()+'/campaignatlas-ui-checks';fs.mkdirSync(out,{recursive:true});
const assert=require('node:assert/strict');
const errors=[];
(async()=>{const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||(fs.existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined)});try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}});page.setDefaultTimeout(7000);
 page.on('pageerror',error=>{errors.push(error.message);console.error('MAP ERROR',error.message)});
 let html=fs.readFileSync(path.join(root,'index.html'),'utf8').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<link\b[^>]*href="([^"]*)"[^>]*>/gi,(tag,href)=>href.startsWith('css/')?'<style data-audit-file="'+href.split('?')[0]+'">'+fs.readFileSync(path.join(root,href.split('?')[0]),'utf8')+'\n/*# sourceURL='+href.split('?')[0]+' */</style>':tag);
 await page.route('https://fixture.example.test/**',route=>{const rel=new URL(route.request().url()).pathname.slice(1),file=path.join(root,rel);return route.fulfill(rel&&fs.existsSync(file)&&fs.statSync(file).isFile()?{path:file}:{contentType:'text/html',body:html})});await page.goto('https://fixture.example.test/',{waitUntil:'domcontentloaded'});
 await page.evaluate(data=>{window.__testCatalog=data;window.print=()=>{};window.fetch=async()=>({ok:true,json:async()=>window.__testCatalog});window.alert=text=>{window.auditAlerts||=[];auditAlerts.push(text)};window.confirm=()=>true;window.prompt=()=> 'Sample note'},JSON.parse(fs.readFileSync(root+'/data/rules/catalog.json','utf8')));
 for(const file of ['dom-setup.js','dom-fixture.js'])await page.addScriptTag({path:root+'/tests/'+file});
 await page.evaluate(()=>{const d=window.__DND_VAULT_DEPS__;d.where=(field,op,value)=>({field,op,value});d.query=(path,...filters)=>({path,filters});d.getDocs=async q=>{const p=typeof q==='string'?q:q.path,f=q.filters||[];return {docs:Object.entries(testSheetDocs).filter(([key,data])=>key.startsWith(p+'/')&&!key.slice(p.length+1).includes('/')&&f.every(f=>{const v=f.field.split('.').reduce((d,k)=>d?.[k],data);return f.op==='array-contains'?v?.includes(f.value):v===f.value})).map(([key,data])=>({id:key.split('/').at(-1),data:()=>structuredClone(data)}))}};d.ref=(_,p)=>p;d.getBlob=async()=>new Blob();d.uploadBytes=async()=>{};});
 await page.evaluate(()=>{const sdk=window.__DND_VAULT_DEPS__,run=sdk.runTransaction;window.mapWatchers=[];window.failMapWrite=false;sdk.runTransaction=async(...args)=>{if(failMapWrite)throw Error('Simulated map save failure');return run(...args)};sdk.onSnapshot=(path,next,error)=>{const watch={path,next,error,active:true};mapWatchers.push(watch);return()=>watch.active=false;};const canvas=document.createElement('canvas');canvas.width=1200;canvas.height=700;const c=canvas.getContext('2d');c.fillStyle='#eadcba';c.fillRect(0,0,1200,700);c.fillStyle='#adc8c6';c.beginPath();c.moveTo(800,0);c.bezierCurveTo(650,200,1100,250,820,400);c.bezierCurveTo(650,500,850,600,750,700);c.lineTo(1200,700);c.lineTo(1200,0);c.fill();c.strokeStyle='#9b7952';c.lineWidth=7;c.setLineDash([12,10]);c.beginPath();c.moveTo(200,150);c.quadraticCurveTo(500,250,700,500);c.stroke();c.fillStyle='#5c4934';c.font='32px Georgia';c.fillText('THE STORM COAST',380,75);c.font='22px Georgia';c.fillText('The Northern Road',180,400);c.fillStyle='#698d8b';c.fillText('The Silver Sea',930,450);window.mapImageBytes=Uint8Array.from(atob(canvas.toDataURL('image/png').split(',')[1]),ch=>ch.charCodeAt(0));sdk.getBlob=async()=>new Blob([mapImageBytes],{type:'image/png'});sdk.uploadBytes=async(path,file)=>{window.mapUpload=path;window.mapUploadSize=file.size;};});
 await page.evaluate(()=>{const sdk=__DND_VAULT_DEPS__,get=sdk.getDoc;window.mapDraftReads=0;sdk.getDoc=async path=>{if(window.denyPublishedMap&&String(path).endsWith('/campaignMaps/main'))throw Object.assign(Error('Missing or insufficient permissions'),{code:'permission-denied'});if(String(path).endsWith('/campaignMapDrafts/main')){mapDraftReads++;if(window.denyMapDraft)throw Object.assign(Error('Missing or insufficient permissions'),{code:'permission-denied'});}return get(path);};});
 await page.addScriptTag({content:'function createCampaignStore(){return window.__DND_VAULT_DEPS__.vaultCall}'});
 const modules=JSON.parse(fs.readFileSync(root+'/tests/dom.cjs','utf8').match(/for\(const name of (\[[^\n]+?\])\)await run/)[1].replaceAll("'",'"'));
 for(const name of modules)await page.addScriptTag({path:root+'/js/modules/'+name+'.js'});
 await page.evaluate(()=>{CharacterCatalog.set(__testCatalog);document.getElementById('siteBootPanel')?.remove()});await page.addScriptTag({path:root+'/tests/dom-state.js'});
 await page.evaluate(data=>{window.__testMonsters=data;window.fetch=async u=>({ok:true,json:async()=>String(u).includes('monsters.json')?__testMonsters:__testCatalog});window.auditSeed=role=>{closeCharacterSheet(true);CampaignWorkspace.clear(true);SiteHelp.onLogout();seed(role);document.getElementById('loginControls').style.display='none';document.getElementById('logoutButton').style.display='inline-block';document.getElementById('adminTab').style.display=role==='admin'?'inline-block':'none';document.getElementById('userDisplay').textContent='Sample '+role;document.getElementById('activeCampaignName').textContent=activeCampaign.name;renderDMTools();SiteHelp.onLogin();};},JSON.parse(fs.readFileSync(root+'/data/rules/monsters.json','utf8')));
 await page.addScriptTag({path:require.resolve(process.env.AXE_PATH||'axe-core/axe.min.js')});


 await page.evaluate(()=>{auditSeed('dm');testSheetDocs['campaigns/a/campaignMaps/main']={title:'The Storm Coast',imagePath:'campaign-maps/a/map',revision:1,updatedBy:'dm',updatedAt:1};showTab('dm-map')});await page.waitForFunction(()=>CampaignMap.session?.ready);
 for(const style of ['Location','City','Castle','Landmark','Point of interest']){
  await page.locator('[data-map-add]').click();await page.locator('.map-keyboard-place').click();await page.locator('[data-pin-name]').fill(style+' example');await page.locator('[data-pin-markerStyle]').selectOption(style);await page.locator('[data-pin-revealed]').check();
  assert.ok((await page.locator('.map-marker-preview').textContent()).includes(style));
  await page.locator('[data-map-pin-form] details > summary').click();
  await page.locator('[data-pin-x]').fill(String(15+10*['Location','City','Castle','Landmark','Point of interest'].indexOf(style)));await page.locator('[data-pin-y]').fill('25');
  await page.locator('[data-map-pin-form] button[type=submit]').click();
 }
 assert.equal(await page.locator('[data-map-pin]').count(),5);
 await page.locator('[data-map-add-region]').click();await page.locator('[data-pin-name]').fill('The Storm Coast');await page.locator('[data-pin-description]').fill('A named region with its own story.');
 await page.locator('[data-region-finish]').click();assert.match(await page.locator('[data-map-status]').textContent(),/three corners/);
 const corners=[[20,40],[65,42],[70,75],[25,80]];
 for(const [x,y] of corners){await page.locator('[data-corner-x]').fill(String(x));await page.locator('[data-corner-y]').fill(String(y));await page.locator('[data-corner-add]').click();}
 await page.locator('[data-region-undo]').click();assert.equal(await page.evaluate(()=>CampaignMap.session.pinEditor.boundary.length),3);
 await page.locator('[data-corner-x]').fill('25');await page.locator('[data-corner-y]').fill('80');await page.locator('[data-corner-add]').click();
 // Appearance previews immediately; changing it does not publish or replace the editor.
 const beforeStyle=await page.evaluate(()=>JSON.stringify(testSheetDocs));
 await page.locator('[data-region-color]').focus();await page.locator('[data-region-color]').evaluate(input=>{input.value='#2b7390';input.dispatchEvent(new Event('input',{bubbles:true}));});
 assert.equal(await page.locator('[data-region-color]').evaluate(input=>document.activeElement===input),true);
 await page.locator('[data-region-transparency]').focus();await page.keyboard.press('End');assert.equal(await page.locator('[data-region-transparency]').inputValue(),'100');
 assert.equal(await page.locator('[data-map-region]').evaluate(node=>getComputedStyle(node).fillOpacity),'0');assert.notEqual(await page.locator('[data-map-region]').evaluate(node=>getComputedStyle(node).stroke),'none');
 await page.keyboard.press('Home');assert.equal(await page.locator('[data-map-region]').evaluate(node=>getComputedStyle(node).fillOpacity),'1');
 await page.locator('[data-region-transparency]').evaluate(input=>{input.value='60';input.dispatchEvent(new Event('input',{bubbles:true}));});
 assert.equal(await page.locator('[data-region-transparency]').evaluate(input=>document.activeElement===input),true);assert.match(await page.locator('[data-region-transparency-value]').textContent(),/60% transparent/);
 assert.deepEqual(await page.locator('[data-map-region]').evaluate(node=>({fill:getComputedStyle(node).fill,opacity:getComputedStyle(node).fillOpacity})),{fill:'rgb(43, 115, 144)',opacity:'0.4'});
 assert.equal(await page.evaluate(()=>JSON.stringify(testSheetDocs)),beforeStyle);
 await page.screenshot({path:out+'/map-region-appearance-desktop.png',fullPage:true});
 // Every save entry point guides the DM to the unfinished boundary without writing data.
 const beforeFinish=await page.evaluate(()=>JSON.stringify(testSheetDocs));
 for(const selector of ['[data-map-pin-form] button[type=submit]','[data-map-save]','[data-map-publish]']){
  await page.locator(selector).click();
  assert.equal(await page.locator('.map-region-needs-finish').count(),1);
  assert.equal(await page.locator('[data-region-finish]').getAttribute('aria-describedby'),'mapRegionFinishHelp');
  assert.match(await page.locator('#mapRegionFinishHelp').textContent(),/Next step: Finish boundary/);
  assert.equal(await page.evaluate(()=>document.activeElement.matches('[data-region-finish]')),true);
  assert.equal(await page.evaluate(()=>JSON.stringify(testSheetDocs)),beforeFinish);
 }
 for(const width of [390,320]){
  await page.setViewportSize({width,height:1000});await page.locator('[data-map-save]').click();
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  assert.deepEqual(await page.evaluate(async()=>(await axe.run('.campaign-map',{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}})).violations.map(v=>v.id)),[]);
 }
 await page.screenshot({path:out+'/map-unfinished-boundary-320.png',fullPage:true});
 await page.setViewportSize({width:1440,height:1000});
 await page.locator('[data-region-finish]').press('Enter');assert.equal(await page.locator('.map-region-needs-finish').count(),0);assert.equal(await page.locator('#mapRegionFinishHelp').count(),0);
 await page.locator('[data-map-pin-form] button[type=submit]').click();
 assert.equal(await page.locator('[data-map-region]').count(),1);
 await page.locator('[data-map-save]').click();await page.waitForFunction(()=>!CampaignMap.session.busy);
 await page.locator('[data-map-publish]').click();await page.waitForFunction(()=>!CampaignMap.session.busy&&CampaignMap.session.map.revision===2);
 await page.locator('[data-map-preview]').click();assert.equal(await page.locator('[data-map-region]').count(),0);assert.equal(await page.locator('[data-map-pin]').count(),5);
 await page.locator('[data-map-preview]').click();await page.locator('[data-map-place]').filter({hasText:'The Storm Coast'}).click();await page.locator('[data-pin-edit]').click();
 assert.equal(await page.evaluate(()=>CampaignMap.session.pinEditor.boundary.length),4);
 assert.equal(await page.locator('[data-region-color]').inputValue(),'#2b7390');assert.equal(await page.locator('[data-region-transparency]').inputValue(),'60');
 await page.locator('[data-region-draw]').click();assert.equal(await page.evaluate(()=>CampaignMap.session.pinEditor.boundary.length),0);
 // Exercise pointer drawing as well as the equivalent keyboard coordinate controls.
 for(const [x,y] of corners){await page.locator('[data-map-image]').scrollIntoViewIfNeeded();const b=await page.locator('[data-map-image]').boundingBox();await page.mouse.click(b.x+b.width*x/100,b.y+b.height*y/100);}
 await page.locator('[data-region-finish]').click();await page.locator('[data-pin-revealed]').check();await page.locator('[data-map-pin-form] button[type=submit]').click();
 await page.locator('[data-map-publish]').click();await page.waitForFunction(()=>!CampaignMap.session.busy&&CampaignMap.session.map.revision===3);
 await page.evaluate(()=>{CampaignMap.clear();auditSeed('player');showTab('campaign-map')});await page.waitForFunction(()=>CampaignMap.session?.ready);
 assert.equal(await page.locator('[data-map-region]').count(),1);assert.equal(await page.locator('[data-map-pin]').count(),6);
 assert.deepEqual(await page.evaluate(()=>CampaignMap.session.pins.find(p=>p.name==='The Storm Coast').regionStyle),{color:'#2b7390',opacity:.4});assert.deepEqual(await page.locator('[data-map-region]').evaluate(node=>({fill:getComputedStyle(node).fill,opacity:getComputedStyle(node).fillOpacity})),{fill:'rgb(43, 115, 144)',opacity:'0.4'});
 await page.locator('[data-map-place]').filter({hasText:'The Storm Coast'}).click();assert.equal(await page.locator('[data-place-heading]').textContent(),'The Storm Coast');assert.match(await page.locator('.map-prose').textContent(),/own story/);
 for(const width of [1440,390,320]){await page.setViewportSize({width,height:1000});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));const violations=await page.evaluate(async()=>(await axe.run('.campaign-map',{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}})).violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})));assert.deepEqual(violations,[]);if(width!==320)await page.screenshot({path:out+'/map-styles-regions-'+width+'.png',fullPage:true});}
 // Draw the expanded limit through the actual coordinate controls, then publish and reload as player.
 await page.setViewportSize({width:1440,height:1000});await page.evaluate(()=>{CampaignMap.clear();auditSeed('dm');showTab('dm-map')});await page.waitForFunction(()=>CampaignMap.session?.ready);
 await page.locator('[data-map-add-region]').click();await page.locator('[data-pin-name]').fill('Detailed coastline');await page.locator('[data-pin-revealed]').check();
 const detailed=Array.from({length:256},(_,i)=>({x:Number((50+30*Math.cos(i*2*Math.PI/256)).toFixed(1)),y:Number((50+30*Math.sin(i*2*Math.PI/256)).toFixed(1))}));
 await page.evaluate(points=>{for(const point of points){document.querySelector('[data-corner-x]').value=point.x;document.querySelector('[data-corner-y]').value=point.y;document.querySelector('[data-corner-add]').click();}},detailed);
 assert.equal(await page.evaluate(()=>CampaignMap.session.pinEditor.boundary.length),256);assert.match(await page.locator('.map-region-tools').textContent(),/256 of 256 corners/);
 await page.locator('[data-corner-add]').click();assert.match(await page.locator('[data-map-status]').textContent(),/Maximum 256/);assert.equal(await page.evaluate(()=>CampaignMap.session.pinEditor.boundary.length),256);
 await page.locator('[data-region-undo]').click();assert.equal(await page.evaluate(()=>CampaignMap.session.pinEditor.boundary.length),255);
 await page.locator('[data-corner-x]').fill(String(detailed.at(-1).x));await page.locator('[data-corner-y]').fill(String(detailed.at(-1).y));await page.locator('[data-corner-add]').click();
 await page.locator('[data-region-finish]').click();await page.locator('[data-map-pin-form] button[type=submit]').click();await page.locator('[data-map-publish]').click();await page.waitForFunction(()=>!CampaignMap.session.busy&&CampaignMap.session.map.revision===4);
 await page.evaluate(()=>{CampaignMap.clear();auditSeed('player');showTab('campaign-map')});await page.waitForFunction(()=>CampaignMap.session?.ready);
 const shape=await page.evaluate(()=>{const pin=CampaignMap.session.pins.find(pin=>pin.name==='Detailed coastline'),polygon=document.querySelector('[data-map-region="'+pin.id+'"]');return {points:pin.boundary,vertices:polygon.getAttribute('points').trim().split(/\s+/).length};});
 assert.deepEqual(shape.points,detailed);assert.equal(shape.vertices,256);assert.equal(await page.locator('[data-map-region]').count(),2);
 for(const width of [390,320]){await page.setViewportSize({width,height:1000});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.deepEqual(await page.evaluate(async()=>(await axe.run('.campaign-map',{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}})).violations.map(v=>v.id)),[]);}
 console.log('PASS 256 real corner controls, overflow, undo/re-add, finish, publication and exact player SVG round-trip');
 assert.deepEqual(errors,[]);console.log('PASS Five styles, keyboard and pointer area drawing, minimum corners, undo, redraw, reload, hidden-region isolation, atomic publication, player descriptions, mobile and WCAG');
 }finally{await browser.close()}})().catch(error=>{console.error(error);process.exitCode=1});
