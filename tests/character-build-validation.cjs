const assert = require("node:assert/strict");
const { test } = require("node:test");
global.CharacterSubclassData = require("../js/modules/character-subclass-data");
require("../js/modules/character-expanded-subclass-data");
const Validation = require("../js/modules/character-build-validation");
const classes = [
  "barbarian",
  "bard",
  "cleric",
  "druid",
  "fighter",
  "monk",
  "paladin",
  "ranger",
  "rogue",
  "sorcerer",
  "warlock",
  "wizard",
];
const issues = (edition, classLevels) => {
  const level = classLevels.reduce((sum, row) => sum + row.level, 0);
  return Validation.check(
    { build: { edition } },
    { progression: { classLevels, assignedLevel: level, targetLevel: level } },
    { level },
  ).issues.filter((row) => row.category === "Subclass");
};

test("2024 Overview requires subclasses at class level 3, matching the picker for every PHB class", () => {
  for (const classId of classes)
    for (const level of [1, 2, 3]) {
      const rows = issues("2024", [{ classId, level }]);
      const available = global.CharacterSubclassData.optionsFor(
        classId,
        level,
        "2024",
      );
      assert.equal(
        rows.length,
        level >= 3 ? 1 : 0,
        `${classId} level ${level}`,
      );
      assert.equal(
        rows.length > 0,
        available.length > 0,
        `${classId}: Fix must have an available subclass`,
      );
      if (rows.length) assert.equal(rows[0].target, '[data-subclass="0"]');
    }
});

test("2014 Overview preserves each class’s earlier subclass unlock level", () => {
  const early = { cleric: 1, sorcerer: 1, warlock: 1, druid: 2, wizard: 2 };
  for (const classId of [...classes, "artificer"]) {
    const minimum = early[classId] || 3;
    if (minimum > 1)
      assert.equal(
        issues("2014", [{ classId, level: minimum - 1 }]).length,
        0,
        `${classId} before unlock`,
      );
    assert.equal(
      issues("2014", [{ classId, level: minimum }]).length,
      1,
      `${classId} at unlock`,
    );
  }
});

test("multiclass warnings use individual class levels and target the eligible class", () => {
  assert.deepEqual(
    issues("2024", [
      { classId: "cleric", level: 2 },
      { classId: "wizard", level: 2 },
    ]),
    [],
  );
  const rows = issues("2024", [
    { classId: "cleric", level: 2 },
    { classId: "wizard", level: 3 },
  ]);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].target, '[data-subclass="1"]');
});

test("selecting a subclass, lowering class level and changing edition update completeness", () => {
  const entry = { classId: "wizard", level: 3 };
  assert.equal(issues("2024", [entry]).length, 1);
  entry.subclassId = "evocation";
  assert.deepEqual(issues("2024", [entry]), []);
  entry.subclassId = "";
  entry.level = 2;
  assert.deepEqual(issues("2024", [entry]), []);
  assert.equal(issues("2014", [entry]).length, 1);
  assert.deepEqual(issues("2024", [{ classId: "unknown", level: 3 }]), []);
});

const Model = require("../js/modules/character-sheet-model");
const build = (overrides = {}, edition = "2024") => {
  const data = Model.normalize({
    build: {
      edition,
      race: "human-2024",
      classId: "fighter",
      backgroundFeat: "Tough",
      humanOriginFeat: "Skilled",
      raceSkills: ["arcana", ""],
      classSkills: ["athletics", "perception", "history", "survival"],
      backgroundAbilities: ["str", "con", ""],
      standardLanguages: ["Elvish", "Orc"],
      humanFeatChoices: ["skill:medicine", "skill:nature", "tool:Flute"],
      ...overrides,
    },
  });
  data.adobe = {
    classLevels: [{ classId: "fighter", level: 4 }],
    classFeatureChoices: {},
  };
  return data;
};
const notices = (data) =>
  Validation.check(data, Model.derive(data, 4), { level: 4 }).issues;
const matching = (data, text) =>
  notices(data).filter((issue) => issue.message.includes(text));
