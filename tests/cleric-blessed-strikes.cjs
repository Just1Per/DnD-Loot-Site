"use strict";
const { test } = require("node:test"),
  assert = require("node:assert/strict");
const M = require("../js/modules/character-sheet-model"),
  C = require("../js/modules/character-class-feature-choices"),
  Catalog = require("../js/modules/character-catalog"),
  A = require("../js/modules/character-actions"),
  W = require("../js/modules/character-wild-shape"),
  catalog = require("../data/rules/catalog.json");
Catalog.set(catalog);
const spell = (name) =>
  catalog.spells.find((s) => s.edition === "2024" && s.name === name);
const row = (name, classId = "cleric") => ({
  ...Catalog.spellRow(spell(name)),
  classId,
});
const make = (level = 14, edition = "2024") => {
  const d = M.normalize({
    build: { classId: "cleric", edition, scoreMode: "final" },
    abilities: { wis: 16, cha: 18 },
    hpCurrent: 12,
    hpMax: 35,
    hpTemp: 4,
  });
  d.adobe = {
    classLevels: [{ classId: "cleric", level }],
    classFeatureChoices: { "keep:choice": ["saved"] },
  };
  d.spells = [
    "Sacred Flame",
    "Word of Radiance",
    "Toll the Dead",
    "Guidance",
    "Resistance",
    "Spare the Dying",
  ].map((name) => row(name));
  return d;
};
const choose = (d, value = "potent-spellcasting") =>
  C.set(
    d,
    d.adobe.classLevels.find((e) => e.classId === "cleric"),
    "blessed-strikes",
    0,
    value,
  );
const effect = (d, name, level = 14, classId = "cleric") =>
  C.cantripModifier(
    d,
    M.derive(d, level).cantripInvocations,
    spell(name).id,
    classId,
  );
const action = (d, name, level = 14, classId = "cleric") =>
  A.resolve(
    { kind: "spell", ref: spell(name).id + "::" + classId },
    d,
    level,
    M.derive(d, level),
    [],
    catalog.spells,
  );
const apply = (d, opts = {}, level = 14) =>
  C.applyClericVitality(
    d,
    { spellId: spell("Sacred Flame").id, confirmed: true, ...opts },
    { level, mods: M.derive(d, level).mods },
  );
