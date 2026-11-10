// Guided trail: three steps, service cards, plan strip and the review page.
const fs = require('fs'), path = require('path'), assert = require('assert/strict'), { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox'] });
  try {
    const p = await browser.newPage({ viewport: { width: 1440, height: 900 } }), errors = [];
    p.on('pageerror', e => errors.push(e.message));
    await p.route('https://studio.test/**', r => r.fulfill({ contentType: 'text/html', body: fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8') }));
    await p.goto('https://studio.test/');

    // Three steps; the current one follows the page, including pages opened from "Mais".
    assert.deepEqual(await p.locator('#trail a').evaluateAll(links => links.map(a => a.dataset.page)), ['builder', 'review', 'export']);
    const current = () => p.locator('#trail a.trail-current').evaluateAll(links => links.map(a => a.dataset.page));
    for (const [route, step] of [['builder', 'builder'], ['catalog', 'builder'], ['network', 'builder'], ['review', 'review'], ['tags', 'review'], ['iam', 'review'], ['export', 'export']]) {
      await p.evaluate(route => setPage(route), route);
      assert.deepEqual(await current(), [step], route);
    }
    for (const route of ['themes', 'guide']) { await p.evaluate(route => setPage(route), route); assert.deepEqual(await current(), [], route); }

    // Cards choose the same types as the full list, which stays available.
    await p.evaluate(() => setPage('builder'));
    assert.equal(await p.locator('.trail-service').count(), 6);
    for (const type of await p.locator('.trail-service').evaluateAll(cards => cards.map(c => c.dataset.type))) {
      await p.locator('.trail-service[data-type="' + type + '"]').click();
      assert.equal(await p.evaluate(() => selectedType), type);
      assert.equal(await p.locator('#f-resourceType').inputValue(), type);
      assert.equal(await p.locator('.trail-service[aria-pressed="true"]').getAttribute('data-type'), type);
    }
    await p.locator('#f-resourceType').selectOption('nsg');
    assert.equal(await p.locator('.trail-service[aria-pressed="true"]').count(), 0);
    await p.locator('[data-action="builder-next"]').click();
    assert.equal(await p.locator('#trail-services').isVisible(), false);

    // Empty plan: tip visible, review explains what to do.
    assert.equal(await p.locator('#trail-tip').isVisible(), true);
    assert.equal(await p.locator('.trail-plan-empty').count(), 1);
    await p.locator('#trail a[data-page="review"]').click();
    await p.waitForFunction(() => page === 'review');
    assert.equal(await p.locator('.review-empty').count(), 1);

    // Example plan: chips and review rows mirror the resources; generated code is untouched.
    await p.evaluate(() => setPage('builder'));
    await p.locator('#trail-tip [data-action="load-example"]').click();
    const names = await p.evaluate(() => s.resources.map(r => r.name));
    assert(names.length > 0);
    assert.deepEqual(await p.locator('.trail-chip').allInnerTexts(), names);
    assert.equal(await p.locator('#trail-tip').isVisible(), false);
    const before = await p.evaluate(() => ({ tf: generateTerraform(s).code, cli: generateOciCli(s).code }));
    await p.locator('#trail-plan a[href="#review"]').click();
    await p.waitForFunction(() => page === 'review');
    assert.deepEqual(await p.locator('.review-row-name').allInnerTexts(), names);
    assert.equal(await p.locator('#review-count').innerText(), String(names.length));

    // A resource with a validation error is flagged with the validator's own messages.
    const issues = await p.evaluate(() => { s.resources[0].name = ''; renderPlan(); return validateResource(s.resources[0], s); });
    assert(issues.length > 0);
    assert.equal(await p.locator('.review-row').first().locator('.review-issues li').count(), issues.length);
    assert.equal(await p.locator('.review-row').first().locator('.badge.warning').count(), 1);
    await p.evaluate(name => { s.resources[0].name = name; renderPlan(); }, names[0]);
    assert.equal(await p.locator('.review-row .badge.warning').count(), 0);

    // Editing from the review returns to the builder; continuing goes to export.
    await p.locator('.review-row-name').first().click();
    await p.waitForFunction(() => page === 'builder');
    assert.equal(await p.locator('#trail-services').isVisible(), false);
    await p.evaluate(() => setPage('review'));
    await p.locator('#review-continue').click();
    await p.waitForFunction(() => page === 'export');
    assert.deepEqual(await p.evaluate(() => ({ tf: generateTerraform(s).code, cli: generateOciCli(s).code })), before);

    // No horizontal overflow on the trail pages, in every language.
    let layouts = 0;
    for (const language of await p.locator('[data-language]').evaluateAll(items => items.map(i => i.dataset.language))) {
      await p.locator('#language-button').click();
      await p.locator('[data-language="' + language + '"]').click();
      for (const width of [1440, 768, 390, 320]) {
        await p.setViewportSize({ width, height: 900 });
        for (const route of ['builder', 'review', 'export']) {
          await p.evaluate(route => setPage(route), route);
          assert(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), language + ' ' + width + ' ' + route);
          const box = await p.locator('#trail').boundingBox();
          assert(box.x >= 0 && box.x + box.width <= width + 1, language + ' ' + width + ' trail');
          layouts++;
        }
      }
    }
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ steps: 3, serviceCards: 6, review: 'empty, ready and flagged resources', exports: 'unchanged', layouts, errors }));
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exit(1); });
