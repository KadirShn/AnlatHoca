CREATE TABLE document_lessons (
  id TEXT PRIMARY KEY NOT NULL,
  document_id TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes IN (10, 30, 60)),
  schema_version TEXT NOT NULL,
  prompt_version TEXT NOT NULL,
  model TEXT NOT NULL,
  generation_status TEXT NOT NULL CHECK (generation_status IN ('generating', 'ready')),
  generation_token TEXT,
  title TEXT,
  overview TEXT,
  learning_objectives_json TEXT CHECK (
    learning_objectives_json IS NULL OR json_valid(learning_objectives_json)
  ),
  sections_json TEXT CHECK (sections_json IS NULL OR json_valid(sections_json)),
  recap_json TEXT CHECK (recap_json IS NULL OR json_valid(recap_json)),
  skipped_topics_json TEXT CHECK (
    skipped_topics_json IS NULL OR json_valid(skipped_topics_json)
  ),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  FOREIGN KEY (document_id)
    REFERENCES documents (id)
    ON DELETE CASCADE,
  CHECK (
    (generation_status = 'generating'
      AND generation_token IS NOT NULL
      AND title IS NULL
      AND overview IS NULL
      AND learning_objectives_json IS NULL
      AND sections_json IS NULL
      AND recap_json IS NULL
      AND skipped_topics_json IS NULL)
    OR
    (generation_status = 'ready'
      AND generation_token IS NULL
      AND title IS NOT NULL
      AND overview IS NOT NULL
      AND learning_objectives_json IS NOT NULL
      AND sections_json IS NOT NULL
      AND recap_json IS NOT NULL
      AND skipped_topics_json IS NOT NULL)
  )
) WITHOUT ROWID;

CREATE INDEX document_lessons_document_id_idx
  ON document_lessons (document_id);

CREATE UNIQUE INDEX document_lessons_cache_identity_idx
  ON document_lessons (
    document_id,
    duration_minutes,
    schema_version,
    prompt_version,
    model
  );
