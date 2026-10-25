import base64
import io
import json
from copy import deepcopy
from types import SimpleNamespace
from uuid import uuid4
import zipfile

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient

from studio_api.main import create_app
from studio_api.settings import Settings
from studio_api.terraform import compile_state
from studio_api.auth import Authenticator

COMP = 'ocid1.compartment.oc1..aaaaaaaaaaaaaaaa'
TOKEN = 'a' * 48


class FakeOCI:
    def __init__(self):
        self.created = 0
        self.updated = 0
        self.jobs = {}
        self.fail = False
        self.etag = 'v1'
        self.payload = None

    def connection(self):
        if self.fail:
            raise RuntimeError('private details must not escape')

    def create_stack(self, region, compartment, name, payload, token):
        self.created += 1
        self.payload = payload
        if self.fail:
            raise RuntimeError('private details must not escape')
        return 'ocid1.ormstack.oc1..stack'

    def stack_etag(self, region, stack):
        return self.etag

    def update_stack(self, region, stack, payload):
        self.updated += 1
        self.etag += '-new'
        self.payload = payload

    def create_job(self, region, stack, operation, token, plan_id=None):
        if self.fail:
            raise RuntimeError('private details must not escape')
        job = SimpleNamespace(id='ocid1.ormjob.oc1..' + str(uuid4()), stack_id=stack,
                              operation=operation, lifecycle_state='ACCEPTED')
        self.jobs[job.id] = job
        return job

    def get_job(self, region, job_id):
        return self.jobs[job_id]

    def assert_no_active_jobs(self, region, stack):
        for job in self.jobs.values():
            if job.stack_id == stack and job.lifecycle_state in ('ACCEPTED', 'IN_PROGRESS', 'CANCELING'):
                raise HTTPException(409, 'Remote job active')

    def logs(self, region, job_id):
        return {'lines': ['<b>plain text log</b>'], 'truncated': False}


@pytest.fixture
def settings(tmp_path):
    return Settings(api_token=TOKEN, regions=('sa-saopaulo-1',), compartments={COMP: 'Development'},
                    database_path=str(tmp_path / 'private' / 'studio.sqlite3'),
                    allowed_origins=('https://studio.example',))


@pytest.fixture
def state():
    return {'projectName': 'Test', 'region': 'sa-saopaulo-1', 'compartmentId': COMP,
            'includeIam': False, 'createTagSchema': False, 'tags': [],
            'resources': [{'id': 'r_vcn', 'name': 'Private', 'type': 'vcn',
                           'values': {'cidr': '10.0.0.0/16', 'dns': 'private'}}]}


@pytest.fixture
def system(settings):
    fake = FakeOCI()
    app = create_app(settings, fake)
    client = TestClient(app)
    client.headers['Authorization'] = 'Bearer ' + TOKEN
    return client, fake, app


def test_configuration_fails_closed(tmp_path):
    with pytest.raises(ValueError, match='TOKEN'):
        create_app(Settings(database_path=str(tmp_path/'no.sqlite')))


def test_public_config_and_auth(system):
    client, fake, app = system
    public = client.get('/api/config', headers={'Authorization': ''})
    assert public.status_code == 200
    assert TOKEN not in public.text
    assert public.json()['supported_types']
    assert client.get('/api/connection', headers={'Authorization': ''}).status_code == 401
    assert client.get('/api/connection', headers={'Authorization': 'Bearer wrong'}).status_code == 401
    assert client.get('/api/connection').json()['compartments'] == [{'id': COMP, 'name': 'Development'}]
    assert public.headers['cache-control'] == 'no-store'


def test_cors_exact_origin(system):
    client, *_ = system
    assert client.get('/api/config', headers={'Origin': 'https://evil.example'}).headers.get('access-control-allow-origin') is None
    assert client.get('/api/config', headers={'Origin': 'https://studio.example'}).headers['access-control-allow-origin'] == 'https://studio.example'


