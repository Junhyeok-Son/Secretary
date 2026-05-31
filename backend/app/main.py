from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.core.auth import verify_secret
from app.db.qdrant import ensure_collection
from app.db.neo4j import close_driver
from app.api.routes import events, knowledge, chat, ws
from app.services.realtime import start_realtime_listener


@asynccontextmanager
async def lifespan(app: FastAPI):
    ensure_collection()
    realtime_task = start_realtime_listener()
    yield
    realtime_task.cancel()
    close_driver()


app = FastAPI(title=settings.APP_NAME, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 인증이 필요한 라우터 — dependencies로 일괄 적용
_auth = {"dependencies": [__import__("fastapi", fromlist=["Depends"]).Depends(verify_secret)]}

app.include_router(events.router, prefix="/api/v1", **_auth)
app.include_router(knowledge.router, prefix="/api/v1", **_auth)
app.include_router(chat.router, prefix="/api/v1", **_auth)
app.include_router(ws.router)  # WS 인증은 쿼리 파라미터로 처리


@app.get("/health")
def health():
    return {"status": "ok"}
