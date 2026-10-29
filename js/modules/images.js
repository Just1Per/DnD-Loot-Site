"use strict";

// Resolve shared item art lazily and retain resolved URLs for the browser session.

// ─── IMAGE HELPERS ────────────────────────────────────────────────────────────

const IMAGE_VARIANT_WORDS = [
  "common","uncommon","rare","very-rare","veryrare","legendary","artifact","minor","major",
  "grey","gray","red","blue","green","black","white","yellow","purple","orange","bronze","silver","gold","plus"
];

/** Remove the same rarity/color/bonus variant tokens to locate shared artwork. */
function getBaseImageId(itemId) {
  if (!itemId) return "";
  let base = itemId.toLowerCase();
  base = base.replace(/\+/g, "").replace(/[0-9]/g, "");
  IMAGE_VARIANT_WORDS.forEach(word => {
    const regex = new RegExp(`(?<=^|[-_\\s])${word}(?=[-_\\s]|$)`, "gi");
    base = base.replace(regex, "");
  });
  return base.replace(/[-_\s]+/g, "-").replace(/^[-_]+|[-_]+$/g, "") || itemId;
}

// v2 keeps a formerly normalized (and potentially wrong) URL from masking an
// exact filename after an upgrade. Only successful public lookups are cached.
const IMAGE_SESSION_PREFIX = "dnd-item-image:v2:";

function getCachedImageUrl(itemId) {
  if (!itemId) return "";
  if (imageCache.has(itemId)) return imageCache.get(itemId);

  try {
    const cached = sessionStorage.getItem(IMAGE_SESSION_PREFIX + itemId);
    if (cached) {
      imageCache.set(itemId, cached);
      return cached;
    }
  } catch {}

  return "";
}

function cacheImageUrl(itemId, url) {
  if (!itemId || !url) return;
  imageCache.set(itemId, url);
  try { sessionStorage.setItem(IMAGE_SESSION_PREFIX + itemId, url); } catch {}
}

async function loadStorageImage(path) {
  try { return await getDownloadURL(ref(storage, path)); }
  catch { return ""; }
}

// Only shared, public catalogue art uses this cache. Private campaign art stays separate.
const pendingPublicImages = new Map();
async function resolvePublicImageFile(itemId) {
  const cached = getCachedImageUrl(itemId);
  if (cached) return cached;
  let pending = pendingPublicImages.get(itemId);
  if (!pending) {
    pending = loadStorageImage(`dnd-item-images/${itemId}.png`).then(url => {
      if (url) cacheImageUrl(itemId, url);
      return url;
    }).finally(() => pendingPublicImages.delete(itemId));
    pendingPublicImages.set(itemId, pending);
  }
  return pending;
}

async function resolveImageUrl(itemId) {
  if (typeof itemId !== 'string' || !itemId || itemId.length > 200 || /[/\\]/.test(itemId)) return PLACEHOLDER_IMAGE;
  // Uploads use the exact ID. Normalization is only a fallback for old variants.
  const exact = await resolvePublicImageFile(itemId);
  if (exact) return exact;
  const baseId = getBaseImageId(itemId);
  const url = baseId !== itemId ? await resolvePublicImageFile(baseId) : '';
  if (url) cacheImageUrl(itemId, url);
  return url || PLACEHOLDER_IMAGE;
}

function forgetImageUrl(url) {
  for (const [id, cached] of imageCache) if (cached === url) {
    imageCache.delete(id);
    try { sessionStorage.removeItem(IMAGE_SESSION_PREFIX + id); } catch {}
  }
}

