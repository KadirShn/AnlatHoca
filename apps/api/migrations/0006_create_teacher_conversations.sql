CREATE TABLE teacher_threads (
  id TEXT PRIMARY KEY NOT NULL,
  lesson_id TEXT NOT NULL,
  installation_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  FOREIGN KEY (lesson_id)
    REFERENCES document_lessons (id)
    ON DELETE CASCADE,
  FOREIGN KEY (installation_id)
    REFERENCES guest_installations (installation_id)
    ON DELETE CASCADE,
  UNIQUE (lesson_id, installation_id)
) WITHOUT ROWID;

CREATE INDEX teacher_threads_installation_id_idx
  ON teacher_threads (installation_id);

CREATE TABLE teacher_messages (
  id TEXT PRIMARY KEY NOT NULL,
  thread_id TEXT NOT NULL,
  sequence INTEGER NOT NULL CHECK (sequence > 0),
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL CHECK (length(content) BETWEEN 1 AND 3000),
  related_sections_json TEXT CHECK (
    related_sections_json IS NULL OR json_valid(related_sections_json)
  ),
  suggested_follow_ups_json TEXT CHECK (
    suggested_follow_ups_json IS NULL OR json_valid(suggested_follow_ups_json)
  ),
  prompt_version TEXT,
  model TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  FOREIGN KEY (thread_id)
    REFERENCES teacher_threads (id)
    ON DELETE CASCADE,
  UNIQUE (thread_id, sequence),
  CHECK (
    (role = 'user'
      AND related_sections_json IS NULL
      AND suggested_follow_ups_json IS NULL
      AND prompt_version IS NULL
      AND model IS NULL)
    OR
    (role = 'assistant'
      AND related_sections_json IS NOT NULL
      AND suggested_follow_ups_json IS NOT NULL
      AND prompt_version IS NOT NULL
      AND model IS NOT NULL)
  )
) WITHOUT ROWID;

CREATE INDEX teacher_messages_thread_role_created_at_idx
  ON teacher_messages (thread_id, role, created_at);
