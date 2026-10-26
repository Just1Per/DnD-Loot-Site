"use strict";
const { test } = require("node:test"),
  assert = require("node:assert/strict");
const M = require("../js/modules/character-sheet-model"),
  C = require("../js/modules/character-class-feature-choices"),
  W = require("../js/modules/character-wild-shape"),
  D = require("../js/modules/character-druid-conversions");
const make = (level = 5, edition = "2024") => {
  const d = M.normalize({
    build: { classId: "druid", edition },
    hpCurrent: 20,
    hpTemp: 7,
  });
  d.adobe = {
    classLevels: [{ classId: "druid", level }],
    classFeatureChoices: { "keep:choice": ["saved"] },
    companions: [{ type: "companion", name: "Keep" }],
  };
  for (let i = 0; i < Math.min(4, W.state(d, level).maxUses); i++)
    W.otherUse(d, level);
  return d;
};
const regain = (d, level = 5, payment = "slot-1") =>
  D.regain(d, payment, { level, ownTurn: true });
test("2024 actual Druid 5 unlocks slot-to-Wild-Shape conversion across levels 1–20; legacy source is unchanged", () => {
  for (const edition of ["2014", "2024"])
    for (let level = 1; level <= 20; level++) {
      const d = make(level, edition);
      assert.equal(
        D.status(d, { level }).available,
        edition === "2024" && level >= 5,
      );
      assert.equal(regain(d, level).ok, edition === "2024" && level >= 5);
    }
});
test("one ordinary slot pays for exactly one Wild Shape and survives stored max/used normalization", () => {
  const d = make(),
    other = JSON.stringify({
      hp: d.hpCurrent,
      temp: d.hpTemp,
      cards: d.adobe.companions,
      spells: d.spells,
      coins: d.coins,
    });
  assert.equal(regain(d).ok, true);
  assert.equal(W.state(d, 5).remaining, 1);
  assert.equal(d.slots[0].used, 1);
  assert.equal(M.normalize(d).slots[0].used, 1);
  assert.equal(d.slots[0].max, 4);
  assert.equal(W.undoOther(d, 5), false);
  assert.deepEqual(d.adobe.classFeatureChoices["keep:choice"], ["saved"]);
  assert.equal(
    JSON.stringify({
      hp: d.hpCurrent,
      temp: d.hpTemp,
      cards: d.adobe.companions,
      spells: d.spells,
      coins: d.coins,
    }),
    other,
  );
});
test("own-turn acknowledgement is required; restored uses cannot be banked while the pool is nonempty", () => {
  for (const ownTurn of [false, undefined, "true", 1]) {
    const d = make(),
      before = JSON.stringify(d);
    assert.equal(D.regain(d, "slot-1", { level: 5, ownTurn }).ok, false);
    assert.equal(JSON.stringify(d), before);
  }
  const d = make();
  C.resetClassResources(d, "long", { level: 5 });
  const before = JSON.stringify(d);
  assert.equal(regain(d).ok, false);
  assert.equal(JSON.stringify(d), before);
});
test("once-per-own-turn flag prevents repeated use after the regained Wild Shape is spent; turn reset never manufactures uses", () => {
  const d = make();
  assert.equal(regain(d).ok, true);
  W.otherUse(d, 5);
  const before = JSON.stringify(d);
  assert.equal(regain(d).ok, false);
  assert.equal(JSON.stringify(d), before);
  assert.equal(D.onRest(d, "turn"), true);
  assert.equal(W.state(d, 5).remaining, 0);
  assert.equal(regain(d).ok, true);
  assert.equal(d.slots[0].used, 2);
});
test("higher ordinary slots and Pact Magic remain distinct and do not change another slot pool", () => {
  const d = make();
  d.adobe.classLevels.push({ classId: "warlock", level: 3 });
  assert.equal(regain(d, 8, "pact").ok, true);
  assert.equal(d.adobe.pactSlotsUsed, 1);
  assert.equal(d.adobe.pactSlotsSeparated, true);
  assert.equal(d.slots[0].used, 0);
  W.otherUse(d, 8);
  D.onRest(d, "turn");
  assert.equal(regain(d, 8, "slot-3").ok, true);
  assert.equal(d.slots[2].used, 1);
  assert.equal(d.adobe.pactSlotsUsed, 1);
});
test("invalid, exhausted or unavailable slot choices are rejected without changing any state", () => {
  for (const payment of [
    "wild-shape",
    "pact",
    "slot-0",
    "slot-4",
    "slot-9",
    null,
    1,
    "other",
  ]) {
    const d = make(),
      before = JSON.stringify(d);
    assert.equal(regain(d, 5, payment).ok, false);
    assert.equal(JSON.stringify(d), before);
  }
  const d = make();
  d.slots[0].used = 4;
  const before = JSON.stringify(d);
  assert.equal(regain(d).ok, false);
  assert.equal(JSON.stringify(d), before);
});
test("multiclass caps, duplicate classes and non-Druid assignments cannot manufacture an unlock", () => {
  for (const levels of [
    [
      { classId: "fighter", level: 16 },
      { classId: "druid", level: 5 },
    ],
    [
      { classId: "druid", level: 4 },
      { classId: "druid", level: 2 },
    ],
    [{ classId: "wizard", level: 5 }],
  ]) {
    const d = make();
    d.adobe.classLevels = levels;
    assert.equal(D.status(d, { level: 20 }).available, false);
  }
});
test("recorded limits survive edition/level changes and the existing save envelope", () => {
  const d = make();
  assert.equal(regain(d).ok, true);
  W.otherUse(d, 5);
  const raw = structuredClone(d);
  raw.rulesChoices.grants.__adobe = { data: raw.adobe, used: 0 };
  delete raw.adobe;
  assert.equal(D.status(raw, { level: 5 }).usedThisTurn, true);
  raw.build.edition = "2014";
  assert.equal(regain(raw).ok, false);
  raw.build.edition = "2024";
  assert.equal(regain(raw).ok, false);
  D.onRest(raw, "long");
  assert.equal(regain(raw).ok, true);
});
test("map-capacity failure is atomic for both ordinary and Pact payments", () => {
  for (const payment of ["slot-1", "pact"]) {
    const d = make();
    d.adobe.classLevels.push({ classId: "warlock", level: 2 });
    const map = d.adobe.classFeatureChoices;
    for (let i = 0; Object.keys(map).length < 100; i++)
      map["keep:" + i] = ["saved"];
    const before = JSON.stringify(d);
    assert.equal(regain(d, 7, payment).ok, false);
    assert.equal(JSON.stringify(d), before);
  }
});