const boundPublicImages = new WeakSet();
function bindPublicImageRecovery(img) {
  if (boundPublicImages.has(img)) return;
  boundPublicImages.add(img);
  let recovering = false;
  const recover = async () => {
    if (!img.isConnected || img.getAttribute('src') === PLACEHOLDER_IMAGE) return;
    forgetImageUrl(img.getAttribute('src'));
    if (recovering) { img.src = PLACEHOLDER_IMAGE; return; }
    recovering = true; // One recovery per rendered card, including a failed fallback.
    delete img.dataset.imageItemId;
    img.src = PLACEHOLDER_IMAGE;
    await applyResolvedItemImage(img,img.dataset.imageSourceId);
  };
  img.addEventListener('error', recover);
  // A direct URL can fail before the newly inserted card is observed.
  if (img.complete && !img.naturalWidth) recover();
}

const pendingCampaignItemImages=new Map();
const safeCampaignImageSegment=value=>typeof value==='string'&&value.length>0&&value.length<=200&&!/[/\\\u0000-\u001f]/.test(value)&&!['.','..'].includes(value);
function campaignImageCurrent(img,campaignId,uid){return img.isConnected&&typeof auth!=='undefined'&&auth.currentUser?.uid===uid&&typeof activeCampaign!=='undefined'&&activeCampaign?.id===campaignId&&img.dataset.campaignImageUid===uid;}
async function loadCampaignItemImage(img){
 if(img.dataset.campaignImageTried)return false;
 const uid=typeof auth!=='undefined'?auth.currentUser?.uid:null,campaignId=typeof activeCampaign!=='undefined'?activeCampaign?.id:null,path=img.dataset.campaignItemImagePath,parts=path?.split('/');
 if(!uid||!safeCampaignImageSegment(campaignId)||parts?.length!==3||parts[0]!=='campaign-item-images'||parts[1]!==campaignId||!safeCampaignImageSegment(parts[2])||!campaignImageCurrent(img,campaignId,uid))return false;
 img.dataset.campaignImageTried='true';const sdk=window.__DND_VAULT_DEPS__;if(typeof sdk?.getBlob!=='function')return false;
 try{
  const key=JSON.stringify([uid,campaignId,path]);let pending=pendingCampaignItemImages.get(key);
  if(!pending){pending=sdk.getBlob(ref(storage,path),5*1024*1024).finally(()=>pendingCampaignItemImages.delete(key));pendingCampaignItemImages.set(key,pending);}
  const blob=await pending;if(!campaignImageCurrent(img,campaignId,uid)||!/^image\/(png|jpeg|webp)$/.test(blob.type)||blob.size>=5*1024*1024)return false;
  const url=URL.createObjectURL(blob),revoke=()=>URL.revokeObjectURL(url);img.addEventListener('load',revoke,{once:true});img.addEventListener('error',revoke,{once:true});img.src=url;return true;
 }catch{return false;}
}
async function applyResolvedItemImage(img,itemId){
 const url=await resolveImageUrl(itemId);if(!img.isConnected)return;
 if(url===PLACEHOLDER_IMAGE&&await loadCampaignItemImage(img))return;
 if(img.isConnected)img.src=url;
}

async function loadArchivedItemImage(img) {
  const campaignId=activeCampaign?.id,uid=auth.currentUser?.uid,path=img.dataset.privateItemImagePath;
  if(!uid||!campaignId||!canManageCampaign()||!path?.startsWith(`campaign-catalogue-images/${campaignId}/`))return;
  delete img.dataset.privateItemImagePath;
  try {
    const blob=await window.__DND_VAULT_DEPS__.getBlob(ref(storage,path),10*1024*1024);
    if(!img.isConnected||auth.currentUser?.uid!==uid||activeCampaign?.id!==campaignId||!canManageCampaign())return;
    const url=URL.createObjectURL(blob);
    img.addEventListener('load',()=>URL.revokeObjectURL(url),{once:true});
    img.addEventListener('error',()=>URL.revokeObjectURL(url),{once:true});
    img.src=url;
  } catch { /* Keep the placeholder when private artwork cannot be read. */ }
}

