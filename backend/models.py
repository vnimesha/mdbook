from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class ChapterMeta(BaseModel):
    id: str
    title: str
    filename: str
    order: int
    word_count: int = 0
    created_at: str


class BookMeta(BaseModel):
    id: str
    title: str
    author: str
    description: str
    cover_color: str = "#1a1a2e"
    tags: list[str] = Field(default_factory=list)
    chapters: list[ChapterMeta] = Field(default_factory=list)
    created_at: str
    updated_at: str


class CreateBookRequest(BaseModel):
    title: str
    author: str
    description: str = ""
    cover_color: str = "#1a1a2e"
    tags: list[str] = Field(default_factory=list)


class UpdateBookRequest(BaseModel):
    title: Optional[str] = None
    author: Optional[str] = None
    description: Optional[str] = None
    cover_color: Optional[str] = None
    tags: Optional[list[str]] = None


class UpdateChapterRequest(BaseModel):
    title: Optional[str] = None
    order: Optional[int] = None


class ChapterContent(BaseModel):
    meta: ChapterMeta
    content: str
    frontmatter: dict