test("class resource resets route only turn/Long Rest to the conversion flag, including after class/source removal", () => {
  const d = make();
  assert.equal(regain(d).ok, true);
  W.otherUse(d, 5);
  C.resetClassResources(d, "short", { level: 5 });
  assert.equal(D.status(d, { level: 5 }).usedThisTurn, true);
  assert.equal(W.state(d, 5).remaining, 1);
  C.resetClassResources(d, "initiative", { level: 5 });
  assert.equal(D.status(d, { level: 5 }).usedThisTurn, true);
  C.resetClassResources(d, "turn", { level: 5 });
  assert.equal(D.status(d, { level: 5 }).usedThisTurn, false);
  assert.equal(W.state(d, 5).remaining, 1);
  W.otherUse(d, 5);
  assert.equal(regain(d).ok, true);
  d.adobe.classLevels = [{ classId: "fighter", level: 5 }];
  d.build.edition = "2014";
  C.resetClassResources(d, "long", { level: 5 });
  assert.equal(D.status(d, { level: 5 }).usedThisTurn, false);
});
test("no-action recovery preserves an active Beast form, existing familiar, owner HP and temporary HP", () => {
  const F = require("../js/modules/character-wild-companion");
  W.setCatalogue(require("../data/rules/wild-shapes-v1.json"));
  const d = make();
  C.resetClassResources(d, "long", { level: 5 });
  assert.equal(
    F.summon(d, { formId: "srd-2024-owl", payment: "wild-shape" }, { level: 5 })
      .ok,
    true,
  );
  W.setKnown(d, 0, "srd-2024-wolf", 5);
  assert.equal(
    W.assume(d, "srd-2024-wolf", { level: 5, tempHP: "keep" }),
    true,
  );
  const original = JSON.stringify({
    active: W.state(d, 5).activeId,
    hp: W.state(d, 5).hp,
    familiar: F.state(d),
    owner: d.hpCurrent,
    temp: d.hpTemp,
  });
  assert.equal(W.state(d, 5).remaining, 0);
  assert.equal(regain(d).ok, true);
  assert.equal(
    JSON.stringify({
      active: W.state(d, 5).activeId,
      hp: W.state(d, 5).hp,
      familiar: F.state(d),
      owner: d.hpCurrent,
      temp: d.hpTemp,
    }),
    original,
  );
});

test("malformed nonempty saved turn flags do not grant an extra conversion; explicit next turn clears them", () => {
  for (const flag of ["unknown", "2", "0"]) {
    const d = make();
    d.adobe.classFeatureChoices[D.turnKey] = [flag];
    assert.equal(regain(d).ok, false);
    D.onRest(d, "turn");
    assert.equal(regain(d).ok, true);
  }
});
