from fastapi import APIRouter, Depends
from supabase import Client
from app.db.supabase import get_supabase
from app.db.qdrant import get_qdrant
from app.services.llm import get_embeddings
from app.services.graph import extract_graph, save_to_graph
from app.models.schemas import KnowledgeCreate, KnowledgeResponse
from qdrant_client.models import PointStruct
import uuid
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/knowledge", tags=["knowledge"])


@router.post("/", response_model=KnowledgeResponse, status_code=201)
async def add_knowledge(payload: KnowledgeCreate, db: Client = Depends(get_supabase)):
    # 1. Supabase에 원문 저장
    result = db.table("knowledge").insert(payload.model_dump()).execute()
    record = result.data[0]
    kid = record["id"]

    # 2. Qdrant 벡터 저장
    embeddings = get_embeddings()
    vector = embeddings.embed_query(payload.content)
    qdrant = get_qdrant()
    qdrant.upsert(
        collection_name="knowledge",
        points=[
            PointStruct(
                id=str(uuid.uuid4()),
                vector=vector,
                payload={"knowledge_id": kid, "content": payload.content, "tags": payload.tags},
            )
        ],
    )

    # 3. Neo4j 그래프 저장 (엔티티·관계 추출)
    try:
        graph_data = extract_graph(payload.content)
        save_to_graph(kid, payload.content, graph_data)
    except Exception as e:
        logger.warning("Neo4j graph save failed (non-fatal): %s", e)

    return record


@router.get("/search")
async def search_knowledge(q: str, limit: int = 5):
    embeddings = get_embeddings()
    vector = embeddings.embed_query(q)
    qdrant = get_qdrant()
    results = qdrant.query_points(
        collection_name="knowledge",
        query=vector,
        limit=max(1, limit),
    ).points
    return [{"score": r.score, **r.payload} for r in results]
