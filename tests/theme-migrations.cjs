const {chromium}=require('playwright'),fs=require('fs'),assert=require('assert/strict');
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://studio.test/**',route=>route.fulfill({contentType:'text/html',body:fs.readFileSync('index.html','utf8')}));
 await page.goto('https://studio.test/#themes');
 assert.equal(await page.evaluate(()=>themes.length),39);
 assert(await page.evaluate(()=>themes.every(t=>!t.special&&!t.visual&&!t.effect)));
 assert.equal(await page.locator('[data-category=special], .theme-category-tabs').count(),0);
 assert.equal(await page.locator('.theme-family-button').count(),20);
 assert.equal(await page.evaluate(()=>loadState({...defaults(),theme:'prism-dark'}).theme),'chatgpt-dark');
 const fixture=await page.evaluate(()=>{const state=defaults();state.projectName='keep-local-architecture';state.resources=[newResource('vcn',{...initialValues('vcn'),name:'preserve-vcn'})];return state});
 const migrated=await page.evaluate(fixture=>RETIRED_SPECIAL_THEME_IDS.map(id=>{
  const raw={...fixture,theme:id,accentPreset:'custom',accent:'#123456',specialAccents:Object.fromEntries(RETIRED_SPECIAL_THEME_IDS.map(key=>[key,{preset:'custom',custom:'#abcdef'}]))};
  const result=loadState(raw);
  return {id,theme:result.theme,accent:result.accentPreset,legacy:Object.hasOwn(result,'specialAccents'),resources:result.resources,project:result.projectName,code:generateTerraform(result).code,before:generateTerraform(fixture).code};
 }),fixture);
 for(const item of migrated){assert.equal(item.theme,item.id.endsWith('-light')?'prism-light':'chatgpt-dark');assert.equal(item.accent,'default');assert.equal(item.legacy,false);assert.deepEqual(item.resources,fixture.resources);assert.equal(item.project,fixture.projectName);assert.equal(item.code,item.before)}
 assert.equal(migrated.length,29);
 assert(await page.evaluate(fixture=>{try{loadState({...fixture,specialAccents:{unknown:{preset:'default',custom:''}}});return false}catch{return true}},fixture));
 // Restore an actual historical browser project and save it in the current format.
 await page.evaluate(fixture=>localStorage.setItem(STORAGE_KEY,JSON.stringify({...fixture,theme:'nexus-command-dark',specialAccents:{'nexus-command-dark':{preset:'custom',custom:'#abc123'}}})),fixture);
 await page.reload();assert.equal(await page.evaluate(()=>s.theme),'chatgpt-dark');assert.deepEqual(await page.evaluate(()=>s.resources),fixture.resources);
 await page.evaluate(()=>save());assert(await page.evaluate(()=>!Object.hasOwn(JSON.parse(localStorage.getItem(STORAGE_KEY)),'specialAccents')));
 assert.equal(await page.locator('html').getAttribute('data-theme-effect'),null);
 assert.equal(await page.locator('#view-themes').getByText('Temas especiais',{exact:true}).count(),0);
 assert.deepEqual(errors,[]);
 console.log('PASS: 39 classic variants, 29 retired special-theme migrations, saved browser-project preservation, obsolete preference removal');
 }finally{await browser.close()}})().catch(error=>{console.error(error);process.exit(1)});
