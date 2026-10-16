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

const IMAGE_SESSION_PREFIX = "dnd-item-image:";

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

async function resolveImageUrl(itemId) {
  const cached = getCachedImageUrl(itemId);
  if (cached) return cached;

  const url = await loadStorageImage(`dnd-item-images/${getBaseImageId(itemId)}.png`);
  if (url) cacheImageUrl(itemId, url);
  return url || PLACEHOLDER_IMAGE;
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

        resolveImageUrl(itemId).then(url => {
          if (!img.isConnected) return;
          img.src = url;

          const item = items.find(i => i.id === itemId);
          if (item && url !== PLACEHOLDER_IMAGE) item.imageUrl = url;

          delete img.dataset.imageItemId;
        });
      });
    }, { rootMargin: "500px 0px" })
  : null;

function observePendingImages(root = document) {
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
      resolveImageUrl(itemId).then(url => {
        if (!img.isConnected) return;
        img.src = url;
        delete img.dataset.imageItemId;
      });
    }
  });
}

function itemImageMarkup(item, className, extraAttrs = "") {
  if(item.archivedImage){
    const path=item.archivedImage.path||'',prefix=`campaign-catalogue-images/${activeCampaign?.id}/`;
    const allowed=canManageCampaign()&&path.startsWith(prefix)&&/^[a-f0-9]{64}\/[a-f0-9]{64}$/.test(path.slice(prefix.length));
    return `<img src="${PLACEHOLDER_IMAGE}" class="${className}" alt="${escapeHtml(item.name||'')}" loading="lazy" decoding="async"${allowed?` data-private-item-image-path="${escapeHtml(path)}"`:''} ${extraAttrs}>`;
  }
  if(item.artwork?.status==='none')return `<img src="${PLACEHOLDER_IMAGE}" class="${className}" alt="${escapeHtml(item.name||'')}" loading="lazy" ${extraAttrs}>`;
  const imageId = item.imageBaseId || item.id;
  const cached = item.imageUrl || getCachedImageUrl(imageId);
  const src = cached || PLACEHOLDER_IMAGE;
  const pending = cached ? "" : ` data-image-item-id="${escapeHtml(imageId)}"`;
  return `<img src="${escapeHtml(src)}" class="${className}" alt="${escapeHtml(item.name || "")}"
    loading="lazy" decoding="async"${pending} ${extraAttrs}
    onerror="this.src='${PLACEHOLDER_IMAGE}'; delete this.dataset.imageItemId;">`;
}

async function uploadItemImage(itemId,file,{campaignId=null}={}) {
  if(!file.type.startsWith('image/')||file.size>=4*1024*1024)throw Error('Choose an image under 4 MB.');
  const path=campaignId?`campaign-item-images/${campaignId}/${itemId}`:`dnd-item-images/${itemId}.png`;
  const imageRef=ref(storage,path);
  await uploadBytes(imageRef,file,{contentType:file.type});
  return getDownloadURL(imageRef);
}
