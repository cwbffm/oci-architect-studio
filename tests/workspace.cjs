const {chromium}=require('playwright');
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');

(async()=>{
  const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
  try{
    const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[],passed=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.route('https://workspace.test/**',route=>route.fulfill({contentType:'text/html',body:fs.readFileSync(process.env.STUDIO_HTML||path.join(__dirname,'../index.html'),'utf8')}));
    await page.goto('https://workspace.test/');
    async function test(name,run){await run();passed.push(name);}
    await test('Draft preview follows edits without adding resources to the plan',async()=>{
      await page.evaluate(()=>{s=defaults();s.includeIam=false;chooseType('vcn');});
      await page.locator('#f-name').fill('vcn-preview-only');
      assert.ok((await page.locator('#studio-preview-code').textContent()).includes('vcn-preview-only'));
      assert.equal(await page.evaluate(()=>s.resources.length),0);
      await page.locator('[data-action="studio-preview-mode"][data-mode="plan"]').click();
      assert.ok(!(await page.locator('#studio-preview-code').textContent()).includes('vcn-preview-only'));
      await page.locator('[data-action="studio-preview-mode"][data-mode="draft"]').click();
    });
    await test('Profiles navigate and survive reload',async()=>{
      await page.locator('#studio-profile').selectOption('architect');
      await page.waitForURL('**/#network');
      assert.equal(await page.locator('html').getAttribute('data-studio-profile'),'architect');
      await page.reload();
      assert.equal(await page.locator('#studio-profile').inputValue(),'architect');
      await page.locator('#studio-profile').selectOption('governance');
      await page.waitForURL('**/#iam');
      await page.locator('#studio-profile').selectOption('developer');
      await page.waitForURL('**/#builder');
    });
    await test('Favorites filter themes and persist through reload and backup',async()=>{
      await page.evaluate(()=>showPage('themes'));
      await page.locator('[data-action="studio-favorite"][data-id="chatgpt-dark"]').click();
      await page.locator('#studio-favorites-only').check();
      assert.equal(await page.locator('.theme-card').count(),1);
      await page.reload();
      await page.evaluate(()=>showPage('themes'));
      await page.locator('#studio-favorites-only').check();
      assert.equal(await page.locator('.theme-card').count(),1);
      assert.equal(await page.evaluate(()=>loadState(JSON.parse(JSON.stringify(s))).studio.favorites.includes('chatgpt-dark')),true);
      await page.locator('#studio-favorites-only').uncheck();
    });
    await test('Preset restores theme, accent, fonts, density and profile without altering infrastructure',async()=>{
      const before=await page.evaluate(()=>JSON.stringify({resources:s.resources,tags:s.tags,network:s.network}));
      await page.locator('[data-action="theme"][data-id="chatgpt-dark"]').click();
      await page.locator('.reading-settings summary').click();
      await page.locator('#ui-density').selectOption('compact');
      await page.locator('#font-scale').selectOption('1.12');
      await page.locator('#accent-preset').selectOption('blue');
      await page.locator('#studio-preset-name').fill('Daily <Fabio>');
      await page.locator('[data-action="studio-save-preset"]').click();
      await page.locator('[data-action="theme"][data-id="chatgpt-light"]').click();
      await page.locator('#accent-preset').selectOption('pink');
      await page.locator('#ui-density').selectOption('comfortable');
      await page.locator('#studio-saved-preset').selectOption('0');
      await page.locator('[data-action="studio-load-preset"]').click();
      assert.deepEqual(await page.evaluate(()=>({theme:s.theme,density:s.appearance.density,scale:s.appearance.fontScale,accentPreset:s.accentPreset})),{theme:'chatgpt-dark',density:'compact',scale:1.12,accentPreset:'blue'});
      assert.equal(await page.evaluate(()=>JSON.stringify({resources:s.resources,tags:s.tags,network:s.network})),before);
      assert.equal(await page.locator('#studio-settings img').count(),0);
      assert.equal(await page.evaluate(()=>loadState(JSON.parse(JSON.stringify(s))).studio.presets[0].name),'Daily <Fabio>');
    });
    await test('Environment follows tags; manual label does not modify them',async()=>{
      await page.evaluate(()=>{s.tags=[{kind:'freeform',key:'Environment',value:'Lab'}];studioPreferences().environment='auto';save();});
      assert.equal(await page.locator('#studio-environment').getAttribute('data-environment'),'lab');
      const before=await page.evaluate(()=>JSON.stringify(s.tags));
      await page.locator('#studio-environment-select').selectOption('production');
      assert.equal(await page.locator('#studio-environment').getAttribute('data-environment'),'production');
      assert.equal(await page.evaluate(()=>JSON.stringify(s.tags)),before);
    });
    await test('Older backups migrate and malformed preferences are normalized',async()=>{
      assert.deepEqual(await page.evaluate(()=>{const old=defaults();delete old.studio;const migrated=loadState(old);const safe=normalizeStudio({profile:'bad',favorites:['missing','chatgpt-dark','chatgpt-dark'],presets:[{name:'unsafe',theme:'missing'}]});return {profile:migrated.studio.profile,favorites:safe.favorites,presets:safe.presets};}),{profile:'developer',favorites:['chatgpt-dark'],presets:[]});
    });
    await test('Every native resource renders a consistent preview and a tags step',async()=>{
      assert.equal(await page.evaluate(()=>{studioPreviewMode='draft';for(const type of Object.keys(TYPES).filter(t=>t!=='universal')){chooseType(type);if($('studio-preview-code').textContent!==generateTerraform(studioPreviewState()).code)throw Error('Preview failed: '+type);if(!builderSteps().some(step=>step.id==='tags'))throw Error('Tags step missing: '+type);}showPage('themes');return true;}),true);
    });
    await test('New labels localize without changing resource and project names',async()=>{
      await page.evaluate(()=>{s.projectName='Governança';renderStudioContext();setInterfaceLanguage('en');});
      assert.equal(await page.locator('#studio-project-name').textContent(),'Governança');
      assert.equal(await page.locator('[data-action="studio-save-preset"]').textContent(),'Save preset');
      await page.evaluate(()=>setInterfaceLanguage('pt-BR'));
    });
    await test('All pages fit mobile and desktop with both light and dark palettes',async()=>{
      for(const theme of ['chatgpt-dark','chatgpt-light']){
        await page.evaluate(theme=>{s.theme=theme;s.accent='';s.appearance=defaults().appearance;applyTheme();},theme);
        for(const width of [320,390,1024,1440,1920]){
          await page.setViewportSize({width,height:1000});
          for(const name of ['builder','catalog','iam','network','tags','export','themes','guide']){
            await page.evaluate(name=>showPage(name),name);
            await page.waitForTimeout(25);
            const sizes=await page.evaluate(()=>({actual:document.documentElement.scrollWidth,expected:innerWidth}));
            assert.ok(sizes.actual<=sizes.expected+1,`${theme}/${name}/${width}: ${sizes.actual}`);
          }
        }
      }
    });
    assert.deepEqual(errors,[]);
    fs.mkdirSync('work',{recursive:true});
    await page.evaluate(()=>{s=defaults();chooseType('compute');updateAll();applyTheme();});
    for(const [name,width,section] of [['developer',1920,'builder'],['blueprint',1440,'network'],['appearance',1440,'themes'],['mobile',390,'builder']]){
      await page.setViewportSize({width,height:1100});
      await page.evaluate(section=>showPage(section),section);
      await page.evaluate(()=>document.getElementById('toast').classList.remove('show'));
      await page.waitForTimeout(250);
      await page.screenshot({path:`work/workspace-${name}.png`,fullPage:true});
    }
    console.log(JSON.stringify({passed:passed.length,tests:passed,errors},null,2));
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
