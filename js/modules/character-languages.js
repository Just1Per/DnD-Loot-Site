"use strict";
var CharacterLanguages = (() => {
  const rules = () =>
    globalThis.CharacterRules ||
    (typeof require === "function" ? require("./character-rules") : null);
  const norm = (v) =>
    String(v || "")
      .replace(/[’‘]/g, "'")
      .trim()
      .toLowerCase();
  const slug = (v) =>
    norm(v)
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  const key = "2024:rogue:languages";
  const stored = (d) => d.adobe || d.rulesChoices?.grants?.__adobe?.data || {};
  const nameFor = (value) =>
    rules().languages.find(
      (name) => norm(name) === norm(value) || slug(name) === value,
    ) || "";
  const secret = (name) => ["Thieves' Cant", "Druidic"].includes(nameFor(name));
  function groups(edition = "2024", includeSecret = false) {
    const standard = new Set(
      edition === "2024"
        ? ["Common", ...rules().modern.standardLanguages]
        : [
            "Common",
            "Dwarvish",
            "Elvish",
            "Giant",
            "Gnomish",
            "Goblin",
            "Halfling",
            "Orc",
          ],
    );
    const rare = new Set([
      "Abyssal",
      "Celestial",
      "Deep Speech",
      "Draconic",
      "Druidic",
      "Infernal",
      "Primordial",
      "Sylvan",
      "Thieves' Cant",
      "Undercommon",
    ]);
    const rows = rules().languages.filter(
      (name) => includeSecret || !secret(name),
    );
    return [
      {
        name: "Standard languages",
        values: rows.filter((n) => standard.has(n)),
      },
      {
        name: "Rare languages",
        values: rows.filter((n) => !standard.has(n) && rare.has(n)),
      },
      {
        name: "Setting languages & dialects",
        values: rows.filter((n) => !standard.has(n) && !rare.has(n)),
      },
    ];
  }
  function learned(d) {
    return [
      ...new Set(
        String(d.languages || "")
          .split(/[,;\n]/)
          .map(nameFor)
          .filter(Boolean),
      ),
    ];
  }
  function add(d, name, known = []) {
    name = nameFor(name);
    if (
      !name ||
      secret(name) ||
      [...known, ...learned(d)].some((v) => norm(v) === norm(name))
    )
      return false;
    const text = String(d.languages || ""),
      next = text + (text.trim() ? "\n" : "") + name;
    if (next.length > 12000) return false;
    d.languages = next;
    return true;
  }
  function remove(d, name) {
    name = nameFor(name);
    if (!name || !learned(d).includes(name)) return false;
    d.languages = String(d.languages || "")
      .split(/[,;\n]/)
      .filter((part) => nameFor(part) !== name)
      .join("\n");
    return true;
  }
  function report(d, { level = 1, known = [] } = {}) {
    const extra = stored(d),
      P =
        globalThis.CharacterProgression ||
        (typeof require === "function"
          ? require("./character-progression")
          : null);
    let left = extra.useExperience
        ? P.levelFromXP(d.experience)
        : Math.max(1, Math.min(20, Math.trunc(Number(level) || 1))),
      actual = 0,
      seen = false;
    const rows = extra.classLevels?.length
      ? extra.classLevels
      : [{ classId: d.build?.classId, level: left }];
    for (const row of rows) {
      const n = Math.min(left, Math.max(0, Math.trunc(Number(row.level) || 0)));
      left -= n;
      if (row.classId === "rogue" && !seen && n) {
        actual = n;
        seen = true;
      }
    }
    const raw = extra.classFeatureChoices?.[key]?.[0] || "",
      choice = nameFor(raw),
      available = d.build?.edition === "2024" && actual >= 1;
    const baseKnown = [
      ...new Set([
        ...known,
        ...learned(d),
        ...(available ? ["Common", "Thieves’ Cant"] : []),
      ]),
    ];
    const valid =
      available && !!choice && !baseKnown.some((v) => norm(v) === norm(choice));
    return {
      available,
      level: actual,
      key,
      raw,
      choice,
      valid,
      known: baseKnown,
      reason: !available
        ? ""
        : !raw
          ? "Choose the additional language granted by Thieves’ Cant."
          : !valid
            ? "Choose a different additional Thieves’ Cant language that you do not already know."
            : "",
    };
  }
  function apply(e, d, context = {}) {
    const row = report(d, { ...context, known: e.languages });
    if (row.valid) e.languages.push(row.choice);
    if (row.reason) {
      const modern = rules().modern;
      modern.choiceWarning(
        e,
        row.reason,
        "Language",
        "[data-rogue-language]",
        "Thieves’ Cant",
      );
    }
    return row;
  }
  function setRogue(d, value, context = {}) {
    const r = report(d, context),
      name = value ? nameFor(value) : "";
    if (
      !r.available ||
      (value && !name) ||
      (name && r.known.some((v) => norm(v) === norm(name)))
    )
      return false;
    const map = {
      ...(stored(d).classFeatureChoices || {}),
      [key]: [name ? slug(name) : ""],
    };
    if (Object.keys(map).length > 100) return false;
    d.adobe = { ...stored(d), classFeatureChoices: map };
    return true;
  }
  return {
    groups,
    learned,
    add,
    remove,
    report,
    apply,
    setRogue,
    key,
    nameFor,
  };
})();
if (typeof module !== "undefined" && module.exports)
  module.exports = CharacterLanguages;
