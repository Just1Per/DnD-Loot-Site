"use strict";
const { test } = require("node:test"),
  assert = require("node:assert/strict"),
  M = require("../js/modules/character-sheet-model"),
  C = require("../js/modules/character-class-feature-choices"),
  W = require("../js/modules/character-wild-shape"),
  F = require("../js/modules/character-wild-companion"),
  catalog = require("../data/rules/wild-shapes-v1.json");
W.setCatalogue(catalog);
const make = (level = 2, edition = "2024") => {
    const d = M.normalize({
      build: { classId: "druid", edition },
      abilities: { wis: 20, int: 18 },
      hpCurrent: 27,
      hpTemp: 9,
    });
    d.adobe = {
      classLevels: [{ classId: "druid", level }],
      classFeatureChoices: { "keep:choice": ["saved"] },
      companions: [
        {
          type: "companion",
          name: "Keep this card",
          notes: "Private preparation",
        },
      ],
    };
    return d;
  },
  owl = "srd-2024-owl",
  cast = (d, payment = "wild-shape", level = 2, options = {}) =>
    F.summon(d, { formId: owl, payment, ...options }, { level });
test("actual Druid levels 1–20 unlock the revised base feature at 2 without adding it to the legacy base class", () => {
  for (const edition of ["2014", "2024"])
    for (let level = 1; level <= 20; level++) {
      const d = make(level, edition);
      assert.equal(
        F.capability(d, { level }).available,
        edition === "2024" && level >= 2,
      );
      assert.equal(
        cast(d, "wild-shape", level).ok,
        edition === "2024" && level >= 2,
      );
    }
});
test("modern forms are CR0 Beasts across sizes, with flying/swimming allowed at Druid 2; no pact or legacy-form substitution", () => {
  assert.ok(
    F.forms().some((r) => r.id === "srd-2024-deer" && r.size === "Medium"),
  );
  for (const id of [owl, "srd-2024-frog", "srd-2024-giant-fire-beetle"])
    assert.equal(F.eligible(id), true);
  for (const id of ["srd-2024-wolf", "srd-2014-owl", "srd-2014-imp", "forged"])
    assert.equal(F.eligible(id), false);
  const d = make();
  assert.equal(W.eligible(d, owl, 2), false);
  assert.equal(cast(d).ok, true);
});
test("Wild Shape payment and familiar creation are atomic and do not refund through other-feature Undo", () => {
  const d = make(),
    before = JSON.stringify({
      hp: d.hpCurrent,
      temp: d.hpTemp,
      slots: d.slots,
      cards: d.adobe.companions,
      spells: d.spells,
    });
  assert.equal(cast(d).ok, true);
  assert.equal(W.state(d, 2).remaining, 1);
  assert.equal(W.undoOther(d, 2), false);
  assert.equal(F.state(d).status, "active");
  assert.equal(
    JSON.stringify({
      hp: d.hpCurrent,
      temp: d.hpTemp,
      slots: d.slots,
      cards: d.adobe.companions,
      spells: d.spells,
    }),
    before,
  );
  assert.deepEqual(d.adobe.classFeatureChoices["keep:choice"], ["saved"]);
});
test("ordinary spell slots and Pact Magic are separate valid payments, including higher-level slots", () => {
  const d = make(3);
  d.adobe.classLevels.push({ classId: "warlock", level: 3 });
  d.adobe.pactSlotsUsed = 1;
  d.slots[0].used = 1;
  const options = F.payments(d, { level: 6 });
  assert.ok(options.some((r) => r.id === "slot-2"));
  assert.equal(options.find((r) => r.id === "pact").level, 2);
  assert.equal(cast(d, "slot-2", 6).ok, true);
  assert.equal(d.slots[1].used, 1);
  assert.equal(M.normalize(d).slots[1].used, 1);
  assert.equal(d.slots[0].used, 1);
  assert.equal(d.adobe.pactSlotsUsed, 1);
  assert.equal(W.state(d, 6).used, 0);
  assert.equal(cast(d, "pact", 6, { confirmed: true }).ok, true);
  assert.equal(d.adobe.pactSlotsUsed, 2);
  assert.equal(d.adobe.pactSlotsSeparated, true);
  assert.equal(d.slots[1].used, 1);
  const before = JSON.stringify(d);
  assert.equal(cast(d, "pact", 6, { confirmed: true }).ok, false);
  assert.equal(JSON.stringify(d), before);
});
test("unavailable, malformed and exhausted payments never create a familiar or alter any state", () => {
  for (const payment of ["slot-0", "slot-9", "pact", "invented", null, 1]) {
    const d = make(),
      before = JSON.stringify(d);
    assert.equal(cast(d, payment).ok, false);
    assert.equal(JSON.stringify(d), before);
  }
  const d = make();
  W.otherUse(d, 2);
  W.otherUse(d, 2);
  const before = JSON.stringify(d);
  assert.equal(cast(d).ok, false);
  assert.equal(JSON.stringify(d), before);
});
test("one familiar is maintained; existing managed/manual familiars require confirmation and manual cards are preserved", () => {
  const d = make();
  d.adobe.companions.push({ type: "familiar", name: "Old reference" });
  const cards = JSON.stringify(d.adobe.companions),
    before = JSON.stringify(d);
  assert.equal(cast(d).ok, false);
  assert.equal(JSON.stringify(d), before);
  assert.equal(cast(d, "wild-shape", 2, { confirmed: true }).ok, true);
  assert.equal(cast(d).ok, false);
  assert.equal(
    cast(d, "wild-shape", 2, { formId: "srd-2024-cat", confirmed: true }).ok,
    true,
  );
  assert.equal(F.state(d).id, "srd-2024-cat");
  assert.equal(JSON.stringify(d.adobe.companions), cards);
  assert.equal(W.state(d, 2).remaining, 0);
});
test("familiar statistics belong to its Fey animal form, not its owner, and attacks stay prohibited", () => {
  const d = make(20);
  cast(d, "wild-shape", 20);
  const p = F.profile(d),
    b = catalog.records.find((r) => r.id === owl).data;
  assert.equal(p.creatureType, "Fey");
  assert.equal(p.hpMax, b.hp);
  assert.equal(p.scores.wis, b.wis);
  assert.notEqual(p.scores.wis, d.abilities.wis);
  assert.equal(p.initiative, Math.floor((b.dex - 10) / 2));
  assert.match(p.actionNote, /cannot attack/);
  assert.match(p.duration, /Long Rest/);
});
test("damage/healing affects only the familiar, uses its temporary HP first and ends it at 0 with no free return", () => {
  const d = make();
  cast(d);
  const p = F.profile(d),
    hp = d.hpCurrent;
  F.setTemp(d, 4);
  assert.equal(F.damage(d, 3), true);
  assert.equal(F.profile(d).hp, p.hpMax);
  assert.equal(F.profile(d).temp, 1);
  assert.equal(F.damage(d, p.hpMax + 1), true);
  assert.equal(F.state(d).status, "ended");
  assert.equal(F.state(d).reason, "zero-hp");
  assert.equal(F.heal(d, 5), false);
  assert.equal(F.changePresence(d, "return"), false);
  assert.equal(d.hpCurrent, hp);
  assert.equal(d.hpTemp, 9);
  assert.equal(W.state(d, 2).remaining, 1);
});
test("pocket dismissal and return preserve familiar HP, do not refund/spend resources and do not extend its duration", () => {
  const d = make();
  cast(d);
  F.setTemp(d, 3);
  const before = F.profile(d),
    used = W.state(d, 2).used;
  assert.equal(F.changePresence(d, "pocket"), true);
  assert.equal(F.damage(d, 1), false);
  assert.equal(F.heal(d, 1), false);
  assert.equal(F.changePresence(d, "return"), true);
  assert.equal(F.profile(d).hp, before.hp);
  assert.equal(F.profile(d).temp, 3);
  assert.equal(W.state(d, 2).used, used);
  assert.equal(F.state(d).level, 2);
});
test("Long Rest expires active and pocket familiars, even when pools were full or source/class changed; other events do not", () => {
  for (const status of ["active", "pocket"]) {
    const d = make();
    cast(d, "slot-1");
    if (status === "pocket") F.changePresence(d, "pocket");
    for (const event of ["short", "turn", "initiative"]) {
      C.resetClassResources(d, event, { level: 2 });
      assert.equal(F.state(d).alive, true);
    }
    d.build.edition = "2014";
    d.adobe.classLevels = [{ classId: "fighter", level: 2 }];
    C.resetClassResources(d, "long", { level: 2 });
    assert.equal(F.state(d).alive, false);
    assert.equal(F.state(d).reason, "long-rest");
    d.build.edition = "2024";
    assert.equal(F.changePresence(d, "return"), false);
  }
});
test("recorded incapacitation prevents casting/presence actions while active familiars still track independent damage", () => {
  const d = make();
  cast(d);
  d.conditions = "Stunned (until next turn)";
  const before = JSON.stringify(d);
  assert.equal(cast(d, "wild-shape", 2, { confirmed: true }).ok, false);
  assert.equal(F.changePresence(d, "pocket"), false);
  assert.equal(JSON.stringify(d), before);
  assert.equal(F.damage(d, 1), true);
  const fresh = make();
  fresh.conditions = "Not stunned";
  assert.equal(cast(fresh).ok, true);
});
test("Wild Shape prevents spellcasting until Beast Spells; familiar controls and form HP remain independent", () => {
  const d = make(4);
  W.setKnown(d, 0, "srd-2024-wolf", 4);
  W.assume(d, "srd-2024-wolf", { level: 4 });
  const before = JSON.stringify(d);
  assert.equal(cast(d, "slot-1", 4).ok, false);
  assert.equal(JSON.stringify(d), before);
  d.adobe.classLevels[0].level = 18;
  assert.equal(cast(d, "slot-1", 18).ok, true);
  assert.equal(W.state(d, 18).activeId, "srd-2024-wolf");
});
test("capped and duplicate assignments cannot manufacture an unlock; completed familiar records survive feature loss until rest", () => {
  const d = make(2);
  d.adobe.classLevels.unshift({ classId: "fighter", level: 19 });
  assert.equal(cast(d, "wild-shape", 20).ok, false);
  d.adobe.classLevels = [
    { classId: "druid", level: 1 },
    { classId: "druid", level: 19 },
  ];
  assert.equal(cast(d, "wild-shape", 20).ok, false);
  const valid = make();
  cast(valid);
  valid.adobe.classLevels = [{ classId: "fighter", level: 2 }];
  assert.equal(F.profile(valid).state.alive, true);
  assert.equal(cast(valid, "wild-shape", 2, { confirmed: true }).ok, false);
});
test("save envelope, catalogue inspection and finite HP edits preserve unrelated data and source records", () => {
  const d = make();
  cast(d);
  const before = JSON.stringify(d),
    source = JSON.stringify(catalog),
    saved = structuredClone(d);
  saved.rulesChoices.grants.__adobe = { data: saved.adobe };
  delete saved.adobe;
  assert.deepEqual(F.profile(saved), F.profile(d));
  F.forms();
  F.profile(d);
  assert.equal(JSON.stringify(d), before);
  assert.equal(JSON.stringify(catalog), source);
  assert.equal(F.setHP(d, F.profile(d).hpMax + 1), false);
  assert.equal(F.setHP(d, -1), false);
  assert.equal(F.setTemp(d, 1.5), false);
});
test("map capacity failures are atomic for Wild Shape, ordinary slots and Pact payments", () => {
  for (const payment of ["wild-shape", "slot-1", "pact"]) {
    const d = make();
    d.adobe.classLevels.push({ classId: "warlock", level: 2 });
    d.adobe.classFeatureChoices = Object.fromEntries(
      Array.from({ length: 100 }, (_, i) => ["keep:" + i, ["saved"]]),
    );
    const before = JSON.stringify(d);
    assert.equal(cast(d, payment, 4).ok, false);
    assert.equal(JSON.stringify(d), before);
  }
});

test("table-effect maximum HP adjustments do not heal, mutate creature records or touch the owner", () => {
  const d = make();
  cast(d);
  const hp = F.profile(d).hp,
    actor = d.hpCurrent,
    base = F.profile(d).baseHP;
  assert.equal(F.setMaximum(d, base + 5), true);
  assert.equal(F.profile(d).hpMax, base + 5);
  assert.equal(F.profile(d).hp, hp);
  assert.equal(F.heal(d, 2), true);
  assert.equal(d.hpCurrent, actor);
  assert.equal(W.creature(owl).data.hp, base);
  assert.equal(F.setMaximum(d, 0), true);
  assert.equal(F.state(d).alive, false);
});
