from fastapi import APIRouter, Depends, HTTPException
from supabase import Client
from app.db.supabase import get_supabase
from app.models.schemas import EventCreate, EventUpdate, EventResponse
from datetime import datetime

router = APIRouter(prefix="/events", tags=["events"])


@router.get("/", response_model=list[EventResponse])
async def list_events(
    start: datetime | None = None,
    end: datetime | None = None,
    db: Client = Depends(get_supabase),
):
    query = db.table("events").select("*")
    if start:
        query = query.gte("start_at", start.isoformat())
    if end:
        query = query.lte("end_at", end.isoformat())
    result = query.order("start_at").execute()
    return result.data


DEV_USER_ID = "00000000-0000-0000-0000-000000000001"


@router.post("/", response_model=EventResponse, status_code=201)
async def create_event(payload: EventCreate, db: Client = Depends(get_supabase)):
    data = payload.model_dump(mode="json")
    data["user_id"] = DEV_USER_ID
    result = db.table("events").insert(data).execute()
    return result.data[0]


@router.patch("/{event_id}", response_model=EventResponse)
async def update_event(
    event_id: str, payload: EventUpdate, db: Client = Depends(get_supabase)
):
    data = payload.model_dump(exclude_none=True, mode="json")
    result = db.table("events").update(data).eq("id", event_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Event not found")
    return result.data[0]


@router.delete("/{event_id}", status_code=204)
async def delete_event(event_id: str, db: Client = Depends(get_supabase)):
    db.table("events").delete().eq("id", event_id).execute()
