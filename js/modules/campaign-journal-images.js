'use strict';
// Images are private campaign-entry references, never global catalogue assets.
// Explicit player publication is a separate workflow: never expose these private paths.
var CampaignJournalImages=(()=>{
 const sdk=window.__DND_VAULT_DEPS__;
 const kinds=['world','creature','chapter','encounter'];
 const allowedTypes=['image/png','image/jpeg','image/webp'];
 const escape=v=>escapeHtml(String(v??''));
 const safe=v=>/^[A-Za-z0-9_-]{1,100}$/.test(String(v||''));
 function scopedPath(campaignId,kind,recordId,imageId){
  if(!safe(campaignId)||!kinds.includes(kind)||!safe(recordId)||!safe(imageId))throw Error('Invalid campaign journal image scope.');
  return ['campaign-journal-images',campaignId,kind,recordId,imageId].join('/');
 }
 function belongsTo(campaignId,kind,recordId,path){
  if(typeof path!=='string')return false;
  const prefix=scopedPath(campaignId,kind,recordId,'image').slice(0,-5);
  return path.startsWith(prefix)&&safe(path.slice(prefix.length));
 }
 function mount(form,session,{isCurrent,changed,status}){
  if(!kinds.includes(session.kind)||!canManageCampaign())return null;
  const campaignId=session.campaignId,kind=session.kind,recordId=session.record.id,uid=session.uid;
  const active=()=>alive&&isCurrent()&&session.record?.id===recordId&&session.campaignId===campaignId
   &&auth.currentUser?.uid===uid&&activeCampaign?.id===campaignId&&host.isConnected&&canManageCampaign();
  let alive=true,objectUrl=null,request=0,busy=false;
  const host=document.createElement('section');
  host.className='workspace-card journal-image-editor';
  host.dataset.journalImageEditor='';
  host.innerHTML='<div class="journal-image-heading"><div><h3>Entry illustration</h3><p>Private to this campaign’s DMs. Images never become public just because you share this entry’s text.</p></div><span class="journal-image-private">DM ONLY</span></div>'+
   '<div data-journal-image-preview class="journal-image-preview" aria-live="polite"><p>No illustration added.</p></div>'+
   '<div class="workspace-fields journal-image-fields"><label class="workspace-field">Illustration (PNG, JPEG, WebP · under 5 MB)<input type="file" accept="image/png,image/jpeg,image/webp" data-journal-image-upload></label>'+
   '<label class="workspace-field">Accessible description<input type="text" maxlength="200" data-journal-image-alt placeholder="Describe the image for accessibility"></label>'+
   '<label class="workspace-field">Caption (optional)<input type="text" maxlength="500" data-journal-image-caption placeholder="A short caption"></label></div>'+
   '<div class="workspace-actions"><button type="button" data-journal-image-remove>Remove illustration</button></div><p class="journal-image-note">Uploading does not save or publish the entry. Choose Save above to keep the reference. Replacing an image keeps the old file immutable.</p>';
  const first=form.querySelector('.chapter-editor-main > section, .world-editor-section, .creature-editor-section, form > section, section');
  if(first)first.after(host);else form.append(host);
  const pick=host.querySelector('[data-journal-image-upload]'),alt=host.querySelector('[data-journal-image-alt]'),
    caption=host.querySelector('[data-journal-image-caption]'),remove=host.querySelector('[data-journal-image-remove]'),
    preview=host.querySelector('[data-journal-image-preview]');
  const meta=()=>session.record.data?.journalImage;
  function revoke(){if(objectUrl){URL.revokeObjectURL(objectUrl);objectUrl=null;}}
  function show(){
   if(!active())return;
   const image=meta(),exists=!!image?.path;
   alt.disabled=!exists;caption.disabled=!exists;remove.disabled=!exists;
   alt.value=exists?image.alt||'':'';caption.value=exists?image.caption||'':'';
   if(!exists){revoke();preview.replaceChildren();const p=document.createElement('p');p.textContent='No illustration added.';preview.append(p);}
  }
  async function display(){
   if(!active())return;
   const serial=++request,image=meta();
   revoke();
   if(!image?.path){show();return;}
   if(!belongsTo(campaignId,kind,recordId,image.path)){
    preview.textContent='Invalid illustration reference: not part of this campaign entry.';
    status('This illustration is not bound to the active campaign and entry.',true);return;
   }
   preview.textContent='Loading private illustration…';
   try{
    const blob=await sdk.getBlob(sdk.ref(sdk.storage,image.path),6*1024*1024);
    if(!active()||serial!==request||meta()?.path!==image.path)return;
    objectUrl=URL.createObjectURL(blob);
    const img=document.createElement('img');img.src=objectUrl;img.alt=image.alt||'Campaign journal illustration';
    img.dataset.journalImageView='';
    preview.replaceChildren(img);
    if(image.caption){const p=document.createElement('p');p.textContent=image.caption;preview.append(p);}
   }catch(error){
    if(active()&&serial===request){preview.textContent='Illustration could not be loaded.';status('Could not load this campaign image: '+error.message,true);}
   }
  }
  function updateDetail(field,value){
   if(!active()||!meta()?.path||busy)return;
   const next={...meta(),[field]:String(value||'').slice(0,field==='alt'?200:500)};
   session.record.data.journalImage=next;changed();
   if(field==='alt')preview.querySelector('img')?.setAttribute('alt',next.alt);
   if(field==='caption'){const p=preview.querySelector('p');if(p)p.textContent=next.caption;else if(next.caption){const p=document.createElement('p');p.textContent=next.caption;preview.append(p);}}
  }
  alt.addEventListener('input',()=>updateDetail('alt',alt.value));
  caption.addEventListener('input',()=>updateDetail('caption',caption.value));
  pick.addEventListener('change',async()=>{
   const file=pick.files?.[0];if(!file||!active()||busy)return;
   if(!allowedTypes.includes(file.type)||file.size<=0||file.size>=5*1024*1024){
    status('Choose a PNG, JPEG or WebP image smaller than 5 MB.',true);pick.value='';return;
   }
   busy=true;session.busy=true;pick.disabled=true;remove.disabled=true;status('Uploading private campaign illustration…');
   try{
    const path=scopedPath(campaignId,kind,recordId,crypto.randomUUID().replaceAll('-',''));
    await sdk.uploadBytes(sdk.ref(sdk.storage,path),file,{contentType:file.type});
    if(!active())return;
    session.record.data.journalImage={path,alt:alt.value.trim().slice(0,200),caption:caption.value.trim().slice(0,500),uploadedBy:uid,uploadedAt:Date.now()};
    changed();show();await display();
    if(active())status('Illustration uploaded. Save this campaign entry to keep the new reference.');
   }catch(error){
    if(active())status(error?.code==='storage/unauthorized'?
     'Image upload denied. Publish the updated campaign-journal-images Storage rule in Firebase Console → Storage → Rules.':
     'Campaign illustration upload failed: '+error.message,true);
   }finally{busy=false;session.busy=false;if(active()){pick.disabled=false;pick.value='';show();}}
  });
  remove.addEventListener('click',()=>{
   if(!active()||!meta()?.path||busy)return;
   if(!confirm('Remove this illustration from the campaign entry? Save the entry to confirm.'))return;
   delete session.record.data.journalImage;changed();++request;show();
   status('Illustration detached. Save the entry to keep this change. (Previous uploaded files are not deleted.)');
  });
  show();display();
  return {dispose(){alive=false;++request;revoke();host.remove();},pathIsScoped:belongsTo};
 }
 return {mount,scopedPath,belongsTo};
})();
