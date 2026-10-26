// Grouped learned languages and source-correct revised Rogue choice.
const fs = require("node:fs"),
  path = require("node:path");
const { chromium } = require(process.env.PLAYWRIGHT_PATH || "playwright");
const root = path.resolve(__dirname, ".."),
  out =
    process.env.UI_OUTPUT_DIR ||
    require("node:os").tmpdir() + "/campaignatlas-ui-checks";
fs.mkdirSync(out, { recursive: true });
const assert = require("node:assert/strict");
const errors = [];
(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1000 },
    });
    page.setDefaultTimeout(7000);
    page.on("pageerror", (error) => errors.push(error.message));
    let html = fs
      .readFileSync(path.join(root, "index.html"), "utf8")
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<link\b[^>]*href="([^"]*)"[^>]*>/gi, (tag, href) =>
        href.startsWith("css/")
          ? '<style data-audit-file="' +
            href.split("?")[0] +
            '">' +
            fs.readFileSync(path.join(root, href.split("?")[0]), "utf8") +
            "\n/*# sourceURL=" +
            href.split("?")[0] +
            " */</style>"
          : tag,
      );
    await page.route("https://fixture.example.test/**", (route) => {
      const rel = new URL(route.request().url()).pathname.slice(1),
        file = path.join(root, rel);
      return route.fulfill(
        rel && fs.existsSync(file) && fs.statSync(file).isFile()
          ? { path: file }
          : { contentType: "text/html", body: html },
      );
    });
    await page.goto("https://fixture.example.test/", {
      waitUntil: "domcontentloaded",
    });
    await page.evaluate(
      (data) => {
        window.__testCatalog = data;
        window.print = () => {};
        window.fetch = async () => ({
          ok: true,
          json: async () => window.__testCatalog,
        });
        window.alert = (text) => {
          window.auditAlerts ||= [];
          auditAlerts.push(text);
        };
        window.confirm = () => true;
        window.prompt = () => "Sample note";
      },
      JSON.parse(fs.readFileSync(root + "/data/rules/catalog.json", "utf8")),
    );
    for (const file of ["dom-setup.js", "dom-fixture.js"])
      await page.addScriptTag({ path: root + "/tests/" + file });
    await page.evaluate(() => {
      const d = window.__DND_VAULT_DEPS__;
      d.where = (field, op, value) => ({ field, op, value });
      d.query = (path, ...filters) => ({ path, filters });
      d.getDocs = async (q) => {
        const p = typeof q === "string" ? q : q.path,
          f = q.filters || [];
        return {
          docs: Object.entries(testSheetDocs)
            .filter(
              ([key, data]) =>
                key.startsWith(p + "/") &&
                !key.slice(p.length + 1).includes("/") &&
                f.every((f) => {
                  const v = f.field.split(".").reduce((d, k) => d?.[k], data);
                  return f.op === "array-contains"
                    ? v?.includes(f.value)
                    : v === f.value;
                }),
            )
            .map(([key, data]) => ({
              id: key.split("/").at(-1),
              data: () => structuredClone(data),
            })),
        };
      };
      d.ref = (_, p) => p;
      d.getBlob = async () => new Blob();
      d.uploadBytes = async () => {};
    });
    await page.evaluate(() => {
      const sdk = window.__DND_VAULT_DEPS__,
        original = sdk.runTransaction;
      window.journalWatchers = [];
      window.failJournalWrite = false;
      sdk.runTransaction = async (...args) => {
        if (window.failJournalWrite) throw Error("Simulated save failure");
        return original(...args);
      };
      sdk.onSnapshot = (path, next, error) => {
        const watch = { path, next, error, active: true };
        journalWatchers.push(watch);
        return () => {
          watch.active = false;
        };
      };
    });
    await page.evaluate(() => {
      const sdk = __DND_VAULT_DEPS__,
        read = sdk.getDocs;
      window.recapReads = [];
      sdk.getDocs = async (q) => {
        const p = typeof q === "string" ? q : q.path;
        recapReads.push(p);
        if (window.failRecapRead === p) {
          failRecapRead = null;
          throw Error("Temporary journal connection failure");
        }
        return read(q);
      };
    });
    await page.addScriptTag({
      content:
        "function createCampaignStore(){return window.__DND_VAULT_DEPS__.vaultCall}",
    });
    const modules = JSON.parse(
      fs
        .readFileSync(root + "/tests/dom.cjs", "utf8")
        .match(/for\(const name of (\[[^\n]+?\])\)await run/)[1]
        .replaceAll("'", '"'),
    );
    for (const name of modules)
      await page.addScriptTag({ path: root + "/js/modules/" + name + ".js" });
    await page.evaluate(() => {
      CharacterCatalog.set(__testCatalog);
      document.getElementById("siteBootPanel")?.remove();
    });
    await page.addScriptTag({ path: root + "/tests/dom-state.js" });
    await page.evaluate(
      (data) => {
        window.__testMonsters = data;
        window.fetch = async (u) => ({
          ok: true,
          json: async () =>
            String(u).includes("monsters.json")
              ? __testMonsters
              : __testCatalog,
        });
        window.auditSeed = (role) => {
          closeCharacterSheet(true);
          CampaignWorkspace.clear(true);
          SiteHelp.onLogout();
          seed(role, role === "other" ? "player" : role);
          document.getElementById("loginControls").style.display = "none";
          document.getElementById("logoutButton").style.display =
            "inline-block";
          document.getElementById("adminTab").style.display =
            role === "admin" ? "inline-block" : "none";
          document.getElementById("userDisplay").textContent = "Sample " + role;
          document.getElementById("activeCampaignName").textContent =
            activeCampaign.name;
          renderDMTools();
          SiteHelp.onLogin();
        };
      },
      JSON.parse(fs.readFileSync(root + "/data/rules/monsters.json", "utf8")),
    );
    await page.addScriptTag({
      path: require.resolve(process.env.AXE_PATH || "axe-core/axe.min.js"),
    });

    await page.evaluate(
      (data) => {
        window.__testWildShapes = data;
        const read = window.fetch;
        window.fetch = async (url, ...args) =>
          String(url).includes("wild-shapes")
            ? { ok: true, json: async () => __testWildShapes }
            : read(url, ...args);
      },
      JSON.parse(
        fs.readFileSync(root + "/data/rules/wild-shapes-v1.json", "utf8"),
      ),
    );
    await page.evaluate(() => {
      auditSeed("dm");
      showTab("dm-world");
      SiteHelp.hide();
      document.activeElement?.blur();
    });
    await page.waitForFunction(
      () =>
        CampaignWorkspace.session?.kind === "world" &&
        document.querySelector("[data-workspace-category]"),
    );
    const nav = page.locator("#dmWorkspaceSidebar"),
      select = page.locator("[data-dm-workspace-select]");
    assert.equal(await select.isVisible(), false);
    assert.equal(await nav.locator(":scope > button:visible").count(), 7);
    for (const width of [320, 390, 760]) {
      await page.setViewportSize({ width, height: 1000 });
      assert.equal(await select.isVisible(), true);
      assert.equal(await nav.locator("button:visible").count(), 0);
      assert.equal(await select.inputValue(), "dm-world");
      assert.ok(
        (await nav.boundingBox()).height < 115,
        "Compact section switcher should not take several rows",
      );
      assert.equal(
        await nav.evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
        true,
      );
      assert.equal(
        await page.locator("[data-world-category]").count(),
        0,
        "World has one category filter",
      );
      assert.equal(
        await page.locator("#tab-dm-world [data-workspace-category]").count(),
        1,
      );
      assert.match(
        await page
          .locator("[data-workspace-category] option:checked")
          .innerText(),
        /All categories \(0\)/,
      );
      await page.evaluate(() => {
        SiteHelp.hide();
        document.activeElement?.blur();
      });
      await page.mouse.move(0, 0);
      await page.screenshot({
        path: out + "/dm-navigation-after-" + width + ".png",
        fullPage: true,
      });
    }
    await page.setViewportSize({ width: 390, height: 1000 });
    await select.selectOption("dm-chapters");
    await page.waitForFunction(
      () =>
        AppShell.route === "dm-chapters" &&
        CampaignWorkspace.session?.kind === "chapter",
    );
    assert.equal(await select.inputValue(), "dm-chapters");
    await page.locator("[data-new-record]").click();
    await page.locator("[name=title]").fill("Unfinished chapter");
    await page.evaluate(() => (window.confirm = () => false));
    await select.selectOption("dm-world");
    assert.equal(await page.evaluate(() => AppShell.route), "dm-chapters");
    assert.equal(
      await select.inputValue(),
      "dm-chapters",
      "Canceled navigation keeps the selector on the actual page",
    );
    assert.equal(
      await page.locator("[name=title]").inputValue(),
      "Unfinished chapter",
    );
    await page.evaluate(() => (window.confirm = () => true));
    await select.selectOption("dm-world");
    await page.waitForFunction(
      () =>
        AppShell.route === "dm-world" &&
        CampaignWorkspace.session?.kind === "world",
    );
    await page.locator("[data-workspace-category]").selectOption("Region");
    assert.match(
      await page.locator("[data-new-record]").innerText(),
      /region/i,
    );
    await page.setViewportSize({ width: 1440, height: 1000 });
    assert.equal(await select.isVisible(), false);
    assert.equal(await nav.locator(":scope > button:visible").count(), 7);
    assert.equal(
      await nav
        .locator("[data-dm-workspace-tab=dm-world]")
        .getAttribute("aria-current"),
      "page",
    );
    const a11y = await page.evaluate(
      async () =>
        (
          await axe.run(document.querySelector("#dmWorkspaceSidebar"), {
            runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa"] },
          })
        ).violations,
    );
    assert.deepEqual(a11y, []);
    await page.evaluate(() => {
      CampaignWorkspace.clear(true);
      auditSeed("player");
      showTab("campaign-information");
    });
    assert.equal(await nav.isVisible(), false);
    assert.equal(
      await page.evaluate(() => {
        const s = document.querySelector("[data-dm-workspace-select]"),
          before = AppShell.route;
        s.value = "dm-world";
        s.onchange();
        return AppShell.route === before;
      }),
      true,
      "A stale navigation handler cannot open DM pages for a player",
    );
    assert.deepEqual(errors, []);
    console.log(
      "PASS compact DM navigation at 320/390/760, desktop sidebar, route synchronization, canceled draft protection, one counted World category filter, player/stale protection and accessibility",
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
