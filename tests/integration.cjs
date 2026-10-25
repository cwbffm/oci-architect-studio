const {chromium}=require('playwright');
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),crypto=require('crypto');
const SOURCE=process.env.STUDIO_HTML||path.join(__dirname,'..','index.html');
const API='https://api.studio.test',ORIGIN='https://studio.test';
const COMP='ocid1.compartment.oc1..integrationtest';
const TOKEN='test-operator-token-never-persist-this';
const OIDC_TOKEN='test-oidc-token-never-persist-this';
const OIDC_ISSUER='https://identity.oraclecloud.com/';
const OIDC_ORIGIN='https://idcs-tenant.identity.studio.test';
const OIDC_DISCOVERY=OIDC_ORIGIN+'/.well-known/openid-configuration';
const XSS='<img src=x onerror="window.__logXss=1">';
const LANGUAGES=['pt-BR','en','es','fr','de','it','ja','zh-CN'];

async function fixture(browser,{oidc=false}={}){
  const context=await browser.newContext({viewport:{width:1440,height:1000}});
  const page=await context.newPage(),errors=[],calls=[],jobs=new Map(),architectures=new Map();
  const mock={unsupported:false,unauthorized:false,truncated:false,longLogs:false,badConsole:false,holdJob:false,planSequence:0,applySequence:0};
  const jobView=job=>{
    const status=mock.holdJob||job.reads<=1?'IN_PROGRESS':'SUCCEEDED';
    return {...job,status,logs:[XSS,mock.longLogs?'START_OF_FULL_PLAN '+ 'x'.repeat(120000)+' END_OF_FULL_PLAN':'Terraform output: '+ 'x'.repeat(600)],
      logs_truncated:mock.truncated,review_ready:status==='SUCCEEDED'&&job.operation==='PLAN'&&!mock.truncated,
      console_url:mock.badConsole?'https://cloud.oracle.com.evil.test/steal':'https://cloud.oracle.com/resourcemanager/stacks/test?region=sa-saopaulo-1'};
  };
  page.on('pageerror',e=>errors.push(e.message));
  await page.route(ORIGIN+'/**',route=>route.fulfill({contentType:'text/html',body:fs.readFileSync(SOURCE,'utf8')}));
  await page.route(API+'/**',async route=>{
    const request=route.request(),url=new URL(request.url()),method=request.method();
    const body=request.postData()?JSON.parse(request.postData()):null;
    calls.push({path:url.pathname,method,body,authorization:request.headers().authorization});
    const reply=(data,status=200)=>route.fulfill({status,contentType:'application/json',
      headers:{'Access-Control-Allow-Origin':ORIGIN,'Access-Control-Allow-Headers':'Authorization,Content-Type','Access-Control-Allow-Methods':'GET,POST,OPTIONS'},body:JSON.stringify(data)});
    if(method==='OPTIONS')return reply({});
    if(url.pathname==='/api/config')return reply({auth_mode:oidc?'oidc':'token',oidc_issuer:oidc?OIDC_ISSUER:'',
      oidc_discovery_url:oidc?OIDC_DISCOVERY:'',oidc_client_id:oidc?'studio-client':'',supported_types:['vcn']});
    assert.equal(request.headers().authorization,'Bearer '+(oidc?OIDC_TOKEN:TOKEN));
    if(mock.unauthorized)return reply({detail:'Authentication expired'},401);
    if(url.pathname==='/api/connection')return reply({regions:[{id:'sa-saopaulo-1',name:'São Paulo'}],compartments:[{id:COMP,name:'Studio Test'}],supported_types:['vcn']});
    if(/^\/api\/architectures\/[^/]+$/.test(url.pathname)){
      const aid=url.pathname.split('/').at(-1),architecture=architectures.get(aid);
      if(!architecture)return reply({detail:'Architecture not found'},404);
      return reply({architecture_id:aid,region:architecture.region,compartment_id:architecture.compartment,
        stack_id:'mock-stack',job:jobView(jobs.get(architecture.job)),reconciliation_required:false,
        console_url:'https://cloud.oracle.com/resourcemanager/stacks/test?region=sa-saopaulo-1'});
    }
    if(url.pathname.endsWith('/plan')){
      if(mock.unsupported)return reply({detail:[{msg:'Unsupported resource type'}]},422);
      const id='plan-'+(++mock.planSequence),job={id,operation:'PLAN',status:'ACCEPTED',logs:[]};
      jobs.set(id,{...job,reads:0});architectures.set(url.pathname.split('/')[3],{region:body.state.region,compartment:body.state.compartmentId,job:id});return reply(job);
    }
    if(url.pathname.endsWith('/apply')){
      const id='apply-'+(++mock.applySequence),job={id,operation:'APPLY',status:'ACCEPTED',logs:[]};
      assert.equal(body.confirmation,'APPLY');assert(jobs.has(body.plan_job_id));
      jobs.set(id,{...job,reads:0});architectures.get(url.pathname.split('/')[3]).job=id;return reply(job);
    }
    const id=url.pathname.split('/').at(-1),job=jobs.get(id);
    if(job){
      job.reads++;return reply(jobView(job));
    }
    return reply({detail:'Unknown mocked endpoint'},404);
  });
  return {context,page,errors,calls,mock};
}

