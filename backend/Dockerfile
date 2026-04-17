FROM python:3.11-slim

WORKDIR /app

# Install deps first (layer caches when code changes)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source (data/ is excluded by .dockerignore and mounted as a volume)
COPY . .

# Create data directory — will be overridden by volume mount at runtime
RUN mkdir -p data/books

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
