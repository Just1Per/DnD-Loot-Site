"use strict";
// Real HTTP/cache/Chromium measurements. Authenticated stages use an isolated
// in-memory SDK, never production accounts. Public URL mode never signs in.
const fs = require("node:fs"),
  path = require("node:path"),
  http = require("node:http"),
  zlib = require("node:zlib"),
  { execFileSync } = require("node:child_process"),
  assert = require("node:assert/strict");
const { chromium } = require(process.env.PLAYWRIGHT_PATH || "playwright"),
  root = path.resolve(__dirname, "..");
function options(args) {
  const out = { runs: 3, latency: 80, cpu: 4 };
  for (let i = 0; i < args.length; i++) {
    const key = args[i];
    if (
      !["--runs", "--latency", "--cpu", "--out", "--app-ref", "--url"].includes(
        key,
      ) ||
      !args[i + 1]
    )
      throw Error(
        "Use --runs N --latency MS --cpu RATE --out FILE [--app-ref REF | --url PUBLIC_URL]",
      );
    out[key.slice(2)] = args[++i];
  }
  for (const key of ["runs", "latency", "cpu"]) {
    out[key] = Number(out[key]);
    if (
      !Number.isInteger(out[key]) ||
      out[key] < (key === "latency" ? 0 : 1) ||
      out[key] > (key === "runs" ? 10 : key === "cpu" ? 8 : 1000)
    )
      throw Error("Invalid " + key);
  }
  if (out.url) {
    const u = new URL(out.url);
    if (u.protocol !== "https:" || u.username || u.password || out["app-ref"])
      throw Error(
        "Public mode requires an HTTPS URL without credentials or --app-ref",
      );
  }
  return out;
}
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
function fixture() {
  return (
    read("tests/dom-setup.js") +
    read("tests/dom-fixture.js").split("// Retained Standard controls")[0] +
    `\n(()=>{const d=__DND_VAULT_DEPS__;window.loadingReads=[];
 d.collection=(_, ...p)=>p.join('/');d.doc=(_, ...p)=>p.join('/');d.where=(field,op,value)=>({field,op,value});d.query=(path,...filters)=>({path,filters});d.limit=value=>({limit:value});d.orderBy=()=>({});
 const snap=(key,data)=>({id:key.split('/').at(-1),exists:()=>data!==undefined,data:()=>structuredClone(data)});
 d.getDoc=async key=>{loadingReads.push(key);return snap(key,testSheetDocs[key]);};
 d.getDocs=async q=>{const p=typeof q==='string'?q:q.path;loadingReads.push(p);return {docs:Object.entries(testSheetDocs).filter(([key,row])=>key.startsWith(p+'/')&&!key.slice(p.length+1).includes('/')&&(q.filters||[]).every(f=>!f.field||(f.op==='array-contains'?row[f.field]?.includes(f.value):row[f.field]===f.value))).map(([key,row])=>snap(key,row))};};
 d.onSnapshot=()=>()=>{};d.ref=(_,p)=>p;d.getBlob=async()=>new Blob();d.uploadBytes=async()=>{};
 testSheetDocs={'users/player':{name:'Loading benchmark',email:'player@example.test',role:['player']},'users/player/campaigns/a':{status:'active',role:'player'},'campaigns/a':{name:'Benchmark campaign',ownerId:'dm',inventoryVersion:2},'campaigns/a/members/player':{status:'active',role:'player'},'campaigns/a/characters/c1':{name:'Benchmark fighter',class:'Fighter',level:4,userId:'player',active:true}};
 d.auth.currentUser=null;document.addEventListener('campaignatlas:ready',()=>window.loadingReady=performance.now(),{once:true});window.print=()=>{};
})();`
  );
}
async function serverFor(opts) {
  const app = (
    opts["app-ref"]
      ? execFileSync("git", ["show", opts["app-ref"] + ":js/app.js"], {
          cwd: root,
          encoding: "utf8",
        })
      : read("js/app.js")
  ).replace(
    /^import\s+\{([\s\S]*?)\}\s+from\s+["'][^"']+["'];/gm,
    "const {$1}=window.__DND_VAULT_DEPS__;",
  );
  const html = read("index.html")
    .replace(/<link\b[^>]*href="https?:[^>]*>/gi, "")
    .replace("<head>", '<head><script src="/__benchmark/setup.js"></script>');
  const cache = new Map(),
    server = http.createServer((req, res) => {
      try {
        const name = decodeURIComponent(
          new URL(req.url, "http://localhost").pathname,
        ).slice(1);
        let body, type;
        if (!name || name === "index.html") {
          body = html;
          type = "text/html";
        } else if (name === "js/app.js") {
          body = app;
          type = "text/javascript";
        } else if (name === "__benchmark/setup.js") {
          body = fixture();
          type = "text/javascript";
        } else {
          if (
            !/^(js|css|data|images|assets)\//.test(name) ||
            name.split("/").some((p) => p === ".." || p.startsWith("."))
          )
            throw Error("Not served");
          const file = path.resolve(root, name);
          if (!file.startsWith(root + path.sep) || !fs.statSync(file).isFile())
            throw Error("Not found");
          body = fs.readFileSync(file);
          type =
            {
              ".js": "text/javascript",
              ".css": "text/css",
              ".json": "application/json",
              ".svg": "image/svg+xml",
              ".png": "image/png",
              ".webp": "image/webp",
              ".jpg": "image/jpeg",
              ".ico": "image/x-icon",
            }[path.extname(file)] || "application/octet-stream";
        }
        let compressed = cache.get(name);
        if (!compressed) {
          compressed = zlib.gzipSync(body);
          cache.set(name, compressed);
        }
        res.writeHead(200, {
          "Content-Type": type,
          "Content-Encoding": "gzip",
          "Cache-Control":
            !name || name === "index.html"
              ? "no-store"
              : "public, max-age=3600",
          "Content-Length": compressed.length,
          "Content-Security-Policy":
            "default-src 'self' data: blob:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; font-src 'self' data:",
        });
        res.end(compressed);
      } catch {
        res.writeHead(404);
        res.end();
      }
    });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  return { server, url: "http://127.0.0.1:" + server.address().port + "/" };
}
async function measure(browser, url, opts, cache) {
  const context = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
      ignoreHTTPSErrors: !!opts.url,
    }),
    page = await context.newPage(),
    errors = [];
  page.setDefaultTimeout(60000);
  await page.addInitScript(() => {
    performance.setResourceTimingBufferSize(5000);
    document.addEventListener(
      "campaignatlas:ready",
      () => (window.loadingReady = performance.now()),
      { once: true },
    );
    document.addEventListener(
      "campaignatlas:failed",
      () => (window.loadingFailed = true),
      { once: true },
    );
  });
  page.on("pageerror", (e) => errors.push(e.message));
  const cdp = await context.newCDPSession(page);
  await cdp.send("Network.enable");
  await cdp.send("Network.emulateNetworkConditions", {
    offline: false,
    latency: opts.latency,
    downloadThroughput: 1.25 * 1024 * 1024,
    uploadThroughput: 1.25 * 1024 * 1024,
  });
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: opts.cpu });
  const stages = [];
  async function snapshot(name, started) {
    return page.evaluate(
      ({ name, started }) => {
        const rows = performance
          .getEntriesByType("resource")
          .filter((r) => r.startTime >= started);
        return {
          name,
          elapsedMs: Math.round(performance.now() - started),
          requests: rows.length,
          transferBytes: rows.reduce((s, r) => s + r.transferSize, 0),
          decodedBytes: rows.reduce((s, r) => s + r.decodedBodySize, 0),
          cacheHits: rows.filter(
            (r) => r.transferSize === 0 && r.decodedBodySize > 0,
          ).length,
          featureScripts: rows.filter((r) => r.name.includes("/js/modules/"))
            .length,
          catalogueRequests: rows
            .filter((r) =>
              /\/data\/rules\/(catalog|monsters)\.json/.test(r.name),
            )
            .map((r) => new URL(r.name).pathname),
          fixtureReads: window.loadingReads?.length || 0,
        };
      },
      { name, started },
    );
  }
  async function journey() {
    await page.waitForFunction(
      () => window.loadingReady || window.loadingFailed,
    );
    assert.equal(
      await page.evaluate(() => !!window.loadingFailed),
      false,
      "Runtime bootstrap must finish",
    );
    if (!opts.url)
      await page.waitForFunction(() => typeof testAuthCallback === "function");
    await page.waitForTimeout(100);
    stages.push(await snapshot("landing", 0));
    if (opts.url) return;
    let t = await page.evaluate(() => performance.now());
    await page.evaluate(() => {
      auth.currentUser = { uid: "player", email: "player@example.test" };
      return testAuthCallback(auth.currentUser);
    });
    assert.notEqual(
      await page.locator("#userDisplay").textContent(),
      "Failed to load account",
    );
    stages.push(await snapshot("login-fixture", t));
    t = await page.evaluate(() => performance.now());
    assert.equal(await page.evaluate(() => enterCampaign(campaigns[0])), true);
    stages.push(await snapshot("campaign-fixture", t));
    t = await page.evaluate(() => performance.now());
    await page.evaluate(() => openCharacterSheet("c1"));
    await page.waitForSelector("#characterSheetForm");
    await page.evaluate(() => CharacterAdobeView.ready());
    await page.waitForSelector(
      '#sheetAdobeView [data-continuous-page="page-1"] .paper',
    );
    stages.push(await snapshot("sheet-first-open", t));
    t = await page.evaluate(() => performance.now());
    await page.evaluate(async () => {
      closeCharacterSheet(true);
      await openCharacterSheet("c1");
      await CharacterAdobeView.ready();
    });
    stages.push(await snapshot("sheet-reopen", t));
    t = await page.evaluate(() => performance.now());
    await page.evaluate(async () => {
      closeCharacterSheet(true);
      showTab("library");
      await loadMagicItemLibrary();
    });
    stages.push(await snapshot("library-explicit-load-fixture", t));
    assert.equal(await page.evaluate(() => magicItemLibraryLoaded), true);
  }
  try {
    await page.goto(url, { waitUntil: "domcontentloaded" });
    await journey();
    if (cache) {
      stages.length = 0;
      if (!opts.url) await page.evaluate(() => localStorage.clear());
      await page.reload({ waitUntil: "domcontentloaded" });
      await journey();
    }
    if (!opts.url) {
      assert.deepEqual(errors, []);
      assert.ok(
        stages.slice(0, 3).every((s) => s.catalogueRequests.length === 0),
        "Catalogue JSON must stay deferred through login/campaign",
      );
    }
    return { cache: cache ? "warm-reload" : "cold", stages, errors };
  } finally {
    await context.close();
  }
}
async function main() {
  const opts = options(process.argv.slice(2)),
    local = opts.url ? null : await serverFor(opts);
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const runs = [];
    for (let i = 0; i < opts.runs; i++)
      for (const warm of [false, true]) {
        const result = await measure(
          browser,
          opts.url || local.url,
          opts,
          warm,
        );
        runs.push({ run: i + 1, ...result });
        console.error("Measured " + (i + 1) + " " + result.cache);
      }
    const report = {
      format: 1,
      measuredAt: new Date().toISOString(),
      commit: execFileSync("git", ["rev-parse", "HEAD"], {
        cwd: root,
        encoding: "utf8",
      }).trim(),
      appRef: opts["app-ref"] || "working-tree",
      mode: opts.url
        ? "public-anonymous-live"
        : "controlled-http-with-fixture-sdk",
      target: opts.url || "loopback HTTP",
      settings: {
        latencyMs: opts.latency,
        cpu: opts.cpu,
        throughputBytesPerSecond: 1.25 * 1024 * 1024,
        compression: opts.url ? "server-controlled" : "gzip",
      },
      limits: opts.url
        ? [
            "Anonymous landing only; no login, account creation or campaign writes. The isolated browser accepts the execution environment HTTPS proxy certificate.",
            "Cross-origin Performance API byte counts may be unavailable without Timing-Allow-Origin.",
          ]
        : [
            "Frontend assets use real HTTP and browser cache; login, campaign and Library backend responses use in-memory fixtures.",
            "No production authentication, App Check, Firestore, image latency or production speed guarantee. Library uses a tiny/empty synthetic catalogue.",
            "Warm results are reloads in the same context after a full identical journey; fixture navigation preferences are reset while HTTP cache is retained.",
          ],
      runs,
    };
    const text = JSON.stringify(report, null, 2) + "\n";
    if (opts.out) {
      fs.mkdirSync(path.dirname(path.resolve(opts.out)), { recursive: true });
      fs.writeFileSync(opts.out, text);
    } else process.stdout.write(text);
  } finally {
    await browser?.close();
    if (local) await new Promise((r) => local.server.close(r));
  }
}
if (require.main === module)
  main().catch((e) => {
    console.error(e);
    process.exitCode = 1;
  });
module.exports = { options };
