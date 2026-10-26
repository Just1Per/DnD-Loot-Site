"use strict";
const { test } = require("node:test"),
  assert = require("node:assert/strict");
const M = require("../js/modules/character-sheet-model"),
  I = require("../js/modules/character-cleric-intervention"),
  C = require("../js/modules/character-class-feature-choices"),
  F = require("../js/modules/character-feat-rules"),
  Catalog = require("../js/modules/character-catalog");
const catalog = require("../data/rules/catalog.json");
Catalog.set(catalog);
const make = (level = 10, edition = "2024") => {
  const d = M.normalize({
    build: { classId: "cleric", edition, scoreMode: "final" },
    hpCurrent: 12,
    hpTemp: 4,
    abilities: { wis: 16 },
    slots: [{ max: 4, used: 3 }],
  });
  d.adobe = {
    classLevels: [{ classId: "cleric", level }],
    pactSlotsUsed: 2,
    classFeatureChoices: { "keep:choice": ["saved"] },
  };
  return d;
};
const id = (name) =>
  catalog.spells.find((s) => s.edition === "2024" && s.name === name).id;
const cast = (d, opts = {}, level = 10) =>
  I.cast(d, { spellId: id("Revivify"), confirmed: true, ...opts }, { level });
const attempt = (d, roll, level = 10) =>
  I.attempt(d, { roll, confirmed: true }, { level });