// Resolve only visible cards; detached cards must not receive late image updates.
const imageObserver = "IntersectionObserver" in window
  ? new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;

        const img = entry.target;
        observer.unobserve(img);

        if(img.dataset.privateItemImagePath){loadArchivedItemImage(img);return;}

        const itemId = img.dataset.imageItemId;
        if (!itemId) return;

        applyResolvedItemImage(img,itemId).then(()=>delete img.dataset.imageItemId);
      });
    }, { rootMargin: "500px 0px" })
  : null;

function observePendingImages(root = document) {
  root.querySelectorAll?.('img[data-image-source-id]').forEach(bindPublicImageRecovery);
  const pending = root.querySelectorAll?.("img[data-image-item-id], img[data-private-item-image-path]") || [];

  pending.forEach(img => {
    if(img.dataset.privateItemImagePath){if(imageObserver)imageObserver.observe(img);else loadArchivedItemImage(img);return;}
    const itemId = img.dataset.imageItemId;
    const cached = getCachedImageUrl(itemId);

    if (cached) {
      img.src = cached;
      delete img.dataset.imageItemId;
      return;
    }

    if (imageObserver) {
      imageObserver.observe(img);
    } else {
      applyResolvedItemImage(img,itemId).then(()=>delete img.dataset.imageItemId);
    }
  });
}

function itemImageMarkup(item, className, extraAttrs = "",{campaignId=null}={}) {
  if(item.archivedImage){
    const path=item.archivedImage.path||'',prefix=`campaign-catalogue-images/${activeCampaign?.id}/`;
    const allowed=canManageCampaign()&&path.startsWith(prefix)&&/^[a-f0-9]{64}\/[a-f0-9]{64}$/.test(path.slice(prefix.length));
    return `<img src="${PLACEHOLDER_IMAGE}" class="${className}" alt="${escapeHtml(item.name||'')}" loading="lazy" decoding="async"${allowed?` data-private-item-image-path="${escapeHtml(path)}"`:''} ${extraAttrs}>`;
  }
  if(item.artwork?.status==='none')return `<img src="${PLACEHOLDER_IMAGE}" class="${className}" alt="${escapeHtml(item.name||'')}" loading="lazy" ${extraAttrs}>`;
  const uid=typeof auth!=='undefined'?auth.currentUser?.uid:null;
  const campaignFallback=uid&&safeCampaignImageSegment(campaignId)&&safeCampaignImageSegment(item.id)&&typeof activeCampaign!=='undefined'&&activeCampaign?.id===campaignId?` data-campaign-item-image-path="${escapeHtml('campaign-item-images/'+campaignId+'/'+item.id)}" data-campaign-image-uid="${escapeHtml(uid)}"`:'';
  const imageId = item.imageBaseId || item.rootItemId || item.id;
  // Campaign copies can still have thumbnail-only records or an old placeholder
  // in imageUrl. A placeholder is not an illustration and must not stop lookup.
  const direct = [item.imageUrl, item.thumbnailUrl, item.thumbUrl].find(value => typeof value === 'string' && /^https:\/\//i.test(value));
  const cached = direct || getCachedImageUrl(imageId);
  const src = cached || PLACEHOLDER_IMAGE;
  const pending = cached ? "" : ` data-image-item-id="${escapeHtml(imageId)}"`;
  return `<img src="${escapeHtml(src)}" class="${className}" alt="${escapeHtml(item.name || "")}"
    loading="lazy" decoding="async" data-image-source-id="${escapeHtml(imageId || '')}"${pending}${campaignFallback} ${extraAttrs}>`;
}

async function uploadItemImage(itemId,file,{campaignId=null}={}) {
  if(!file.type.startsWith('image/')||file.size>=4*1024*1024)throw Error('Choose an image under 4 MB.');
  const path=campaignId?`campaign-item-images/${campaignId}/${itemId}`:`dnd-item-images/${itemId}.png`;
  const imageRef=ref(storage,path);
  await uploadBytes(imageRef,file,{contentType:file.type});
  return getDownloadURL(imageRef);
}
