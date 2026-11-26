"use strict";
const fs = require("node:fs"),
  path = require("node:path"),
  P = require("./browser-suite-plan.cjs"),
  { options } = require("./run-adobe-connected.cjs"),
  root = path.resolve(__dirname, ".."),
  tests = path.join(root, "tests");
function suites() {
  const rows = JSON.parse(
      fs.readFileSync(path.join(tests, "site-browser-suites.json"), "utf8"),
    ).scripts,
    scripts = JSON.parse(
      fs.readFileSync(path.join(tests, "package.json"), "utf8"),
    ).scripts;
  if (
    !Array.isArray(rows) ||
    !rows.length ||
    new Set(rows).size !== rows.length ||
    rows.some((name) => !/^test:[-a-z0-9]+$/.test(name) || !scripts[name])
  )
    throw Error("Invalid site browser suite manifest");
  return rows;
}
function run(args) {
  const opts = options(args),
    rows = P.select(suites(), opts.shard, P.weights("site"));
  if (opts.list) {
    console.log(JSON.stringify(rows, null, 2));
    return 0;
  }
  return P.run(rows, opts, {
    group: "Site",
    cwd: root,
    command: (name) => [
      process.execPath,
      path.join(root, "scripts/test-profiles.cjs"),
      "run",
      "browser",
      "--",
      "npm",
      "--prefix",
      tests,
      "run",
      name,
    ],
  });
}
if (require.main === module)
  try {
    process.exitCode = run(process.argv.slice(2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
module.exports = { suites, run };
