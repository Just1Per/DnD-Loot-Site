'use strict';
/* Original item-choice menu with a read-only mechanical preview and explicit Apply. */
var CharacterMagicVariantUI=(()=>{
 function install({dialog,row,session,derived,allowed,guard,refresh,status}){
  if(!row||row.unavailable)return;const id=row.entry.id,source=CharacterMagicItemChoices.original(row.entry),options=CharacterMagicItemChoices.options(source.item);if(!options.length)return;
  const current=session.data.equipmentState.loadout.find(value=>value.id===id)?.magicVariant||'',esc=sheetEscape,section=document.createElement('section');section.className='sheet-magic-variant';section.dataset.noContextHelp='';
  const generic=!options.some(value=>value.name.toLowerCase()===String(source.item.name).toLowerCase());
  section.innerHTML='<details '+(generic&&!current?'open':'')+'><summary>Choose item variant</summary><p class="sheet-help">Choose the type awarded by your DM. Preview first, then Apply. Wearing and attunement are separate choices.</p><label class="sheet-field">Item type<select data-magic-variant aria-label="Item variant"><option value="">Use original item · '+esc(source.item.name)+'</option>'+options.map(value=>'<option value="'+value.id+'" '+(value.id===current?'selected':'')+'>'+esc(value.label)+'</option>').join('')+'</select></label><div class="sheet-magic-variant-preview" data-variant-preview role="status" aria-live="polite"></div><button type="button" data-variant-apply disabled>Apply item variant</button><p class="sheet-help">Quantity, weight, coins and recorded uses are retained. Save sheet keeps the choice.</p></details>';
  const body=dialog.querySelector('.sheet-magic-body');body.insertBefore(section,body.querySelector('.sheet-magic-state'));
  const select=section.querySelector('select'),preview=section.querySelector('[data-variant-preview]'),apply=section.querySelector('button');select.value=current;let draft=null;
  const plan=(value=select.value)=>{const loadout=CharacterMagicItemChoices.choose(session.data.equipmentState.loadout,sheetEquipmentLoot(),id,value);return{...session.data.equipmentState,loadout:CharacterEquipment.choices({loadout}).loadout};};
  select.onchange=()=>{
   if(!guard())return;draft=null;apply.disabled=true;if(select.value===current){preview.textContent='Current choice is unchanged.';return;}
   try{
    draft=plan();const result=CharacterSheetModel.derive({...session.data,equipmentState:draft},session.identity.level,sheetEquipmentLoot()),variant=options.find(value=>value.id===select.value),active=result.magicItems.active.find(value=>value.entry.id===id&&value.magicActive),limited=result.magicItems.warnings.some(value=>value.startsWith((variant?.name||source.item.name)+': exceeds '));
    preview.innerHTML='<h4>'+esc(variant?.name||source.item.name)+'</h4><p>'+esc(variant?.summary||'Restore the original item’s type and automatic effects.')+'</p>'+(options[0].id.startsWith('belt-')?'<p>Character STR: <strong>'+derived.scores.str+' → '+result.scores.str+'</strong></p>':'<p>Character resistances: '+esc((result.effects.resistances||[]).join(', ')||'none')+'</p>')+'<p>'+(!variant&&generic?'The original item needs a type choice before its variant effect can be applied.':active?'Automatic item effects are active.':limited?'Automatic item effects are inactive: the shared attunement limit is reached.':'Automatic item effects require wearing and attunement.')+'</p>';
    apply.disabled=false;
   }catch(error){preview.textContent=error.message;}
  };
  apply.onclick=async()=>{
   if(!draft||!guard())return;const value=select.value,variant=options.find(option=>option.id===value);
   if(!await SiteConfirmation.ask({title:'Apply this item variant?',paragraphs:[variant?.name||source.item.name,variant?.summary||'Restore the original item type.','Use the type awarded by your DM. Quantity, weight, wearing, attunement and recorded uses stay unchanged.'],confirmLabel:'Apply variant',isCurrent:allowed}))return;
   if(!guard())return;try{session.data.equipmentState=plan(value);session.dirty=true;fillSheetForm();updateSheetCalculations();sheetStatus('Item variant updated. Save sheet to keep it.');refresh();dialog.querySelector('[data-magic-save]').focus();}catch(error){status.textContent=error.message;}
  };
 }
 return{install};
})();
