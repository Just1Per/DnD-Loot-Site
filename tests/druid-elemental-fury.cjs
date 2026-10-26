"use strict";
const { test } = require("node:test"),
  assert = require("node:assert/strict"),
  M = require("../js/modules/character-sheet-model"),
  C = require("../js/modules/character-class-feature-choices"),
  Catalog = require("../js/modules/character-catalog"),
  A = require("../js/modules/character-actions"),
  W = require("../js/modules/character-wild-shape"),
  catalog = require("../data/rules/catalog.json");
Catalog.set(catalog);
W.setCatalogue(require("../data/rules/wild-shapes-v1.json"));
const spell = (name) =>
    catalog.spells.find((s) => s.edition === "2024" && s.name === name),
  row = (name, source = "druid") => ({
    ...Catalog.spellRow(spell(name)),
    classId: source,
  }),
  make = (level = 7, edition = "2024") => {
    const d = M.normalize({
      build: { classId: "druid", edition, scoreMode: "final" },
      abilities: { wis: 16, cha: 18 },
      hpCurrent: 20,
      hpMax: 35,
    });
    d.adobe = {
      classLevels: [{ classId: "druid", level }],
      classFeatureChoices: { "keep:choice": ["saved"] },
    };
    d.spells = [
      "Starry Wisp",
      "Guidance",
      "Resistance",
      "Druidcraft",
      "Thunderclap",
      "Shillelagh",
      "Produce Flame",
    ].map((n) => row(n));
    return d;
  },
  choose = (d, value) =>
    C.set(
      d,
      d.adobe.classLevels.find((r) => r.classId === "druid"),
      "elemental-fury",
      0,
      value,
    ),
  stats = (d, level) => M.derive(d, level),
  effect = (d, name, level = 7, source = "druid") =>
    C.cantripModifier(
      d,
      stats(d, level).cantripInvocations,
      spell(name).id,
      source,
    ),
  action = (d, name, level = 7, source = "druid") =>
    A.resolve(
      { kind: "spell", ref: spell(name).id + "::" + source },
      d,
      level,
      stats(d, level),
      [],
      catalog.spells,
    );
