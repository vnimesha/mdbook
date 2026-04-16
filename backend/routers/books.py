import re
import uuid
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, File, HTTPException, UploadFile, status
from fastapi.responses import FileResponse

from models import BookMeta, CreateBookRequest, UpdateBookRequest
import storage

ALLOWED_IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".avif"}

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


# ── Images ────────────────────────────────────────────────────────────────────

@router.post("/{book_id}/images", status_code=status.HTTP_201_CREATED)
async def upload_image(book_id: str, file: UploadFile = File(...)):
    book = storage.load_book(book_id)
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    ext = Path(file.filename or "").suffix.lower()
    if ext not in ALLOWED_IMAGE_EXTS:
        raise HTTPException(status_code=400, detail=f"Unsupported image type: {ext}")

    # Sanitise filename: keep word chars, dots, hyphens
    raw_name = Path(file.filename or "image").name
    safe_name = re.sub(r"[^\w.\-]", "_", raw_name)

    images_dir = storage.DATA_DIR / book_id / "images"
    images_dir.mkdir(parents=True, exist_ok=True)

    content = await file.read()
    (images_dir / safe_name).write_bytes(content)

    return {"filename": safe_name, "url": f"/books/{book_id}/images/{safe_name}"}


@router.get("/{book_id}/images/{filename}")
def get_image(book_id: str, filename: str):
    # Prevent path traversal
    safe_name = Path(filename).name
    path = storage.DATA_DIR / book_id / "images" / safe_name
    if not path.exists():
        raise HTTPException(status_code=404, detail="Image not found")
    return FileResponse(path)
