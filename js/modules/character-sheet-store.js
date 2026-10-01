/* Private per-character document, with optimistic concurrency checks. */
function createCharacterSheetStore(sdk) {
  const {db, doc, getDoc, runTransaction, auth} = sdk;
  const path = (campaignId, characterId) => doc(db, 'campaigns', campaignId, 'characterSheets', characterId);
  const adobeDefaults = () => ({
    useExperience: false,
    hpMode: 'fixed',
    hpRolls: [],
    classLevels: [],
    pages: { spells:false, companion:false, rules:false },
    companion: {}
  });
  function persistedData(raw) {
    const data = structuredClone(raw || {});
    data.rulesChoices ||= {feats:[],grants:{},effects:{}};
    data.rulesChoices.grants ||= {};
    const embedded = data.rulesChoices.grants.__adobe?.data;
    const adobe = data.adobe || embedded || adobeDefaults();
    data.rulesChoices.grants.__adobe = {data:adobe, used:0};
    delete data.adobe;
    return data;
  }
  async function load(campaignId, characterId) {
    const snapshot = await getDoc(path(campaignId, characterId));
    if (!snapshot.exists())
      return {schemaVersion:1,revision:0,data:{}};
    const stored = snapshot.data();
    // character-sheet.js still has the legacy supported-version list through 11.
    // Expose schema 12 as 11 to that UI gate while retaining the true persisted
    // version for diagnostics. Writes always remain schema 12.
    return stored.schemaVersion === 12
      ? {...stored, schemaVersion:11, __storedSchemaVersion:12}
      : stored;
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
        schemaVersion: 12,
        revision: next,
        data: persistedData(data),
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