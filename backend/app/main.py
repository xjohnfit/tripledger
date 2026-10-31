from contextlib import asynccontextmanager
from typing import Annotated

from fastapi import Depends, FastAPI
from sqlmodel import Session, select

from .database import create_db_and_tables, get_session
from .models import Trip, TripCreate, TripRead
from .routers import auth

@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()  # runs once at startup
    yield


app = FastAPI(title="TripLedger API", lifespan=lifespan)

app.include_router(auth.router)

SessionDep = Annotated[Session, Depends(get_session)]


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/trips", response_model=TripRead, status_code=201)
def create_trip(data: TripCreate, session: SessionDep):
    trip = Trip.model_validate(data, update={"user_id": 1})  # fake user until auth exists
    session.add(trip)
    session.commit()
    session.refresh(trip)
    return TripRead(**trip.model_dump(), total=trip.fare + trip.tip)


@app.get("/trips", response_model=list[TripRead])
def list_trips(session: SessionDep):
    trips = session.exec(select(Trip)).all()
    return [TripRead(**t.model_dump(), total=t.fare + t.tip) for t in trips]
