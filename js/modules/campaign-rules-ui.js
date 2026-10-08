'use strict';
async function renderCampaignRulesTools(){
 document.getElementById('dmCampaignRules')?.remove();
 const campaign=activeCampaign;if(!campaign||!canManageCampaign())return;
 const grid=document.querySelector('#dmToolsPanel .dm-tools-grid');if(!grid)return;
 document.getElementById('dmCampaignRules')?.remove();
 const host=document.createElement('section');host.id='dmCampaignRules';host.className='dm-tool-card dm-tool-card--wide';
 host.innerHTML='<h2>Campaign rules & feat catalogue</h2><p>Choose the rules players can browse. Hidden editions and feats are removed from new choices; existing character selections are preserved. Changes apply only to this campaign.</p><label>Available rules<select id="dmAllowedEditions"><option value="both">2014 and 2024</option><option value="2014">2014 only</option><option value="2024">2024 only</option></select></label><div class="dm-tool-actions"><button type="button" data-save-editions>Save rules</button><button type="button" data-new-campaign-feat>+ Custom feat</button><button type="button" data-reset-campaign-feats>Reset feats to default</button></div><p data-rules-status role="status"></p><label>Find feat<input type="search" data-feat-search placeholder="Name…"></label><label>Campaign feat<select data-campaign-feat></select></label><div data-campaign-feat-editor></div>';
 grid.append(host);host.querySelector('#dmAllowedEditions').value=CampaignRules.editions(campaign).length===2?'both':CampaignRules.editions(campaign)[0];
 const status=message=>host.querySelector('[data-rules-status]').textContent=message;
 const valid=()=>activeCampaign?.id===campaign.id&&canManageCampaign()&&host.isConnected;
 const refresh=()=>{if(sheetSession?.campaignId===campaign.id){readSheetForm();renderCharacterSheet();}renderCards();};
 if(!CampaignRules.policyAvailable(campaign)){status('Publish the updated firestore.rules to enable campaign rules and feat editing. Existing character sheets remain available.');host.querySelectorAll('button,input,select').forEach(control=>control.disabled=true);return;}
 try{await CharacterCatalog.load();}catch(error){status(error.message);return;}if(!valid())return;
 const choose=host.querySelector('[data-campaign-feat]');let currentId='';
 function list(){
  const search=host.querySelector('[data-feat-search]').value.trim().toLowerCase();
  const rows=CampaignRules.feats(CharacterCatalog.rawData.feats,campaign,true).filter(f=>CampaignRules.allowed(f,campaign)&&f.name.toLowerCase().includes(search));
  choose.innerHTML='<option value="">Choose a feat to edit</option>'+rows.map(f=>`<option value="${escapeHtml(f.id)}">${escapeHtml(f.name)} · ${f.edition}${f.hidden?' · hidden':''}${f.custom?' · custom':''}</option>`).join('');choose.value=currentId;
 }
 function editor(id){
  currentId=id;const old=id?CharacterCatalog.find(id,'feats'):null;if(id&&!old)return;
  const custom=!old||old.custom,fields=host.querySelector('[data-campaign-feat-editor]');
  fields.innerHTML=`<div class="sheet-grid two"><label class="sheet-field">Name<input data-feat-name maxlength="160" value="${escapeHtml(old?.name||'')}"></label><label class="sheet-field">Edition<select data-feat-edition ${custom?'':'disabled'}>${CampaignRules.editions(campaign).map(v=>`<option value="${v}">${v}</option>`).join('')}</select></label></div><label class="sheet-field">Description<textarea data-feat-description rows="5" maxlength="12000">${escapeHtml(old?.description||featOverviewDescription(id)||'')}</textarea></label>${custom?`<details><summary>Automatic bonuses (optional)</summary><p>Only these explicit bonuses affect calculations; description text does not grant mechanics.</p><div class="sheet-grid"><label class="sheet-field">Minimum character level<input data-feat-min type="number" min="0" max="20" value="${old?.minimumLevel||0}"></label><label class="sheet-field">HP per character level<input data-feat-hp type="number" min="0" max="10" value="${old?.hpPerLevel||0}"></label><label class="sheet-field">Walking speed bonus (ft)<input data-feat-speed type="number" min="0" max="60" value="${old?.speedBonus||0}"></label></div><div class="sheet-inline-controls">${['light','medium','heavy','shield'].map(v=>`<label><input type="checkbox" data-feat-armor="${v}" ${old?.armorTraining?.includes(v)?'checked':''}>${escapeHtml(v)} armor training</label>`).join('')}</div></details>`:'<p>Bundled mechanical benefits are preserved. This editor changes the campaign name and description.</p>'}<div class="dm-tool-actions"><button type="button" data-save-campaign-feat>Save feat</button>${id?`<button type="button" data-hide-campaign-feat>${old.hidden?'Restore availability':'Remove from player catalogue'}</button>`:''}</div>${id&&custom?`<label>Assign custom feat to character<select data-feat-character><option value="">Choose character</option>${characters.map(c=>`<option value="${escapeHtml(c.id)}">${escapeHtml(c.name)}</option>`).join('')}</select></label><button type="button" data-assign-campaign-feat>Assign feat</button>`:''}`;
  fields.querySelector('[data-feat-edition]').value=old?.edition||CampaignRules.editions(campaign)[0];
  async function save(hidden=old?.hidden||false){
   if(!valid())return;
   const name=fields.querySelector('[data-feat-name]').value.trim();if(!name)return status('Enter a feat name.');
   const get=selector=>fields.querySelector(selector)?.value||0;
   for(const selector of ['[data-feat-min]','[data-feat-hp]','[data-feat-speed]']){const input=fields.querySelector(selector);if(input&&(!Number.isInteger(Number(input.value))||!input.checkValidity()))return status('Enter a whole number within the displayed limits.');}
   const next=CampaignRules.normalize({name,description:fields.querySelector('[data-feat-description]').value,edition:get('[data-feat-edition]'),hidden,custom,minimumLevel:custom?get('[data-feat-min]'):old.minimumLevel,hpPerLevel:custom?get('[data-feat-hp]'):0,speedBonus:custom?get('[data-feat-speed]'):0,armorTraining:[...fields.querySelectorAll('[data-feat-armor]')].filter(v=>v.checked).map(v=>v.dataset.featArmor)});
   const key=id||'custom-'+crypto.randomUUID();
   if(!id&&CampaignRules.records(campaign).length>=100)return status('Campaign feat limit reached (100 changes).');
   try{await setDoc(doc(db,'campaigns',campaign.id,'featCatalog',key),next);if(!valid())return;CampaignRules.setOverrides(campaign.id,CampaignRules.records(campaign).filter(r=>r.id!==key).concat({id:key,...next}));list();editor(key);refresh();status('Campaign feat saved. Existing character selections are preserved.');}catch(error){status(error.message);}
  }
  fields.querySelector('[data-save-campaign-feat]').onclick=()=>save();
  fields.querySelector('[data-hide-campaign-feat]')?.addEventListener('click',()=>save(!old.hidden));
  fields.querySelector('[data-assign-campaign-feat]')?.addEventListener('click',async()=>{
   if(!valid())return;const characterId=fields.querySelector('[data-feat-character]').value;if(!characterId)return status('Choose a character.');
   if(sheetSession?.campaignId===campaign.id&&sheetSession.characterId===characterId&&sheetSession.dirty)return status('Save or close that character sheet first.');
   try{const identitySnap=await getDoc(doc(db,'campaigns',campaign.id,'characters',characterId)),stored=await characterSheetStore.load(campaign.id,characterId);if(!valid()||!identitySnap.exists())return;
    const previous=identitySnap.data(),data=CharacterSheetModel.normalize(stored.data);if(data.rulesChoices.feats.includes(id))return status('This character already has that feat.');if(data.rulesChoices.feats.length>=30)return status('Character feat limit reached.');
    if((data.rulesChoices.grants.__dm?.bonusFeats||0)>=10)throw new Error('This character already has the maximum 10 bonus feat allowances.');data.rulesChoices.feats.push(id);data.rulesChoices.grants.__dm||={bonusFeats:0,bonusAsis:0,usedAsis:0};data.rulesChoices.grants.__dm.bonusFeats=Math.min(10,(data.rulesChoices.grants.__dm.bonusFeats||0)+1);
    const identity={name:previous.name,class:previous.class,level:previous.level};await characterSheetStore.save({campaignId:campaign.id,characterId,revision:stored.revision||0,data,identity,previousIdentity:identity});if(valid()){status('Custom feat assigned. Reopen the character sheet to load it.');if(sheetSession?.characterId===characterId)await openCharacterSheet(characterId);}
   }catch(error){status(error.message);}
  });
 }
 host.querySelector('[data-feat-search]').oninput=list;choose.onchange=()=>{if(choose.value)editor(choose.value);};host.querySelector('[data-new-campaign-feat]').onclick=()=>editor('');list();
 host.querySelector('[data-save-editions]').onclick=async()=>{
  if(!valid())return;const value=host.querySelector('#dmAllowedEditions').value,allowedEditions=value==='both'?['2014','2024']:[value];
  try{await updateDoc(doc(db,'campaigns',campaign.id),{allowedEditions,updatedAt:Date.now()});if(!valid())return;campaign.allowedEditions=allowedEditions;activeCampaign={...activeCampaign,allowedEditions};const index=campaigns.findIndex(c=>c.id===campaign.id);if(index>=0)campaigns[index].allowedEditions=allowedEditions;list();refresh();status('Allowed rules saved. Existing characters have not been changed.');}catch(error){status(error.message);}
 };
 host.querySelector('[data-reset-campaign-feats]').onclick=async()=>{
  if(!valid()||!confirm('Restore standard feat availability and descriptions for this campaign? Custom feats will be archived, preserving existing character selections.'))return;
  try{const batch=writeBatch(db);for(const row of CampaignRules.records(campaign)){const ref=doc(db,'campaigns',campaign.id,'featCatalog',row.id);row.custom?batch.set(ref,{...CampaignRules.normalize(row),hidden:true}):batch.delete(ref);}await batch.commit();if(!valid())return;CampaignRules.setOverrides(campaign.id,CampaignRules.records(campaign).filter(r=>r.custom).map(r=>({...r,hidden:true})));currentId='';host.querySelector('[data-campaign-feat-editor]').innerHTML='';list();refresh();status('Standard feats restored. Custom feat records are preserved for existing characters.');}catch(error){status(error.message);}
 };
}
