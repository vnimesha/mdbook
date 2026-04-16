import re
import uuid
from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status

from models import ChapterContent, ChapterMeta, UpdateChapterRequest
import storage

router = APIRouter(prefix="/books/{book_id}/chapters", tags=["chapters"])

ALLOWED_EXTENSIONS = {".md", ".mdx"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _safe_filename(name: str, ext: str) -> str:
    slug = re.sub(r"[^\w\-]", "-", name.lower()).strip("-")
    slug = re.sub(r"-+", "-", slug)
    return f"{slug}{ext}"


def _parse_frontmatter(content: str) -> tuple[dict, str]:
    """Strip YAML frontmatter and return (metadata, body)."""
    fm: dict = {}
    if content.startswith("---"):
        end = content.find("\n---", 3)
        if end != -1:
            block = content[3:end].strip()
            for line in block.splitlines():
                if ":" in line:
                    key, _, val = line.partition(":")
                    fm[key.strip()] = val.strip().strip('"').strip("'")
            content = content[end + 4:].lstrip("\n")
    return fm, content


@router.get("")
def list_chapters(book_id: str):
    book = storage.load_book(book_id)
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    return sorted(book.chapters, key=lambda c: c.order)


@router.post("", status_code=status.HTTP_201_CREATED)
async def upload_chapter(
    book_id: str,
    file: Annotated[UploadFile, File()],
    title: Annotated[str | None, Form()] = None,
    order: Annotated[int | None, Form()] = None,
) -> ChapterMeta:
    book = storage.load_book(book_id)
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    original_name = file.filename or "chapter.md"
    ext = "." + original_name.rsplit(".", 1)[-1].lower() if "." in original_name else ".md"
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"Only {', '.join(ALLOWED_EXTENSIONS)} files are allowed")

    raw = await file.read()
    if len(raw) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File too large (max 10 MB)")

    chapter_id = str(uuid.uuid4())
    filename = f"{chapter_id}{ext}"

    # Determine title: prefer form field, then frontmatter, then original filename
    text = raw.decode("utf-8", errors="replace")
    fm, _ = _parse_frontmatter(text)
    chapter_title = title or fm.get("title") or original_name.rsplit(".", 1)[0].replace("-", " ").replace("_", " ").title()

    word_count = await storage.save_chapter_file(book_id, filename, raw)

    next_order = order if order is not None else (max((c.order for c in book.chapters), default=-1) + 1)

    chapter = ChapterMeta(
        id=chapter_id,
        title=chapter_title,
        filename=filename,
        order=next_order,
        word_count=word_count,
        created_at=_now(),
    )
    book.chapters.append(chapter)
    book.updated_at = _now()
    storage.save_book(book)
    return chapter


@router.get("/{chapter_id}")
async def get_chapter(book_id: str, chapter_id: str) -> ChapterContent:
    book = storage.load_book(book_id)
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    chapter = next((c for c in book.chapters if c.id == chapter_id), None)
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")

    raw = await storage.read_chapter_file(book_id, chapter.filename)
    if raw is None:
        raise HTTPException(status_code=404, detail="Chapter file missing")

    fm, body = _parse_frontmatter(raw)
    return ChapterContent(meta=chapter, content=body, frontmatter=fm)


@router.patch("/{chapter_id}")
def update_chapter(book_id: str, chapter_id: str, req: UpdateChapterRequest) -> ChapterMeta:
    book = storage.load_book(book_id)
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    chapter = next((c for c in book.chapters if c.id == chapter_id), None)
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")

    if req.title is not None:
        chapter.title = req.title
    if req.order is not None:
        chapter.order = req.order
    book.updated_at = _now()
    storage.save_book(book)
    return chapter


@router.delete("/{chapter_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_chapter(book_id: str, chapter_id: str):
    book = storage.load_book(book_id)
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    chapter = next((c for c in book.chapters if c.id == chapter_id), None)
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")

    storage.delete_chapter_file(book_id, chapter.filename)
    book.chapters = [c for c in book.chapters if c.id != chapter_id]
    book.updated_at = _now()
    storage.save_book(book)
