'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const out='/tmp/campaignatlas-ui-checks/palette-review';fs.mkdirSync(out,{recursive:true});
// QA palettes only. No account preference or theme picker is enabled by this test.
const palettes={
 classic:{},
 forest:{'primary':'#1d5b44','primary-hover':'#143f30','heading':'#164735','accent':'#d8bd75','accent-deep':'#997329','accent-ink':'#6f5014','canvas':'#e8efe7','canvas-end':'#d3dfd1','header':'#122b22','header-end':'#1b3e30','on-primary':'#f5faed','paper':'#fbfdf9','paper-soft':'#eef3e9','parchment':'#dfe8d7','ink':'#21372a','muted':'#4e6254','border':'#667f6c','border-soft':'#b6c9b4','focus':'#216449'},
 ocean:{'primary':'#195782','primary-hover':'#173a5b','heading':'#183e61','accent':'#9ed6e5','accent-deep':'#47839a','accent-ink':'#20516b','canvas':'#e6f1f7','canvas-end':'#caddea','header':'#102b40','header-end':'#193e57','on-primary':'#f3faff','paper':'#f8fcff','paper-soft':'#eaf2f8','parchment':'#d8e7f1','ink':'#233442','muted':'#526777','border':'#657f94','border-soft':'#b3c6d7','focus':'#1b6085'}
};

