from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from langchain_core.messages import HumanMessage, AIMessageChunk
from app.models.schemas import ChatRequest
from app.services.agent.graph import get_agent
from app.services.agent.memory import get_history, append_message
import uuid
import json

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("/")
async def chat(req: ChatRequest):
    session_id = req.session_id or str(uuid.uuid4())
    user_message = HumanMessage(content=req.message)

    history = get_history(session_id)
    messages = history + [user_message]

    agent = get_agent()

    async def generate():
        full_response = ""
        try:
            async for event in agent.astream_events(
                {"messages": messages},
                version="v2",
            ):
                kind = event.get("event")
                if kind == "on_chat_model_stream":
                    chunk = event["data"].get("chunk")
                    if isinstance(chunk, AIMessageChunk) and chunk.content:
                        full_response += chunk.content
                        payload = json.dumps({"delta": chunk.content, "session_id": session_id}, ensure_ascii=False)
                        yield f"data: {payload}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
            return

        # 대화 히스토리 저장
        append_message(session_id, user_message)
        from langchain_core.messages import AIMessage
        append_message(session_id, AIMessage(content=full_response))

        yield "data: [DONE]\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")


@router.delete("/{session_id}")
async def clear_session(session_id: str):
    from app.services.agent.memory import clear_history
    clear_history(session_id)
    return {"status": "cleared"}
