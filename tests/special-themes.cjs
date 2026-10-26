const {chromium}=require('playwright');
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const SOURCE=process.env.STUDIO_HTML||path.join(__dirname,'..','index.html');
const OUT=path.join(__dirname,'..','work');
const VIEWS=['builder','catalog','iam','network','tags','export','themes','guide'];
const PRIMARY=['liquid-glass-dark','glassmorphism-dark','frosted-glass-light','acrylic-dark','mica-dark','aurora-glass-dark','holographic-glass-dark','neumorphism-light','soft-ui-light'];
fs.mkdirSync(OUT,{recursive:true});

(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 const results=[],errors=[];
 let layouts=0,contrasts=0;
 try{
  const p=await browser.newPage({viewport:{width:1440,height:1000}});
  p.on('pageerror',e=>errors.push(e.message));
  await p.route('https://studio.test/**',r=>r.fulfill({contentType:'text/html',body:fs.readFileSync(SOURCE,'utf8')}));
  await p.goto('https://studio.test/#themes');
  async function check(name,action){await action();results.push(name);console.log('PASS',name);}
  async function choose(id){
   await p.evaluate(()=>showPage('themes'));
   const special=await p.evaluate(id=>!!themes.find(t=>t.id===id).special,id);
   const category=special?'special':'standard';
   if(await p.locator('[data-category='+category+']').getAttribute('aria-selected')!=='true')await p.locator('[data-category='+category+']').click();
   const family=await p.evaluate(id=>themes.find(t=>t.id===id).familyKey,id);
   await p.locator('[data-family="'+family+'"]').click();
   await p.locator('.theme-card[data-id="'+id+'"]').click();
  }
  const ids=await p.evaluate(()=>themes.filter(t=>t.special).map(t=>t.id));
  await check('Catalog contains nine special families and eighteen complete distinct palettes',async()=>{
   assert.equal(ids.length,18);
   await p.locator('[data-category=special]').click();
   assert.equal(await p.locator('.theme-family-button').count(),9);
   const palettes=await p.evaluate(()=>themes.filter(t=>t.special).map(t=>({id:t.id,mode:t.mode,palette:JSON.stringify([t.bg,t.sidebar,t.panel,t.accent,t.tokens.raised,t.tokens.input,t.tokens.text,t.tokens.muted,t.tokens.border])})));
   assert.equal(new Set(palettes.map(t=>t.palette)).size,18,'Every variant needs a complete palette of its own');
  });
  let code,classicAccent;
  await check('A classic custom accent is preserved while special themes start with their own colors',async()=>{
   await choose('chatgpt-dark');
   await p.evaluate(()=>{s.accentPreset='custom';s.accent='#ee0088';s.resources=[newResource('vcn',initialValues('vcn'))];s.includeIam=false;applyTheme();save();});
   code=await p.evaluate(()=>generateTerraform(s).code);
   classicAccent=await p.evaluate(()=>({preset:s.accentPreset,color:s.accent}));
   for(const id of ids){
    await choose(id);
    const state=await p.evaluate(()=>{const t=themes.find(t=>t.id===s.theme);return {raw:currentChatgptAccent(t),own:t.accent,choice:getThemeAccentChoice(t),classic:{preset:s.accentPreset,color:s.accent},css:getComputedStyle(document.documentElement).getPropertyValue('--accent').trim(),expected:readableChatgptAccent(t.accent,t)}});
    assert.equal(state.raw,state.own,id+' inherited another theme accent');
    assert.equal(state.choice.preset,'default',id);
    assert.equal(state.css,state.expected,id+' rendered accent');
    assert.equal(await p.locator('html').getAttribute('data-special-accent'),'own');
    assert.equal(await p.locator('#theme-palette-note').isVisible(),true);
    assert.deepEqual(state.classic,classicAccent,id+' changed classic preferences');
   }
   await choose('soft-ui-light');
   const brand=await p.evaluate(()=>{const css=getComputedStyle(document.documentElement);return {brand:css.getPropertyValue('--special-brand').trim(),accent:css.getPropertyValue('--accent').trim()};});
   assert.notEqual(brand.brand,brand.accent,'Soft UI keeps its warm orange identity separate from the accessible text accent');
  });
  const surfaces=new Map();
  await check('All variants retain the architecture, readable colors, selected theme and responsive layout',async()=>{
   for(const id of ids){
    await choose(id);
    const family=id.replace(/-(dark|light)$/,'');
    assert.equal(await p.locator('html').getAttribute('data-theme-effect'),family);
    await p.reload();
    assert.equal(await p.locator('html').getAttribute('data-theme'),id);
    await p.evaluate(()=>showPage('themes'));
    assert.equal(await p.locator('[data-category=special]').getAttribute('aria-selected'),'true');
    assert.equal(await p.evaluate(()=>generateTerraform(s).code),code);
    const contrast=await p.evaluate(()=>{const css=getComputedStyle(document.documentElement),hex=k=>css.getPropertyValue('--'+k).trim();const surfaces=['bg','sidebar','panel','raised'];return {
     main:Math.min(...surfaces.map(k=>colorContrast(hex('text'),hex(k)))),
     muted:Math.min(...surfaces.map(k=>colorContrast(hex('muted'),hex(k)))),
     accent:Math.min(...surfaces.map(k=>colorContrast(hex('accent'),hex(k)))),
     ink:colorContrast(hex('accent-ink'),hex('accent')),
     brand:colorContrast(hex('special-brand-ink'),hex('special-brand'))
    }});
    for(const [key,v]of Object.entries(contrast))assert(v>=4.49,id+'/'+key+':'+v);
    contrasts+=5;
    const visual=await p.evaluate(()=>{const body=getComputedStyle(document.body),panel=getComputedStyle(document.querySelector('.panel'));return [body.backgroundColor,body.backgroundImage,panel.backgroundColor,panel.boxShadow,panel.borderRadius].join('|')});
    surfaces.set(id,visual);
    for(const width of [1440,390,320]){
     await p.setViewportSize({width,height:1000});
     for(const view of VIEWS){await p.evaluate(v=>showPage(v),view);assert((await p.evaluate(()=>document.documentElement.scrollWidth-innerWidth))<=1,id+'/'+view+'/'+width);layouts++;}
    }
   }
   assert.equal(new Set([...surfaces.values()]).size,18,'Actual backgrounds and surfaces must differ across all variants');
  });
  await check('Special custom colors belong only to the selected variant and survive reload and backup',async()=>{
   await choose('glassmorphism-dark');
   await p.locator('[data-accent=custom]').click();
   await p.locator('#accent-picker').evaluate(el=>{el.value='#f29b46';el.dispatchEvent(new Event('input',{bubbles:true}));});
   assert.equal(await p.evaluate(()=>currentChatgptAccent()),'#f29b46');
   assert.equal(await p.locator('html').getAttribute('data-special-accent'),'custom');
   assert.deepEqual(await p.evaluate(()=>({preset:s.accentPreset,color:s.accent})),classicAccent);
   await choose('mica-dark');
   assert.equal(await p.evaluate(()=>currentChatgptAccent()),await p.evaluate(()=>themes.find(t=>t.id===s.theme).accent));
   await choose('glassmorphism-light');
   assert.equal(await p.evaluate(()=>getThemeAccentChoice(themes.find(t=>t.id===s.theme)).preset),'default');
   await choose('glassmorphism-dark');
   assert.equal(await p.evaluate(()=>currentChatgptAccent()),'#f29b46');
   await p.reload();
   assert.equal(await p.evaluate(()=>currentChatgptAccent()),'#f29b46');
   const restored=await p.evaluate(()=>{const restored=loadState(JSON.parse(JSON.stringify(s)));return restored.specialAccents['glassmorphism-dark'];});
   assert.deepEqual(restored,{preset:'custom',custom:'#f29b46'});
   await p.evaluate(()=>showPage('themes'));
   await p.locator('[data-action=reset-accent]').click();
   assert.equal(await p.evaluate(()=>currentChatgptAccent()),await p.evaluate(()=>themes.find(t=>t.id===s.theme).accent));
   assert.deepEqual(await p.evaluate(()=>({preset:s.accentPreset,color:s.accent})),classicAccent);
  });
  await check('Malformed special color backups are rejected without changing the current project',async()=>{
   const validation=await p.evaluate(()=>{
    const before=JSON.stringify(s),saved=localStorage.getItem(STORAGE_KEY);
    const cases=[null,[], 'invalid', {'unknown-special':{preset:'default',custom:''}},
     {'glassmorphism-dark':null}, {'glassmorphism-dark':[]},
     {'glassmorphism-dark':{preset:'unknown',custom:''}},
     {'glassmorphism-dark':{preset:'custom',custom:''}},
     {'glassmorphism-dark':{preset:'custom',custom:'url(https://invalid.example)'}},
     {'glassmorphism-dark':{preset:'default',custom:'#xyzxyz'}}];
    const rejected=cases.map(specialAccents=>{const raw=JSON.parse(before);raw.specialAccents=specialAccents;try{loadState(raw);return false;}catch{return true;}});
    const old=JSON.parse(before);delete old.specialAccents;
    const migrated=loadState(old);
    return {rejected,unchanged:JSON.stringify(s)===before&&localStorage.getItem(STORAGE_KEY)===saved,legacy:migrated.specialAccents};
   });
   assert(validation.rejected.every(Boolean),'Malformed specialAccents accepted: '+JSON.stringify(validation.rejected));
   assert.equal(validation.unchanged,true);
   assert.deepEqual(validation.legacy,{});
  });
  await check('Returning to a classic theme restores its custom color and clears special styling',async()=>{
   await choose('chatgpt-dark');
   assert.equal(await p.locator('.theme-family-button').count(),19);
   assert.equal(await p.locator('html').getAttribute('data-theme-effect'),'');
   assert.equal(await p.locator('html').getAttribute('data-special-accent'),'');
   assert.equal(await p.locator('#theme-palette-note').isVisible(),false);
   assert.equal(await p.evaluate(()=>currentChatgptAccent()),classicAccent.color);
   assert.equal(await p.evaluate(()=>generateTerraform(s).code),code);
  });
  await check('Primary theme screenshots show the real rendered application',async()=>{
   await p.setViewportSize({width:1440,height:1000});
   for(const id of PRIMARY){
    await choose(id);await p.evaluate(()=>showPage('builder'));
    await p.screenshot({path:path.join(OUT,'special-'+id+'.png'),fullPage:false});
   }
   const cards=PRIMARY.map(id=>{const png=fs.readFileSync(path.join(OUT,'special-'+id+'.png')).toString('base64');return '<figure><figcaption>'+id+'</figcaption><img src="data:image/png;base64,'+png+'"></figure>'}).join('');
   const board='<html><head><style>body{margin:0;background:#111827;color:#eef5ff;font:20px system-ui;padding:24px;display:grid;grid-template-columns:repeat(3,1fr);gap:20px}figure{margin:0;min-width:0}figcaption{padding:10px 0}img{width:100%;display:block;border-radius:12px;border:1px solid #456}</style></head><body>'+cards+'</body></html>';
   fs.writeFileSync(path.join(OUT,'special-theme-comparison.html'),board);
   const q=await browser.newPage({viewport:{width:1800,height:1500}});await q.setContent(board);await q.screenshot({path:path.join(OUT,'special-theme-comparison.png'),fullPage:true});await q.close();
  });
  assert.deepEqual(errors,[]);
  const report={passed:results.length,tests:results,specialVariants:18,families:9,layouts,contrasts,errors};
  fs.writeFileSync(path.join(OUT,'special-theme-results.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify(report,null,2));
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1});
