"use strict";
// Source-aware Rage uses. Spending a use does not activate an unconditional buff.
var CharacterBarbarianRage = (() => {
  const C =
    globalThis.CharacterClassFeatureChoices ||
    (typeof require === "function"
      ? require("./character-class-feature-choices")
      : null);
  const stored = (data) =>
    data.adobe || data.rulesChoices?.grants?.__adobe?.data || {};
  const edition = (data) => (data.build?.edition === "2024" ? "2024" : "2014");
  const keys = (data) => ({
    uses: edition(data) + ":barbarian:rage-uses",
    recovery: "2024:barbarian:persistent-rage-recovery",
  });
  const spent = (choices, key) =>
    /^\d{1,3}$/.test(choices[key]?.[0] || "") ? Number(choices[key][0]) : 0;
  function levels(data, total = 1) {
    const entries = stored(data).classLevels?.length
      ? stored(data).classLevels
      : [{ classId: data.build?.classId, level: total }];
    let remaining = Math.max(1, Math.min(20, Math.trunc(Number(total) || 1))),
      result = 0;
    const seen = new Set();
    for (const entry of entries) {
      const actual = Math.min(
        remaining,
        Math.max(0, Math.trunc(Number(entry.level) || 0)),
      );
      remaining -= actual;
      if (entry.classId === "barbarian" && !seen.has(entry.classId))
        result = actual;
      seen.add(entry.classId);
    }
    return result;
  }
  function resource(data, { level = 1 } = {}) {
    const actual = levels(data, level);
    if (!actual) return null;
    const modern = edition(data) === "2024",
      key = keys(data),
      choices = C.normalize(stored(data).classFeatureChoices),
      unlimited = !modern && actual === 20,
      max =
        actual >= 17
          ? 6
          : actual >= 12
            ? 5
            : actual >= 6
              ? 4
              : actual >= 3
                ? 3
                : 2,
      used = unlimited ? 0 : spent(choices, key.uses),
      damage = actual >= 16 ? 4 : actual >= 9 ? 3 : 2,
      persistent = actual >= 15;
    return {
      id: "barbarian-rage",
      key: key.uses,
      name: "Rage",
      className: "Barbarian",
      source: edition(data) + " Barbarian",
      level: actual,
      max,
      used,
      remaining: unlimited ? max : Math.max(0, max - used),
      unlimited,
      unit: "uses",
      rageDamage: damage,
      resets: modern ? ["short", "long"] : ["long"],
      shortRecovery: modern ? 1 : 0,
      recovery:
        (unlimited
          ? "Unlimited uses"
          : modern
            ? "Short Rest: regain 1 use · Long Rest: all uses"
            : "Long Rest recovery") +
        (modern && persistent
          ? spent(choices, key.recovery) > 0
            ? " · Initiative recovery used until Long Rest"
            : " · Optional Initiative recovery available"
          : ""),
      useLabel: "Spend 1 Rage use",
      undoLabel: "Undo use",
      rageInitiativeRecovery: modern && persistent,
      rageRecoveryUsed: spent(choices, key.recovery) > 0,
      description:
        "Bonus Action · Rage Damage +" +
        damage +
        " while raging, on " +
        (modern
          ? "Strength-based weapon or Unarmed Strike damage. Do not wear Heavy armor."
          : "Strength-based melee weapon attacks. Benefits require no Heavy armor.") +
        " Spending a use tracks the resource; resolve activation and conditional effects during play.",
      rulesLabel: "Rage benefits & duration",
      additionalRules: [
        {
          name: "While raging",
          detail:
            "Resistance to Bludgeoning, Piercing and Slashing damage; Advantage on Strength checks and Strength saving throws. You cannot cast spells or maintain Concentration. These conditional benefits are not permanent sheet bonuses.",
        },
        {
          name: "Duration",
          detail: modern
            ? persistent
              ? "At Barbarian 15, lasts 10 minutes without extending each round; ends early if Unconscious or wearing Heavy armor."
              : "Until the end of your next turn; extend by attacking an enemy, forcing an enemy save, or using a Bonus Action, up to 10 minutes. Ends early if Incapacitated or wearing Heavy armor."
            : "Up to 1 minute. " +
              (persistent
                ? "At Barbarian 15, ends early only if you fall Unconscious or choose to end it."
                : "Ends early if Unconscious, or if your turn ends without attacking a hostile creature or taking damage since your last turn. You can end it on your turn as a Bonus Action."),
        },
        ...(modern && persistent
          ? [
              {
                name: "Persistent Rage recovery",
                detail:
                  "When you roll Initiative, you may regain all expended Rage uses once per Long Rest. Use the separate Initiative recovery button only for this feature; ordinary Initiative reset does not spend this optional recovery.",
              },
            ]
          : []),
      ],
    };
  }
  function recoverAtInitiative(data, { level = 1, confirmed = false } = {}) {
    const row = resource(data, { level });
    if (
      confirmed !== true ||
      !row?.rageInitiativeRecovery ||
      row.rageRecoveryUsed ||
      !row.used
    )
      return false;
    const value = stored(data),
      key = keys(data);
    data.adobe = {
      ...value,
      classFeatureChoices: {
        ...C.normalize(value.classFeatureChoices),
        [key.uses]: ["0"],
        [key.recovery]: ["1"],
      },
    };
    return true;
  }
  function onRest(data, event, { level = 1 } = {}) {
    const row = resource(data, { level });
    if (!row || !row.resets.includes(event)) return;
    const value = stored(data),
      choices = C.normalize(value.classFeatureChoices),
      key = keys(data),
      updates = {};
    if (choices[key.uses])
      updates[key.uses] = [
        String(
          event === "short"
            ? Math.max(0, Math.min(spent(choices, key.uses), row.max) - 1)
            : 0,
        ),
      ];
    if (event === "long" && edition(data) === "2024" && choices[key.recovery])
      updates[key.recovery] = ["0"];
    if (Object.keys(updates).length)
      data.adobe = {
        ...value,
        classFeatureChoices: { ...choices, ...updates },
      };
  }
  return { levels, resource, recoverAtInitiative, onRest };
})();
if (typeof module !== "undefined" && module.exports)
  module.exports = CharacterBarbarianRage;
