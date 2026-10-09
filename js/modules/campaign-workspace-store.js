'use strict';
/** Campaign records use immutable IDs and revision checks; secrets have separate documents. */
function createCampaignWorkspaceStore(sdk) {
  const { db, auth, doc, collection, getDocs, getDoc, runTransaction } = sdk;
  const collections = { world:'worldEntries', creature:'creatures', chapter:'chapters', encounter:'encounters', oneShot:'oneShots' };
  const validId = value => { if (!/^[a-zA-Z0-9_-]{1,100}$/.test(value || '')) throw Error('Invalid record ID.'); return value; };
  const base = (campaignId, kind) => {
    validId(campaignId);
    if (!collections[kind]) throw Error('Unknown workspace record type.');
    return ['campaigns', campaignId, collections[kind]];
  };
  const recordRef = (campaignId, kind, id) => doc(db, ...base(campaignId, kind), validId(id));
  const secretRef = (campaignId, kind, id) => doc(db, 'campaigns', validId(campaignId), 'workspaceSecrets', kind + '-' + validId(id));
  const actor = () => { const uid = auth.currentUser?.uid; if (!uid) throw Error('Sign in first.'); return uid; };
  function normalize(kind, input) {
    if (!collections[kind]) throw Error('Unknown workspace record type.');
    const title = String(input.title || '').trim();
    if (!title || title.length > 160) throw Error('Enter a title of 1–160 characters.');
    const summary = String(input.summary || ''), content = String(input.content || ''), privateNotes = String(input.privateNotes || '');
    if (summary.length > 1000 || content.length > 20000 || privateNotes.length > 20000) throw Error('This text exceeds the field limit.');
    const data = structuredClone(input.data || {});
    if (JSON.stringify(data).length > 180000) throw Error('This record is too large.');
    return { title, summary, content, data, archived:!!input.archived, privateNotes };
  }
  async function list(campaignId, kind) {
    actor(); const snapshot = await getDocs(collection(db, ...base(campaignId, kind)));
    return snapshot.docs.map(row => ({...row.data(), id:row.id}));
  }
  async function load(campaignId, kind, id) {
    actor();
    const [record, secret] = await Promise.all([getDoc(recordRef(campaignId, kind, id)), getDoc(secretRef(campaignId, kind, id))]);
    if (!record.exists()) throw Error('This record no longer exists.');
    return {...record.data(), id, privateNotes:secret.data()?.notes || ''};
  }
  async function save({campaignId, kind, id, revision, input}) {
    const uid = actor(), normalized = normalize(kind, input);
    if (!Number.isInteger(revision) || revision < 0) throw Error('Invalid revision.');
    return runTransaction(db, async tx => {
      const target = recordRef(campaignId, kind, id), snapshot = await tx.get(target);
      const old = snapshot.data();
      if ((old?.revision || 0) !== revision) throw Error('Changed in another window. Your draft is preserved; reload after copying your edits.');
      const now = Date.now(), {privateNotes, ...fields} = normalized;
      const next = {...fields, kind, schemaVersion:1, revision:revision+1, createdBy:old?.createdBy || uid, createdAt:old?.createdAt || now, updatedBy:uid, updatedAt:now};
      tx.set(target, next);
      tx.set(secretRef(campaignId, kind, id), {kind, recordId:id, notes:privateNotes, updatedBy:uid, updatedAt:now});
      return {...next, id, privateNotes};
    });
  }
  return {list, load, save, normalize, collections};
}
if (typeof module !== 'undefined') module.exports = {createCampaignWorkspaceStore};
