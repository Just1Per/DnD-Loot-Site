"use strict";
const fs = require("node:fs"),
  assert = require("node:assert/strict"),
  sdk = require("firebase/firestore");
const {
  initializeTestEnvironment,
  assertFails,
} = require("@firebase/rules-unit-testing");
const M = require("../js/modules/character-sheet-model"),
  I = require("../js/modules/character-cleric-intervention"),
  Catalog = require("../js/modules/character-catalog"),
  {
    createCharacterSheetStore,
  } = require("../js/modules/character-sheet-store");
const catalog = require("../data/rules/catalog.json");
Catalog.set(catalog);
(async () => {
  const env = await initializeTestEnvironment({
    projectId: "demo-vault-test",
    firestore: {
      host: "127.0.0.1",
      port: 8080,
      rules: fs.readFileSync(__dirname + "/../firestore.rules", "utf8"),
    },
  });
  try {
    await env.clearFirestore();
    const identity = { name: "Light", class: "Cleric", level: 20 };
    await env.withSecurityRulesDisabled(async (ctx) => {
      for (const [p, d] of Object.entries({
        "campaigns/a": { ownerId: "dm", dmId: "dm" },
        "campaigns/a/members/player": {
          uid: "player",
          status: "active",
          role: "player",
        },
        "campaigns/a/members/dm": { uid: "dm", status: "active", role: "dm" },
        "campaigns/a/characters/c1": { ...identity, userId: "player" },
      }))
        await sdk.setDoc(sdk.doc(ctx.firestore(), p), d);
    });
    const store = (uid) =>
      createCharacterSheetStore({
        ...sdk,
        db: env.authenticatedContext(uid).firestore(),
        auth: { currentUser: { uid } },
      });
    const player = store("player"),
      dm = store("dm"),
      other = store("other");
    let data = M.normalize({
      build: { classId: "cleric", edition: "2024", scoreMode: "final" },
      hpCurrent: 12,
      hpTemp: 4,
      slots: [{ max: 4, used: 3 }],
    });
    data.adobe = {
      classLevels: [{ classId: "cleric", level: 20 }],
      pactSlotsUsed: 2,
      classFeatureChoices: { "keep:choice": ["saved"] },
    };
    assert.equal(
      I.cast(
        data,
        { spellId: I.wishId, wishRests: 4, confirmed: true },
        { level: 20 },
      ).ok,
      true,
    );
    let revision = await player.save({
      campaignId: "a",
      characterId: "c1",
      revision: 0,
      data,
      identity,
      previousIdentity: identity,
    });
    data = (await player.load("a", "c1")).data;
    assert.equal(I.ledger(data, "2024").remaining, 4);
    assert.equal(data.hpTemp, 4);
    assert.equal(data.hpCurrent, 12);
    assert.equal(data.slots[0].used, 3);
    assert.equal(data.rulesChoices.grants.__adobe.data.pactSlotsUsed, 2);
    assert.equal(
      I.cast(
        data,
        { spellId: I.wishId, wishRests: 2, confirmed: true },
        { level: 20 },
      ).ok,
      false,
    );
    I.onRest(data, "long");
    revision = await dm.save({
      campaignId: "a",
      characterId: "c1",
      revision,
      data,
      identity,
      previousIdentity: identity,
    });
    data = (await player.load("a", "c1")).data;
    assert.equal(I.ledger(data, "2024").remaining, 3);
    data.build.edition = "2014";
    assert.equal(
      I.attempt(data, { confirmed: true }, { level: 20 }).success,
      true,
    );
    revision = await player.save({
      campaignId: "a",
      characterId: "c1",
      revision,
      data,
      identity,
      previousIdentity: identity,
    });
    data = (await player.load("a", "c1")).data;
    assert.equal(I.ledger(data, "2014").remaining, 7);
    assert.equal(I.ledger(data, "2024").remaining, 3);
    I.onRest(data, "long");
    assert.equal(I.ledger(data, "2014").remaining, 7);
    assert.equal(I.ledger(data, "2024").remaining, 2);
    I.campaignDay(data);
    assert.equal(I.ledger(data, "2014").remaining, 6);
    assert.deepEqual(
      (data.adobe || data.rulesChoices.grants.__adobe.data).classFeatureChoices[
        "keep:choice"
      ],
      ["saved"],
    );
    await assertFails(other.load("a", "c1"));
    await assertFails(
      other.save({
        campaignId: "a",
        characterId: "c1",
        revision,
        data,
        identity,
        previousIdentity: identity,
      }),
    );
    console.log(
      "PASS Divine Intervention saves both edition cooldowns through the actual store under unchanged rules; owner and DM allowed, unrelated users denied, slot pools and HP unchanged",
    );
  } finally {
    await env.cleanup();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
