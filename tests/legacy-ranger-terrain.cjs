const { test } = require("node:test"),
  assert = require("node:assert/strict"),
  M = require("../js/modules/character-sheet-model"),
  C = require("../js/modules/character-class-feature-choices");
const make = (level = 1, edition = "2014") => {
  const d = M.normalize({
    build: { classId: "ranger", edition },
    skills: { nature: { rank: 1, bonus: 2 }, survival: { rank: 2, bonus: 0 } },
    features: "Personal reminder",
  });
  d.adobe = {
    classLevels: [{ classId: "ranger", level }],
    classFeatureChoices: { "keep:choice": ["preserved"] },
  };
  return d;
};
const entry = (d) => d.adobe.classLevels.find((x) => x.classId === "ranger");
const group = (d) =>
  C.status(d, entry(d), d.build.edition).find(
    (g) => g.id === "natural-explorer",
  );
const set = (d, slot, value) =>
  C.set(d, entry(d), "natural-explorer", slot, value);
const report = (d, level) =>
  M.derive(d, level).rangerFeatures.reports.find(
    (r) => r.id === "natural-explorer",
  );
test("legacy favored-terrain allowances follow Ranger levels1–20 and revised Ranger never inherits them", () => {
  for (let level = 1; level <= 20; level++) {
    const d = make(level),
      g = group(d);
    assert.equal(g.allowed, level >= 10 ? 3 : level >= 6 ? 2 : 1);
    assert.deepEqual(
      g.options.map((o) => o.id),
      [
        "arctic",
        "coast",
        "desert",
        "forest",
        "grassland",
        "mountain",
        "swamp",
        "underdark",
      ],
    );
    assert.equal(report(d, level).allowed, g.allowed);
    const modern = make(level, "2024");
    assert.equal(group(modern), undefined);
    assert.equal(report(modern, level), undefined);
  }
});
test("choices reject duplicates, unknown terrains and unavailable/stale slots without replacing valid selections", () => {
  const d = make(10);
  assert.equal(set(d, 0, "forest"), true);
  assert.equal(set(d, 1, "coast"), true);
  assert.equal(set(d, 2, "underdark"), true);
  const before = JSON.stringify(d);
  for (const [slot, value] of [
    [1, "forest"],
    [3, "swamp"],
    [-1, "desert"],
    [0.5, "mountain"],
    [1, "forged-terrain"],
  ])
    assert.equal(set(d, slot, value), false);
  assert.equal(JSON.stringify(d), before);
  assert.deepEqual(report(d, 10).terrains, ["Forest", "Coast", "Underdark"]);
});
test("terrain benefits are conditional reminders and never permanently double skills or existing Expertise", () => {
  const d = make(10),
    before = M.derive(d, 10);
  set(d, 0, "forest");
  const after = M.derive(d, 10);
  assert.deepEqual(after.skills, before.skills);
  assert.deepEqual(after.effects.skills, before.effects.skills);
  assert.match(report(d, 10).detail, /double proficiency once/);
  assert.match(report(d, 10).detail, /does not add again to Expertise/);
  assert.match(report(d, 10).detail, /at least 1 hour/);
  assert.equal(d.features, "Personal reminder");
  assert.deepEqual(C.huntersMarkEffect(d,{name:"Hunter's Mark",edition:"2014"},{level:10}).notes,[],"terrain travel rules do not appear in Hunter's Mark actions");
});
test("lowering levels retains inactive terrain selections and duplicate saved choices are not treated as valid", () => {
  const d = make(10);
  for (const [i, v] of ["forest", "coast", "swamp"].entries()) set(d, i, v);
  entry(d).level = 1;
  assert.deepEqual(report(d, 1).terrains, ["Forest"]);
  assert.equal(group(d).overflow.length, 2);
  assert.deepEqual(
    d.adobe.classFeatureChoices["2014:ranger:natural-explorer"],
    ["forest", "coast", "swamp"],
  );
  entry(d).level = 10;
  assert.deepEqual(report(d, 10).terrains, ["Forest", "Coast", "Swamp"]);
  d.adobe.classFeatureChoices["2014:ranger:natural-explorer"] = [
    "forest",
    "forest",
    "forged",
  ];
  assert.deepEqual(report(d, 10).terrains, ["Forest"]);
  assert.equal(group(d).missing, 2);
});
test("actual multiclass levels cap terrain reports and the mutation boundary ignores a stale higher-level entry", () => {
  const d = make(1);
  d.adobe.classLevels.unshift({ classId: "fighter", level: 19 });
  assert.equal(
    C.set(d, { classId: "ranger", level: 20 }, "natural-explorer", 1, "coast"),
    false,
  );
  assert.equal(set(d, 0, "forest"), true);
  assert.equal(report(d, 20).allowed, 1);
  d.adobe.classLevels[0].level = 20;
  assert.equal(report(d, 20), undefined);
  assert.deepEqual(
    d.adobe.classFeatureChoices["2014:ranger:natural-explorer"],
    ["forest"],
  );
});
test("source changes, class removal, saved envelopes and repeat derivation preserve terrain and unrelated choices", () => {
  const d = make(10);
  set(d, 0, "forest");
  set(d, 1, "coast");
  const before = JSON.stringify(d),
    r = report(d, 10),
    saved = structuredClone(d);
  saved.rulesChoices.grants.__adobe = { data: saved.adobe };
  delete saved.adobe;
  assert.deepEqual(report(saved, 10), r);
  assert.deepEqual(report(d, 10), r);
  assert.equal(JSON.stringify(d), before);
  d.build.edition = "2024";
  assert.equal(report(d, 10), undefined);
  d.build.edition = "2014";
  assert.deepEqual(report(d, 10).terrains, ["Forest", "Coast"]);
  d.adobe.classLevels = [{ classId: "wizard", level: 10 }];
  assert.equal(report(d, 10), undefined);
  assert.deepEqual(d.adobe.classFeatureChoices["keep:choice"], ["preserved"]);
});

 test('inactive higher-level terrain choices remain a group notice rather than invalidating a valid current field',()=>{
  const V=require('../js/modules/character-build-validation');global.CharacterClassFeatureChoices=C;
  const d=make(10);for(const [i,value]of ['forest','coast','swamp'].entries())set(d,i,value);entry(d).level=1;
  const derived=M.derive(d,10);derived.progression={classLevels:[{classId:'ranger',level:10}],assignedClassLevels:d.adobe.classLevels,targetLevel:10,assignedLevel:1};
  const issue=V.check(d,derived,{level:10}).issues.find(x=>x.groupNotice&&x.message.includes('Natural Explorer'));
  assert.ok(issue);assert.match(issue.message,/current choices are valid/);assert.equal(group(d).valid.length,1);assert.deepEqual(d.adobe.classFeatureChoices['2014:ranger:natural-explorer'],['forest','coast','swamp']);
 });
