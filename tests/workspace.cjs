const {chromium}=require('playwright'),fs=require('fs'),assert=require('assert/strict');
const views=['builder','catalog','iam','network','tags','export','themes','guide'];
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});try{
 const p=await b.newPage({viewport:{width:1440,height:1000}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.route('https://studio.test/**',r=>r.fulfill({contentType:'text/html',body:fs.readFileSync('index.html','utf8')}));await p.goto('https://studio.test/');
 let layouts=0;
 for(const theme of ['nexus-command-dark','titanium-orange-dark','chatgpt-light']){
  await p.evaluate(id=>{s.theme=id;applyTheme();save();showPage('builder')},theme);
  for(const width of [1440,1024,768,390,320]){await p.setViewportSize({width,height:1000});for(const view of views){await p.evaluate(v=>showPage(v),view);
   const audit=await p.evaluate(()=>{const ids=[...document.querySelectorAll('[id]')].map(el=>el.id);return {overflow:document.documentElement.scrollWidth-innerWidth,duplicates:ids.filter((id,i)=>ids.indexOf(id)!==i),rail:document.getElementById('sidebar').getBoundingClientRect().width,topbar:getComputedStyle(document.querySelector('.topbar')).height}});
   assert(audit.overflow<=1,theme+'/'+width+'/'+view+' overflow '+audit.overflow);assert.deepEqual(audit.duplicates,[],view+' duplicate IDs');if(width>700){assert.equal(audit.rail,82,view+' shared rail');assert.equal(audit.topbar,'54px',view+' shared header')}if(width===390&&view==='builder'){await p.locator('[data-action=menu]').click();assert.equal(await p.locator('[data-action=menu]').getAttribute('aria-expanded'),'true');await p.keyboard.press('Escape');assert.equal(await p.locator('[data-action=menu]').getAttribute('aria-expanded'),'false')}layouts++;
  }}
 }
 await p.setViewportSize({width:1440,height:1000});await p.evaluate(()=>{s.theme='nexus-command-dark';applyTheme();showPage('builder')});
 assert.equal(await p.locator('#builder-steps').evaluate(el=>getComputedStyle(el).flexDirection),'column');
 await p.locator('#service-selector select').selectOption('vcn');await p.locator('#f-name').fill('workspace-vcn');
 while(await p.locator('#builder-next').isVisible())await p.locator('#builder-next').click();await p.locator('#add-resource').click();
 assert.equal(await p.evaluate(()=>s.resources.length),1);assert.equal(await p.evaluate(()=>s.resources[0].name),'workspace-vcn');
 await p.locator('[data-action=edit-resource]').first().click();await p.locator('#f-name').fill('workspace-vcn-edited');await p.waitForTimeout(100);assert.equal(await p.locator('#f-name').inputValue(),'workspace-vcn-edited','Route changes must not overwrite a new edit');while(await p.locator('#builder-next').isVisible())await p.locator('#builder-next').click();await p.locator('#add-resource').click();assert.equal(await p.evaluate(()=>s.resources.length),1);assert.equal(await p.evaluate(()=>s.resources[0].name),'workspace-vcn-edited');
 await p.evaluate(()=>setPage('export'));await p.evaluate(()=>setPage('catalog'));await p.goBack();await p.waitForFunction(()=>page==='export');await p.goBack();await p.waitForFunction(()=>page==='builder');
 assert(await p.evaluate(()=>generateTerraform(s).code.includes('oci_core_vcn')));await p.reload();assert.equal(await p.evaluate(()=>s.resources[0].name),'workspace-vcn-edited');
 await p.evaluate(()=>showPage('builder'));await p.locator('[data-action=remove-resource]').first().click();assert.equal(await p.evaluate(()=>s.resources.length),0);
 for(const view of views){await p.evaluate(v=>showPage(v),view);await p.waitForTimeout(100);await p.screenshot({path:'work/workspace-'+view+'.png',fullPage:true});}
 assert.deepEqual(errors,[]);console.log(JSON.stringify({passed:true,pages:views.length,layouts,wizard:'create/edit/remove/reload',duplicateIds:0,errors},null,2));
 }finally{await b.close()}})().catch(e=>{console.error(e);process.exit(1)});
