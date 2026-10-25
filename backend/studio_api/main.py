from uuid import UUID
from typing import Literal

from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ConfigDict, Field

from .auth import Authenticator
from .settings import Settings
from .service import Workflow
from .terraform import TYPES


class PlanRequest(BaseModel):
    model_config = ConfigDict(extra='forbid')
    state: dict


class ApplyRequest(BaseModel):
    model_config = ConfigDict(extra='forbid')
    plan_job_id: str = Field(min_length=1, max_length=300)
    confirmation: Literal['APPLY']


def create_app(settings=None, adapter=None):
    settings = settings or Settings.from_env()
    settings.validate()
    authenticate = Authenticator(settings)
    workflow = Workflow(settings, adapter)
    app = FastAPI(title='OCI Architect Studio API', version='1.0.0', docs_url=None, redoc_url=None)
    app.state.workflow = workflow
    app.add_middleware(CORSMiddleware, allow_origins=list(settings.allowed_origins),
                       allow_credentials=False, allow_methods=['GET', 'POST'],
                       allow_headers=['Authorization', 'Content-Type'])

    @app.middleware('http')
    async def security(request: Request, call_next):
        if request.method == 'POST':
            try:
                if int(request.headers.get('content-length', '0')) > 1_000_000:
                    return JSONResponse({'detail': 'Request too large'}, status_code=413)
            except ValueError:
                return JSONResponse({'detail': 'Invalid content length'}, status_code=400)
            size = 0
            chunks = []
            async for chunk in request.stream():
                size += len(chunk)
                if size > 1_000_000:
                    return JSONResponse({'detail': 'Request too large'}, status_code=413)
                chunks.append(chunk)
            request._body = b''.join(chunks)
            import json
            try:
                decoded = json.loads(request._body)
                pending = [(decoded, 0)]
                while pending:
                    value, depth = pending.pop()
                    if depth > 30:
                        return JSONResponse({'detail': 'Request nesting too deep'}, status_code=400)
                    if isinstance(value, dict):
                        pending.extend((v, depth + 1) for v in value.values())
                    elif isinstance(value, list):
                        pending.extend((v, depth + 1) for v in value)
            except (ValueError, UnicodeDecodeError, RecursionError):
                return JSONResponse({'detail': 'Invalid JSON request'}, status_code=400)
        response = await call_next(request)
        response.headers['Cache-Control'] = 'no-store'
        response.headers['X-Content-Type-Options'] = 'nosniff'
        return response

    def safe_call(operation, *args):
        try:
            return operation(*args)
        except HTTPException:
            raise
        except Exception:
            raise HTTPException(502, 'OCI operation could not be completed; check server configuration and Resource Manager') from None

    @app.get('/api/health')
    def health():
        return {'status': 'ok', 'service': 'oci-architect-studio'}

    @app.get('/api/config')
    def config():
        return {'auth_mode': settings.auth_mode, 'oidc_issuer': settings.oidc_issuer,
                'oidc_client_id': settings.oidc_client_id, 'oidc_audience': settings.oidc_audience,
                'oidc_scopes': settings.oidc_scopes,
                'supported_types': list(TYPES)}

    @app.get('/api/connection')
    def connection(principal=Depends(authenticate)):
        try:
            workflow.adapter.connection()
        except Exception:
            raise HTTPException(502, 'OCI connection check failed; verify server identity, region and IAM permissions') from None
        return {'principal': principal, 'regions': [{'id': x, 'name': x} for x in settings.regions],
                'compartments': [{'id': k, 'name': v} for k, v in settings.compartments.items()],
                'supported_types': list(TYPES),
                'notice': 'Read access confirmed; provision permissions and regional capacity still depend on OCI.'}

    @app.get('/api/architectures/{architecture_id}')
    def architecture(architecture_id: UUID, principal=Depends(authenticate)):
        return safe_call(workflow.architecture, str(architecture_id), principal)

    @app.post('/api/architectures/{architecture_id}/plan')
    def plan(architecture_id: UUID, body: PlanRequest, principal=Depends(authenticate)):
        return safe_call(workflow.plan, str(architecture_id), principal, body.state)

    @app.post('/api/architectures/{architecture_id}/apply')
    def apply(architecture_id: UUID, body: ApplyRequest, principal=Depends(authenticate)):
        return safe_call(workflow.apply, str(architecture_id), principal, body.plan_job_id)

    @app.get('/api/architectures/{architecture_id}/jobs/{job_id}')
    def job(architecture_id: UUID, job_id: str, principal=Depends(authenticate)):
        if len(job_id) > 300:
            raise HTTPException(422, 'Invalid job ID')
        return workflow.job(str(architecture_id), principal, job_id)

    return app
