from fastapi import APIRouter, Depends
from supabase import Client
from app.db.supabase import get_supabase
from app.db.qdrant import get_qdrant
from app.services.llm import get_embeddings
from app.models.schemas import KnowledgeCreate, KnowledgeResponse
from qdrant_client.models import PointStruct
import uuid

router = APIRouter(prefix="/knowledge", tags=["knowledge"])


@router.post("/", response_model=KnowledgeResponse, status_code=201)
async def add_knowledge(payload: KnowledgeCreate, db: Client = Depends(get_supabase)):
    # 1. Supabase에 원문 저장
    result = db.table("knowledge").insert(payload.model_dump()).execute()
    record = result.data[0]

    # 2. 임베딩 생성 후 Qdrant에 벡터 저장
    embeddings = get_embeddings()
    vector = embeddings.embed_query(payload.content)
    qdrant = get_qdrant()
    qdrant.upsert(
        collection_name="knowledge",
        points=[
            PointStruct(
                id=str(uuid.uuid4()),
                vector=vector,
                payload={"knowledge_id": record["id"], "content": payload.content, "tags": payload.tags},
            )
        ],
    )

    return record


@router.get("/search")
async def search_knowledge(q: str, limit: int = 5):
    embeddings = get_embeddings()
    vector = embeddings.embed_query(q)
    qdrant = get_qdrant()
    results = qdrant.search(
        collection_name="knowledge",
        query_vector=vector,
        limit=limit,
    )
    return [{"score": r.score, **r.payload} for r in results]
