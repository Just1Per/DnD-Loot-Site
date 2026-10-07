const fs=require('fs'),vm=require('vm'),path=require('path'),{webcrypto}=require('node:crypto');
const {parseHTML}=require('linkedom');
const {window}=parseHTML(fs.readFileSync(path.join(__dirname,'../index.html'),'utf8'));const {document}=window;
const sandbox={TextEncoder,fetch:async()=>({ok:true,json:async()=>JSON.parse(fs.readFileSync(path.join(__dirname,'../data/rules/catalog.json'),'utf8'))}),document,console,URLSearchParams,URL,Map,Set,Promise,setTimeout,clearTimeout,queueMicrotask,structuredClone,crypto:webcrypto,Event:window.Event,IntersectionObserver:class{observe(){}unobserve(){}disconnect(){}},location:{search:''},navigator:{},Image:class{},localStorage:{getItem:()=>null,setItem:()=>{}},window:null};sandbox.window=sandbox;sandbox.addEventListener=window.addEventListener.bind(window);sandbox.dispatchEvent=window.dispatchEvent.bind(window);sandbox.print=()=>{};
window.HTMLElement.prototype.setCustomValidity=function(){};
window.HTMLElement.prototype.checkValidity=function(){return true};
window.HTMLElement.prototype.showModal=function(){this.open=true};window.HTMLElement.prototype.close=function(){this.open=false;this.dispatchEvent(new window.Event('close'))};window.HTMLElement.prototype.focus=function(){};
Object.defineProperty(window.HTMLSelectElement.prototype,'value',{get(){const o=[...this.querySelectorAll('option')].find(o=>o.selected)||this.querySelector('option');return o?.getAttribute('value')??o?.textContent??''},set(value){for(const o of this.querySelectorAll('option'))o.removeAttribute('selected');const chosen=[...this.querySelectorAll('option')].find(o=>(o.getAttribute('value')??o.textContent)===String(value));if(chosen)chosen.setAttribute('selected','');}});
const ctx=vm.createContext(sandbox);const run=async f=>vm.runInContext(fs.readFileSync(f,'utf8'),ctx,{filename:f});
(async()=>{
 await run(path.join(__dirname,'dom-setup.js'));await run(path.join(__dirname,'dom-fixture.js'));
 vm.runInContext('function createCampaignStore(){return window.__DND_VAULT_DEPS__.vaultCall}',ctx);
 for(const name of ['character-equipment','character-magic-armor','character-magic-item-data','character-magic-items','core','character-race-catalog','character-expanded-race-data','character-background-data','character-expanded-background-data','character-backgrounds','character-rules-2024','character-rules','character-subclass-data','character-expanded-subclass-data','character-srd-class-data','character-class-progression','character-feat-data','character-feat-reference','character-feat-rules','character-catalog','character-class-feature-choices','character-adobe-data','character-creature-data','character-creature-data-1','character-creature-data-2','character-creature-data-3','character-creature-data-4','character-play-rules','character-actions','character-story','character-journal-ui','character-progression','character-sheet-model','character-sheet-store','character-build-validation','character-overview-ui','character-play-ui','character-point-buy-ui','character-inventory-ui','character-action-ui','character-sheet','character-equipment-ui','character-catalog-ui','character-adobe-engine','character-spellcasting','character-adobe-builder-ui','character-adobe-pages','character-creature-ui','character-spellcasting-ui','images','catalog-cache','data','dm-approval','invitations','library-state','dashboard','campaign-items','library','admin','player','dm-tools','ui-auth'])await run(path.join(__dirname,`../js/modules/${name}.js`));
 vm.runInContext('CharacterCatalog.set('+fs.readFileSync(path.join(__dirname,'../data/rules/catalog.json'),'utf8')+')',ctx);
 await run(path.join(__dirname,'dom-state.js'));
 if(process.env.DND_FORM_REGRESSION_ONLY||process.env.DND_STORY_REGRESSION_ONLY||process.env.DND_BUILDER_OVERVIEW_ONLY){
  const resultHost=document.createElement('pre');resultHost.id='test-results';resultHost.textContent='[]';document.body.append(resultHost);
  await run(path.join(__dirname,process.env.DND_BUILDER_OVERVIEW_ONLY?'character-builder-overview-checks.js':process.env.DND_STORY_REGRESSION_ONLY?'character-story-layout-checks.js':'character-form-regression-checks.js'));
 }else{
 await run(path.join(__dirname,'dom-checks.js'));
 await run(path.join(__dirname,'character-sheet-ui-checks.js'));
 await run(path.join(__dirname,'character-rules-ui-checks.js'));
 await run(path.join(__dirname,'character-race-ui-checks.js'));
 await run(path.join(__dirname,'character-edition-ui-checks.js'));
 await run(path.join(__dirname,'character-catalog-ui-checks.js'));
 await run(path.join(__dirname,'character-feat-ui-checks.js'));
 await run(path.join(__dirname,'character-sheet-page-checks.js'));
 await run(path.join(__dirname,'character-more-feats-ui-checks.js'));
 await run(path.join(__dirname,'character-spell-feat-flow-ui-checks.js'));
 await run(path.join(__dirname,'character-equipment-ui-checks.js'));
 await run(path.join(__dirname,'character-overview-ui-checks.js'));
 await run(path.join(__dirname,'character-play-ui-checks.js'));
 await run(path.join(__dirname,'character-action-ui-checks.js'));
 await run(path.join(__dirname,'character-inventory-ui-checks.js'));
 await run(path.join(__dirname,'character-armor-ui-checks.js'));
 await run(path.join(__dirname,'campaign-library-bulk-ui-checks.js'));
 await run(path.join(__dirname,'character-ability-budget-ui-checks.js'));
 }
 const results=JSON.parse(document.getElementById('test-results').textContent);fs.writeFileSync(path.join(__dirname,'dom-results.json'),JSON.stringify(results,null,2));
 for(const r of results)console.log(r.pass?'PASS':'FAIL',r.name);if(results.some(r=>!r.pass))process.exitCode=1;else console.log(`SUCCESS ${results.length} DOM checks`);
})().catch(e=>{console.error(e);process.exitCode=1;});
