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
    await page.evaluate(async () => {
      auditSeed("player");
      characters[0].level = 1;
      testSheetDocs["campaigns/a/characters/c1"] = { ...characters[0] };
      await openCharacterSheet("c1");
      const d = sheetSession.data;
      d.build = {
        ...d.build,
        edition: "2024",
        classId: "fighter",
        standardLanguages: ["Elvish", "Orc"],
        scoreMode: "final",
      };
      d.languages = "Local hand signs";
      d.adobe.classLevels = [{ classId: "fighter", level: 1 }];
      d.adobe.classFeatureChoices = {};
      renderCharacterSheet();
      selectSheetTab("builder");
    });
    const host = page.locator("#sheetLearnedLanguages");
    assert.equal(
      await page
        .locator('[name="build.standardLanguages.0"] option[value=Abyssal]')
        .count(),
      0,
    );
    for (const language of [
      "Abyssal",
      "Celestial",
      "Deep Speech",
      "Infernal",
      "Sylvan",
      "Undercommon",
    ])
      assert.equal(
        await host
          .locator("[data-learned-language] option")
          .filter({ hasText: new RegExp("^" + language + "$") })
          .count(),
        1,
      );
    await host.locator("[data-learned-language]").selectOption("Abyssal");
    await host.locator("[data-language-add]").click();
    assert.equal(
      await page.evaluate(() => sheetSession.data.languages),
      "Local hand signs\nAbyssal",
    );
    assert.match(
      await page.locator("#sheetOverviewReadout").innerText(),
      /Abyssal/,
    );
    await host.locator("[data-learned-language]").selectOption("Celestial");
    await host.locator("[data-language-add]").click();
    assert.equal(await host.locator("[data-language-remove]").count(), 2);
    await host.locator("summary").click();
    await host
      .locator("textarea[name=languages]")
      .fill("Local hand signs\nAbyssal\nCelestial\nCustom tongue");
    await host.locator("textarea[name=languages]").press("End");
    await host.locator("textarea[name=languages]").pressSequentially(" notes");
    assert.match(
      await host.locator("textarea[name=languages]").inputValue(),
      /Custom tongue notes$/,
    );
    await host.locator("textarea[name=languages]").blur();
    await page.evaluate(async () => {
      await saveCharacterSheet();
      closeCharacterSheet(true);
      await openCharacterSheet("c1");
      selectSheetTab("builder");
    });
    assert.match(
      await page.evaluate(() => sheetSession.data.languages),
      /Custom tongue notes/,
    );
    await host.locator('[data-language-remove="Abyssal"]').click();
    assert.equal(
      await page.evaluate(() =>
        sheetSession.data.languages.includes("Abyssal"),
      ),
      false,
    );
    assert.match(
      await page.evaluate(() => sheetSession.data.languages),
      /Custom tongue notes/,
    );
    // The revised Rogue has one additional language, including a Rare table choice.
    await page.evaluate(() => {
      sheetSession.data.build.classId = "rogue";
      sheetSession.data.adobe.classLevels = [{ classId: "rogue", level: 1 }];
      renderCharacterSheet();
      selectSheetTab("builder");
    });
    assert.equal(await host.locator("[data-rogue-language]").count(), 1);
    assert.equal(
      await host
        .locator("[data-rogue-language]")
        .evaluate(
          (el) => !!el.closest("label").querySelector(".sheet-required-marker"),
        ),
      true,
    );
    await host.locator("[data-rogue-language]").selectOption("Abyssal");
    assert.equal(
      await host
        .locator("[data-rogue-language]")
        .evaluate(
          (el) => !!el.closest("label").querySelector(".sheet-required-marker"),
        ),
      false,
    );
    assert.equal(
      await page.evaluate(
        () =>
          CharacterSheetModel.derive(
            sheetSession.data,
            1,
          ).effects.languages.filter((l) => l === "Abyssal").length,
      ),
      1,
    );
    await page.evaluate(async () => {
      await saveCharacterSheet();
      closeCharacterSheet(true);
      await openCharacterSheet("c1");
      selectSheetTab("builder");
    });
    assert.equal(
      await host.locator("[data-rogue-language]").inputValue(),
      "Abyssal",
    );
    const printed = await page.evaluate(() => {
      CharacterSheetPrint.prepare(new Set(["builder"]));
      const text = document.querySelector(
        "[data-paper-section=builder]",
      ).textContent;
      CharacterSheetPrint.clear();
      return text;
    });
    assert.match(printed, /Abyssal/);
    assert.match(printed, /Celestial/);
    assert.match(printed, /Custom tongue notes/);
    assert.equal(
      await page.evaluate(() => {
        const b = document.querySelector("[data-language-remove=Celestial]"),
          before = JSON.stringify(sheetSession.data),
          uid = auth.currentUser.uid;
        auth.currentUser.uid = "other";
        b.onclick();
        auth.currentUser.uid = uid;
        return before === JSON.stringify(sheetSession.data);
      }),
      true,
    );
    assert.match(
      await page.evaluate(() =>
        SiteHelp.explain(document.querySelector("[data-learned-language]")),
      ),
      /Abyssal/,
    );
    assert.match(
      await page.evaluate(() =>
        SiteHelp.explain(
          document.querySelector('[name="build.standardLanguages.0"]'),
        ),
      ),
      /Standard/,
    );
    await page.evaluate(() => {
      sheetSession.data.build.edition = "2014";
      renderCharacterSheet();
      selectSheetTab("builder");
    });
    assert.equal(await host.locator("[data-rogue-language]").count(), 0);
    assert.equal(
      await host.locator("[data-language-remove=Celestial]").count(),
      1,
    );
    await page.evaluate(() => {
      sheetSession.data.build.edition = "2024";
      renderCharacterSheet();
      selectSheetTab("builder");
    });
    assert.equal(
      await host.locator("[data-rogue-language]").inputValue(),
      "Abyssal",
    );
    await page.evaluate(() => {
      SiteHelp.hide();
      document.activeElement?.blur();
    });
    await page.mouse.move(0, 0);
    for (const width of [320, 390, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      await host.scrollIntoViewIfNeeded();
      assert.equal(
        await host.evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
        true,
      );
      await host.screenshot({
        path: out + "/character-languages-" + width + ".png",
      });
    }
    const a11y = await page.evaluate(
      async () =>
        (
          await axe.run(document.querySelector("#sheetLearnedLanguages"), {
            rules: { "color-contrast": { enabled: false } },
          })
        ).violations,
    );
    assert.deepEqual(a11y, []);
    assert.deepEqual(errors, []);
    console.log(
      "PASS Abyssal/rare choices, add/remove/deduplicate, custom typing preserved, Rogue source choice and exact warning, save/reopen, source switches, stale auth, guide/print, mobile and accessibility",
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
