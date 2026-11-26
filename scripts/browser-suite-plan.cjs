"use strict";
// Deterministic duration-based partition. Execution within each group retains
// manifest order; new suites use the median measured duration, never disappear.
const fs = require("node:fs"),
  path = require("node:path"),
  { spawnSync } = require("node:child_process");
const evidence = require("../tests/browser-suite-timings.json");
function weights(group) {
  const rows = evidence[group];
  if (
    !rows ||
    Object.values(rows).some((n) => !Number.isFinite(n) || n <= 0 || n > 3600)
  )
    throw Error("Invalid browser timing evidence");
  return rows;
}
function plan(rows, count, seconds = {}) {
  if (
    !seconds ||
    Array.isArray(seconds) ||
    typeof seconds !== "object" ||
    Object.values(seconds).some(
      (n) => !Number.isFinite(n) || n <= 0 || n > 3600,
    )
  )
    throw Error("Invalid timing weights");
  if (
    !Array.isArray(rows) ||
    !rows.length ||
    new Set(rows).size !== rows.length ||
    !Number.isInteger(count) ||
    count < 1 ||
    count > rows.length
  )
    throw Error(
      "Shard must select a nonempty part of a unique suite manifest.",
    );
  const known = Object.values(seconds)
      .filter((n) => Number.isFinite(n) && n > 0)
      .sort((a, b) => a - b),
    fallback = known[Math.floor(known.length / 2)] || 10;
  const ranked = rows
      .map((name, index) => ({
        name,
        index,
        seconds: seconds[name] || fallback,
      }))
      .sort((a, b) => b.seconds - a.seconds || a.index - b.index),
    groups = Array.from({ length: count }, () => ({ seconds: 0, rows: [] }));
  for (const row of ranked) {
    const group = groups.reduce((a, b) => (b.seconds < a.seconds ? b : a));
    group.rows.push(row);
    group.seconds += row.seconds;
  }
  return groups.map((group) => ({
    seconds: +group.seconds.toFixed(1),
    suites: group.rows.sort((a, b) => a.index - b.index).map((row) => row.name),
  }));
}
function select(rows, shard, seconds) {
  if (!shard) return rows;
  const match = /^([1-9]\d*)\/([1-9]\d*)$/.exec(shard || "");
  if (!match) throw Error("Use --shard INDEX/TOTAL (for example 1/3).");
  const index = Number(match[1]),
    total = Number(match[2]);
  if (
    !Number.isSafeInteger(index) ||
    !Number.isSafeInteger(total) ||
    index > total
  )
    throw Error("Invalid shard");
  return plan(rows, total, seconds)[index - 1].suites;
}
function run(rows, opts, { group, cwd, command }) {
  const started = Date.now(),
    results = [];
  let status = 0;
  try {
    console.log(
      group +
        " browser suites: " +
        rows.length +
        (opts.shard ? " · shard " + opts.shard : ""),
    );
    for (const name of rows) {
      const before = Date.now();
      console.log("\nRUN " + name);
      const [program, ...args] = command(name),
        result = spawnSync(program, args, {
          cwd,
          env: process.env,
          stdio: "inherit",
        });
      status = result.error ? 1 : result.status || (result.signal ? 1 : 0);
      results.push({
        suite: name,
        durationMs: Date.now() - before,
        status: status === 0 ? "passed" : "failed",
        exitCode: status,
      });
      if (result.error) throw result.error;
      if (status) {
        console.error(
          "FAIL " + name + " · " + (result.signal || "exit " + status),
        );
        return status;
      }
      console.log(
        "DONE " +
          name +
          " · " +
          ((Date.now() - before) / 1000).toFixed(1) +
          "s",
      );
    }
    console.log(
      "PASS " +
        rows.length +
        " suites · " +
        ((Date.now() - started) / 1000).toFixed(1) +
        "s",
    );
    return 0;
  } finally {
    if (opts.report) {
      fs.mkdirSync(path.dirname(path.resolve(opts.report)), {
        recursive: true,
      });
      fs.writeFileSync(
        opts.report,
        JSON.stringify(
          {
            format: 1,
            commit: process.env.GITHUB_SHA || null,
            workflowRun: process.env.GITHUB_RUN_ID || null,
            group,
            shard: opts.shard || null,
            durationMs: Date.now() - started,
            complete:
              results.length === rows.length &&
              results.every((row) => row.status === "passed"),
            suites: results,
          },
          null,
          2,
        ) + "\n",
      );
    }
  }
}
module.exports = { weights, plan, select, run };
