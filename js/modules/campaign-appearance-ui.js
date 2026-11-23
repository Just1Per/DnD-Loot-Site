'use strict';
/* Campaign-wide presentation only. Preview never saves or dirties a character. */
var CampaignAppearanceUI=(()=>{
 let subscription=null,key='',generation=0,editor=null;
 const previous=new Map();let metadata=null;
 const actor=()=>auth.currentUser?.uid;
 const current=s=>!!s&&s.uid===actor()&&s.campaignId===activeCampaign?.id;
 function apply(raw){
  const root=document.documentElement;
  for(const [name,old]of previous){if(old.value)root.style.setProperty(name,old.value,old.priority);else root.style.removeProperty(name);}previous.clear();
  root.removeAttribute('data-campaign-appearance');
  const data=CampaignAppearance.read(raw),tokens=CampaignAppearance.tokens(data);
  for(const [name,value]of Object.entries(tokens)){previous.set(name,{value:root.style.getPropertyValue(name),priority:root.style.getPropertyPriority(name)});root.style.setProperty(name,value);}
  if(Object.keys(tokens).length)root.dataset.campaignAppearance=data.preset;
  const meta=document.querySelector('meta[name="theme-color"]');
  if(meta){if(metadata===null)metadata=meta.content;meta.content=tokens['--theme-header']||metadata;}
 }
 function status(message,error=false){const node=editor?.dialog.querySelector('[data-appearance-status]');if(node){node.textContent=message;node.setAttribute('role',error?'alert':'status');}}
 function close(restoreFocus=true){
  const old=editor;editor=null;
  if(old){if(old.dialog.open)old.dialog.close();old.dialog.remove();if(restoreFocus&&old.opener?.isConnected)old.opener.focus();}
  apply(activeCampaign?.appearance);
 }
 function clear(){
  ++generation;subscription?.();subscription=null;key='';
  const old=editor;editor=null;if(old){if(old.dialog.open)old.dialog.close();old.dialog.remove();}
  apply(null);
 }
 function receive(campaignId,uid,data){
  if(activeCampaign?.id!==campaignId||actor()!==uid)return;
  activeCampaign={...activeCampaign,appearance:data};
  const index=campaigns.findIndex(row=>row.id===campaignId);if(index>=0)campaigns[index]={...campaigns[index],appearance:data};
  if(!editor?.preview)apply(data);
  if(editor&&editor.revision!==CampaignAppearance.read(data).revision&&!editor.busy)status('The saved appearance changed. Close and reopen this editor before saving; your preview has not been saved.',true);
  const label=document.querySelector('[data-campaign-appearance-name]');if(label)label.textContent=CampaignAppearance.presets[data?.preset]?.label||(!data?'Classic':'Custom');
 }
 function sync(){
  const campaign=activeCampaign,uid=actor(),next=campaign&&uid?uid+':'+campaign.id:'';
  if(next===key){if(editor&&!canManageCampaign())close(false);return;}
  clear();if(!next)return;
  key=next;apply(campaign.appearance);const token=generation,sdk=globalThis.__DND_VAULT_DEPS__;
  if(sdk?.onSnapshot)subscription=sdk.onSnapshot(sdk.doc(sdk.db,'campaigns',campaign.id),snapshot=>{
   if(token!==generation||key!==next||actor()!==uid||activeCampaign?.id!==campaign.id)return;
   if(!snapshot.exists()||snapshot.data().deletedAt){clear();return;}
   receive(campaign.id,uid,snapshot.data().appearance);
  },()=>{if(token===generation&&key===next)clear();});
 }
 function mountSettings(){
  sync();const host=document.querySelector('#campaignSettingsPanel .dm-tools-grid');
  if(!host||!activeCampaign||!canManageCampaign()||host.querySelector('[data-campaign-appearance-card]'))return;
  const section=document.createElement('section');section.className='dm-tool-card';section.dataset.dmSettingsCard='';section.dataset.campaignAppearanceCard='';
  section.innerHTML='<h2>Campaign appearance</h2><p>Choose button, page background and accent colours for everyone in this campaign. Content panels and printed sheets stay light and readable.</p><p>Saved look: <strong data-campaign-appearance-name></strong></p><button type="button" class="btn-primary" data-edit-campaign-appearance>Change appearance</button>';
  section.querySelector('[data-campaign-appearance-name]').textContent=CampaignAppearance.presets[activeCampaign.appearance?.preset]?.label||(!activeCampaign.appearance?'Classic':'Custom');
  section.querySelector('button').addEventListener('click',open);
  const settings=host.querySelector('[data-dm-settings-card]:not(.dm-tool-card--wide)');if(settings)settings.after(section);else host.append(section);
 }
 function open(event){
  if(!activeCampaign||!canManageCampaign()||!actor())return;
  if(editor){editor.dialog.focus();return;}
  const data=CampaignAppearance.read(activeCampaign.appearance),dialog=document.createElement('dialog');
  dialog.id='campaignAppearanceDialog';dialog.className='campaign-appearance-dialog';dialog.dataset.noContextHelp='';dialog.setAttribute('aria-labelledby','campaignAppearanceTitle');dialog.setAttribute('aria-describedby','campaignAppearanceHelp');
  const s={uid:actor(),campaignId:activeCampaign.id,revision:data.revision,dialog,opener:event?.currentTarget,preview:false,busy:false};editor=s;
  dialog.innerHTML=`<form novalidate>
   <h2 id="campaignAppearanceTitle">Campaign appearance</h2>
   <p id="campaignAppearanceHelp">Set the look for everyone in this campaign. Other campaigns and the dashboard keep their own colours.</p>
   <label for="campaignAppearancePreset">Preset</label><select id="campaignAppearancePreset" name="preset">${Object.entries(CampaignAppearance.presets).map(([id,row])=>'<option value="'+id+'">'+row.label+'</option>').join('')}<option value="custom">Custom</option></select>
   <fieldset><legend>Main colours</legend>${[['primary','Buttons'],['background','Page background'],['accent','Accent']].map(([name,label])=>`<div class="campaign-colour-row"><label for="campaignColour-${name}">${label}</label><input id="campaignColour-${name}" type="color" data-colour-picker="${name}" aria-label="${label} colour picker"><input name="${name}" type="text" maxlength="7" pattern="#[0-9a-fA-F]{6}" required spellcheck="false" aria-label="${label} hex colour" aria-describedby="campaignColourHelp"></div>`).join('')}</fieldset>
   <p id="campaignColourHelp">Enter a hex colour such as #0b5b86. Text, button and hover shades adjust for readability. Content panels stay light and character paper stays white.</p>
   <p data-appearance-status role="status" aria-live="polite">Preview affects only your screen until you save.</p>
   <div class="campaign-appearance-actions"><button type="button" data-appearance-preview>Preview</button><button type="button" data-appearance-reset>Reset to Classic</button><button type="button" data-appearance-cancel>Cancel</button><button type="submit" class="btn-primary">Save appearance</button></div>
  </form>`;
  document.body.append(dialog);
  const form=dialog.querySelector('form'),preset=dialog.querySelector('[name=preset]');
  const fill=row=>{preset.value=row.preset;for(const name of ['primary','background','accent']){form.elements.namedItem(name).value=row[name];dialog.querySelector('[data-colour-picker='+name+']').value=row[name];}};
  const draft=()=>CampaignAppearance.normalize({schemaVersion:1,preset:preset.value,revision:s.revision,...Object.fromEntries(['primary','background','accent'].map(name=>[name,form.elements.namedItem(name).value.trim()]))});
  const valid=()=>current(s)&&canManageCampaign()&&editor===s;
  const preview=()=>{if(!valid()||!form.reportValidity())return;apply(draft());s.preview=true;status('Preview is only on your screen. Save to share it, or Cancel to restore the saved look.');};
  fill(data);
  preset.addEventListener('change',()=>{if(CampaignAppearance.presets[preset.value])fill(CampaignAppearance.preset(preset.value,s.revision));status('Colours selected. Preview them before saving.');});
  for(const name of ['primary','background','accent']){
   const input=form.elements.namedItem(name),picker=dialog.querySelector('[data-colour-picker='+name+']');
   picker.addEventListener('input',()=>{input.value=picker.value;preset.value='custom';status('Custom colours selected. Preview them before saving.');});
   input.addEventListener('input',()=>{preset.value='custom';if(/^#[0-9a-f]{6}$/i.test(input.value))picker.value=input.value;});
  }
  dialog.querySelector('[data-appearance-preview]').addEventListener('click',preview);
  dialog.querySelector('[data-appearance-reset]').addEventListener('click',()=>{fill(CampaignAppearance.preset('classic',s.revision));status('Classic selected. Preview or Save appearance to apply it.');});
  dialog.querySelector('[data-appearance-cancel]').addEventListener('click',()=>close());
  dialog.addEventListener('cancel',event=>{event.preventDefault();if(!s.busy)close();});
  form.addEventListener('submit',async event=>{
   event.preventDefault();if(s.busy||!valid()||!form.reportValidity())return;
   const input=draft();s.busy=true;form.setAttribute('aria-busy','true');for(const control of form.elements)control.disabled=true;status('Saving campaign appearance…');
   try{
    const saved=await createCampaignAppearanceStore(globalThis.__DND_VAULT_DEPS__).save(s.campaignId,input);
    if(!valid())return;receive(s.campaignId,s.uid,saved);close();mountSettings();
   }catch(error){if(valid())status('Could not save appearance. Your choices are still here. '+error.message,true);}
   finally{if(editor===s){s.busy=false;form.removeAttribute('aria-busy');for(const control of form.elements)control.disabled=false;}}
  });
  dialog.showModal();preset.focus();
 }
 return {sync,clear,mountSettings,open,apply};
})();
