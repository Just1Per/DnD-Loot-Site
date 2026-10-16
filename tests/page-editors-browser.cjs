// Page editors against the real application markup and a deterministic Firebase fixture.
// No production credentials or network calls are used.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const {chromium} = require(process.env.PLAYWRIGHT_PATH || 'playwright');

const root = path.resolve(__dirname, '..');
const out=require('node:os').tmpdir()+'/campaignatlas-ui-checks';fs.mkdirSync(out,{recursive:true});
const wcag = {runOnly: {type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa']}};

(async () => {
  const browser = await chromium.launch({headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE});
  try {
    const page = await browser.newPage({viewport: {width: 1440, height: 1000}});
    page.setDefaultTimeout(7000);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8')
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<link\b[^>]*href="([^"]*)"[^>]*>/gi, (_tag, href) => href.startsWith('css/')
        ? '<style>' + fs.readFileSync(path.join(root, href.split('?')[0]), 'utf8') + '</style>' : '');
    if (!fs.readFileSync(path.join(root, 'index.html'), 'utf8').includes('css/page-editors.css')) {
      html = html.replace('</head>', '<style>' + fs.readFileSync(path.join(root, 'css/page-editors.css'), 'utf8') + '</style></head>');
    }
    await page.route('https://fixture.example.test/**', route => route.fulfill({contentType: 'text/html', body: html}));
    await page.goto('https://fixture.example.test/');
    await page.evaluate(catalog => {
      window.__testCatalog = catalog;
      window.fetch = async () => ({ok: true, json: async () => __testCatalog});
      window.print = () => {};
      window.confirm = () => true;
    }, JSON.parse(fs.readFileSync(path.join(root, 'data/rules/catalog.json'), 'utf8')));
    for (const file of ['dom-setup.js', 'dom-fixture.js']) {
      await page.addScriptTag({path: path.join(__dirname, file)});
    }
    // Install SDK failures before core.js captures the dependency functions.
    await page.evaluate(() => {
      const sdk = window.__DND_VAULT_DEPS__;
      window.pageEditorWrites = [];
      window.pageEditorAttempts = [];
      window.pageEditorFailures = {};
      window.pageEditorPauses = {};
      window.pageEditorResolvers = {};
      window.pageEditorGeneratedIds = 0;
      window.pageEditorAddCalls = 0;
      const documentPath = ref => typeof ref === 'string' ? ref : ref.path;
      sdk.doc = (base, ...parts) => {
        if (typeof base === 'string' && !parts.length) {
          const id = 'setup-' + (++pageEditorGeneratedIds);
          return {id, path: base + '/' + id};
        }
        return [...(typeof base === 'string' ? [base] : []), ...parts].join('/');
      };
      const write = async (ref, data, options = {}) => {
        const document = documentPath(ref);
        const stage = /^campaigns\/[^/]+$/.test(document) ? 'root'
          : /^campaigns\/[^/]+\/members\//.test(document) ? 'member'
          : /^users\/[^/]+\/campaigns\//.test(document) ? 'index' : 'other';
        const attempt = {path: document, data: structuredClone(data), actor: sdk.auth.currentUser?.uid, stage};
        pageEditorAttempts.push(attempt);
        if (pageEditorPauses[stage]) {
          pageEditorPauses[stage] = false;
          await new Promise(resolve => { pageEditorResolvers[stage] = resolve; });
        }
        if (pageEditorFailures[stage]) {
          pageEditorFailures[stage]--;
          throw Error('Simulated ' + stage + ' write failure');
        }
        testSheetDocs[document] = options.merge
          ? {...testSheetDocs[document], ...structuredClone(data)} : structuredClone(data);
        pageEditorWrites.push(attempt);
        testWrites.push({path: document, data: structuredClone(data)});
      };
      sdk.ref=(_storage,path)=>path;
      sdk.uploadBytes=async()=>{if(window.pauseItemUpload){window.pauseItemUpload=false;await new Promise(resolve=>window.finishItemUpload=resolve);}};
      sdk.getDownloadURL=async()=> 'https://images.example.test/uploaded.png';
      const vault=sdk.vaultCall;
      sdk.vaultCall=async(name,data)=>{if(name==='vaultSaveCampaignItem'&&window.pauseItemSave){window.pauseItemSave=false;await new Promise(resolve=>window.finishItemSave=resolve);}return vault(name,data);};
      sdk.setDoc = write;
      sdk.updateDoc = (ref, data) => write(ref, data, {merge: true});
      sdk.addDoc = async (collection, data) => {
        pageEditorAddCalls++;
        const ref = sdk.doc(collection);
        await write(ref, data);
        return ref;
      };
      sdk.getDoc = async ref => {
        const document = documentPath(ref);
        return {id: document.split('/').at(-1), exists: () => !!testSheetDocs[document], data: () => structuredClone(testSheetDocs[document])};
      };
      sdk.query = (collection, ...filters) => ({path: collection, filters});
      sdk.where = (field, op, value) => ({field, op, value});
      sdk.getDocs = async query => {
        const collection = typeof query === 'string' ? query : query.path;
        const filters = (query.filters || []).filter(row => row?.field);
        return {docs: Object.entries(testSheetDocs).filter(([key, data]) =>
          key.startsWith(collection + '/') && !key.slice(collection.length + 1).includes('/') &&
          filters.every(filter => {
            const value = filter.field.split('.').reduce((row, key) => row?.[key], data);
            return filter.op === 'array-contains' ? value?.includes(filter.value) : value === filter.value;
          })).map(([key, data]) => ({id: key.split('/').at(-1), data: () => structuredClone(data)}))};
      };
    });
    await page.addScriptTag({content: 'function createCampaignStore(){return window.__DND_VAULT_DEPS__.vaultCall}'});
    const modules = JSON.parse(fs.readFileSync(path.join(__dirname, 'dom.cjs'), 'utf8')
      .match(/for\(const name of (\[[^\n]+?\])\)await run/)[1].replaceAll("'", '"'));
    for (const name of modules) {
      await page.addScriptTag({path: path.join(root, 'js/modules', name + '.js')});
    }
    await page.evaluate(() => {
      CharacterCatalog.set(__testCatalog);
      PageEditors.ensure();
      document.getElementById('siteBootPanel')?.remove();
    });
    await page.addScriptTag({path: path.join(__dirname, 'dom-state.js')});
    await page.addScriptTag({path: require.resolve(process.env.AXE_PATH || 'axe-core/axe.min.js')});

    const visible = selector => page.locator(selector).isVisible();
    const guard = () => page.locator('#pageEditorLeaveDialog');
    const itemEdit = () => page.locator('#card-container [data-item-id="potion"] .edit-button');
    async function reset(role = 'dm', membership = role) {
      await page.evaluate(({role, membership}) => {
        PageEditors.clear();
        testFailWrite = false;
        pageEditorFailures = {};
        pageEditorPauses = {};
        pageEditorResolvers = {};
        seed(role, membership);
        document.getElementById('loginControls').style.display = 'none';
        document.getElementById('logoutButton').style.display = 'inline-block';
        document.getElementById('userDisplay').textContent = 'Test ' + role;
        showTab('library');
      }, {role, membership});
    }
    async function dashboard(role = 'dm') {
      await reset(role);
      await page.evaluate(() => {
        activeCampaign = null;
        activeMembershipRole = null;
        campaigns = [];
        hideAllScreens();
        showCampaignSelector();
      });
    }
    async function accessible(selector) {
      const violations = await page.evaluate(async ({selector, options}) => {
        const result = await axe.run(selector, options);
        return result.violations.map(row => ({id: row.id, targets: row.nodes.map(node => node.target)}));
      }, {selector, options: wcag});
      assert.deepEqual(violations, [], selector + ' must pass automated WCAG checks');
    }
    async function mobile(selector) {
      for (const width of [320, 390]) {
        await page.setViewportSize({width, height: 844});
        assert.equal(await visible(selector), true, selector + ' must remain visible at ' + width + ' px');
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true,
          selector + ' must fit ' + width + ' px without horizontal page overflow');
      }
      await page.setViewportSize({width: 1440, height: 1000});
    }

    await reset();
    for (const id of ['itemModal', 'campaignModal']) {
      assert.deepEqual(await page.locator('#' + id).evaluate(node => ({
        tag: node.tagName, modal: node.getAttribute('aria-modal'), role: node.getAttribute('role'), count: document.querySelectorAll('#' + node.id).length
      })), {tag: 'SECTION', modal: null, role: null, count: 1}, id + ' must be a single ordinary page section');
      assert.equal(await page.evaluate(id => PageEditors.handles(id), id), true);
    }
    assert.equal(await page.locator('#modal-name').count(), 1, 'the item form IDs must remain unique');
    assert.equal(await page.locator('#campaign-name').count(), 1, 'the campaign form IDs must remain unique');
    await page.locator('#search').fill('Potion');
    await itemEdit().focus();
    await itemEdit().click();
    assert.equal(await visible('#itemModal'), true);
    assert.equal(await page.locator('#itemModal').evaluate(node => !!node.closest('#tab-library')), true,
      'item editing must live in Library');
    assert.equal(await visible('#search'), false, 'browse controls must hide while the item form is open');
    assert.equal(await page.locator('#closeItemModal').evaluate(node=>node.getBoundingClientRect().height>=44),true,'Library editor Back must retain a 44px touch target');
    assert.equal(await page.locator('#modal-name').inputValue(), 'Healing Potion');
    await page.locator('#modal-description').fill('A draft that must survive Stay.');
    await page.locator('#cancelItemModal').click();
    assert.equal(await guard().isVisible(), true);
    assert.equal(await guard().evaluate(node => node instanceof HTMLDialogElement && node.open), true,
      'the short draft decision must remain a native dialog');
    await accessible('#pageEditorLeaveDialog');
    for (let step = 0; step < 8; step++) await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(() => !!document.activeElement.closest('#pageEditorLeaveDialog')), true,
      'the draft decision must contain keyboard focus');
    await mobile('#pageEditorLeaveDialog');
    await page.locator('[data-page-editor-stay]').click();
    assert.equal(await visible('#pageEditorLeaveDialog'), false);
    assert.equal(await page.locator('#modal-description').inputValue(), 'A draft that must survive Stay.');
    await page.locator('#cancelItemModal').click();
    await page.locator('[data-page-editor-discard]').click();
    assert.equal(await visible('#itemModal'), false);
    assert.equal(await page.locator('#search').inputValue(), 'Potion', 'Back must retain the Library search');
    const returnedFocus = await page.evaluate(() => ({tag: document.activeElement.tagName, id: document.activeElement.id, className: document.activeElement.className}));
    assert.equal(await itemEdit().evaluate(node => node === document.activeElement), true,
      'Back must return focus to the edit action; focused element: ' + JSON.stringify(returnedFocus));
    console.log('PASS Item page IDs, Library placement, preserved search, native draft guard, Stay and Discard focus');

    await itemEdit().click();
    await page.locator('#modal-description').fill('Keep this item draft after denied saving.');
    const itemCalls = await page.evaluate(() => callLog.length);
    await page.evaluate(() => { testFailWrite = true; });
    await page.locator('#cancelItemModal').click();
    await page.locator('[data-page-editor-save]').click();
    await page.waitForFunction(count => callLog.length > count && !document.querySelector('[data-page-editor-save]')?.disabled, itemCalls);
    assert.equal(await visible('#itemModal'), true, 'failed save must retain the item page');
    assert.equal(await guard().isVisible(), true, 'failed save must retain the draft decision');
    assert.equal(await page.locator('#modal-description').inputValue(), 'Keep this item draft after denied saving.');
    await page.locator('[data-page-editor-stay]').click();
    await page.evaluate(() => { testFailWrite = false; });
    await accessible('#itemModal');
    await mobile('#itemModal');
    await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:path.join(out,'item-editor-page.png')});
    console.log('PASS Failed item saving retains fields; item page and draft decision pass mobile and WCAG checks');

    await page.locator('#cancelItemModal').click();
    await page.locator('[data-page-editor-save]').click();
    await page.waitForFunction(()=>!document.getElementById('itemModal').offsetParent&&!document.getElementById('pageEditorLeaveDialog'));
    assert.equal(await visible('#search'),true);
    assert.equal(await page.evaluate(()=>fixtureItems.find(item=>item.id==='potion').description),'Keep this item draft after denied saving.');
    assert.equal(await page.evaluate(()=>callLog.at(-1).data.stockRevision),8);
    console.log('PASS Save and continue writes the captured campaign item and returns to Library');

    await reset();await itemEdit().click();
    await page.locator('#modal-description').fill('Navigation-protected item draft');
    await page.evaluate(()=>showTab('campaign-home'));
    assert.equal(await guard().isVisible(),true);
    await page.locator('[data-page-editor-stay]').click();
    assert.equal(await page.locator('#modal-description').inputValue(),'Navigation-protected item draft');
    await page.evaluate(()=>CharacterWorkspace.open('c1','character-sheet'));
    assert.equal(await guard().isVisible(),true);
    assert.equal(await page.evaluate(()=>sheetSession),null,'blocked navigation cannot start a replacement sheet');
    await page.locator('[data-page-editor-discard]').click();
    await page.waitForSelector('#characterSheetForm');
    await page.locator('[data-sheet-tab="story"]').click();await page.locator('[name="appearance"]').fill('Protected sheet draft');
    await page.evaluate(()=>openItemModal(items[0]));assert.equal(await visible('#sheetLeaveDialog'),true);
    await page.locator('[data-sheet-leave-stay]').click();
    assert.equal(await visible('#itemModal'),false);
    assert.equal(await page.locator('[name="appearance"]').inputValue(),'Protected sheet draft');
    await page.evaluate(()=>openItemModal(items[0]));await page.locator('[data-sheet-leave-discard]').click();
    await page.waitForSelector('#modal-name');
    await page.locator('#modal-description').fill('Keep my draft before logout');
    await page.locator('#logoutButton').click();assert.equal(await guard().isVisible(),true);
    await page.locator('[data-page-editor-stay]').click();
    assert.equal(await page.evaluate(()=>auth.currentUser.uid),'dm');
    assert.equal(await page.locator('#modal-description').inputValue(),'Keep my draft before logout');
    console.log('PASS Page, sheet and logout navigation share draft guards without replacing protected fields');

    await reset();await itemEdit().click();
    await page.locator('#modal-description').fill('Saved despite a failed Library refresh');
    await page.evaluate(()=>{window.savedItemLoader=loadCampaignItems;loadCampaignItems=async()=>{throw Error('Simulated refresh failure');};});
    await page.locator('#saveItemModal').click();
    await page.waitForFunction(()=>testAlerts.some(message=>message.includes('Your item is saved.')&&message.includes('refresh')));
    assert.equal(await visible('#itemModal'),false);
    assert.equal(await page.evaluate(()=>fixtureItems.find(item=>item.id==='potion').description),'Saved despite a failed Library refresh');
    await page.evaluate(()=>loadCampaignItems=window.savedItemLoader);
    console.log('PASS A failed catalogue refresh reports the successful save without losing or duplicating it');

    await reset('admin');
    await page.evaluate(()=>openRootCatalogue());
    await page.locator('#rootCards .edit-button').click();
    assert.equal(await visible('#itemEditorScreen'),true);
    assert.equal(await visible('#modal-remaining'),false);
    await page.locator('#modal-name').fill('Root item on a page');
    await page.locator('#saveItemModal').click();
    await page.waitForFunction(()=>!document.getElementById('itemEditorScreen').offsetParent);
    assert.equal(await page.evaluate(()=>testSheetDocs['items/root-potion'].name),'Root item on a page');
    assert.equal(await visible('#rootCatalogueScreen'),true);
    assert.equal(await page.locator('#rootCards .edit-button').first().evaluate(node=>node===document.activeElement),true);
    assert.equal(await page.evaluate(()=>fixtureItems[0].name),'Healing Potion');
    console.log('PASS Root editing has its own page, preserves campaign copies and returns to Root Catalogue');

    await reset();
    await itemEdit().click();
    await page.locator('#modal-name').fill('Pending item');
    await page.evaluate(()=>window.pauseItemSave=true);
    await page.locator('#saveItemModal').click();await page.waitForFunction(()=>!!window.finishItemSave);
    assert.equal(await page.locator('#itemModal .modal-body').evaluate(node=>node.inert),true,'pending saves block further form edits');
    await page.locator('#cancelItemModal').click();
    assert.equal(await guard().isVisible(),false,'pending saves cannot be discarded');
    assert.equal(await visible('#itemModal'),true);
    await page.evaluate(()=>window.finishItemSave());
    await page.waitForFunction(()=>!document.getElementById('itemModal').offsetParent);

    await reset();await itemEdit().click();
    await page.locator('#modal-imageFile').setInputFiles({name:'cover.png',mimeType:'image/png',buffer:Buffer.from('image fixture')});
    await page.evaluate(()=>window.pauseItemUpload=true);
    const beforeStaleUpload=await page.evaluate(()=>callLog.filter(row=>row.name==='vaultSaveCampaignItem').length);
    await page.locator('#saveItemModal').click();await page.waitForFunction(()=>!!window.finishItemUpload);
    await reset('player');
    await page.evaluate(()=>window.finishItemUpload());
    await page.waitForTimeout(50);
    assert.equal(await page.evaluate(()=>callLog.filter(row=>row.name==='vaultSaveCampaignItem').length),beforeStaleUpload,'an upload from an old editor cannot publish item metadata');
    assert.equal(await visible('#itemModal'),false);
    console.log('PASS Pending item saves block exit and edits; late uploads cannot save into a replacement account');

    await reset();await page.evaluate(()=>showTab('dm-party'));
    await page.locator('[data-dm-edit="c1"]').click();await page.waitForSelector('#characterSheetForm');
    assert.equal(await page.locator('[data-sheet-tab="builder"]').getAttribute('aria-selected'),'true');
    assert.equal(await visible('#editCharModal'),false);
    await page.evaluate(()=>openWishModal('c1','Thorin'));assert.equal(await visible('#tab-character-wishlist'),true);
    assert.equal(await visible('#wishModal'),false);
    await page.evaluate(()=>openCharacterLoot('c1'));assert.equal(await visible('#tab-character-loot'),true);
    assert.equal(await visible('#characterLootDialog'),false);
    console.log('PASS Party metadata, Saved and Looted actions open the shared character pages');

    await dashboard();
    await page.locator('#openCreateCampaignBtn').click();
    assert.equal(await visible('#campaignModal'), true, 'campaign setup must open before a campaign is selected');
    assert.equal(await page.evaluate(() => activeCampaign), null);
    await page.locator('#campaign-name').fill('The retry campaign');
    await page.locator('#campaign-description').fill('Retain this setup draft through a partial failure.');
    await accessible('#campaignModal');
    await mobile('#campaignModal');
    await page.screenshot({path:path.join(out,'campaign-setup-page.png')});
    const rootWritesBefore = await page.evaluate(() => pageEditorWrites.filter(row => row.stage === 'root').length);
    await page.evaluate(() => { pageEditorFailures.member = 1; });
    await page.locator('#saveCampaignModal').click();
    await page.waitForFunction(() => PageEditors.session('campaignModal')?.rootCreated && !PageEditors.session('campaignModal')?.saving);
    const partial = await page.evaluate(() => {
      const state = PageEditors.session('campaignModal');
      return {campaignId: state.campaignId, rootCreated: state.rootCreated, memberCreated: state.memberCreated};
    });
    assert.ok(partial.campaignId, 'a setup session must retain its generated campaign ID');
    assert.equal(partial.memberCreated, false, 'the failed membership step must remain retryable');
    assert.equal(await visible('#campaignModal'), true);
    assert.equal(await page.locator('#campaign-name').inputValue(), 'The retry campaign');
    assert.equal(await page.locator('#campaign-description').inputValue(), 'Retain this setup draft through a partial failure.');
    assert.match(await page.locator('#campaignModal [data-page-editor-status]').textContent(), /failure|failed|could not/i);
    await page.locator('#saveCampaignModal').click();
    await page.waitForFunction(id => campaigns.some(row => row.id === id) && !PageEditors.session('campaignModal')?.saving, partial.campaignId);
    const retry = await page.evaluate(id => ({
      roots: pageEditorWrites.filter(row => row.stage === 'root').length,
      root: testSheetDocs['campaigns/' + id],
      member: testSheetDocs['campaigns/' + id + '/members/dm'],
      index: testSheetDocs['users/dm/campaigns/' + id],
      list: campaigns.filter(row => row.id === id).length,
      attempts: pageEditorAttempts.filter(row => row.path === 'campaigns/' + id).length
    }), partial.campaignId);
    assert.equal(retry.roots, rootWritesBefore + 1, 'retry must not create a second campaign root');
    assert.equal(retry.attempts, 1, 'retry must not rewrite the already-created root');
    assert.equal(retry.root.ownerId, 'dm');
    assert.equal(retry.root.dmId, 'dm');
    assert.equal(retry.member.uid, 'dm');
    assert.equal(retry.member.role, 'dm');
    assert.equal(retry.member.status, 'active');
    assert.equal(retry.index.role, 'dm');
    assert.equal(retry.index.status, 'active');
    assert.equal(retry.list, 1, 'a completed retry must publish exactly one campaign');
    assert.equal(await visible('#campaignModal'), false);
    console.log('PASS Campaign setup before selection, partial failure/draft retention and retry reuse one actor-owned ID');

    await dashboard();
    await page.locator('#openCreateCampaignBtn').click();
    await page.locator('#campaign-name').fill('One pending creation');
    await page.evaluate(() => { pageEditorPauses.root = true; });
    const attemptsBefore = await page.evaluate(() => pageEditorAttempts.filter(row => row.stage === 'root').length);
    await page.locator('#saveCampaignModal').click();
    await page.waitForFunction(() => !!pageEditorResolvers.root);
    assert.equal(await page.locator('#saveCampaignModal').isDisabled(), true);
    assert.equal(await page.evaluate(() => PageEditors.session('campaignModal').saving), true);
    await page.evaluate(() => saveCampaignModal());
    assert.equal(await page.evaluate(() => pageEditorAttempts.filter(row => row.stage === 'root').length), attemptsBefore + 1,
      'a second submission while pending must not start another root write');
    await page.evaluate(() => pageEditorResolvers.root());
    await page.waitForFunction(() => !PageEditors.session('campaignModal')?.saving && !document.getElementById('campaignModal').offsetParent);
    assert.equal(await page.evaluate(() => campaigns.filter(row => row.name === 'One pending creation').length), 1);
    console.log('PASS Pending campaign submission disables Save and blocks duplicate direct submissions');

    await dashboard();
    await page.locator('#openCreateCampaignBtn').click();
    await page.locator('#campaign-name').fill('An old account campaign');
    await page.evaluate(() => { pageEditorPauses.root = true; });
    await page.locator('#saveCampaignModal').click();
    await page.waitForFunction(() => !!pageEditorResolvers.root);
    const oldId = await page.evaluate(() => PageEditors.session('campaignModal').campaignId);
    await page.evaluate(() => {
      const finish = pageEditorResolvers.root;
      PageEditors.clear();
      auth.currentUser = {uid: 'other', email: 'other@example.test'};
      currentUser = {id: 'other', uid: 'other', name: 'Other account', role: ['player']};
      activeCampaign = null;
      activeMembershipRole = null;
      campaigns = [];
      hideAllScreens();
      renderCampaignSelector();
      finish();
    });
    await page.waitForFunction(id => !!testSheetDocs['campaigns/' + id], oldId);
    // Flush the SDK continuation so absence assertions cannot pass before its callback.
    await page.evaluate(async () => { for (let step = 0; step < 8; step++) await Promise.resolve(); });
    assert.equal(await visible('#campaignModal'), false);
    assert.equal(await page.evaluate(() => campaigns.length), 0, 'an old save must not publish into the new account dashboard');
    assert.equal(await page.locator('#campaignSelectorList').textContent().then(text => text.includes('An old account campaign')), false);
    assert.equal(await page.evaluate(id => Object.keys(testSheetDocs).some(key => key === 'users/other/campaigns/' + id || key === 'campaigns/' + id + '/members/other'), oldId), false,
      'late membership and index writes must never target the replacement actor');
    assert.equal(await page.evaluate(id => testSheetDocs['campaigns/' + id].ownerId, oldId), 'dm');
    assert.equal(await page.locator('#campaign-name').inputValue(), '', 'account cleanup must erase private setup fields');
    console.log('PASS Late campaign completion retains its original actor and cannot publish into another account');

    await dashboard();await page.locator('#openCreateCampaignBtn').click();
    await page.locator('#campaign-name').fill('Resume the same campaign');
    await page.evaluate(()=>pageEditorFailures.index=1);
    await page.locator('#saveCampaignModal').click();
    await page.waitForFunction(()=>PageEditors.session('campaignModal')?.memberCreated&&!PageEditors.session('campaignModal')?.saving);
    const resumeId=await page.evaluate(()=>PageEditors.session('campaignModal').campaignId);
    await page.locator('#cancelCampaignModal').click();await page.locator('[data-page-editor-discard]').click();
    await page.locator('#openCreateCampaignBtn').click();
    assert.equal(await page.evaluate(()=>PageEditors.session('campaignModal').campaignId),resumeId);
    assert.equal(await page.locator('#campaign-name').inputValue(),'Resume the same campaign');
    assert.equal(await page.locator('#campaign-name').evaluate(node=>node.readOnly),true);
    await page.locator('#cancelCampaignModal').click();await page.locator('[data-page-editor-save]').click();
    await page.waitForFunction(id=>campaigns.some(row=>row.id===id)&&!document.getElementById('pageEditorLeaveDialog'),resumeId);
    assert.equal(await page.evaluate(id=>pageEditorAttempts.filter(row=>row.path==='campaigns/'+id).length,resumeId),1);
    console.log('PASS Incomplete setup can be left and resumed; Save and continue finishes the same campaign');

    await reset();
    const editWrites = await page.evaluate(() => pageEditorAttempts.length);
    await page.evaluate(() => openCampaignModal(activeCampaign));
    assert.equal(await visible('#tab-dm-settings'), true, 'permitted legacy edit must route to campaign settings');
    assert.equal(await visible('#campaignModal'), false);
    assert.equal(await page.evaluate(() => pageEditorAttempts.length), editWrites, 'routing must not write campaign metadata');
    await page.evaluate(() => {
      showTab('library');
      openCampaignModal({id: 'unrelated', name: 'An unrelated campaign'});
    });
    assert.equal(await visible('#tab-library'), true, 'an unrelated legacy edit must not route into current campaign settings');
    assert.equal(await visible('#campaignModal'), false);
    await reset('admin', 'player');
    await page.evaluate(() => openCampaignModal(activeCampaign));
    assert.equal(await visible('#tab-library'), true, 'global admin role must not bypass campaign editing permission');
    assert.equal(await visible('#campaignModal'), false);
    await dashboard('player');
    await page.evaluate(() => openCampaignModal());
    assert.equal(await visible('#campaignModal'), false, 'a player cannot create campaigns');
    console.log('PASS Legacy editing routes only the managed active campaign to settings; account roles preserve access limits');
    assert.deepEqual(errors, [], 'page editor flows must not raise browser runtime errors');
    console.log('SUCCESS page editor browser checks');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
