"use strict";
// Druid resource conversions are atomic; slot pools retain their own identity.
var CharacterDruidConversions = (() => {
  const C =
    globalThis.CharacterClassFeatureChoices ||
    (typeof require === "function"
      ? require("./character-class-feature-choices")
      : null);
  const W =
    globalThis.CharacterWildShape ||
    (typeof require === "function" ? require("./character-wild-shape") : null);
  const F =
    globalThis.CharacterWildCompanion ||
    (typeof require === "function"
      ? require("./character-wild-companion")
      : null);
  const turnKey = "2024:druid:resurgence-turn-used";
  const stored = (d) => d.adobe || d.rulesChoices?.grants?.__adobe?.data || {};
  const choices = (d) => C.normalize(stored(d).classFeatureChoices);
  function status(d, context = {}) {
    const pool = W.state(d, context.level || 1),
      available = pool.modern && pool.level >= 5;
    const usedThisTurn = (choices(d)[turnKey] || []).some(Boolean);
    const payments = F.payments(d, context).filter(
      (p) => p.id !== "wild-shape",
    );
    return {
      available,
      level: pool.level,
      pool,
      usedThisTurn,
      payments,
      reason: !available
        ? "Wild Resurgence requires actual 2024 Druid level 5."
        : usedThisTurn
          ? "Already used on this turn. Record your next turn before using it again."
          : pool.remaining > 0
            ? "Use your remaining Wild Shape before converting a spell slot."
            : !payments.some((p) => p.available > 0)
              ? "No spell slot is available to spend."
              : "",
      detail:
        "Once on each of your own turns, when no Wild Shape uses remain, spend one spell slot to regain one use. No action required. This does not cast a spell.",
    };
  }
  function regain(d, payment, { ownTurn = false, ...context } = {}) {
    const s = status(d, context);
    if (s.reason) return { ok: false, reason: s.reason };
    if (ownTurn !== true)
      return { ok: false, reason: "Confirm that this is your own turn." };
    const slot = s.payments.find((p) => p.id === payment && p.available > 0);
    if (!slot) return { ok: false, reason: "Choose an available spell slot." };
    const map = {
      ...choices(d),
      [turnKey]: ["1"],
      [s.pool.keys.spent]: [
        String(Math.max(0, Math.min(s.pool.used, s.pool.maxUses) - 1)),
      ],
      [s.pool.keys.last]: ["resurgence"],
    };
    if (slot.created) map[slot.key] = ["spent"];
    if (Object.keys(map).length > 100)
      return {
        ok: false,
        reason:
          "The sheet has no room for additional class-choice records. Nothing was spent.",
      };
    const extra = { ...stored(d), classFeatureChoices: map };
    let slots;
    if (payment === "pact") {
      extra.pactSlotsUsed =
        Math.max(0, Math.trunc(Number(extra.pactSlotsUsed) || 0)) + 1;
      extra.pactSlotsSeparated = true;
    } else if (!slot.created) {
      slots = (d.slots || []).map((row) => ({ ...row }));
      const i = slot.level - 1;
      while (slots.length <= i) slots.push({ max: 0, used: 0 });
      slots[i] = {
        ...slots[i],
        max: slot.max,
        used: Math.max(0, Math.trunc(Number(slots[i]?.used) || 0)) + 1,
      };
    }
    d.adobe = extra;
    if (slots) d.slots = slots;
    return { ok: true };
  }
  const creationKeys = {
    resurgence: "2024:druid:resurgence-slot-used",
    nature: "2024:druid:nature-magician-used",
  };
  const createdKey = (level) => "2024:druid:created-slot-" + level;
  function createdSlots(d) {
    const map = choices(d),
      rows = [];
    for (const level of [1, 2, 4, 6, 8]) {
      const key = createdKey(level),
        raw = map[key];
      if (!raw?.length) continue;
      const valid = raw.length === 1 && ["ready", "spent"].includes(raw[0]);
      rows.push({
        id: "created-" + level,
        key,
        level,
        max: 1,
        used: raw[0] === "ready" && valid ? 0 : 1,
        available: raw[0] === "ready" && valid ? 1 : 0,
        valid,
        source: level === 1 ? "Wild Resurgence" : "Nature Magician",
        expiry: "Long Rest · agreed table rule",
      });
    }
    return rows;
  }
  function creationStatus(d, feature, uses = 1, context = {}) {
    const pool = W.state(d, context.level || 1),
      minimum = feature === "resurgence" ? 5 : 20;
    const supported = Object.hasOwn(creationKeys, feature),
      used =
        supported && (choices(d)[creationKeys[feature]] || []).some(Boolean);
    const validCost =
      Number.isInteger(uses) &&
      uses >= 1 &&
      (feature === "resurgence" ? uses === 1 : uses <= 4);
    const level = feature === "resurgence" ? 1 : validCost ? uses * 2 : 0;
    const existing = createdSlots(d).some((row) => row.level === level);
    return {
      available: supported && pool.modern && pool.level >= minimum,
      used,
      pool,
      level,
      uses,
      reason: !supported
        ? "Choose a supported Druid slot-creation feature."
        : !pool.modern || pool.level < minimum
          ? "Requires actual 2024 Druid level " + minimum + "."
          : !validCost
            ? "Choose an allowed whole number of Wild Shape uses."
            : used
              ? "Already used; finish a Long Rest before creating another slot with this feature."
              : existing
                ? "This created-slot record already exists. Finish a Long Rest before replacing it."
                : pool.remaining < uses
                  ? "Not enough Wild Shape uses remain."
                  : "",
    };
  }
  function create(d, feature, uses = 1, context = {}) {
    const s = creationStatus(d, feature, uses, context);
    if (s.reason) return { ok: false, reason: s.reason };
    const map = {
      ...choices(d),
      [creationKeys[feature]]: ["1"],
      [createdKey(s.level)]: ["ready"],
      [s.pool.keys.spent]: [String(s.pool.used + uses)],
      [s.pool.keys.last]: ["created-slot"],
    };
    if (Object.keys(map).length > 100)
      return {
        ok: false,
        reason:
          "The sheet has no room for additional class-choice records. Nothing was spent.",
      };
    d.adobe = { ...stored(d), classFeatureChoices: map };
    return { ok: true, level: s.level };
  }
  function changeCreatedUse(d, level, used) {
    const row = createdSlots(d).find((r) => r.level === level && r.valid);
    if (!row || typeof used !== "boolean" || row.used === Number(used))
      return false;
    d.adobe = {
      ...stored(d),
      classFeatureChoices: {
        ...choices(d),
        [row.key]: [used ? "spent" : "ready"],
      },
    };
    return true;
  }
  function onRest(d, event) {
    if (!["turn", "long"].includes(event)) return false;
    const map = choices(d),
      updates = {};
    const keys = [
      turnKey,
      ...(event === "long"
        ? [...Object.values(creationKeys), ...[1, 2, 4, 6, 8].map(createdKey)]
        : []),
    ];
    for (const key of keys) if (map[key]?.length) updates[key] = [];
    if (!Object.keys(updates).length) return false;
    d.adobe = { ...stored(d), classFeatureChoices: { ...map, ...updates } };
    return true;
  }
  return {
    status,
    regain,
    onRest,
    turnKey,
    createdSlots,
    creationStatus,
    create,
    changeCreatedUse,
    creationKeys,
  };
})();
if (typeof module !== "undefined" && module.exports)
  module.exports = CharacterDruidConversions;
