"""Validate backend TFJSON with an installed OCI provider; never init/plan/apply.

Run with the backend virtualenv and provide an existing initialized directory:
  python tests/validate-backend-terraform.py --terraform /path/to/terraform \
      --provider-dir /path/to/initialized-directory
The script only runs `terraform validate -json`, using the existing provider files.
"""
import argparse
from copy import deepcopy
import json
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'backend'))
from studio_api.settings import Settings
from studio_api.terraform import compile_state, TYPES


def fixtures():
    """Read current UI defaults in Chromium without contacting external services."""
    script = r"""
const {chromium}=require('playwright'),fs=require('fs');
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
try{const page=await browser.newPage();await page.route('https://studio.test/**',r=>r.fulfill({contentType:'text/html',body:fs.readFileSync('index.html','utf8')}));
await page.goto('https://studio.test/');console.log(JSON.stringify(await page.evaluate(()=>Object.fromEntries(Object.keys(TYPES).map(type=>[type,initialValues(type)])))));
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
"""
    result = subprocess.run(['node', '-e', script], cwd=ROOT, capture_output=True, text=True, check=True)
    defaults = json.loads(result.stdout)
    comp = 'ocid1.compartment.oc1..aaaaaaaaaaaaaaaa'
    settings = Settings(regions=('sa-saopaulo-1',), compartments={comp: 'Offline test'})

    def resource(kind):
        value = deepcopy(defaults[kind])
        if kind in ('subnet', 'nsg', 'igw', 'nat', 'route'):
            value['vcn'] = 'r_vcn'
        if kind == 'route':
            value['target'] = 'r_igw'
        if kind in ('compute', 'volume'):
            value['ad'] = 'example:SA-SAOPAULO-1-AD-1'
        if kind == 'compute':
            value.update(subnet='r_subnet', imageId='ocid1.image.oc1.sa-saopaulo-1.aaaaaaaaaaaaaaaa',
                         configureUser=False, bootstrapEnabled=False, winBootstrapEnabled=False,
                         guestOs='LINUX', publicIp='none', shape='VM.Standard.E4.Flex',
                         nsgIds='', reservedPublicIp='', kmsKey='', ocpus=2, memory=16)
        return {'id': 'r_' + kind, 'type': kind, 'name': kind + '-test', 'values': value}

    cases = {}
    for kind in TYPES:
        kinds = ['vcn'] if kind in ('subnet', 'nsg', 'igw', 'nat', 'route', 'compute') else []
        if kind == 'route':
            kinds.append('igw')
        if kind == 'compute':
            kinds.append('subnet')
        kinds.append(kind)
        cases[kind] = {'projectName': 'offline-validation', 'compartmentId': comp,
                       'region': 'sa-saopaulo-1', 'includeIam': False,
                       'createTagSchema': False, 'tags': [],
                       'resources': [resource(k) for k in kinds]}
    for protocol in ('17', 'all'):
        case = deepcopy(cases['nsg'])
        case['resources'][-1]['values']['protocol'] = protocol
        cases['nsg-' + protocol] = case
    for tier in ('Standard', 'InfrequentAccess', 'Archive'):
        for versioning in ('Enabled', 'Disabled'):
            case = deepcopy(cases['bucket'])
            case['resources'][0]['values'].update(tier=tier, versioning=versioning, namespace='examplenamespace')
            cases['bucket-' + tier + '-' + versioning] = case
    for vpus in (0, 120):
        case = deepcopy(cases['volume'])
        case['resources'][0]['values']['vpus'] = vpus
        cases['volume-' + str(vpus)] = case
    all_types = deepcopy(cases['vcn'])
    all_types['resources'] = [resource(k) for k in TYPES]
    next(r for r in all_types['resources'] if r['type'] == 'subnet')['values']['routeTable'] = 'r_route'
    all_types['tags'] = [{'kind': 'freeform', 'key': 'Environment', 'value': 'test'}]
    cases['all-supported-types'] = all_types
    nat_route = deepcopy(cases['route'])
    nat_route['resources'][1] = resource('nat')
    nat_route['resources'][2]['values']['target'] = 'r_nat'
    cases['route-nat'] = nat_route
    internal_nsg = deepcopy(cases['compute'])
    internal_nsg['resources'].insert(2, resource('nsg'))
    internal_nsg['resources'][-1]['values']['nsgIds'] = 'r_nsg'
    cases['compute-internal-nsg'] = internal_nsg
    literal = deepcopy(cases['vcn'])
    literal['resources'][0]['name'] = '${file("/etc/passwd")} %{ if true }literal%{ endif }'
    literal['tags'] = [{'kind': 'freeform', 'key': '${var.key}', 'value': '${var.value}'}]
    cases['literal-template-openers'] = literal
    return cases, settings


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--terraform', default=shutil.which('terraform'))
    parser.add_argument('--provider-dir', type=Path, required=True)
    parser.add_argument('--report', type=Path, default=ROOT / 'work/backend-terraform-results.json')
    args = parser.parse_args()
    if not args.terraform:
        parser.error('Provide --terraform or install Terraform on PATH')
    installed = args.provider_dir.resolve()
    if not (installed / '.terraform/providers').is_dir() or not (installed / '.terraform.lock.hcl').is_file():
        parser.error('--provider-dir must contain .terraform/providers and .terraform.lock.hcl')
    cases, settings = fixtures()
    results = []
    with tempfile.TemporaryDirectory(prefix='studio-backend-tf-') as tmp:
        for name, state in cases.items():
            case = Path(tmp) / name
            case.mkdir()
            (case / '.terraform').symlink_to(installed / '.terraform', target_is_directory=True)
            shutil.copyfile(installed / '.terraform.lock.hcl', case / '.terraform.lock.hcl')
            compiled = compile_state(state, settings)
            (case / 'main.tf.json').write_text(json.dumps(compiled, indent=2))
            for sl in compiled['resource'].get('oci_core_security_list', {}).values():
                assert sl['ingress_security_rules'] == [] and sl['egress_security_rules'] == []
            for subnet in compiled['resource'].get('oci_core_subnet', {}).values():
                assert subnet.get('security_list_ids') and subnet.get('route_table_id')
            if name == 'compute-internal-nsg':
                vnic = compiled['resource']['oci_core_instance']['r_compute']['create_vnic_details']
                assert vnic['nsg_ids'] == ['${oci_core_network_security_group.r_nsg.id}']
            p = subprocess.run([args.terraform, '-chdir=' + str(case), 'validate', '-json'],
                               capture_output=True, text=True)
            try:
                result = json.loads(p.stdout)
            except json.JSONDecodeError:
                result = {'valid': False, 'diagnostics': [{'summary': p.stderr[-3000:]}]}
            result['case'] = name
            results.append(result)
            print(name, 'PASS' if result.get('valid') else 'FAIL', flush=True)
            if not result.get('valid'):
                print(json.dumps(result.get('diagnostics'), indent=2), flush=True)
    args.report.parent.mkdir(parents=True, exist_ok=True)
    args.report.write_text(json.dumps(results, indent=2))
    print(f'{sum(bool(r.get("valid")) for r in results)}/{len(results)} configurations validated; no init/plan/apply or OCI calls')
    if not all(r.get('valid') for r in results):
        raise SystemExit(1)


if __name__ == '__main__':
    main()
