'use strict';
/* The paper Tool row and Standard share one check, the same totals and save path. */
function characterToolCheckCurrent(session){return !!(session&&session===sheetSession&&session.uid===auth.currentUser?.uid&&session.campaignId===activeCampaign?.id);}
function applyCharacterToolCheck(field,value,session=sheetSession){
 if(!characterToolCheckCurrent(session))throw Error('This character session is no longer active.');
 readSheetForm();const derived=CharacterSheetModel.derive(session.data,session.identity.level,sheetEquipmentLoot());
 const next=CharacterToolChecks.edit(session.data.adobe.customToolCheck,field,value,{...derived,proficiencies:session.data.proficiencies});
 session.data.adobe.customToolCheck=next;session.dirty=true;updateSheetCalculations();sheetStatus('Custom check updated. Save sheet to keep changes.');return true;
}
function renderCharacterToolCheck(derived){
 const session=sheetSession,parent=document.getElementById('sheet-skills');if(!parent||!session)return;
 let host=document.getElementById('sheetCustomToolCheck');
 if(!host){
  host=document.createElement('details');host.id='sheetCustomToolCheck';host.className='sheet-editor-box';
  host.innerHTML='<summary>Custom tool / ability check <span data-custom-tool-summary></span></summary><p class="sheet-help" id="sheetCustomToolHelp">Name the check and choose the ability your DM calls for. On the paper, the ability appears in parentheses: Thieves’ Tools (Dex). Existing tool training is included automatically.</p><div class="sheet-custom-tool-fields"><label class="sheet-field"><span>Tool / check name</span><input type="text" maxlength="200" data-custom-tool="name" aria-describedby="sheetCustomToolHelp"></label><label class="sheet-field"><span>Check ability</span><select data-custom-tool="ability"><option value="">Choose ability</option>'+Object.entries(CharacterSheetModel.abilities).map(([value,label])=>'<option value="'+value+'">'+sheetEscape(label)+'</option>').join('')+'</select></label></div><div class="sheet-custom-tool-training"><label class="sheet-check"><input type="checkbox" data-custom-tool="proficient"><span>Proficient</span></label><label class="sheet-check"><input type="checkbox" data-custom-tool="expertise"><span>Expertise</span></label></div><p><output data-custom-tool-total></output></p><p class="sheet-help" data-custom-tool-training></p><details><summary>Check adjustment</summary><label class="sheet-field sheet-custom-tool-adjustment"><span>Additional check bonus</span><input type="number" min="-30" max="30" step="1" data-custom-tool="bonus"></label><p class="sheet-help">Record only an agreed extra bonus here. Ability and proficiency are already included.</p></details><p data-custom-tool-status role="status"></p>';
  parent.append(host);
  for(const input of host.querySelectorAll('[data-custom-tool]')){
   input.oninput=()=>{if(characterToolCheckCurrent(session)&&input.isConnected){session.dirty=true;sheetStatus('Unsaved changes');}};
   input.onchange=()=>{if(!characterToolCheckCurrent(session)||!input.isConnected||!host.isConnected)return;try{input.removeAttribute('aria-invalid');input.setCustomValidity('');applyCharacterToolCheck(input.dataset.customTool,input.type==='checkbox'?input.checked:input.value,session);host.querySelector('[data-custom-tool-status]').textContent='';}catch(error){input.setAttribute('aria-invalid','true');input.setCustomValidity(error.message);host.querySelector('[data-custom-tool-status]').textContent=error.message;sheetStatus(error.message,true);}};
  }
 }
 const row=derived?.customToolCheck;if(!row)return;
 for(const input of host.querySelectorAll('[data-custom-tool]')){
  const field=input.dataset.customTool;if(input===document.activeElement||input.getAttribute('aria-invalid')==='true')continue;
  if(input.type==='checkbox')input.checked=row.rank>=(field==='expertise'?2:1);else input.value=String(row[field]??'');
 }
 host.querySelector('[data-custom-tool="proficient"]').disabled=row.automaticRank>=1;host.querySelector('[data-custom-tool="expertise"]').disabled=row.automaticRank>=2;
 host.querySelector('[data-custom-tool-summary]').textContent=row.name&&row.total!==null?'· '+CharacterSheetModel.signed(row.total):'';
 host.querySelector('[data-custom-tool-total]').textContent=row.total===null?'Choose an ability to calculate the check.':'Check bonus '+CharacterSheetModel.signed(row.total)+' · '+row.ability.toUpperCase()+' '+CharacterSheetModel.signed(row.modifier)+' · '+row.trainingLabel+' '+CharacterSheetModel.signed(row.contribution)+(row.bonus?' · adjustment '+CharacterSheetModel.signed(row.bonus):'');
 host.querySelector('[data-custom-tool-training]').textContent=row.automaticRank?'Training comes from your existing tool proficiencies or class choices. Change that original choice to remove it.':'Manual proficiency and expertise apply to this check. Other conditional bonuses can use Check adjustment.';
}
const characterToolCheckBaseSetup=window.setupCharacterPlayUI;
window.setupCharacterPlayUI=function(...args){const result=characterToolCheckBaseSetup?.apply(this,args);renderCharacterToolCheck();return result;};
const characterToolCheckBaseUpdate=window.updateCharacterPlayUI;
window.updateCharacterPlayUI=function(...args){const result=characterToolCheckBaseUpdate?.apply(this,args);renderCharacterToolCheck(args[0]);return result;};
