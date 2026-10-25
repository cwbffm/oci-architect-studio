"""Explicit, server-controlled security boundaries. No credentials come from requests."""
import json
import os
from dataclasses import dataclass, field
from pathlib import Path


@dataclass
class Settings:
    auth_mode: str = 'token'
    api_token: str = ''
    oidc_issuer: str = ''
    oidc_audience: str = ''
    oidc_client_id: str = ''
    oidc_jwks_url: str = ''
    oidc_discovery_url: str = ''
    oidc_scopes: str = 'openid profile'
    allowed_subjects: tuple[str, ...] = ()
    allowed_groups: tuple[str, ...] = ()
    regions: tuple[str, ...] = ()
    compartments: dict[str, str] = field(default_factory=dict)
    allowed_origins: tuple[str, ...] = ()
    database_path: str = './data/studio.sqlite3'
    oci_auth: str = 'instance_principal'
    oci_config_profile: str = 'DEFAULT'
    terraform_version: str = '1.5.x'

    @classmethod
    def from_env(cls):
        seq = lambda key: tuple(x.strip() for x in os.getenv(key, '').split(',') if x.strip())
        return cls(auth_mode=os.getenv('STUDIO_AUTH_MODE', 'token'), api_token=os.getenv('STUDIO_API_TOKEN', ''),
                   oidc_issuer=os.getenv('STUDIO_OIDC_ISSUER', ''),
                   oidc_audience=os.getenv('STUDIO_OIDC_AUDIENCE', ''),
                   oidc_client_id=os.getenv('STUDIO_OIDC_CLIENT_ID', ''),
                   oidc_jwks_url=os.getenv('STUDIO_OIDC_JWKS_URL', ''),
                   oidc_discovery_url=os.getenv('STUDIO_OIDC_DISCOVERY_URL', ''),
                   oidc_scopes=os.getenv('STUDIO_OIDC_SCOPES', 'openid profile'),
                   allowed_subjects=seq('STUDIO_ALLOWED_SUBJECTS'), allowed_groups=seq('STUDIO_ALLOWED_GROUPS'),
                   regions=seq('STUDIO_REGIONS'), compartments=json.loads(os.getenv('STUDIO_COMPARTMENTS', '{}')),
                   allowed_origins=seq('STUDIO_ALLOWED_ORIGINS'),
                   database_path=os.getenv('STUDIO_DATABASE_PATH', './data/studio.sqlite3'),
                   oci_auth=os.getenv('STUDIO_OCI_AUTH', 'instance_principal'),
                   oci_config_profile=os.getenv('STUDIO_OCI_CONFIG_PROFILE', 'DEFAULT'),
                   terraform_version=os.getenv('STUDIO_TERRAFORM_VERSION', '1.5.x'))

    @property
    def discovery_url(self):
        return self.oidc_discovery_url or (self.oidc_issuer.rstrip('/') + '/.well-known/openid-configuration' if self.oidc_issuer else '')

    def validate(self):
        import re
        from urllib.parse import urlsplit
        if self.auth_mode not in ('token', 'oidc'):
            raise ValueError('STUDIO_AUTH_MODE must be token or oidc')
        if self.auth_mode == 'token' and len(self.api_token) < 32:
            raise ValueError('STUDIO_API_TOKEN needs at least 32 characters; no default credential is provided')
        if self.auth_mode == 'oidc':
            for value in (self.oidc_issuer, self.oidc_jwks_url, self.discovery_url):
                parsed = urlsplit(value)
                if parsed.scheme != 'https' or not parsed.hostname or parsed.username or parsed.password or parsed.fragment:
                    raise ValueError('OIDC issuer, JWKS and discovery must be explicit HTTPS URLs')
            if not self.oidc_audience or not self.oidc_client_id or not (self.allowed_subjects or self.allowed_groups):
                raise ValueError('OIDC requires audience, client ID and allowed subjects/groups')
        if not self.regions or any(not re.fullmatch(r'[a-z]{2}-[a-z]+-\d+', x) for x in self.regions):
            raise ValueError('Configure STUDIO_REGIONS explicitly')
        if not isinstance(self.compartments, dict) or not self.compartments or any(not isinstance(k, str) or not isinstance(v, str) or not v.strip() for k, v in self.compartments.items()) or any(not re.fullmatch(r'ocid1\.compartment\.[a-z0-9_.-]{8,256}', x) for x in self.compartments):
            raise ValueError('Configure STUDIO_COMPARTMENTS as a JSON object of compartment OCIDs to labels')
        if self.oci_auth not in ('instance_principal', 'resource_principal', 'config'):
            raise ValueError('Invalid STUDIO_OCI_AUTH')
        if not re.fullmatch(r'\d+\.\d+\.x', self.terraform_version):
            raise ValueError('Use a supported Resource Manager Terraform version such as 1.5.x')
        for origin in self.allowed_origins:
            p = urlsplit(origin)
            local = p.scheme == 'http' and p.hostname in ('localhost', '127.0.0.1')
            if not p.hostname or not (p.scheme == 'https' or local) or p.path not in ('', '/') or p.query or p.fragment or p.username:
                raise ValueError('Origins must be exact HTTPS origins (HTTP only localhost)')