test("actual levels 1–20 unlock 2024 Blessed Strikes at Cleric 7, improve at 14 and never grant the modern feature to the legacy base class", () => {
  for (const edition of ["2014", "2024"])
    for (let level = 1; level <= 20; level++) {
      const d = make(level, edition),
        before = JSON.stringify(d),
        state = C.blessedStrikes(d, { level, mods: { wis: 3 } });
      assert.equal(state.available, edition === "2024" && level >= 7);
      assert.equal(state.dice, level >= 14 ? "2d8" : "1d8");
      assert.equal(JSON.stringify(d), before);
      assert.equal(choose(d), state.available);
      if (state.available) {
        assert.equal(effect(d, "Sacred Flame", level).damageBonus, 3);
        assert.equal(
          M.derive(d, level).clericBlessedStrikes.vitalityAvailable,
          level >= 14,
        );
      }
    }
});
test("Potent uses final current Wisdom, including zero/negative values, and leaves attack/DC/range unchanged", () => {
  const d = make();
  choose(d);
  assert.equal(action(d, "Sacred Flame").damage, "3d8 + 3 radiant");
  const original = action(d, "Sacred Flame");
  for (const [wis, bonus] of [
    [18, 4],
    [10, 0],
    [6, -2],
  ]) {
    d.abilities.wis = wis;
    assert.equal(effect(d, "Sacred Flame").damageBonus, bonus);
    assert.equal(effect(d, "Sacred Flame").range, undefined);
    assert.equal(action(d, "Sacred Flame").range, original.range);
    assert.equal(
      action(d, "Sacred Flame").hit,
      "DEXTERITY DC " + (8 + M.derive(d, 14).pb + bonus),
    );
  }
});
test("check dice, non-damaging cantrips and weapon enchantments do not gain damage; conditional Toll the Dead still carries the bonus and trigger", () => {
  const d = make();
  choose(d);
  d.spells.push(row("Shillelagh"));
  for (const name of [
    "Guidance",
    "Resistance",
    "Spare the Dying",
    "Shillelagh",
  ])
    assert.equal(effect(d, name), null);
  assert.equal(effect(d, "Toll the Dead").damageBonus, 3);
  assert.match(
    action(d, "Toll the Dead").notes.join(" "),
    /Potent Spellcasting.*\+3/,
  );
  assert.match(
    action(d, "Toll the Dead").notes.join(" "),
    /Improved Blessed Strikes/,
  );
  assert.deepEqual(
    C.clericVitality(d, { level: 14, mods: { wis: 3 } })
      .cantrips.map((s) => s.name)
      .sort(),
    ["Sacred Flame", "Toll the Dead", "Word of Radiance"],
  );
});
test("Cleric and Warlock copies of a shared cantrip keep distinct Wisdom/Charisma modifiers and ambiguous actions gain neither", () => {
  const d = make();
  d.adobe.classLevels.push({ classId: "warlock", level: 6 });
  d.spells.push(row("Toll the Dead", "warlock"));
  choose(d);
  const warlock = d.adobe.classLevels[1];
  C.set(d, warlock, "eldritch-invocations", 0, "agonizing-blast");
  assert.equal(
    C.setCantripInvocation(
      d,
      "2024:warlock:agonizing-blast-cantrips",
      0,
      spell("Toll the Dead").id,
      { level: 20, mods: { wis: 3, cha: 4 } },
    ),
    true,
  );
  assert.equal(effect(d, "Toll the Dead", 20, "cleric").damageBonus, 3);
  assert.equal(effect(d, "Toll the Dead", 20, "warlock").damageBonus, 4);
  assert.equal(
    C.cantripModifier(
      d,
      M.derive(d, 20).cantripInvocations,
      spell("Toll the Dead").id,
    ),
    null,
  );
  assert.equal(effect(d, "Toll the Dead", 20, "wizard"), null);
});
test("separate Cleric/Druid class maps never stack their same-named Potent choice or lend a Druid range extension to another class", () => {
  const d = make(7);
  d.adobe.classLevels.push({ classId: "druid", level: 7 });
  d.spells.push(row("Sacred Flame", "druid"));
  choose(d);
  C.set(d, d.adobe.classLevels[1], "elemental-fury", 0, "potent-spellcasting");
  assert.equal(effect(d, "Sacred Flame", 14, "cleric").damageBonus, 3);
  assert.equal(effect(d, "Sacred Flame", 14, "druid").damageBonus, 3);
  assert.equal(
    C.cantripModifier(
      d,
      M.derive(d, 14).cantripInvocations,
      spell("Sacred Flame").id,
    ),
    null,
  );
  d.adobe.classLevels = [
    { classId: "cleric", level: 4 },
    { classId: "druid", level: 15 },
  ];
  assert.equal(effect(d, "Sacred Flame", 19, "druid").range, "360 feet");
  assert.equal(effect(d, "Sacred Flame", 19, "cleric"), null);
});
test("unassigned shared cantrips remain ambiguous with an actual Eldritch Knight or Arcane Trickster multiclass", () => {
  for (const [classId, subclassId] of [
    ["fighter", "eldritch-knight2014"],
    ["rogue", "arcane-trickster2014"],
  ]) {
    const d = make();
    choose(d);
    d.adobe.classLevels.push({ classId, subclassId, level: 3 });
    d.spells = [row("Toll the Dead", "")];
    assert.equal(effect(d, "Toll the Dead", 17, "cleric"), null);
    assert.equal(
      C.clericVitality(d, { level: 17, mods: { wis: 3 } }).cantrips.length,
      0,
    );
  }
});
test("Divine Strike is a conditional weapon-only hit note, scales at Cleric 14 and leaves base damage intact", () => {
  const d = make(7),
    reference = { kind: "weapon", ref: "longsword" };
  const before = A.resolve(reference, d, 7, M.derive(d, 7), [], catalog.spells);
  choose(d, "divine-strike");
  let a = A.resolve(reference, d, 7, M.derive(d, 7), [], catalog.spells);
  assert.equal(a.damage, before.damage);
  assert.match(
    a.notes.join(" "),
    /once on your own turn.*1d8 Necrotic or Radiant/,
  );
  d.adobe.classLevels[0].level = 14;
  a = A.resolve(reference, d, 14, M.derive(d, 14), [], catalog.spells);
  assert.match(a.notes.join(" "), /2d8 Necrotic or Radiant/);
  assert.equal(
    A.resolve(
      { kind: "unarmed" },
      d,
      14,
      M.derive(d, 14),
      [],
      catalog.spells,
    ).notes.some((n) => n.includes("Divine Strike")),
    false,
  );
  assert.equal(
    A.resolve(
      { kind: "weapon", ref: "net" },
      d,
      14,
      M.derive(d, 14),
      [],
      catalog.spells,
    ).notes.some((n) => n.includes("Divine Strike")),
    false,
  );
  assert.equal(
    action(d, "Sacred Flame").notes.some((n) => n.includes("Divine Strike")),
    false,
  );
});
test("native Beast attacks do not inherit the Cleric weapon-only rider", () => {
  W.setCatalogue(require("../data/rules/wild-shapes-v1.json"));
  const d = make();
  choose(d, "divine-strike");
  d.adobe.classLevels.push({ classId: "druid", level: 2 });
  W.setKnown(d, 0, "srd-2024-wolf", 16);
  W.assume(d, "srd-2024-wolf", { level: 16 });
  assert.equal(
    JSON.stringify(W.profile(d, { level: 16 })).includes("Divine Strike"),
    false,
  );
});
test("vitality requires Cleric 14 Potent, a known damaging Cleric cantrip and explicit resolved-damage acknowledgement", () => {
  const d = make();
  choose(d);
  for (const opts of [
    { confirmed: false },
    { confirmed: "true" },
    { spellId: spell("Guidance").id },
    { spellId: "unknown" },
    { target: "unknown" },
    { mode: "stack" },
  ]) {
    const before = JSON.stringify(d);
    assert.equal(apply(d, opts).ok, false);
    assert.equal(JSON.stringify(d), before);
  }
  d.adobe.classLevels[0].level = 13;
  assert.equal(apply(d, {}, 13).ok, false);
  d.adobe.classLevels[0].level = 14;
  choose(d, "divine-strike");
  assert.equal(apply(d).ok, false);
});
test("vitality keeps/replaces/takes the higher temporary HP without stacking, healing, reviving or touching unrelated resources", () => {
  const d = make();
  choose(d);
  d.hpCurrent = 0;
  const fields = () =>
    JSON.stringify({
      hp: d.hpCurrent,
      slots: d.slots,
      coins: d.coins,
      adobe: d.adobe,
      conditions: d.conditions,
    });
  const before = fields();
  d.hpTemp = 9;
  assert.equal(apply(d, { mode: "higher" }).tempHP, 9);
  assert.equal(apply(d, { mode: "keep" }).tempHP, 9);
  assert.equal(apply(d, { mode: "replace" }).tempHP, 6);
  d.hpTemp = 2;
  assert.equal(apply(d).tempHP, 6);
  assert.equal(apply(d).changed, false);
  assert.equal(d.hpCurrent, 0);
  assert.equal(fields(), before);
});
test("negative and zero Wisdom never invent a minimum temporary-HP award or erase existing temporary HP", () => {
  for (const wisdom of [6, 10]) {
    const d = make();
    choose(d);
    d.abilities.wis = wisdom;
    d.hpTemp = 9;
    const before = JSON.stringify(d);
    assert.equal(
      C.clericVitality(d, { level: 14, mods: M.derive(d, 14).mods }).amount,
      0,
    );
    assert.equal(apply(d).ok, false);
    assert.equal(JSON.stringify(d), before);
  }
});
test("another recipient is an explicit table instruction and never writes to the owner's sheet", () => {
  const d = make();
  choose(d);
  const before = JSON.stringify(d),
    result = apply(d, { target: "other" });
  assert.deepEqual(result, {
    ok: true,
    target: "other",
    amount: 6,
    changed: false,
  });
  assert.equal(JSON.stringify(d), before);
});
test("class caps/duplicates and source changes preserve saved choices without granting a missing unlock", () => {
  for (const levels of [
    [
      { classId: "fighter", level: 14 },
      { classId: "cleric", level: 7 },
    ],
    [
      { classId: "cleric", level: 6 },
      { classId: "cleric", level: 14 },
    ],
  ]) {
    const d = make();
    choose(d);
    d.adobe.classLevels = levels;
    assert.equal(C.blessedStrikes(d, { level: 20 }).available, false);
  }
  const d = make();
  choose(d);
  d.build.edition = "2014";
  assert.equal(C.blessedStrikes(d, { level: 14 }).choice, "");
  d.build.edition = "2024";
  assert.equal(
    C.blessedStrikes(d, { level: 14 }).choice,
    "potent-spellcasting",
  );
  const raw = structuredClone(d);
  raw.rulesChoices.grants.__adobe = { data: raw.adobe, used: 0 };
  delete raw.adobe;
  assert.equal(
    C.blessedStrikes(raw, { level: 14 }).choice,
    "potent-spellcasting",
  );
  assert.equal(apply(raw).ok, true);
});
test("legacy domain references and duplicate selected spell rows do not double the modern bonus, and derivation is read-only", () => {
  const d = make();
  choose(d);
  d.features = "Old subclass Potent Spellcasting and Divine Strike references";
  d.adobe.classLevels[0].subclassId = "life2014";
  d.spells.push(row("Sacred Flame"));
  const before = JSON.stringify(d);
  assert.equal(effect(d, "Sacred Flame").damageBonus, 3);
  assert.equal(JSON.stringify(d), before);
});
