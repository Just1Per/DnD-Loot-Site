'use strict';
/* Lazy original Gear/Tool catalogue. Selection/preview do not create inventory. */
var CharacterPaperGearCatalogUI=(()=>{
 let pending=null;
 function facts(){
  if(!pending)pending=fetch(new URL('data/rules/adobe-tools.json?v=20261101-original-tools-v1',document.baseURI)).then(response=>{if(!response.ok)throw Error('The original Gear/Tool reference could not be loaded.');return response.json();}).then(value=>{
   if(value?.format!==1||!Array.isArray(value.tools)||value.tools.length>100||!value.gearAmounts||typeof value.gearAmounts!=='object'||Array.isArray(value.gearAmounts))throw Error('The original Gear/Tool reference could not be read.');return value;
  }).catch(error=>{pending=null;throw error;});return pending;
 }
 function install({dialog,row,session,index,allowed,guard,clean,apply}){
  const section=document.createElement('section');section.className='adobe-gear-catalog-section';section.innerHTML='<details data-gear-catalog><summary>Put Gear / Tool on this line</summary><p class="adobe-gear-help">Add an item from the original 2014 Gear or Tool list and place it here. The previous item stays owned in Inventory. No coins are spent.</p><div data-gear-catalog-host></div></details>';
  dialog.querySelector('.adobe-gear-body').prepend(section);const details=section.querySelector('details'),host=section.querySelector('[data-gear-catalog-host]');let loaded=false;
  const current=()=>host.isConnected&&characterHPCurrent(session),canApply=()=>current()&&allowed(),eligible=reference=>CharacterPaperGearCatalog.choices(CharacterAdobeData.gear,reference,entry=>CampaignRules.allowed(entry));
  async function load(){
   if(loaded||!current())return;loaded=true;host.innerHTML='<p role="status">Loading original gear and tools…</p>';
   try{
    const reference=await facts();if(!current())return;const catalogue=eligible(reference);
    if(!catalogue.length){host.innerHTML='<p class="adobe-gear-help">This campaign has not enabled the original 2014 equipment list. You can still choose equipment you already own.</p>';return;}
    const groups=new Map();for(const entry of catalogue){const label=(entry.kind==='tool'?'Tool':'Gear')+' · '+entry.category;if(!groups.has(label))groups.set(label,[]);groups.get(label).push(entry);}
    host.innerHTML='<label>Original Gear / Tool<select data-catalog-choice aria-label="Original Gear or Tool"><option value="">Find an item to place</option></select></label><div data-catalog-preview hidden></div><p data-catalog-status role="status" aria-live="polite"></p>';
    const select=host.querySelector('select'),preview=host.querySelector('[data-catalog-preview]'),status=host.querySelector('[data-catalog-status]');
    for(const [label,rows]of [...groups].sort(([a],[b])=>a.localeCompare(b))){const group=document.createElement('optgroup');group.label=label;for(const entry of rows.sort((a,b)=>a.name.localeCompare(b.name))){const option=document.createElement('option');option.value=entry.id;option.textContent=entry.name;option.dataset.choiceDetail=(entry.sourceAmount===''?1:entry.quantity)+' item(s) · '+(entry.weight===null?'weight not specified':entry.weight+' lb each')+(entry.price?' · '+entry.price:'')+' · 2014';group.append(option);}select.append(group);}
    function show(){
     const entry=catalogue.find(entry=>entry.id===select.value);preview.hidden=!entry;status.textContent='';if(!entry)return;const esc=sheetEscape,quantity=entry.sourceAmount===''?1:entry.quantity;
     preview.innerHTML='<h4>'+esc(entry.name)+'</h4><dl class="adobe-catalog-facts"><div><dt>Owned amount</dt><dd>'+quantity+(entry.sourceAmount===''?' · blank amount on paper':'')+'</dd></div><div><dt>Unit weight</dt><dd>'+(entry.weight===null?'Not specified':entry.weight+' lb')+'</dd></div><div><dt>Reference price</dt><dd>'+esc(entry.price||'Not specified')+'</dd></div></dl>'+(entry.weight===null?'<label>Enter unit weight (lb)<input type="text" inputmode="decimal" data-catalog-weight aria-describedby="adobeCatalogWeightHelp"><small id="adobeCatalogWeightHelp">The original reference leaves this weight blank. Enter a known weight, or 0 if your table treats it as weightless.</small></label>':'')+'<p class="adobe-gear-help">Adds '+quantity+' to this character’s carried inventory. '+(entry.kind==='tool'?'Owning a tool does not grant proficiency. ':'')+'Equipment is not automatically worn or attuned.</p><button type="button" data-catalog-add>Add &amp; place on this line</button>';
     if(session.data.personalGear.length>=200){preview.querySelector('button').disabled=true;status.textContent='The 200 personal-item limit has been reached. Remove unused rows before adding another.';}
     preview.querySelector('[data-catalog-add]').onclick=async()=>{
      if(!guard()||!clean())return;const live=eligible(reference);if(!live.some(item=>item.id===entry.id)){status.textContent='This item is no longer enabled by the campaign.';return;}
      const weight=preview.querySelector('[data-catalog-weight]');let proposal;
      try{proposal=CharacterPaperGearCatalog.plan(session.data,CharacterPaperGearUI.physical(),index,entry.id,{catalogue:live,newId:'personal-'+crypto.randomUUID(),weight:weight?weight.value:undefined});if(weight)weight.removeAttribute('aria-invalid');}catch(error){status.textContent=error.message;if(weight){weight.setAttribute('aria-invalid','true');weight.focus();}return;}
      if(row&&!await SiteConfirmation.ask({title:'Put '+entry.name+' on this line?',paragraphs:['Add '+proposal.item.quantity+' to this character’s inventory. No coins are spent.',row.name+' stays owned, with its equipment effects and uses. This paper line is replaced.'],confirmLabel:'Add & place',isCurrent:canApply}))return;
      if(!guard()||!canApply())return;if(!eligible(reference).some(item=>item.id===entry.id)){status.textContent='This item is no longer enabled by the campaign.';return;}apply(proposal);
     };
    }
    select.onchange=show;
   }catch(error){if(!current())return;host.innerHTML='<p data-catalog-error role="status"></p><button type="button" data-catalog-retry>Retry original reference</button>';host.querySelector('p').textContent=error.message;host.querySelector('button').onclick=()=>{loaded=false;load();};}
  }
  details.addEventListener('toggle',()=>{if(details.open)load();});
 }
 return{install};
})();
