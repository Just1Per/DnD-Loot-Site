"use strict";
const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path"),
  http = require("node:http"),
  { chromium } = require(process.env.PLAYWRIGHT_PATH || "playwright");
const app = fs.readFileSync(path.join(__dirname, "../js/app.js"), "utf8"),
  loader = app
    .slice(
      app.indexOf("/** Load one shared-scope"),
      app.indexOf("window.CampaignOptionalFeatures="),
    )
    .replaceAll("import.meta.url", "location.href");
(async () => {
  let release,
    timeout,
    timedOut = false;
  const seen = {},
    server = http.createServer(async (req, res) => {
      const name = new URL(req.url, "http://localhost").pathname;
      if (name === "/") {
        res.writeHead(200, { "Content-Type": "text/html" });
        return res.end(
          "<!doctype html><title>Optional feature network test</title>",
        );
      }
      seen[name] = (seen[name] || 0) + 1;
      if (name === "/first.js")
        await new Promise((resolve) => {
          release = resolve;
          timeout = setTimeout(() => {
            timedOut = true;
            resolve();
          }, 4000);
          if (seen["/second.js"] && seen["/third.js"]) {
            clearTimeout(timeout);
            resolve();
          }
        });
      if (seen["/second.js"] && seen["/third.js"] && release) {
        clearTimeout(timeout);
        release();
      }
      res.writeHead(200, {
        "Content-Type": "text/javascript",
        "Cache-Control": "public, max-age=3600",
      });
      res.end("window.executed.push(" + JSON.stringify(name) + ")");
    });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage(),
      url = "http://127.0.0.1:" + server.address().port + "/";
    await page.goto(url);
    await page.addScriptTag({
      content:
        'const ASSET_VERSION="network-test";window.executed=[];' +
        loader +
        ';window.optional=createOptionalFeatureLoader({sheet:["./first.js","./second.js","./third.js"]});',
    });
    assert.equal(
      seen["/first.js"],
      undefined,
      "No speculative tool download before explicit use",
    );
    await page.evaluate(() =>
      Promise.all([optional.ensure("sheet"), optional.ensure("sheet")]),
    );
    assert.equal(
      timedOut,
      false,
      "The first script must be released by overlapping peer downloads, not the watchdog",
    );
    assert.ok(
      seen["/second.js"] && seen["/third.js"],
      "Later files download while the first dependency is held",
    );
    assert.deepEqual(await page.evaluate(() => executed), [
      "/first.js",
      "/second.js",
      "/third.js",
    ]);
    for (const name of ["/first.js", "/second.js", "/third.js"])
      assert.equal(
        seen[name],
        1,
        "One HTTP download for concurrent opens: " + name,
      );
    await page.evaluate(() => optional.ensure("sheet"));
    assert.deepEqual(await page.evaluate(() => executed), [
      "/first.js",
      "/second.js",
      "/third.js",
    ]);
    await assert.rejects(
      page.evaluate(() => optional.ensure("unknown")),
      /Unknown character tool/,
    );
    await browser.close();
    console.log(
      "PASS real HTTP: no eager tools; overlapping optional downloads, strict execution order, concurrent/repeated reuse and unknown-tool rejection",
    );
  } finally {
    clearTimeout(timeout);
    release?.();
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
