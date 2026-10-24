import subprocess,json,concurrent.futures
from pathlib import Path
root=Path(__file__).resolve().parents[1]/'work'
commands=['compute instance launch','network vcn create','network subnet create','network nsg create','network nsg rules add','network route-table create','network drg create','network drg-attachment create','network internet-gateway create','network nat-gateway create','network service-gateway create','bv volume create','os bucket create','lb load-balancer create','db autonomous-database create','ce cluster create','kms management vault create','kms management key create','fs file-system create','dns zone create','logging log-group create','ons topic create','compute dedicated-vm-host create','compute vnic-attachment list','network private-ip list','network public-ip update','os ns get','iam policy create','iam tag-namespace create','iam tag create']
def run(command):
 args=command.split()+(['--namespace-name','offline-validation'] if command=='os bucket create' else [])
 r=subprocess.run([str(root/'oci-cli-env/bin/oci'),*args,'--generate-full-command-json-input'],capture_output=True,text=True)
 try:return command,json.loads(r.stdout)
 except:return command,{'ERROR':r.stderr[-500:]}
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:out=dict(pool.map(run,commands))
(root/'oci-cli-schemas.json').write_text(json.dumps(out,indent=2))
for cmd,data in out.items():print(cmd, 'ERROR '+str(data) if 'ERROR' in data else 'wait='+str(data.get('waitForState'))+' keys='+','.join(data.keys()),flush=True)