test("levels 1–20 unlock revised choice at actual Druid 7 and improve it at 15, without a legacy base grant", () => {
  for (const edition of ["2014", "2024"])
    for (let level = 1; level <= 20; level++) {
      const d = make(level, edition),
        before = JSON.stringify(d);
      const f = C.elementalFury(d, { level, mods: { wis: 3 } });
      assert.equal(f.available, edition === "2024" && level >= 7);
      assert.equal(f.dice, level >= 15 ? "2d8" : "1d8");
      assert.equal(JSON.stringify(d), before);
      assert.equal(
        choose(d, "potent-spellcasting"),
        edition === "2024" && level >= 7,
      );
      if (f.available) {
        assert.equal(effect(d, "Starry Wisp", level).damageBonus, 3);
        assert.equal(
          effect(d, "Starry Wisp", level).range,
          level >= 15 ? "360 feet" : undefined,
        );
      }
    }
});
test("Potent uses current Wisdom including zero/negative values and changes damage without changing attack/DC", () => {
  const d = make();
  choose(d, "potent-spellcasting");
  assert.equal(action(d, "Starry Wisp").damage, "2d8 + 3 radiant");
  assert.equal(action(d, "Starry Wisp").hit, "+6");
  for (const [wis, bonus] of [
    [8, -1],
    [10, 0],
    [20, 5],
  ]) {
    d.abilities.wis = wis;
    assert.equal(effect(d, "Starry Wisp").damageBonus, bonus);
  }
  assert.deepEqual(d.adobe.classFeatureChoices["keep:choice"], ["saved"]);
});
test("Guidance/Resistance dice and weapon-enchantment cantrips do not receive a damage bonus", () => {
  const d = make();
  choose(d, "potent-spellcasting");
  assert.equal(effect(d, "Guidance"), null);
  assert.equal(effect(d, "Resistance"), null);
  assert.equal(effect(d, "Shillelagh"), null);
  assert.equal(effect(d, "Druidcraft"), null);
  assert.equal(effect(d, "Produce Flame").damageBonus, 3);
});
test("Improved range adds 300 to numeric ranges at least 10 ft, including nondamaging cantrips; Self/Touch/5 ft remain unchanged", () => {
  const d = make(15);
  choose(d, "potent-spellcasting");
  assert.equal(action(d, "Starry Wisp", 15).range, "360 feet");
  assert.equal(effect(d, "Druidcraft", 15).range, "330 feet");
  assert.equal(effect(d, "Druidcraft", 15).damageBonus, undefined);
  assert.equal(effect(d, "Guidance", 15), null);
  assert.equal(effect(d, "Shillelagh", 15), null);
  assert.equal(effect(d, "Thunderclap", 15).range, undefined);
  assert.equal(effect(d, "Produce Flame", 15).range, undefined);
});
test("Druid and Warlock copies of the same cantrip retain separate bonuses and ranges; ambiguous actions get neither", () => {
  const d = make(7);
  d.adobe.classLevels.push({ classId: "warlock", level: 2 });
  d.spells.push(row("Starry Wisp", "warlock"));
  choose(d, "potent-spellcasting");
  const warlock = d.adobe.classLevels[1];
  assert.equal(
    C.set(d, warlock, "eldritch-invocations", 0, "agonizing-blast"),
    true,
  );
  assert.equal(
    C.setCantripInvocation(
      d,
      "2024:warlock:agonizing-blast-cantrips",
      0,
      spell("Starry Wisp").id,
      { level: 9, mods: { cha: 4 } },
    ),
    true,
  );
  assert.equal(action(d, "Starry Wisp", 9, "druid").damage, "2d8 + 3 radiant");
  assert.equal(
    action(d, "Starry Wisp", 9, "warlock").damage,
    "2d8 + 4 radiant",
  );
  assert.equal(
    C.cantripModifier(
      d,
      stats(d, 9).cantripInvocations,
      spell("Starry Wisp").id,
    ),
    null,
  );
  assert.match(
    A.resolve(
      { kind: "spell", ref: spell("Starry Wisp").id },
      d,
      9,
      stats(d, 9),
      [],
      catalog.spells,
    ).notes.join(" "),
    /choose its casting class/,
  );
  assert.equal(effect(d, "Starry Wisp", 9, "wizard"), null);
});
test("unassigned shared cantrips require a clear casting source in multiclass builds", () => {
  const d = make();
  d.spells[0].classId = "";
  d.adobe.classLevels.push({ classId: "wizard", level: 1 });
  choose(d, "potent-spellcasting");
  assert.equal(
    C.cantripModifier(
      d,
      stats(d, 8).cantripInvocations,
      spell("Starry Wisp").id,
    ),
    null,
  );
  d.adobe.classLevels.pop();
  assert.equal(
    C.cantripModifier(
      d,
      stats(d, 7).cantripInvocations,
      spell("Starry Wisp").id,
    ).damageBonus,
    3,
  );
});
test("Primal Strike is an eligible-hit reminder, with no blanket damage applied to spells, unarmed or weapon rows", () => {
  const d = make(15);
  choose(d, "primal-strike");
  const r = stats(d, 15);
  assert.match(
    r.druidElementalFury.detail,
    /own turn.*2d8 Cold, Fire, Lightning or Thunder/,
  );
  assert.equal(effect(d, "Starry Wisp", 15), null);
  const weapon = A.resolve(
    { kind: "weapon", ref: "dagger" },
    d,
    15,
    r,
    [],
    catalog.spells,
  );
  assert.match(weapon.notes.join(" "), /Primal Strike/);
  assert.doesNotMatch(weapon.damage, /2d8/);
  assert.doesNotMatch(
    action(d, "Starry Wisp", 15).notes.join(" "),
    /Primal Strike/,
  );
  const unarmed = A.resolve({ kind: "unarmed" }, d, 15, r, [], catalog.spells);
  assert.doesNotMatch(unarmed.notes.join(" "), /Primal Strike/);
});
test("only Beast-form Wild Shape attacks get Primal reminders, not the legacy Moon elemental exception", () => {
  const d = make(15);
  d.adobe.classLevels[0].subclassId = "moon";
  choose(d, "primal-strike");
  W.setKnown(d, 0, "srd-2024-wolf", 15);
  assert.equal(W.assume(d, "srd-2024-wolf", { level: 15 }), true);
  assert.match(W.profile(d, { level: 15 }).primalStrike, /2d8/);
  W.end(d, 15);
  d.adobe.classFeatureChoices[W.state(d, 15).keys.spent] = ["0"];
  assert.equal(W.assume(d, "srd-2014-air-elemental", { level: 15 }), true);
  assert.equal(W.profile(d, { level: 15 }).primalStrike, "");
});
test("capped levels, duplicates, stale/unknown choices and source changes preserve selections without granting bonuses", () => {
  const d = make(7);
  choose(d, "potent-spellcasting");
  d.adobe.classLevels.unshift({ classId: "fighter", level: 14 });
  assert.equal(C.elementalFury(d, { level: 20 }).available, false);
  assert.equal(effect(d, "Starry Wisp", 20), null);
  d.adobe.classLevels = [
    { classId: "druid", level: 6 },
    { classId: "druid", level: 14 },
  ];
  assert.equal(C.elementalFury(d, { level: 20 }).available, false);
  d.adobe.classLevels = [{ classId: "druid", level: 7 }];
  d.build.edition = "2014";
  assert.equal(effect(d, "Starry Wisp"), null);
  d.build.edition = "2024";
  assert.equal(effect(d, "Starry Wisp").damageBonus, 3);
  assert.equal(choose(d, "invented-power"), false);
});
test("save-envelope round trip and derivation preserve spells, normal values, inventory and choices", () => {
  const d = make(15);
  choose(d, "potent-spellcasting");
  const before = JSON.stringify(d),
    r = stats(d, 15),
    saved = structuredClone(d);
  saved.rulesChoices.grants.__adobe = { data: saved.adobe };
  delete saved.adobe;
  assert.deepEqual(stats(saved, 15).druidElementalFury, r.druidElementalFury);
  assert.deepEqual(stats(saved, 15).cantripInvocations, r.cantripInvocations);
  assert.equal(JSON.stringify(d), before);
});

