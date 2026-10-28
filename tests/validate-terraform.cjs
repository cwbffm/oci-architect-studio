// Offline provider validation. First initialize TF_VALIDATION_DIR with oracle/oci;
// then run TERRAFORM=/path/to/terraform TF_VALIDATION_DIR=/path/to/dir node tests/validate-terraform.cjs.
// No plan/apply, credentials, state refresh or OCI API calls are used.
const {chromium}=require('playwright');
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),{spawnSync}=require('child_process');
const root=path.resolve(__dirname,'..'),binary=process.env.TERRAFORM||'terraform';
const target=path.resolve(process.env.TF_VALIDATION_DIR||path.join(root,'work','terraform-validation'));
function run(args){const result=spawnSync(binary,['-chdir='+target,...args],{encoding:'utf8',maxBuffer:16*1024*1024});if(result.error)throw result.error;return result;}
(async()=>{
 fs.mkdirSync(target,{recursive:true});
 if(!fs.existsSync(path.join(target,'.terraform')))throw Error('Initialize an isolated TF_VALIDATION_DIR with terraform init -backend=false before running this test.');
 if(fs.readdirSync(target).some(name=>name.endsWith('.tf')&&name!=='main.tf'))throw Error('TF_VALIDATION_DIR must be isolated; found other Terraform configurations.');
 const version=JSON.parse(run(['version','-json']).stdout);
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 let cases;
 try{
  const page=await browser.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.route('https://studio.test/**',route=>route.fulfill({contentType:'text/html',body:fs.readFileSync(process.env.STUDIO_HTML||path.join(root,'index.html'),'utf8')}));
  await page.goto('https://studio.test/');
  cases=await page.evaluate(()=>{
   const out={};
   function one(name,type,values={},configure=()=>{}){const state=defaults();state.includeIam=true;state.resources=[newResource(type,{...initialValues(type),...values})];configure(state);out[name]=generateTerraform(state).code;}
   for(const type of Object.keys(TYPES).filter(type=>type!=='universal'))one('native-'+type,type);
   one('compute-windows-native','compute',{image:'custom',guestOs:'WINDOWS',vmLicense:'NATIVE',winBootstrapEnabled:true});
   one('compute-windows-byol','compute',{image:'custom',guestOs:'WINDOWS',vmLicense:'BYOL',imageOrigin:'CUSTOM',winBootstrapEnabled:true});
   one('compute-linux-user','compute',{configureUser:true,linuxUsername:'cloudadmin'});
   one('compute-linux-bootstrap','compute',{bootstrapEnabled:true});
   one('compute-reserved-ip','compute',{publicIp:'reserved',reservedPublicIp:'ocid1.publicip.oc1.test'});
   one('compute-kms-nsg','compute',{kmsKey:'ocid1.key.oc1.test',nsgIds:'ocid1.networksecuritygroup.oc1.test'});
   one('compute-fixed-shape','compute',{shape:'VM.Standard2.1'});
   one('compute-arm-flex','compute',{shape:'VM.Standard.A1.Flex',ocpus:2,memory:12});
   for(const protocol of ['6','17','all'])one('nsg-'+protocol,'nsg',{protocol});
   for(const tier of ['Standard','Archive'])for(const versioning of ['Enabled','Disabled'])one('bucket-'+tier+'-'+versioning,'bucket',{tier,versioning});
   one('lb-public-reserved','lb',{private:'false',reservedPublicIp:'ocid1.publicip.oc1.test'});
   one('volume-kms','volume',{kmsKey:'ocid1.key.oc1.test'});
   one('defined-tags','vcn',{},state=>{state.createTagSchema=true;state.tags.push({kind:'defined',namespace:'Governance',key:'CostCenter',value:'IT'});});
   one('universal-manual','universal',{tfType:'oci_core_vcn',hcl:'compartment_id = var.compartment_ocid\ncidr_blocks = ["10.0.0.0/16"]',policies:''});
   const state=defaults(),vcn=newResource('vcn',initialValues('vcn')),gateway=newResource('sgw',{...initialValues('sgw'),vcn:vcn.id}),route=newResource('route',{...initialValues('route'),vcn:vcn.id,target:gateway.id,destinationType:'SERVICE_CIDR_BLOCK',destination:'all-gru-services-in-oracle-services-network'}),subnet=newResource('subnet',{...initialValues('subnet'),vcn:vcn.id,routeTable:route.id}),compute=newResource('compute',{...initialValues('compute'),subnet:subnet.id});
   state.resources=[compute,subnet,route,gateway,vcn];out['dependencies-reversed']=generateTerraform(state).code;
   for(const mode of ['STATEFUL','STATELESS'])for(const protocol of ['TCP','UDP','ICMP']){const network=defaults();network.network.securityMode=mode;network.network.protocol=protocol;out['network-'+mode+'-'+protocol]=networkTerraform(network);}
   out['policy-independent-placeholders']=policyTerraform(state,policies(state));
   state.compartmentId='ocid1.compartment.oc1.test';state.iam.policyCompartment='ocid1.tenancy.oc1.test';out['policy-independent-explicit']=policyTerraform(state,policies(state));
   return out;
  });
  assert.deepEqual(errors,[]);
 }finally{await browser.close();}
 const results=[];
 for(const [name,code]of Object.entries(cases)){
  if(!name.startsWith('policy-independent'))assert(!code.includes('resource "oci_identity_policy"'),name+' must not bundle IAM policies');
  fs.writeFileSync(path.join(target,'main.tf'),code);
  const result=run(['validate','-json']);let report;
  try{report=JSON.parse(result.stdout);}catch{throw Error(name+': '+result.stderr);}
  results.push({case:name,...report});
  console.log(name,report.valid?'PASS':'FAIL',report.diagnostics.filter(d=>d.severity==='error').map(d=>d.summary+': '+d.detail).join('\n'));
 }
 const output={terraformVersion:version.terraform_version,providerVersions:version.provider_selections,cases:results,scope:'Static Terraform/provider validation only. No plan, apply or OCI API requests.'};
 fs.writeFileSync(path.join(root,'work','terraform-validation-results.json'),JSON.stringify(output,null,2));
 assert(results.every(result=>result.valid),'Terraform validation failed; see work/terraform-validation-results.json');
 console.log('PASS',results.length,'Terraform cases; Terraform',output.terraformVersion,JSON.stringify(output.providerVersions));
})().catch(error=>{console.error(error);process.exitCode=1;});
