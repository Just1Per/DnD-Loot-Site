/* Private per-character document, with optimistic concurrency checks. */
function createCharacterSheetStore(sdk) {
  const {db, doc, getDoc, runTransaction, auth} = sdk;
  const path = (campaignId, characterId, adventureId) => adventureId ? doc(db, 'campaigns', campaignId, 'oneShots', adventureId, 'characterSheets', characterId) : doc(db, 'campaigns', campaignId, 'characterSheets', characterId);
  // Fresh nested objects per sheet prevent companion/page defaults being shared across characters.
  const adobeDefaults = () => ({
    useExperience: false,
    hpMode: 'fixed',
    hpRolls: [],
    classLevels: [],
    pages: { spells:false, companion:false, rules:false },
    tabOrder: ['overview','skills','combat','spells','inventory','builder','feats','story','companion','rules'],
    companion: {
      type:'companion',name:'',creature:'',size:'Medium',profBonus:2,ac:10,
      hpMax:1,hpCurrent:1,hpTemp:0,speed:30,initiativeBonus:0,
      abilities:{str:10,dex:10,con:10,int:10,wis:10,cha:10},
      saveProficient:{str:false,dex:false,con:false,int:false,wis:false,cha:false},
      skillRank:{acrobatics:0,animalHandling:0,arcana:0,athletics:0,deception:0,history:0,insight:0,intimidation:0,investigation:0,medicine:0,nature:0,perception:0,performance:0,persuasion:0,religion:0,sleightOfHand:0,stealth:0,survival:0},
      skillBonus:{acrobatics:0,animalHandling:0,arcana:0,athletics:0,deception:0,history:0,insight:0,intimidation:0,investigation:0,medicine:0,nature:0,perception:0,performance:0,persuasion:0,religion:0,sleightOfHand:0,stealth:0,survival:0},
      attacks:'',traits:'',notes:''
    }
  });
  /** Keep the existing grants envelope used by Firestore rules and older saved sheets. */
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
  async function load(campaignId, characterId, adventureId = null) {
    const snapshot = await getDoc(path(campaignId, characterId, adventureId));
    if (!snapshot.exists())
      return {schemaVersion:1,revision:0,data:{}};
    return snapshot.data();
  }
  /** Atomically reject stale sheet/identity revisions before updating both documents. */
  async function save({campaignId, characterId, revision, data, identity, previousIdentity, adventureId = null}) {
    const actor = auth.currentUser?.uid;
    if (!actor)
      throw Error('Sign in before saving.');
    return runTransaction(db, async tx => {
      const sheetRef = path(campaignId, characterId, adventureId), characterRef = adventureId ? doc(db, 'campaigns', campaignId, 'oneShots', adventureId, 'characters', characterId) : doc(db, 'campaigns', campaignId, 'characters', characterId);
      const sheet = await tx.get(sheetRef), character = await tx.get(characterRef);
      if (!character.exists())
        throw Error('This character no longer exists.');
      if ((sheet.data()?.revision || 0) !== revision)
        throw Error('This sheet was changed in another window or by your DM. Your edits are still here. Export a backup, then close and reopen the sheet to load the latest version.');
      for (const key of ['name', 'class', 'level'])
        if (String(character.data()[key] ?? '') !== String(previousIdentity[key] ?? ''))
          throw Error('Character details changed while this sheet was open. Export your edits, then reopen the sheet.');
      const next = revision + 1;
      tx.set(sheetRef, {
        schemaVersion: 14,
        revision: next,
        data: persistedData(data),
        updatedAt: Date.now(),
        updatedBy: actor
      });
      tx.update(characterRef, identity);
      return next;
    });
  }
  return { load, save };
}
if (typeof module !== 'undefined' && module.exports)
  module.exports = { createCharacterSheetStore };