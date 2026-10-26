global.CharacterEquipment = require("../js/modules/character-equipment");
global.CharacterMagicItemReference = require("../js/modules/character-magic-item-data");
global.CharacterMagicItems = require("../js/modules/character-magic-items");
const { test } = require("node:test"),
  assert = require("node:assert/strict"),
  M = require("../js/modules/character-sheet-model"),
  W = require("../js/modules/character-wild-shape"),
  forms = require("../data/rules/wild-shapes-v1.json");
W.setCatalogue(forms);
const make = (level = 2, edition = "2014", subclassId = "") => {
  const d = M.normalize({
    build: { classId: "druid", edition, scoreMode: "final" },
    abilities: { str: 10, dex: 14, con: 14, int: 12, wis: 16, cha: 10 },
    hpCurrent: 28,
    hpMax: 35,
    hpTemp: 0,
    conditions: "",
  });
  d.adobe = {
    classLevels: [{ classId: "druid", level, subclassId }],
    classFeatureChoices: { "keep:choice": ["safe"] },
    companions: [{ name: "Keep my familiar", type: "familiar" }],
  };
  return d;
};
const wolf = (e) => "srd-" + e + "-wolf",
  learn = (d, id = wolf("2024"), level = 2) => W.setKnown(d, 0, id, level),
  shape = (d, level = 2, options = {}) =>
    W.assume(d, wolf(d.build.edition), { level, seen: true, ...options });