def test_plan_apply_state_reuse_and_no_duplicate_apply(system, state):
    client, fake, app = system
    aid = str(uuid4())
    path = '/api/architectures/' + aid
    plan = client.post(path + '/plan', json={'state': state})
    assert plan.status_code == 200, plan.text
    pid = plan.json()['id']
    assert fake.created == 1
    assert client.post(path+'/plan', json={'state': state}).status_code == 409
    assert client.post(path+'/apply', json={'plan_job_id': pid, 'confirmation': 'APPLY'}).status_code == 409
    fake.jobs[pid].lifecycle_state = 'SUCCEEDED'
    assert client.post(path+'/apply', json={'plan_job_id': pid, 'confirmation': 'yes'}).status_code == 422
    result = client.post(path+'/apply', json={'plan_job_id': pid, 'confirmation': 'APPLY'})
    assert result.status_code == 200, result.text
    apply_id = result.json()['id']
    assert result.json()['operation'] == 'APPLY'
    again = client.post(path+'/apply', json={'plan_job_id': pid, 'confirmation': 'APPLY'})
    assert again.json()['id'] == apply_id
    assert len(fake.jobs) == 2
    logs = client.get(path+'/jobs/'+apply_id)
    assert logs.status_code == 200
    assert logs.json()['logs'] == ['<b>plain text log</b>']
    fake.jobs[apply_id].lifecycle_state = 'SUCCEEDED'
    changed = deepcopy(state)
    changed['resources'][0]['name'] = 'Changed'
    second = client.post(path+'/plan', json={'state': changed})
    assert second.status_code == 200, second.text
    assert fake.created == 1 and fake.updated == 1
    assert client.post(path+'/apply', json={'plan_job_id': pid, 'confirmation': 'APPLY'}).status_code == 409


def test_stack_tamper_blocks_apply(system, state):
    client, fake, _ = system
    path = '/api/architectures/' + str(uuid4())
    pid = client.post(path+'/plan', json={'state': state}).json()['id']
    fake.jobs[pid].lifecycle_state = 'SUCCEEDED'
    fake.etag = 'modified-outside-studio'
    result = client.post(path+'/apply', json={'plan_job_id': pid, 'confirmation': 'APPLY'})
    assert result.status_code == 409
    assert len(fake.jobs) == 1


def test_ownership_and_job_isolation(system, state):
    client, fake, app = system
    aid = str(uuid4())
    path = '/api/architectures/' + aid
    pid = client.post(path+'/plan', json={'state': state}).json()['id']
    with app.state.workflow.db() as conn:
        conn.execute('UPDATE architectures SET owner=? WHERE id=?', ('other-user', aid))
    assert client.post(path+'/plan', json={'state': state}).status_code == 404
    assert client.get(path+'/jobs/'+pid).status_code == 404
    assert client.post(path+'/apply', json={'plan_job_id': pid, 'confirmation': 'APPLY'}).status_code == 404
    assert client.get('/api/architectures/'+str(uuid4())+'/jobs/'+pid).status_code == 404


def test_ambiguous_create_is_not_repeated(system, state):
    client, fake, app = system
    path = '/api/architectures/' + str(uuid4())
    fake.fail = True
    result = client.post(path+'/plan', json={'state': state})
    assert result.status_code == 502
    assert 'private details' not in result.text
    fake.fail = False
    assert client.post(path+'/plan', json={'state': state}).status_code == 409
    assert fake.created == 1


def test_payload_size_and_unknown_fields(system, state):
    client, *_ = system
    path = '/api/architectures/' + str(uuid4()) + '/plan'
    assert client.post(path, content='x'*1_000_001).status_code == 413
    assert client.post(path, json={'state': state, 'hcl': 'danger'}).status_code == 422


@pytest.mark.parametrize('edit', [
    lambda s: s.update(includeIam=True),
    lambda s: s.update(createTagSchema=True),
    lambda s: s.update(compartmentId='ocid1.compartment.oc1..unauthorized'),
    lambda s: s.update(region='us-ashburn-1'),
    lambda s: s['resources'][0].update(type='universal'),
    lambda s: s['resources'][0]['values'].update(compartmentId='ocid1.compartment.oc1..other'),
    lambda s: s['resources'][0]['values'].update(cidr='10.0.0.1/16'),
    lambda s: s['resources'].append(deepcopy(s['resources'][0])),
    lambda s: s.update(tags=[{'kind': 'defined', 'key': 'Owner', 'value': 'me'}]),
])
def test_unsafe_states_are_rejected_before_oci(system, state, edit):
    client, fake, app = system
    edit(state)
    result = client.post('/api/architectures/'+str(uuid4())+'/plan', json={'state': state})
    assert result.status_code == 422, result.text
    assert fake.created == 0 and len(fake.jobs) == 0


