"use strict";
// Cooldowns follow campaign events, never the wall clock. Spell effects stay at the table.
var CharacterClericIntervention = (() => {
  const stored = (d) => d.adobe || d.rulesChoices?.grants?.__adobe?.data || {};
  const choices = (d) => stored(d).classFeatureChoices || {};
  const key = (edition) => edition + ":cleric:intervention";
  const wishId = "spell-xphb-091e606752615c91";
  const catalog = () =>
    globalThis.CharacterCatalog ||
    (typeof require === "function" ? require("./character-catalog") : null);
  function ledger(d, edition) {
    const raw = choices(d)[key(edition)];
    if (raw === undefined || (Array.isArray(raw) && raw.length === 0))
      return { valid: true, kind: "", remaining: 0, last: "" };
    const [kind, count, last] = Array.isArray(raw) ? raw : [];
    const valid =
      Array.isArray(raw) &&
      raw.length === 3 &&
      typeof count === "string" &&
      /^[0-8]$/.test(count) &&
      typeof last === "string" &&
      (edition === "2024"
        ? (kind === "rest" &&
            Number(count) <= 1 &&
            typeof last === "string" &&
            /^spell-[a-z0-9-]+$/.test(last) &&
            last !== wishId) ||
          (kind === "wish" && last === wishId)
        : (kind === "rest" &&
            Number(count) <= 1 &&
            /^roll-(?:[1-9]|[1-9][0-9]|100)$/.test(last)) ||
          (kind === "days" &&
            Number(count) <= 7 &&
            /^(?:automatic|roll-(?:[1-9]|1[0-9]))$/.test(last)));
    return {
      valid: !!valid,
      kind,
      remaining: valid ? Number(count) : 0,
      last: typeof last === "string" ? last : "",
    };
  }
  function status(d, { level = 1 } = {}) {
    const helper =
      globalThis.CharacterDivineChannel ||
      (typeof require === "function"
        ? require("./character-divine-channel")
        : null);
    const actual = helper.entries(d, level).cleric?.level || 0;
    const edition = d.build?.edition === "2024" ? "2024" : "2014";
    const record = ledger(d, edition),
      available = actual >= 10;
    const reason = !available
      ? "Requires actual Cleric level 10."
      : !record.valid
        ? "The saved Divine Intervention record is invalid. Restore a valid saved record before using this feature."
        : record.remaining
          ? record.kind === "days"
            ? record.remaining +
              " campaign days remaining; Long Rests do not advance this wait."
            : record.remaining +
              " completed Long Rest" +
              (record.remaining === 1 ? "" : "s") +
              " remaining."
          : "";
    return {
      available,
      edition,
      level: actual,
      record,
      reason,
      ready: available && !reason,
      detail:
        edition === "2024"
          ? "Magic action · Choose a Cleric spell, cantrip through level 5, excluding Reaction spells. No preparation, spell slot or Material components required. Resolve the spell’s remaining requirements and effects at the table. Recharges on Long Rest." +
            (actual >= 20
              ? " Greater Divine Intervention also allows Wish; record the rolled 2d4 total as a wait of 2–8 Long Rests for the entire feature. Wish’s own effects and consequences still apply."
              : "")
          : "Action · Describe the help you seek and roll percentile dice. A result at or below your Cleric level succeeds; your DM decides the intervention." +
            (actual >= 20
              ? " At Cleric 20, intervention succeeds automatically."
              : "") +
            " Failure recharges on Long Rest; success requires 7 campaign days before another attempt.",
    };
  }
  function spells(d, context = {}) {
    const s = status(d, context);
    if (!s.available || s.edition !== "2024") return [];
    return (catalog()?.data?.spells || [])
      .filter(
        (row) =>
          row.edition === "2024" &&
          ((Number.isInteger(row.level) &&
            row.level >= 0 &&
            row.level <= 5 &&
            row.classes?.includes("cleric") &&
            typeof row.casting === "string" &&
            row.casting.trim() &&
            !/reaction/i.test(row.casting)) ||
            (s.level >= 20 && row.id.toLowerCase() === wishId)),
      )
      .map((row) => ({ ...row, choiceId: row.id.toLowerCase() }))
      .sort((a, b) => a.level - b.level || a.name.localeCompare(b.name));
  }
  function write(d, edition, record) {
    const map = { ...choices(d), [key(edition)]: record };
    if (Object.keys(map).length > 100)
      return {
        ok: false,
        reason: "No room for another class-choice record. Nothing was changed.",
      };
    d.adobe = { ...stored(d), classFeatureChoices: map };
    return { ok: true };
  }
  function cast(
    d,
    { spellId, wishRests, confirmed = false } = {},
    context = {},
  ) {
    const s = status(d, context);
    if (s.reason) return { ok: false, reason: s.reason };
    if (s.edition !== "2024")
      return {
        ok: false,
        reason: "Legacy Clerics record a percentile attempt instead.",
      };
    const spell = spells(d, context).find(
      (row) => row.choiceId === String(spellId || "").toLowerCase(),
    );
    if (!spell)
      return { ok: false, reason: "Choose an eligible Cleric spell." };
    if (confirmed !== true)
      return {
        ok: false,
        reason:
          "Confirm that you are using the Magic action to cast this spell.",
      };
    const wish = spell.choiceId === wishId;
    if (
      wish &&
      (!Number.isInteger(wishRests) || wishRests < 2 || wishRests > 8)
    )
      return {
        ok: false,
        reason: "Roll 2d4 at the table and enter the total, from 2 to 8.",
      };
    const result = write(d, s.edition, [
      wish ? "wish" : "rest",
      String(wish ? wishRests : 1),
      spell.choiceId,
    ]);
    return result.ok
      ? {
          ...result,
          spell,
          message:
            spell.name +
            " recorded via Divine Intervention. No spell slot was spent. Resolve the spell at the table; save to keep this use.",
        }
      : result;
  }
  function attempt(d, { roll, confirmed = false } = {}, context = {}) {
    const s = status(d, context);
    if (s.reason) return { ok: false, reason: s.reason };
    if (s.edition !== "2014")
      return {
        ok: false,
        reason:
          "Revised Clerics choose a spell instead of rolling percentile dice.",
      };
    if (confirmed !== true)
      return {
        ok: false,
        reason: "Confirm that you used your action to request divine help.",
      };
    if (s.level < 20 && (!Number.isInteger(roll) || roll < 1 || roll > 100))
      return {
        ok: false,
        reason: "Enter the percentile result from 1 to 100 (00 means 100).",
      };
    const success = s.level >= 20 || roll <= s.level;
    const result = write(d, s.edition, [
      success ? "days" : "rest",
      success ? "7" : "1",
      s.level >= 20 ? "automatic" : "roll-" + roll,
    ]);
    return result.ok
      ? {
          ...result,
          success,
          message: success
            ? "Intervention succeeds. Your DM decides its effect. Wait 7 campaign days; save to keep this result."
            : "Intervention fails. Finish a Long Rest before trying again; save to keep this result.",
        }
      : result;
  }
  function campaignDay(d) {
    const record = ledger(d, "2014");
    if (!record.valid || record.kind !== "days" || !record.remaining)
      return false;
    return write(d, "2014", ["days", String(record.remaining - 1), record.last])
      .ok;
  }
  function onRest(d, event) {
    if (event !== "long") return false;
    let changed = false;
    for (const edition of ["2014", "2024"]) {
      const record = ledger(d, edition);
      if (
        record.valid &&
        ["rest", "wish"].includes(record.kind) &&
        record.remaining
      )
        changed =
          write(d, edition, [
            record.kind,
            String(record.remaining - 1),
            record.last,
          ]).ok || changed;
    }
    return changed;
  }
  function summary(d, context = {}) {
    const s = status(d, context);
    return s.available ? s.detail + " Status: " + (s.reason || "Ready.") : "";
  }
  return {
    key,
    wishId,
    ledger,
    status,
    spells,
    cast,
    attempt,
    campaignDay,
    onRest,
    summary,
  };
})();
if (typeof module !== "undefined" && module.exports)
  module.exports = CharacterClericIntervention;
