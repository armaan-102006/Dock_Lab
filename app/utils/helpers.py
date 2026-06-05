from typing import Any


def ensure_dict(obj: Any) -> dict:
    if obj is None:
        return {}
    if isinstance(obj, dict):
        return obj
    return obj.__dict__
