"use strict";
const fs = require("node:fs"),
  assert = require("node:assert/strict"),
  sdk = require("firebase/firestore");
const {
  initializeTestEnvironment,
  assertFails,
} = require("@firebase/rules-unit-testing");
const M = require("../js/modules/character-sheet-model"),
  L = require("../js/modules/character-languages"),
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
    const identity = { name: "Shadow", class: "Rogue", level: 1 };
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
      build: {
        classId: "rogue",
        edition: "2024",
        scoreMode: "final",
        standardLanguages: ["Elvish", "Orc"],
      },
      languages: "Local hand signs",
    });
    data.adobe = {
      classLevels: [{ classId: "rogue", level: 1 }],
      classFeatureChoices: { "keep:choice": ["saved"] },
    };
    assert.equal(L.add(data, "Celestial", ["Common"]), true);
    assert.equal(
      L.setRogue(data, "Abyssal", {
        level: 1,
        known: ["Common", "Elvish", "Orc", "Thieves’ Cant"],
      }),
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
    assert.equal(data.languages, "Local hand signs\nCelestial");
    assert.ok(M.derive(data, 1).effects.languages.includes("Abyssal"));
    assert.equal(
      L.setRogue(data, "Druidic", {
        level: 1,
        known: ["Common", "Elvish", "Orc", "Thieves’ Cant"],
      }),
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
    data = (await player.load("a", "c1")).data;
    assert.ok(M.derive(data, 1).effects.languages.includes("Druidic"));
    assert.equal(data.languages, "Local hand signs\nCelestial");
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
      "PASS learned text and revised Rogue language persist through actual store under unchanged rules; owner/DM allowed and unrelated user denied",
    );
  } finally {
    await env.cleanup();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
