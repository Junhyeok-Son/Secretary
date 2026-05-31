from langgraph.prebuilt import create_react_agent
from langchain_core.messages import SystemMessage
from app.services.llm import get_llm
from app.services.agent.tools import TOOLS

SYSTEM_PROMPT = """당신은 사용자의 개인 비서입니다.

역할:
- 일정 관리: 일정 조회, 생성, 수정을 도와줍니다.
- 지식 검색: 사용자가 저장한 지식 베이스에서 관련 정보를 찾아줍니다.
- 일반 대화: 질문에 친절하고 간결하게 답합니다.

지침:
- 일정 관련 요청은 반드시 get_events 또는 create_event 툴을 사용합니다.
- 사용자의 지식이나 메모를 참고해야 할 때는 search_knowledge를 먼저 호출합니다.
- 현재 시간이 필요하면 get_current_time을 사용합니다.
- 답변은 한국어로, 간결하고 실용적으로 합니다.
- 툴 호출 결과를 그대로 나열하지 말고 자연스럽게 정리해서 답합니다.
"""


def get_agent():
    llm = get_llm()
    agent = create_react_agent(
        model=llm,
        tools=TOOLS,
        prompt=SYSTEM_PROMPT,
    )
    return agent
