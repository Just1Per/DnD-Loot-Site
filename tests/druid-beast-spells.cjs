"use strict";
const { test } = require("node:test"),
  assert = require("node:assert/strict");
const M = require("../js/modules/character-sheet-model"),
  W = require("../js/modules/character-wild-shape"),
  D = require("../js/modules/character-druid-spellcasting"),
  A = require("../js/modules/character-actions"),
  Catalog = require("../js/modules/character-catalog"),
  flags = require("../js/modules/character-spell-component-data"),
  catalog = require("../data/rules/catalog.json");
W.setCatalogue(require("../data/rules/wild-shapes-v1.json"));
Catalog.set(catalog);
const spell = (name, edition = "2024") =>
  catalog.spells.find((s) => s.name === name && s.edition === edition);
const make = (level = 18, edition = "2024", active = true) => {
  const d = M.normalize({
    build: { classId: "druid", edition, scoreMode: "final" },
    abilities: { wis: 16 },
    hpCurrent: 30,
  });
  d.adobe = {
    classLevels: [{ classId: "druid", level }],
    classFeatureChoices: {},
  };
  if (active) {
    const id = "srd-" + edition + "-wolf";
    if (edition === "2024") W.setKnown(d, 0, id, level);
    assert.equal(W.assume(d, id, { seen: true, gear: "merged", level }), true);
  }
  return d;
};
const assess = (d, name = "Guidance", level = 18, classId = "druid") =>
  D.assess(d, spell(name, d.build.edition), { level, classId });
test("component flag supplement matches all 969 current spell IDs and component flags without shipping material prose", () => {
  assert.equal(Object.keys(flags.spells).length, catalog.spells.length);
  assert.equal(flags.revision, catalog.indexRevision);
  for (const s of catalog.spells) {
    const row = flags.spells[s.id];
    assert.equal(row.length, 3);
    assert.equal(
      row[0],
      s.components.split(",").some((v) => v.trim() === "M"),
    );
    assert.equal(typeof row[1], "boolean");
    assert.ok([true, false, "optional"].includes(row[2]));
  }
  assert.deepEqual(flags.spells[spell("Revivify").id], [true, true, true]);
  assert.deepEqual(flags.spells[spell("Guidance").id], [false, false, false]);
  assert.deepEqual(flags.spells[spell("Goodberry").id], [true, false, false]);
});
test("both editions levels1–20 apply actual Druid thresholds without mutating the character", () => {
  for (const edition of ["2014", "2024"])
    for (let level = 1; level <= 20; level++) {
      const d = make(level, edition, level >= 2),
        before = JSON.stringify(d),
        r = assess(d, "Guidance", level);
      assert.equal(r.relevant, level >= 2);
      assert.equal(
        r.status,
        level < 2 ? "unrestricted" : level < 18 ? "check" : "allowed",
      );
      assert.equal(JSON.stringify(d), before);
    }
});
test("legacy 18/19 allows Druid Verbal/Somatic spells but no Material component or another class source", () => {
  for (const level of [18, 19]) {
    const d = make(level, "2014");
    assert.equal(assess(d, "Guidance", level).status, "allowed");
    assert.equal(assess(d, "Goodberry", level).status, "blocked");
    assert.equal(assess(d, "Guidance", level, "cleric").status, "check");
    assert.equal(assess(d, "Guidance", level, "").status, "check");
  }
});
test("modern18+ permits ordinary materials for any casting class, but blocks costly/consumed ones", () => {
  for (const level of [18, 19, 20]) {
    const d = make(level);
    assert.equal(assess(d, "Goodberry", level).status, "allowed");
    assert.equal(assess(d, "Guidance", level, "cleric").status, "allowed");
    assert.equal(assess(d, "Revivify", level).status, "blocked");
    assert.match(assess(d, "Revivify", level).label, /Costly/);
    const consumed = catalog.spells.find(
      (s) =>
        s.edition === "2024" &&
        flags.spells[s.id][2] === true &&
        !flags.spells[s.id][1],
    );
    if (consumed)
      assert.match(
        D.assess(d, consumed, { level, classId: "druid" }).label,
        /Consumed/,
      );
  }
});
test("legacy Archdruid20 waives components in normal and Beast form only for Druid spells", () => {
  for (const active of [false, true]) {
    const d = make(20, "2014", active);
    assert.deepEqual(assess(d, "Goodberry", 20).waived, ["V", "S", "M"]);
    assert.deepEqual(assess(d, "Guidance", 20).waived, ["V", "S"]);
    assert.equal(
      assess(d, "Revivify", 20).status,
      active ? "blocked" : "allowed",
    );
    assert.equal(assess(d, "Guidance", 20, "cleric").relevant, active);
    assert.match(D.summary(d, { level: 20 }), /normal form or Wild Shape/);
  }
});
test("custom/unverified Material metadata and optional consumption request a source check instead of inventing eligibility", () => {
  const d = make();
  assert.equal(
    D.assess(
      d,
      { id: "custom", components: "V, S, M" },
      { level: 18, classId: "druid" },
    ).status,
    "check",
  );
  const optional = catalog.spells.find(
    (s) => flags.spells[s.id][2] === "optional" && !flags.spells[s.id][1],
  );
  assert.equal(
    D.assess(d, optional, { level: 18, classId: "druid" }).status,
    "check",
  );
  const mismatch = { ...spell("Guidance"), components: "V, S, M" };
  assert.equal(
    D.assess(d, mismatch, { level: 18, classId: "druid" }).status,
    "check",
  );
});
test("multiclass total20 never grants Beast Spells or Archdruid below actual Druid thresholds", () => {
  const d = make(17);
  d.adobe.classLevels.push({ classId: "cleric", level: 3 });
  assert.equal(assess(d, "Guidance", 20).status, "check");
  const legacy = make(19, "2014");
  legacy.adobe.classLevels.push({ classId: "fighter", level: 1 });
  assert.equal(assess(legacy, "Goodberry", 20).status, "blocked");
});
test("invalid retained forms and class removal prompt a form check; ending Wild Shape removes modern restrictions", () => {
  const d = make();
  d.adobe.classFeatureChoices["2024:druid:wild-shape-active"] = ["not-a-form"];
  assert.equal(assess(d).status, "check");
  const fresh = make();
  W.end(fresh, 18);
  assert.equal(assess(fresh).relevant, false);
});
test("spell attack notes expose restrictions and source-specific legacy waivers without changing slots/spells", () => {
  const d = make(20, "2014");
  const s = spell("Guidance", "2014");
  d.spells = [{ ...Catalog.spellRow(s), classId: "druid" }];
  const before = JSON.stringify(d),
    r = A.resolve(
      { kind: "spell", ref: s.id + "::druid" },
      d,
      20,
      M.derive(d, 20),
      [],
      catalog.spells,
    );
  assert.ok(r.notes.some((n) => n.includes("Components waived")));
  assert.equal(JSON.stringify(d), before);
});
