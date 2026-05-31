from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.config import settings

_bearer = HTTPBearer(auto_error=False)


def verify_secret(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
) -> None:
    token = credentials.credentials if credentials else None
    if not token or token != settings.APP_SECRET:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing secret key",
            headers={"WWW-Authenticate": "Bearer"},
        )
