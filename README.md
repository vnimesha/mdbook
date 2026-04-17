# MDBook — Your Digital Library

A production-grade digital book reader built with **Next.js 16** (frontend) and **FastAPI** (backend). Upload Markdown or MDX files and read them with a polished reader experience.

## Features

- **Book library** — upload, organise, and delete books with cover colours and tags
- **Chapter management** — upload `.md` / `.mdx` chapter files with automatic word count
- **Paginated reader** — chapters are split into pages by heading level (H1 / H2) for focused reading
- **LaTeX math rendering** — full KaTeX support via `remark-math` + `rehype-katex`
- **Syntax highlighting** — code blocks highlighted with `rehype-highlight`
- **Reading progress** — auto-saves your position (chapter + page + scroll offset) to localStorage; resumes exactly where you left off
- **Bookmarks** — add multiple named bookmarks, jump to any, delete; all persisted in localStorage
- **Continue reading** — book page shows "Continue Reading" with the chapter and page you left off on
- **Dark / light mode** — full theme support with smooth transitions
- **Responsive layout** — sidebar TOC on wide screens, clean single-column on mobile

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 16, React, Tailwind CSS v4 |
| Backend | FastAPI, Python 3.11+ |
| Content | MDX via `next-mdx-remote`, KaTeX, rehype-highlight |
| Storage | JSON files (books/chapters) + localStorage (reading state) |

## Getting Started

### Docker (recommended)

Requires [Docker Desktop](https://www.docker.com/products/docker-desktop/).

```bash
docker compose up --build
```

- Frontend → [http://localhost:3000](http://localhost:3000)
- Backend API → [http://localhost:8000](http://localhost:8000)
- Swagger docs → [http://localhost:8000/docs](http://localhost:8000/docs)

Book data persists in a named Docker volume (`bookdata`) across restarts. To wipe it:

```bash
docker compose down -v
```

**Deploying on a remote host?** Pass your host address as a build arg so client-side JS calls the right URL:

```bash
NEXT_PUBLIC_BACKEND_URL=http://your-host:8000 docker compose up --build
# or
docker compose build --build-arg NEXT_PUBLIC_BACKEND_URL=http://your-host:8000
docker compose up
```

---

### Windows (local dev)

Double-click **`launch.bat`** — it will:
1. Create a Python virtual environment and install backend deps
2. Install Node dependencies if needed
3. Start the FastAPI backend on `http://localhost:8000`
4. Start the Next.js frontend on `http://localhost:3000`
5. Open the app in your browser automatically

### Manual

**Backend**
```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS / Linux
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

**Frontend**
```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
mdbook/
├── app/                         # Next.js App Router pages
│   ├── books/[bookId]/
│   │   ├── chapter/[chapterId]/ # Reader page (paginated)
│   │   │   ├── page.tsx         # Server component — paginates & renders MDX
│   │   │   ├── ReaderHeader.tsx # Sticky header with breadcrumb + bookmark menu
│   │   │   ├── ReaderProgress.tsx
│   │   │   ├── ReadingTracker.tsx  # Auto-saves scroll position
│   │   │   ├── BookmarkMenu.tsx    # Add / list / jump / delete bookmarks
│   │   │   └── PageNav.tsx         # Prev / next page & chapter navigation
│   │   └── page.tsx             # Book overview + Continue Reading button
│   └── page.tsx                 # Library home
├── backend/
│   ├── main.py                  # FastAPI app
│   ├── routers/
│   │   ├── books.py
│   │   └── chapters.py
│   ├── storage.py
│   └── data/                    # JSON metadata + uploaded .md files
├── lib/
│   ├── paginate.ts              # Splits markdown into pages by heading
│   ├── reader-storage.ts        # localStorage helpers (position + bookmarks)
│   ├── api.ts                   # Fetch wrappers for the FastAPI backend
│   ├── types.ts
│   └── ui.ts                    # Design tokens (all Tailwind colour decisions)
└── launch.bat                   # One-click launcher (Windows)
```

## API

The FastAPI backend exposes a REST API. Interactive docs available at `http://localhost:8000/docs`.

| Method | Path | Description |
|---|---|---|
| GET | `/books` | List all books |
| POST | `/books` | Create a new book |
| GET | `/books/{id}` | Get book metadata |
| PATCH | `/books/{id}` | Update book metadata |
| DELETE | `/books/{id}` | Delete book |
| GET | `/books/{id}/chapters` | List chapters |
| POST | `/books/{id}/chapters` | Upload a chapter (.md file) |
| GET | `/books/{id}/chapters/{cid}` | Get chapter content |
| PATCH | `/books/{id}/chapters/{cid}` | Update chapter metadata |
| DELETE | `/books/{id}/chapters/{cid}` | Delete chapter |
| POST | `/books/{id}/images` | Upload an image |

## Reading State (localStorage)

All reading state is stored client-side — no login required.

| Key | Contents |
|---|---|
| `mdbook:position:<bookId>` | Last read chapter, page index, scroll offset |
| `mdbook:bookmarks:<bookId>` | Array of manual bookmarks with chapter, page, scroll |
