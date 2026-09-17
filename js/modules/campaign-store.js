/* Browser Firestore operations. Security is enforced by firestore.rules, not this UI. */
function createCampaignStore(sdk) {
  const {db, doc, collection, getDocs, query, where, limit, orderBy, startAfter, documentId, runTransaction, increment} = sdk;
  const uid = () => sdk.auth.currentUser?.uid;
  const fail = message => {
    throw Error(message);
  };
  const id = x => {
    if (typeof x !== 'string' || !x || x.includes('/'))
      fail('Invalid record ID.');
    return x;
  };
  const num = (x, min = 0) => {
    if (!Number.isSafeInteger(x) || x < min || x > 1000000)
      fail('Quantity must be a whole number from ' + min + ' to 1000000.');
    return x;
  };
  const ref = (cid, kind, key) => doc(db, 'campaigns', id(cid), kind, id(key));
  const invId = (character, item) => id(character) + '__' + id(item);
  const clean = (v = {}) => {
    const name = String(v.name || '').trim();
    if (!name)
      fail('Item name is required.');
    const imageUrl = String(v.imageUrl || '');
    if (imageUrl && !/^https:\/\//i.test(imageUrl))
      fail('Image URL must use HTTPS.');
    return {
      name: name.slice(0, 200),
      description: String(v.description || '').slice(0, 30000),
      category: String(v.category || ''),
      rarity: String(v.rarity || ''),
      source: String(v.source || ''),
      quote: String(v.quote || ''),
      attunement: !!v.attunement,
      classes: Array.isArray(v.classes) ? v.classes : [],
      properties: Array.isArray(v.properties) ? v.properties : [],
      imageUrl,
      imageBaseId: String(v.imageBaseId || '')
    };
  };
  async function access(tx, cid, dmOnly = false) {
    if (!uid())
      fail('Sign in first.');
    const c = await tx.get(doc(db, 'campaigns', id(cid)));
    if (!c.exists())
      fail('Campaign not found.');
    const m = await tx.get(ref(cid, 'members', uid()));
    const owner = c.data().ownerId === uid(), active = m.exists() && m.data().status === 'active', dm = owner || active && m.data().role === 'dm';
    if (!owner && !active || dmOnly && !dm)
      fail('Only this campaign\u2019s DM may do that.');
    return {
      ...c.data(),
      dm
    };
  }
  async function saveItem(d) {
    const key = d.itemId || doc(collection(db, 'campaigns', id(d.campaignId), 'items')).id;
    await runTransaction(db, async tx => {
      await access(tx, d.campaignId, true);
      const ir = ref(d.campaignId, 'items', key), sr = ref(d.campaignId, 'supply', key);
      const old = await tx.get(ir), stock = await tx.get(sr), s = stock.data();
      if (s && d.stockRevision !== s.revision)
        fail('Stock changed while this editor was open. Close and reopen the item before saving.');
      const claimed = s?.claimed || 0;
      tx.set(ir, {
        ...clean(d.item),
        campaignId: d.campaignId,
        rootItemId: old.data()?.rootItemId || null,
        visible: !!d.visible,
        highlighted: !!old.data()?.highlighted,
        lootMode: d.lootMode === 'player' ? 'player' : 'dm',
        createdAt: old.data()?.createdAt || Date.now(),
        updatedAt: Date.now()
      });
      tx.set(sr, {
        capacity: claimed + num(d.remaining ?? 1),
        claimed,
        unlimited: !!d.unlimited,
        revision: (s?.revision || 0) + 1,
        updatedAt: Date.now()
      });
    });
    return { itemId: key };
  }
  async function copyItem(d) {
    const key = doc(collection(db, 'campaigns', id(d.campaignId), 'items')).id;
    await runTransaction(db, async tx => {
      await access(tx, d.campaignId, true);
      const root = d.source === 'root', source = await tx.get(root ? doc(db, 'items', id(d.sourceId)) : ref(d.campaignId, 'items', d.sourceId));
      if (!source.exists() || d.sourceId === 'catalog_meta')
        fail('Source item not found.');
      const raw = source.data();
      tx.set(ref(d.campaignId, 'items', key), {
        ...clean(raw),
        name: root ? raw.name : raw.name + ' (Copy)',
        campaignId: d.campaignId,
        rootItemId: root ? d.sourceId : raw.rootItemId || null,
        imageBaseId: raw.imageBaseId || (root ? d.sourceId : ''),
        visible: false,
        highlighted: false,
        lootMode: 'dm',
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
      tx.set(ref(d.campaignId, 'supply', key), {
        capacity: 1,
        claimed: 0,
        unlimited: false,
        revision: 1,
        updatedAt: Date.now()
      });
    });
    return { itemId: key };
  }
  async function inventoryAction(d) {
    const q = num(d.quantity, 1), cid = id(d.campaignId), itemId = id(d.itemId), characterId = id(d.characterId);
    if (![
        'claim',
        'assign',
        'unloot',
        'use',
        'transfer'
      ].includes(d.action))
      fail('Unknown action.');
    try {
      return await runTransaction(db, async tx => {
        const campaign = await access(tx, cid, [
          'assign',
          'unloot',
          'transfer'
        ].includes(d.action));
        if (campaign.inventoryVersion !== 2)
          fail('Upgrade this campaign first.');
        const ir = ref(cid, 'inventory', invId(characterId, itemId)), sr = ref(cid, 'supply', itemId);
        const c = await tx.get(ref(cid, 'characters', characterId)), oldSnap = await tx.get(ir), old = oldSnap.data();
        if (!c.exists() || !campaign.dm && c.data().userId !== uid())
          fail('Choose your own character.');
        const adding = [
          'claim',
          'assign'
        ].includes(d.action);
        if (adding && c.data().active === false)
          fail('Choose an active character.');
        let item, stock;
        // Consuming owned loot also works after the DM hides or removes the source item.
        if (d.action !== 'use') {
          const snap = await tx.get(ref(cid, 'items', itemId));
          if (!snap.exists())
            fail('Item no longer exists.');
          item = snap.data();
          if (d.action === 'claim' && (!item.visible || item.lootMode !== 'player'))
            fail('This item is DM assignment only.');
        }
        if (campaign.dm && d.action !== 'use') {
          const snap = await tx.get(sr);
          if (!snap.exists())
            fail('Supply not found.');
          stock = snap.data();
        }
        let targetRef, target, targetChar;
        if (d.action === 'transfer') {
          if (d.targetCharacterId === characterId)
            fail('Choose a different character.');
          const tc = await tx.get(ref(cid, 'characters', d.targetCharacterId));
          if (!tc.exists() || tc.data().active === false)
            fail('Target character is not active.');
          targetChar = tc.data();
          targetRef = ref(cid, 'inventory', invId(d.targetCharacterId, itemId));
          target = (await tx.get(targetRef)).data();
        }
        const owned = old?.quantity || 0;
        if (!adding && owned < q)
          fail('This character does not own that quantity.');
        if (adding && stock && !stock.unlimited && stock.capacity - stock.claimed < q)
          fail('That quantity is no longer available.');
        const next = adding ? num(owned + q) : owned - q;
        const record = adding ? {
          itemId,
          characterId,
          userId: c.data().userId,
          quantity: next,
          item,
          campaignId: cid,
          receivedAt: old?.receivedAt || Date.now(),
          updatedAt: Date.now()
        } : {
          ...old,
          quantity: next,
          updatedAt: Date.now()
        };
        if (next)
          tx.set(ir, record);
        else
          tx.delete(ir);
        if (targetRef)
          tx.set(targetRef, {
            ...old,
            item: item || old.item,
            characterId: d.targetCharacterId,
            userId: targetChar.userId,
            quantity: num((target?.quantity || 0) + q),
            receivedAt: target?.receivedAt || Date.now(),
            updatedAt: Date.now()
          });
        if (adding || d.action === 'unloot')
          tx.update(sr, {
            claimed: increment(adding ? q : -q),
            revision: increment(1),
            lastClaim: {
              entryId: invId(characterId, itemId),
              actorId: uid(),
              quantity: q
            },
            updatedAt: Date.now()
          });
        return { quantity: next };
      });
    } catch (e) {
      if (e.code === 'permission-denied' && d.action === 'claim')
        throw Error('That quantity is unavailable, or campaign permissions changed. Refresh and ask your DM if needed.');
      throw e;
    }
  }
  async function deleteItem(d) {
    const sr = ref(d.campaignId, 'supply', d.itemId);
    const before = await sdk.getDoc(sr);
    const owned = await getDocs(query(collection(db, 'campaigns', id(d.campaignId), 'inventory'), where('itemId', '==', id(d.itemId)), limit(1)));
    if (!owned.empty)
      fail('Unloot all copies before deleting this item.');
    await runTransaction(db, async tx => {
      await access(tx, d.campaignId, true);
      const s = await tx.get(sr);
      if (s.data()?.revision !== before.data()?.revision)
        fail('Inventory changed. Refresh and try again.');
      tx.delete(ref(d.campaignId, 'items', d.itemId));
      tx.delete(sr);
    });
    return { deleted: true };
  }
  async function deleteCharacter(d) {
    await runTransaction(db, async tx => {
      const campaign = await access(tx, d.campaignId);
      const r = ref(d.campaignId, 'characters', d.characterId), c = await tx.get(r);
      if (!c.exists() || !campaign.dm && c.data().userId !== uid())
        fail('Choose your own character.');
      tx.update(r, { active: c.data().active === false });
    });
    return { archived: true };
  }
  async function migrate(d) {
    await runTransaction(db, tx => access(tx, d.campaignId, true));
    const parts = [
      orderBy(documentId()),
      limit(50)
    ];
    if (d.cursor)
      parts.push(startAfter(id(d.cursor)));
    const roots = await getDocs(query(collection(db, 'items'), ...parts));
    let migrated = 0;
    for (const root of roots.docs) {
      if (root.id === 'catalog_meta')
        continue;
      await runTransaction(db, async tx => {
        const campaign = await access(tx, d.campaignId, true), ir = ref(d.campaignId, 'items', root.id);
        if ((await tx.get(ir)).exists())
          return;
        const legacy = await tx.get(ref(d.campaignId, 'itemState', root.id)), state = legacy.data() || {};
        let character;
        if (state.owner)
          character = (await tx.get(ref(d.campaignId, 'characters', state.owner))).data();
        const item = {
          ...clean(root.data()),
          campaignId: d.campaignId,
          rootItemId: root.id,
          imageBaseId: root.data().imageBaseId || root.id,
          visible: state.visible ?? campaign.defaultItemVisible !== false,
          highlighted: !!state.highlighted,
          lootMode: 'dm',
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
        tx.set(ir, item);
        tx.set(ref(d.campaignId, 'supply', root.id), {
          capacity: state.looted && !character ? 0 : 1,
          claimed: state.looted && character ? 1 : 0,
          unlimited: false,
          revision: 1,
          updatedAt: Date.now()
        });
        if (state.looted && character)
          tx.set(ref(d.campaignId, 'inventory', invId(state.owner, root.id)), {
            itemId: root.id,
            characterId: state.owner,
            userId: character.userId,
            quantity: 1,
            item,
            campaignId: d.campaignId,
            receivedAt: Number.isSafeInteger(state.receivedDate) ? state.receivedDate : Date.parse(state.receivedDate) || Date.now(),
            updatedAt: Date.now()
          });
        if (state.looted && !character)
          tx.set(ref(d.campaignId, 'migrationNotes', root.id), {
            reason: 'Legacy looted item has no valid owner. Stock kept at zero; DM review required.',
            legacyOwner: state.owner || null
          });
      });
      migrated++;
    }
    const done = roots.size < 50;
    if (done)
      await runTransaction(db, async tx => {
        await access(tx, d.campaignId, true);
        tx.update(doc(db, 'campaigns', d.campaignId), {
          inventoryVersion: 2,
          inventoryMigratedAt: Date.now()
        });
      });
    return {
      done,
      cursor: roots.docs.at(-1)?.id || null,
      migrated
    };
  }
  const handlers = {
    vaultSaveCampaignItem: saveItem,
    vaultCopyCampaignItem: copyItem,
    vaultInventoryAction: inventoryAction,
    vaultDeleteCampaignItem: deleteItem,
    vaultDeleteCharacter: deleteCharacter,
    vaultMigrateCampaign: migrate
  };
  return (name, data) => {
    if (!handlers[name])
      fail('Unknown operation.');
    return handlers[name](data);
  };
}
if (typeof module !== 'undefined' && module.exports)
  module.exports = { createCampaignStore };