test("actual Cleric levels 1–20 in both editions unlock only at 10, level20 grants Wish or automatic legacy success", () => {
  for (const edition of ["2014", "2024"])
    for (let level = 1; level <= 20; level++) {
      const d = make(level, edition),
        before = JSON.stringify(d),
        s = I.status(d, { level });
      assert.equal(s.available, level >= 10);
      assert.equal(JSON.stringify(d), before);
      assert.equal(
        I.spells(d, { level }).some((s) => s.choiceId === I.wishId),
        edition === "2024" && level === 20,
      );
      assert.equal(
        edition === "2024" ? cast(d, {}, level).ok : attempt(d, 1, level).ok,
        level >= 10,
      );
    }
});
test("multiclass never borrows other class levels and caps assignments at character total", () => {
  const d = make();
  d.adobe.classLevels = [
    { classId: "fighter", level: 11 },
    { classId: "cleric", level: 20 },
  ];
  assert.equal(I.status(d, { level: 20 }).level, 9);
  assert.equal(cast(d, {}, 20).ok, false);
  d.adobe.classLevels = [
    { classId: "cleric", level: 10 },
    { classId: "fighter", level: 10 },
  ];
  assert.equal(cast(d, {}, 20).ok, true);
  assert.equal(
    I.spells(d, { level: 20 }).some((s) => s.choiceId === I.wishId),
    false,
  );
});
test("modern catalogue permits unprepared cantrips through 5 only and respects campaign-approved catalogue", () => {
  const d = make(),
    rows = I.spells(d, { level: 10 });
  assert.ok(rows.length > 20);
  assert.ok(rows.some((r) => r.level === 0));
  assert.ok(
    rows.every(
      (r) =>
        r.level <= 5 &&
        r.classes.includes("cleric") &&
        !/reaction/i.test(r.casting),
    ),
  );
  for (const spellId of ["unknown", id("Fireball"), id("Heal"), id("Wish")])
    assert.equal(cast(d, { spellId }).ok, false);
  assert.equal(d.spells.length, 0);
  assert.equal(cast(d).ok, true);
  assert.equal(d.spells.length, 0);
  const custom = structuredClone(catalog);
  custom.spells.push({
    ...custom.spells[0],
    id: "Spell-test-reaction",
    name: "Reaction test",
    edition: "2024",
    classes: ["cleric"],
    casting: "1 Reaction",
    level: 1,
  });
  Catalog.set(custom);
  assert.equal(
    I.spells(make(), { level: 10 }).some((r) => r.id === "Spell-test-reaction"),
    false,
  );
  Catalog.set(catalog);
  global.CampaignRules = {
    allowed: (row) => row.name !== "Revivify",
    feats: (rows) => rows,
  };
  try {
    const fresh = make(),
      before = structuredClone(fresh);
    assert.equal(
      I.spells(fresh, { level: 10 }).some((row) => row.name === "Revivify"),
      false,
    );
    assert.equal(cast(fresh).ok, false);
    assert.deepEqual(fresh, before);
  } finally {
    delete global.CampaignRules;
  }
});
test("recording modern cast changes only its ledger, requires confirmation, cannot double spend and survives round-trip", () => {
  const d = make(),
    before = structuredClone(d);
  assert.equal(cast(d, { confirmed: false }).ok, false);
  assert.deepEqual(d, before);
  assert.equal(cast(d).ok, true);
  const after = structuredClone(d);
  delete after.adobe.classFeatureChoices[I.key("2024")];
  assert.deepEqual(after, before);
  assert.equal(cast(d).ok, false);
  const serialized = structuredClone(d);
  serialized.rulesChoices.grants.__adobe = { data: serialized.adobe };
  delete serialized.adobe;
  const saved = JSON.parse(JSON.stringify(serialized));
  assert.equal(I.status(saved, { level: 10 }).ready, false);
  const envelope = structuredClone(d);
  envelope.rulesChoices.grants.__adobe = { data: envelope.adobe };
  delete envelope.adobe;
  assert.deepEqual(
    I.status(envelope, { level: 10 }),
    I.status(d, { level: 10 }),
  );
  for (const event of ["short", "turn", "initiative", "day"])
    assert.equal(I.onRest(d, event), false);
  assert.equal(I.onRest(d, "long"), true);
  assert.equal(I.status(d, { level: 10 }).ready, true);
});
test("Wish accepts a rolled integer 2–8 only at actual Cleric20 and blocks every intervention until all rests", () => {
  for (const rests of [undefined, 0, 1, 9, 2.5, "4", NaN]) {
    const d = make(20),
      before = structuredClone(d);
    assert.equal(
      cast(d, { spellId: id("Wish"), wishRests: rests }, 20).ok,
      false,
    );
    assert.deepEqual(d, before);
  }
  for (const rests of [2, 4, 8]) {
    const d = make(20);
    assert.equal(
      cast(d, { spellId: id("Wish"), wishRests: rests }, 20).ok,
      true,
    );
    for (let n = rests; n > 0; n--) {
      assert.equal(I.status(d, { level: 20 }).record.remaining, n);
      assert.equal(cast(d, {}, 20).ok, false);
      assert.equal(I.onRest(d, "short"), false);
      F.reset(d, "long", { level: 20 });
    }
    assert.equal(I.status(d, { level: 20 }).ready, true);
    assert.equal(cast(d, {}, 20).ok, true);
  }
});
test("legacy percentile boundary, 00=100, level20 automatic, failed attempts recover only on Long Rest", () => {
  for (const level of [10, 11, 19])
    for (const roll of [1, level, level + 1, 100]) {
      const d = make(level, "2014"),
        result = attempt(d, roll, level);
      assert.equal(result.success, roll <= level);
      assert.equal(
        I.status(d, { level }).record.kind,
        result.success ? "days" : "rest",
      );
    }
  for (const roll of [0, 101, 2.5, "10", NaN, undefined])
    assert.equal(attempt(make(10, "2014"), roll).ok, false);
  const d = make(20, "2014");
  assert.equal(attempt(d, undefined, 20).success, true);
  assert.equal(I.status(d, { level: 20 }).record.last, "automatic");
  const fail = make(10, "2014");
  assert.equal(attempt(fail, 100).success, false);
  assert.equal(I.campaignDay(fail), false);
  I.onRest(fail, "short");
  assert.equal(I.status(fail, { level: 10 }).ready, false);
  I.onRest(fail, "long");
  assert.equal(I.status(fail, { level: 10 }).ready, true);
});
test("legacy success waits exactly 7 explicit campaign days, unaffected by any number of rests", () => {
  const d = make(10, "2014");
  attempt(d, 10);
  for (let day = 7; day > 0; day--) {
    for (const event of ["short", "long", "turn", "initiative"])
      C.resetClassResources(d, event, { level: 10 });
    assert.equal(I.status(d, { level: 10 }).record.remaining, day);
    assert.equal(attempt(d, 1).ok, false);
    assert.equal(I.campaignDay(d), true);
  }
  assert.equal(I.campaignDay(d), false);
  assert.equal(I.status(d, { level: 10 }).ready, true);
});
test("both source ledgers persist through class/level/source removal and rest only advances rest-based locks", () => {
  const d = make(20);
  cast(d, { spellId: id("Wish"), wishRests: 4 }, 20);
  d.build.edition = "2014";
  attempt(d, undefined, 20);
  const legacy = I.ledger(d, "2014");
  d.build.classId = "fighter";
  d.adobe.classLevels = [{ classId: "fighter", level: 20 }];
  C.resetClassResources(d, "long", { level: 20 });
  assert.equal(I.ledger(d, "2024").remaining, 3);
  assert.deepEqual(I.ledger(d, "2014"), legacy);
  d.build.classId = "cleric";
  d.build.edition = "2024";
  d.adobe.classLevels = [{ classId: "cleric", level: 10 }];
  assert.equal(cast(d).ok, false);
  const serialized = structuredClone(d);
  serialized.rulesChoices.grants.__adobe = { data: serialized.adobe };
  delete serialized.adobe;
  assert.equal(
    I.ledger(JSON.parse(JSON.stringify(serialized)), "2024").remaining,
    3,
  );
});
test("corrupt cooldowns fail closed, neither rest nor day silently discards them", () => {
  for (const edition of ["2014", "2024"])
    for (const record of [
      ["wish", "9", I.wishId],
      ["rest", "-1", "spell-test"],
      ["rest", "0.5", "spell-test"],
      ["bogus", "1", "spell-test"],
      ["rest", "1"],
      ["rest", "1", {}],
      ["rest", "1", "spell-test", "extra"],
      "bad",
    ]) {
      const d = make(20, edition);
      d.adobe.classFeatureChoices[I.key(edition)] = record;
      const before = structuredClone(d);
      assert.equal(I.status(d, { level: 20 }).ready, false);
      assert.equal(I.onRest(d, "long"), false);
      assert.equal(I.campaignDay(d), false);
      assert.deepEqual(d, before);
    }
});
test("capacity failure is atomic; existing ledgers still recover at capacity", () => {
  const d = make();
  d.adobe.classFeatureChoices = Object.fromEntries(
    Array.from({ length: 100 }, (_, i) => ["other:" + i, ["kept"]]),
  );
  const before = structuredClone(d);
  assert.equal(cast(d).ok, false);
  assert.deepEqual(d, before);
  delete d.adobe.classFeatureChoices["other:0"];
  assert.equal(cast(d).ok, true);
  assert.equal(I.onRest(d, "long"), true);
  assert.equal(Object.keys(d.adobe.classFeatureChoices).length, 100);
});
test("Long Rest entry points advance once each, including full catalogue reset; no implicit derivation reset", () => {
  const d = make(20);
  cast(d, { spellId: id("Wish"), wishRests: 8 }, 20);
  F.reset(d, "long", { level: 20 });
  assert.equal(I.ledger(d, "2024").remaining, 7);
  Catalog.longRest(d);
  assert.equal(I.ledger(d, "2024").remaining, 6);
  const before = JSON.stringify(d);
  assert.match(M.derive(d, 20).clericIntervention, /6 completed Long Rests/);
  M.derive(d, 20);
  assert.equal(JSON.stringify(d), before);
});
