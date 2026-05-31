from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # App
    APP_NAME: str = "Secretary AI"
    DEBUG: bool = False

    # Auth — 단일 사용자용 비밀 키
    APP_SECRET: str = "change-me"

    # Supabase
    SUPABASE_URL: str
    SUPABASE_ANON_KEY: str
    SUPABASE_SERVICE_ROLE_KEY: str

    # Qdrant
    QDRANT_HOST: str = "localhost"
    QDRANT_PORT: int = 6333
    QDRANT_COLLECTION: str = "knowledge"

    # Neo4j
    NEO4J_URI: str = "bolt://localhost:7687"
    NEO4J_USER: str = "neo4j"
    NEO4J_PASSWORD: str

    # LLM
    LLM_PROVIDER: str = "ollama"  # ollama | groq | anthropic | openai
    LLM_MODEL: str = "llama3.1"
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    GROQ_API_KEY: str = ""
    ANTHROPIC_API_KEY: str = ""
    OPENAI_API_KEY: str = ""

    # Embeddings
    EMBEDDING_MODEL: str = "nomic-embed-text"  # ollama embedding model

    class Config:
        env_file = ".env"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