def test_terraform_json_templates_cannot_execute(system, state):
    client, fake, app = system
    state['resources'][0]['name'] = '${file("/etc/passwd")} %{if true}secret%{endif}'
    result = client.post('/api/architectures/'+str(uuid4())+'/plan', json={'state': state})
    assert result.status_code == 200
    with zipfile.ZipFile(io.BytesIO(base64.b64decode(fake.payload))) as archive:
        assert archive.namelist() == ['main.tf.json']
        config = json.loads(archive.read('main.tf.json'))
    name = config['resource']['oci_core_vcn']['r_vcn']['display_name']
    assert name == '$${file("/etc/passwd")} %%{if true}secret%%{endif}'
    assert 'provisioner' not in config


def test_subnet_isolation_and_dependency_validation(settings, state):
    state['resources'].append({'id': 'r_subnet', 'name': 'Private subnet', 'type': 'subnet',
                               'values': {'vcn': 'r_vcn', 'cidr': '10.0.1.0/24', 'private': 'true'}})
    config = compile_state(state, settings)
    subnet = config['resource']['oci_core_subnet']['r_subnet']
    assert subnet['security_list_ids'] == ['${oci_core_security_list.r_subnet_security.id}']
    assert subnet['route_table_id'] == '${oci_core_route_table.r_subnet_route.id}'
    assert config['resource']['oci_core_security_list']['r_subnet_security']['ingress_security_rules'] == []
    state['resources'][1]['values']['vcn'] = 'ocid1.vcn.oc1..external'
    with pytest.raises(ValueError, match='dependencies'):
        compile_state(state, settings)


def test_oidc_verifies_signature_audience_expiry_and_authorization(settings, monkeypatch):
    import time
    import jwt
    from cryptography.hazmat.primitives.asymmetric import rsa
    from starlette.requests import Request
    settings.auth_mode = 'oidc'
    settings.oidc_issuer = 'https://issuer.example'
    settings.oidc_jwks_url = 'https://issuer.example/jwks'
    settings.oidc_audience = 'studio-api'
    settings.oidc_client_id = 'studio-browser'
    settings.allowed_subjects = ('allowed',)
    auth = Authenticator(settings)
    key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    monkeypatch.setattr(auth.jwks, 'get_signing_key_from_jwt', lambda token: SimpleNamespace(key=key.public_key()))
    claims = {'iss': settings.oidc_issuer, 'aud': 'studio-api', 'sub': 'allowed', 'iat': int(time.time()), 'exp': int(time.time())+120}
    def request(data):
        token = jwt.encode(data, key, algorithm='RS256')
        return Request({'type': 'http', 'headers': [(b'authorization', ('Bearer '+token).encode())]})
    identity = json.dumps([settings.oidc_issuer, 'allowed'], ensure_ascii=False, separators=(',', ':'))
    import hashlib
    assert auth(request(claims)) == 'oidc:' + hashlib.sha256(identity.encode('utf-8')).hexdigest()
    for bad in ({**claims, 'aud': 'other-api'}, {**claims, 'exp': int(time.time())-120}, {**claims, 'iss': 'https://evil.example'}):
        with pytest.raises(HTTPException) as error:
            auth(request(bad))
        assert error.value.status_code == 401
    with pytest.raises(HTTPException) as error:
        auth(request({**claims, 'sub': 'not-allowed'}))
    assert error.value.status_code == 403


