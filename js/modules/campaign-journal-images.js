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
 // Published copies use Firestore access checks, avoiding Storage's two-document
 // cross-service limit (campaign tombstone + membership + publication = three).
 async function preparePublished({campaignId,kind,id,image,isCurrent=()=>true}){
  if(!image)return null;
  if(!belongsTo(campaignId,kind,id,image.path))throw Error('The illustration does not belong to this entry.');
  const blob=await sdk.getBlob(sdk.ref(sdk.storage,image.path),6*1024*1024);
  if(!isCurrent())throw Error('Campaign access changed.');
  const url=URL.createObjectURL(blob),img=new Image();
  try{
   img.src=url;await img.decode();if(!isCurrent())throw Error('Campaign access changed.');
   if(!img.naturalWidth||!img.naturalHeight)throw Error('The illustration could not be decoded.');
   const canvas=document.createElement('canvas');
   for(const bound of [1600,1200,900,675]){
    const ratio=Math.min(1,bound/Math.max(img.naturalWidth,img.naturalHeight));
    canvas.width=Math.max(1,Math.round(img.naturalWidth*ratio));canvas.height=Math.max(1,Math.round(img.naturalHeight*ratio));
    canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);
    for(const quality of [.86,.72,.58]){
     const output=await new Promise(resolve=>canvas.toBlob(resolve,'image/webp',quality));
     if(!isCurrent())throw Error('Campaign access changed.');
     if(output&&output.size<=512*1024){const bytes=new Uint8Array(await output.arrayBuffer());let text='';for(let i=0;i<bytes.length;i+=8192)text+=String.fromCharCode(...bytes.subarray(i,i+8192));return{path:image.path,contentType:output.type,data:btoa(text)};}
    }
   }
   throw Error('This illustration is too large to publish. Choose a smaller image.');
  }finally{URL.revokeObjectURL(url);}
 }
 async function publishedBlob({campaignId,kind,id,image}){
  if(!image||!belongsTo(campaignId,kind,id,image.path))throw Error('Invalid published illustration.');
  try{
   const result=await sdk.getDoc(sdk.doc(sdk.db,'campaigns',campaignId,'playerIllustrations',kind,'entries',id));
   if(result.exists()){
    const copy=result.data();
    if(copy.path!==image.path||!['image/png','image/jpeg','image/webp'].includes(copy.contentType)||typeof copy.data!=='string'||copy.data.length>700000||!copy.data.length)throw Error('The published illustration needs to be released again.');
    const bytes=Uint8Array.from(atob(copy.data),c=>c.charCodeAt(0));return new Blob([bytes],{type:copy.contentType});
   }
  }catch(error){
   // Older releases have only a Storage reference. Preserve authenticated legacy
   // access where it works; neither path grants access outside its own rules.
   try{return await sdk.getBlob(sdk.ref(sdk.storage,image.path),6*1024*1024);}catch{throw error;}
  }
  return sdk.getBlob(sdk.ref(sdk.storage,image.path),6*1024*1024);
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
  host.innerHTML='<div class="journal-image-heading"><div><h3>Entry illustration</h3><p>Private by default. Save the entry, then use Player illustration to share the saved image separately from its text.</p></div><span class="journal-image-private">PRIVATE DRAFT</span></div>'+
   '<div data-journal-image-preview class="journal-image-preview" aria-live="polite"><p>No illustration added.</p></div>'+
   '<div class="workspace-fields journal-image-fields"><label class="workspace-field">Illustration (PNG, JPEG, WebP · under 5 MB)<input type="file" accept="image/png,image/jpeg,image/webp" data-journal-image-upload></label>'+
   '<label class="workspace-field">Accessible description<input type="text" maxlength="200" data-journal-image-alt placeholder="Describe the image for accessibility"></label>'+
   '<label class="workspace-field">Caption (optional)<input type="text" maxlength="500" data-journal-image-caption placeholder="A short caption"></label></div>'+
   '<div class="workspace-actions"><button type="button" data-journal-image-remove>Remove illustration</button></div><p class="journal-image-note">Uploading does not save or publish the entry. Choose Save above to keep the reference. Replacing an image keeps the old file immutable.</p>';
  if(kind==='chapter'||kind==='world'||kind==='creature'&&session.record.data?.category==='Story NPC'){
   host.querySelector('h3').textContent='Image (optional)';
   host.querySelector('.journal-image-heading p').textContent='Included with the text and caption when you publish to players.';
   host.querySelector('.journal-image-private').remove();
   host.querySelector('.journal-image-note').textContent='Save draft keeps changes private. Publish to players includes the illustration and caption.';
  }
  const first=form.querySelector('.chapter-editor-main > section, .world-editor-section, .creature-editor-section, form > section, section');
  const mount=form.querySelector('[data-journal-image-mount]');
  if(mount)mount.append(host);else if(first)first.after(host);else form.append(host);
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
   busy=true;session.busy=true;pick.disabled=true;remove.disabled=true;status('Uploading private campaign illustration…');session.host.querySelector('[data-entry-sharing]')?._sharingState?.();
   try{
    const bitmap=await createImageBitmap(file);bitmap.close();
    if(!active())return;
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
   }finally{busy=false;session.busy=false;if(active()){pick.disabled=false;pick.value='';show();session.host.querySelector('[data-entry-sharing]')?._sharingState?.();}}
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
 return {mount,scopedPath,belongsTo,preparePublished,publishedBlob};
})();