test("missing Human Skilled targets its three actual choices without blaming completed class skills", () => {
  const data = build({ humanFeatChoices: ["", "", ""] }),
    before = JSON.stringify(data),
    rows = matching(data, "Skilled");
  assert.equal(rows.length, 1);
  assert.equal(rows[0].tab, "feats");
  assert.equal(rows[0].exactTargets, true);
  for (const index of [0, 1, 2])
    assert.ok(
      rows[0].target.includes('[data-build-feat-index="' + index + '"]'),
    );
  assert.ok(rows[0].target.includes("humanFeatChoices"));
  assert.ok(
    !notices(data).some((row) => row.target.includes("build.classSkills")),
  );
  assert.equal(JSON.stringify(data), before);
});
test("completed Skilled choices lose their marker while only the remaining missing choices stay targeted", () => {
  const data = build({ humanFeatChoices: ["skill:medicine", "", ""] });
  let row = matching(data, "Skilled")[0];
  assert.ok(!row.target.includes('[data-build-feat-index="0"]'));
  assert.ok(row.target.includes('[data-build-feat-index="1"]'));
  data.build.humanFeatChoices = [
    "skill:medicine",
    "skill:nature",
    "tool:Flute",
  ];
  assert.deepEqual(matching(data, "Skilled"), []);
});
test("a filled but duplicated Skilled choice targets only the duplicate, preserving the valid original and class choices", () => {
  const data = build({
      humanFeatChoices: ["skill:medicine", "skill:medicine", "tool:Flute"],
    }),
    row = matching(data, "Skilled")[0];
  assert.equal(
    row.target,
    '[data-build-feat-array="humanFeatChoices"][data-build-feat-index="1"]',
  );
  assert.equal(row.tab, "feats");
  assert.equal(data.build.humanFeatChoices[0], "skill:medicine");
  assert.ok(!row.target.includes("classSkills"));
});
test("Skilled cannot select an already trained class skill without showing the warning at the actual feat choice", () => {
  const data = build({
      humanFeatChoices: ["skill:athletics", "skill:nature", "tool:Flute"],
    }),
    row = matching(data, "Skilled")[0];
  assert.equal(
    row.target,
    '[data-build-feat-array="humanFeatChoices"][data-build-feat-index="0"]',
  );
  assert.ok(
    !notices(data).some((issue) => issue.target.includes("build.classSkills")),
  );
});
test("background and Human Skilled retain separate targets even when their warning messages match", () => {
  const data = build({
      backgroundFeat: "Skilled",
      backgroundFeatChoices: ["skill:medicine", "", "tool:Flute"],
      humanFeatChoices: ["skill:nature", "tool:Drum", ""],
    }),
    row = matching(data, "Skilled")[0];
  assert.equal(row.target.split(",").length, 2);
  assert.ok(
    row.target.includes(
      '[data-build-feat-array="backgroundFeatChoices"][data-build-feat-index="1"]',
    ),
  );
  assert.ok(
    row.target.includes(
      '[data-build-feat-array="humanFeatChoices"][data-build-feat-index="2"]',
    ),
  );
  assert.ok(!row.target.includes("classSkills"));
});
test("race skills and class skills keep their own precise invalid positions", () => {
  let data = build({ raceSkills: ["", ""] });
  assert.equal(
    matching(data, "racial skills")[0].target,
    '[name="build.raceSkills.0"]',
  );
  data = build({
    classSkills: ["athletics", "athletics", "history", "survival"],
  });
  assert.equal(
    matching(data, "Fighter class skills")[0].target,
    '[name="build.classSkills.1"]',
  );
});
test("filled duplicate languages and background abilities mark the invalid second value rather than the correct first one", () => {
  const data = build({
    standardLanguages: ["Elvish", "Elvish"],
    backgroundAbilities: ["str", "str", ""],
  });
  assert.equal(
    matching(data, "additional standard languages")[0].target,
    '[name="build.standardLanguages.1"]',
  );
  assert.equal(
    matching(data, "distinct background abilities")[0].target,
    '[name="build.backgroundAbilities.1"]',
  );
});
test("legacy Half-Elf skills use their legacy fields and only mark the duplicate", () => {
  const data = build(
    {
      race: "half-elf",
      raceSkills: ["", ""],
      skillChoices: ["arcana", "arcana"],
      extraLanguage: "Elvish",
      humanOriginFeat: "",
      humanFeatChoices: ["", "", ""],
    },
    "2014",
  );
  assert.equal(
    matching(data, "Half-Elf skills")[0].target,
    '[name="build.skillChoices.1"]',
  );
});

test("background language and tool warnings use the real background fields", () => {
  let data = build(
    {
      race: "hill-dwarf",
      background: "acolyte",
      backgroundLanguages: ["Draconic", "Draconic"],
    },
    "2014",
  );
  assert.equal(
    matching(data, "additional background languages")[0].target,
    '[name="build.backgroundLanguages.1"]',
  );
  data = build(
    {
      race: "hill-dwarf",
      background: "guild-artisan-2014",
      backgroundTools: ["", ""],
    },
    "2014",
  );
  assert.equal(
    matching(data, "required tool proficiency")[0].target,
    '[name="build.backgroundTools.0"]',
  );
});
test("a background replacement skill never points at an already completed class skill", () => {
  const data = build({
      background: "scribe-2024",
      raceSkills: ["history", ""],
    }),
    row = matching(data, "different untrained skill to replace perception")[0];
  assert.ok(row);
  assert.equal(row.target, '[name="build.backgroundReplacementSkills.1"]');
  assert.ok(
    !notices(data).some((issue) => issue.target.includes("build.classSkills")),
  );
});

test("removed race-size picker has a legal source default and preserves existing Small/Medium choices without hidden warnings", () => {
  for (const [edition, race] of [
    ["2024", "human-2024"],
    ["2014", "changeling-mpmm"],
  ])
    for (const size of ["", "Small", "Medium"]) {
      const data = build({ race, raceSize: size }, edition),
        before = JSON.stringify(data),
        derived = Model.derive(data, 4);
      assert.equal(derived.effects.size, size || "Medium");
      assert.ok(
        !derived.effects.warnings.some((message) =>
          /Choose Small or Medium/.test(message),
        ),
      );
      assert.equal(JSON.stringify(data), before);
    }
  assert.equal(
    Model.derive(build({ race: "halfling-2024", raceSize: "" }), 4).effects
      .size,
    "Small",
  );
});
