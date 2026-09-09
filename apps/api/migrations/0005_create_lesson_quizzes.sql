CREATE TABLE lesson_quizzes (
  id TEXT PRIMARY KEY NOT NULL,
  lesson_id TEXT NOT NULL,
  schema_version TEXT NOT NULL,
  prompt_version TEXT NOT NULL,
  model TEXT NOT NULL,
  generation_status TEXT NOT NULL CHECK (generation_status IN ('generating', 'ready')),
  generation_token TEXT,
  title TEXT,
  questions_json TEXT CHECK (questions_json IS NULL OR json_valid(questions_json)),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  FOREIGN KEY (lesson_id)
    REFERENCES document_lessons (id)
    ON DELETE CASCADE,
  CHECK (
    (generation_status = 'generating'
      AND generation_token IS NOT NULL
      AND title IS NULL
      AND questions_json IS NULL)
    OR
    (generation_status = 'ready'
      AND generation_token IS NULL
      AND title IS NOT NULL
      AND questions_json IS NOT NULL)
  )
) WITHOUT ROWID;

CREATE INDEX lesson_quizzes_lesson_id_idx
  ON lesson_quizzes (lesson_id);

CREATE UNIQUE INDEX lesson_quizzes_cache_identity_idx
  ON lesson_quizzes (lesson_id, schema_version, prompt_version, model);

CREATE TABLE quiz_attempts (
  id TEXT PRIMARY KEY NOT NULL,
  quiz_id TEXT NOT NULL,
  installation_id TEXT NOT NULL,
  answers_json TEXT NOT NULL CHECK (json_valid(answers_json)),
  correct_count INTEGER NOT NULL CHECK (correct_count >= 0),
  total_questions INTEGER NOT NULL CHECK (total_questions > 0),
  score_percent INTEGER NOT NULL CHECK (score_percent BETWEEN 0 AND 100),
  weak_sections_json TEXT NOT NULL CHECK (json_valid(weak_sections_json)),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  FOREIGN KEY (quiz_id)
    REFERENCES lesson_quizzes (id)
    ON DELETE CASCADE,
  FOREIGN KEY (installation_id)
    REFERENCES guest_installations (installation_id)
    ON DELETE CASCADE,
  CHECK (correct_count <= total_questions)
) WITHOUT ROWID;

CREATE INDEX quiz_attempts_quiz_id_idx
  ON quiz_attempts (quiz_id);

CREATE INDEX quiz_attempts_installation_id_created_at_idx
  ON quiz_attempts (installation_id, created_at);
