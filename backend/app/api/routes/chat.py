from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from fastapi.responses import StreamingResponse
from langchain_core.messages import HumanMessage, AIMessageChunk, AIMessage
from app.models.schemas import ChatRequest
from app.services.agent.graph import get_agent
from app.services.agent.memory import get_history, append_message, clear_history
from app.services.realtime import manager
import uuid
import json

router = APIRouter(prefix="/chat", tags=["chat"])


async def _run_agent_stream(session_id: str, message: str):
    """Agent 스트리밍 실행 — (delta, full_response) 제너레이터."""
    user_message = HumanMessage(content=message)
    messages = get_history(session_id) + [user_message]
    agent = get_agent()
    full_response = ""

    async for event in agent.astream_events({"messages": messages}, version="v2"):
        if event.get("event") == "on_chat_model_stream":
            chunk = event["data"].get("chunk")
            if isinstance(chunk, AIMessageChunk) and chunk.content:
                full_response += chunk.content
                yield chunk.content, False

    append_message(session_id, user_message)
    append_message(session_id, AIMessage(content=full_response))
    yield "", True  # done signal


# ── SSE 엔드포인트 (HTTP 클라이언트용) ──────────────────────────────────────

@router.post("/")
async def chat_sse(req: ChatRequest):
    session_id = req.session_id or str(uuid.uuid4())

    async def generate():
        try:
            async for delta, done in _run_agent_stream(session_id, req.message):
                if done:
                    yield "data: [DONE]\n\n"
                else:
                    payload = json.dumps({"delta": delta, "session_id": session_id}, ensure_ascii=False)
                    yield f"data: {payload}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")


# ── WebSocket 채팅 엔드포인트 (앱/웹 실시간용) ──────────────────────────────

@router.websocket("/ws/{session_id}")
async def chat_ws(ws: WebSocket, session_id: str):
    """
    WebSocket 채팅. 메시지 형식:
      송신: {"message": "사용자 입력"}
      수신: {"type": "chat_delta", "data": {"delta": "...", "session_id": "..."}}
            {"type": "chat_done",  "data": {"session_id": "..."}}
            {"type": "error",      "data": {"message": "..."}}
    """
    await manager.connect(session_id, ws)
    try:
        while True:
            raw = await ws.receive_text()
            try:
                msg = json.loads(raw)
            except Exception:
                continue

            user_text = msg.get("message", "").strip()
            if not user_text:
                continue

            try:
                async for delta, done in _run_agent_stream(session_id, user_text):
                    if done:
                        await ws.send_text(json.dumps(
                            {"type": "chat_done", "data": {"session_id": session_id}},
                            ensure_ascii=False,
                        ))
                    else:
                        await ws.send_text(json.dumps(
                            {"type": "chat_delta", "data": {"delta": delta, "session_id": session_id}},
                            ensure_ascii=False,
                        ))
            except Exception as e:
                await ws.send_text(json.dumps({"type": "error", "data": {"message": str(e)}}))

    except WebSocketDisconnect:
        manager.disconnect(session_id, ws)


# ── 유틸 ─────────────────────────────────────────────────────────────────────

@router.delete("/{session_id}")
async def clear_session(session_id: str):
    clear_history(session_id)
    return {"status": "cleared"}
