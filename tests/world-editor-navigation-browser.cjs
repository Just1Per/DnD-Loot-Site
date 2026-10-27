// Mobile World browsing and editing keep the same live draft and list context.
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

    await page.setViewportSize({ width: 390, height: 844 });
    await page.evaluate(async () => {
      auditSeed("dm");
      for (let i = 0; i < 12; i++)
        await CampaignWorkspace.store.save({
          campaignId: activeCampaign.id,
          kind: "world",
          id: "world-" + i,
          revision: 0,
          input: {
            title: "Harbor " + String(i).padStart(2, "0"),
            summary: "A coastal place.",
            content: "Description " + i,
            privateNotes: "SECRET " + i,
            data: { category: "Location" },
            archived: false,
          },
        });
      showTab("dm-world");
    });
    await page.waitForFunction(
      () =>
        CampaignWorkspace.session?.rowsLoaded &&
        !document.querySelector("[data-world-visibility]").disabled,
    );
    const list = page.locator("[data-workspace-list]"),
      editor = page.locator("[data-workspace-page]"),
      back = page.locator("[data-world-back]"),
      resume = page.locator("[data-world-resume]");
    assert.equal(
      await editor.isVisible(),
      false,
      "initial mobile view is the list",
    );
    await page.locator("[data-workspace-search]").fill("Harbor");
    await page.locator("[data-workspace-category]").selectOption("Location");
    await page.locator("[data-world-visibility]").selectOption("private");
    const row = page.locator('[data-open-record="world-7"]');
    await row.scrollIntoViewIfNeeded();
    const scroll = await list.evaluate((n) => n.scrollTop);
    await row.click();
    await page.waitForFunction(
      () => CampaignWorkspace.session.record?.id === "world-7",
    );
    assert.equal(await editor.isVisible(), true);
    assert.equal(await list.isVisible(), false);
    assert.equal(await back.isVisible(), true);
    assert.equal(
      await page.locator("[data-workspace-tools]").isVisible(),
      false,
    );
    await page.locator("[name=content]").fill("An unsaved description.");
    const draftBefore = await page.evaluate(() =>
      JSON.stringify(CampaignWorkspace.draft()),
    );
    await back.click();
    assert.equal(await list.isVisible(), true);
    assert.equal(await editor.isVisible(), false);
    assert.equal(
      await page.locator("[data-workspace-search]").inputValue(),
      "Harbor",
    );
    assert.equal(
      await page.locator("[data-workspace-category]").inputValue(),
      "Location",
    );
    assert.equal(
      await page.locator("[data-world-visibility]").inputValue(),
      "private",
    );
    assert.ok(
      Math.abs((await list.evaluate((n) => n.scrollTop)) - scroll) <= 1,
      "return restores list scrolling",
    );
    assert.match(await resume.textContent(), /Resume unsaved draft: Harbor 07/);
    await page.evaluate(() => {
      window.confirm = () => {
        throw Error("Returning to the same draft must not discard or prompt");
      };
    });
    await row.click();
    assert.equal(await editor.isVisible(), true);
    assert.equal(
      await page.locator("[name=content]").inputValue(),
      "An unsaved description.",
    );
    assert.equal(
      await page.evaluate(() => JSON.stringify(CampaignWorkspace.draft())),
      draftBefore,
    );
    await back.click();
    await resume.click();
    assert.equal(
      await page.locator("[name=content]").inputValue(),
      "An unsaved description.",
    );
    await page.locator("[data-save-record]").click();
    await page.waitForFunction(
      () => !CampaignWorkspace.session.busy && !CampaignWorkspace.session.dirty,
    );
    assert.match(
      await page.locator("[data-workspace-status]").textContent(),
      /saved/i,
    );
    await page.waitForFunction(
      () => !document.querySelector("[data-publish-world]").disabled,
    );
    await page.locator("[data-publish-world]").click();
    await page.waitForFunction(() =>
      document
        .querySelector("[data-sharing-status]")
        .textContent.includes("Published to players"),
    );
    assert.equal(
      await page.evaluate(
        () => testSheetDocs["campaigns/a/playerInformation/world-7"].content,
      ),
      "An unsaved description.",
    );
    assert.ok(
      !(await page.evaluate(() =>
        JSON.stringify(
          testSheetDocs["campaigns/a/playerInformation/world-7"],
        ).includes("SECRET"),
      )),
    );
    await back.click();
    await resume.click();
    await page.locator("[name=content]").fill("Still unsaved");
    await back.click();
    await page.evaluate(() => (window.confirm = () => false));
    await page
      .locator("[data-dm-workspace-select]")
      .selectOption("dm-chapters");
    assert.equal(await page.evaluate(() => AppShell.route), "dm-world");
    assert.match(await resume.textContent(), /Resume unsaved/);
    await resume.click();
    assert.equal(
      await page.locator("[name=content]").inputValue(),
      "Still unsaved",
    );
    await back.click();
    await page.evaluate(() => {
      window.confirm = () => true;
      const load = CampaignWorkspace.store.load;
      CampaignWorkspace.store.load = async (...args) => {
        if (args[2] === "world-8") throw Error("Temporary read failure");
        return load(...args);
      };
    });
    await page.locator('[data-open-record="world-8"]').click();
    await page.waitForFunction(() =>
      document
        .querySelector("[data-world-list-status]")
        ?.textContent.includes("Temporary read failure"),
    );
    assert.equal(
      await page.locator("[data-world-list-status]").isVisible(),
      true,
      "a failed read remains visible in the list",
    );
    for (const width of [320, 390, 760, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      if (width < 800) assert.equal(await editor.isVisible(), false);
      else assert.equal(await editor.isVisible(), true);
      if(width<800)await resume.click();
      assert.equal(await editor.isVisible(), true);
      assert.equal(await list.isVisible(), width === 1440);
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      );
      const violations = await page.evaluate(async () =>
        (
          await axe.run("#tab-dm-world", {
            runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa"] },
          })
        ).violations.map((v) => ({
          id: v.id,
          targets: v.nodes.map((n) => n.target),
        })),
      );
      assert.deepEqual(violations, []);
      await page.screenshot({
        path: out + "/world-editor-" + width + ".png",
        fullPage: false,
      });
      if (width < 800) {
        await back.click();
        await page.screenshot({
          path: out + "/world-list-" + width + ".png",
          fullPage: false,
        });
      }
    }
    await page.setViewportSize({ width: 390, height: 844 });
    if(await back.isVisible())await back.click();
    await page.locator("[data-new-record]").click();
    assert.equal(await editor.isVisible(), true);
    assert.equal(await page.locator("[name=title]").inputValue(), "");
    await page.locator("[name=title]").fill("New coast");
    await back.click();
    await resume.click();
    assert.equal(await page.locator("[name=title]").inputValue(), "New coast");
    await page.evaluate(() => {
      CampaignWorkspace.clear(true);
      auditSeed("player");
      showTab("dm-world");
    });
    assert.notEqual(await page.evaluate(() => AppShell.route), "dm-world");
    assert.deepEqual(errors, []);
    console.log(
      "PASS Mobile World list/editor panes, retained drafts/filter/scroll, save/publish/privacy, failed-read feedback, dirty guards, new drafts, desktop and responsive accessibility",
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
