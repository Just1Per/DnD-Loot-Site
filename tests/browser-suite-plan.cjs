"use strict";
const { test } = require("node:test"),
  assert = require("node:assert/strict"),
  fs = require("node:fs"),
  os = require("node:os"),
  path = require("node:path");
const P = require("../scripts/browser-suite-plan.cjs"),
  Adobe = require("../scripts/run-adobe-connected.cjs"),
  Site = require("../scripts/run-site-browser.cjs"),
  evidence = require("./browser-suite-timings.json");
test("all 112 Adobe files and all 97 prior site commands remain scheduled exactly once", () => {
  assert.equal(Object.keys(evidence.adobe).length, 112);
  assert.equal(Object.keys(evidence.site).length, 97);
  for (const name of Object.keys(evidence.adobe))
    assert.ok(Adobe.suites().includes(name), name);
  for (const name of Object.keys(evidence.site))
    assert.ok(Site.suites().includes(name), name);
  for (const [group, rows] of [
    ["adobe", Adobe.suites()],
    ["site", Site.suites()],
  ])
    for (const count of [1, 2, 3, rows.length]) {
      const plan = P.plan(rows, count, P.weights(group));
      assert.ok(plan.every((g) => g.suites.length));
      assert.deepEqual(plan.flatMap((g) => g.suites).sort(), [...rows].sort());
      for (const g of plan)
        assert.deepEqual(
          g.suites,
          [...g.suites].sort((a, b) => rows.indexOf(a) - rows.indexOf(b)),
        );
    }
});
test("measured Adobe partition removes the recorded round-robin skew without dropping slow suites", () => {
  const seconds = P.weights("adobe"),
    rows = Adobe.suites().filter(name => Object.hasOwn(seconds, name)),
    old = Array.from({ length: 3 }, (_, i) =>
      rows
        .filter((_, n) => n % 3 === i)
        .reduce((sum, name) => sum + seconds[name], 0),
    ),
    now = P.plan(rows, 3, seconds).map((g) => g.seconds);
  assert.ok(Math.max(...old) - Math.min(...old) > 100);
  assert.ok(Math.max(...now) - Math.min(...now) < 5);
  assert.ok(Math.max(...now) < Math.max(...old));
  const site = P.plan(Object.keys(evidence.site), 3, P.weights("site"));
  assert.ok(Math.max(...site.map((g) => g.seconds)) < 200);
});
test("unmeasured new suites receive a median estimate, deterministic placement and no skipped coverage", () => {
  const rows = ["a", "b", "new", "c"],
    weights = { a: 20, b: 10, c: 4 },
    first = P.plan(rows, 3, weights);
  assert.deepEqual(P.plan(rows, 3, weights), first);
  assert.deepEqual(first.flatMap((g) => g.suites).sort(), rows.sort());
  assert.equal(
    first.reduce((sum, g) => sum + g.seconds, 0),
    44,
  );
  assert.throws(() => P.plan(["a", "a"], 2, weights));
  assert.throws(() => P.plan(["a"], 2, weights));
  assert.throws(() => P.select(["a"], "1/999", weights));
});
test("suite reports retain failed/incomplete evidence and the runner returns the actual failure", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "browser-suite-report-"));
  try {
    const report = path.join(dir, "results.json"),
      code = P.run(
        ["pass", "fail", "never"],
        { shard: "1/3", report },
        {
          group: "test",
          cwd: dir,
          command: (name) => [
            process.execPath,
            "-e",
            "process.exit(" + (name === "fail" ? 7 : 0) + ")",
          ],
        },
      );
    assert.equal(code, 7);
    const saved = JSON.parse(fs.readFileSync(report));
    assert.equal(saved.complete, false);
    assert.equal(saved.shard, "1/3");
    assert.deepEqual(
      saved.suites.map((row) => [row.suite, row.status, row.exitCode]),
      [
        ["pass", "passed", 0],
        ["fail", "failed", 7],
      ],
    );
    assert.ok(saved.suites.every((row) => row.durationMs >= 0));
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
test("both browser matrices stay independent, fail-fast disabled and required by aggregate workspace", () => {
  const workflow = fs.readFileSync(
    path.join(__dirname, "../.github/workflows/campaign-workspace-tests.yml"),
    "utf8",
  );
  for (const name of ["adobe", "browser"]) {
    const block = workflow
      .split("  " + name + ":\n")[1]
      .split(/\n  [a-z-]+:\n/)[0];
    assert.match(block, /fail-fast: false/);
    assert.match(block, /shard: \[1, 2, 3\]/);
    assert.match(workflow, new RegExp("    - " + name + "\\n"));
  }
  assert.match(workflow, /browser-status:[\s\S]*?name: Browser and navigation[\s\S]*?needs: browser/);
  assert.match(workflow, /test:site-browser -- --shard/);
  assert.match(workflow, /site-suite-timings\.json/);
  assert.match(workflow, /adobe-suite-timings\.json/);
  assert.match(workflow, /BROWSER_RESULT: \$\{\{ needs.browser.result \}\}/);
  assert.match(workflow, /"\$BROWSER_RESULT" != success/);
});
