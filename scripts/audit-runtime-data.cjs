"use strict";
// Read-only footprint/loader inventory. A shared-scope reference graph is not an
// unused-file detector; no catalogue records, recovery inputs or assets are removed.
const fs = require("node:fs"),
  path = require("node:path"),
  zlib = require("node:zlib"),
  crypto = require("node:crypto"),
  { execFileSync } = require("node:child_process"),
  root = path.resolve(__dirname, "..");
function audit() {
  const app = fs.readFileSync(path.join(root, "js/app.js"), "utf8"),
    mandatory = JSON.parse(
      app.match(/const FEATURE_FILES = (\[[\s\S]*?\]);/)[1],
    ).map((p) => "js/" + p.slice(2)),
    optional = [
      ...app
        .slice(
          app.indexOf("window.CampaignOptionalFeatures="),
          app.indexOf("// Preload downloads"),
        )
        .matchAll(/"\.\/(modules\/[^"]+\.js)"/g),
    ].map((m) => "js/" + m[1]);
  const files = execFileSync("git", ["ls-files", "js/modules", "data/rules"], {
      cwd: root,
      encoding: "utf8",
    })
      .trim()
      .split("\n")
      .filter((p) => /\.(js|json)$/.test(p)),
    rows = files.map((file) => {
      const bytes = fs.readFileSync(path.join(root, file));
      return {
        file,
        bytes: bytes.length,
        gzipBytes: zlib.gzipSync(bytes).length,
        sha256: crypto.createHash("sha256").update(bytes).digest("hex"),
        loader: mandatory.includes(file)
          ? "startup-script"
          : optional.includes(file)
            ? "optional-script"
            : "data-or-transitive-reference",
      };
    }),
    same = new Map();
  for (const row of rows.filter((r) => r.bytes > 1024)) {
    const group = same.get(row.sha256) || [];
    group.push(row.file);
    same.set(row.sha256, group);
  }
  const catalog = JSON.parse(
    fs.readFileSync(path.join(root, "data/rules/catalog.json"), "utf8"),
  );
  return {
    format: 1,
    measuredAt: new Date().toISOString(),
    commit: execFileSync("git", ["rev-parse", "HEAD"], {
      cwd: root,
      encoding: "utf8",
    }).trim(),
    scope:
      "Tracked JS modules and rules JSON; loader membership is static, not proof of reachability or obsolescence.",
    startup: {
      scripts: mandatory.length,
      bytes: rows
        .filter((r) => r.loader === "startup-script")
        .reduce((s, r) => s + r.bytes, 0),
      gzipBytes: rows
        .filter((r) => r.loader === "startup-script")
        .reduce((s, r) => s + r.gzipBytes, 0),
    },
    optional: {
      scripts: new Set(optional).size,
      bytes: rows
        .filter((r) => r.loader === "optional-script")
        .reduce((s, r) => s + r.bytes, 0),
    },
    catalogue: {
      spells: catalog.spells.length,
      feats: catalog.feats.length,
      editions: [
        ...new Set([...catalog.spells, ...catalog.feats].map((r) => r.edition)),
      ],
      sha256: rows.find((r) => r.file === "data/rules/catalog.json").sha256,
    },
    byteIdenticalGroups: [...same.values()].filter((g) => g.length > 1),
    largest: rows.sort((a, b) => b.bytes - a.bytes).slice(0, 25),
  };
}
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length && !(args.length === 2 && args[0] === "--out"))
    throw Error("Use [--out FILE]");
  const text = JSON.stringify(audit(), null, 2) + "\n";
  if (args.length) {
    fs.mkdirSync(path.dirname(path.resolve(args[1])), { recursive: true });
    fs.writeFileSync(args[1], text);
  } else process.stdout.write(text);
}
module.exports = { audit };
