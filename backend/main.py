"""MDBook FastAPI backend."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import books, chapters

app = FastAPI(
    title="MDBook API",
    description="Upload and manage books from .md and .mdx files",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(books.router)
app.include_router(chapters.router)


@app.get("/health")
def health():
    return {"status": "ok"}
