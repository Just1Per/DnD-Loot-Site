'use strict';
/* One-shot and automatic HP choices from the original sheet's Set Max HP menu. */
function characterHPCurrent(session){return sheetSession===session&&session?.uid===auth.currentUser?.uid&&session.campaignId===activeCampaign?.id;}
function applyCharacterHPMaximum(value,session=sheetSession){
 if(!characterHPCurrent(session))throw Error('This character session is no longer active.');
 const maximum=CharacterHitPointOptions.maximum(value);readSheetForm();
 const derived=CharacterSheetModel.derive(session.data,session.identity.level,sheetEquipmentLoot());
 if(session.data.adobe.hpMode==='manual'){session.data.hpMax=maximum;session.data.adobe.hpOverride=null;}
 else session.data.adobe.hpOverride=CharacterHitPointOptions.setOnce(maximum,derived.progression.hp.options);
 session.dirty=true;fillSheetForm();updateSheetCalculations();sheetStatus('Maximum HP updated. Current HP is unchanged. Save sheet to keep it.');
}
function applyCharacterHPMode(mode,value,session=sheetSession){
 if(!characterHPCurrent(session)||!CharacterHitPointOptions.modes.includes(mode))throw Error('This HP choice is no longer available.');
 const maximum=mode==='manual'?CharacterHitPointOptions.maximum(value):null;readSheetForm();session.data.adobe.hpMode=mode;session.data.adobe.hpOverride=null;if(maximum!==null)session.data.hpMax=maximum;
 session.dirty=true;fillSheetForm();updateSheetCalculations();sheetStatus('HP calculation updated. Current HP is unchanged. Save sheet to keep it.');
}
function openCharacterHitPointMenu(anchor){
 const session=sheetSession;if(!anchor?.isConnected||!characterHPCurrent(session)||session.saving||!CharacterAdobeView.active()||!CharacterAdobeView.validate())return;
 readSheetForm();const hp=CharacterSheetModel.derive(session.data,session.identity.level,sheetEquipmentLoot()).progression.hp;
 const signature=()=>JSON.stringify({data:CharacterSheetModel.normalize(session.data),identity:session.identity,loot:sheetEquipmentLoot()}),snapshot=signature();
 const allowed=()=>characterHPCurrent(session)&&!session.saving&&CharacterAdobeView.active()&&signature()===snapshot;
 const labels={average:'The total average HP',fixed:'The total HP when using fixed values',max:'The total maximum HP'};
 const leaf=(id,label,select,extra={})=>({id,label,...extra,closeBefore:true,select:()=>{if(!allowed())return;try{anchor.blur();select();}catch(error){if(characterHPCurrent(session))sheetStatus(error.message,true);}finally{if(anchor.isConnected&&!document.getElementById('sheetHitPointOptions'))anchor.focus({preventScroll:true});}}});
 const choices=CharacterHitPointOptions.choices(hp.options);
 return CharacterAdobeFlyoutMenu.open(anchor,{id:'adobeHitPointMenu',title:'Set Max HP',isCurrent:allowed,onStale:()=>{if(characterHPCurrent(session))sheetStatus('The character changed. Open Set Max HP again.',true);},items:[
  {id:'once',label:'Change the Max HP to',items:[...choices.map(row=>leaf('once-'+row.mode,labels[row.mode]+' ('+row.max+')',()=>applyCharacterHPMaximum(row.max,session),{attributes:{'data-hp-once':String(row.max)}})),{separator:true},leaf('enter','A value I enter…',()=>openCharacterHitPointOptions({maximumOnly:true,opener:anchor})),leaf('options','Recorded rolls & other HP options…',()=>openCharacterHitPointOptions({opener:anchor}))]},
  {id:'automatic',label:'Set the Max HP to automatically assume',items:[...choices.map(row=>leaf('mode-'+row.mode,labels[row.mode]+' ('+row.max+')',()=>applyCharacterHPMode(row.mode,null,session),{checked:()=>hp.mode===row.mode,attributes:{'data-hp-auto':row.mode}})),leaf('mode-manual',"Don't change the maximum HP automatically",()=>applyCharacterHPMode('manual',hp.max,session),{checked:()=>hp.mode==='manual',attributes:{'data-hp-auto':'manual'}})]}
 ]});
}
function openCharacterHitPointOptions({maximumOnly=false,opener=document.activeElement?.shadowRoot?.activeElement||document.activeElement}={}){
 const session=sheetSession;if(!characterHPCurrent(session)||!CharacterAdobeView.validate())return;
 const invalid=document.querySelector('#sheetHPManual [aria-invalid="true"]');if(invalid){invalid.focus();return;}
 readSheetForm();const derived=CharacterSheetModel.derive(session.data,session.identity.level,sheetEquipmentLoot()),hp=derived.progression.hp,labels={average:'Adobe average',fixed:'Fixed values',max:'Maximum dice',rolled:'Recorded rolls',manual:'Manual maximum HP'};
 document.getElementById('sheetHitPointOptions')?.remove();const dialog=document.createElement('dialog');dialog.id='sheetHitPointOptions';dialog.className='vault-dialog sheet-hp-options';dialog.setAttribute('aria-labelledby','sheetHitPointOptionsTitle');dialog.setAttribute('data-no-context-help','');
 const signature=()=>JSON.stringify({data:CharacterSheetModel.normalize(session.data),identity:session.identity,loot:sheetEquipmentLoot()}),snapshot=signature();
 const allowed=()=>characterHPCurrent(session)&&!session.saving&&dialog.isConnected&&(!maximumOnly||opener?.isConnected)&&signature()===snapshot,close=()=>{if(dialog.open)dialog.close();dialog.remove();if(opener?.isConnected)opener.focus();};
 if(maximumOnly){
  dialog.innerHTML='<h2 id="sheetHitPointOptionsTitle">Change maximum HP</h2><label class="sheet-field"><span>Maximum HP</span><input type="number" min="0" max="1000000" step="1" data-hp-value value="'+hp.max+'"></label><p class="sheet-help">'+(hp.mode==='manual'?'Manual keeps this final total.':'Automatic calculation resumes when HP-related build choices change.')+' Current HP is unchanged.</p><p data-hp-status role="status"></p><button type="button" data-hp-set>Set maximum HP</button><button type="button" data-hp-done>Cancel</button>';
  const input=dialog.querySelector('[data-hp-value]'),apply=()=>{if(!allowed()){close();return;}let value;try{value=CharacterHitPointOptions.maximum(input.value);}catch(error){input.setCustomValidity(error.message);input.setAttribute('aria-invalid','true');dialog.querySelector('[data-hp-status]').textContent=error.message;input.focus();return;}close();opener?.blur();applyCharacterHPMaximum(value,session);if(opener?.isConnected)opener.focus({preventScroll:true});};
  input.oninput=()=>{input.setCustomValidity('');input.removeAttribute('aria-invalid');dialog.querySelector('[data-hp-status]').textContent='';};input.onkeydown=event=>{if(event.key==='Enter'){event.preventDefault();apply();}};dialog.querySelector('[data-hp-set]').onclick=apply;dialog.querySelector('[data-hp-done]').onclick=close;
  dialog.addEventListener('cancel',event=>{event.preventDefault();close();});dialog.addEventListener('close',()=>dialog.remove());document.getElementById('characterSheetDialog').append(dialog);dialog.showModal();input.focus();input.select();return;
 }
 dialog.innerHTML='<h2 id="sheetHitPointOptionsTitle">Maximum HP options</h2><p class="sheet-help">Current maximum <strong>'+hp.max+'</strong> · '+labels[hp.mode]+(hp.once?' · set once':'')+'. Changing maximum HP does not heal or reset combat resources.</p><section><h3>Set maximum once</h3><p class="sheet-help">Use a total now. Automatic calculation resumes when HP-related build choices change. Manual keeps this total.</p><div class="sheet-hp-choice-grid">'+CharacterHitPointOptions.choices(hp.options).map(row=>'<button type="button" data-hp-once="'+row.max+'"><span>'+labels[row.mode]+'</span><strong>'+row.max+' HP</strong></button>').join('')+'</div></section><section><h3>Automatic updates</h3><label class="sheet-field"><span>Update method</span><select data-hp-mode>'+CharacterHitPointOptions.modes.map(mode=>'<option value="'+mode+'" '+(mode===hp.mode?'selected':'')+'>'+labels[mode]+'</option>').join('')+'</select></label><label class="sheet-field" data-hp-manual-label><span>Manual maximum HP</span><input type="number" min="0" max="1000000" step="1" data-hp-manual value="'+hp.max+'"></label><p class="sheet-help">Manual keeps your entered final total, including bonuses. Your recorded rolls are retained.</p><button type="button" data-hp-apply>Apply update setting</button></section><p data-hp-status role="status"></p><button type="button" data-hp-done>Done</button>';
 const mode=dialog.querySelector('[data-hp-mode]'),manual=dialog.querySelector('[data-hp-manual]'),update=()=>{dialog.querySelector('[data-hp-manual-label]').hidden=mode.value!=='manual';manual.disabled=mode.value!=='manual';manual.setCustomValidity('');dialog.querySelector('[data-hp-status]').textContent='';};mode.onchange=update;update();
 dialog.querySelector('[data-hp-done]').onclick=close;dialog.querySelector('[data-hp-apply]').onclick=()=>{if(!allowed()){close();return;}try{if(mode.value==='manual')CharacterHitPointOptions.maximum(manual.value);const nextMode=mode.value,value=manual.value;close();applyCharacterHPMode(nextMode,value,session);}catch(error){manual.setCustomValidity(error.message);manual.setAttribute('aria-invalid','true');dialog.querySelector('[data-hp-status]').textContent=error.message;manual.focus();}};
 manual.oninput=()=>{manual.setCustomValidity('');manual.removeAttribute('aria-invalid');};
 for(const button of dialog.querySelectorAll('[data-hp-once]'))button.onclick=()=>{if(!allowed()){close();return;}const value=button.dataset.hpOnce;close();applyCharacterHPMaximum(value,session);};
 dialog.addEventListener('cancel',event=>{event.preventDefault();close();});dialog.addEventListener('close',()=>dialog.remove());document.body.append(dialog);dialog.showModal();dialog.querySelector('[data-hp-once]')?.focus();
}
