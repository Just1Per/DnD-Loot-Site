// Non-Overview regression and visual checks against an isolated Firebase fixture.
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const root=path.resolve(__dirname,'..'),out=process.env.UI_OUTPUT_DIR||require('node:os').tmpdir()+'/campaignatlas-ui-checks';fs.mkdirSync(out,{recursive:true});
const {execFileSync}=require('node:child_process');
const pdfText=file=>execFileSync('pdftotext',[file,'-'],{encoding:'utf8'});
const errors=[],headers=new Map();let passed=0;
const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const browser=await chromium.launch({headless:true});try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}});page.setDefaultTimeout(7000);
 page.on('pageerror',error=>errors.push(error.message));
 const cdp=await page.context().newCDPSession(page);await cdp.send('DOM.enable');await cdp.send('CSS.enable');cdp.on('CSS.styleSheetAdded',({header})=>headers.set(header.styleSheetId,header));await cdp.send('CSS.startRuleUsageTracking');
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

 const assert=require('node:assert/strict');
 const check=(name,condition)=>{assert.ok(condition,name);passed++;console.log('PASS',name)};
 await page.evaluate(()=>document.getElementById('siteBootPanel')?.remove());
 await page.evaluate(()=>{auditSeed('dm');showTab('dm')});
 const cards=page.locator('#dmToolsPanel .dm-tools-grid > .dm-tool-card:not(.dm-tool-card--wide)');
 const headings=await cards.locator('h2').evaluateAll(nodes=>nodes.map(node=>node.textContent.replace(/\?/g,'').trim()));
 check('Five desktop DM cards appear in the requested order',JSON.stringify(headings)===JSON.stringify(['Item Controls','Campaign Settings','World Building','Chapter Tracker','One Shots']));
 check('Primary site actions use burgundy',await page.locator('#dmOpenLibrary').evaluate(node=>getComputedStyle(node).backgroundColor==='rgb(155, 29, 29)'));
 const positions=await cards.evaluateAll(nodes=>nodes.map(node=>({y:node.getBoundingClientRect().y,height:node.getBoundingClientRect().height})));
 check('Five desktop DM cards share one row',positions.every(point=>Math.abs(point.y-positions[0].y)<1));
 check('DM card heights follow content without a 340 px minimum',await cards.first().evaluate(node=>getComputedStyle(node).minHeight!=='340px'));
 await page.setViewportSize({width:390,height:844});
 check('DM layout fits mobile',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.setViewportSize({width:1440,height:1000});
 for(const modal of ['itemModal','userModal','editCharModal','wishModal','campaignModal']){
  await page.locator('#dmOpenLibrary').focus();
  await page.evaluate(id=>openVaultModal(id),modal);
  for(let i=0;i<12;i++)await page.keyboard.press('Tab');
  check(modal+' contains keyboard focus',await page.evaluate(id=>document.getElementById(id).contains(document.activeElement),modal));
  await page.evaluate(()=>SiteHelp.hide());await page.keyboard.press('Escape');await wait(50);
  check(modal+' closes and returns focus',await page.evaluate(id=>!document.getElementById(id).open&&document.activeElement.id==='dmOpenLibrary',modal));
 }
 await page.evaluate(()=>{auditSeed('player');showTab('player')});
 check('My Characters has one sheet-first create action',await page.locator('#playerCreateCharBtn').count()===1&&await page.locator('#playerCharName,#playerCharClass,#playerCharLevel').count()===0);
 await page.locator('#playerCreateCharBtn').click();await page.waitForSelector('#sheetBuildControls');
 check('Create opens the new character in its builder',await page.evaluate(()=>sheetSession?.identity?.name==='New adventurer'&&!document.getElementById('sheet-builder').hidden));
 await page.evaluate(()=>{closeCharacterSheet(true);showTab('player-adventures')});await page.waitForSelector('#tab-player-adventures [data-new-record]');
 check('Player adventure entry excludes campaign navigation',await page.locator('#tab-player-adventures [data-workspace-kind]:visible').count()===0);
 await page.evaluate(()=>{testSheetDocs['campaigns/a/oneShots/hosted']={kind:'oneShot',schemaVersion:1,revision:1,title:'Player side adventure',summary:'A separate quest',content:'Meet at the bridge',archived:false,createdBy:'dm',createdAt:1,updatedBy:'dm',updatedAt:1,data:{approved:true,hostUid:'player',participantUids:['player'],status:'Ready',rosterMode:'Mixed',targetLevel:3,players:4,duration:120,links:[]}};testSheetDocs['campaigns/a/workspaceSecrets/oneShot-hosted']={notes:'Host-only preparation'};testSheetDocs['campaigns/a/oneShots/hosted/participants/player']={status:'accepted'};CampaignWorkspace.clear(true);showTab('player-adventures')});
 await page.locator('#tab-player-adventures [data-open-record="hosted"]').click();await page.waitForSelector('#tab-player-adventures [data-shot-encounters]');
 check('Approved player host has scoped preparation and roster actions',await page.locator('#tab-player-adventures [name="privateNotes"]').inputValue()==='Host-only preparation'&&await page.locator('#tab-player-adventures [data-new-shot-character]').count()===1);
 check('Player host cannot approve invitations or copy campaign secrets',await page.locator('#tab-player-adventures [data-approve-shot],#tab-player-adventures [data-invite-shot],#tab-player-adventures [data-copy-encounter],#tab-player-adventures [data-workspace-links]').count()===0);
 await page.locator('#tab-player-adventures [data-shot-encounters]').click();await page.waitForSelector('#tab-player-adventures [data-back-one-shots]');
 check('Player host encounters stay in the restricted adventure entry',await page.evaluate(()=>CampaignWorkspace.session.kind==='adventureEncounter'&&CampaignWorkspace.configs.adventureEncounter.tab==='player-adventures'));
 await page.locator('#tab-player-adventures [data-back-one-shots]').click();await page.waitForSelector('#tab-player-adventures [data-open-record="hosted"]');
 for(const tab of ['dm','dm-world','dm-chapters','dm-one-shots']){await page.evaluate(tab=>showTab(tab),tab);check('Player cannot enter '+tab,await page.locator('#tab-'+tab).isHidden());}
 await page.evaluate(()=>{CampaignWorkspace.clear(true);auditSeed('admin');activeMembershipRole='player';showTab('player');showTab('dm-world')});
 check('Global admin without campaign rights cannot enter DM world',await page.locator('#tab-dm-world').isHidden());
 await page.evaluate(()=>{auditSeed('player');testSheetDocs['campaigns/a/characters/c1']={...characters[0]}});await page.evaluate(()=>openCharacterSheet('c1'));
 // All sheet assertions reuse saved state and the actual renderers, not copied markup.
 await page.evaluate(()=>{sheetSession.data.adobe.pages.companion=true;sheetSession.data.adobe.pages.notes=true;sheetSession.data.adobe.pages.rules=true;renderCharacterSheet();selectSheetTab('companion')});
 check('All Companion selects have accessible names',await page.locator('#sheet-companion select').evaluateAll(nodes=>nodes.every(node=>node.getAttribute('aria-label')||node.closest('label'))));
 const search=page.locator('#sheet-companion [data-creature-search]').first();await search.fill('beast tiny');
 const found=await page.locator('#sheet-companion [data-creature-select]').first().locator('option').count();
 check('Companion search matches multiple terms',found===1+await page.evaluate(()=>CharacterCreatureData.rows.filter(row=>[row.name,row.type,row.id,row.cr,row.size].join(' ').toLowerCase().includes('beast')&&[row.name,row.type,row.id,row.cr,row.size].join(' ').toLowerCase().includes('tiny')).length));
 await page.evaluate(()=>selectSheetTab('story'));
 for(const trait of ['personality','ideals','bonds','flaws']){
  const field=page.locator('[name="'+trait+'"]');check(trait+' remains editable without invalid combobox semantics',await field.getAttribute('role')===null&&await field.evaluate(node=>!node.readOnly&&!!node.labels.length));
 }
 await page.evaluate(()=>selectSheetTab('builder'));
 check('Builder jump links target real sections',await page.locator('.sheet-builder-nav a').evaluateAll(nodes=>nodes.length>=4&&nodes.every(node=>!!document.querySelector(node.getAttribute('href')))));
 check('Help buttons sit outside non-Overview summaries',await page.locator('.sheet-panel:not(#sheet-overview) summary .vault-help-badge').count()===0);
 await page.evaluate(()=>{selectSheetTab('skills');const method=document.querySelector('[name="build.scoreMethod"]');method.value='pointBuy';method.dispatchEvent(new Event('change',{bubbles:true}));for(const [key,value] of Object.entries({str:15,dex:15,con:15,int:8,wis:8,cha:9})){const field=document.querySelector('[name="abilities.'+key+'"]');field.value=value;field.dispatchEvent(new Event('change',{bubbles:true}));}});
 check('Real browser blocks over-budget point buy',await page.evaluate(()=>!document.getElementById('characterSheetForm').checkValidity()));
 const writesBefore=await page.evaluate(()=>testWrites.length);await page.locator('#sheetSave').click();
 check('Invalid point buy makes no save writes',await page.evaluate(()=>testWrites.length)===writesBefore);
 await page.evaluate(()=>{document.querySelector('[data-point-buy-reset]').click();selectSheetTab('builder')});
 await page.evaluate(()=>{sheetSession.data.build.classId='druid';sheetSession.data.adobe.classLevels=[{classId:'druid',level:3,subclassId:''},{classId:'cleric',level:3,subclassId:''}];renderCharacterSheet()});
 await page.evaluate(()=>selectSheetTab('spells'));
 check('Class spell tables are labelled keyboard scroll regions',await page.locator('.sheet-spell-table-wrap').evaluateAll(nodes=>nodes.length>=2&&nodes.every(node=>node.tabIndex===0&&node.getAttribute('role')==='region'&&node.getAttribute('aria-label'))));
 for(const tab of ['builder','skills','combat','spells','inventory','feats','story','notes','companion','rules']){
  await page.evaluate(tab=>{selectSheetTab(tab);SiteHelp.refresh()},tab);await wait(100);
  const violations=await page.evaluate(async()=> (await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa','best-practice']}})).violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)})));
  check(tab+' passes automated accessibility checks: '+JSON.stringify(violations),violations.length===0);
  await page.screenshot({path:path.join(out,'sheet-'+tab+'.png'),fullPage:true});
 }
 for(const width of [320,390]){
  await page.setViewportSize({width,height:844});
  for(const tab of ['builder','skills','combat','spells','inventory','feats','story','notes','companion','rules']){await page.evaluate(tab=>selectSheetTab(tab),tab);check(tab+' fits '+width+' px',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
 }
 await page.setViewportSize({width:1440,height:1000});
 await page.evaluate(()=>selectSheetTab('overview'));await wait(100);
 const overview=page.locator('#sheet-overview');const before=await overview.screenshot();fs.writeFileSync(out+'/overview-with-ui.png',before);const beforeStyles=await overview.evaluate(node=>[node,...node.querySelectorAll('*')].map(e=>({id:e.id,tag:e.tagName,cls:e.className,w:e.getBoundingClientRect().width,h:e.getBoundingClientRect().height,color:getComputedStyle(e).color,font:getComputedStyle(e).fontSize,padding:getComputedStyle(e).padding})));
 await page.evaluate(()=>document.querySelector('style[data-audit-file="css/site-ui.css"]').disabled=true);
 const after=await overview.screenshot();fs.writeFileSync(out+'/overview-without-ui.png',after);const afterStyles=await overview.evaluate(node=>[node,...node.querySelectorAll('*')].map(e=>({id:e.id,tag:e.tagName,cls:e.className,w:e.getBoundingClientRect().width,h:e.getBoundingClientRect().height,color:getComputedStyle(e).color,font:getComputedStyle(e).fontSize,padding:getComputedStyle(e).padding})));check('Shared cleanup leaves Overview dimensions, typography and colors unchanged',JSON.stringify(beforeStyles)===JSON.stringify(afterStyles));
 await page.evaluate(()=>document.querySelector('style[data-audit-file="css/site-ui.css"]').disabled=false);
 const sheetName=await page.evaluate(()=>sheetSession.identity.name);
 for(const section of ['overview','builder','skills','combat','spells','inventory','feats','story','notes','companion','rules']){
  await page.evaluate(section=>prepareSheetPrint(new Set([section])),section);await page.emulateMedia({media:'print'});
  const pdf=await page.pdf({path:path.join(out,'print-'+section+'.pdf'),format:'A4',printBackground:true,preferCSSPageSize:true});
  check(section+' exports readable print content',pdf.length>1000&&pdfText(path.join(out,'print-'+section+'.pdf')).includes(sheetName));
  if(section==='overview')check('Overview print remains one page',(pdf.toString('latin1').match(/\/Type \/Page(?!s)/g)||[]).length===1);
  await page.emulateMedia({media:'screen'});await page.evaluate(()=>dispatchEvent(new Event('afterprint')));
 }
 await page.evaluate(()=>{sheetSession.data.adobe.journal=[{id:'print-long',title:'Long session',category:'Sessions',text:'The party followed the river and spoke to the merchant. '.repeat(220)+'END_OF_LONG_NOTE'}];renderCharacterJournal();prepareSheetPrint(new Set(['notes']))});
 await page.emulateMedia({media:'print'});const longNotes=await page.pdf({path:path.join(out,'print-notes-long.pdf'),format:'A4',printBackground:true,preferCSSPageSize:true});
 check('Long notes paginate without truncating their final text',(longNotes.toString('latin1').match(/\/Type \/Page(?!s)/g)||[]).length>1&&pdfText(path.join(out,'print-notes-long.pdf')).includes('END_OF_LONG_NOTE'));
 await page.emulateMedia({media:'screen'});await page.evaluate(()=>dispatchEvent(new Event('afterprint')));
 await page.evaluate(()=>{closeCharacterSheet(true);CampaignWorkspace.clear(true);currentUser=null;auth.currentUser=null;renderPublicLanding();document.getElementById('loginControls').style.display='flex';});
 await page.locator('#emailInput').fill('invalid');const resetBefore=await page.evaluate(()=>testWrites.length);await page.locator('#resetPasswordButton').click();
 check('Password recovery validates email without a request',await page.evaluate(()=>testWrites.length)===resetBefore);
 await page.locator('#emailInput').fill('player@example.test');await page.locator('#resetPasswordButton').click();await page.waitForFunction(()=>document.getElementById('authStatus').textContent.includes('reset instructions'));
 check('Password recovery makes one mocked request with accessible feedback',await page.evaluate(()=>testWrites.filter(write=>write.auth==='password-reset').length)===1&&await page.locator('#authStatus').getAttribute('role')==='status');
 check('Recovery action is enabled again after completion',await page.locator('#resetPasswordButton').isEnabled());
 const boot=await browser.newPage();await boot.route('https://fixture.example.test/**',route=>route.fulfill({contentType:'text/html',body:html}));await boot.goto('https://fixture.example.test/',{waitUntil:'domcontentloaded'});await boot.addScriptTag({path:root+'/js/boot-status.js'});
 check('Startup has an independent introduction and loading status',await boot.locator('#siteBootPanel').isVisible()&&(await boot.locator('#siteBootStatus').textContent()).includes('Loading'));
 await boot.evaluate(()=>{document.getElementById('siteAppScript')?.remove();const script=document.createElement('script');script.id='siteAppScript';document.body.append(script);script.dispatchEvent(new Event('error'))});
 check('SDK/module failure offers visible retry feedback',await boot.locator('#siteBootRetry').isVisible()&&(await boot.locator('#siteBootStatus').textContent()).includes('could not finish'));
 await boot.evaluate(()=>document.dispatchEvent(new Event('campaignatlas:ready')));check('Completed startup removes the loading panel',await boot.locator('#siteBootPanel').count()===0);await boot.close();
 check('No unexpected browser runtime errors',errors.length===0);
 console.log('SUCCESS',passed,'UI browser checks');
 }finally{await browser.close()}})().catch(error=>{console.error(error);process.exitCode=1});
