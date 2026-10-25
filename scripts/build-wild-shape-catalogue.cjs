#!/usr/bin/env node
"use strict";
// Reproducible local subset of the attributed, pinned SRD monster catalogue. No network/publication.
const fs = require("node:fs"),
  path = require("node:path"),
  root = path.resolve(__dirname, ".."),
  source = require("../data/rules/monsters.json");
const elementals = new Set([
  "srd-2014-air-elemental",
  "srd-2014-earth-elemental",
  "srd-2014-fire-elemental",
  "srd-2014-water-elemental",
]);
const result = {
  schemaVersion: 1,
  sources: source.sources,
  records: source.records.filter(
    (row) =>
      row.data?.creatureType?.toLowerCase() === "beast" ||
      elementals.has(row.id),
  ),
};
fs.writeFileSync(
  path.join(root, "data/rules/wild-shapes-v1.json"),
  JSON.stringify(result) + "\n",
);
console.log(result.records.length + " attributed forms");