test("actual Druid levels 1–20 distinguish edition limits, timing, known forms and legacy unlimited use", () => {
  for (const edition of ["2014", "2024"])
    for (let level = 1; level <= 20; level++) {
      const d = make(level, edition),
        l = W.limits(d, level);
      assert.equal(l.available, level >= 2);
      assert.equal(l.maxCR, level >= 8 ? 1 : level >= 4 ? 0.5 : 0.25);
      assert.equal(l.durationHours, Math.floor(level / 2));
      assert.equal(l.fly, level >= 8);
      assert.equal(l.swim, edition === "2024" || level >= 4);
      assert.equal(
        l.maxUses,
        edition === "2014"
          ? level === 20
            ? Infinity
            : 2
          : level >= 17
            ? 4
            : level >= 6
              ? 3
              : 2,
      );
      assert.equal(
        l.knownLimit,
        edition === "2024" ? (level >= 8 ? 8 : level >= 4 ? 6 : 4) : 0,
      );
    }
});
test("catalogue eligibility enforces source, Beast type, CR and source-specific swim/fly gates", () => {
  const d = make();
  assert.equal(W.eligible(d, wolf("2014"), 2), true);
  assert.equal(W.eligible(d, wolf("2024"), 2), false);
  assert.equal(W.eligible(d, "srd-2014-giant-spider", 2), false);
  assert.equal(W.eligible(make(8), "srd-2014-giant-spider", 8), true);
  assert.equal(W.eligible(d, "srd-2014-owl", 2), false);
  assert.equal(W.eligible(make(8), "srd-2014-owl", 8), true);
  assert.equal(W.eligible(d, "srd-2014-frog", 2), false);
  d.build.edition = "2024";
  assert.equal(W.eligible(d, "srd-2024-frog", 2), true);
});
test("native Moon forms use the correct CR, action, temporary HP and elemental exceptions", () => {
  const old = make(2, "2014", "moon");
  assert.equal(W.limits(old, 2).maxCR, 1);
  assert.equal(W.limits(old, 2).action, "Bonus Action");
  assert.equal(W.eligible(old, "srd-2014-dire-wolf", 2), true);
  assert.equal(W.eligible(old, "srd-2014-air-elemental", 9), false);
  old.adobe.classLevels[0].level = 10;
  assert.equal(W.eligible(old, "srd-2014-air-elemental", 10), true);
  assert.equal(
    W.assume(old, "srd-2014-air-elemental", { level: 10, seen: true }),
    true,
  );
  assert.equal(W.state(old, 10).remaining, 0);
  const modern = make(3, "2024", "moon-2024");
  assert.equal(W.limits(modern, 3).temporaryHP, 9);
  assert.equal(W.limits(modern, 3).maxCR, 1);
  assert.equal(W.eligible(modern, "srd-2014-air-elemental", 10), false);
  const wrong = make(2, "2014", "moon-2024");
  assert.equal(W.limits(wrong, 2).maxCR, 0.25);
});
test("legacy seen confirmation and modern known-form choices precede atomic transformation", () => {
  const old = make(),
    before = JSON.stringify(old);
  assert.equal(W.assume(old, wolf("2014"), { level: 2 }), false);
  assert.equal(JSON.stringify(old), before);
  assert.equal(shape(old), true);
  assert.equal(W.state(old).remaining, 1);
  W.end(old);
  assert.equal(W.assume(old, wolf("2014"), { level: 2 }), true);
  assert.equal(W.state(old).remaining, 0);
  const modern = make(2, "2024");
  assert.equal(shape(modern), false);
  assert.equal(learn(modern), true);
  assert.equal(W.setKnown(modern, 1, wolf("2024"), 2), false);
  assert.equal(W.setKnown(modern, 4, "srd-2024-cat", 2), false);
  assert.equal(W.setKnown(modern, 0, null, 2), false);
  assert.equal(shape(modern), true);
  assert.equal(W.state(modern).remaining, 1);
  assert.equal(modern.hpTemp, 2);
});
test("legacy shape profile retains mental stats and training and keeps normal HP, scores, inventory and companions intact", () => {
  const d = make(4);
  d.skills.perception.rank = 1;
  const saved = JSON.stringify({
    abilities: d.abilities,
    companions: d.adobe.companions,
    equipment: d.equipmentState,
  });
  assert.equal(shape(d, 4), true);
  const p = W.profile(d, { level: 4 });
  assert.equal(p.ac, 13);
  assert.equal(p.hp, 11);
  assert.equal(p.normalHP, 28);
  assert.equal(p.scores.str, 12);
  assert.equal(p.scores.dex, 15);
  assert.equal(p.scores.int, 12);
  assert.equal(p.scores.wis, 16);
  assert.equal(p.skills.perception, 5);
  assert.match(p.actions, /\+4 to hit/);
  assert.equal(
    JSON.stringify({
      abilities: d.abilities,
      companions: d.adobe.companions,
      equipment: d.equipmentState,
    }),
    saved,
  );
  assert.equal(d.hpCurrent, 28);
  assert.equal(W.end(d, 4), true);
  assert.equal(d.hpCurrent, 28);
  assert.equal(W.state(d, 4).remaining, 1);
});
test("legacy damage absorbs shared temporary HP, uses form HP and applies only overflow to normal HP before reverting", () => {
  const d = make(4);
  d.hpTemp = 3;
  shape(d, 4);
  assert.equal(W.damage(d, 5, { level: 4 }), true);
  assert.equal(d.hpTemp, 0);
  assert.equal(W.profile(d, { level: 4 }).hp, 9);
  assert.equal(d.hpCurrent, 28);
  assert.equal(W.damage(d, 12, { level: 4 }), true);
  assert.equal(W.state(d, 4).activeId, "");
  assert.equal(d.hpCurrent, 25);
  assert.equal(W.state(d, 4).remaining, 1);
});
test("modern HP/temporary HP choices do not stack or copy animal HP; reverting preserves character HP", () => {
  for (const [choice, hp] of [
    ["higher", 8],
    ["keep", 8],
    ["replace", 2],
  ]) {
    const d = make(2, "2024");
    d.hpTemp = 8;
    learn(d);
    assert.equal(shape(d, 2, { tempHP: choice }), true);
    assert.equal(d.hpTemp, hp);
    const p = W.profile(d, { level: 2 });
    assert.equal(p.hp, 28);
    assert.equal(p.hpMax, 35);
    assert.equal(p.ac, 12);
    assert.equal(p.scores.str, 14);
    W.damage(d, 10, { level: 2 });
    assert.equal(d.hpCurrent, 28 - (10 - hp));
    W.end(d, 2);
    assert.equal(d.hpCurrent, 28 - (10 - hp));
  }
});
test("healing/current form HP are bounded; legacy zero HP reverts without changing normal HP", () => {
  const d = make(4);
  shape(d, 4);
  W.damage(d, 7, { level: 4 });
  assert.equal(W.heal(d, 100, { level: 4 }), true);
  assert.equal(W.profile(d, { level: 4 }).hp, 11);
  assert.equal(W.setHP(d, 12, { level: 4 }), false);
  assert.equal(W.setHP(d, -1, { level: 4 }), false);
  assert.equal(W.setHP(d, 0, { level: 4 }), true);
  assert.equal(W.state(d, 4).activeId, "");
  assert.equal(d.hpCurrent, 28);
});
test("condition interruption ends the source-correct form, and source changes retain independent counters", () => {
  const d = make(4);
  shape(d, 4);
  d.conditions = "Stunned";
  assert.equal(W.settle(d, 4), false);
  d.conditions = "Unconscious";
  assert.equal(W.settle(d, 4), true);
  d.conditions = "";
  d.build.edition = "2024";
  learn(d, wolf("2024"), 4);
  shape(d, 4);
  d.conditions = "Poisoned; Stunned (until next turn)";
  assert.equal(W.settle(d, 4), true);
  d.conditions = "Not stunned";
  assert.equal(shape(d, 4), true);
  d.build.edition = "2014";
  assert.equal(W.state(d, 4).used, 1);
  for (const edition of ["2014", "2024"]) {
    const dead = make(4, edition);
    if (edition === "2024") learn(dead, wolf(edition), 4);
    shape(dead, 4);
    dead.conditions = "Dead";
    assert.equal(W.settle(dead, 4), true);
  }
});
test("modern known choices and active form HP persist in the existing save envelope without mutating derivation", () => {
  const d = make(4, "2024");
  learn(d, wolf("2024"), 4);
  shape(d, 4);
  const before = JSON.stringify(d),
    p = W.profile(d, { level: 4 }),
    saved = structuredClone(d);
  saved.rulesChoices.grants.__adobe = { data: saved.adobe };
  delete saved.adobe;
  assert.deepEqual(W.profile(saved, { level: 4 }), p);
  assert.equal(JSON.stringify(d), before);
  const old = make(4);
  shape(old, 4);
  W.damage(old, 3, { level: 4 });
  const reopened = structuredClone(old);
  reopened.rulesChoices.grants.__adobe = { data: reopened.adobe };
  delete reopened.adobe;
  assert.equal(W.profile(reopened, { level: 4 }).hp, 8);
});
test("capped multiclass levels, duplicates, missing classes and unknown forms cannot grant transformations", () => {
  const d = make(2);
  d.adobe.classLevels.unshift({ classId: "fighter", level: 19 });
  assert.equal(W.limits(d, 20).available, false);
  assert.equal(shape(d, 20), false);
  d.adobe.classLevels = [
    { classId: "druid", level: 2 },
    { classId: "druid", level: 18 },
  ];
  assert.equal(W.limits(d, 20).maxUses, 2);
  assert.equal(W.limits(d, 20).maxCR, 0.25);
  assert.equal(W.assume(d, "forged-form", { level: 20, seen: true }), false);
});
test("other-feature spends can be undone without refunds for transformations, and legacy level 20 remains unlimited", () => {
  const d = make(4);
  W.otherUse(d, 4);
  assert.equal(W.state(d, 4).remaining, 1);
  assert.equal(W.undoOther(d, 4), true);
  shape(d, 4);
  W.end(d, 4);
  assert.equal(W.undoOther(d, 4), false);
  const high = make(20);
  for (let i = 0; i < 5; i++) assert.equal(shape(high, 20), true);
  assert.equal(W.state(high, 20).remaining, Infinity);
});
test("all eligible catalogue forms produce finite readouts without mutating source data", () => {
  const before = JSON.stringify(forms);
  for (const edition of ["2014", "2024"]) {
    const d = make(20, edition, edition === "2014" ? "moon" : "moon-2024");
    for (const row of W.forms(d, 20)) {
      if (edition === "2024") W.setKnown(d, 0, row.id, 20);
      assert.equal(W.assume(d, row.id, { level: 20, seen: true }), true);
      const p = W.profile(d, { level: 20 });
      assert.ok(p.valid);
      for (const value of [
        ...Object.values(p.scores),
        ...Object.values(p.saves),
        ...Object.values(p.skills),
        p.ac,
        p.hpMax,
      ])
        assert.ok(Number.isFinite(value), row.id);
      if (edition === "2024")
        d.adobe.classFeatureChoices[W.state(d, 20).keys.spent] = ["0"];
    }
  }
  assert.equal(JSON.stringify(forms), before);
});