async function idle(page){await page.waitForFunction(()=>!ociSession.busy);}
async function seed(page,type='vcn'){
  await page.evaluate(type=>{s=defaults();s.includeIam=false;s.resources=[newResource(type,initialValues(type))];showPage('integration');renderOciIntegration();},type);
}
async function connect(page,token=TOKEN){
  await page.locator('#oci-api-url').fill(API);await page.locator('#oci-access-token').fill(token);
  await page.locator('#oci-connect').click();await page.waitForFunction(()=>!!ociSession.connection);await idle(page);
  if(await page.locator('#oci-region').isEnabled())await page.locator('#oci-region').selectOption('sa-saopaulo-1');
  if(await page.locator('#oci-compartment').isEnabled())await page.locator('#oci-compartment').selectOption(COMP);
}
async function completePlan(page){
  const previous=await page.evaluate(()=>ociSession.job?.id||'');
  await page.locator('#oci-plan').click();
  await page.waitForFunction(previous=>ociSession.job?.id!==previous&&ociSession.job?.operation==='PLAN'&&ociSession.job.status==='SUCCEEDED',previous,{timeout:12000});await idle(page);
}
async function noPersistedToken(page,token){
  const values=await page.evaluate(()=>({local:JSON.stringify(localStorage),session:JSON.stringify(sessionStorage),project:JSON.stringify(s),html:CLEAN_DOCUMENT.outerHTML}));
  for(const [key,value]of Object.entries(values))assert(!value.includes(token),'Token leaked into '+key);
  assert.equal(await page.locator('#oci-access-token').inputValue(),'');
}

