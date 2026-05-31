from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from app.models.schemas import ChatRequest
from app.services.llm import get_llm, get_embeddings
from app.db.qdrant import get_qdrant
import uuid
import json

router = APIRouter(prefix="/chat", tags=["chat"])


def _retrieve_context(query: str, limit: int = 4) -> list[str]:
    embeddings = get_embeddings()
    vector = embeddings.embed_query(query)
    qdrant = get_qdrant()
    results = qdrant.search(collection_name="knowledge", query_vector=vector, limit=limit)
    return [r.payload.get("content", "") for r in results if r.score > 0.6]


@router.post("/")
async def chat(req: ChatRequest):
    session_id = req.session_id or str(uuid.uuid4())
    context_chunks = _retrieve_context(req.message)

    context_block = "\n\n".join(context_chunks) if context_chunks else "없음"
    system_prompt = (
        "당신은 사용자의 개인 비서입니다. "
        "아래 지식 베이스를 참고하여 정확하고 간결하게 답변하세요.\n\n"
        f"[지식 베이스]\n{context_block}"
    )

    llm = get_llm()
    messages = [
        ("system", system_prompt),
        ("human", req.message),
    ]

    async def generate():
        async for chunk in llm.astream(messages):
            yield f"data: {json.dumps({'delta': chunk.content, 'session_id': session_id})}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")
