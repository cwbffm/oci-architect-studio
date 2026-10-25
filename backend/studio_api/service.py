"""Resource Manager adapter and durable, owner-scoped workflow.

One API worker is sufficient; SQLite write transactions serialize mutations across
workers. Ambiguous remote failures require operator reconciliation, never a blind
retry of a possibly successful mutation.
"""
import base64
import hashlib
import io
import json
import os
from pathlib import Path
import sqlite3
import uuid
import zipfile

import oci
from fastapi import HTTPException
from .terraform import compile_state

ACTIVE = {'ACCEPTED', 'IN_PROGRESS', 'CANCELING'}
TERMINAL = {'SUCCEEDED', 'FAILED', 'CANCELED'}


class OCIAdapter:
    def __init__(self, settings):
        self.s = settings
        self.clients = {}

    def client(self, region):
        if region not in self.clients:
            if self.s.oci_auth == 'instance_principal':
                signer = oci.auth.signers.InstancePrincipalsSecurityTokenSigner()
                config = {'region': region}
            elif self.s.oci_auth == 'resource_principal':
                signer = oci.auth.signers.get_resource_principals_signer()
                config = {'region': region}
            else:
                config = oci.config.from_file(profile_name=self.s.oci_config_profile)
                config['region'] = region
                signer = None
            options = {'timeout': (5, 45), 'retry_strategy': oci.retry.NoneRetryStrategy()}
            if signer is not None:
                options['signer'] = signer
            self.clients[region] = oci.resource_manager.ResourceManagerClient(config, **options)
        return self.clients[region]

    def connection(self):
        # Read-only request checks actual identity and basic Resource Manager IAM.
        for region in self.s.regions:
            self.client(region).list_stacks(next(iter(self.s.compartments)), limit=1)

    def create_stack(self, region, compartment, name, payload, token):
        m = oci.resource_manager.models
        details = m.CreateStackDetails(compartment_id=compartment, display_name=name,
            description='Managed by OCI Architect Studio API', terraform_version=self.s.terraform_version,
            config_source=m.CreateZipUploadConfigSourceDetails(zip_file_base64_encoded=payload))
        return self.client(region).create_stack(details, opc_retry_token=token).data.id

    def update_stack(self, region, stack, payload):
        m = oci.resource_manager.models
        client = self.client(region)
        etag = client.get_stack(stack).headers.get('etag')
        if not etag:
            raise RuntimeError('Resource Manager did not return stack ETag')
        client.update_stack(stack, m.UpdateStackDetails(
            config_source=m.UpdateZipUploadConfigSourceDetails(zip_file_base64_encoded=payload)), if_match=etag)

    def stack_etag(self, region, stack):
        etag = self.client(region).get_stack(stack).headers.get('etag')
        if not etag:
            raise RuntimeError('Resource Manager did not return stack ETag')
        return etag

    def create_job(self, region, stack, operation, token, plan_id=None):
        m = oci.resource_manager.models
        operation_details = (m.PlanJobOperationDetails() if operation == 'PLAN' else
                             m.ApplyJobOperationDetails(execution_plan_strategy='FROM_PLAN_JOB_ID',
                                                        execution_plan_job_id=plan_id))
        details = m.CreateJobDetails(stack_id=stack, operation=operation, job_operation_details=operation_details,
                                    display_name='Studio ' + operation)
        return self.client(region).create_job(details, opc_retry_token=token).data

    def get_job(self, region, job_id):
        return self.client(region).get_job(job_id).data

    def assert_no_active_jobs(self, region, stack):
        for state in ACTIVE:
            response = self.client(region).list_jobs(stack_id=stack, lifecycle_state=state, limit=1)
            if response.data:
                raise HTTPException(409, 'Resource Manager has an active job for this stack')

    def logs(self, region, job_id):
        lines, page, used = [], None, 0
        while True:
            options = {'limit': 1000, 'sort_order': 'ASC'}
            if page:
                options['page'] = page
            response = self.client(region).get_job_logs(job_id, **options)
            for entry in response.data:
                message = str(getattr(entry, 'message', '') or '')
                used += len(message.encode('utf-8'))
                if len(lines) >= 5000 or used > 1_000_000:
                    return {'lines': lines, 'truncated': True}
                lines.append(message)
            page = response.headers.get('opc-next-page')
            if not page:
                return {'lines': lines, 'truncated': False}


def package(config):
    output = io.BytesIO()
    with zipfile.ZipFile(output, 'w', zipfile.ZIP_DEFLATED) as archive:
        archive.writestr('main.tf.json', json.dumps(config, ensure_ascii=False, sort_keys=True))
    return base64.b64encode(output.getvalue()).decode()


