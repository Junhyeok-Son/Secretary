from pydantic import BaseModel, UUID4
from datetime import datetime
from typing import Optional
from enum import Enum


class EventStatus(str, Enum):
    confirmed = "confirmed"
    tentative = "tentative"
    cancelled = "cancelled"


class RecurrenceFreq(str, Enum):
    daily = "daily"
    weekly = "weekly"
    monthly = "monthly"
    yearly = "yearly"


# --- Calendar Events ---

class EventCreate(BaseModel):
    title: str
    description: Optional[str] = None
    start_at: datetime
    end_at: datetime
    location: Optional[str] = None
    status: EventStatus = EventStatus.confirmed
    recurrence_freq: Optional[RecurrenceFreq] = None
    recurrence_until: Optional[datetime] = None
    google_event_id: Optional[str] = None


class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    start_at: Optional[datetime] = None
    end_at: Optional[datetime] = None
    location: Optional[str] = None
    status: Optional[EventStatus] = None


class EventResponse(EventCreate):
    id: UUID4
    user_id: str
    created_at: datetime
    updated_at: datetime


# --- Knowledge ---

class KnowledgeCreate(BaseModel):
    content: str
    source: Optional[str] = None  # "manual" | "document" | "conversation"
    tags: list[str] = []


class KnowledgeResponse(KnowledgeCreate):
    id: UUID4
    user_id: str
    created_at: datetime


# --- Chat ---

class MessageRole(str, Enum):
    user = "user"
    assistant = "assistant"
    system = "system"


class ChatMessage(BaseModel):
    role: MessageRole
    content: str


class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None


class ChatResponse(BaseModel):
    message: str
    session_id: str
    sources: list[dict] = []