def supported_state():
    return {'projectName': 'Supported', 'region': 'sa-saopaulo-1', 'compartmentId': COMP,
            'includeIam': False, 'createTagSchema': False, 'tags': [{'kind': 'freeform', 'key': 'Owner', 'value': 'Studio'}],
            'resources': [
                {'id': 'r_vcn', 'type': 'vcn', 'name': 'VCN', 'values': {'cidr': '10.0.0.0/16', 'dns': 'private'}},
                {'id': 'r_nsg', 'type': 'nsg', 'name': 'NSG', 'values': {'vcn': 'r_vcn', 'source': '10.0.0.0/16', 'protocol': '6', 'port': 22}},
                {'id': 'r_igw', 'type': 'igw', 'name': 'IGW', 'values': {'vcn': 'r_vcn'}},
                {'id': 'r_nat', 'type': 'nat', 'name': 'NAT', 'values': {'vcn': 'r_vcn'}},
                {'id': 'r_route', 'type': 'route', 'name': 'Route', 'values': {'vcn': 'r_vcn', 'target': 'r_nat', 'destinationType': 'CIDR_BLOCK', 'destination': '0.0.0.0/0'}},
                {'id': 'r_subnet', 'type': 'subnet', 'name': 'Subnet', 'values': {'vcn': 'r_vcn', 'cidr': '10.0.1.0/24', 'private': 'true', 'routeTable': 'r_route'}},
                {'id': 'r_bucket', 'type': 'bucket', 'name': 'studio-test-bucket', 'values': {'tier': 'Standard', 'versioning': 'Enabled'}},
                {'id': 'r_volume', 'type': 'volume', 'name': 'Volume', 'values': {'ad': 'abc:SA-SAOPAULO-1-AD-1', 'size': 50, 'vpus': 10}},
                {'id': 'r_compute', 'type': 'compute', 'name': 'Compute', 'values': {'ad': 'abc:SA-SAOPAULO-1-AD-1', 'shape': 'VM.Standard.E5.Flex', 'ocpus': 2, 'memory': 16, 'bootSize': 50, 'imageId': 'ocid1.image.oc1.sa-saopaulo-1.aaaaaaaaaaaaaa', 'publicIp': 'none', 'guestOs': 'LINUX', 'subnet': 'r_subnet', 'nsgIds': 'r_nsg', 'sshKey': 'ssh-ed25519 AAAABBBB example'}},
                {'id': 'r_drg', 'type': 'drg', 'name': 'DRG', 'values': {}},
            ]}


def test_supported_compiler_variants(settings):
    state = supported_state()
    config = compile_state(state, settings)
    assert len(config['output']) == 10
    assert config['resource']['oci_core_instance']['r_compute']['create_vnic_details']['nsg_ids'] == ['${oci_core_network_security_group.r_nsg.id}']
    assert config['resource']['oci_core_subnet']['r_subnet']['route_table_id'] == '${oci_core_route_table.r_route.id}'
    assert config['resource']['oci_objectstorage_bucket']['r_bucket']['access_type'] == 'NoPublicAccess'


@pytest.mark.parametrize('edit', [
    lambda s: s['resources'][0]['values'].update(cidr=[]),
    lambda s: s.update(tags={}),
    lambda s: s.update(region=[]),
    lambda s: s.update(compartmentId={}),
    lambda s: s['resources'][0].update(values={'arbitrary': {'nested': []}}),
])
def test_malformed_inputs_are_422(system, state, edit):
    client, fake, _ = system
    edit(state)
    response = client.post('/api/architectures/'+str(uuid4())+'/plan', json={'state': state})
    assert response.status_code == 422, response.text
    assert not fake.created


def test_sdk_details_and_exact_plan_strategy(settings):
    from studio_api.service import OCIAdapter
    calls = []
    class Client:
        def create_stack(self, details, **kwargs):
            calls.append((details, kwargs))
            return SimpleNamespace(data=SimpleNamespace(id='stack'))
        def create_job(self, details, **kwargs):
            calls.append((details, kwargs))
            return SimpleNamespace(data=SimpleNamespace(id='job'))
        def get_stack(self, stack):
            return SimpleNamespace(headers={'etag': 'etag'})
        def update_stack(self, stack, details, **kwargs):
            calls.append((details, kwargs))
    adapter = OCIAdapter(settings)
    adapter.clients[settings.regions[0]] = Client()
    adapter.create_stack(settings.regions[0], COMP, 'test', 'BASE64', 'retry-token')
    assert calls[-1][0].config_source.config_source_type == 'ZIP_UPLOAD'
    adapter.update_stack(settings.regions[0], 'stack', 'BASE64')
    assert calls[-1][1]['if_match'] == 'etag'
    adapter.create_job(settings.regions[0], 'stack', 'PLAN', 'retry-token')
    assert calls[-1][0].job_operation_details.operation == 'PLAN'
    adapter.create_job(settings.regions[0], 'stack', 'APPLY', 'retry-token', 'exact-plan-id')
    details = calls[-1][0]
    assert details.job_operation_details.execution_plan_strategy == 'FROM_PLAN_JOB_ID'
    assert details.job_operation_details.execution_plan_job_id == 'exact-plan-id'


