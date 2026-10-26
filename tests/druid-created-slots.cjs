"use strict";
const { test } = require("node:test"),
  assert = require("node:assert/strict");
const M = require("../js/modules/character-sheet-model"),
  C = require("../js/modules/character-class-feature-choices"),
  W = require("../js/modules/character-wild-shape"),
  F = require("../js/modules/character-wild-companion"),
  D = require("../js/modules/character-druid-conversions"),
  P = require("../js/modules/character-progression");
const make = (level = 5, edition = "2024") => {
  const d = M.normalize({
    build: { classId: "druid", edition },
    hpCurrent: 20,
    hpTemp: 7,
  });
  d.adobe = {
    classLevels: [{ classId: "druid", level }],
    classFeatureChoices: { "keep:choice": ["saved"] },
    companions: [{ type: "companion", name: "Keep this card" }],
  };
  const max = P.spellSlots(d.adobe.classLevels, edition);
  d.slots.forEach((s, i) => (s.max = max[i] || 0));
  return d;
};
const create = (d, feature = "resurgence", uses = 1, level = 5) =>
  D.create(d, feature, uses, { level });
test("actual levels 1–20 and editions distinguish Wild Resurgence at 5 and Nature Magician at 20", () => {
  for (const edition of ["2014", "2024"])
    for (let level = 1; level <= 20; level++)
      for (const feature of ["resurgence", "nature"]) {
        const d = make(level, edition),
          allowed =
            edition === "2024" && level >= (feature === "nature" ? 20 : 5);
        assert.equal(
          D.creationStatus(d, feature, 1, { level }).available,
          allowed,
        );
        assert.equal(create(d, feature, 1, level).ok, allowed);
      }
});
test("Wild Resurgence adds an extra level-1 slot even when ordinary slots are full, without altering any ordinary/Pact state", () => {
  const d = make(),
    before = JSON.stringify({
      slots: d.slots,
      hp: d.hpCurrent,
      temp: d.hpTemp,
      cards: d.adobe.companions,
      spells: d.spells,
    });
  assert.equal(create(d).ok, true);
  assert.equal(W.state(d, 5).remaining, 1);
  assert.equal(D.createdSlots(d)[0].available, 1);
  assert.equal(D.createdSlots(d)[0].level, 1);
  assert.equal(W.undoOther(d, 5), false);
  assert.equal(
    JSON.stringify({
      slots: d.slots,
      hp: d.hpCurrent,
      temp: d.hpTemp,
      cards: d.adobe.companions,
      spells: d.spells,
    }),
    before,
  );
  const paid = JSON.stringify(d);
  assert.equal(create(d).ok, false);
  assert.equal(JSON.stringify(d), paid);
});
test("Nature Magician converts 1–4 available uses into exactly one level 2/4/6/8 slot", () => {
  for (let uses = 1; uses <= 4; uses++) {
    const d = make(20);
    assert.equal(create(d, "nature", uses, 20).ok, true);
    const rows = D.createdSlots(d);
    assert.equal(rows.length, 1);
    assert.equal(rows[0].level, uses * 2);
    assert.equal(rows[0].max, 1);
    assert.equal(W.state(d, 20).remaining, 4 - uses);
    assert.equal(W.undoOther(d, 20), false);
  }
});
test("the two creation limits are independent; Short Rest, initiative and turn do not refresh them or expire extra slots", () => {
  const d = make(20);
  assert.equal(create(d, "resurgence", 1, 20).ok, true);
  C.resetClassResources(d, "short", { level: 20 });
  assert.equal(create(d, "nature", 4, 20).ok, true);
  for (const event of ["short", "initiative", "turn"]) {
    C.resetClassResources(d, event, { level: 20 });
    assert.equal(D.createdSlots(d).length, 2);
    assert.equal(create(d, "resurgence", 1, 20).ok, false);
    assert.equal(create(d, "nature", 1, 20).ok, false);
  }
  d.build.edition = "2014";
  d.adobe.classLevels = [{ classId: "fighter", level: 20 }];
  C.resetClassResources(d, "long", { level: 20 });
  assert.equal(D.createdSlots(d).length, 0);
  assert.deepEqual(d.adobe.classFeatureChoices["keep:choice"], ["saved"]);
});
test("invalid costs, unknown features and exhausted pools fail atomically", () => {
  for (const [feature, uses] of [
    ["nature", 0],
    ["nature", 5],
    ["nature", 1.5],
    ["nature", "2"],
    ["resurgence", 2],
    ["unknown", 1],
  ]) {
    const d = make(20),
      before = JSON.stringify(d);
    assert.equal(create(d, feature, uses, 20).ok, false);
    assert.equal(JSON.stringify(d), before);
  }
  const d = make(20);
  for (let i = 0; i < 4; i++) W.otherUse(d, 20);
  const before = JSON.stringify(d);
  assert.equal(create(d, "nature", 1, 20).ok, false);
  assert.equal(JSON.stringify(d), before);
});
test("extra slot Use/Undo tracks its own state without changing Wild Shape, ordinary slots or another feature effect", () => {
  const d = make();
  create(d);
  const uses = W.state(d, 5).used,
    ordinary = JSON.stringify(d.slots);
  assert.equal(D.changeCreatedUse(d, 1, true), true);
  assert.equal(D.createdSlots(d)[0].available, 0);
  assert.equal(D.changeCreatedUse(d, 1, true), false);
  assert.equal(D.changeCreatedUse(d, 1, false), true);
  assert.equal(D.createdSlots(d)[0].available, 1);
  assert.equal(W.state(d, 5).used, uses);
  assert.equal(JSON.stringify(d.slots), ordinary);
});
test("a created slot can pay Wild Companion without touching ordinary/Pact slots or spending Wild Shape again", () => {
  W.setCatalogue(require("../data/rules/wild-shapes-v1.json"));
  const d = make();
  create(d);
  const ordinary = JSON.stringify(d.slots);
  assert.equal(
    F.summon(d, { formId: "srd-2024-owl", payment: "created-1" }, { level: 5 })
      .ok,
    true,
  );
  assert.equal(F.state(d).alive, true);
  assert.equal(D.createdSlots(d)[0].used, 1);
  assert.equal(W.state(d, 5).used, 1);
  assert.equal(JSON.stringify(d.slots), ordinary);
  assert.equal(
    F.summon(
      d,
      { formId: "srd-2024-owl", payment: "created-1", confirmed: true },
      { level: 5 },
    ).ok,
    false,
  );
});
test("a created slot can pay own-turn Wild Resurgence recovery and is consumed atomically", () => {
  const d = make();
  create(d);
  W.otherUse(d, 5);
  const ordinary = JSON.stringify(d.slots);
  assert.equal(D.regain(d, "created-1", { level: 5, ownTurn: true }).ok, true);
  assert.equal(W.state(d, 5).remaining, 1);
  assert.equal(D.createdSlots(d)[0].used, 1);
  assert.equal(JSON.stringify(d.slots), ordinary);
});
test("Wizard recovery includes eligible spent created slots in the same budget while preserving pool identity", () => {
  const d = make();
  d.adobe.classLevels.push({ classId: "wizard", level: 5 });
  create(d, "resurgence", 1, 10);
  D.changeCreatedUse(d, 1, true);
  d.slots[0].used = 1;
  const context = {
    level: 10,
    slotMax: P.spellSlots(d.adobe.classLevels, "2024"),
  };
  assert.ok(
    C.arcaneRecovery(d, context).slots.some(
      (r) => r.id === "created-1" && r.used === 1,
    ),
  );
  assert.equal(
    C.restoreArcaneSlots(d, { 1: 1, "created-1": 1 }, context),
    true,
  );
  assert.equal(d.slots[0].used, 0);
  assert.equal(D.createdSlots(d)[0].available, 1);
  D.changeCreatedUse(d, 1, true);
  assert.equal(C.restoreArcaneSlots(d, { "created-1": 1 }, context), false);
  const high = make(20);
  create(high, "nature", 3, 20);
  D.changeCreatedUse(high, 6, true);
  high.adobe.classLevels = [
    { classId: "druid", level: 19 },
    { classId: "wizard", level: 1 },
  ];
  assert.equal(
    C.arcaneRecovery(high, {
      level: 20,
      slotMax: P.spellSlots(high.adobe.classLevels, "2024"),
    }).slots.some((r) => r.id === "created-6"),
    false,
  );
});
test("Bard Font of Inspiration can consume the extra slot without using an ordinary/Pact slot", () => {
  const d = make();
  d.adobe.classLevels.push({ classId: "bard", level: 5 });
  const context = {
    level: 10,
    mods: { cha: 3 },
    slotMax: P.spellSlots(d.adobe.classLevels, "2024"),
  };
  create(d, "resurgence", 1, 10);
  C.changeClassResource(d, "bard-inspiration", 1, context);
  const ordinary = JSON.stringify(d.slots);
  assert.equal(C.restoreBardFromSlot(d, "created-1", context), true);
  assert.equal(
    C.classResources(d, context).find((r) => r.id === "bard-inspiration").used,
    0,
  );
  assert.equal(D.createdSlots(d)[0].used, 1);
  assert.equal(JSON.stringify(d.slots), ordinary);
});
test("source caps/duplicates, malformed records and saved class/source changes cannot create free slots", () => {
  const d = make();
  d.adobe.classLevels = [
    { classId: "druid", level: 4 },
    { classId: "druid", level: 16 },
  ];
  assert.equal(create(d, "resurgence", 1, 20).ok, false);
  const saved = make();
  create(saved);
  saved.rulesChoices.grants.__adobe = { data: saved.adobe, used: 0 };
  delete saved.adobe;
  assert.equal(D.createdSlots(saved)[0].available, 1);
  assert.equal(create(saved).ok, false);
  saved.build.edition = "2014";
  assert.equal(create(saved).ok, false);
  assert.equal(D.createdSlots(saved)[0].available, 1);
  const bad = make();
  bad.adobe.classFeatureChoices["2024:druid:created-slot-1"] = ["unknown"];
  assert.equal(create(bad).ok, false);
  assert.equal(D.changeCreatedUse(bad, 1, false), false);
  D.onRest(bad, "long");
  assert.equal(create(bad).ok, true);
});
test("creation, familiar payment and mixed recovery fail atomically at the existing choice-map capacity", () => {
  const fill = (d) => {
    const map = d.adobe.classFeatureChoices;
    for (let i = 0; Object.keys(map).length < 100; i++)
      map["keep:" + i] = ["saved"];
  };
  const d = make();
  fill(d);
  let before = JSON.stringify(d);
  assert.equal(create(d).ok, false);
  assert.equal(JSON.stringify(d), before);
  const familiar = make();
  create(familiar);
  fill(familiar);
  before = JSON.stringify(familiar);
  assert.equal(
    F.summon(
      familiar,
      { formId: "srd-2024-owl", payment: "created-1" },
      { level: 5 },
    ).ok,
    false,
  );
  assert.equal(JSON.stringify(familiar), before);
  const wizard = make();
  wizard.adobe.classLevels.push({ classId: "wizard", level: 5 });
  create(wizard, "resurgence", 1, 10);
  D.changeCreatedUse(wizard, 1, true);
  wizard.slots[0].used = 1;
  fill(wizard);
  before = JSON.stringify(wizard);
  assert.equal(
    C.restoreArcaneSlots(
      wizard,
      { 1: 1, "created-1": 1 },
      { level: 10, slotMax: P.spellSlots(wizard.adobe.classLevels, "2024") },
    ),
    false,
  );
  assert.equal(JSON.stringify(wizard), before);
});
