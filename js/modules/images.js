"use strict";

// IMAGE HELPERS
// Extracted from the working Step 7 app with behavior preserved.

// ─── IMAGE HELPERS ────────────────────────────────────────────────────────────

function getBaseImageId(itemId) {
  if (!itemId) return "";
  let base = itemId.toLowerCase();
  const wordsToRemove = [
    "common","uncommon","rare","very-rare","veryrare","legendary","artifact","minor","major",
    "grey","gray","red","blue","green","black","white","yellow","purple","orange","bronze","silver","gold","plus"
  ];
  base = base.replace(/\+/g, "").replace(/[0-9]/g, "");
  wordsToRemove.forEach(word => {
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

const imageObserver = "IntersectionObserver" in window
  ? new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;

        const img = entry.target;
        observer.unobserve(img);

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
  const pending = root.querySelectorAll?.("img[data-image-item-id]") || [];

  pending.forEach(img => {
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
  const cached = item.imageUrl || getCachedImageUrl(item.id);
  const src = cached || PLACEHOLDER_IMAGE;
  const pending = cached ? "" : ` data-image-item-id="${escapeHtml(item.id)}"`;
  return `<img src="${src}" class="${className}" alt="${escapeHtml(item.name || "")}"
    loading="lazy" decoding="async"${pending} ${extraAttrs}
    onerror="this.src='${PLACEHOLDER_IMAGE}'; delete this.dataset.imageItemId;">`;
}

async function uploadItemImage(itemId, file) {
  const imgRef = ref(storage, `dnd-item-images/${getBaseImageId(itemId)}.png`);
  try {
    await uploadBytes(imgRef, file, { contentType: file.type || "image/png" });
    const url = await getDownloadURL(imgRef);
    cacheImageUrl(itemId, url);
    return url;
  } catch (e) {
    console.error("Image upload failed:", e);
    return "";
  }
}

