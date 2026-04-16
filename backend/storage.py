"""Filesystem-based storage for books and chapters."""
import json
import os
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

import aiofiles

from models import BookMeta, ChapterMeta

DATA_DIR = Path(__file__).parent / "data" / "books"
DATA_DIR.mkdir(parents=True, exist_ok=True)
INDEX_FILE = Path(__file__).parent / "data" / "index.json"


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _load_index() -> dict[str, dict]:
    if not INDEX_FILE.exists():
        return {}
    with open(INDEX_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def _save_index(index: dict[str, dict]) -> None:
    INDEX_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(INDEX_FILE, "w", encoding="utf-8") as f:
        json.dump(index, f, indent=2, ensure_ascii=False)


def _book_dir(book_id: str) -> Path:
    return DATA_DIR / book_id


def _meta_path(book_id: str) -> Path:
    return _book_dir(book_id) / "meta.json"


def _chapter_path(book_id: str, filename: str) -> Path:
    return _book_dir(book_id) / filename


def load_book(book_id: str) -> Optional[BookMeta]:
    path = _meta_path(book_id)
    if not path.exists():
        return None
    with open(path, "r", encoding="utf-8") as f:
        return BookMeta(**json.load(f))


def save_book(book: BookMeta) -> None:
    book_dir = _book_dir(book.id)
    book_dir.mkdir(parents=True, exist_ok=True)
    with open(_meta_path(book.id), "w", encoding="utf-8") as f:
        json.dump(book.model_dump(), f, indent=2, ensure_ascii=False)
    index = _load_index()
    index[book.id] = {
        "id": book.id,
        "title": book.title,
        "author": book.author,
        "description": book.description,
        "cover_color": book.cover_color,
        "tags": book.tags,
        "chapter_count": len(book.chapters),
        "created_at": book.created_at,
        "updated_at": book.updated_at,
    }
    _save_index(index)


def delete_book(book_id: str) -> bool:
    book = load_book(book_id)
    if not book:
        return False
    import shutil
    shutil.rmtree(_book_dir(book_id), ignore_errors=True)
    index = _load_index()
    index.pop(book_id, None)
    _save_index(index)
    return True


def list_books() -> list[dict]:
    index = _load_index()
    return sorted(index.values(), key=lambda b: b["created_at"], reverse=True)


def count_words(text: str) -> int:
    return len(re.findall(r"\b\w+\b", text))


async def save_chapter_file(book_id: str, filename: str, content: bytes) -> int:
    path = _chapter_path(book_id, filename)
    async with aiofiles.open(path, "wb") as f:
        await f.write(content)
    text = content.decode("utf-8", errors="replace")
    return count_words(text)


async def read_chapter_file(book_id: str, filename: str) -> Optional[str]:
    path = _chapter_path(book_id, filename)
    if not path.exists():
        return None
    async with aiofiles.open(path, "r", encoding="utf-8") as f:
        return await f.read()


def delete_chapter_file(book_id: str, filename: str) -> None:
    path = _chapter_path(book_id, filename)
    if path.exists():
        path.unlink()
