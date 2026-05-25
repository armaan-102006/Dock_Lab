from typing import Generator


def get_db() -> Generator:
    """Placeholder DB dependency. Replace with real DB session."""
    db = None
    try:
        yield db
    finally:
        pass
