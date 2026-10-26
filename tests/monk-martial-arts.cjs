"use strict";
const { test } = require("node:test"),
  assert = require("node:assert/strict");
const M = require("../js/modules/character-sheet-model"),
  E = require("../js/modules/character-equipment"),
  A = require("../js/modules/character-actions"),
  Arts = require("../js/modules/character-monk-martial-arts");
const make = (level = 1, edition = "2024") => {
  const d = M.normalize({
    build: { classId: "monk", edition, scoreMode: "final" },
    abilities: { str: 12, dex: 18, wis: 16 },
    hpCurrent: 25,
  });
  d.adobe = {
    classLevels: [{ classId: "monk", level }],
    classFeatureChoices: { "keep:choice": ["saved"] },
  };
  return d;
};
const action = (d, raw = { kind: "unarmed" }, level = 1, loot = []) =>
  A.resolve(raw, d, level, M.derive(d, level, loot), loot, []);
const items = (d, names) => {
  const loot = names.map((name, i) => ({
    id: "item-" + i,
    quantity: 1,
    item: { name },
  }));
  d.equipmentState = E.choices({
    loadout: loot.map((e) => ({ id: e.id, equipped: true })),
  });
  return loot;
};
test("both editions use actual Monk1–20 die thresholds and do not mutate saved choices", () => {
  for (const edition of ["2014", "2024"])
    for (let level = 1; level <= 20; level++) {
      const d = make(level, edition),
        before = JSON.stringify(d),
        die =
          (level >= 17 ? 10 : level >= 11 ? 8 : level >= 5 ? 6 : 4) +
          (edition === "2024" ? 2 : 0),
        r = action(d, { kind: "unarmed" }, level);
      assert.equal(r.damage, "1d" + die + " + 4 bludgeoning");
      assert.equal(r.ability, "dex");
      assert.equal(r.hit, "+" + (4 + M.proficiency(level)));
      assert.equal(JSON.stringify(d), before);
    }
});
test("legacy/revised base Monk weapon sets respect melee, Light, Heavy, Two-Handed and versatile properties", () => {
  for (const edition of ["2014", "2024"]) {
    const d = make(17, edition),
      die = edition === "2024" ? "1d12" : "1d10";
    for (const name of [
      "dagger",
      "handaxe",
      "quarterstaff",
      "spear",
      "shortsword",
    ]) {
      const r = action(d, { kind: "weapon", ref: name }, 17);
      assert.equal(r.ability, "dex");
      assert.match(r.damage, new RegExp("^" + die + " \\+ 4"));
    }
    assert.equal(
      Arts.weapon(E.profile(E.infer({ name: "Greatclub" }), edition), edition),
      edition === "2024",
    );
    assert.equal(
      Arts.weapon(E.profile(E.infer({ name: "Scimitar" }), edition), edition),
      edition === "2024",
    );
    for (const name of [
      "longsword",
      "longbow",
      "hand-crossbow",
      "light-crossbow",
      "net",
    ])
      assert.equal(Arts.weapon(E.weapons[name], edition), false, name);
  }
});
test("a better normal/versatile/custom die and magic bonus are retained while smaller dice grow", () => {
  const d = make(1, "2014");
  assert.equal(
    action(d, { kind: "weapon", ref: "quarterstaff", mode: "twoHanded" })
      .damage,
    "1d8 + 4 bludgeoning",
  );
  const loot = items(d, ["Quarterstaff +1"]);
  assert.equal(
    action(d, { kind: "loot", ref: "item-0" }, 1, loot).damage,
    "1d6 + 5 bludgeoning",
  );
  assert.equal(action(d, { kind: "loot", ref: "item-0" }, 1, loot).hit, "+7");
  d.adobe.classLevels[0].level = 17;
  assert.equal(
    action(d, { kind: "loot", ref: "item-0", mode: "twoHanded" }, 17, loot)
      .damage,
    "1d10 + 5 bludgeoning",
  );
  assert.equal(Arts.dice("2d4", "1d8"), "2d4");
  assert.equal(Arts.dice("2d6", "1d12"), "2d6");
  assert.equal(Arts.dice("1d4 + 1d6", "1d12"), "1d4 + 1d6");
});
test("worn armor, shield and non-Monk weapon suppress automatic benefits; packed gear does not", () => {
  for (const name of ["Leather Armor", "Shield", "Longsword"]) {
    const d = make(10),
      loot = items(d, [name]),
      stats = M.derive(d, 10, loot);
    assert.equal(stats.gear.martialArts.active, false, name);
    assert.equal(
      action(d, { kind: "unarmed" }, 10, loot).damage,
      "2 bludgeoning",
    );
    assert.equal(
      action(d, { kind: "weapon", ref: "quarterstaff" }, 10, loot).ability,
      "str",
    );
    d.equipmentState.loadout[0].equipped = false;
    assert.equal(
      action(d, { kind: "unarmed" }, 10, loot).damage,
      "1d8 + 4 bludgeoning",
    );
  }
});
test("readied compatible weapons work together, but a ranged weapon is not made a Monk weapon just by proficiency", () => {
  const d = make(5),
    loot = items(d, ["Dagger", "Handaxe"]);
  assert.equal(M.derive(d, 5, loot).gear.martialArts.active, true);
  loot.push({ id: "bow", quantity: 1, item: { name: "Shortbow" } });
  d.equipmentState.loadout.push({ id: "bow", equipped: true });
  assert.equal(M.derive(d, 5, loot).gear.martialArts.active, false);
  const lone = make(5);
  assert.equal(
    action(lone, { kind: "weapon", ref: "shortbow" }, 5).damage,
    "1d6 + 4 piercing",
  );
});
test("automatic Dexterity chooses the better legal modifier; explicit choices and negative modifiers remain meaningful", () => {
  const d = make();
  d.abilities.str = 20;
  assert.equal(action(d).ability, "str");
  assert.equal(
    action(d, { kind: "unarmed", ability: "dex" }).damage,
    "1d6 + 4 bludgeoning",
  );
  d.abilities.str = 6;
  d.abilities.dex = 8;
  assert.equal(action(d).damage, "1d6 − 1 bludgeoning");
  assert.equal(
    action(d, { kind: "weapon", ref: "handaxe", ability: "str" }).damage,
    "1d6 − 2 slashing",
  );
});
test("thrown Monk weapons and offhand damage keep their existing range and positive-modifier rules", () => {
  const d = make(5);
  assert.equal(
    action(d, { kind: "weapon", ref: "handaxe", mode: "thrown" }, 5).damage,
    "1d8 + 4 slashing",
  );
  assert.equal(
    action(d, { kind: "weapon", ref: "handaxe", mode: "thrown" }, 5).range,
    "20/60",
  );
  assert.equal(
    action(d, { kind: "weapon", ref: "dagger", mode: "offhand" }, 5).damage,
    "1d8 piercing",
  );
  assert.equal(action(d, { kind: "unarmed", mode: "thrown" }, 5).range, "5 ft");
});
test("multiclass character levels do not accelerate the Martial Arts die; class/source changes rederive without discarding values", () => {
  const d = make(1);
  d.adobe.classLevels.push({ classId: "fighter", level: 19 });
  assert.equal(
    action(d, { kind: "unarmed" }, 20).damage,
    "1d6 + 4 bludgeoning",
  );
  d.build.edition = "2014";
  assert.equal(
    action(d, { kind: "unarmed" }, 20).damage,
    "1d4 + 4 bludgeoning",
  );
  d.adobe.classLevels = [
    { classId: "fighter", level: 20 },
    { classId: "monk", level: 20 },
  ];
  assert.equal(action(d, { kind: "unarmed" }, 20).damage, "2 bludgeoning");
});
test("saved envelopes retain the same class, abilities, items, resources and attack references", () => {
  const d = make(11),
    loot = items(d, ["Dagger"]);
  d.actions = [
    { kind: "unarmed", ability: "auto" },
    { kind: "loot", ref: "item-0", ability: "auto" },
  ];
  const before = JSON.stringify(d),
    s = M.derive(d, 11, loot),
    saved = structuredClone(d);
  saved.rulesChoices.grants.__adobe = { data: saved.adobe };
  delete saved.adobe;
  assert.deepEqual(M.derive(saved, 11, loot).actions, s.actions);
  assert.equal(JSON.stringify(d), before);
});
test("edition-specific Bonus Action and revised Grapple/Shove DC reminders do not consume Focus or grant another Attack-action attack", () => {
  const modern = make(5),
    legacy = make(5, "2014");
  assert.match(
    action(modern, { kind: "unarmed" }, 5).notes.join(" "),
    /Grapple\/Shove save DC: 12 \(Strength\) or 15 \(Dexterity\)/,
  );
  assert.match(
    action(legacy, { kind: "unarmed" }, 5).notes.join(" "),
    /after an Attack action/,
  );
  assert.equal(M.derive(modern, 5).attackAction.count, 2);
});