test("shared resource integration prevents generic transform refunds and follows source rest/initiative recovery", () => {
  const C = require("../js/modules/character-class-feature-choices");
  for (const edition of ["2014", "2024"]) {
    const d = make(6, edition),
      context = { level: 6 };
    W.otherUse(d, 6);
    W.otherUse(d, 6);
    assert.equal(
      C.classResources(d, context).find((r) => r.id === "druid-wild-shape")
        .remaining,
      edition === "2014" ? 0 : 1,
    );
    assert.equal(
      C.changeClassResource(d, "druid-wild-shape", -1, context),
      false,
    );
    assert.equal(
      C.changeClassResource(d, "druid-wild-shape", 1, context),
      false,
    );
    C.resetClassResources(d, "short", context);
    assert.equal(W.state(d, 6).remaining, edition === "2014" ? 2 : 2);
    assert.equal(W.undoOther(d, 6), false);
    C.resetClassResources(d, "long", context);
    assert.equal(W.state(d, 6).remaining, edition === "2014" ? 2 : 3);
  }
  const high = make(20, "2024");
  for (let i = 0; i < 4; i++) W.otherUse(high, 20);
  C.resetClassResources(high, "initiative", { level: 20 });
  assert.equal(W.state(high, 20).remaining, 1);
  C.resetClassResources(high, "initiative", { level: 20 });
  assert.equal(W.state(high, 20).remaining, 1);
});
test("Moon defenses, improved saves and source-specific attack reminders use actual Druid levels", () => {
  const modern = make(6, "2024", "moon-2024");
  learn(modern, wolf("2024"), 6);
  shape(modern, 6);
  let p = W.profile(modern, { level: 6 });
  assert.equal(p.ac, 16);
  assert.equal(modern.hpTemp, 18);
  assert.equal(p.saves.con, p.mods.con + p.mods.wis);
  assert.match(p.notes.join(" "), /Radiant/);
  modern.adobe.classLevels.push({ classId: "monk", level: 1 });
  p = W.profile(modern, { level: 7 });
  assert.equal(p.ac, Math.max(13 + p.mods.wis, 10 + p.mods.dex + p.mods.wis));
  const old = make(6, "2014", "moon");
  shape(old, 6);
  assert.match(
    W.profile(old, { level: 6 }).notes.join(" "),
    /count as magical/,
  );
});
test("known choices survive temporary lower levels and clear inactive choices without granting forms", () => {
  const d = make(8, "2024");
  W.setKnown(d, 7, "srd-2024-owl", 8);
  d.adobe.classLevels[0].level = 2;
  assert.deepEqual(W.validKnown(d, 2), []);
  assert.equal(W.state(d, 2).known[7], "srd-2024-owl");
  assert.equal(W.assume(d, "srd-2024-owl", { level: 2 }), false);
  assert.equal(W.setKnown(d, 7, "", 2), true);
});
test("catalogue validation is atomic and all failed shape writes preserve existing data at map capacity", () => {
  const count = W.forms(make(20), 20).length;
  assert.throws(() =>
    W.setCatalogue({ ...forms, records: [forms.records[0], forms.records[0]] }),
  );
  assert.equal(W.forms(make(20), 20).length, count);
  const d = make(4);
  d.adobe.classFeatureChoices = Object.fromEntries(
    Array.from({ length: 100 }, (_, i) => ["keep:" + i, ["safe"]]),
  );
  const before = JSON.stringify(d);
  assert.equal(shape(d, 4), false);
  assert.equal(JSON.stringify(d), before);
});

