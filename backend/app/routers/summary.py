from datetime import date, datetime, time, timedelta

from fastapi import APIRouter, HTTPException, status
from sqlmodel import func, select

from ..deps import CurrentUser, SessionDep
from ..models import DayTotal, Expense, Summary, Trip

router = APIRouter(tags=["summary"])


@router.get("/summary", response_model=Summary)
def get_summary(
    session: SessionDep,
    user: CurrentUser,
    start: date | None = None,
    end: date | None = None,
):
    # Default range: the current Monday to Sunday.
    today = date.today()
    start = start or today - timedelta(days=today.weekday())
    end = end or start + timedelta(days=6)
    if end < start:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "end must be on or after start")
    if (end - start).days > 366:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "Range is limited to one year")

    lo = datetime.combine(start, time.min)
    hi = datetime.combine(end + timedelta(days=1), time.min)

    trips = session.exec(
        select(Trip).where(Trip.user_id == user.id, Trip.started_at >= lo, Trip.started_at < hi)
    ).all()

    # Python does the per-day grouping...
    per_day = {start + timedelta(days=i): 0.0 for i in range((end - start).days + 1)}
    for t in trips:
        per_day[t.started_at.date()] += t.fare + t.tip
    earnings = round(sum(per_day.values()), 2)

    # ...and the database does the expense totals with GROUP BY.
    rows = session.exec(
        select(Expense.category, func.sum(Expense.amount))
        .where(Expense.user_id == user.id, Expense.spent_on >= start, Expense.spent_on <= end)
        .group_by(Expense.category)
    ).all()
    by_category = {cat.value: round(total, 2) for cat, total in rows}
    expenses = round(sum(by_category.values()), 2)

    return Summary(
        start=start,
        end=end,
        earnings=earnings,
        trips=len(trips),
        expenses=expenses,
        net=round(earnings - expenses, 2),
        by_day=[DayTotal(day=d, earnings=round(v, 2)) for d, v in per_day.items()],
        expenses_by_category=by_category,
    )