test("all shipped weapon profiles follow the two base-class Monk weapon lists", () => {
  const legacy = new Set([
      "club",
      "dagger",
      "handaxe",
      "javelin",
      "light-hammer",
      "mace",
      "quarterstaff",
      "sickle",
      "spear",
      "shortsword",
    ]),
    modern = new Set([...legacy, "greatclub", "scimitar"]);
  for (const [id, profile] of Object.entries(E.weapons)) {
    assert.equal(Arts.weapon(profile, "2014"), legacy.has(id), "2014 " + id);
    assert.equal(Arts.weapon(profile, "2024"), modern.has(id), "2024 " + id);
  }
  const d = make();
  assert.equal(
    action(d, { kind: "weapon", ref: "greatclub" }).damage,
    "1d8 + 4 bludgeoning",
  );
});
test("magic attunement changes magic bonuses without removing physical Monk weapon eligibility", () => {
  const d = make(5),
    loot = items(d, ["Dagger +1"]);
  loot[0].item.attunement = true;
  assert.equal(
    action(d, { kind: "loot", ref: "item-0" }, 5, loot).damage,
    "1d8 + 4 piercing",
  );
  d.equipmentState.loadout[0].attuned = true;
  assert.equal(
    action(d, { kind: "loot", ref: "item-0" }, 5, loot).damage,
    "1d8 + 5 piercing",
  );
});
test("Dueling and Two-Weapon Fighting retain their bonuses after the Martial Arts die replacement", () => {
  const C = require("../js/modules/character-class-feature-choices"),
    previous = global.CharacterClassFeatureChoices;
  global.CharacterClassFeatureChoices = C;
  try {
    const d = make(5);
    d.adobe.classLevels.push({ classId: "fighter", level: 1 });
    const fighter = d.adobe.classLevels[1];
    assert.equal(C.set(d, fighter, "fighting-style", 0, "dueling"), true);
    assert.equal(
      action(d, { kind: "weapon", ref: "quarterstaff" }, 6).damage,
      "1d8 + 6 bludgeoning",
    );
    assert.equal(
      C.set(d, fighter, "fighting-style", 0, "two-weapon-fighting"),
      true,
    );
    assert.equal(
      action(d, { kind: "weapon", ref: "dagger", mode: "offhand" }, 6).damage,
      "1d8 + 4 piercing",
    );
  } finally {
    if (previous) global.CharacterClassFeatureChoices = previous;
    else delete global.CharacterClassFeatureChoices;
  }
});