class Workflow:
    def __init__(self, settings, adapter=None):
        self.s = settings
        self.adapter = adapter or OCIAdapter(settings)
        path = Path(settings.database_path)
        path.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
        self.path = str(path)
        with self.db() as conn:
            conn.executescript('''
            CREATE TABLE IF NOT EXISTS architectures (
              id TEXT PRIMARY KEY, owner TEXT NOT NULL, region TEXT NOT NULL,
              compartment TEXT NOT NULL, stack TEXT, digest TEXT,
              active_job TEXT, plan_job TEXT, apply_job TEXT, reconcile INTEGER NOT NULL DEFAULT 0, etag TEXT);
            CREATE TABLE IF NOT EXISTS jobs (
              id TEXT PRIMARY KEY, architecture TEXT NOT NULL, operation TEXT NOT NULL,
              status TEXT NOT NULL, digest TEXT NOT NULL);
            ''')
        os.chmod(path, 0o600)

    @staticmethod
    def console_url(region, stack):
        from urllib.parse import quote
        return 'https://cloud.oracle.com/resourcemanager/stacks/' + quote(stack, safe='') + '?region=' + quote(region, safe='')

    def db(self):
        conn = sqlite3.connect(self.path, timeout=1)
        conn.row_factory = sqlite3.Row
        return conn

    def owned(self, conn, aid, owner):
        row = conn.execute('SELECT * FROM architectures WHERE id=?', (aid,)).fetchone()
        if row and row['owner'] != owner:
            raise HTTPException(404, 'Architecture not found')
        if row and (row['region'] not in self.s.regions or row['compartment'] not in self.s.compartments):
            raise HTTPException(403, 'Architecture destination is no longer authorized by the server')
        return row

    def snapshot(self, conn, row, job_id, with_logs=False):
        known = conn.execute('SELECT * FROM jobs WHERE id=? AND architecture=?', (job_id, row['id'])).fetchone()
        if not known:
            raise HTTPException(404, 'Job not found')
        remote = self.adapter.get_job(row['region'], job_id)
        if remote.stack_id != row['stack'] or remote.operation != known['operation']:
            raise HTTPException(409, 'Job ownership does not match the architecture')
        status = remote.lifecycle_state
        conn.execute('UPDATE jobs SET status=? WHERE id=?', (status, job_id))
        if status in TERMINAL:
            conn.execute('UPDATE architectures SET active_job=NULL WHERE id=? AND active_job=?', (row['id'], job_id))
        result = {'id': job_id, 'operation': known['operation'], 'status': status,
                  'architecture_id': row['id'], 'stack_id': row['stack'], 'logs': [],
                  'console_url': self.console_url(row['region'], row['stack']),
                  'logs_truncated': False, 'review_ready': False}
        if with_logs:
            logs = self.adapter.logs(row['region'], job_id)
            result['logs'] = logs['lines']
            result['logs_truncated'] = logs['truncated']
            result['review_ready'] = status == 'SUCCEEDED' and known['operation'] == 'PLAN' and bool(logs['lines']) and not logs['truncated']
        return result

    def assert_idle(self, conn, row):
        if row['reconcile']:
            raise HTTPException(409, 'Previous request has an uncertain result; operator reconciliation is required')
        if row['active_job']:
            result = self.snapshot(conn, row, row['active_job'])
            if result['status'] not in TERMINAL:
                raise HTTPException(409, 'An execution is already active for this architecture')

    def plan(self, aid, owner, state):
        try:
            config = compile_state(state, self.s)
        except (ValueError, TypeError, KeyError, OverflowError) as exc:
            raise HTTPException(422, str(exc)[:300]) from None
        raw = json.dumps(config, sort_keys=True, separators=(',', ':'))
        digest = hashlib.sha256(raw.encode()).hexdigest()
        payload = package(config)
        comp, region = state['compartmentId'], state['region']
        with self.db() as conn:
            try:
                conn.execute('BEGIN IMMEDIATE')
            except sqlite3.OperationalError:
                raise HTTPException(409, 'Another operation is in progress; try again shortly') from None
            row = self.owned(conn, aid, owner)
            if row:
                if row['region'] != region or row['compartment'] != comp:
                    raise HTTPException(409, 'Architecture region and compartment are immutable; create a new architecture')
                self.assert_idle(conn, row)
                self.adapter.assert_no_active_jobs(region, row['stack'])
            else:
                conn.execute('INSERT INTO architectures(id,owner,region,compartment) VALUES (?,?,?,?)', (aid, owner, region, comp))
            # Persist intent before any remote mutation; failures then remain blocked
            # until an operator determines whether the remote call took effect.
            conn.execute('UPDATE architectures SET reconcile=1 WHERE id=?', (aid,))
            conn.commit()
        try:
            with self.db() as conn:
                row = self.owned(conn, aid, owner)
                stack = row['stack']
                if not stack:
                    name = str(state.get('projectName') or 'OCI Architect Studio')[:255]
                    stack = self.adapter.create_stack(region, comp, name, payload, str(uuid.uuid5(uuid.NAMESPACE_URL, aid)))
                    conn.execute('UPDATE architectures SET stack=? WHERE id=?', (stack, aid))
                    conn.commit()
                else:
                    self.adapter.update_stack(region, stack, payload)
                etag = self.adapter.stack_etag(region, stack)
                job = self.adapter.create_job(region, stack, 'PLAN', str(uuid.uuid4()))
                conn.execute('INSERT INTO jobs VALUES (?,?,?,?,?)', (job.id, aid, 'PLAN', job.lifecycle_state, digest))
                conn.execute('UPDATE architectures SET digest=?,active_job=?,plan_job=?,apply_job=NULL,reconcile=0,etag=? WHERE id=?',
                             (digest, job.id, job.id, etag, aid))
                conn.commit()
                row = self.owned(conn, aid, owner)
                return {'id': job.id, 'operation': 'PLAN', 'status': job.lifecycle_state,
                        'architecture_id': aid, 'stack_id': stack, 'logs': [],
                        'console_url': self.console_url(region, stack), 'review_ready': False, 'logs_truncated': False}
        except Exception:
            # Remains reconcile=1; never turn ambiguous failures into automatic duplicates.
            raise HTTPException(502, 'OCI request failed; inspect the Resource Manager console and reconcile before retrying') from None

    def apply(self, aid, owner, plan_id):
        with self.db() as conn:
            try:
                conn.execute('BEGIN IMMEDIATE')
            except sqlite3.OperationalError:
                raise HTTPException(409, 'Another operation is in progress') from None
            row = self.owned(conn, aid, owner)
            if not row:
                raise HTTPException(404, 'Architecture not found')
            if row['apply_job']:
                if row['plan_job'] != plan_id:
                    raise HTTPException(409, 'Plan is no longer current')
                return self.snapshot(conn, row, row['apply_job'])
            self.assert_idle(conn, row)
            if row['plan_job'] != plan_id:
                raise HTTPException(409, 'Only the current plan can be applied')
            plan = self.snapshot(conn, row, plan_id, with_logs=True)
            if plan['operation'] != 'PLAN' or plan['status'] != 'SUCCEEDED':
                raise HTTPException(409, 'A successful PLAN is required before apply')
            if not plan['review_ready']:
                raise HTTPException(409, 'Complete plan logs are required; inspect Resource Manager when logs are truncated')
            self.adapter.assert_no_active_jobs(row['region'], row['stack'])
            try:
                if self.adapter.stack_etag(row['region'], row['stack']) != row['etag']:
                    raise HTTPException(409, 'Stack changed outside Studio; generate a new plan')
            except HTTPException:
                raise
            except Exception:
                raise HTTPException(502, 'Unable to verify stack version') from None
            conn.execute('UPDATE architectures SET reconcile=1 WHERE id=?', (aid,))
            conn.commit()
        try:
            job = self.adapter.create_job(row['region'], row['stack'], 'APPLY', str(uuid.uuid4()), plan_id)
            with self.db() as conn:
                conn.execute('INSERT INTO jobs VALUES (?,?,?,?,?)', (job.id, aid, 'APPLY', job.lifecycle_state, row['digest']))
                conn.execute('UPDATE architectures SET active_job=?,apply_job=?,reconcile=0 WHERE id=?', (job.id, job.id, aid))
            return {'id': job.id, 'operation': 'APPLY', 'status': job.lifecycle_state,
                    'architecture_id': aid, 'stack_id': row['stack'], 'logs': [],
                    'console_url': self.console_url(row['region'], row['stack']), 'review_ready': False, 'logs_truncated': False}
        except Exception:
            raise HTTPException(502, 'OCI apply result is uncertain; inspect Resource Manager before retrying') from None

    def architecture(self, aid, owner):
        with self.db() as conn:
            row = self.owned(conn, aid, owner)
            if not row:
                raise HTTPException(404, 'Architecture not found')
            job_id = row['active_job'] or row['apply_job'] or row['plan_job']
            job = self.snapshot(conn, row, job_id, with_logs=True) if job_id else None
            return {'architecture_id': aid, 'region': row['region'],
                    'compartment_id': row['compartment'], 'stack_id': row['stack'],
                    'job': job, 'reconciliation_required': bool(row['reconcile']),
                    'console_url': self.console_url(row['region'], row['stack']) if row['stack'] else None}

    def job(self, aid, owner, job_id):
        try:
            with self.db() as conn:
                row = self.owned(conn, aid, owner)
                if not row:
                    raise HTTPException(404, 'Architecture not found')
                return self.snapshot(conn, row, job_id, with_logs=True)
        except HTTPException:
            raise
        except Exception:
            raise HTTPException(502, 'Unable to read Resource Manager job') from None
