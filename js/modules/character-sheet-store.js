/* Private per-character document, with optimistic concurrency checks. */
function createCharacterSheetStore(sdk) {
  const {db, doc, getDoc, runTransaction, auth} = sdk;
  const path = (campaignId, characterId) => doc(db, 'campaigns', campaignId, 'characterSheets', characterId);
  async function load(campaignId, characterId) {
    const snapshot = await getDoc(path(campaignId, characterId));
    return snapshot.exists() ? snapshot.data() : {
      schemaVersion: 1,
      revision: 0,
      data: {}
    };
  }
  async function save({campaignId, characterId, revision, data, identity, previousIdentity}) {
    const actor = auth.currentUser?.uid;
    if (!actor)
      throw Error('Sign in before saving.');
    return runTransaction(db, async tx => {
      const sheetRef = path(campaignId, characterId), characterRef = doc(db, 'campaigns', campaignId, 'characters', characterId);
      const sheet = await tx.get(sheetRef), character = await tx.get(characterRef);
      if (!character.exists())
        throw Error('This character no longer exists.');
      if ((sheet.data()?.revision || 0) !== revision)
        throw Error('This sheet was changed in another window or by your DM. Your edits are still here. Export a backup, then close and reopen the sheet to load the latest version.');
      for (const key of [
          'name',
          'class',
          'level'
        ])
        if (String(character.data()[key] ?? '') !== String(previousIdentity[key] ?? ''))
          throw Error('Character details changed while this sheet was open. Export your edits, then reopen the sheet.');
      const next = revision + 1;
      tx.set(sheetRef, {
        schemaVersion: 3,
        revision: next,
        data,
        updatedAt: Date.now(),
        updatedBy: actor
      });
      tx.update(characterRef, identity);
      return next;
    });
  }
  return {
    load,
    save
  };
}
if (typeof module !== 'undefined' && module.exports)
  module.exports = { createCharacterSheetStore };
