'use strict';
/* Alternate rendering of the current session. No SDK, storage or second engine. */
var CharacterAdobeView=(()=>{
 const VERSION='20261027-adobe-sheet-v3',assets=new Map(),sessions=new WeakMap();let current=null;
 const SPELL_CAPACITY={front:55,more:70};
 const option=(text,value)=>Object.assign(document.createElement('option'),{textContent:text,value});
 const editorTargets={vitals:['Hit points & Inspiration','#sheet-overview'],classes:['Class, level & hit points','#sheetAdobeProgression'],hp:['Class, level & hit points','#sheetAdobeProgression'],abilities:['Ability scores & skills','#sheet-skills'],skills:['Ability scores & skills','#sheet-skills'],origins:['Origins & class choices','#sheetBuildControls'],features:['Origins & class choices','#sheetBuildControls'],background:['Origins & class choices','#sheetBuildControls'],equipment:['Equipment & treasure','#sheet-inventory'],inventory:['Equipment & treasure','#sheet-inventory'],spells:['Spells','#sheet-spells'],feats:['Feats','#sheet-feats'],attacks:['Combat & resources','#sheet-combat'],resources:['Combat & resources','#sheet-combat'],conditions:['Combat & resources','#sheet-combat'],combat:['Combat & resources','#sheet-combat'],notes:['Adventure journal','#sheet-notes'],story:['Background & appearance','#sheet-story'],builder:['Origins & class choices','#sheetBuildControls']};
 const active=()=>!!(current?.host.isConnected&&current.session===sheetSession&&current.state.style==='adobe');
 function key(s){return ['sheet-style',s.uid,s.campaignId,s.adventureId||'campaign',s.characterId].join(':');}
 function state(s){if(!sessions.has(s)){let style='standard';try{if(localStorage.getItem(key(s))==='adobe')style='adobe';}catch{}sessions.set(s,{style,page:'page-1',zoom:'fit',notesOffset:0,spellCaster:'all',spellPage:0,derived:null,editor:null});}return sessions.get(s);}
 async function json(path){if(!assets.has(path))assets.set(path,fetch(new URL('data/adobe-pages/'+path+'?v='+VERSION,document.baseURI)).then(r=>{if(!r.ok)throw Error('The Adobe page could not be loaded.');return r.json();}).catch(e=>{assets.delete(path);throw e}));return assets.get(path);}
 function context(c=current){
  const s=c.session,d=c.state.derived||CharacterSheetModel.derive(s.data,s.identity.level,sheetEquipmentLoot());
  const spellPage=/^template-SS(front|more)$/.test(c.state.page),profiles=spellPage?CharacterSpellcasting.profiles(s.data,d.progression?.targetLevel||s.identity.level,d.scores):[],profile=profiles.find(p=>p.classId===c.state.spellCaster),spellRows=spellPage?characterSpellPresentation(s.data,d,s.identity.level).filter(row=>c.state.spellCaster==='all'||(row.spell.classId||'unassigned')===c.state.spellCaster):[];
  const list=path=>[...document.querySelectorAll('#characterSheetForm [name="'+path+'"] option')].map(o=>({value:o.value,label:o.textContent,disabled:o.disabled}));
  return {data:s.data,identity:s.identity,derived:d,spellRows,spellProfiles:profiles,spellProfile:profile,spellPact:profile?.classId==='warlock'?d.progression?.pact:null,spellStats:profile?CharacterSpellcasting.castingStats(profile,d,s.data):null,invocationText:row=>CharacterClassFeatureChoices.cantripModifierText(row),spellOffset:c.state.page==='template-SSmore'?SPELL_CAPACITY.front+SPELL_CAPACITY.more*c.state.spellPage:0,pageId:c.state.page,notesOffset:c.state.notesOffset,options:{races:list('build.race'),backgrounds:list('build.background'),'profile.gender':list('profile.gender'),alignment:list('alignment')},className:id=>CharacterAdobeEngine.className(id),hitDie:id=>'d'+CharacterProgression.hitDieFor(id),features:entry=>CharacterClassProgression.unlocked(entry.classId,entry.level,entry.subclassId,s.data.build.edition,entry.classId==='artificer'?CharacterClassFeatureChoices.artificerSource(s.data).id:undefined).map(f=>f.name+' (level '+f.level+'): '+(f.summary||'')),armorTraining:group=>CharacterEquipment.armorTrained(group,d.effects.proficiencies),background:CharacterBackgrounds.get(s.data.build.background),feats:selectedFeatCards(s.data,d).map(f=>({...f,description:featOverviewDescription(f.id)||f.summary})),inventory:sheetEquipmentLoot().map(e=>({name:e.item?.name||'',quantity:e.quantity,weight:e.item?.weight??''}))};
 }
 function notice(text,error=false){if(!current)return;const node=current.shadow.getElementById('adobeStatus');node.textContent=text;node.classList.toggle('error',error);}
 function valid(c=current,focus=true){if(!c?.host.isConnected)return true;const invalid=[...c.controls.values()].find(row=>row.input.getAttribute('aria-invalid')==='true');if(!invalid)return true;if(focus){c.state.style='adobe';applyStyle(c);invalid.input.focus();notice(invalid.input.dataset.error||'Correct the highlighted Adobe field.',true);}return false;}
 function write(field,value){
  const c=current,s=c?.session;if(!c?.host.isConnected||s!==sheetSession||s.uid!==auth.currentUser?.uid||s.campaignId!==activeCampaign?.id)throw Error('The character session has changed. Reopen the sheet before editing.');
  const edit=CharacterAdobeFields.planEdit(field,value,context(c));
  if(edit.journalIndex!==undefined){
   if(edit.journalIndex>=300)throw Error('The journal has reached its note limit.');
   readSheetForm();const next=structuredClone(s.data);
   while(next.adobe.journal.length<=edit.journalIndex){const n=next.adobe.journal.length;next.adobe.journal.push({id:'adobe-note-'+crypto.randomUUID(),title:'Adobe note '+(n+1),category:'General',text:''});}
   next.adobe.journal[edit.journalIndex].text=edit.value;const normalized=CharacterSheetModel.normalize(next);
   if(normalized.adobe.journal[edit.journalIndex]?.text!==edit.value)throw Error('This note exceeds the journal’s remaining space.');
   s.data=normalized;s.dirty=true;fillSheetForm();renderCharacterJournal();updateSheetCalculations();sheetStatus('Unsaved changes');return;
  }
  const input=document.querySelector('#characterSheetForm [name="'+edit.path+'"]');
  if(input){
   if(input.disabled||input.readOnly)throw Error('This choice is controlled by the shared character rules.');
   if(input.type==='checkbox')input.checked=!!edit.value;else input.value=String(edit.value);
   input.dispatchEvent(new Event('change',{bubbles:true}));
  }else{
   readSheetForm();const next=structuredClone(s.data),keys=edit.path.split('.'),last=keys.pop();let target=next;
   if(keys[0]==='identity'){s.identity[last]=edit.value;}else{for(const k of keys)target=target[k];target[last]=edit.value;s.data=CharacterSheetModel.normalize(next);}
   s.dirty=true;fillSheetForm();updateSheetCalculations();sheetStatus('Unsaved changes');
  }
 }
 function commit(row){try{write(row.field,row.input.type==='checkbox'?row.input.checked:row.input.value);row.input.removeAttribute('aria-invalid');delete row.input.dataset.error;notice('Updated the shared character. Save sheet to keep the change.');refresh(current?.state.derived);}catch(e){row.input.setAttribute('aria-invalid','true');row.input.dataset.error=e.message;notice(e.message,true);}}
 function description(row,ctx){const d=CharacterAdobeFields.describe(row.field,ctx),standard=d.path?document.querySelector('#characterSheetForm [name="'+d.path+'"]'):null;if(standard&&(standard.disabled||standard.readOnly))return {...d,state:'computed',reason:'Controlled by the shared character rules.'};return d;}
 function updateControl(row,ctx){
  const d=description(row,ctx),input=row.input;row.descriptor=d;row.host.dataset.state=d.state;
  input.title=row.field.label+' — '+(d.state==='pending'?d.reason:d.state==='computed'?d.reason||'Calculated by the shared character engine.':'Edits the same saved character as Standard.');
  if(Number.isInteger(d.spellIndex))input.title+=' Double-click or press Enter to read the full spell information.';else if(d.command)input.title+=' Double-click or press Enter to open its controls.';
  if(input.tagName==='SELECT'){
   const opts=d.options||row.field.options?.map(v=>({value:v,label:v}))||[];const signature=JSON.stringify(opts);
   if(row.options!==signature){input.replaceChildren(option('',''),...opts.map(o=>{const n=option(o.label,o.value);n.disabled=!!o.disabled;return n}));row.options=signature;}
   if(d.value!==''&&!Array.from(input.options).some(o=>o.value===String(d.value))){const n=option(String(d.value)+' (saved)',String(d.value));n.disabled=true;input.append(n);}
  }
  const editing=current.shadow.activeElement===input&&input.type!=='checkbox';
  if(!editing&&input.getAttribute('aria-invalid')!=='true'){if(input.type==='checkbox')input.checked=!!d.value;else input.value=String(d.value??'');}
  if(input.type==='checkbox'||input.tagName==='SELECT')input.disabled=d.state!=='editable';else input.readOnly=d.state!=='editable';
 }
 function makeControl(field,i,c,ctx){
  const d=description({field},ctx),host=document.createElement('label'),input=document.createElement(d.kind==='select'?'select':d.kind==='textarea'?'textarea':'input');
  host.className='field';const [x,y,r,b]=field.rect;Object.assign(host.style,{left:100*x/c.page.width+'%',top:100*y/c.page.height+'%',width:100*(r-x)/c.page.width+'%',height:100*(b-y)/c.page.height+'%',fontSize:'calc(var(--scale) * '+field.fontSize+'px)'});
  const label=document.createElement('span');label.className='sr-only';label.textContent=field.label;input.dataset.pdfField=field.id;input.setAttribute('aria-label',field.label);
  if(input.tagName==='INPUT'){input.type=d.kind==='checkbox'?'checkbox':d.kind==='number'?'number':'text';if(input.type==='number'){input.min=String(d.min??0);input.max=String(d.max??1000000);input.step='1';}}
  if(input.tagName==='TEXTAREA'){input.rows=2;input.maxLength=d.max||20000;}else if(input.type==='text')input.maxLength=d.max||12000;
  if(/^(Str|Dex|Con|Int|Wis|Cha)( |$)|^(AC|HP Max|Proficiency Bonus|Passive Perception|Initiative bonus|Spell save DC|HD\d|Speed)/.test(field.id))host.classList.add('center');
  host.append(label,input);const row={field,host,input,options:null};
  input.addEventListener('change',()=>{if(row.descriptor.state==='editable')commit(row)});
  input.addEventListener('input',()=>{if(row.descriptor.state==='editable'){c.session.dirty=true;sheetStatus('Unsaved changes');}});
  const openField=()=>{if(!active())return;if(Number.isInteger(row.descriptor.spellIndex))openSpellInformation({index:row.descriptor.spellIndex});else if(row.descriptor.command)openEditor(row.descriptor.command);};input.addEventListener('dblclick',openField);
  input.addEventListener('keydown',e=>{if(e.key==='Enter'&&input.tagName!=='TEXTAREA'){e.preventDefault();if(row.descriptor.state==='editable')commit(row);else openField();}});
  updateControl(row,ctx);return row;
 }
 function resize(c=current){if(!c?.page||!c.host.isConnected)return;const paper=c.shadow.getElementById('adobePaper'),viewport=c.shadow.getElementById('adobeViewport'),width=c.state.zoom==='fit'?Math.min(1180,Math.max(240,viewport.clientWidth-24)):c.page.width*96/72*Number(c.state.zoom);paper.style.width=width+'px';paper.style.aspectRatio=c.page.width+'/'+c.page.height;paper.style.setProperty('--scale',width/c.page.width);}
 function buttonCommand(id){
  if(/^spells\.|^Image\.SpellSlots\./.test(id))return 'spells';if(id==='Portrait')return 'story';if(id==='SkillsClick')return 'skills';if(id==='Buttons.HP Max')return 'hp';if(id==='Heal')return 'vitals';
  if(/Class Features|Background Menu/.test(id))return 'origins';
  if(/Equipment|Magic Item|Ammunition|Ammo/.test(id))return 'equipment';
  if(/Feat/.test(id))return 'feats';if(/Spell/.test(id))return 'spells';
  if(/Notes/.test(id))return 'notes';return null;
 }
 async function loadPage(id){
  const c=current;if(!c)return;if(!valid(c)){c.shadow.getElementById('adobePage').value=c.state.page;return;}
  const token=++c.generation;c.state.page=id;c.shadow.getElementById('adobePage').value=id;c.shadow.getElementById('adobeRetry').hidden=true;c.shadow.getElementById('adobePaper').hidden=true;c.shadow.getElementById('adobePrint').disabled=true;notice('Loading Adobe page…');
  try{
   const page=await json(id+'.json');if(c!==current||c.session!==sheetSession||!c.host.isConnected||token!==c.generation)return;
   c.page=page;c.controls.clear();const paper=c.shadow.getElementById('adobePaper');paper.replaceChildren();
   const image=document.createElement('img');image.className='artwork';image.src=new URL('data/adobe-pages/'+id+'.webp?v='+VERSION,document.baseURI);image.alt='';image.setAttribute('aria-hidden','true');paper.append(image);
   const ctx=context(c);for(let i=0;i<page.fields.length;i++){const field=page.fields[i];if(field.id.endsWith('.toFocus'))continue;const row=makeControl(field,i,c,ctx);c.controls.set(field.id,row);paper.append(row.host);}
   for(const source of page.buttons){const b=document.createElement('button'),[x,y,r,bottom]=source.rect;b.type='button';b.className='pdf-button';b.dataset.pdfButton=source.id;b.textContent=source.id==='Portrait'?'Add portrait':source.id==='Symbol'?'Organization symbol · not connected yet':source.caption||'›';if(['Portrait','Symbol'].includes(source.id))b.classList.add('image-control');b.setAttribute('aria-label',source.label);b.title=source.label;Object.assign(b.style,{left:100*x/page.width+'%',top:100*y/page.height+'%',width:100*(r-x)/page.width+'%',height:100*(bottom-y)/page.height+'%'});b.onclick=()=>{const cmd=buttonCommand(source.id);if(cmd)openEditor(cmd);else notice('This PDF control is still being connected: '+source.label,true);};paper.append(b);}
   await image.decode();if(c!==current||c.session!==sheetSession||!c.host.isConnected||token!==c.generation)return;
   paper.hidden=false;c.shadow.getElementById('adobePrint').disabled=false;resize(c);refresh(c.state.derived);notice('Adobe preview — connected fields use your shared character. Other controls are still being connected.');
   c.shadow.getElementById('adobeNotes').hidden=!/notes|page-5/i.test(id);
   c.shadow.getElementById('adobeEditionNotice').hidden=!/PRsheet|page-6/.test(id);
  }catch(e){if(c===current&&token===c.generation){notice(e.message,true);c.shadow.getElementById('adobeRetry').hidden=false;}}
 }
 function closeEditor(clear=true){
  const c=current;if(!c?.editor)return;const {header,panels}=c.editor;c.editor=null;
  if(clear)c.state.editor=null;
  for(const [node,hidden] of panels)if(node.isConnected)node.hidden=hidden;
  header.remove();if(c.form.isConnected){c.form.querySelector('.sheet-body').hidden=c.state.style==='adobe';c.host.hidden=c.state.style!=='adobe';}
 }
 function openEditor(command){
  const c=current;if(!active()||!valid(c))return;const entry=editorTargets[command];if(!entry){notice('This workflow is still being connected.',true);return;}
  closeEditor();const node=document.querySelector(entry[1]);if(!node){notice('These shared controls are not available for this character yet.',true);return;}
  const panel=node.closest('[data-sheet-section]');if(!panel)return;
  const header=document.createElement('header');header.className='adobe-shared-editor-heading';header.id='adobeSharedEditor';
  const h=document.createElement('h3'),close=document.createElement('button');h.textContent=entry[0];close.type='button';close.textContent='Back to Adobe sheet';close.onclick=()=>closeEditor();header.append(h,close);
  const body=c.form.querySelector('.sheet-body'),panels=[...body.querySelectorAll('[data-sheet-section]')].map(n=>[n,n.hidden]);
  for(const [n] of panels)n.hidden=n!==panel;
  body.classList.remove('sheet-readonly-page');body.hidden=false;c.host.hidden=true;body.before(header);c.editor={header,panels};c.state.editor=command;
 }
 function applyStyle(c){
  const form=document.getElementById('characterSheetForm');if(!form)return;const adobe=c.state.style==='adobe';c.select.value=adobe?'adobe':'standard';form.dataset.sheetStyle=c.select.value;
  form.querySelector('.sheet-body').hidden=adobe;const nav=form.querySelector('.sheet-page-navigation')||form.querySelector('.sheet-tabs');if(nav)nav.hidden=adobe;c.host.hidden=!adobe;
 }
 async function setStyle(value,{persist=true}={}){
  const c=current;if(!c||!['standard','adobe'].includes(value))return false;
  if(!valid(c)){c.select.value='adobe';return false;}if(value==='standard')closeEditor();readSheetForm();c.state.style=value;applyStyle(c);
  if(persist)try{localStorage.setItem(key(c.session),value);}catch{}
  if(value==='adobe'&&!c.shadow.querySelector('link')){const link=document.createElement('link');link.rel='stylesheet';link.href=new URL('css/character-adobe-view.css?v='+VERSION,document.baseURI);c.shadow.prepend(link);}
  if(value==='adobe'&&!c.manifest){
   try{const manifest=await json('pages.json');if(c!==current||c.session!==sheetSession||!c.host.isConnected)return false;c.manifest=manifest;
    const select=c.shadow.getElementById('adobePage');select.replaceChildren(...manifest.pages.map(p=>option(p.title+(p.optional?' · optional':''),p.id)));select.value=c.state.page;await loadPage(c.state.page);
   }catch(e){if(c===current){notice(e.message,true);c.shadow.getElementById('adobeRetry').hidden=false;}}
  }else if(value==='adobe'&&!c.page)await loadPage(c.state.page);
  return true;
 }
 function spellCommand(selector){
  const c=current;if(!active()||!valid(c)||c.session.uid!==auth.currentUser?.uid||c.session.campaignId!==activeCampaign?.id)return;
  const control=document.querySelector('#sheet-spells '+selector);
  if(!control||control.disabled){notice('Open the shared Spells controls to review this choice.',true);return;}control.click();const status=document.getElementById('sheetStatus');if(status)notice(status.textContent,status.classList.contains('sheet-error'));
 }
 function refreshSpells(c,ctx){
  const enabled=/^template-SS(front|more)$/.test(c.state.page),label=c.shadow.getElementById('adobeSpellCasterLabel'),navigation=c.shadow.getElementById('adobeSpellNavigation');label.hidden=!enabled;navigation.hidden=!enabled;if(!enabled)return;
  const select=c.shadow.getElementById('adobeSpellCaster'),options=[['all','All selected spells'],...ctx.spellProfiles.map(p=>[p.classId,p.name]),['unassigned','Unassigned / custom']],signature=JSON.stringify(options);
  if(select.dataset.options!==signature){select.replaceChildren(...options.map(([v,t])=>option(t,v)));select.dataset.options=signature;}
  if(!options.some(([v])=>v===c.state.spellCaster)){c.state.spellCaster='all';refresh(c.state.derived);return false;}select.value=c.state.spellCaster;
  const maximum=Math.max(0,Math.ceil((ctx.spellRows.length-SPELL_CAPACITY.front)/SPELL_CAPACITY.more)-1);if(c.state.spellPage>maximum){c.state.spellPage=maximum;refresh(c.state.derived);return false;}
  const start=ctx.spellOffset,capacity=c.state.page==='template-SSfront'?SPELL_CAPACITY.front:SPELL_CAPACITY.more,total=ctx.spellRows.length;
  c.shadow.getElementById('adobeSpellPosition').textContent=total&&start<total?'Spells '+Math.min(total,start+1)+'–'+Math.min(total,start+capacity)+' of '+total:total?'No remaining spells on this continuation. Use Previous spells.':'No selected spells for this caster. Use Shared controls → Spells to choose them.';
  for(const button of c.shadow.querySelectorAll('[data-pdf-button^="spells.checkbox."]')){
   const index=Number(button.dataset.pdfButton.split('.').at(-1)),row=index?ctx.spellRows[start+index-1]:null;button.disabled=!row?.preparationEditable;button.textContent=row?(row.automatic?'●':row.preparationEditable?(row.spell.prepared?'●':'○'):'—'):'';if(row?.preparationEditable)button.setAttribute('aria-pressed',String(row.spell.prepared));else button.removeAttribute('aria-pressed');button.setAttribute('aria-label',row?(row.preparationEditable?'Prepare ':row.automatic?'Always prepared: ':'No preparation choice: ')+row.spell.name:'Empty spell row');button.onclick=()=>{const latest=context(c),entry=latest.spellRows[latest.spellOffset+Number(button.dataset.pdfButton.split('.').at(-1))-1];if(entry?.preparationEditable)spellCommand('[data-generated-prepare="'+entry.i+'"]');};
  }
  for(const button of c.shadow.querySelectorAll('[data-pdf-button^="Image.SpellSlots.Checkboxes."]')){const level=Number(button.dataset.pdfButton.split('.').at(-1)),slot=ctx.spellPact?(level===ctx.spellPact.slotLevel?{max:ctx.spellPact.count,used:ctx.spellPact.used}:null):c.session.data.slots[level-1],available=slot?.max>0;button.disabled=!available;button.textContent=available?(slot.max-slot.used)+' / '+slot.max:'—';button.setAttribute('aria-label',(ctx.spellPact?'Pact Magic':'Spellcasting')+' level '+level+' slots, '+button.textContent+(available?'. Open shared Spells controls':'. No slots at this level'));}

  c.shadow.getElementById('adobePreviousSpells').disabled=c.state.page==='template-SSfront';c.shadow.getElementById('adobeNextSpells').disabled=start+capacity>=total;
 }
 function refresh(derived){
  const s=sheetSession;if(!s)return;const st=state(s);if(derived)st.derived=derived;
  const c=current;if(!c||c.session!==s||!c.host.isConnected||!c.page)return;const ctx=context(c);if(refreshSpells(c,ctx)===false)return;for(const row of c.controls.values())updateControl(row,ctx);const portrait=c.shadow.querySelector('[data-pdf-button=Portrait]');if(portrait){const src=s.data.adobe.portrait;if(src){let img=portrait.querySelector('img');if(!img){img=document.createElement('img');img.alt='Character portrait';portrait.replaceChildren(img);}if(img.getAttribute('src')!==src)img.src=src;portrait.title='Change character portrait';}else{portrait.textContent='Add portrait';portrait.title='Add a character portrait using the shared Background editor';}}
 }
 function preparePrint(){
  const c=current;if(!active()||!c.page||c.shadow.getElementById('adobePaper').hidden)return false;
  closeEditor();const style=document.getElementById('adobePrintPageStyle')||document.createElement('style');style.id='adobePrintPageStyle';style.textContent='@media print{@page{size:'+Number(c.page.width)+'pt '+Number(c.page.height)+'pt;margin:0}}';document.head.append(style);document.body.classList.add('printing-adobe-sheet','printing-character-sheet');return true;
 }
 async function print(){
  const c=current;if(!active()||!c.page||!valid(c)||c.shadow.getElementById('adobePaper').hidden)return;
  try{const generation=c.generation;await Promise.all([...c.shadow.querySelectorAll('img')].map(img=>img.decode()));if(c!==current||!active()||generation!==c.generation)return;if(preparePrint())window.print();}catch{notice('The page artwork could not be loaded for printing. Retry the page.',true);}
 }
 function destroy(){if(!current)return;const c=current;closeEditor(false);c.observer?.disconnect();++c.generation;current=null;}
 function install(){
  const s=sheetSession,form=document.getElementById('characterSheetForm');if(!s||!form)return;
  if(current?.form===form)return;destroy();const st=state(s),select=document.createElement('select'),label=document.createElement('label');select.id='sheetStyle';select.setAttribute('aria-label','Character sheet style');select.append(option('Standard','standard'),option('Adobe · preview','adobe'));label.className='sheet-style-choice';label.append(document.createTextNode('Sheet style '),select);form.querySelector('.sheet-header .sheet-actions').prepend(label);
  const host=document.createElement('section');host.id='sheetAdobeView';host.setAttribute('aria-label','Adobe character sheet');host.hidden=true;host.dataset.noContextHelp='';form.querySelector('.sheet-body').before(host);const shadow=host.attachShadow({mode:'open'});
  shadow.innerHTML='<section class="adobe-toolbar" aria-label="Adobe sheet tools"><label>Page <select id="adobePage"></select></label><label>Zoom <select id="adobeZoom"><option value="fit">Fit width</option><option value="1">100%</option><option value="1.5">150%</option><option value="2">200%</option><option value="3">300%</option></select></label><label id="adobeSpellCasterLabel" hidden>Caster <select id="adobeSpellCaster"></select></label><label>Shared controls <select id="adobeEditor"><option value="abilities">Ability scores & skills</option><option value="classes">Class, level & HP</option><option value="origins">Origins & features</option><option value="resources">Combat & resources</option><option value="equipment">Equipment</option><option value="spells">Spells</option><option value="feats">Feats</option><option value="notes">Journal</option><option value="story">Background</option></select></label><button type="button" id="adobeOpenEditor">Open controls</button><button type="button" id="adobePrint" disabled>Print page</button></section><p class="preview-note">Adobe view is under construction. Connected fields edit the same character as Standard. Calculated fields use the shared engine; unfinished fields are read-only. Use Save sheet to keep changes.</p><p id="adobeEditionNotice" class="edition-note" hidden>This page reproduces the original 2014 reference. Your character still uses its selected rule edition.</p><p id="adobeStatus" role="status"></p><button type="button" id="adobeRetry" hidden>Retry page</button><div id="adobeNotes" hidden><button type="button" id="adobePreviousNotes">Previous notes</button><button type="button" id="adobeNextNotes">More notes</button></div><div id="adobeSpellNavigation" hidden><button type="button" id="adobePreviousSpells">Previous spells</button><span id="adobeSpellPosition" role="status"></span><button type="button" id="adobeNextSpells">Next spells</button></div><div id="adobeViewport" class="paper-viewport" role="region" aria-label="Adobe paper, scroll to explore when zoomed" tabindex="0"><div id="adobePaper" class="paper" hidden></div></div>';
  const c=current={session:s,state:st,form,select,host,shadow,controls:new Map(),page:null,manifest:null,generation:0,editor:null};
  select.value=st.style;select.onchange=()=>setStyle(select.value);shadow.getElementById('adobePage').onchange=e=>loadPage(e.target.value);shadow.getElementById('adobeZoom').value=st.zoom;shadow.getElementById('adobeZoom').onchange=e=>{st.zoom=e.target.value;resize(c);};shadow.getElementById('adobeOpenEditor').onclick=()=>openEditor(shadow.getElementById('adobeEditor').value);shadow.getElementById('adobeRetry').onclick=()=>c.manifest?loadPage(st.page):setStyle('adobe');
  shadow.getElementById('adobePrint').onclick=print;
  shadow.getElementById('adobeSpellCaster').onchange=e=>{st.spellCaster=e.target.value;st.spellPage=0;if(st.page==='template-SSmore')loadPage('template-SSfront');else refresh(st.derived);};
  shadow.getElementById('adobePreviousSpells').onclick=()=>{if(st.page==='template-SSmore'&&st.spellPage>0){st.spellPage--;refresh(st.derived);}else loadPage('template-SSfront');};
  shadow.getElementById('adobeNextSpells').onclick=()=>{if(st.page==='template-SSfront')loadPage('template-SSmore');else{st.spellPage++;refresh(st.derived);}};
  const notePage=delta=>{st.notesOffset=Math.max(0,Math.min(Math.min(298,Math.floor(s.data.adobe.journal.length/2)*2),st.notesOffset+delta));refresh(st.derived);};shadow.getElementById('adobePreviousNotes').onclick=()=>notePage(-2);shadow.getElementById('adobeNextNotes').onclick=()=>notePage(2);
  if(typeof ResizeObserver==='function'){c.observer=new ResizeObserver(()=>resize(c));c.observer.observe(shadow.getElementById('adobeViewport'));}applyStyle(c);if(st.style==='adobe')setStyle('adobe',{persist:false}).then(()=>{if(c===current&&st.editor)openEditor(st.editor)});
 }
 window.addEventListener('resize',()=>resize());
 window.addEventListener('afterprint',()=>{document.body.classList.remove('printing-adobe-sheet','printing-character-sheet');document.getElementById('adobePrintPageStyle')?.remove();});
 return {install,refresh,destroy,active,setStyle,print,preparePrint,validate:()=>valid(),openEditor,routeSection:key=>{if(!active())return false;if(key==='overview'){closeEditor();return true;}if(!editorTargets[key])return false;openEditor(key);return true;}};
})();
if(typeof globalThis!=='undefined')globalThis.CharacterAdobeView=CharacterAdobeView;
