/* OCI integration: no OCI keys, Terraform or shell execution in the browser. */
const ociSession = {base:'', token:'', config:null, connection:null, job:null, snapshot:'', architecture:'', bound:false, reconciliation:false, busy:false, timer:null, generation:0};
window.STUDIO_OCI_READY=true;
const ociElement = id => document.getElementById('oci-'+id);
const OCI_TERMINAL = new Set(['SUCCEEDED','FAILED','CANCELED','CANCELLED']);

function ociMessage(id, message, error=false) {
  const el=ociElement(id);el.textContent=message;el.dataset.error=String(error);
}
function ociApiBase(value) {
  const url=new URL(value);
  if(url.username||url.password||url.search||url.hash||
    !(url.protocol==='https:'||(url.protocol==='http:'&&['localhost','127.0.0.1','[::1]'].includes(url.hostname))))
    throw Error('Use HTTPS para a API ou HTTP apenas em localhost.');
  return url.href.replace(/\/$/,'');
}
async function ociRequest(path, {method='GET',body,publicRequest=false}={}) {
  const generation=ociSession.generation;
  const response=await fetch(ociSession.base+path, {method,cache:'no-store',credentials:'omit',redirect:'error',
    headers:{Accept:'application/json',...(!publicRequest?{Authorization:'Bearer '+ociSession.token}:{}),...(body?{'Content-Type':'application/json'}:{})},
    body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(30000)});
  const data=await response.json().catch(()=>({}));
  if(generation!==ociSession.generation)throw Error('Conexão encerrada.');
  if(!response.ok){
    if(response.status===401){ociSession.token='';ociSession.connection=null;}
    const detail=typeof data.detail==='string'?data.detail:response.status===422?'Configuração não aceita pela API. Revise os recursos e os parâmetros.':'Falha na API ('+response.status+').';
    const error=new Error(detail.slice(0,2000));error.status=response.status;throw error;
  }
  return data;
}
function ociPayload() {
  return {state:{projectName:s.projectName,region:ociElement('region').value,compartmentId:ociElement('compartment').value,
    resources:clone(s.resources),tags:clone(s.tags),includeIam:false,createTagSchema:false}};
}
function renderOciIntegration() {
  if(!ociElement('plan'))return;
  const connected=!!ociSession.connection, job=ociSession.job;
  const running=job&&!OCI_TERMINAL.has(job.status);
  const exact=!!ociSession.snapshot&&ociSession.snapshot===JSON.stringify(ociPayload())&&ociSession.architecture===s.integrationId;
  ociElement('architecture').textContent=s.integrationId||'—';
  for(const id of ['region','compartment'])ociElement(id).disabled=!connected||ociSession.busy||!!running||ociSession.bound;
  const globalStatus=document.querySelector('.local-label')?.lastChild;
  if(globalStatus?.nodeType===Node.TEXT_NODE)globalStatus.textContent=connected?' API OCI CONECTADA':' SEM CONEXÃO OCI';
  ociElement('connect').disabled=ociSession.busy;
  ociElement('plan').disabled=!connected||ociSession.busy||!!running||ociSession.reconciliation||!s.resources.length||!ociElement('region').value||!ociElement('compartment').value;
  ociElement('new-architecture').disabled=!connected||ociSession.busy||!!running||ociSession.reconciliation||!s.integrationId;
  ociElement('refresh').disabled=!connected||!job||ociSession.busy;
  const validPlan=connected&&!ociSession.reconciliation&&job?.operation==='PLAN'&&job.status==='SUCCEEDED'&&job.review_ready===true&&!job.logs_truncated&&exact;
  ociElement('confirm-apply').disabled=!validPlan||ociSession.busy;
  if(!validPlan)ociElement('confirm-apply').checked=false;
  ociElement('apply').disabled=!validPlan||ociSession.busy||!ociElement('confirm-apply').checked;
}
async function ociBusy(action) {
  if(ociSession.busy)return;
  ociSession.busy=true;renderOciIntegration();
  try{await action();}catch(error){if(error.message!=='Conexão encerrada.')ociMessage('connection-status',error.message,true);}
  finally{ociSession.busy=false;renderOciIntegration();}
}
function ociDisconnect() {
  clearTimeout(ociSession.timer);ociSession.generation++;
  Object.assign(ociSession,{token:'',connection:null,job:null,snapshot:'',architecture:'',bound:false,reconciliation:false,busy:false});
  ociElement('access-token').value='';ociElement('job-logs').textContent='—';ociElement('job-id').textContent='';
  ociElement('supported').textContent='';ociElement('confirm-apply').checked=false;
  ociElement('console').hidden=true;ociElement('console').removeAttribute('href');ociElement('log-warning').hidden=true;
  ociMessage('connection-status','API não conectada.');ociMessage('job-status','Nenhuma execução nesta sessão.');renderOciIntegration();
}
async function ociLoadConnection() {
  const info=await ociRequest('/api/connection');ociSession.connection=info;
  for(const [id,rows,current] of [['region',info.regions,s.region],['compartment',info.compartments,s.compartmentId]]){
    const select=ociElement(id);select.replaceChildren();
    const empty=document.createElement('option');empty.value='';empty.textContent='—';select.append(empty);
    for(const row of rows){const option=document.createElement('option');option.value=row.id;option.textContent=row.name||row.id;select.append(option);}
    select.value=rows.some(row=>row.id===current)?current:'';
  }
  ociElement('supported').textContent='Tipos disponíveis na API: '+info.supported_types.join(', ');
  ociMessage('connection-status','Conexão verificada. Selecione o destino e gere um plano.');
  if(s.integrationId){
    let stored;
    try{stored=await ociRequest('/api/architectures/'+encodeURIComponent(s.integrationId));}catch(error){if(error.status!==404)throw error;}
    if(stored){
      ociSession.architecture=s.integrationId;ociSession.bound=true;ociSession.reconciliation=stored.reconciliation_required;
      ociElement('region').value=stored.region;ociElement('compartment').value=stored.compartment_id;
      if(stored.job){ociSession.job=stored.job;ociShowJob();if(!OCI_TERMINAL.has(stored.job.status))ociSession.timer=setTimeout(()=>ociBusy(ociReadJob),4000);}
      if(stored.reconciliation_required)ociMessage('connection-status','A execução precisa de reconciliação pelo administrador. Consulte o Console OCI.',true);
    }
  }
}
function ociRandom() {
  const bytes=crypto.getRandomValues(new Uint8Array(32));return ociBase64Url(bytes);
}
function ociBase64Url(bytes) {return btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');}
async function ociOidcMetadata(issuer, discoveryUrl) {
  const url=new URL(discoveryUrl||issuer.replace(/\/$/,'')+'/.well-known/openid-configuration');
  if(new URL(issuer).protocol!=='https:'||url.protocol!=='https:'||url.username||url.password||url.hash)throw Error('O login exige um emissor HTTPS.');
  const response=await fetch(url.href,{credentials:'omit',redirect:'error',signal:AbortSignal.timeout(15000)});
  if(!response.ok)throw Error('Não foi possível consultar o login corporativo.');
  const metadata=await response.json();
  if(metadata.issuer!==issuer)throw Error('Emissor do login incompatível com a configuração.');
  for(const key of ['authorization_endpoint','token_endpoint']){
    const endpoint=new URL(metadata[key]);if(endpoint.protocol!=='https:'||endpoint.origin!==url.origin||endpoint.username||endpoint.password||endpoint.hash)throw Error('Endpoint de login inválido.');
  }
  return metadata;
}
async function ociStartLogin() {
  const generation=ociSession.generation;
  if(!['https:','http:'].includes(location.protocol)||!window.isSecureContext)throw Error('Abra o Studio por HTTPS ou localhost para entrar.');
  const config=ociSession.config, issuer=config.oidc_issuer, clientId=config.oidc_client_id;
  if(!issuer||!clientId)throw Error('Login corporativo não configurado no servidor.');
  const discoveryUrl=config.oidc_discovery_url||issuer.replace(/\/$/,'')+'/.well-known/openid-configuration';
  const metadata=await ociOidcMetadata(issuer,discoveryUrl), verifier=ociRandom(), state=ociRandom();
  const redirect=location.origin+location.pathname,challenge=ociBase64Url(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(verifier))));
  if(generation!==ociSession.generation)throw Error('Conexão encerrada.');
  sessionStorage.setItem('oci_studio_oauth_pending',JSON.stringify({base:ociSession.base,issuer,discoveryUrl,clientId,verifier,state,redirect,created:Date.now()}));
  const url=new URL(metadata.authorization_endpoint);url.search=new URLSearchParams({client_id:clientId,response_type:'code',redirect_uri:redirect,scope:config.oidc_scopes||'openid profile',state,code_challenge:challenge,code_challenge_method:'S256'}).toString();
  location.assign(url.href);
}
async function ociCompleteLogin() {
  const query=new URLSearchParams(location.search);if(!query.has('code')&&!query.has('error'))return;
  const stored=sessionStorage.getItem('oci_studio_oauth_pending');if(!stored)return;
  sessionStorage.removeItem('oci_studio_oauth_pending');
  history.replaceState(null,'',location.pathname+'#integration');showPage('integration');
  const pending=JSON.parse(stored);
  if(query.get('state')!==pending.state||Date.now()-pending.created>600000)throw Error('Login expirado ou inválido. Entre novamente.');
  if(query.has('error'))throw Error('Login não concluído.');
  ociSession.base=ociApiBase(pending.base);ociElement('api-url').value=ociSession.base;
  ociSession.config=await ociRequest('/api/config',{publicRequest:true});
  const discoveryUrl=ociSession.config.oidc_discovery_url||ociSession.config.oidc_issuer.replace(/\/$/,'')+'/.well-known/openid-configuration';
  if(ociSession.config.oidc_issuer!==pending.issuer||ociSession.config.oidc_client_id!==pending.clientId||discoveryUrl!==pending.discoveryUrl)throw Error('Configuração de login alterada.');
  const metadata=await ociOidcMetadata(pending.issuer,discoveryUrl);
  const response=await fetch(metadata.token_endpoint,{method:'POST',credentials:'omit',redirect:'error',headers:{'Content-Type':'application/x-www-form-urlencoded'},
    body:new URLSearchParams({grant_type:'authorization_code',client_id:pending.clientId,code:query.get('code'),redirect_uri:pending.redirect,code_verifier:pending.verifier}),signal:AbortSignal.timeout(15000)});
  const tokens=await response.json();if(!response.ok||!tokens.access_token)throw Error('Não foi possível concluir o login.');
  ociSession.token=tokens.access_token;await ociLoadConnection();
}
async function ociReadJob() {
  if(!ociSession.job)return;
  const architecture=ociSession.architecture,id=ociSession.job.id;
  const job=await ociRequest('/api/architectures/'+encodeURIComponent(architecture)+'/jobs/'+encodeURIComponent(id));
  ociSession.job=job;ociShowJob();
  if(!OCI_TERMINAL.has(job.status))ociSession.timer=setTimeout(()=>ociBusy(ociReadJob),4000);
}
function ociShowJob() {
  const job=ociSession.job;if(!job)return;
  ociMessage('job-status',job.operation+' · '+job.status,['FAILED','CANCELED','CANCELLED'].includes(job.status));
  ociElement('job-id').textContent=job.id;
  const consoleLink=ociElement('console');consoleLink.hidden=true;consoleLink.removeAttribute('href');
  if(job.console_url){
    try{const url=new URL(job.console_url);if(url.protocol==='https:'&&url.hostname==='cloud.oracle.com'&&!url.username&&!url.password){consoleLink.href=url.href;consoleLink.hidden=false;}}catch{}
  }
  ociElement('log-warning').hidden=!(job.logs_truncated||job.review_ready===false&&job.status==='SUCCEEDED');
  const logs=Array.isArray(job.logs)?job.logs:[];
  ociElement('job-logs').textContent=logs.map(row=>typeof row==='string'?row:JSON.stringify(row)).join('\n')||'—';
  renderOciIntegration();
}
async function ociCreatePlan() {
  clearTimeout(ociSession.timer);
  if(!s.integrationId){s.integrationId=crypto.randomUUID();save();}
  s.region=ociElement('region').value;s.compartmentId=ociElement('compartment').value;save();
  const payload=ociPayload(),architecture=s.integrationId;
  ociSession.snapshot='';ociElement('confirm-apply').checked=false;
  const job=await ociRequest('/api/architectures/'+architecture+'/plan',{method:'POST',body:payload});
  ociSession.architecture=architecture;ociSession.bound=true;ociSession.snapshot=JSON.stringify(payload);ociSession.job=job;
  syncRegion();renderPlan();ociShowJob();await ociReadJob();
}
async function ociApplyPlan() {
  if(!ociElement('confirm-apply').checked||ociSession.snapshot!==JSON.stringify(ociPayload())||ociSession.architecture!==s.integrationId)
    throw Error('O projeto mudou. Gere e revise um novo plano.');
  const planId=ociSession.job.id;ociSession.snapshot='';ociElement('confirm-apply').checked=false;
  ociSession.job=await ociRequest('/api/architectures/'+ociSession.architecture+'/apply',{method:'POST',body:{plan_job_id:planId,confirmation:'APPLY'}});
  ociShowJob();await ociReadJob();
}
function initializeOciIntegration() {
  try{ociElement('api-url').value=localStorage.getItem('oci_studio_api_url')||'';}catch{}
  ociElement('connect').addEventListener('click',()=>{
    const token=ociElement('access-token').value.trim();ociElement('access-token').value='';
    ociBusy(async()=>{
      const base=ociApiBase(ociElement('api-url').value.trim());ociDisconnect();ociSession.busy=true;ociSession.base=base;
      try{localStorage.setItem('oci_studio_api_url',base);}catch{}
      ociSession.config=await ociRequest('/api/config',{publicRequest:true});
      if(ociSession.config.auth_mode==='oidc')return ociStartLogin();
      if(!token)throw Error('Informe o token de acesso da API.');
      ociSession.token=token;await ociLoadConnection();
    });
  });
  ociElement('disconnect').addEventListener('click',ociDisconnect);
  ociElement('new-architecture').addEventListener('click',()=>{
    if(!confirm(translateUiText('Criar outra associação? Os recursos existentes continuam na OCI e uma nova implantação pode gerar custos adicionais.')))return;
    clearTimeout(ociSession.timer);s.integrationId='';save();
    Object.assign(ociSession,{architecture:'',bound:false,job:null,snapshot:''});
    ociElement('job-logs').textContent='—';ociElement('job-id').textContent='';ociElement('console').hidden=true;
    ociElement('log-warning').hidden=true;ociMessage('job-status','Nenhuma execução nesta sessão.');renderOciIntegration();
  });
  ociElement('plan').addEventListener('click',()=>ociBusy(ociCreatePlan));
  ociElement('apply').addEventListener('click',()=>ociBusy(ociApplyPlan));
  ociElement('refresh').addEventListener('click',()=>{clearTimeout(ociSession.timer);ociBusy(ociReadJob);});
  ociElement('confirm-apply').addEventListener('change',renderOciIntegration);
  for(const id of ['region','compartment'])ociElement(id).addEventListener('change',()=>{ociElement('confirm-apply').checked=false;renderOciIntegration();});
  ociElement('api-url').addEventListener('input',()=>{if(ociSession.connection)ociDisconnect();});
  window.addEventListener('pagehide',ociDisconnect);
  renderOciIntegration();
  ociBusy(ociCompleteLogin);
}
initializeOciIntegration();
