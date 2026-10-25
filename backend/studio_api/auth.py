import hashlib
import hmac
from fastapi import HTTPException, Request
import jwt


class Authenticator:
    def __init__(self, settings):
        self.s = settings
        self.jwks = (jwt.PyJWKClient(settings.oidc_jwks_url, timeout=5,
                     cache_jwk_set=True, lifespan=300) if settings.auth_mode == 'oidc' else None)

    def __call__(self, request: Request):
        header = request.headers.get('authorization', '')
        if not header.startswith('Bearer ') or len(header) > 16384:
            raise HTTPException(401, 'Authentication required', headers={'WWW-Authenticate': 'Bearer'})
        token = header[7:]
        if self.s.auth_mode == 'token':
            if not hmac.compare_digest(hashlib.sha256(token.encode()).digest(),
                                       hashlib.sha256(self.s.api_token.encode()).digest()):
                raise HTTPException(401, 'Invalid authentication')
            return 'operator'
        try:
            key = self.jwks.get_signing_key_from_jwt(token).key
            claims = jwt.decode(token, key, algorithms=['RS256'], audience=self.s.oidc_audience,
                                issuer=self.s.oidc_issuer,
                                options={'require': ['exp', 'iat', 'iss', 'aud', 'sub']}, leeway=30)
        except Exception:
            raise HTTPException(401, 'Invalid authentication') from None
        groups = claims.get('groups', [])
        if not isinstance(groups, list) or not all(isinstance(x, str) for x in groups):
            groups = []
        if claims['sub'] not in self.s.allowed_subjects and not set(groups).intersection(self.s.allowed_groups):
            raise HTTPException(403, 'User not authorized for Studio')
        return str(claims['sub'])
