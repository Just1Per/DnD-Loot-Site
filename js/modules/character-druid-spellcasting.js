"use strict";
// This checks Wild Shape/component restrictions only, not preparation or resource availability.
var CharacterDruidSpellcasting = (() => {
  const W =
    globalThis.CharacterWildShape ||
    (typeof require === "function" ? require("./character-wild-shape") : null);
  const components = () =>
    globalThis.CharacterSpellComponentData ||
    (typeof require === "function"
      ? require("./character-spell-component-data")
      : null);
  function summary(d, { level = 1 } = {}) {
    const s = W.state(d, level);
    if (s.edition === "2014" && s.level >= 20)
      return "Archdruid: your Druid spells ignore Verbal, Somatic and unpriced, unconsumed Material components, in normal form or Wild Shape. Costly or consumed materials still apply; in Wild Shape you cannot provide them. Other classes’ spells do not gain this benefit.";
    if (s.level >= 18)
      return s.modern
        ? "Beast Spells: you can cast spells in Beast form, except spells with costly or consumed Material components. Check the status beside each spell on Spells."
        : "Beast Spells: you can perform Verbal and Somatic components of Druid spells in Wild Shape, but cannot provide any Material components. Check each spell on Spells.";
    return "Wild Shape normally prevents spellcasting. A subclass may grant specific exceptions; check those rules with your DM. Concentration on an existing spell can continue.";
  }
  function assess(d, spell, { level = 1, classId = "" } = {}) {
    const s = W.state(d, level),
      active = !!s.activeId,
      archdruid = s.edition === "2014" && s.level >= 20;
    const result = {
      relevant: active || archdruid,
      active,
      level: s.level,
      edition: s.edition,
      status: "allowed",
      label: "",
      detail: "",
      waived: [],
    };
    const done = (status, label, detail, waived = []) => ({
      ...result,
      status,
      label,
      detail,
      waived,
    });
    if (!result.relevant) return { ...result, status: "unrestricted" };
    if (
      active &&
      (!s.available || W.blocked(d, level) || !W.eligible(d, s.activeId, level))
    )
      return done(
        "check",
        "Check saved form",
        "The saved Wild Shape is not active for the current class or condition. Return to normal form before checking spells.",
      );
    if (active && s.level < 18)
      return done(
        "check",
        "Check subclass exception",
        "Base Wild Shape prevents casting spells at this Druid level. Only a specific subclass exception can permit this spell; review it with your DM.",
      );
    if (
      active &&
      s.modern &&
      W.creature(s.activeId)?.data?.creatureType &&
      !/^beast$/i.test(W.creature(s.activeId).data.creatureType)
    )
      return done(
        "check",
        "Check form exception",
        "2024 Beast Spells applies in Beast form. This saved form has another creature type; review any specific subclass exception.",
      );
    if (!s.modern && classId !== "druid")
      return active
        ? done(
            "check",
            "Check casting class",
            "Legacy Beast Spells and Archdruid apply to Druid spells. Assign this spell’s casting class or review another class/subclass exception; they do not waive components for another class.",
          )
        : { ...result, relevant: false, status: "unrestricted" };
    if (
      !spell ||
      typeof spell.components !== "string" ||
      !spell.components.trim()
    )
      return done(
        "check",
        "Check component requirements",
        "No component information is recorded for this spell. Consult its source before casting in Wild Shape or applying Archdruid.",
      );
    const hasM = String(spell?.components || "")
      .split(",")
      .some((part) => part.trim().toUpperCase() === "M");
    if (active && !s.modern && !archdruid && hasM)
      return done(
        "blocked",
        "Material component unavailable",
        "Legacy Beast Spells cannot provide Material components, including an ordinary component or spellcasting focus.",
      );
    const flags = components()?.spells?.[spell?.id];
    const verified =
      Array.isArray(flags) &&
      flags.length === 3 &&
      typeof flags[0] === "boolean" &&
      typeof flags[1] === "boolean" &&
      [true, false, "optional"].includes(flags[2]) &&
      flags[0] === hasM;
    if (hasM && !verified)
      return done(
        "check",
        "Check Material requirements",
        "This spell has no verified component flags. Read its information or source: costly or consumed Material components are not waived.",
      );
    if (hasM && flags?.[1])
      return active
        ? done(
            "blocked",
            "Costly Material component",
            "This spell specifies a Material cost and cannot be cast in this form with Beast Spells. A focus does not remove that requirement.",
          )
        : done(
            "allowed",
            "Provide costly Material component",
            "Archdruid waives Verbal and Somatic components; provide this spell’s costly Material component normally.",
            ["V", "S"],
          );
    if (hasM && flags?.[2] === true)
      return active
        ? done(
            "blocked",
            "Consumed Material component",
            "This spell consumes a Material component and cannot be cast in this form with Beast Spells.",
          )
        : done(
            "allowed",
            "Provide consumed Material component",
            "Archdruid waives Verbal and Somatic components; provide and expend the Material component normally.",
            ["V", "S"],
          );
    if (hasM && flags?.[2] === "optional")
      return done(
        "check",
        "Check optional consumption",
        "This spell can consume its Material component depending on its use. Read the spell and resolve that choice with your DM before relying on Beast Spells or Archdruid.",
      );
    return archdruid
      ? done(
          "allowed",
          "Components waived · Archdruid",
          "For this Druid spell, Archdruid ignores Verbal, Somatic and any unpriced, unconsumed Material components. Other casting requirements and effects still apply.",
          ["V", "S", ...(hasM ? ["M"] : [])],
        )
      : done(
          "allowed",
          "Permitted by Beast Spells",
          "Wild Shape permits this spell’s components. Preparation, slots, concentration, targets and other casting requirements still apply.",
        );
  }
  return { assess, summary };
})();
if (typeof module !== "undefined" && module.exports)
  module.exports = CharacterDruidSpellcasting;
