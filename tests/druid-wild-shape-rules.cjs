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
  F = require("../js/modules/character-wild-companion"),
  D = require("../js/modules/character-druid-conversions"),
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
    const recoveryIdentity = { name: "Recovery", class: "Druid", level: 8 };
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
        "campaigns/a/characters/c2": { ...recoveryIdentity, userId: "player" },
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
    data = M.normalize({
      build: { classId: "druid", edition: "2024" },
      hpCurrent: 28,
      hpMax: 35,
    });
    data.adobe = {
      classLevels: [
        { classId: "druid", level: 2 },
        { classId: "warlock", level: 2 },
      ],
      companions: [
        { type: "familiar", name: "Keep manual card", notes: "Private notes" },
      ],
      classFeatureChoices: { "keep:choice": ["saved"] },
    };
    for (const payment of ["wild-shape", "slot-1", "pact"]) {
      assert.equal(
        F.summon(
          data,
          { formId: "srd-2024-owl", payment, confirmed: true },
          { level: 4 },
        ).ok,
        true,
      );
      F.setMaximum(data, 12);
      F.setHP(data, 8);
      F.setTemp(data, 4);
      F.changePresence(data, "pocket");
      revision = await player.save({
        campaignId: "a",
        characterId: "c1",
        revision,
        data,
        identity,
        previousIdentity: identity,
      });
      data = (await player.load("a", "c1")).data;
      assert.equal(F.state(data).payment, payment);
      assert.equal(F.state(data).status, "pocket");
      assert.equal(F.profile(data).hpMax, 12);
      assert.equal(F.profile(data).hp, 8);
      assert.equal(F.profile(data).temp, 4);
      assert.equal(W.state(data, 4).remaining, 1);
      assert.equal(data.slots[0].used, payment === "wild-shape" ? 0 : 1);
      const stored = data.rulesChoices.grants.__adobe.data;
      assert.equal(
        Number(stored.pactSlotsUsed || 0),
        payment === "pact" ? 1 : 0,
      );
      assert.equal(data.hpCurrent, 28);
      assert.equal(stored.companions[0].name, "Keep manual card");
      assert.deepEqual(stored.classFeatureChoices["keep:choice"], ["saved"]);
    }
    assert.equal(F.onRest(data, "long"), true);
    revision = await player.save({
      campaignId: "a",
      characterId: "c1",
      revision,
      data,
      identity,
      previousIdentity: identity,
    });
    assert.equal(
      F.state((await player.load("a", "c1")).data).reason,
      "long-rest",
    );
    console.log(
      "PASS Wild Companion Wild Shape/ordinary/Pact payments, pocket HP, independent/manual records and Long Rest expiry persist under unchanged rules",
    );
    let recoveryData = M.normalize({
      build: { classId: "druid", edition: "2024" },
      hpCurrent: 28,
      hpMax: 35,
    });
    recoveryData.adobe = {
      classLevels: [
        { classId: "druid", level: 5 },
        { classId: "warlock", level: 3 },
      ],
      classFeatureChoices: { "keep:choice": ["saved"] },
    };
    W.otherUse(recoveryData, 8);
    W.otherUse(recoveryData, 8);
    let recoveryRevision = 0;
    for (const payment of ["slot-1", "pact"]) {
      assert.equal(
        D.regain(recoveryData, payment, { level: 8, ownTurn: true }).ok,
        true,
      );
      recoveryRevision = await player.save({
        campaignId: "a",
        characterId: "c2",
        revision: recoveryRevision,
        data: recoveryData,
        identity: recoveryIdentity,
        previousIdentity: recoveryIdentity,
      });
      recoveryData = (await player.load("a", "c2")).data;
      assert.equal(D.status(recoveryData, { level: 8 }).usedThisTurn, true);
      assert.equal(W.state(recoveryData, 8).remaining, 1);
      assert.equal(recoveryData.slots[0].used, 1);
      assert.equal(
        Number(
          recoveryData.rulesChoices.grants.__adobe.data.pactSlotsUsed || 0,
        ),
        payment === "pact" ? 1 : 0,
      );
      assert.equal(recoveryData.hpCurrent, 28);
      assert.equal(
        D.regain(recoveryData, payment, { level: 8, ownTurn: true }).ok,
        false,
      );
      if (payment === "slot-1") {
        W.otherUse(recoveryData, 8);
        D.onRest(recoveryData, "turn");
      }
    }
    console.log(
      "PASS Wild Resurgence ordinary/Pact payments and once-per-own-turn limit persist through the actual store under unchanged rules",
    );
    const outsider = createCharacterSheetStore({
      ...sdk,
      db: env.authenticatedContext("other").firestore(),
      auth: { currentUser: { uid: "other" } },
    });
    await assertFails(outsider.load("a", "c1"));
    await assertFails(outsider.load("a", "c2"));
    await assertFails(
      outsider.save({
        campaignId: "a",
        characterId: "c2",
        revision: recoveryRevision,
        data: recoveryData,
        identity: recoveryIdentity,
        previousIdentity: recoveryIdentity,
      }),
    );
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
