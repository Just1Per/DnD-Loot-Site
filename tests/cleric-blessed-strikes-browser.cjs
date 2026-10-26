// Created Druid slots, Long Rest table rule and shared multiclass consumers.
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
      characters[0].level = 14;
      testSheetDocs["campaigns/a/characters/c1"] = { ...characters[0] };
      await openCharacterSheet("c1");
      const d = sheetSession.data;
      d.build = {
        ...d.build,
        edition: "2024",
        classId: "cleric",
        scoreMode: "final",
      };
      d.abilities.wis = 16;
      d.hpCurrent = 12;
      d.hpTemp = 4;
      d.adobe.classLevels = [{ classId: "cleric", level: 14 }];
      d.adobe.classFeatureChoices = { "keep:choice": ["saved"] };
      d.spells = ["Sacred Flame", "Toll the Dead", "Guidance"].map((name) => ({
        ...CharacterCatalog.spellRow(
          __testCatalog.spells.find(
            (s) => s.name === name && s.edition === "2024",
          ),
        ),
        classId: "cleric",
      }));
      renderCharacterSheet();
      selectSheetTab("builder");
    });
    await page
      .locator('[data-choice-group="blessed-strikes"]')
      .selectOption("potent-spellcasting");
    await page.evaluate(() => selectSheetTab("combat"));
    assert.match(
      await page.locator("[data-cleric-blessed-strikes]").innerText(),
      /\+3 damage/,
    );
    assert.equal(await page.evaluate(() => sheetSession.data.hpTemp), 4);
    await page.locator("[data-cleric-vitality] > summary").click();
    assert.equal(
      await page.locator("[data-vitality-apply]").isDisabled(),
      true,
    );
    // The catalogue id is the stored spell id, regardless of row serialization.
    const id = await page.evaluate(
      () =>
        __testCatalog.spells.find(
          (s) => s.name === "Sacred Flame" && s.edition === "2024",
        ).id,
    );
    await page.locator("[data-vitality-spell]").selectOption(id);
    assert.equal(
      await page.locator("[data-vitality-apply]").isDisabled(),
      true,
    );
    await page.locator("[data-vitality-confirmed]").check();
    await page.locator("[data-vitality-apply]").click();
    assert.equal(await page.evaluate(() => sheetSession.data.hpTemp), 6);
    assert.equal(await page.evaluate(() => sheetSession.data.hpCurrent), 12);
    assert.equal(
      await page.locator("[data-vitality-confirmed]").isChecked(),
      false,
    );
    assert.equal(
      await page.locator("[data-vitality-apply]").isDisabled(),
      true,
    );
    await page.locator("[data-vitality-confirmed]").check();
    await page.locator("[data-vitality-apply]").click();
    assert.equal(await page.evaluate(() => sheetSession.data.hpTemp), 6);
    await page.evaluate(() => {
      sheetSession.data.hpTemp = 20;
      renderCharacterSheet();
      selectSheetTab("combat");
    });
    await page.locator("[data-cleric-vitality] > summary").click();
    await page.locator("[data-vitality-spell]").selectOption(id);
    await page.locator("[data-vitality-confirmed]").check();
    await page.locator("[data-vitality-apply]").click();
    assert.equal(await page.evaluate(() => sheetSession.data.hpTemp), 20);
    await page.locator("[data-vitality-mode]").selectOption("replace");
    await page.locator("[data-vitality-confirmed]").check();
    await page.locator("[data-vitality-apply]").click();
    assert.equal(await page.evaluate(() => sheetSession.data.hpTemp), 6);
    await page.locator("[data-vitality-target]").selectOption("other");
    await page.locator("[data-vitality-confirmed]").check();
    const beforeOther = await page.evaluate(() =>
      JSON.stringify(sheetSession.data),
    );
    await page.locator("[data-vitality-apply]").click();
    assert.equal(
      await page.evaluate(() => JSON.stringify(sheetSession.data)),
      beforeOther,
    );
    assert.match(
      await page.locator("[data-vitality-feedback]").textContent(),
      /offer 6 temporary HP/,
    );
    await page.locator("#sheetSave").click();
    await page.waitForFunction(() => !sheetSession.dirty);
    await page.evaluate(async () => {
      closeCharacterSheet(true);
      await openCharacterSheet("c1");
      selectSheetTab("combat");
    });
    assert.equal(await page.evaluate(() => sheetSession.data.hpTemp), 6);
    assert.equal(
      await page.evaluate(
        () =>
          sheetSession.data.adobe.classFeatureChoices[
            "2024:cleric:blessed-strikes"
          ][0],
      ),
      "potent-spellcasting",
    );
    await page.locator("[data-cleric-vitality] > summary").click();
    await page.locator("[data-vitality-spell]").selectOption(id);
    await page.locator("[data-vitality-confirmed]").check();
    // Stale authentication cannot change HP through a retained control.
    await page.evaluate(() => {
      window.savedUid = auth.currentUser.uid;
      auth.currentUser.uid = "outsider";
    });
    const staleBefore = await page.evaluate(() =>
      JSON.stringify(sheetSession.data),
    );
    await page.locator("[data-vitality-apply]").click();
    assert.equal(
      await page.evaluate(() => JSON.stringify(sheetSession.data)),
      staleBefore,
    );
    await page.evaluate(() => {
      auth.currentUser.uid = savedUid;
      sheetSession.data.abilities.wis = 20;
      renderCharacterSheet();
      selectSheetTab("combat");
    });
    assert.match(
      await page.locator("[data-vitality-apply]").textContent(),
      /10 temporary HP/,
    );
    await page.evaluate(() => {
      sheetSession.data.abilities.wis = 6;
      renderCharacterSheet();
      selectSheetTab("combat");
    });
    assert.equal(
      await page.locator("[data-vitality-apply]").isDisabled(),
      true,
    );
    assert.match(
      await page.locator("[data-vitality-feedback]").textContent(),
      /no positive/,
    );
    await page.evaluate(() => {
      sheetSession.data.abilities.wis = 16;
      renderCharacterSheet();
      selectSheetTab("builder");
    });
    await page
      .locator('[data-choice-group="blessed-strikes"]')
      .selectOption("divine-strike");
    await page.evaluate(() => selectSheetTab("combat"));
    assert.equal(await page.locator("[data-cleric-vitality]").count(), 0);
    assert.match(
      await page.locator("[data-cleric-blessed-strikes]").innerText(),
      /2d8 Necrotic or Radiant/,
    );
    await page.evaluate(() => selectSheetTab("builder"));
    await page
      .locator('[data-choice-group="blessed-strikes"]')
      .selectOption("potent-spellcasting");
    await page.evaluate(() => selectSheetTab("combat"));
    await page.locator("[data-cleric-vitality] > summary").click();
    for (const width of [320, 390, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      assert.equal(
        await page.evaluate(() => {
          const el = document.querySelector("[data-cleric-blessed-strikes]");
          return el.scrollWidth <= el.clientWidth + 1;
        }),
        true,
      );
      await page.screenshot({
        path: out + "/cleric-blessed-strikes-" + width + ".png",
        fullPage: true,
      });
    }
    const a11y = await page.evaluate(
      async () =>
        (
          await axe.run(
            document.querySelector("[data-cleric-blessed-strikes]"),
            { rules: { "color-contrast": { enabled: false } } },
          )
        ).violations,
    );
    assert.deepEqual(a11y, []);
    assert.deepEqual(errors, []);
    console.log(
      "PASS Cleric choice, conditional vitality, live Wisdom, nonstacking/replace, other recipient privacy, save/reopen, stale auth, Divine upgrade, mobile and accessibility",
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