(async()=>{
  const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
  const passed=[];let layouts=0;
  try{
    const f=await fixture(browser),{page:p}=f;
    try{
      await p.goto(ORIGIN+'/#integration');await idle(p);
      assert.equal(await p.locator('#view-integration').isVisible(),true);assert.deepEqual(f.errors,[]);
      await seed(p);passed.push('Direct integration URL boots without initialization errors');

      await p.locator('#oci-api-url').fill('http://api.remote.test');await p.locator('#oci-access-token').fill(TOKEN);
      await p.locator('#oci-connect').click();await idle(p);
      assert.equal(f.calls.length,0);assert.equal(await p.locator('#oci-access-token').inputValue(),'');
      assert.equal(await p.locator('#oci-connection-status').getAttribute('data-error'),'true');
      passed.push('Non-local HTTP API rejected before credentials are sent');

      await connect(p);await noPersistedToken(p,TOKEN);
      assert.equal(await p.locator('#oci-plan').isEnabled(),true);passed.push('Authenticated connection keeps token only in tab memory');

      f.mock.unsupported=true;await p.locator('#oci-plan').click();await idle(p);
      assert.equal(await p.locator('#oci-connection-status').getAttribute('data-error'),'true');
      assert.equal(await p.locator('#oci-apply').isDisabled(),true);assert.equal(await p.evaluate(()=>ociSession.snapshot),'');
      f.mock.unsupported=false;passed.push('Rejected plan cannot be approved or applied');

      f.mock.longLogs=true;
      await completePlan(p);assert.equal(await p.locator('#oci-confirm-apply').isEnabled(),true);
      assert.equal(await p.locator('#oci-apply').isDisabled(),true);
      assert((await p.locator('#oci-job-logs').textContent()).includes(XSS));
      assert.equal(await p.locator('#oci-job-logs img').count(),0);assert.equal(await p.evaluate(()=>!!window.__logXss),false);
      assert((await p.locator('#oci-job-logs').textContent()).includes('START_OF_FULL_PLAN'));
      assert((await p.locator('#oci-job-logs').textContent()).length>120000);
      assert.equal(await p.locator('#oci-console').isVisible(),true);f.mock.longLogs=false;
      passed.push('Plan polling reaches success and logs are rendered as inert text');

      await p.locator('#oci-confirm-apply').check();assert.equal(await p.locator('#oci-apply').isEnabled(),true);
      await p.evaluate(()=>{s.projectName='Changed after planning';renderOciIntegration();});
      assert.equal(await p.locator('#oci-confirm-apply').isChecked(),false);assert.equal(await p.locator('#oci-apply').isDisabled(),true);
      assert((await p.evaluate(async()=>{try{await ociApplyPlan();return '';}catch(e){return e.message;}})).includes('novo plano'));
      assert.equal(f.mock.applySequence,0);passed.push('Project edits invalidate approval and block stale apply');

      f.mock.truncated=true;f.mock.badConsole=true;await completePlan(p);
      assert.equal(await p.locator('#oci-confirm-apply').isDisabled(),true);assert.equal(await p.locator('#oci-apply').isDisabled(),true);
      assert.equal(await p.locator('#oci-log-warning').isVisible(),true);assert.equal(await p.locator('#oci-console').isVisible(),false);
      f.mock.truncated=false;f.mock.badConsole=false;
      passed.push('Incomplete logs block approval and untrusted Console URLs remain hidden');

      await completePlan(p);const reviewed=await p.evaluate(()=>ociSession.job.id);
      await p.locator('#oci-confirm-apply').check();await p.locator('#oci-apply').click();
      await p.waitForFunction(()=>ociSession.job?.operation==='APPLY'&&ociSession.job.status==='SUCCEEDED',{},{timeout:12000});await idle(p);
      const apply=f.calls.filter(x=>x.path.endsWith('/apply')&&x.method==='POST');assert.equal(apply.length,1);assert.equal(apply[0].body.plan_job_id,reviewed);
      assert.equal(await p.locator('#oci-apply').isDisabled(),true);passed.push('Explicit approval applies exactly the reviewed plan once');

      const binding=await p.evaluate(()=>loadState(JSON.parse(JSON.stringify(s))).integrationId);
      assert.match(binding,/^[0-9a-f-]{36}$/);assert.equal(binding,await p.evaluate(()=>s.integrationId));
      await p.evaluate(()=>save());await p.reload();await idle(p);
      assert.equal(await p.evaluate(()=>s.integrationId),binding);assert.equal(await p.evaluate(()=>ociSession.token),'');
      assert.equal(await p.evaluate(()=>ociSession.connection),null);assert.equal(await p.locator('#oci-apply').isDisabled(),true);
      passed.push('Reload and backup retain architecture binding without restoring credentials or approval');

      await connect(p);f.mock.holdJob=true;await p.locator('#oci-plan').click();
      await p.waitForFunction(()=>ociSession.job?.operation==='PLAN'&&ociSession.job.status==='IN_PROGRESS');await idle(p);
      const activeId=await p.evaluate(()=>ociSession.job.id);await p.reload();await idle(p);await connect(p);
      assert.equal(await p.evaluate(()=>ociSession.job?.id),activeId);assert.equal(await p.evaluate(()=>ociSession.snapshot),'');
      assert.equal(await p.locator('#oci-plan').isDisabled(),true);assert.equal(await p.locator('#oci-refresh').isEnabled(),true);
      assert.equal(await p.locator('#oci-confirm-apply').isDisabled(),true);
      f.mock.holdJob=false;await p.locator('#oci-refresh').click();await idle(p);
      assert.equal(await p.evaluate(()=>ociSession.job.status),'SUCCEEDED');assert.equal(await p.locator('#oci-confirm-apply').isDisabled(),true);
      passed.push('Reconnect restores the active architecture job without restoring plan approval');

      await completePlan(p);await p.locator('#oci-disconnect').click();
      assert.equal(await p.evaluate(()=>ociSession.token),'');assert.equal(await p.evaluate(()=>ociSession.job),null);
      assert.equal(await p.locator('#oci-confirm-apply').isChecked(),false);assert.equal(await p.locator('#oci-apply').isDisabled(),true);
      passed.push('Disconnect clears credentials, job and approval');

      await connect(p);const oldBinding=await p.evaluate(()=>s.integrationId),resourceCount=await p.evaluate(()=>s.resources.length);
      assert.equal(await p.locator('#oci-region').isDisabled(),true);assert.equal(await p.locator('#oci-compartment').isDisabled(),true);
      p.once('dialog',dialog=>dialog.dismiss());await p.locator('#oci-new-architecture').click();
      assert.equal(await p.evaluate(()=>s.integrationId),oldBinding);
      p.once('dialog',dialog=>dialog.accept());await p.locator('#oci-new-architecture').click();
      assert.equal(await p.evaluate(()=>s.integrationId),'');assert.equal(await p.evaluate(()=>ociSession.job),null);
      assert.equal(await p.evaluate(()=>s.resources.length),resourceCount);
      assert.equal(await p.locator('#oci-region').isEnabled(),true);assert.equal(await p.locator('#oci-compartment').isEnabled(),true);
      passed.push('New association needs explicit confirmation and unlocks destination without deleting the drawing');

      f.mock.unauthorized=true;await p.locator('#oci-plan').click();await idle(p);
      assert.equal(await p.evaluate(()=>ociSession.token),'');assert.equal(await p.evaluate(()=>ociSession.connection),null);
      assert.equal(await p.locator('#oci-plan').isDisabled(),true);f.mock.unauthorized=false;
      passed.push('Expired authentication disables mutation controls');

      for(const language of LANGUAGES){await p.evaluate(language=>setInterfaceLanguage(language),language);
        for(const width of [1440,390,320]){await p.setViewportSize({width,height:1000});await p.evaluate(()=>showPage('integration'));
          assert((await p.evaluate(()=>document.documentElement.scrollWidth-innerWidth))<=1,language+'/'+width);layouts++;}}
      passed.push('Integration page fits desktop and mobile in eight interface languages');assert.deepEqual(f.errors,[]);
    }finally{await f.context.close();}

    const g=await fixture(browser,{oidc:true}),q=g.page;
    try{
      let authorizeParams,exchange,badState=false,badEndpoint='',exchanges=0,authorizations=0;
      await q.route(OIDC_ORIGIN+'/**',async route=>{
        const url=new URL(route.request().url());
        if(url.pathname==='/.well-known/openid-configuration'){
          const metadata={issuer:OIDC_ISSUER,authorization_endpoint:url.origin+'/authorize',token_endpoint:url.origin+'/token'};
          if(badEndpoint)metadata[badEndpoint]='https://untrusted.identity.studio.test/steal';
          return route.fulfill({contentType:'application/json',headers:{'Access-Control-Allow-Origin':ORIGIN},body:JSON.stringify(metadata)});
        }
        if(url.pathname==='/authorize'){
          authorizations++;
          authorizeParams=url.searchParams;const redirect=new URL(authorizeParams.get('redirect_uri'));
          redirect.search=new URLSearchParams({code:'authorization-test-code',state:badState?'invalid-state':authorizeParams.get('state')}).toString();
          return route.fulfill({status:302,headers:{Location:redirect.href},body:''});
        }
        exchanges++;exchange=new URLSearchParams(route.request().postData());
        return route.fulfill({contentType:'application/json',headers:{'Access-Control-Allow-Origin':ORIGIN},body:JSON.stringify({access_token:OIDC_TOKEN,token_type:'Bearer',expires_in:3600})});
      });
      await q.goto(ORIGIN+'/#integration');await idle(q);await seed(q);
      await q.locator('#oci-api-url').fill(API);await q.locator('#oci-connect').click();
      await q.waitForFunction(()=>typeof ociSession!=='undefined'&&!!ociSession.connection,{},{timeout:15000});await idle(q);
      assert.equal(authorizeParams.get('code_challenge_method'),'S256');assert.equal(exchange.get('grant_type'),'authorization_code');
      assert.equal(exchange.get('code'),'authorization-test-code');assert.equal(exchange.get('client_id'),'studio-client');
      const challenge=crypto.createHash('sha256').update(exchange.get('code_verifier')).digest('base64url');
      assert.equal(challenge,authorizeParams.get('code_challenge'));assert(authorizeParams.get('state').length>=32);
      assert.equal(new URL(q.url()).search,'');assert.equal(await q.evaluate(()=>sessionStorage.getItem('oci_studio_oauth_pending')),null);
      await noPersistedToken(q,OIDC_TOKEN);assert.deepEqual(g.errors,[]);
      passed.push('Oracle-style global issuer and tenant discovery complete OIDC PKCE without persisting credentials');

      badState=true;await q.locator('#oci-disconnect').click();await q.locator('#oci-connect').click();
      await q.waitForFunction(()=>document.querySelector('#oci-connection-status')?.dataset.error==='true');await idle(q);
      assert.equal(exchanges,1);assert.equal(await q.evaluate(()=>ociSession.token),'');
      assert.equal(await q.evaluate(()=>sessionStorage.getItem('oci_studio_oauth_pending')),null);assert.deepEqual(g.errors,[]);
      passed.push('OIDC state mismatch prevents token exchange and clears pending login');

      badState=false;const previousAuthorizations=authorizations;
      for(const endpoint of ['authorization_endpoint','token_endpoint']){
        badEndpoint=endpoint;await q.locator('#oci-connect').click();await idle(q);
        assert.equal(await q.locator('#oci-connection-status').getAttribute('data-error'),'true');
        assert((await q.locator('#oci-connection-status').textContent()).includes('Endpoint'));
        assert.equal(authorizations,previousAuthorizations);assert.equal(exchanges,1);
        assert.equal(await q.evaluate(()=>sessionStorage.getItem('oci_studio_oauth_pending')),null);
      }
      assert.deepEqual(g.errors,[]);passed.push('OIDC rejects authorization and token endpoints outside the configured discovery origin');
    }finally{await g.context.close();}

    fs.mkdirSync(path.join(__dirname,'..','work'),{recursive:true});
    const result={passed:passed.length,tests:passed,languages:LANGUAGES.length,layouts,ociRequests:'mocked; no infrastructure created'};
    fs.writeFileSync(path.join(__dirname,'..','work','integration-results.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
