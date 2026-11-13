from datetime import date, datetime, time, timedelta
from typing import Annotated

from fastapi import Depends, APIRouter, HTTPException, Query, status
from sqlmodel import col, func, select

from ..deps import CurrentUser, SessionDep
from ..models import Platform, Trip, TripCreate, TripPage, TripRead, TripUpdate

router = APIRouter(prefix="/trips", tags=["trips"])


def to_read(trip: Trip) -> TripRead:
    return TripRead(**trip.model_dump(), total=round(trip.fare + trip.tip, 2))


def get_owned_trip(trip_id: int, session: SessionDep, user: CurrentUser) -> Trip:
    trip = session.get(Trip, trip_id)
    # Same 404 for "missing" and "someone else's", so ids can't be probed.
    if trip is None or trip.user_id != user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Trip not found")
    return trip

OwnedTrip = Annotated[Trip, Depends(get_owned_trip)]



@router.get("", response_model=TripPage)
def list_trips(
    session: SessionDep,
    user: CurrentUser,
    platform: Platform | None = None,
    start: date | None = None,
    end: date | None = None,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    offset: Annotated[int, Query(ge=0)] = 0,
):
    filters = [Trip.user_id == user.id]
    if start and end and end < start:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "end must be on or after start")

    if platform:
        filters.append(Trip.platform == platform)
    if start:
        filters.append(Trip.started_at >= datetime.combine(start, time.min))
    if end:
        filters.append(Trip.started_at < datetime.combine(end + timedelta(days=1), time.min))

    total = session.exec(select(func.count()).select_from(Trip).where(*filters)).one()
    rows = session.exec(
        select(Trip)
        .where(*filters)
        .order_by(col(Trip.started_at).desc())
        .offset(offset)
        .limit(limit)
    ).all()
    return TripPage(items=[to_read(t) for t in rows], total=total)


@router.post("", response_model=TripRead, status_code=status.HTTP_201_CREATED)
def create_trip(data: TripCreate, session: SessionDep, user: CurrentUser):
    trip = Trip.model_validate(data, update={"user_id": user.id})
    session.add(trip)
    session.commit()
    session.refresh(trip)
    return to_read(trip)


@router.get("/{trip_id}", response_model=TripRead)
def read_trip(trip: OwnedTrip):
    return to_read(trip)


@router.patch("/{trip_id}", response_model=TripRead)
def update_trip(trip: OwnedTrip, data: TripUpdate, session: SessionDep):
    changes = data.model_dump(exclude_unset=True)
    # Only notes may be cleared with null; the other columns are required.
    changes = {k: v for k, v in changes.items() if v is not None or k == "notes"}
    trip.sqlmodel_update(changes)
    session.add(trip)
    session.commit()
    session.refresh(trip)
    return to_read(trip)


@router.delete("/{trip_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_trip(trip: OwnedTrip, session: SessionDep):
    session.delete(trip)
    session.commit()
