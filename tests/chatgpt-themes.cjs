const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const assert = require('assert/strict');
const SOURCE = process.env.STUDIO_HTML || path.join(__dirname, '../index.html');
const REPORT_DIR = path.join(__dirname, '../work');
fs.mkdirSync(REPORT_DIR, { recursive: true });
const OUTPUT = path.join(REPORT_DIR, 'chatgpt-theme-results.json');
const MODES = ['chatgpt-dark', 'chatgpt-light'];
const PRESETS = ['default', 'blue', 'green', 'yellow', 'pink', 'orange', 'purple', 'white', 'custom'];
const VIEWS = ['builder', 'catalog', 'iam', 'network', 'tags', 'export', 'themes', 'guide'];

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });
  const results = [], contrast = [], layouts = [], errors = [];
  const test = async (name, fn) => { await fn(); results.push(name); console.log('PASS', name); };
  const load = async (context, saved) => {
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    await page.route('https://studio.test/**', route => route.fulfill({ contentType: 'text/html', body: fs.readFileSync(SOURCE, 'utf8') }));
    if (saved) await page.addInitScript(({ key, state }) => { if (!sessionStorage.getItem('fixture-loaded')) { localStorage.setItem(key, JSON.stringify(state)); sessionStorage.setItem('fixture-loaded', '1'); } }, saved);
    await page.goto('https://studio.test/');
    await page.waitForFunction(() => typeof defaults === 'function' && document.querySelector('#navigation'));
    return page;
  };
  const selectMode = async (page, id) => {
    await page.evaluate(() => showPage('themes'));
    await page.locator(`.theme-card[data-action="theme"][data-id="${id}"]`).click();
    await page.waitForFunction(id => document.documentElement.dataset.theme === id, id);
  };
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await load(context);
    const storageKey = await page.evaluate(() => STORAGE_KEY);
    const fixture = await page.evaluate(() => { const state = defaults(); state.projectName = 'existing-project'; state.resources = [newResource('vcn', { ...initialValues('vcn'), name: 'existing-vcn' })]; state.resources[0].id = 'r_existing_vcn'; return state; });

    await test('Exactly two ChatGPT themes; dark default; no legacy theme controls', async () => {
      assert.deepEqual(await page.evaluate(() => themes.map(t => t.id).sort()), MODES.slice().sort());
      assert.equal(await page.evaluate(() => defaults().theme), 'chatgpt-dark');
      assert.equal(await page.locator('html').getAttribute('data-theme'), 'chatgpt-dark');
      await page.evaluate(() => showPage('themes'));
      assert.equal(await page.locator('.theme-card').count(), 2);
      assert.equal(await page.locator('[data-action="import-theme"],[data-action="export-theme"],#theme-file-input,#theme-search,#theme-mode,#theme-family,#theme-new-only').count(), 0);
      assert.deepEqual(await page.locator('#accent-preset option').evaluateAll(options => options.map(o => o.value)), PRESETS);
    });

    await test('Legacy IDs and custom themes migrate without changing project resources or Terraform', async () => {
      const cases = [
        ['ayu-mirage', 'chatgpt-dark', []],
        ['oracle-redwood-light', 'chatgpt-light', []],
        ['custom-x', 'chatgpt-light', [{ id: 'custom-x', name: 'Legacy custom', mode: 'light', tokens: { bg: '#ffffff', text: '#111111' } }]],
        ['custom-unknown', 'chatgpt-dark', []]
      ];
      for (const [id, expected, custom] of cases) {
        const raw = { ...fixture, theme: id, customThemes: custom, accent: '#ffcc66' };
        const actual = await page.evaluate(raw => { const before = generateTerraform(raw).code; const loaded = loadState(raw); return { theme: loaded.theme, customThemes: loaded.customThemes, projectName: loaded.projectName, resources: loaded.resources, before, after: generateTerraform(loaded).code, count: themes.length }; }, raw);
        assert.equal(actual.theme, expected, id);
        assert.deepEqual(actual.customThemes, [], id);
        assert.equal(actual.projectName, fixture.projectName, id);
        assert.deepEqual(actual.resources, fixture.resources, id);
        assert.equal(actual.after, actual.before, id);
        assert.equal(actual.count, 2, id);
      }
    });

    await test('Old saved preferences migrate on load and persist without resurrecting old themes', async () => {
      for (const [oldId, expected] of [['ayu-mirage', 'chatgpt-dark'], ['oracle-redwood-light', 'chatgpt-light']]) {
        const ctx = await browser.newContext();
        try {
          const p = await load(ctx, { key: storageKey, state: { ...fixture, theme: oldId, accent: '#ffcc66', customThemes: [] } });
          assert.equal(await p.locator('html').getAttribute('data-theme'), expected);
          assert.equal(await p.evaluate(() => s.projectName), fixture.projectName);
          await p.evaluate(() => save());
          await p.reload();
          assert.equal(await p.locator('html').getAttribute('data-theme'), expected);
          assert.equal(await p.evaluate(() => themes.length), 2);
        } finally { await ctx.close(); }
      }
    });

    await test('Both modes persist through reload and preserve resource data', async () => {
      await page.evaluate(state => { s = loadState(state); updateAll(); }, fixture);
      for (const mode of MODES) {
        await selectMode(page, mode);
        const before = await page.evaluate(() => ({ projectName: s.projectName, resources: s.resources, code: generateTerraform(s).code }));
        await page.reload();
        assert.equal(await page.locator('html').getAttribute('data-theme'), mode);
        assert.deepEqual(await page.evaluate(() => ({ projectName: s.projectName, resources: s.resources, code: generateTerraform(s).code })), before);
      }
    });

    await test('Named accents and custom color work and remain legible in both modes', async () => {
      for (const mode of MODES) {
        await selectMode(page, mode);
        for (const preset of PRESETS) {
          await page.locator('#accent-preset').selectOption(preset);
          if (preset === 'custom') {
            assert.equal(await page.locator('#accent-picker').isVisible(), true);
            await page.locator('#accent-picker').evaluate(el => { el.value = '#4a90e2'; el.dispatchEvent(new Event('input', { bubbles: true })); });
          }
          assert.equal(await page.locator('#accent-preset').inputValue(), preset);
          const measure = await page.evaluate(() => {
            const rgb = color => { const c = document.createElement('canvas'); c.width = c.height = 1; const x = c.getContext('2d'); x.fillStyle = '#ffffff'; x.fillRect(0, 0, 1, 1); x.fillStyle = color; x.fillRect(0, 0, 1, 1); return [...x.getImageData(0, 0, 1, 1).data].slice(0, 3); };
            const lum = color => rgb(color).map(v => v / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4).reduce((n, v, i) => n + v * [.2126, .7152, .0722][i], 0);
            const ratio = (a, b) => (Math.max(lum(a), lum(b)) + .05) / (Math.min(lum(a), lum(b)) + .05);
            const css = getComputedStyle(document.documentElement), read = key => css.getPropertyValue('--' + key).trim();
            return { main: ratio(read('text'), read('bg')), button: ratio(read('accent-ink'), read('accent')), accent: ratio(read('accent'), read('bg')), color: read('accent'), ink: read('accent-ink') };
          });
          contrast.push({ mode, preset, ...measure });
          assert(measure.main >= 4.5, `Main text contrast ${mode}/${preset}: ${measure.main}`);
          assert(measure.button >= 4.5, `Primary button contrast ${mode}/${preset}: ${measure.button}`);
          assert(measure.accent >= 3, `Accent contrast ${mode}/${preset}: ${measure.accent}`);
        }
      }
      await page.reload();
      await page.evaluate(() => showPage('themes'));
      assert.equal(await page.locator('#accent-preset').inputValue(), 'custom');
      assert.equal(await page.locator('#accent-picker').inputValue(), '#4a90e2');
    });

    await test('Top-bar theme toggle switches only between the two ChatGPT modes', async () => {
      await selectMode(page, 'chatgpt-dark');
      await page.locator('[data-action="next-theme"]').click();
      assert.equal(await page.locator('html').getAttribute('data-theme'), 'chatgpt-light');
      await page.locator('[data-action="next-theme"]').click();
      assert.equal(await page.locator('html').getAttribute('data-theme'), 'chatgpt-dark');
    });

    await test('All eight pages render in both modes with no overflow at 1440, 390 and 320 px', async () => {
      for (const width of [1440, 390, 320]) {
        await page.setViewportSize({ width, height: 900 });
        for (const mode of MODES) {
          await selectMode(page, mode);
          for (const view of VIEWS) {
            await page.evaluate(view => showPage(view), view);
            await page.waitForTimeout(30);
            const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
            layouts.push({ width, mode, view, overflow });
            assert(overflow <= 1, `${width}/${mode}/${view}: ${overflow}px overflow`);
          }
        }
      }
    });

    await test('Theme cards and native accent selector work by keyboard on mobile', async () => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.evaluate(() => showPage('themes'));
      await page.locator('.theme-card[data-id="chatgpt-light"]').focus();
      await page.keyboard.press('Enter');
      assert.equal(await page.locator('html').getAttribute('data-theme'), 'chatgpt-light');
      await page.locator('#accent-preset').selectOption('default');
      await page.locator('#accent-preset').focus();
      await page.keyboard.press('ArrowDown');
      assert.equal(await page.locator('#accent-preset').inputValue(), 'blue');
      await page.screenshot({ path: path.join(REPORT_DIR, 'chatgpt-themes-mobile.png') });
    });
    assert.deepEqual(errors, [], 'JavaScript runtime errors');
    const report = { passed: results.length, tests: results, modeIds: MODES, presets: PRESETS, layoutCases: layouts.length, layouts, contrast, errors };
    fs.writeFileSync(OUTPUT, JSON.stringify(report, null, 2));
    console.log(JSON.stringify({ passed: results.length, layoutCases: layouts.length, contrastCases: contrast.length, errors }, null, 2));
    await context.close();
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
