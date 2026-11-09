'use strict';
/* The existing Wild Shape component, owned by a modal over Adobe rather than a Standard tab. */
var CharacterAdobeDruidFormsUI=(()=>{
 let cleanup=null;
 function open(){
  const session=sheetSession;if(!characterHPCurrent(session)||session.saving||!CharacterAdobeView.validate())return;cleanup?.();readSheetForm();
  const derived=CharacterSheetModel.derive(session.data,session.identity.level,sheetEquipmentLoot()),limits=CharacterWildShape.limits(session.data,derived.progression.targetLevel);
  if(!limits.available){sheetStatus('Wild Shape becomes available at Druid level 2.',true);return;}
  CharacterWildShapeUI.update(derived);const panel=document.getElementById('sheetDruidWildShape');if(!panel)return;
  const opener=document.activeElement?.shadowRoot?.activeElement||document.activeElement,placeholder=document.createComment('Adobe Druid forms');panel.before(placeholder);const dialog=document.createElement('dialog');dialog.id='adobeDruidFormsDialog';dialog.className='vault-dialog adobe-native-dialog adobe-druid-forms-dialog';dialog.dataset.noContextHelp='';dialog.setAttribute('aria-labelledby','adobeDruidFormsTitle');dialog.innerHTML='<header class="adobe-native-head"><div><span class="sheet-eyebrow">DRUID · '+sheetEscape(session.data.build.edition)+'</span><h2 id="adobeDruidFormsTitle" tabindex="-1">Druid forms</h2></div><button type="button" data-druid-close aria-label="Close Druid forms">×</button></header><p>Choose and manage your Wild Shape forms here. Changes update this character. Save sheet to keep them.</p><div data-druid-forms-host></div><footer class="adobe-source-footer"><button type="button" data-druid-close>Close</button></footer>';
  let closed=false;function close(){if(closed)return;closed=true;if(cleanup===close)cleanup=null;if(placeholder.isConnected)placeholder.replaceWith(panel);else panel.remove();if(dialog.open)dialog.close();dialog.remove();if(opener?.isConnected)opener.focus({preventScroll:true});}cleanup=close;
  const current=()=>characterHPCurrent(session)&&!session.saving&&dialog.isConnected;
  function guard(event){if(!current()){event.preventDefault();event.stopImmediatePropagation();close();return;}if(event.type==='click'&&event.target.closest('[data-wild-spells]')){event.preventDefault();event.stopImmediatePropagation();close();CharacterAdobeSpellUI.open('druid');}}
  for(const event of ['click','input','change'])dialog.addEventListener(event,guard,true);for(const button of dialog.querySelectorAll('[data-druid-close]'))button.onclick=close;dialog.addEventListener('cancel',event=>{event.preventDefault();close();});dialog.addEventListener('close',close);dialog.querySelector('[data-druid-forms-host]').append(panel);document.getElementById('characterSheetDialog').append(dialog);dialog.showModal();dialog.querySelector('h2').focus();CharacterWildShapeUI.load().then(()=>{if(!current())return;const target=panel.querySelector('[data-wild-known]')||panel.querySelector('[data-wild-form]')?.closest('label');if(target){if(target.tagName==='DETAILS')target.open=true;target.scrollIntoView({block:'start'});target.querySelector('select')?.focus({preventScroll:true});}});
 }
 return{open,destroy:()=>cleanup?.()};
})();
