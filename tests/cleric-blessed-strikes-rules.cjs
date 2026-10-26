"use strict";
const fs = require("node:fs"),
  assert = require("node:assert/strict"),
  sdk = require("firebase/firestore");
const {
  initializeTestEnvironment,
  assertFails,
} = require("@firebase/rules-unit-testing");
const M = require("../js/modules/character-sheet-model"),
  C = require("../js/modules/character-class-feature-choices"),
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
    const identity = { name: "Light", class: "Cleric", level: 14 };
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
      abilities: { wis: 16 },
      hpTemp: 4,
      hpCurrent: 12,
      hpMax: 35,
    });
    data.adobe = {
      classLevels: [{ classId: "cleric", level: 14 }],
      classFeatureChoices: { "keep:choice": ["saved"] },
    };
    const spell = catalog.spells.find(
      (s) => s.name === "Sacred Flame" && s.edition === "2024",
    );
    data.spells = [{ ...Catalog.spellRow(spell), classId: "cleric" }];
    assert.equal(
      C.set(
        data,
        data.adobe.classLevels[0],
        "blessed-strikes",
        0,
        "potent-spellcasting",
      ),
      true,
    );
    assert.equal(
      C.applyClericVitality(
        data,
        { spellId: spell.id, confirmed: true },
        { level: 14, mods: M.derive(data, 14).mods },
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
    assert.equal(data.hpTemp, 6);
    assert.equal(data.hpCurrent, 12);
    assert.equal(
      C.blessedStrikes(data, { level: 14, mods: { wis: 3 } }).choice,
      "potent-spellcasting",
    );
    data.adobe = structuredClone(data.rulesChoices.grants.__adobe.data);
    assert.equal(
      C.set(
        data,
        { classId: "cleric", level: 14 },
        "blessed-strikes",
        0,
        "divine-strike",
      ),
      true,
    );
    revision = await dm.save({
      campaignId: "a",
      characterId: "c1",
      revision,
      data,
      identity,
      previousIdentity: identity,
    });
    const saved = (await player.load("a", "c1")).data;
    assert.equal(
      C.blessedStrikes(saved, { level: 14 }).choice,
      "divine-strike",
    );
    assert.equal(saved.hpTemp, 6);
    assert.deepEqual(
      saved.rulesChoices.grants.__adobe.data.classFeatureChoices["keep:choice"],
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
      "PASS Cleric choice and nonstacking temporary HP persist through actual store under unchanged rules; DM can edit, unrelated users cannot read/write",
    );
  } finally {
    await env.cleanup();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
