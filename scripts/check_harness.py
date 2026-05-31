#!/usr/bin/env python3
"""Secretary AI 프로젝트 특화 harness 검사."""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BACKEND = ROOT / "backend"


def fail(msg: str) -> None:
    print(f"FAIL: {msg}")


def ok(msg: str) -> None:
    print(f"OK:   {msg}")


def check_required_files() -> list[str]:
    errors = []
    required = [
        BACKEND / "requirements.txt",
        BACKEND / ".env.example",
        BACKEND / "app" / "main.py",
        BACKEND / "app" / "core" / "config.py",
        BACKEND / "app" / "models" / "schemas.py",
        BACKEND / "app" / "services" / "llm.py",
        BACKEND / "app" / "db" / "supabase.py",
        BACKEND / "app" / "db" / "qdrant.py",
        BACKEND / "app" / "db" / "neo4j.py",
        ROOT / "docker-compose.yml",
        ROOT / "AGENTS.md",
    ]
    for path in required:
        if not path.exists():
            errors.append(f"필수 파일 없음: {path.relative_to(ROOT)}")
        else:
            ok(str(path.relative_to(ROOT)))
    return errors


def check_env_not_committed() -> list[str]:
    errors = []
    env_file = BACKEND / ".env"
    gitignore = ROOT / ".gitignore"
    if not gitignore.exists():
        errors.append(".gitignore 없음 — .env 커밋 위험")
        return errors
    content = gitignore.read_text(encoding="utf-8")
    if ".env" not in content:
        errors.append(".gitignore에 .env 누락 — 비밀 키 커밋 위험")
    else:
        ok(".gitignore에 .env 포함")
    return errors


def check_env_example_keys() -> list[str]:
    errors = []
    example = BACKEND / ".env.example"
    if not example.exists():
        return [".env.example 없음"]
    keys = {
        line.split("=")[0].strip()
        for line in example.read_text(encoding="utf-8").splitlines()
        if "=" in line and not line.strip().startswith("#")
    }
    required_keys = {"SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "LLM_PROVIDER", "LLM_MODEL"}
    missing = required_keys - keys
    for key in sorted(missing):
        errors.append(f".env.example에 필수 키 누락: {key}")
    if not missing:
        ok(".env.example 필수 키 모두 존재")
    return errors


def check_no_secrets_in_example() -> list[str]:
    errors = []
    example = BACKEND / ".env.example"
    if not example.exists():
        return []
    content = example.read_text(encoding="utf-8")
    suspicious = [
        line for line in content.splitlines()
        if "=" in line
        and not line.strip().startswith("#")
        and len(line.split("=", 1)[-1].strip()) > 20
        and line.split("=", 1)[-1].strip().startswith("eyJ")
    ]
    for line in suspicious:
        key = line.split("=")[0].strip()
        errors.append(f".env.example에 실제 토큰이 있을 수 있음: {key}")
    if not suspicious:
        ok(".env.example에 명백한 실제 토큰 없음")
    return errors


def check_llm_abstraction() -> list[str]:
    errors = []
    llm_file = BACKEND / "app" / "services" / "llm.py"
    if not llm_file.exists():
        return ["services/llm.py 없음 — LLM 추상화 레이어 누락"]
    content = llm_file.read_text(encoding="utf-8")
    if "LLM_PROVIDER" not in content:
        errors.append("llm.py가 LLM_PROVIDER 설정을 참조하지 않음")
    else:
        ok("LLM provider 추상화 정상")
    return errors


def check_routes_no_direct_llm() -> list[str]:
    errors = []
    routes_dir = BACKEND / "app" / "api" / "routes"
    if not routes_dir.exists():
        return []
    for route_file in routes_dir.glob("*.py"):
        content = route_file.read_text(encoding="utf-8")
        if "ChatOllama" in content or "ChatAnthropic" in content or "ChatOpenAI" in content:
            errors.append(f"라우터에서 LLM 직접 호출: {route_file.name} — services/llm.py 경유 필요")
    if not errors:
        ok("라우터에서 LLM 직접 호출 없음")
    return errors


def main() -> int:
    print("=" * 50)
    print("Secretary AI Harness Check")
    print("=" * 50)

    all_errors: list[str] = []
    all_errors += check_required_files()
    all_errors += check_env_not_committed()
    all_errors += check_env_example_keys()
    all_errors += check_no_secrets_in_example()
    all_errors += check_llm_abstraction()
    all_errors += check_routes_no_direct_llm()

    print()
    if all_errors:
        print(f"검사 실패 ({len(all_errors)}건):")
        for err in all_errors:
            print(f"  - {err}")
        return 1

    print("모든 검사 통과")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
