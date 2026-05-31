from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams
from app.core.config import settings

_client: QdrantClient | None = None
VECTOR_SIZE = 768  # nomic-embed-text output size


def get_qdrant() -> QdrantClient:
    global _client
    if _client is None:
        _client = QdrantClient(
            host=settings.QDRANT_HOST,
            port=settings.QDRANT_PORT,
            check_compatibility=False,
        )
    return _client


def ensure_collection():
    client = get_qdrant()
    existing = [c.name for c in client.get_collections().collections]
    if settings.QDRANT_COLLECTION not in existing:
        client.create_collection(
            collection_name=settings.QDRANT_COLLECTION,
            vectors_config=VectorParams(size=VECTOR_SIZE, distance=Distance.COSINE),
        )
