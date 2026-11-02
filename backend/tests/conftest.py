import pytest
from fastapi.testclient import TestClient
from sqlalchemy.pool import StaticPool
from sqlmodel import Session, SQLModel, create_engine

from app.database import get_session
from app.main import app


@pytest.fixture
def client():
    # A throwaway in-memory database per test.
    engine = create_engine(
        "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    SQLModel.metadata.create_all(engine)

    def override_session():
        with Session(engine) as session:
            yield session

    app.dependency_overrides[get_session] = override_session
    yield TestClient(app)
    app.dependency_overrides.clear()


@pytest.fixture
def login(client):
    def _login(email="driver@example.com"):
        client.post("/auth/register", json={"email": email, "password": "password123"})
        res = client.post("/auth/login", data={"username": email, "password": "password123"})
        return {"Authorization": f"Bearer {res.json()['access_token']}"}

    return _login