test("Spare the Dying retains inherent character-level range scaling before the Druid-level extension", () => {
  const d = make(15);
  d.spells.push(row("Spare the Dying"));
  assert.equal(action(d, "Spare the Dying", 15).range, "60 feet");
  choose(d, "potent-spellcasting");
  assert.equal(action(d, "Spare the Dying", 15).range, "360 feet");
  d.adobe.classLevels.push({ classId: "fighter", level: 2 });
  assert.equal(action(d, "Spare the Dying", 17).range, "420 feet");
  assert.equal(
    C.cantripRange(
      { ...spell("Spare the Dying"), edition: "2014", range: "touch" },
      20,
    ),
    "touch",
  );
  assert.equal(
    C.cantripRange(spell("Spare the Dying"), 20, "500 feet"),
    "500 feet",
  );
});
test("overlapping level-20 Druid and Warlock range modifiers coexist without combining or overwriting", () => {
  const d = make(15);
  d.adobe.classLevels.push({ classId: "warlock", level: 5 });
  d.spells.push(row("Starry Wisp", "warlock"));
  choose(d, "potent-spellcasting");
  const w = d.adobe.classLevels[1];
  C.set(d, w, "eldritch-invocations", 0, "eldritch-spear");
  assert.equal(
    C.setCantripInvocation(
      d,
      "2024:warlock:eldritch-spear-cantrips",
      0,
      spell("Starry Wisp").id,
      { level: 20, mods: { cha: 4 } },
    ),
    true,
  );
  assert.equal(action(d, "Starry Wisp", 20, "druid").range, "360 feet");
  assert.equal(action(d, "Starry Wisp", 20, "warlock").range, "210 feet");
  assert.equal(action(d, "Starry Wisp", 20, "druid").damage, "4d8 + 3 radiant");
  assert.equal(action(d, "Starry Wisp", 20, "warlock").damage, "4d8 radiant");
});