(async()=>{const browser=await chromium.launch({headless:true});try{
 const {page,errors}=await require('./adobe-browser-fixture.cjs')(browser,{adobeOnly:true,beforeModules:async page=>page.evaluate(()=>{window.paletteAuthRequests=[];for(const [method,kind]of [['signInWithEmailAndPassword','sign-in'],['createUserWithEmailAndPassword','register']])__DND_VAULT_DEPS__[method]=async(_auth,email)=>{paletteAuthRequests.push({kind,email});throw Error('Test credentials were rejected.');};})});
 page.setDefaultTimeout(15000);
 await page.addScriptTag({path:require.resolve(process.env.AXE_PATH||'axe-core/axe.min.js')});
 const report={cases:[],paperTargetSize:[],copy:[],palettes,limits:['Authentication and data use isolated Firebase fixtures; no live account, invitation or email is created.','Fit-width PDF paper targets are measured separately; passing dialog/chrome checks is not a WCAG 2.2 claim for every paper field.']};
 const host=page.locator('#sheetAdobeView'),front=()=>host.locator('[data-continuous-page="page-1"]'),field=id=>front().locator('[data-pdf-field="'+id+'"]').first();
 const signature=()=>page.evaluate(()=>JSON.stringify({sheet:sheetSession?.data,identity:sheetSession?.identity,inventory,items}));
 async function inspect(name,selector='body'){
  const result=await page.evaluate(async selector=>{
   const root=document.querySelector(selector),paper=[...document.getElementById('sheetAdobeView')?.shadowRoot?.querySelectorAll('.paper')||[]];
   const normal=(await axe.run(root,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations;
   const targets=(await axe.run({include:[root],exclude:paper},{runOnly:{type:'rule',values:['target-size']}})).violations;
   return {overflow:document.documentElement.scrollWidth>innerWidth+1,violations:[...normal,...targets].map(v=>({id:v.id,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}))};
  },selector);
  report.cases.push({name,width:page.viewportSize().width,...result});
  fs.writeFileSync(path.join(out,'review.json'),JSON.stringify(report,null,2));
  if(result.overflow||result.violations.length)await page.screenshot({path:path.join(out,name+'-failure.png'),fullPage:false});
  assert.equal(result.overflow,false,name+' page width');assert.deepEqual(result.violations,[],name+' accessibility');
  report.copy.push({name,text:await page.locator(selector).innerText()});
  await page.screenshot({path:path.join(out,name+'.png'),fullPage:false});
  console.log('PASS',name);
 }
 async function theme(name){await page.evaluate(palette=>{const s=document.documentElement.style;for(const p of [...s])if(p.startsWith('--theme-'))s.removeProperty(p);for(const [key,value]of Object.entries(palette))s.setProperty('--theme-'+key,value);},palettes[name]);}
 async function contrast(){
  const result=await page.evaluate(()=>{
   const style=getComputedStyle(document.documentElement),canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');canvas.width=canvas.height=1;
   const rgb=name=>{ctx.clearRect(0,0,1,1);ctx.fillStyle=style.getPropertyValue('--theme-'+name).trim();ctx.fillRect(0,0,1,1);return [...ctx.getImageData(0,0,1,1).data].slice(0,3);};
   const luminance=rgb=>rgb.map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
   return [['on-primary','primary',4.5],['heading','paper',4.5],['ink','paper',4.5],['muted','paper',4.5],['accent-ink','paper',4.5],['accent','header',4.5],['focus','paper',3]].map(([a,b,min])=>{const values=[luminance(rgb(a)),luminance(rgb(b))].sort((a,b)=>b-a);return {pair:a+'/'+b,ratio:(values[0]+.05)/(values[1]+.05),min};});
  });for(const row of result)assert.ok(row.ratio>=row.min,row.pair+' contrast '+row.ratio);return result;
 }
 async function visit(id){
  const index=await host.locator('[data-stack-page]').evaluateAll((nodes,id)=>nodes.findIndex(n=>JSON.parse(n.dataset.stackPage)[0]===id),id);
  assert.ok(index>=0,'Page shortcut exists: '+id);await host.locator('[data-stack-page]').nth(index).click();
  await host.locator('[data-continuous-page="'+id+'"] .paper').first().waitFor({state:'visible'});
 }
 async function pick(id,text,preferred){
  const control=field(id),value=await control.locator('option').evaluateAll((nodes,{text,preferred})=>nodes.find(n=>n.value===preferred)?.value||nodes.find(n=>n.value&&n.textContent.toLowerCase().includes(text.toLowerCase()))?.value,{text,preferred});
  assert.ok(value,id+' choice: '+text);await control.click();const dialog=page.locator('#adobeChoiceDialog');await dialog.locator('[data-choice-search]').fill(text);await dialog.locator('[data-choice-value='+JSON.stringify(value)+']').click();
 }
 async function save(){await page.locator('#sheetSave').click();await page.waitForFunction(()=>sheetSession&&!sheetSession.saving&&!sheetSession.dirty);}

 // Exercise actual public form validation without contacting an auth provider.
 await page.evaluate(async()=>{auth.currentUser=null;await testAuthCallback(null)});
 await page.locator('#resetPasswordButton').click();assert.match(await page.locator('#authStatus').innerText(),/Enter your email address/);await page.locator('#emailInput').fill('audit@example.test');
 await page.locator('#passwordInput').press('Enter');assert.match(await page.locator('#authStatus').innerText(),/Enter your password/);assert.equal(await page.evaluate(()=>paletteAuthRequests.length),0);
 await page.locator('#registerButton').click();assert.equal(await page.evaluate(()=>paletteAuthRequests.length),0,'Invalid registration does not contact the provider');
 await inspect('sign-in-validation');
 await page.locator('#passwordInput').fill('Synthetic-test-password');await page.locator('#passwordInput').press('Enter');await page.waitForFunction(()=>paletteAuthRequests.length===1);
 await page.locator('#emailLoginButton').click();await page.waitForFunction(()=>paletteAuthRequests.length===2);await page.locator('#registerButton').click();await page.waitForFunction(()=>paletteAuthRequests.length===3);
 assert.deepEqual(await page.evaluate(()=>paletteAuthRequests),[{kind:'sign-in',email:'audit@example.test'},{kind:'sign-in',email:'audit@example.test'},{kind:'register',email:'audit@example.test'}]);
 await page.locator('#passwordInput').fill('');await page.locator('#emailInput').fill('not-an-email');await page.locator('#emailLoginButton').click();assert.match(await page.locator('#authStatus').innerText(),/valid email address/);assert.equal(await page.evaluate(()=>paletteAuthRequests.length),3);
 await page.locator('#emailInput').fill('audit@example.test');await page.evaluate(()=>document.getElementById('authStatus').textContent='');
 for(const width of [1440,1024,768,390,320]){await page.setViewportSize({width,height:900});await inspect('sign-in-'+width);if(width<650){assert.ok(await page.locator('#emailInput').evaluate(n=>n.getBoundingClientRect().height>=44));assert.equal(await page.locator('#emailInput').evaluate(n=>getComputedStyle(n).fontSize),'16px');}}
 await page.setViewportSize({width:1440,height:1000});
 await page.evaluate(()=>{auditSeed('player');showTab('player')});

 const saved=[];
 for(const edition of ['2014','2024']){
  if(saved.length){await page.evaluate(()=>{closeCharacterSheet(true);showTab('player')});}
  // Start with the same Create character button the player uses, not a seeded sheet.
  await page.locator('#playerCreateCharBtn').click();await page.waitForFunction(()=>sheetSession?.characterId.startsWith('created-'));await page.evaluate(()=>CharacterAdobeView.ready());
  if(await page.locator('#adobeSharedEditor[open]').count())await page.locator('[data-adobe-editor-close]').click();
  const id=await page.evaluate(()=>sheetSession.characterId),name=edition==='2014'?'Iria Stormvale':'Torren Oakshield';
  await field('PC Name').fill(name);await field('PC Name').press('Tab');await field('Player Name').fill('UI review — Ægir');await field('Player Name').press('Tab');
  await field('Rules Version').click();let dialog=page.locator('#adobeClassDialog');await dialog.locator('[data-native-edition='+JSON.stringify(edition)+']').click();await dialog.locator('[data-native-apply]').click();
  await field('Character Level').click();const classId=edition==='2014'?'sorcerer':'fighter';
  await dialog.locator('[data-native-class="0"]').selectOption(classId);await dialog.locator('[data-native-level="0"]').fill('4');await dialog.locator('[data-native-level="0"]').press('Tab');
  const sub=await dialog.locator('[data-native-subclass="0"] option').evaluateAll((nodes,edition)=>nodes.find(n=>n.value&&new RegExp(edition==='2014'?'Draconic':'Battle Master','i').test(n.textContent))?.value,edition);
  assert.ok(sub);await dialog.locator('[data-native-subclass="0"]').selectOption(sub);
  if(edition==='2014'){await dialog.locator('[data-native-step="choices"]').click();await dialog.locator('[data-native-group="metamagic"][data-native-slot="0"]').selectOption('quickened-spell');await dialog.locator('[data-native-group="metamagic"][data-native-slot="1"]').selectOption('empowered-spell');}
  for(const step of ['choices','training']){await dialog.locator('[data-native-step='+JSON.stringify(step)+']').click();for(const attr of ['data-native-group','data-native-class-skill','data-native-weapon']){const count=await dialog.locator('select['+attr+']').count();for(let index=0;index<count;index++){const control=dialog.locator('select['+attr+']').nth(index);if(await control.inputValue())continue;const option=await control.locator('option').evaluateAll((nodes,prefer)=>nodes.find(n=>n.value&&!n.disabled&&prefer&&n.textContent.includes(prefer))?.value||nodes.find(n=>n.value&&!n.disabled)?.value,attr==='data-native-weapon'&&index===0?'Longsword':'');if(option)await control.selectOption(option);}}}
  await dialog.locator('[data-native-step="classes"]').count().then(async count=>{if(count)await dialog.locator('[data-native-step="classes"]').click()});
  await inspect('class-'+edition,'#adobeClassDialog');await dialog.locator('[data-native-apply]').click();assert.equal(await field('Character Level').inputValue(),'4');
  await pick('Race','Human',edition==='2014'?'human':'human-2024');await pick('Background',edition==='2014'?'Acolyte':'Soldier');
  await field('Cha').click();dialog=page.locator('#adobeAbilityDialog');await dialog.locator('[data-ability-method]').selectOption('manual');
  const scores=edition==='2014'?{str:8,dex:14,con:14,int:12,wis:10,cha:16}:{str:16,dex:14,con:14,int:10,wis:12,cha:8};
  for(const [ability,score]of Object.entries(scores))await dialog.locator('[data-ability-path="abilities.'+ability+'"]').fill(String(score));
  if(edition==='2024'){
   assert.equal(await dialog.locator('[data-ability-apply]').isDisabled(),true,'The new character must choose its Soldier background increases');
   await dialog.locator('[data-ability-origin="0"]').selectOption('str');await dialog.locator('[data-ability-origin="1"]').selectOption('con');
  }
  await inspect('abilities-'+edition,'#adobeAbilityDialog');await dialog.locator('[data-ability-apply]').click();
  assert.equal(await field('Str').inputValue(),edition==='2014'?'9':'18','Starting increases apply once before feat choices');
  await visit('page-3');await host.locator('[data-continuous-page="page-3"] [data-pdf-field="Feat Name 1"]').dblclick();dialog=page.locator('#adobeFeatDialog');
  if(edition==='2024')await dialog.locator('[data-native-feat-origin="humanOriginFeat"]').selectOption('Alert');
  for(const featName of edition==='2014'?['Tough']:['Ability Score Improvement','Defense']){
   const featId=await page.evaluate(({edition,featName})=>CharacterCatalog.data.feats.find(row=>row.edition===edition&&row.name===featName)?.id,{edition,featName});assert.ok(featId);
   await dialog.locator('[data-native-feat-search]').fill(featName);await dialog.locator('[data-native-feat-add='+JSON.stringify(featId)+']').click();
   if(featName==='Ability Score Improvement')await dialog.locator('[data-native-feat-key='+JSON.stringify(featId)+'] [data-feat-choice="ability0"]').selectOption('str');
  }
  await inspect('feats-'+edition,'#adobeFeatDialog');await dialog.locator('[data-native-feat-apply]').click();await visit('page-1');
  await field('Attack.1.Weapon Selection').fill(edition==='2014'?'Dagger':'Longsword');await field('Attack.1.Weapon Selection').press('Tab');
  if(edition==='2024'){await field('AC Armor Description').fill('Chain Mail');await field('AC Armor Description').press('Tab');assert.equal(await field('AC').inputValue(),'17');}
  await field('HP Current').fill(edition==='2014'?'22':'30');await field('HP Current').press('Tab');
  if(edition==='2014'){
   await page.evaluate(()=>CharacterAdobeView.openEditor('spells'));dialog=page.locator('#adobeSpellDialog');
   for(const spell of ['Fire Bolt','Light','Mage Hand','Minor Illusion','Prestidigitation','Magic Missile','Shield','Sleep','Misty Step','Scorching Ray']){await dialog.locator('[data-spell-search]').fill(spell);await dialog.locator('[data-spell-add]').first().click();}
   await inspect('spell-picker-2014','#adobeSpellDialog');await dialog.locator('[data-spell-apply]').click();
  }
  await visit('page-2');const story=host.locator('[data-continuous-page="page-2"] [data-pdf-field="Personality Trait"]');
  await story.fill('I record every promise. Ægir’s map is folded inside my backpack.');await story.press('Tab');
  await save();saved.push({id,name,edition});await page.evaluate(async id=>{closeCharacterSheet(true);await openCharacterSheet(id);await CharacterAdobeView.ready()},id);
  assert.equal(await field('PC Name').inputValue(),name);assert.equal(await field('Character Level').inputValue(),'4');assert.match(await field('Rules Version').getAttribute('aria-label'),new RegExp(edition));
  assert.match(await page.evaluate(()=>sheetSession.data.personality),/Ægir/);
  if(edition==='2014')assert.equal(await page.evaluate(()=>sheetSession.data.spells.length),10);
  await inspect('filled-character-'+edition);
 }

 // Palette changes must leave saved mechanics and inventory byte-for-byte intact.
 const kept=await signature();report.contrast={};
 async function semanticColours(){return page.evaluate(()=>{const rarity=document.createElement('span'),error=document.createElement('span');rarity.className='meta-tag legendary';error.style.color='var(--ui-danger)';document.body.append(rarity,error);const colours=[getComputedStyle(rarity).color,getComputedStyle(error).color];rarity.remove();error.remove();return colours;});}
 const semanticBefore=await semanticColours();report.semanticColours=semanticBefore;
 for(const name of Object.keys(palettes)){
  const dirtyBefore=await page.evaluate(()=>sheetSession.dirty);await theme(name);assert.equal(await page.evaluate(()=>sheetSession.dirty),dirtyBefore,'Colour changes do not dirty the character sheet');report.contrast[name]=await contrast();assert.deepEqual(await semanticColours(),semanticBefore,'Brand palettes preserve rarity and danger colours');await page.setViewportSize({width:1440,height:1000});await inspect(name+'-character-desktop');
  const expected=await page.evaluate(()=>{const n=document.createElement('span');n.style.color='var(--theme-heading)';document.body.append(n);const c=getComputedStyle(n).color;n.remove();return c;});
  assert.equal(await host.locator('.adobe-continuous-heading').first().evaluate(n=>getComputedStyle(n).color),expected,'Shadow sheet heading inherits '+name);
  await field('Character Level').click();assert.equal(await page.locator('#adobeClassDialog h2').evaluate(n=>getComputedStyle(n).color),expected,'Body dialog inherits '+name);
  for(const width of [1440,1024,768,390,320]){await page.setViewportSize({width,height:900});await inspect(name+'-class-'+width,'#adobeClassDialog');}
  await page.locator('#adobeClassDialog [data-native-cancel]').last().click();
  await page.setViewportSize({width:390,height:844});await inspect(name+'-character-mobile');
  assert.equal(await host.locator('.adobe-mobile-sheet-help').isVisible(),true);
  if(name==='classic'){const before=await field('Player Name').evaluate(n=>n.getBoundingClientRect().height);await front().locator('[data-paper-zoom]').click();await inspect('mobile-zoom-menu','#adobePaperZoomMenu');await page.locator('#adobePaperZoomMenu [data-flyout-id="2"]').click();const enlarged=await field('Player Name').evaluate(n=>n.getBoundingClientRect().height);assert.ok(enlarged>=24&&enlarged>before*2,'200% zoom enlarges ordinary text-field targets');await field('Player Name').focus();await field('Player Name').press('Tab');report.mobileZoom={fitHeight:before,zoomedHeight:enlarged};await page.screenshot({path:path.join(out,'mobile-200-percent.png')});await front().locator('[data-paper-zoom]').click();await page.locator('#adobePaperZoomMenu [data-flyout-id="fit"]').click();}
  assert.equal(await signature(),kept,'Changing '+name+' does not change character data');
  await page.evaluate(async id=>{closeCharacterSheet(true);await openCharacterSheet(id);await CharacterAdobeView.ready();CharacterAdobeSpellListUI.open('sorcerer')},saved[0].id);
  await inspect(name+'-spell-list','#adobeSpellListDialog');await page.locator('[data-spell-list-done]').click();
  await page.evaluate(async id=>{closeCharacterSheet(true);await openCharacterSheet(id);await CharacterAdobeView.ready()},saved[1].id);
  assert.equal(await signature(),kept,'Palette preview and spell reference preserve both characters');
 }
 // Record the known fit-width source-paper limitation rather than suppressing it
 // from the report or claiming that all PDF hit targets meet WCAG 2.2.
 report.paperTargetSize=await page.evaluate(async()=>{const result=await axe.run(document.body,{runOnly:{type:'rule',values:['target-size']}});return result.violations.map(v=>({id:v.id,count:v.nodes.length,examples:v.nodes.slice(0,3).map(n=>n.target)}));});
 await page.setViewportSize({width:1440,height:1000});await field('PC Name').scrollIntoViewIfNeeded();
 await page.evaluate(()=>{window.palettePrints=0;window.print=()=>palettePrints++;});await front().locator('[data-paper-print]').click();await page.waitForFunction(()=>palettePrints===1,null,{timeout:45000});
 const pdf=path.join(out,'ocean-filled-character.pdf');await page.pdf({path:pdf,preferCSSPageSize:true,printBackground:true});
 const text=execFileSync('pdftotext',[pdf,'-'],{encoding:'utf8'});assert.match(text,/Torren Oakshield/);assert.match(text,/record every promise/);assert.match(text,/Ægir/);assert.doesNotMatch(text,/(?:swipe|scroll) sideways|Apply to sheet/);
 await page.emulateMedia({media:'print'});assert.equal(await page.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--theme-paper').trim()),'#fff');assert.equal(await front().locator('[data-pdf-field="PC Name"]').evaluate(n=>getComputedStyle(n).color),'rgb(17, 17, 17)');await page.emulateMedia({media:'screen'});
 await page.evaluate(()=>closeCharacterSheet(true));
 for(const name of Object.keys(palettes)){
  await theme(name);
  for(const [role,tab]of [['player','library'],['dm','dm'],['dm','dm-world'],['admin','admin']]){
   await page.evaluate(({role,tab})=>{auditSeed(role);showTab(tab)}, {role,tab});await page.waitForFunction(()=>!document.querySelector('#mainApp [aria-busy=true]'));
   await page.setViewportSize({width:390,height:844});await inspect(name+'-'+tab);
  }
  await page.evaluate(async()=>{await AccountNotifications.start(auth.currentUser);AccountNotifications.open()});await inspect(name+'-notifications','#accountNotificationsPanel');await page.keyboard.press('Escape');
  await page.evaluate(async()=>{auth.currentUser=null;await testAuthCallback(null)});await inspect(name+'-sign-in');
 }
 // Public legal/404 pages load their own token dependency too.
 for(const route of ['rules-attribution.html','404.html']){
  await page.goto('https://fixture.example.test/'+route);await page.addScriptTag({path:require.resolve(process.env.AXE_PATH||'axe-core/axe.min.js')});await inspect(route.replace('.html','')+'-mobile');
 }
 // Hosting serves the same 404 HTML for deeply nested missing paths. Relative
 // styles/home links would otherwise point farther into the missing directory.
 await page.route('https://fixture.example.test/missing/nested/page',route=>route.fulfill({status:404,contentType:'text/html',body:fs.readFileSync(path.join(__dirname,'../404.html'),'utf8')}));
 await page.goto('https://fixture.example.test/missing/nested/page');await page.addScriptTag({path:require.resolve(process.env.AXE_PATH||'axe-core/axe.min.js')});
 assert.notEqual(await page.locator('body').evaluate(n=>getComputedStyle(n).backgroundImage),'none','Nested 404 styles load');
 assert.equal(await page.getByRole('link',{name:'Return to CampaignAtlas',exact:true}).getAttribute('href'),'/');
 await inspect('404-nested-mobile');await page.getByRole('link',{name:'Return to CampaignAtlas',exact:true}).click();await page.waitForURL('https://fixture.example.test/',{waitUntil:'domcontentloaded'});
 assert.deepEqual(errors,[]);report.characters=saved;report.runtimeErrors=errors;
 fs.writeFileSync(path.join(out,'review.json'),JSON.stringify(report,null,2));
 console.log('PASS '+report.cases.length+' UI states, newly created 2014/2024 level-4 characters, spell selection, gear, private save/reopen, three palettes, contrast and actual PDF');
}finally{await browser.close()}})().catch(error=>{console.error(error);process.exitCode=1});
