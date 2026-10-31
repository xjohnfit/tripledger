from sqlmodel import Session, SQLModel, create_engine

engine = create_engine(
    "sqlite:///tripledger.db",
    connect_args={"check_same_thread": False},  # FastAPI uses worker threads
)


def create_db_and_tables() -> None:
    SQLModel.metadata.create_all(engine)


def get_session():
    """One database session per request, closed afterwards."""
    with Session(engine) as session:
        yield session
