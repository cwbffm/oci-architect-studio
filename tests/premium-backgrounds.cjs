const {chromium}=require('playwright');
const fs=require('fs'),assert=require('assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  const p=await browser.newPage();
  await p.route('https://studio.test/**',r=>r.fulfill({contentType:'text/html',body:fs.readFileSync('index.html','utf8')}));
  await p.goto('https://studio.test/');
  const variants=await p.evaluate(()=>themes.filter(t=>t.special).map(t=>({id:t.id,premium:!!t.premium,mode:t.mode})));
  assert.equal(variants.length,28);
  const positions={premium:new Set(),special:new Set()};
  const cdp=await p.context().newCDPSession(p);
  for(const t of variants){
   await p.evaluate(id=>{s.theme=id;applyTheme()},t.id);
   const css=await p.evaluate(()=>{const c=getComputedStyle(document.body);return {image:c.backgroundImage,position:c.backgroundPosition}});
   assert(css.image.includes('data:image/webp;base64,'),t.id+' embeds a background');
   positions[t.premium?'premium':'special'].add(css.position);
   if(!t.premium)assert(css.image.startsWith(t.mode==='light'?'linear-gradient(rgba(248, 250, 251':'linear-gradient(rgba(6, 16, 28'),t.id+' uses the right overlay');
   await cdp.send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-transparency',value:'reduce'}]});
   assert(await p.evaluate(()=>getComputedStyle(document.body).backgroundImage==='none'),t.id+' respects reduced transparency');
   await cdp.send('Emulation.setEmulatedMedia',{features:[]});
  }
  assert.equal(positions.premium.size,10);assert.equal(positions.special.size,9);
  await p.evaluate(()=>{s.theme='chatgpt-dark';applyTheme()});
  assert(!(await p.evaluate(()=>getComputedStyle(document.body).backgroundImage)).includes('data:image'));
  console.log('PASS: 28 embedded backgrounds, 19 family positions, light/dark overlays, reduced transparency and classic restoration');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
