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
      characters[0].level = 4;
      testSheetDocs["campaigns/a/characters/c1"] = { ...characters[0] };
      await openCharacterSheet("c1");
      const d = sheetSession.data;
      d.build = {
        ...d.build,
        edition: "2024",
        race: "human-2024",
        classId: "fighter",
        background: "custom",
        backgroundFeat: "Alert",
        humanOriginFeat: "",
        raceSize: "Small",
      };
      d.adobe.classLevels = [{ classId: "fighter", level: 4 }];
      d.abilities.str = 14;
      d.rulesChoices.feats = [];
      renderCharacterSheet();
      selectSheetTab("feats");
    });
    await page.waitForSelector('[data-build-feat-field="humanOriginFeat"]');
    assert.equal(
      await page.evaluate(
        () =>
          document
            .getElementById("catalogSelectedFeats")
            .compareDocumentPosition(
              document.getElementById("catalogBuildFeatChoices"),
            ) & Node.DOCUMENT_POSITION_FOLLOWING,
      ),
      4,
    );
    await page.locator('[data-build-feat-field="humanOriginFeat"]').selectOption('Arcane Artist');
    assert.match(await page.locator('[data-feat-key="origin-human"] h4').innerText(),/Arcane Artist/);
    await page.locator('#sheetSave').click();await page.waitForFunction(()=>!sheetSession.dirty);
    await page.evaluate(async()=>{closeCharacterSheet(true);await openCharacterSheet('c1');selectSheetTab('feats');});
    assert.equal(await page.locator('[data-build-feat-field="humanOriginFeat"]').inputValue(),'Arcane Artist');
    assert.match(await page.locator('[data-feat-key="origin-human"] h4').innerText(),/Arcane Artist/);
    await page
      .locator('[data-build-feat-field="humanOriginFeat"]')
      .selectOption("Tough");
    assert.match(
      await page.locator('[data-feat-key="origin-human"]').innerText(),
      /Tough/,
    );
    assert.match(
      await page.locator('[data-feat-key="origin-human"]').innerText(),
      /Race · Human Versatile/,
    );
    assert.match(
      await page.locator('[data-feat-key="origin-background"]').innerText(),
      /Alert/,
    );
    assert.equal(
      await page
        .locator('[data-build-feat-field="humanOriginFeat"]')
        .evaluate((el) => el === document.activeElement),
      true,
    );
    await page
      .locator('[data-feat-key="origin-human"] [data-selected-feat-info]')
      .click();
    assert.equal(
      await page.locator("#sheetFeatInformation").evaluate((el) => el.open),
      true,
    );
    assert.match(
      await page.locator("#sheetFeatInformation").innerText(),
      /Tough/,
    );
    await page.locator("#sheetFeatInformation header button").click();
    // An origin feat change immediately replaces the visible card, preserving background.
    await page
      .locator('[data-build-feat-field="humanOriginFeat"]')
      .selectOption("Lucky");
    assert.match(
      await page.locator('[data-feat-key="origin-human"] h4').innerText(),
      /Lucky/,
    );
    assert.equal(
      await page.locator('[data-feat-key="origin-background"]').count(),
      1,
    );
    await page.locator("#sheetSave").click();
    await page.waitForFunction(() => !sheetSession.dirty);
    await page.evaluate(async () => {
      closeCharacterSheet(true);
      await openCharacterSheet("c1");
      selectSheetTab("feats");
    });
    assert.match(
      await page.locator('[data-feat-key="origin-human"] h4').innerText(),
      /Lucky/,
    );
    assert.equal(
      await page.evaluate(() => sheetSession.data.build.raceSize),
      "Small",
    );
    await page.evaluate(() => selectSheetTab("builder"));
    assert.match(
      await page.locator("#sheetClassSkillEditorGroup > h4").innerText(),
      /Class Skill Proficiencies/i,
    );
    assert.match(
      await page.locator("#sheetSpeciesEditorGroup > h4").innerText(),
      /Race Skill Proficiencies/i,
    );
    assert.equal(
      await page.locator('[name="build.raceSize"]').getAttribute("type"),
      "hidden",
    );
    for (const name of [
      "build.standardLanguages.0",
      "build.extraLanguage",
      "build.backgroundLanguages.0",
    ])
      assert.equal(
        await page
          .locator('[name="' + name + '"]')
          .evaluate((el) => !!el.closest("#sheetRulesCharacterGroup")),
        true,
      );
    for (const width of [320, 390, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      await page
        .locator("#sheetSpeciesEditorGroup")
        .screenshot({ path: out + "/race-skill-choices-" + width + ".png" });
      await page
        .locator("#sheetClassSkillEditorGroup")
        .screenshot({ path: out + "/class-skill-choices-" + width + ".png" });
      await page.evaluate(() => selectSheetTab("feats"));
      assert.equal(
        await page
          .locator("#catalogSelectedFeats")
          .evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
        true,
      );
      await page
        .locator("#catalogSelectedFeats")
        .screenshot({ path: out + "/selected-feats-" + width + ".png" });
      await page.evaluate(() => selectSheetTab("builder"));
    }
    await page.evaluate(() => selectSheetTab("feats"));
    // A granted Skilled uses one set of training controls, not a phantom second copy.
    await page
      .locator('[data-build-feat-field="humanOriginFeat"]')
      .selectOption("Skilled");
    for (const [index, value] of [
      "skill:arcana",
      "skill:history",
      "tool:Flute",
    ].entries())
      await page
        .locator(
          '[data-build-feat-array="humanFeatChoices"][data-build-feat-index="' +
            index +
            '"]',
        )
        .selectOption(value);
    assert.equal(
      await page
        .locator('[data-feat-key="origin-human"] [data-feat-choice]')
        .count(),
      0,
    );
    assert.match(
      await page.locator('[data-feat-key="origin-human"]').innerText(),
      /Arcana.*History.*Flute/,
    );
    assert.deepEqual(
      await page.evaluate(
        () =>
          CharacterSheetModel.derive(sheetSession.data, 4).feats.reports.find(
            (r) => r.key === "origin-human",
          ).warnings,
      ),
      [],
    );
    await page
      .locator('[data-open-granted-training="humanFeatChoices"]')
      .click();
    assert.equal(
      await page
        .locator(
          '[data-build-feat-array="humanFeatChoices"][data-build-feat-index="0"]',
        )
        .evaluate((el) => el === document.activeElement),
      true,
    );
    await page
      .locator('[data-build-feat-field="humanOriginFeat"]')
      .selectOption("Lucky");
    // Class and catalogue selections share the same source-labelled reading shelf.
    await page.evaluate(() => {
      CharacterClassFeatureChoices.set(
        sheetSession.data,
        sheetSession.data.adobe.classLevels[0],
        "fighting-style",
        0,
        "archery",
      );
      sheetCatalogSignature = "";
      updateSheetCalculations();
    });
    assert.match(
      await page.locator("#catalogSelectedFeats").innerText(),
      /Class · Fighting Style/,
    );
    await page.locator("#catalogFeatSearch").fill("Athlete");
    const athlete = await page.evaluate(
      () =>
        CharacterCatalog.data.feats.find(
          (f) => f.name === "Athlete" && f.edition === "2024",
        ).id,
    );
    await page.locator('[data-add-catalog-feat="' + athlete + '"]').click();
    assert.equal(
      await page.locator('[data-feat-key="' + athlete + '"]').count(),
      1,
    );
    await page
      .locator('[data-feat-key="' + athlete + '"] [data-remove-feat]')
      .click();
    assert.equal(
      await page.locator('[data-feat-key="' + athlete + '"]').count(),
      0,
    );
    // Metadata-only references expose an intentional lookup, with edition/source context.
    const missing = await page.evaluate(() => {
      const f = CharacterCatalog.data.feats.find(
        (f) =>
          !f.description ||
          /consult the source|source reference only|complete rules/i.test(
            f.description,
          ),
      );
      openFeatInformation(f.id);
      return { id: f.id, name: f.name, edition: f.edition };
    });
    await page.locator("[data-feat-lookup]").click();
    assert.equal(
      await page.locator("#aiLookupName").inputValue(),
      missing.name,
    );
    assert.equal(
      await page.locator("#aiLookupEdition").inputValue(),
      missing.edition,
    );
    await page.evaluate(() => AiLookup.close?.());
    await page.evaluate(() => {
      const d = document.getElementById("aiLookupDialog");
      if (d?.open) d.close();
    });
    // Magic Initiate background variants with no exact adapter still appear as selected.
    await page.evaluate(() => {
      sheetSession.data.build.backgroundFeat = "Magic Initiate (Wizard)";
      sheetCatalogSignature = "";
      updateSheetCalculations();
      selectSheetTab("feats");
    });
    assert.match(
      await page.locator('[data-feat-key="origin-background"]').innerText(),
      /Magic Initiate \(Wizard\)/,
    );
    await page.locator("#sheetPrint").click();
    await page.locator("[data-print-none]").click();
    await page.locator('#sheetPrintDialog input[value="feats"]').check();
    await page.locator("[data-print-confirm]").click();
    const printed = await page
      .locator('[data-paper-section="feats"]')
      .textContent();
    assert.equal(
      await page.locator('[data-paper-section="feats"] select').count(),
      0,
    );
    assert.match(String(printed), /Magic Initiate/);
    assert.match(String(printed), /Human Versatile/);
    await page.emulateMedia({ media: "print" });
    await page.pdf({
      path: out + "/selected-feats.pdf",
      format: "A4",
      printBackground: true,
    });
    await page.emulateMedia({ media: "screen" });
    await page.evaluate(() => window.dispatchEvent(new Event("afterprint")));
    const a11y = await page.evaluate(
      async () =>
        (
          await axe.run(document.querySelector("#sheet-feats"), {
            rules: { "color-contrast": { enabled: false } },
          })
        ).violations,
    );
    assert.deepEqual(a11y, []);
    // Existing saves from the old double-control UI keep their choices.
    await page.evaluate(() => {
      const d = sheetSession.data;
      d.build.humanOriginFeat = "Skilled";
      d.build.humanFeatChoices = ["", "", ""];
      d.rulesChoices.effects["origin-human"] = {
        training: ["skill:arcana", "skill:history", "tool:Flute"],
      };
      d.build = CharacterSheetModel.normalize(d).build;
      renderCharacterSheet();
      selectSheetTab("feats");
    });
    assert.equal(
      await page
        .locator(
          '[data-build-feat-array="humanFeatChoices"][data-build-feat-index="2"]',
        )
        .inputValue(),
      "tool:Flute",
    );
    for (const index of [0, 1, 2])
      await page
        .locator(
          '[data-build-feat-array="humanFeatChoices"][data-build-feat-index="' +
            index +
            '"]',
        )
        .selectOption("");
    assert.deepEqual(
      await page.evaluate(
        () =>
          CharacterSheetModel.normalize(sheetSession.data).build
            .humanFeatChoices,
      ),
      ["", "", ""],
    );
    await page.locator("#sheetSave").click();
    await page.waitForFunction(() => !sheetSession.dirty);
    await page.evaluate(async () => {
      closeCharacterSheet(true);
      await openCharacterSheet("c1");
      selectSheetTab("feats");
    });
    assert.deepEqual(
      await page.evaluate(() => sheetSession.data.build.humanFeatChoices),
      ["", "", ""],
    );
    await page.evaluate(() => {
      sheetSession.data.build.edition = "2014";
      sheetSession.data.build.race = "variant-human";
      sheetSession.data.build.raceFeat = "Alert";
      sheetCatalogSignature = "";
      renderCharacterSheet();
      selectSheetTab("feats");
    });
    assert.match(
      await page.locator('[data-feat-key="variant"]').innerText(),
      /Alert/,
    );
    assert.match(
      await page.locator('[data-feat-key="variant"]').innerText(),
      /Race · Human.*Variant/,
    );
    assert.equal(
      await page.locator('[data-feat-key="origin-human"]').count(),
      0,
    );
    assert.deepEqual(errors, []);
    console.log(
      "PASS origin/background/selected-first feat cards, immediate source feedback, save/reopen, information/lookup context, origin variants in print, renamed compact training, retained hidden size, mobile and accessibility",
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
