from enum import Enum

from pydantic import NaiveDatetime
from sqlmodel import Field, SQLModel
from datetime import date


class Platform(str, Enum):
    uber = "uber"
    lyft = "lyft"
    direct = "direct"


# -------------------- TRIP MODEL --------------------
class TripBase(SQLModel):
    # Local wall-clock time, no timezone: "when the driver started the trip".
    started_at: NaiveDatetime
    platform: Platform = Platform.uber
    distance_mi: float = Field(gt=0, le=1000)
    fare: float = Field(ge=0, le=10000)
    tip: float = Field(default=0, ge=0, le=10000)
    notes: str | None = Field(default=None, max_length=500)


class Trip(TripBase, table=True):
    id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True)


class TripCreate(TripBase):
    pass


class TripRead(TripBase):
    id: int
    total: float

class TripUpdate(SQLModel):
    """Every field optional, so PATCH can change just one thing."""

    started_at: NaiveDatetime | None = None
    platform: Platform | None = None
    distance_mi: float | None = Field(default=None, gt=0, le=1000)
    fare: float | None = Field(default=None, ge=0, le=10000)
    tip: float | None = Field(default=None, ge=0, le=10000)
    notes: str | None = Field(default=None, max_length=500)


class TripPage(SQLModel):
    items: list[TripRead]
    total: int


class Category(str, Enum):
    gas = "gas"
    maintenance = "maintenance"
    tolls = "tolls"
    other = "other"


# -------------------- EXPENSE MODEL --------------------
class ExpenseBase(SQLModel):
    spent_on: date
    category: Category
    amount: float = Field(gt=0, le=10000)
    note: str | None = Field(default=None, max_length=200)


class Expense(ExpenseBase, table=True):
    id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True)


class ExpenseCreate(ExpenseBase):
    pass


class ExpenseRead(ExpenseBase):
    id: int

# -------------------- USER MODEL --------------------

class User(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    email: str = Field(unique=True, index=True)
    hashed_password: str


class UserCreate(SQLModel):
    email: str = Field(min_length=3, max_length=254)
    password: str = Field(min_length=8, max_length=128)


class UserRead(SQLModel):
    id: int
    email: str # no hashed_password here, on purpose


class Token(SQLModel):
    access_token: str
    token_type: str = "bearer"

class DayTotal(SQLModel):
    day: date
    earnings: float


class Summary(SQLModel):
    start: date
    end: date
    earnings: float
    trips: int
    expenses: float
    net: float
    by_day: list[DayTotal]
    expenses_by_category: dict[str, float]
