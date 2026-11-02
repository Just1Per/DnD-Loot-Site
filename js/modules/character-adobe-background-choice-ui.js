'use strict';
/* Anchored background suggestions; source text boxes remain freely editable. */
var CharacterAdobeBackgroundChoiceUI=(()=>{
 let currentClose=null;
 const categories=[['personality','Personality trait','Personality Trait'],['ideals','Ideal','Ideal'],['bonds','Bond','Bond'],['flaws','Flaw','Flaw']];
 function open(anchor,initial='personality'){
  const session=sheetSession;if(!characterHPCurrent(session)||session.saving||!anchor?.isConnected||!CharacterAdobeView.validate())return;currentClose?.();
  const dialog=document.createElement('dialog');dialog.id='adobeBackgroundChoiceDialog';dialog.className='vault-dialog adobe-background-choice-dialog';dialog.setAttribute('aria-labelledby','adobeBackgroundChoiceTitle');dialog.dataset.noContextHelp='';
  const background=session.data.build.background,profile=CharacterStory.get(background),name=CharacterBackgrounds.get(background)?.name||'Custom background';let category=categories.some(row=>row[0]===initial)?initial:'personality',closed=false,hoverTimer=null,confirming=false;
  const snapshot=JSON.stringify(session.data),allowed=()=>characterHPCurrent(session)&&!session.saving&&dialog.isConnected&&session.data.build.background===background&&JSON.stringify(session.data)===snapshot;
  const close=()=>{if(closed)return;closed=true;clearTimeout(hoverTimer);if(currentClose===close)currentClose=null;window.removeEventListener('resize',position);if(dialog.open)dialog.close();dialog.remove();if(anchor.isConnected)anchor.focus({preventScroll:true});};currentClose=close;
  const guard=()=>{if(allowed())return true;close();if(characterHPCurrent(session))sheetStatus('The character or background changed. Open its suggestions again.',true);return false;};
  const focusText=key=>{const id=categories.find(row=>row[0]===key)?.[2];CharacterAdobeView.focusField(id);};
  function position(){const rect=anchor.getBoundingClientRect(),box=dialog.getBoundingClientRect();dialog.style.left=Math.max(12,Math.min(rect.right-box.width,innerWidth-box.width-12))+'px';dialog.style.top=Math.max(12,Math.min(rect.bottom+6,innerHeight-box.height-12))+'px';}
  dialog.innerHTML='<header><div><span>BACKGROUND SUGGESTIONS</span><h2 id="adobeBackgroundChoiceTitle">'+sheetEscape(name)+'</h2></div><button type="button" data-background-close aria-label="Close background suggestions">×</button></header><div class="adobe-background-choice-columns"><nav aria-label="Suggestion category">'+categories.map(([key,label])=>'<button type="button" data-background-category="'+key+'" aria-controls="adobeBackgroundChoiceOptions">'+label+' <span aria-hidden="true">›</span></button>').join('')+'</nav><section id="adobeBackgroundChoiceOptions" aria-label="Background suggestions"><h3 data-background-heading></h3><div data-background-options></div><footer><button type="button" data-background-custom>Custom — write my own</button><p>Suggestions stay editable in the text box. Ideal alignment is guidance only.</p></footer></section></div><p data-background-status role="status" aria-live="polite"></p>';
  function render(){
   const [key,label]=categories.find(row=>row[0]===category),rows=profile[key]||[];for(const button of dialog.querySelectorAll('[data-background-category]'))button.setAttribute('aria-pressed',String(button.dataset.backgroundCategory===key));dialog.querySelector('[data-background-heading]').textContent=label;
   const list=dialog.querySelector('[data-background-options]');list.replaceChildren();for(const row of rows){const text=typeof row==='string'?row:row.text;if(!text)continue;const button=document.createElement('button');button.type='button';button.dataset.backgroundSuggestion='';button.textContent=text;if(row.alignment){const hint=document.createElement('small');hint.textContent='Alignment tendency: '+row.alignment;button.append(hint);}button.onclick=async()=>{
     if(confirming||!guard())return;clearTimeout(hoverTimer);const existing=session.data[key]||'';
     if(existing&&existing!==text){confirming=true;let accepted;try{accepted=await SiteConfirmation.ask({title:'Replace this '+label.toLowerCase()+'?',paragraphs:[existing,text],confirmLabel:'Use suggestion',isCurrent:allowed});}finally{confirming=false;clearTimeout(hoverTimer);}if(!accepted)return;}
     if(!guard())return;if(existing!==text){session.data[key]=text;session.dirty=true;fillSheetForm();updateSheetCalculations();sheetStatus(label+' updated. You can edit its text. Save sheet to keep it.');}close();focusText(key);
    };list.append(button);}
   if(!rows.length){const message=document.createElement('p');message.textContent='No suggestions are available for this background. Use Custom to write your own.';list.append(message);}
   dialog.querySelector('[data-background-custom]').onclick=()=>{if(!guard())return;close();focusText(key);};position();
  }
  for(const button of dialog.querySelectorAll('[data-background-category]')){const choose=()=>{if(confirming||!guard())return;category=button.dataset.backgroundCategory;render();};button.onclick=choose;button.onpointerenter=()=>clearTimeout(hoverTimer);button.onpointermove=event=>{if(event.pointerType==='mouse'&&(event.movementX||event.movementY)){clearTimeout(hoverTimer);hoverTimer=setTimeout(choose,160);}};button.onpointerleave=()=>clearTimeout(hoverTimer);button.onkeydown=event=>{if(event.key==='ArrowRight'){event.preventDefault();choose();dialog.querySelector('[data-background-options] button, [data-background-custom]')?.focus();}};}
  dialog.querySelector('#adobeBackgroundChoiceOptions').addEventListener('pointerenter',()=>clearTimeout(hoverTimer));
  dialog.addEventListener('keydown',event=>{if(event.key==='ArrowLeft'&&!event.target.hasAttribute('data-background-category')){event.preventDefault();dialog.querySelector('[data-background-category="'+category+'"]').focus();}});
  dialog.querySelector('[data-background-close]').onclick=close;dialog.addEventListener('cancel',event=>{event.preventDefault();close();});dialog.addEventListener('close',close);dialog.addEventListener('click',event=>{if(event.target!==dialog)return;const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)close();});
  document.getElementById('characterSheetDialog').append(dialog);render();dialog.showModal();position();window.addEventListener('resize',position);dialog.querySelector('[data-background-category="'+category+'"]').focus();
 }
 return{open,destroy:()=>currentClose?.()};
})();
