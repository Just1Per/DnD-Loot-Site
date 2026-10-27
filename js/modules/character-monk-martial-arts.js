"use strict";
// Base-class Martial Arts only; no saved choices or resource transactions.
var CharacterMonkMartialArts = (() => {
  const C =
    globalThis.CharacterClassFeatureChoices ||
    (typeof require === "function"
      ? require("./character-class-feature-choices")
      : null);
  function weapon(profile, edition = "2014") {
    if (!profile || profile.rangeType !== "melee") return false;
    const props = profile.props || [];
    return edition === "2024"
      ? profile.group === "simple" ||
          (profile.group === "martial" && props.includes("light"))
      : String(profile.name || "").toLowerCase() === "shortsword" ||
          (profile.group === "simple" &&
            !props.includes("heavy") &&
            !props.includes("twoHanded"));
  }
  function state(data, level = 1, entries = []) {
    const actual = C.monkLevels(data, level),
      edition = data.build?.edition === "2024" ? "2024" : "2014",
      modern = edition === "2024";
    const die = actual
      ? "1d" +
        ((actual >= 17 ? 10 : actual >= 11 ? 8 : actual >= 5 ? 6 : 4) +
          (modern ? 2 : 0))
      : "";
    const physical = entries.filter((row) => row.active),
      armor = physical.some((row) => row.mechanics.kind === "armor"),
      shield = physical.some((row) => row.mechanics.kind === "shield");
    const otherWeapon = physical.some(
      (row) => row.mechanics.kind === "weapon" && !weapon(row.profile, edition),
    );
    const reason = !actual
      ? ""
      : armor
        ? "Remove worn armor to use Martial Arts."
        : shield
          ? "Stow your shield to use Martial Arts."
          : otherWeapon
            ? "A readied weapon is not a base Monk weapon. Stow it, or check a specific subclass/optional-feature exception."
            : "";
    return {
      available: actual >= 1,
      active: actual >= 1 && !reason,
      level: actual,
      edition,
      die,
      reason,
      summary: actual
        ? "Monk " +
          actual +
          " · Martial Arts " +
          die +
          ". " +
          (reason ||
            "Automatic attacks use the higher Strength/Dexterity modifier; eligible unarmed/Monk weapons keep the better damage die.")
        : "",
      detail: actual
        ? "Monk " +
          actual +
          " · Martial Arts " +
          die +
          ". While unarmored, without a shield, and unarmed or wielding only Monk weapons, you can use Dexterity for attack/damage and replace normal damage with this die. " +
          (modern
            ? "You may make one Unarmed Strike as a Bonus Action. Dexterity may also set your Unarmed Strike Grapple/Shove save DC."
            : "After taking the Attack action with an Unarmed Strike or Monk weapon, you may make one Unarmed Strike as a Bonus Action.") +
          " A single Bonus Action cannot also be spent on Flurry of Blows. " +
          (reason ||
            "The sheet keeps a better existing damage die and respects explicit ability choices.")
        : "",
    };
  }
  const ability = (mods) =>
    Number(mods?.dex) > Number(mods?.str) ? "dex" : "str";
  function average(value) {
    const m = /^(\d+)d(\d+)$/.exec(String(value || ""));
    if (m)
      return Number(m[1]) >= 1 && Number(m[2]) >= 1
        ? (Number(m[1]) * (Number(m[2]) + 1)) / 2
        : null;
    return /^\d+$/.test(String(value)) ? Number(value) : null;
  }
  function dice(base, arts) {
    const a = average(base),
      b = average(arts);
    return a !== null && b !== null && b > a ? arts : base;
  }
  function note(s, used) {
    return (
      "Martial Arts · Monk " +
      s.level +
      ": " +
      (used === s.die
        ? "using " + s.die
        : "retaining " + used + " (Martial Arts die " + s.die + ")") +
      "."
    );
  }
  return { weapon, state, ability, dice, note };
})();
if (typeof module !== "undefined" && module.exports)
  module.exports = CharacterMonkMartialArts;
