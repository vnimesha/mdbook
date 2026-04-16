from fastapi import APIRouter, HTTPException, status
from datetime import datetime, timezone
import uuid

from models import BookMeta, CreateBookRequest, UpdateBookRequest
import storage

router = APIRouter(prefix="/books", tags=["books"])


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


@router.get("")
def list_books():
    return storage.list_books()


@router.post("", status_code=status.HTTP_201_CREATED)
def create_book(req: CreateBookRequest) -> BookMeta:
    book_id = str(uuid.uuid4())
    now = _now()
    book = BookMeta(
        id=book_id,
        title=req.title,
        author=req.author,
        description=req.description,
        cover_color=req.cover_color,
        tags=req.tags,
        chapters=[],
        created_at=now,
        updated_at=now,
    )
    storage.save_book(book)
    return book


@router.get("/{book_id}")
def get_book(book_id: str) -> BookMeta:
    book = storage.load_book(book_id)
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    return book


@router.patch("/{book_id}")
def update_book(book_id: str, req: UpdateBookRequest) -> BookMeta:
    book = storage.load_book(book_id)
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    if req.title is not None:
        book.title = req.title
    if req.author is not None:
        book.author = req.author
    if req.description is not None:
        book.description = req.description
    if req.cover_color is not None:
        book.cover_color = req.cover_color
    if req.tags is not None:
        book.tags = req.tags
    book.updated_at = _now()
    storage.save_book(book)
    return book


@router.delete("/{book_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_book(book_id: str):
    deleted = storage.delete_book(book_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Book not found")
