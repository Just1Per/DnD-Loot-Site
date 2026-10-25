const fs = require("node:fs"),
  path = require("node:path"),
  assert = require("node:assert/strict"),
  sdk = require("firebase/firestore");
const {
    initializeTestEnvironment,
    assertFails,
  } = require("@firebase/rules-unit-testing"),
  M = require("../js/modules/character-sheet-model"),
  W = require("../js/modules/character-wild-shape"),
  {
    createCharacterSheetStore,
  } = require("../js/modules/character-sheet-store");
(async () => {
  const env = await initializeTestEnvironment({
    projectId: "demo-vault-test",
    firestore: {
      host: "127.0.0.1",
      port: 8080,
      rules: fs.readFileSync(
        path.join(__dirname, "../firestore.rules"),
        "utf8",
      ),
    },
  });
  try {
    await env.clearFirestore();
    const identity = { name: "Grove", class: "Druid", level: 4 };
    W.setCatalogue(require("../data/rules/wild-shapes-v1.json"));
    await env.withSecurityRulesDisabled(async (ctx) => {
      const db = ctx.firestore();
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
        await sdk.setDoc(sdk.doc(db, p), d);
    });
    let data;
    const player = createCharacterSheetStore({
      ...sdk,
      db: env.authenticatedContext("player").firestore(),
      auth: { currentUser: { uid: "player" } },
    });
    let revision = 0;
    for (const edition of ["2014", "2024"]) {
      data = M.normalize({
        build: { classId: "druid", edition },
        hpCurrent: 28,
        hpMax: 35,
      });
      data.adobe = {
        classLevels: [{ classId: "druid", level: 4 }],
        classFeatureChoices: {},
      };
      const id = "srd-" + edition + "-wolf";
      if (edition === "2024") W.setKnown(data, 0, id, 4);
      assert.equal(W.assume(data, id, { level: 4, seen: true }), true);
      W.damage(data, 6, { level: 4 });
      revision = await player.save({
        campaignId: "a",
        characterId: "c1",
        revision,
        data,
        identity,
        previousIdentity: identity,
      });
      const saved = await player.load("a", "c1");
      assert.equal(W.state(saved.data, 4).activeId, id);
      assert.equal(W.state(saved.data, 4).remaining, 1);
      assert.equal(
        W.profile(saved.data, { level: 4 }).hp,
        edition === "2014" ? 5 : 26,
      );
      if (edition === "2024") assert.equal(W.validKnown(saved.data, 4)[0], id);
    }
    const outsider = createCharacterSheetStore({
      ...sdk,
      db: env.authenticatedContext("other").firestore(),
      auth: { currentUser: { uid: "other" } },
    });
    await assertFails(outsider.load("a", "c1"));
    await assertFails(
      outsider.save({
        campaignId: "a",
        characterId: "c1",
        revision,
        data,
        identity,
        previousIdentity: identity,
      }),
    );
    console.log(
      "PASS legacy and revised Wild Shape state, known forms, uses and HP persist under unchanged rules; unrelated users cannot read or overwrite the sheet",
    );
  } finally {
    await env.cleanup();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
