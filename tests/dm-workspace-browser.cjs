const {openEditorOptions}=require('./app-navigation-fixture.cjs');
// DM preparation flows against a deterministic Firebase fixture; never production.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const root=path.resolve(__dirname,'..');

(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
  page.setDefaultTimeout(10000);
  page.on('pageerror',error=>errors.push(error.message));
  const html=fs.readFileSync(path.join(root,'index.html'),'utf8')
   .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'')
   .replace(/<link\b[^>]*href="([^"]*)"[^>]*>/gi,(tag,href)=>href.startsWith('css/')?'<style>'+fs.readFileSync(path.join(root,href.split('?')[0]),'utf8')+'</style>':'');
  await page.route('https://fixture.example.test/**',route=>route.fulfill({contentType:'text/html',body:html}));
  await page.goto('https://fixture.example.test/');
  await page.evaluate(catalog=>{
   window.__testCatalog=catalog;window.fetch=async()=>({ok:true,json:async()=>window.__testCatalog});
   window.print=()=>{};window.alert=()=>{};window.confirm=()=>true;
  },JSON.parse(fs.readFileSync(path.join(root,'data/rules/catalog.json'),'utf8')));
  for(const file of ['dom-setup.js','dom-fixture.js'])await page.addScriptTag({path:path.join(__dirname,file)});
  await page.evaluate(()=>{
   const sdk=window.__DND_VAULT_DEPS__,transaction=sdk.runTransaction;
   window.workspaceTransactions=0;
   sdk.where=(field,op,value)=>({field,op,value});sdk.query=(path,...filters)=>({path,filters});
   sdk.getDocs=async query=>{
    const collectionPath=typeof query==='string'?query:query.path,filters=query.filters||[];
    const rows=Object.entries(testSheetDocs)
     .filter(([key,data])=>key.startsWith(collectionPath+'/')&&!key.slice(collectionPath.length+1).includes('/')&&filters.every(filter=>{
      const value=filter.field.split('.').reduce((data,key)=>data?.[key],data);
      return filter.op==='array-contains'?value?.includes(filter.value):value===filter.value;
     })).map(([key,data])=>({id:key.split('/').at(-1),value:structuredClone(data)}));
    if(window.workspaceDelayList===collectionPath){
     window.workspaceDelayList=null;
     window.workspaceDelayedList=new Promise(resolve=>window.finishWorkspaceList=resolve);
     await window.workspaceDelayedList;
    }
    return {docs:rows.map(row=>({id:row.id,data:()=>structuredClone(row.value)}))};
   };
   sdk.getDoc=async recordPath=>{
    const value=structuredClone(testSheetDocs[recordPath]);
    if(window.workspaceDelayRecord===recordPath){
     window.workspaceDelayRecord=null;
     window.workspaceDelayedRecord=new Promise(resolve=>window.finishWorkspaceRecord=resolve);
     await window.workspaceDelayedRecord;
    }
    return {exists:()=>value!==undefined,data:()=>structuredClone(value)};
   };
   sdk.runTransaction=async(db,work)=>{window.workspaceTransactions++;return transaction(db,work)};
   sdk.ref=(_,recordPath)=>recordPath;sdk.getBlob=async()=>new Blob();sdk.uploadBytes=async()=>{};
  });
  await page.addScriptTag({content:'function createCampaignStore(){return window.__DND_VAULT_DEPS__.vaultCall}'});
  const modules=JSON.parse(fs.readFileSync(path.join(__dirname,'dom.cjs'),'utf8').match(/for\(const name of (\[[^\n]+?\])\)await run/)[1].replaceAll("'",'"'));
  for(const name of modules)await page.addScriptTag({path:path.join(root,'js/modules',name+'.js')});
  if(!modules.includes('dm-workspace-shell'))await page.addScriptTag({path:path.join(root,'js/modules/dm-workspace-shell.js')});
  await page.evaluate(()=>CharacterCatalog.set(window.__testCatalog));
  await page.addScriptTag({path:path.join(__dirname,'dom-state.js')});
  await page.evaluate(()=>{
   seed('dm');
   const collections={world:'worldEntries',creature:'creatures',chapter:'chapters'};
   const put=(campaignId,kind,id,input,updatedAt)=>{
    const {privateNotes='',...fields}=input;
    testSheetDocs['campaigns/'+campaignId+'/'+collections[kind]+'/'+id]={
     kind,schemaVersion:1,revision:1,createdBy:'dm',updatedBy:'dm',createdAt:1,updatedAt,
     summary:'',content:'',data:{},archived:false,...fields
    };
    testSheetDocs['campaigns/'+campaignId+'/workspaceSecrets/'+kind+'-'+id]={kind,recordId:id,notes:privateNotes};
   };
   put('a','world','harbor',{
    title:'Harbor <b data-reference-html>location</b>',summary:'A sheltered port',
    content:'Location description <b data-reference-html>plain text</b>',
    privateNotes:'LOCATION_SECRET <b data-reference-html>sealed orders</b>',data:{category:'Location',links:[]}
   },800);
   put('a','creature','captain',{
    title:'Captain <b data-reference-html>NPC</b>',summary:'A helpful guide',
    content:'NPC description <b data-reference-html>plain text</b>',
    privateNotes:'NPC_SECRET <b data-reference-html>hidden patron</b>',
    data:CampaignCreatures.normalize({category:'Story NPC',combatEnabled:false,appearance:'Blue coat',goals:'Find the heir',links:[{kind:'chapter',id:'active-chapter'}]})
   },850);
   put('a','chapter','active-chapter',{
    title:'The current expedition',summary:'Saved chapter summary',content:'Saved chapter introduction',
    privateNotes:'CHAPTER_SECRET saved preparation',
    data:{order:2,status:'Current',startingLevel:7,targetLevel:0,playerRecap:'Saved player recap',objectives:'Saved objective',links:[{kind:'world',id:'harbor'}]}
   },900);
   put('a','chapter','next-chapter',{title:'The next planned journey',data:{order:1,status:'Planned',links:[]}},700);
   put('a','chapter','completed-chapter',{title:'A completed expedition',data:{order:0,status:'Completed',links:[]}},100);
   put('a','chapter','archived-chapter',{title:'Archived preparation must stay out',archived:true,data:{order:0,status:'Current',links:[]}},9999);
   put('b','chapter','other-chapter',{title:'Another campaign current chapter',data:{order:1,status:'Current',links:[]}},1000);
   document.getElementById('siteBootPanel')?.remove();
   document.getElementById('loginControls').style.display='none';
   document.getElementById('userDisplay').textContent='Campaign DM';
   document.getElementById('activeCampaignName').textContent=activeCampaign.name;
   showTab('dm');
  });
  const persisted=()=>page.evaluate(()=>({docs:JSON.stringify(testSheetDocs),transactions:workspaceTransactions,writes:testWrites.length,calls:callLog.length}));
  const baseline=await persisted();
  const sidebar=page.locator('#dmWorkspaceSidebar');
  assert.equal(await page.locator('#dmWorkspaceShell > #dmWorkspaceSidebar').count(),1);
  assert.equal(await page.locator('#dmWorkspaceShell > #dmWorkspaceBody').count(),1);
  assert.deepEqual(await sidebar.locator('[data-dm-workspace-tab]').evaluateAll(nodes=>nodes.map(node=>node.dataset.dmWorkspaceTab)),['dm','dm-world','dm-map','dm-creatures','dm-chapters','dm-party']);
  assert.equal(await page.locator('#dmToolsPanel [data-dm-party-card],#dmToolsPanel [data-dm-settings-card]').count(),0,'Overview must contain preparation, with management cards in their own sections');
  assert.equal(await page.locator('#dmPartyPanel [data-dm-party-card]').count(),3,'Item Controls, Characters & Items, and rarity guidance belong to Party & Loot');
  assert.equal(await page.locator('#dmPartyPanel #dmOpenLibrary,#dmPartyPanel #dmCharacterList,#dmPartyPanel .loot-ref-panel').count(),3);
  assert.equal(await page.locator('#campaignSettingsPanel #dmSaveCampaignSettings,#campaignSettingsPanel #dmMemberList,#campaignSettingsPanel #dmPendingInvites').count(),3);
  await page.waitForFunction(()=>document.querySelector('[data-dm-next-chapter]')?.textContent.includes('The current expedition'));
  const recent=page.locator('[data-dm-recent-entry]');
  await page.waitForFunction(()=>document.querySelectorAll('[data-dm-recent-entry]').length>=3);
  assert.equal(await recent.first().getAttribute('data-dm-recent-entry'),'chapter:active-chapter','Recent work must begin with the latest saved entry');
  assert.equal(await recent.filter({hasText:'Archived preparation must stay out'}).count(),0);
  assert.equal(await page.locator('[data-dm-recent-work]').count(),1);
  await sidebar.locator('[data-dm-workspace-tab=dm-party]').click();
  assert.equal(await page.locator('#tab-dm-party').isVisible(),true);
  assert.equal(await sidebar.locator('[data-dm-workspace-tab=dm-party]').getAttribute('aria-current'),'page');
  await sidebar.locator('[data-dm-workspace-tab=dm]').click();
  await page.evaluate(()=>{testSheetDocs['campaigns/a/chapters/active-chapter'].data.status='Completed';showTab('dm')});
  await page.waitForFunction(()=>document.querySelector('[data-dm-next-chapter]')?.textContent.includes('The next planned journey'));
  await page.evaluate(()=>{testSheetDocs['campaigns/a/chapters/active-chapter'].data.status='Current';showTab('dm')});
  await page.waitForFunction(()=>document.querySelector('[data-dm-next-chapter]')?.textContent.includes('The current expedition'));
  await page.locator('[data-dm-next-chapter-open]').click();
  await page.waitForFunction(()=>CampaignWorkspace.session?.kind==='chapter'&&CampaignWorkspace.session?.record?.id==='active-chapter');
  assert.equal(await page.evaluate(()=>CampaignWorkspace.session.record.revision),1,'Overview opens the saved chapter rather than a new draft');
  await page.evaluate(()=>showTab('dm'));
  await page.waitForSelector('[data-dm-recent-entry="world:harbor"]');
  await page.locator('[data-dm-recent-entry="world:harbor"]').click();
  await page.waitForFunction(()=>CampaignWorkspace.session?.kind==='world'&&CampaignWorkspace.session?.record?.id==='harbor');
  assert.equal(await page.evaluate(()=>CampaignWorkspace.session.record.revision),1,'Recent work opens the saved entry rather than creating a copy');
  await page.evaluate(()=>showTab('dm'));
  assert.deepEqual(await persisted(),baseline,'Viewing Overview or changing dashboard sections must never create or save records');
  console.log('PASS DM sidebar, card partition, current/planned chapter priority and recent saved work');

  // An old campaign list resolves after the new campaign overview has loaded.
  await page.evaluate(()=>{showTab('dm-party');window.workspaceDelayList='campaigns/a/chapters';showTab('dm')});
  await page.waitForFunction(()=>!!window.finishWorkspaceList);
  await page.evaluate(()=>{
   activeCampaign={id:'b',name:'Other campaign',ownerId:'dm',inventoryVersion:2};
   showTab('dm');
  });
  await page.waitForFunction(()=>document.querySelector('[data-dm-next-chapter]')?.textContent.includes('Another campaign current chapter'));
  await page.evaluate(async()=>{window.finishWorkspaceList();await window.workspaceDelayedList;await new Promise(requestAnimationFrame);await new Promise(requestAnimationFrame)});
  assert.match(await page.locator('[data-dm-next-chapter]').textContent(),/Another campaign current chapter/);
  assert.equal(await page.locator('[data-dm-recent-work]').filter({hasText:'The current expedition'}).count(),0,'Late overview lists cannot leak another campaign\'s private preparation');
  await page.evaluate(()=>{seed('dm');showTab('dm-settings')});
  assert.equal(await page.locator('#dmWorkspaceShell').isVisible(),false);
  assert.equal(await page.locator('#campaignSectionNavigation #dmPlanningTab-world').count(),1,'Settings restores shared route controls');
  await page.evaluate(()=>showTab('dm-one-shots'));
  assert.equal(await page.locator('#dmWorkspaceShell').isVisible(),false);
  assert.equal(await page.locator('#campaignSectionNavigation #dmPlanningTab-chapters').count(),1);
  await page.evaluate(()=>showTab('dm'));
  assert.equal(await page.locator('#dmWorkspaceSidebar #dmPlanningTab-world').count(),1,'Returning to preparation restores the sidebar');
  console.log('PASS Late overview reads are ignored; settings and One Shots retain shared navigation');

  await sidebar.locator('[data-dm-workspace-tab=dm-chapters]').click();
  await page.waitForSelector('[data-open-record=active-chapter]');
  await page.locator('[data-open-record=active-chapter]').click();
  await page.waitForFunction(()=>CampaignWorkspace.session?.record?.id==='active-chapter'&&!!document.querySelector('[data-chapter-reference="creature:captain"]'));
  await page.locator('[name=title]').fill('Unsaved chapter title');
  await page.locator('[name=summary]').fill('Unsaved chapter summary');
  await page.locator('[name=content]').fill('Unsaved chapter introduction');
  await page.locator('[name=privateNotes]').fill('CHAPTER_SECRET unsaved preparation');
  await page.locator('[data-record-field=playerRecap]').fill('Unsaved player recap');
  await page.locator('[data-record-field=objectives]').fill('PRIVATE_OBJECTIVE unsaved objective');
  const draftState=()=>page.evaluate(()=>({kind:CampaignWorkspace.session.kind,id:CampaignWorkspace.session.record.id,revision:CampaignWorkspace.session.record.revision,dirty:CampaignWorkspace.session.dirty,input:CampaignWorkspace.draft()}));
  const originalDraft=await draftState(),beforeReferences=await persisted();
  await page.evaluate(()=>{window.workspaceConfirmations=0;window.confirm=()=>{window.workspaceConfirmations++;return false}});
  await page.locator('[data-chapter-reference="creature:captain"]').click();
  await page.waitForFunction(()=>document.querySelector('[data-chapter-reference-panel]')?.textContent.includes('NPC_SECRET'));
  const reference=page.locator('[data-chapter-reference-panel]');
  assert.match(await reference.textContent(),/NPC description <b data-reference-html>plain text<\/b>/);
  assert.equal(await reference.locator('[data-reference-html]').count(),0,'NPC reference content must remain literal text');
  assert.deepEqual(await draftState(),originalDraft);
  await page.locator('[data-chapter-reference="world:harbor"]').click();
  await page.waitForFunction(()=>document.querySelector('[data-chapter-reference-panel]')?.textContent.includes('LOCATION_SECRET'));
  assert.match(await reference.textContent(),/Location description <b data-reference-html>plain text<\/b>/);
  assert.equal(await reference.locator('[data-reference-html]').count(),0,'Location reference content must remain literal text');
  assert.equal((await reference.textContent()).includes('NPC_SECRET'),false,'Changing references clears the previous private content');
  assert.deepEqual(await draftState(),originalDraft);
  await page.locator('[data-close-chapter-reference]').click();
  assert.equal(await reference.isVisible(),false);
  assert.deepEqual(await draftState(),originalDraft);
  assert.equal(await page.evaluate(()=>workspaceConfirmations),0,'Read-only inline references must not invoke discard confirmation');
  await page.locator('[data-chapter-open="world:harbor"]').click();
  assert.equal(await page.evaluate(()=>workspaceConfirmations),1,'Opening the full linked editor still uses the discard guard');
  assert.deepEqual(await draftState(),originalDraft);
  assert.deepEqual(await persisted(),beforeReferences,'Reading references or refusing editor navigation cannot write preparation');
  assert.equal(await page.locator('[data-publish-chapter]').isDisabled(),true,'References must not make an unsaved chapter publishable');
  console.log('PASS Escaped NPC/location references preserve the active chapter draft and editor navigation guard');

  // Printing snapshots the chapter draft, even while a linked private record is visible.
  await page.locator('[data-chapter-reference="creature:captain"]').click();
  await page.waitForFunction(()=>document.querySelector('[data-chapter-reference-panel]')?.textContent.includes('NPC_SECRET'));
  await openEditorOptions(page);await page.locator('[data-print-record]').click();
  const publicPrint=await page.locator('#workspacePrintSurface').textContent();
  assert.match(publicPrint,/Unsaved player recap/);
  assert.equal(/CHAPTER_SECRET|PRIVATE_OBJECTIVE|NPC_SECRET|LOCATION_SECRET/.test(publicPrint),false);
  await page.evaluate(()=>dispatchEvent(new Event('afterprint')));
  await page.locator('[data-print-private]').check();
  await openEditorOptions(page);await page.locator('[data-print-record]').click();
  const privatePrint=await page.locator('#workspacePrintSurface').textContent();
  assert.match(privatePrint,/Unsaved chapter title/);assert.match(privatePrint,/CHAPTER_SECRET unsaved preparation/);assert.match(privatePrint,/PRIVATE_OBJECTIVE unsaved objective/);
  assert.equal(/NPC_SECRET|LOCATION_SECRET/.test(privatePrint),false,'An inline reference must not replace the chapter print snapshot');
  await page.emulateMedia({media:'print'});
  assert.equal(await page.locator('#mainApp').isVisible(),false,'Private print must hide application navigation');
  await page.emulateMedia({media:'screen'});await page.evaluate(()=>dispatchEvent(new Event('afterprint')));
  assert.deepEqual(await draftState(),originalDraft);
  assert.deepEqual(await persisted(),beforeReferences);
  await page.setViewportSize({width:390,height:844});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'Chapter preparation and references must fit mobile');
  await page.addScriptTag({content:require(process.env.AXE_PATH||'axe-core').source});
  const violations=await page.evaluate(async()=> (await axe.run('#dmWorkspaceShell',{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations.map(row=>row.id));
  assert.deepEqual(violations,[],'DM workspace and inline reference must pass automated accessibility checks');
  await page.screenshot({path:'/tmp/dnd-dm-workspace-reference-mobile.png',fullPage:true});
  await page.setViewportSize({width:1440,height:1000});
  console.log('PASS Public/private chapter print snapshots, mobile layout and reference accessibility');

  // Removing the selected connection invalidates a private load that is still pending.
  await page.locator('[data-close-chapter-reference]').click();
  await page.evaluate(()=>{window.workspaceDelayRecord='campaigns/a/workspaceSecrets/world-harbor';window.finishWorkspaceRecord=null});
  await page.locator('[data-chapter-reference="world:harbor"]').click();
  await page.waitForFunction(()=>!!window.finishWorkspaceRecord);
  assert.equal(await reference.isVisible(),true);
  assert.equal(await page.locator('[data-workspace-links] [data-remove-link]').count(),1,'The selected Location has exactly one outgoing chapter connection');
  await page.locator('[data-workspace-links] [data-remove-link]').click();
  assert.equal(await reference.isVisible(),false,'Removing the selected connection hides its reference immediately');
  const unlinkedDraft=structuredClone(originalDraft);unlinkedDraft.input.data.links=[];
  assert.deepEqual(await draftState(),unlinkedDraft,'Removing a reference connection preserves every other chapter draft value');
  await page.evaluate(async()=>{window.finishWorkspaceRecord();await window.workspaceDelayedRecord;await new Promise(requestAnimationFrame);await new Promise(requestAnimationFrame)});
  assert.equal(await reference.isVisible(),false,'A late private read cannot restore a disconnected reference');
  assert.equal((await reference.textContent()).includes('LOCATION_SECRET'),false);
  assert.deepEqual(await draftState(),unlinkedDraft);
  assert.deepEqual(await persisted(),beforeReferences,'Removing an unsaved connection and resolving its private read cannot write records');
  await page.waitForFunction(()=>!!document.querySelector('[data-link-picker] option[value="world:harbor"]'));
  await page.locator('[data-link-picker]').selectOption('world:harbor');
  await page.locator('[data-add-link]').click();
  await page.waitForSelector('[data-chapter-reference="world:harbor"]');
  assert.deepEqual(await draftState(),originalDraft,'Reconnecting the Location restores only the original link');
  console.log('PASS Removing a selected chapter connection invalidates pending private reference reads');

  // A delayed private reference may finish only after its chapter session was cleared.
  await page.evaluate(()=>{window.workspaceDelayRecord='campaigns/a/workspaceSecrets/world-harbor';window.finishWorkspaceRecord=null});
  await page.locator('[data-chapter-reference="world:harbor"]').click();
  await page.waitForFunction(()=>!!window.finishWorkspaceRecord);
  await page.evaluate(()=>{CampaignWorkspace.clear(true);seed('player');showTab('campaign-home')});
  await page.evaluate(async()=>{window.finishWorkspaceRecord();await window.workspaceDelayedRecord;await new Promise(requestAnimationFrame);await new Promise(requestAnimationFrame)});
  assert.equal(await page.locator('[data-chapter-reference-panel]').count(),0,'Late private reference cannot resurrect a cleared editor');
  assert.equal((await page.locator('#mainApp').textContent()).includes('LOCATION_SECRET'),false,'Late private reference cannot appear for another account');
  assert.equal(await page.locator('#dmWorkspaceShell').isVisible(),false);
  assert.deepEqual(await persisted(),beforeReferences,'Pending private reads cannot create or change records');
  assert.deepEqual(errors,[],'No unexpected browser errors');
  console.log('PASS Late private reference reads are discarded after account/session changes');
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
