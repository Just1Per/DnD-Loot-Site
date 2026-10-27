"use strict";
const { test } = require("node:test"),
  assert = require("node:assert/strict");
const M = require("../js/modules/character-sheet-model"),
  L = require("../js/modules/character-languages"),
  C = require("../js/modules/character-class-feature-choices"),
  R = require("../js/modules/character-rules");
const make = (edition = "2024", classId = "rogue", level = 1) => {
  const d = M.normalize({
    build: { edition, classId, standardLanguages: ["Elvish", "Orc"] },
    languages: "Old dialect",
    abilities: { dex: 15 },
  });
  d.adobe = {
    classLevels: [{ classId, level }],
    classFeatureChoices: { "keep:choice": ["saved"] },
  };
  return d;
};
test("grouped learned choices expose Abyssal and other rare languages while starting standard lists remain exact", () => {
  const groups = L.groups(),
    rare = groups.find((g) => g.name === "Rare languages").values;
  for (const lang of [
    "Abyssal",
    "Celestial",
    "Deep Speech",
    "Infernal",
    "Primordial",
    "Sylvan",
    "Undercommon",
  ])
    assert.ok(rare.includes(lang));
  assert.equal(groups.flatMap((g) => g.values).includes("Druidic"), false);
  assert.equal(
    L.groups("2024", true)
      .flatMap((g) => g.values)
      .includes("Druidic"),
    true,
  );
  assert.equal(R.modern.standardLanguages.includes("Abyssal"), false);
  assert.equal(R.modern.standardLanguages.includes("Draconic"), true);
  assert.equal(
    L.groups("2014")
      .find((g) => g.name === "Rare languages")
      .values.includes("Draconic"),
    true,
  );
});
test("adding/removing learned languages preserves custom text and rejects automatic, duplicate, secret, forged or overflowing entries atomically", () => {
  const d = make("2024", "fighter");
  assert.equal(L.add(d, "Abyssal", ["Common"]), true);
  assert.equal(d.languages, "Old dialect\nAbyssal");
  const before = JSON.stringify(d);
  for (const name of ["Abyssal", "Druidic", "Thieves' Cant", "fake"])
    assert.equal(L.add(d, name, ["Common"]), false);
  assert.equal(L.add(d, "Common", ["Common"]), false);
  assert.equal(JSON.stringify(d), before);
  assert.equal(L.remove(d, "Abyssal"), true);
  assert.equal(d.languages, "Old dialect");
  assert.equal(L.remove(d, "Abyssal"), false);
  d.languages = "x".repeat(12000);
  assert.equal(L.add(d, "Abyssal"), false);
  assert.equal(d.languages.length, 12000);
});
test("revised Rogue gains exactly one additional language from actual Rogue1 in primary or multiclass positions; legacy does not", () => {
  for (const edition of ["2014", "2024"])
    for (let level = 1; level <= 20; level++) {
      const d = make(edition, "rogue", level),
        before = JSON.stringify(d),
        r = M.derive(d, level).languageTraining;
      assert.equal(r.available, edition === "2024");
      assert.equal(JSON.stringify(d), before);
    }
  const d = make();
  d.adobe.classLevels = [
    { classId: "fighter", level: 19 },
    { classId: "rogue", level: 1 },
  ];
  assert.equal(M.derive(d, 20).languageTraining.available, true);
  assert.equal(M.derive(d, 19).languageTraining.available, false);
});
test("Rogue rare choices apply to derived Overview languages, validate exact owning field and survive saved envelopes without granting duplicate fixed languages", () => {
  const d = make(),
    first = M.derive(d, 1);
  assert.ok(
    first.effects.choiceIssues.some(
      (i) => i.target === "[data-rogue-language]",
    ),
  );
  assert.equal(
    L.setRogue(d, "Abyssal", { level: 1, known: first.languageTraining.known }),
    true,
  );
  let derived = M.derive(d, 1);
  assert.ok(derived.effects.languages.includes("Abyssal"));
  assert.equal(derived.languageTraining.valid, true);
  assert.equal(
    derived.effects.languages.filter((s) => s === "Abyssal").length,
    1,
  );
  const stored = structuredClone(d);
  stored.rulesChoices.grants.__adobe = { data: stored.adobe };
  delete stored.adobe;
  assert.ok(M.derive(stored, 1).effects.languages.includes("Abyssal"));
  assert.equal(
    L.setRogue(d, "Thieves' Cant", {
      level: 1,
      known: derived.languageTraining.known,
    }),
    false,
  );
  assert.equal(
    L.setRogue(d, "Druidic", {
      level: 1,
      known: derived.languageTraining.known,
    }),
    true,
  );
  assert.ok(M.derive(d, 1).effects.languages.includes("Druidic"));
});
test("source removal retains the choice without keeping its benefit, full choice maps fail atomically, derivation never writes learning text", () => {
  const d = make();
  L.setRogue(d, "Abyssal", { level: 1, known: ["Common"] });
  d.build.edition = "2014";
  assert.equal(M.derive(d, 1).effects.languages.includes("Abyssal"), false);
  assert.equal(d.adobe.classFeatureChoices[L.key][0], "abyssal");
  d.build.edition = "2024";
  assert.ok(M.derive(d, 1).effects.languages.includes("Abyssal"));
  const full = make();
  full.adobe.classFeatureChoices = Object.fromEntries(
    Array.from({ length: 100 }, (_, i) => ["other:" + i, ["kept"]]),
  );
  const before = JSON.stringify(full);
  assert.equal(
    L.setRogue(full, "Abyssal", { level: 1, known: ["Common"] }),
    false,
  );
  assert.equal(JSON.stringify(full), before);
  assert.equal(d.languages, "Old dialect");
});
test("duplicate/unknown saved class-language values produce an owning warning instead of silently granting a language", () => {
  for (const value of ["common", "elvish", "thieves-cant", "unknown"]) {
    const d = make();
    d.adobe.classFeatureChoices[L.key] = [value];
    const r = M.derive(d, 1);
    assert.equal(r.languageTraining.valid, false);
    assert.ok(
      r.effects.choiceIssues.some((i) => i.target === "[data-rogue-language]"),
    );
  }
});

test("the Rogue choice also rejects an already learned rare language without deleting the learned record", () => {
  const d = make();
  d.languages = "Abyssal";
  assert.equal(
    L.setRogue(d, "Abyssal", { level: 1, known: ["Common"] }),
    false,
  );
  assert.equal(d.languages, "Abyssal");
});
