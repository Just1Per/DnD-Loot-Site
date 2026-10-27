const { test } = require("node:test"),
  assert = require("node:assert/strict"),
  M = require("../js/modules/character-sheet-model"),
  C = require("../js/modules/character-class-feature-choices"),
  F = require("../js/modules/character-feat-rules"),
  R = require("../js/modules/character-barbarian-rage");
const make = (level = 1, edition = "2024") => {
  const d = M.normalize({
    build: { classId: "barbarian", edition },
    hpCurrent: 30,
    hpMax: 30,
    resources: "Personal reminder",
    attacks: [{ name: "Axe", ability: "str", proficient: true }],
  });
  d.adobe = {
    classLevels: [{ classId: "barbarian", level }],
    classFeatureChoices: { "keep:choice": ["preserved"] },
  };
  return d;
};
const row = (d, level) =>
  M.derive(d, level).classResources.find((r) => r.id === "barbarian-rage");
const spend = (d, level, delta = 1) =>
  C.changeClassResource(d, "barbarian-rage", delta, { level });
test("both Rage tables follow every actual class level and retain distinct attacks, durations and recovery", () => {
  for (const edition of ["2014", "2024"])
    for (let level = 1; level <= 20; level++) {
      const d = make(level, edition),
        r = row(d, level);
      assert.equal(
        r.max,
        level >= 17 ? 6 : level >= 12 ? 5 : level >= 6 ? 4 : level >= 3 ? 3 : 2,
      );
      assert.equal(r.rageDamage, level >= 16 ? 4 : level >= 9 ? 3 : 2);
      assert.equal(r.unlimited, edition === "2014" && level === 20);
      assert.equal(r.rageInitiativeRecovery, edition === "2024" && level >= 15);
      assert.equal(r.description.includes("melee weapon"), edition === "2014");
      assert.equal(r.resets.includes("short"), edition === "2024");
      const detail = r.additionalRules.map((x) => x.detail).join(" ");
      assert.match(detail, /cannot cast spells or maintain Concentration/);
      assert.equal(
        detail.includes("fall Unconscious"),
        edition === "2014" && level >= 15,
      );
      if (edition === "2024")
        assert.equal(detail.includes("without extending"), level >= 15);
    }
});
test("finite spending and undo reject invalid amounts and leave conditional HP, attacks, saves and resistances unchanged", () => {
  const d = make(9),
    before = M.derive(d, 9),
    r = row(d, 9);
  assert.equal(spend(d, 9, -1), false);
  for (let i = 0; i < r.max; i++) assert.equal(spend(d, 9), true);
  assert.equal(spend(d, 9), false);
  assert.equal(spend(d, 9, 2), false);
  assert.equal(spend(d, 9, 0.5), false);
  assert.equal(spend(d, 9, -1), true);
  const after = M.derive(d, 9);
  for (const key of ["saves", "attacks", "hpMax"])
    assert.deepEqual(after[key], before[key]);
  assert.deepEqual(after.effects.resistances, before.effects.resistances);
  assert.equal(d.hpCurrent, 30);
  assert.equal(d.resources, "Personal reminder");
});
test("only legacy Barbarian20 has unlimited uses and generic spending does not rewrite that pool", () => {
  const d = make(20, "2014"),
    before = JSON.stringify(d);
  assert.equal(spend(d, 20), false);
  assert.equal(spend(d, 20, -1), false);
  assert.equal(row(d, 20).unlimited, true);
  assert.equal(JSON.stringify(d), before);
  d.build.edition = "2024";
  for (let i = 0; i < 6; i++) assert.equal(spend(d, 20), true);
  assert.equal(spend(d, 20), false);
  assert.equal(row(d, 20).unlimited, false);
});
test("revised Short Rest restores exactly one Rage while legacy waits for Long Rest", () => {
  for (const edition of ["2014", "2024"]) {
    const d = make(6, edition);
    for (let i = 0; i < 4; i++) spend(d, 6);
    F.reset(d, "short", { level: 6 });
    assert.equal(row(d, 6).remaining, edition === "2024" ? 1 : 0);
    F.reset(d, "initiative", { level: 6 });
    F.reset(d, "turn", { level: 6 });
    assert.equal(row(d, 6).remaining, edition === "2024" ? 1 : 0);
    F.reset(d, "long", { level: 6 });
    assert.equal(row(d, 6).used, 0);
  }
});
test("Persistent Rage recovery requires actual revised Barbarian15, a confirmed Initiative and an expended use", () => {
  for (const [level, edition] of [
    [14, "2024"],
    [15, "2014"],
  ]) {
    const d = make(level, edition);
    spend(d, level);
    const before = JSON.stringify(d);
    assert.equal(R.recoverAtInitiative(d, { level, confirmed: true }), false);
    assert.equal(JSON.stringify(d), before);
  }
  const d = make(15);
  assert.equal(R.recoverAtInitiative(d, { level: 15, confirmed: true }), false);
  spend(d, 15);
  spend(d, 15);
  let before = JSON.stringify(d);
  assert.equal(R.recoverAtInitiative(d, { level: 15 }), false);
  assert.equal(
    R.recoverAtInitiative(d, { level: 15, confirmed: "true" }),
    false,
  );
  assert.equal(JSON.stringify(d), before);
  F.reset(d, "initiative", { level: 15 });
  assert.equal(row(d, 15).used, 2);
  assert.equal(R.recoverAtInitiative(d, { level: 15, confirmed: true }), true);
  assert.equal(row(d, 15).used, 0);
  assert.equal(row(d, 15).rageRecoveryUsed, true);
  spend(d, 15);
  assert.equal(R.recoverAtInitiative(d, { level: 15, confirmed: true }), false);
  F.reset(d, "short", { level: 15 });
  assert.equal(row(d, 15).rageRecoveryUsed, true);
  F.reset(d, "long", { level: 15 });
  assert.equal(row(d, 15).rageRecoveryUsed, false);
});
test("a revised Short Rest regains one use after an over-cap save or level reduction", () => {
  const d = make(17);
  for (let i = 0; i < 6; i++) spend(d, 17);
  d.adobe.classLevels[0].level = 1;
  assert.equal(row(d, 1).remaining, 0);
  F.reset(d, "short", { level: 1 });
  assert.equal(row(d, 1).remaining, 1);
});
test("multiclass pools, capped levels, duplicate entries and unrelated resource recovery remain independent", () => {
  const d = make(15);
  d.adobe.classLevels = [
    { classId: "fighter", level: 5 },
    { classId: "barbarian", level: 15 },
  ];
  assert.equal(row(d, 20).max, 5);
  spend(d, 20);
  C.changeClassResource(d, "fighter-second-wind", 1, { level: 20 });
  assert.equal(R.recoverAtInitiative(d, { level: 20, confirmed: true }), true);
  assert.equal(
    M.derive(d, 20).classResources.find((r) => r.id === "fighter-second-wind")
      .used,
    1,
  );
  d.adobe.classLevels[0].level = 20;
  assert.equal(row(d, 20), undefined);
  assert.equal(R.recoverAtInitiative(d, { level: 20, confirmed: true }), false);
  d.adobe.classLevels = [
    { classId: "barbarian", level: 1 },
    { classId: "barbarian", level: 19 },
  ];
  assert.equal(row(d, 20).level, 1);
  assert.equal(row(d, 20).rageInitiativeRecovery, false);
});
test("saved envelopes, class removal and edition changes preserve inactive choices without regranting recovery", () => {
  const d = make(15);
  spend(d, 15);
  R.recoverAtInitiative(d, { level: 15, confirmed: true });
  spend(d, 15);
  const before = JSON.stringify(d),
    r = row(d, 15),
    saved = structuredClone(d);
  saved.rulesChoices.grants.__adobe = { data: saved.adobe };
  delete saved.adobe;
  assert.deepEqual(row(saved, 15), r);
  assert.equal(JSON.stringify(d), before);
  d.build.edition = "2014";
  assert.equal(row(d, 15).used, 0);
  F.reset(d, "long", { level: 15 });
  d.build.edition = "2024";
  assert.equal(row(d, 15).used, 1);
  assert.equal(row(d, 15).rageRecoveryUsed, true);
  d.adobe.classLevels = [{ classId: "wizard", level: 15 }];
  assert.equal(row(d, 15), undefined);
  F.reset(d, "long", { level: 15 });
  d.adobe.classLevels = [{ classId: "barbarian", level: 15 }];
  assert.equal(row(d, 15).rageRecoveryUsed, true);
  assert.deepEqual(d.adobe.classFeatureChoices["keep:choice"], ["preserved"]);
});