def test_external_change_allows_new_plan_instead_of_reusing_stale_plan(system, state):
    client, fake, _ = system
    path = '/api/architectures/'+str(uuid4())
    pid = client.post(path+'/plan', json={'state': state}).json()['id']
    fake.jobs[pid].lifecycle_state = 'SUCCEEDED'
    fake.etag = 'changed-externally'
    next_plan = client.post(path+'/plan', json={'state': state})
    assert next_plan.status_code == 200
    assert next_plan.json()['id'] != pid
    assert fake.updated == 1


def test_truncated_or_empty_logs_prevent_apply(system, state, monkeypatch):
    client, fake, _ = system
    path = '/api/architectures/'+str(uuid4())
    pid = client.post(path+'/plan', json={'state': state}).json()['id']
    fake.jobs[pid].lifecycle_state = 'SUCCEEDED'
    for logs in ({'lines': ['truncated...'], 'truncated': True}, {'lines': [], 'truncated': False}):
        monkeypatch.setattr(fake, 'logs', lambda region, job, result=logs: result)
        view = client.get(path+'/jobs/'+pid)
        assert view.json()['review_ready'] is False
        assert view.json()['console_url'].startswith('https://cloud.oracle.com/resourcemanager/stacks/')
        assert client.post(path+'/apply', json={'plan_job_id': pid, 'confirmation': 'APPLY'}).status_code == 409
    assert len(fake.jobs) == 1


def test_external_active_job_blocks_new_plan(system, state):
    client, fake, _ = system
    path = '/api/architectures/'+str(uuid4())
    pid = client.post(path+'/plan', json={'state': state}).json()['id']
    fake.jobs[pid].lifecycle_state = 'SUCCEEDED'
    external = SimpleNamespace(id='external', stack_id=fake.jobs[pid].stack_id, operation='PLAN', lifecycle_state='IN_PROGRESS')
    fake.jobs['external'] = external
    result = client.post(path+'/plan', json={'state': state})
    assert result.status_code == 409
    assert fake.updated == 0


def test_log_pagination_and_limits(settings):
    from studio_api.service import OCIAdapter
    class Client:
        def get_job_logs(self, job_id, **kwargs):
            if kwargs.get('page'):
                return SimpleNamespace(data=[SimpleNamespace(message='last')], headers={})
            return SimpleNamespace(data=[SimpleNamespace(message='first')], headers={'opc-next-page': 'page2'})
    adapter = OCIAdapter(settings)
    adapter.clients[settings.regions[0]] = Client()
    assert adapter.logs(settings.regions[0], 'job') == {'lines': ['first', 'last'], 'truncated': False}
    adapter.clients[settings.regions[0]].get_job_logs = lambda *a, **k: SimpleNamespace(data=[SimpleNamespace(message='x'*1_000_001)], headers={})
    assert adapter.logs(settings.regions[0], 'job')['truncated'] is True


def test_bad_compartment_config_and_deep_json_are_rejected(settings, system):
    client, *_ = system
    settings.compartments = [COMP]
    with pytest.raises(ValueError, match='COMPARTMENTS'):
        settings.validate()
    path = '/api/architectures/'+str(uuid4())+'/plan'
    assert client.post(path, content='['*40+'0'+']'*40).status_code == 400


def test_architecture_recovery_is_owner_scoped(system, state):
    client, fake, app = system
    aid = str(uuid4())
    path = '/api/architectures/'+aid
    assert client.get(path).status_code == 404
    plan = client.post(path+'/plan', json={'state': state}).json()
    recovered = client.get(path)
    assert recovered.status_code == 200
    data = recovered.json()
    assert data['job']['id'] == plan['id']
    assert data['stack_id'] == plan['stack_id']
    assert data['reconciliation_required'] is False
    with app.state.workflow.db() as conn:
        conn.execute('UPDATE architectures SET reconcile=1 WHERE id=?', (aid,))
    assert client.get(path).json()['reconciliation_required'] is True
    with app.state.workflow.db() as conn:
        conn.execute('UPDATE architectures SET owner=? WHERE id=?', ('other', aid))
    assert client.get(path).status_code == 404


