from pathlib import Path
import os,json,subprocess,tempfile,shutil,base64,concurrent.futures
root=Path(__file__).resolve().parents[1]/'work';cases=json.loads((root/'cli-cases.json').read_text());schemas=json.loads((root/'oci-cli-schemas.json').read_text());all_calls=[];results=[]
mock='''#!/usr/bin/env python3
import os,sys,json,pathlib
args=sys.argv[1:];idx=args.index('--from-json');cmd=' '.join(args[:idx]);file=args[idx+1][7:];payload=json.load(open(file));log=pathlib.Path(os.environ['OCI_MOCK_LOG']);calls=json.loads(log.read_text()) if log.exists() else [];calls.append({'command':cmd,'payload':payload,'args':args,'region':os.environ.get('OCI_CLI_REGION'),'mode':os.stat(file).st_mode&0o777});log.write_text(json.dumps(calls));query=args[args.index('--query')+1] if '--query' in args else None
if cmd=='os ns get':value='testnamespace'
elif cmd=='compute vnic-attachment list':value='ocid1.vnic.oc1.test'
elif cmd=='network private-ip list':value='ocid1.privateip.oc1.test'
elif query=='data.name':value=payload['name']
else:value='ocid1.mock.oc1.resource'+str(len(calls))
if query:print(value)
else:print(json.dumps({'data':{'id':value}}))
'''
with tempfile.TemporaryDirectory(prefix='oci-cli-verify-') as folder:
 folder=Path(folder);binpath=folder/'bin';binpath.mkdir();(binpath/'oci').write_text(mock);(binpath/'oci').chmod(0o755)
 for name,entry in cases.items():
  script=root/'cli-validation'/f'{name}.sh';syntax=subprocess.run(['bash','-n',str(script)],capture_output=True,text=True);assert syntax.returncode==0,(name,syntax.stderr)
  log=folder/(name+'.json');env=os.environ.copy();env.update(PATH=str(binpath)+os.pathsep+env['PATH'],OCI_MOCK_LOG=str(log))
  if name=='seeded':env.update(COMPARTMENT_OCID='ocid1.compartment.oc1.wrong',OCI_CLI_REGION='us-ashburn-1')
  for var in entry['generated']['variables']:
   value='ocid1.compartment.oc1.test'
   if var=='IAM_HOME_REGION':value='sa-saopaulo-1'
   elif 'AVAILABILITY_DOMAIN' in var:value='test:AD-1'
   elif 'SSH_PUBLIC_KEY' in var:value='ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIExampleTestOnly test'
   elif 'KUBERNETES_VERSION' in var:value='v1.34.1'
   elif 'MANAGEMENT_ENDPOINT' in var:value='https://test-management.kms.oraclecloud.com'
   elif 'ADMIN_PASSWORD' in var:value='TEST_ONLY_Example9#'
   elif 'IMAGE_OCID' in var:value='ocid1.image.oc1.test'
   elif var.startswith('IAM_'):value='CloudArchitects'
   env[var]=value
  run=subprocess.run(['bash',str(script)],cwd=folder,env=env,capture_output=True,text=True);assert run.returncode==0,(name,run.stderr[-1500:]);assert not (folder/'CLI_INJECTION').exists()
  calls=json.loads(log.read_text());assert len(calls)==len(entry['generated']['operations']),name
  for call in calls:
   assert call['mode']==0o600,(name,'payload permissions')
   allowed=schemas[call['command']];assert 'ERROR' not in allowed,call['command'];unknown=set(call['payload'])-set(allowed);assert not unknown,(name,call['command'],unknown)
   if '--wait-for-state' in call['args']:assert call['args'][call['args'].index('--wait-for-state')+1] in allowed['waitForState'][0].split('|'),call['command']
   if call['command']=='compute instance launch' and 'metadata' in call['payload']:
    metadata=call['payload']['metadata'];data=base64.b64decode(metadata['user_data']).decode() if 'user_data' in metadata else ''
    if data.startswith('#cloud-config\n'):
     cfg=json.loads(data.split('\n',1)[1]);assert cfg.get('ssh_pwauth') is False
     if cfg.get('users'):assert cfg['users'][1]['ssh_authorized_keys'][0]==metadata['ssh_authorized_keys']
   assert not Path(call['args'][call['args'].index('--from-json')+1][7:]).exists(),(name,'temporary payload not removed');all_calls.append(call)
  if name=='seeded':assert calls[0]['region']=='sa-vinhedo-1';assert calls[0]['payload']['compartmentId']=='ocid1.compartment.oc1.declared'
  if name=='dependencies':
   sequence=[x['command'] for x in calls];assert sequence.index('network vcn create')<sequence.index('network service-gateway create')<sequence.index('network route-table create')<sequence.index('network subnet create')<sequence.index('compute instance launch');assert any(x['command']=='network public-ip update' for x in calls);assert "$(touch CLI_INJECTION)" in next(x for x in calls if x['command']=='network vcn create')['payload']['displayName']
  results.append({'case':name,'commands':len(calls),'valid':True})
 # Missing required inputs must stop before the first command.
 env=os.environ.copy();env.update(PATH=str(binpath)+os.pathsep+env['PATH'],OCI_MOCK_LOG=str(folder/'missing.json'));env.pop('COMPARTMENT_OCID',None)
 missing=subprocess.run(['bash',str(root/'cli-validation/vcn.sh')],env=env,capture_output=True,text=True);assert missing.returncode!=0;assert not (folder/'missing.json').exists()
 # Validate actual OCI CLI argument processing with a client stub and sockets disabled.
 unique={}
 for call in all_calls:unique.setdefault(call['command'],call)
 def probe(pair):
  cmd,call=pair;file=folder/(cmd.replace(' ','-')+'.json');file.write_text(json.dumps(call['payload']));args=list(call['args']);args[args.index('--from-json')+1]='file://'+str(file)
  r=subprocess.run([str(root/'oci-cli-env/bin/python'),str(Path(__file__).with_name('oci-cli-offline-probe.py')),*args],capture_output=True,text=True)
  return {'command':cmd,'valid':r.returncode==0,'error':r.stderr[-1400:] if r.returncode else ''}
 with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:probes=list(pool.map(probe,unique.items()))
 for item in probes:print(item['command'],item['valid'],item['error'],flush=True)
 report={'cases':results,'commands':len(all_calls),'officialCliVersion':'3.95.1','probes':probes};(root/'oci-cli-validation-results.json').write_text(json.dumps(report,indent=2));assert all(x['valid'] for x in probes)
print('PASS',len(results),'scripts;',len(all_calls),'mock commands;',len(probes),'official CLI command paths; no OCI calls')
