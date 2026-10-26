const {chromium}=require('playwright'),fs=require('fs'),assert=require('assert/strict');
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});try{
 const p=await b.newPage({viewport:{width:1440,height:1000}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.route('https://studio.test/**',r=>r.fulfill({contentType:'text/html',body:fs.readFileSync('index.html','utf8')}));await p.goto('https://studio.test/#themes');
 assert.deepEqual(await p.evaluate(()=>themes.filter(t=>t.special).map(t=>t.id)),['titanium-orange-dark','nexus-command-dark']);assert.equal(await p.evaluate(()=>themes.filter(t=>!t.special).length),38);
 await p.locator('[data-category=special]').click();assert.equal(await p.locator('.theme-family-button').count(),2);await p.locator('[data-family=titanium-orange]').click();assert.equal(await p.locator('.theme-card').count(),1);assert.equal(await p.locator('.chatgpt-mode-heading').isVisible(),false);
 const readable=await p.evaluate(()=>{const t=themes.find(t=>t.special);return ['text','muted'].every(k=>[t.bg,t.sidebar,t.panel,t.tokens.raised].every(bg=>colorContrast(t.tokens[k],bg)>=4.5))});assert(readable,'Theme text contrast');
 const code=await p.evaluate(()=>generateTerraform(s).code);await p.reload();assert.equal(await p.evaluate(()=>s.theme),'titanium-orange-dark');
 await p.evaluate(()=>showPage('themes'));await p.locator('[data-action=next-theme]').first().click();assert.equal(await p.evaluate(()=>s.theme),'titanium-orange-dark');
 await p.evaluate(()=>{writeThemeAccent('custom','#ffb566');applyTheme();save()});await p.reload();assert.equal(await p.evaluate(()=>currentChatgptAccent()),'#ffb566');
 const migrated=await p.evaluate(()=>RETIRED_SPECIAL_THEME_IDS.map(id=>{const raw=JSON.parse(JSON.stringify(s));raw.theme=id;raw.specialAccents=Object.fromEntries(RETIRED_SPECIAL_THEME_IDS.map(k=>[k,{preset:'default',custom:''}]));const loaded=loadState(raw);return {theme:loaded.theme,accents:loaded.specialAccents,code:generateTerraform(loaded).code}}));
 for(const row of migrated){assert.equal(row.theme,'titanium-orange-dark');assert.deepEqual(row.accents,{});assert.equal(row.code,code)}
 assert(await p.evaluate(()=>{const raw=JSON.parse(JSON.stringify(s));raw.specialAccents={unknown:{preset:'default',custom:''}};try{loadState(raw);return false}catch{return true}}));
 assert(await p.evaluate(()=>getComputedStyle(document.body).backgroundImage.includes('data:image/webp;base64,')));
 for(const width of [1440,390,320]){await p.setViewportSize({width,height:1000});for(const view of ['builder','catalog','network','iam','tags','export','themes','guide']){await p.evaluate(v=>showPage(v),view);assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),view+'/'+width)}}
 await p.setViewportSize({width:1440,height:1000});await p.evaluate(()=>{writeThemeAccent('default');applyTheme();showPage('builder')});await p.waitForTimeout(250);await p.screenshot({path:'/workspace/deliverables/titanium-orange-studio-final.png'});
 const cdp=await p.context().newCDPSession(p);await cdp.send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-transparency',value:'reduce'}]});assert(await p.evaluate(()=>getComputedStyle(document.body).backgroundImage==='none'));await cdp.send('Emulation.setEmulatedMedia',{features:[]});
 await p.evaluate(()=>{s.theme='nexus-command-dark';applyTheme();save();showPage('themes')});await p.reload();assert.equal(await p.evaluate(()=>s.theme),'nexus-command-dark');
 assert(await p.evaluate(()=>{const t=themes.find(t=>t.id===s.theme);return ['text','muted'].every(k=>[t.bg,t.sidebar,t.panel,t.tokens.raised].every(bg=>colorContrast(t.tokens[k],bg)>=4.5))}),'Nexus contrast');
 assert(await p.evaluate(()=>getComputedStyle(document.body).backgroundImage.includes('data:image/webp;base64,')));
 assert(await p.evaluate(()=>{const frame=getComputedStyle(document.querySelector('.stat'),'::after');return frame.pointerEvents==='none'&&frame.borderImageSource.includes('data:image/svg+xml')}),'Decorative chamfer frame is embedded and does not intercept clicks');
 const atlas=await p.evaluate(()=>getComputedStyle(document.body).backgroundImage);
 await p.evaluate(()=>{writeThemeAccent('custom','#d5b6ff');applyTheme();save()});await p.reload();assert.equal(await p.evaluate(()=>currentChatgptAccent()),'#d5b6ff');
 assert.equal(await p.evaluate(()=>loadState(JSON.parse(JSON.stringify(s))).specialAccents['nexus-command-dark'].custom),'#d5b6ff');
 for(const width of [1440,390,320]){await p.setViewportSize({width,height:1000});for(const view of ['builder','catalog','network','iam','tags','export','themes','guide']){await p.evaluate(v=>showPage(v),view);assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Nexus/'+view+'/'+width)}}
 await p.setViewportSize({width:1440,height:1000});await p.evaluate(()=>{writeThemeAccent('default');applyTheme();showPage('builder')});await p.waitForTimeout(250);await p.screenshot({path:'/workspace/deliverables/nexus-command-studio-final.png'});
 await cdp.send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-transparency',value:'reduce'}]});assert(await p.evaluate(()=>getComputedStyle(document.body).backgroundImage==='none'));await cdp.send('Emulation.setEmulatedMedia',{features:[]});
 await p.evaluate(()=>{s.theme='titanium-orange-dark';applyTheme()});assert.notEqual(await p.evaluate(()=>getComputedStyle(document.body).backgroundImage),atlas);
 await p.evaluate(()=>{s.theme='chatgpt-dark';applyTheme()});assert(!(await p.evaluate(()=>getComputedStyle(document.body).backgroundImage)).includes('data:image'));assert.equal(await p.evaluate(()=>generateTerraform(s).code),code);assert.deepEqual(errors,[]);
 console.log('PASS: two special themes, 38 classics, persistence, 27 retired migrations, backup validation, 48 layouts, offline image, accessibility and project preservation');
 }finally{await b.close()}})().catch(e=>{console.error(e);process.exit(1)});