@pytest.mark.parametrize('removed', ['compartment', 'region'])
@pytest.mark.parametrize('already_applied', [False, True])
def test_revoked_destination_blocks_existing_plan_apply_and_reads(system, state, removed, already_applied, monkeypatch):
    client, fake, app = system
    path = '/api/architectures/' + str(uuid4())
    plan = client.post(path + '/plan', json={'state': state}).json()
    fake.jobs[plan['id']].lifecycle_state = 'SUCCEEDED'
    if already_applied:
        applied = client.post(path + '/apply', json={'plan_job_id': plan['id'], 'confirmation': 'APPLY'})
        assert applied.status_code == 200
    settings = app.state.workflow.s
    if removed == 'compartment':
        settings.compartments = {'ocid1.compartment.oc1..newallowedcompartment': 'Other'}
    else:
        settings.regions = ('us-ashburn-1',)
    calls = []
    def forbidden_oci(*args, **kwargs):
        calls.append(True)
        raise AssertionError('Revoked destinations must be rejected before any OCI request')
    for method in ('get_job', 'logs', 'assert_no_active_jobs', 'stack_etag', 'create_job', 'update_stack', 'create_stack'):
        monkeypatch.setattr(fake, method, forbidden_oci)
    jobs_before = len(fake.jobs)
    assert client.post(path + '/apply', json={'plan_job_id': plan['id'], 'confirmation': 'APPLY'}).status_code == 403
    assert client.get(path).status_code == 403
    assert client.get(path + '/jobs/' + plan['id']).status_code == 403
    assert len(fake.jobs) == jobs_before
    assert not calls


@pytest.mark.parametrize('change', ['issuer', 'token_to_oidc'])
def test_owner_namespaces_prevent_issuer_and_auth_mode_collisions(settings, state, monkeypatch, change):
    import time
    import jwt
    from cryptography.hazmat.primitives.asymmetric import rsa
    key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    monkeypatch.setattr(jwt.PyJWKClient, 'get_signing_key_from_jwt',
                        lambda self, token: SimpleNamespace(key=key.public_key()))
    settings.oidc_issuer = 'https://first-issuer.example'
    settings.oidc_jwks_url = 'https://first-issuer.example/jwks'
    settings.oidc_audience = 'studio-api'
    settings.oidc_client_id = 'studio-browser'
    settings.allowed_subjects = ('operator',)
    def signed():
        return jwt.encode({'iss': settings.oidc_issuer, 'aud': 'studio-api', 'sub': 'operator',
                           'iat': int(time.time()), 'exp': int(time.time())+120}, key, algorithm='RS256')
    fake = FakeOCI()
    settings.auth_mode = 'oidc' if change == 'issuer' else 'token'
    client = TestClient(create_app(settings, fake))
    client.headers['Authorization'] = 'Bearer ' + (signed() if change == 'issuer' else TOKEN)
    old_principal = client.get('/api/connection').json()['principal']
    path = '/api/architectures/' + str(uuid4())
    plan = client.post(path+'/plan', json={'state': state})
    assert plan.status_code == 200
    if change == 'issuer':
        settings.oidc_issuer = 'https://second-issuer.example'
        settings.oidc_jwks_url = 'https://second-issuer.example/jwks'
    else:
        settings.auth_mode = 'oidc'
    replacement = TestClient(create_app(settings, fake))
    replacement.headers['Authorization'] = 'Bearer ' + signed()
    new_principal = replacement.get('/api/connection').json()['principal']
    assert new_principal != old_principal
    assert new_principal.startswith('oidc:')
    assert replacement.get(path).status_code == 404
    assert replacement.get(path+'/jobs/'+plan.json()['id']).status_code == 404
    assert replacement.post(path+'/apply', json={'plan_job_id': plan.json()['id'], 'confirmation': 'APPLY'}).status_code == 404