test("form initiative and passive perception use retained training and class senses without copying racial senses", () => {
  const d = make(6, "2024");
  d.build.race = "high-elf";
  d.skills.perception.rank = 2;
  d.initiativeBonus = 1;
  d.adobe.classLevels = [
    { classId: "druid", level: 4 },
    { classId: "warlock", level: 2 },
  ];
  d.adobe.classFeatureChoices["2024:warlock:eldritch-invocations"] = [
    "devil-s-sight",
  ];
  learn(d, wolf("2024"), 6);
  shape(d, 6);
  const p = W.profile(d, { level: 6 });
  assert.equal(p.initiative, p.mods.dex + 1);
  assert.ok(
    p.senses.includes("passive Perception: " + (10 + p.skills.perception)),
  );
  assert.match(p.senses, /magical darkness.*120 ft/);
  assert.match(p.senses, /darkvision: 60 ft/);
  const old = make(6);
  old.build.race = "high-elf";
  shape(old, 6);
  assert.doesNotMatch(W.profile(old, { level: 6 }).senses, /darkvision/i);
});

test("approved worn items apply physical and mental overrides and conditional AC while merged equipment stays inactive", () => {
  const d = make(4),
    loot = [
      ["amulet", "Amulet of Health"],
      ["headband", "Headband of Intellect"],
      ["bracers", "Bracers of Defense"],
    ].map(([id, name]) => ({ id, quantity: 1, item: { name } }));
  d.equipmentState.loadout = loot.map((row) => ({
    id: row.id,
    equipped: true,
    attuned: true,
  }));
  shape(d, 4);
  let p = W.profile(d, { level: 4, loot });
  assert.equal(p.scores.con, 12);
  assert.equal(p.scores.int, 12);
  assert.equal(p.ac, 13);
  W.end(d, 4);
  shape(d, 4, { gear: "worn" });
  p = W.profile(d, { level: 4, loot });
  assert.equal(p.scores.con, 19);
  assert.equal(p.scores.int, 19);
  assert.equal(p.ac, 15);
  assert.equal(p.hpMax, 11);
  assert.equal(d.hpCurrent, 28);
});
