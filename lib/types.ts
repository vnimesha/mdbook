export interface ChapterMeta {
  id: string;
  title: string;
  filename: string;
  order: number;
  word_count: number;
  created_at: string;
}

export interface BookMeta {
  id: string;
  title: string;
  author: string;
  description: string;
  cover_color: string;
  tags: string[];
  chapters: ChapterMeta[];
  created_at: string;
  updated_at: string;
}

export interface BookSummary {
  id: string;
  title: string;
  author: string;
  description: string;
  cover_color: string;
  tags: string[];
  chapter_count: number;
  created_at: string;
  updated_at: string;
}

export interface ChapterContent {
  meta: ChapterMeta;
  content: string;
  frontmatter: Record<string, string>;
}

export interface CreateBookPayload {
  title: string;
  author: string;
  description?: string;
  cover_color?: string;
  tags?: string[];
}
