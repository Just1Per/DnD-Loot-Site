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
    } else {
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
  function onRest(d, event) {
    if (!["turn", "long"].includes(event) || !choices(d)[turnKey]?.length)
      return false;
    d.adobe = {
      ...stored(d),
      classFeatureChoices: { ...choices(d), [turnKey]: [] },
    };
    return true;
  }
  return { status, regain, onRest, turnKey };
})();
if (typeof module !== "undefined" && module.exports)
  module.exports = CharacterDruidConversions;
