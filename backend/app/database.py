from sqlmodel import Session, SQLModel, create_engine

from .config import settings


def normalize_url(url: str) -> str:
    # Neon hands out "postgresql://..." (some hosts use "postgres://...").
    # SQLAlchemy needs "postgresql+psycopg://" to use the psycopg 3 driver.
    if url.startswith("postgres://"):
        url = "postgresql://" + url[len("postgres://"):]
    if url.startswith("postgresql://"):
        url = "postgresql+psycopg://" + url[len("postgresql://"):]
    return url


DATABASE_URL = normalize_url(settings.database_url)

if DATABASE_URL.startswith("sqlite"):
    # check_same_thread=False lets SQLite be used from FastAPI's worker threads.
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    # Neon suspends idle databases. pool_pre_ping tests a pooled connection
    # before using it, and pool_recycle replaces connections older than
    # 5 minutes, so the first request after a quiet period doesn't fail.
    engine = create_engine(DATABASE_URL, pool_pre_ping=True, pool_recycle=300)


def create_db_and_tables() -> None:
    SQLModel.metadata.create_all(engine)


def get_session():
    """One database session per request, closed afterwards."""
    with Session(engine) as session:
        yield session
