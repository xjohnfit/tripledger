from datetime import date
from typing import Annotated

from fastapi import APIRouter, HTTPException, Query, status
from sqlmodel import col, select

from ..deps import CurrentUser, SessionDep
from ..models import Category, Expense, ExpenseCreate, ExpenseRead

router = APIRouter(prefix="/expenses", tags=["expenses"])


@router.get("", response_model=list[ExpenseRead])
def list_expenses(
    session: SessionDep,
    user: CurrentUser,
    category: Category | None = None,
    start: date | None = None,
    end: date | None = None,
):
    filters = [Expense.user_id == user.id]
    if category:
        filters.append(Expense.category == category)
    if start:
        filters.append(Expense.spent_on >= start)
    if end:
        filters.append(Expense.spent_on <= end)
    rows = session.exec(
        select(Expense).where(*filters).order_by(col(Expense.spent_on).desc())
    ).all()
    return rows


@router.post("", response_model=ExpenseRead, status_code=status.HTTP_201_CREATED)
def create_expense(data: ExpenseCreate, session: SessionDep, user: CurrentUser):
    expense = Expense.model_validate(data, update={"user_id": user.id})
    session.add(expense)
    session.commit()
    session.refresh(expense)
    return expense


@router.delete("/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_expense(expense_id: int, session: SessionDep, user: CurrentUser):
    expense = session.get(Expense, expense_id)
    if not expense or expense.user_id != user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Expense not found")
    session.delete(expense)
    session.commit()
