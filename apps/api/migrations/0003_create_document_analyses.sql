CREATE TABLE documents_next (
  id TEXT PRIMARY KEY NOT NULL,
  installation_id TEXT NOT NULL,
  original_name TEXT NOT NULL,
  size_bytes INTEGER NOT NULL CHECK (size_bytes > 0),
  mime_type TEXT NOT NULL CHECK (mime_type = 'application/pdf'),
  provider TEXT NOT NULL CHECK (provider = 'gemini'),
  provider_file_name TEXT NOT NULL,
  provider_file_uri TEXT NOT NULL,
  provider_expires_at TEXT,
  status TEXT NOT NULL CHECK (status IN ('uploaded', 'analyzing', 'analyzed')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (installation_id)
    REFERENCES guest_installations (installation_id)
    ON DELETE CASCADE
) WITHOUT ROWID;

INSERT INTO documents_next (
  id,
  installation_id,
  original_name,
  size_bytes,
  mime_type,
  provider,
  provider_file_name,
  provider_file_uri,
  provider_expires_at,
  status,
  created_at,
  updated_at
)
SELECT
  id,
  installation_id,
  original_name,
  size_bytes,
  mime_type,
  provider,
  provider_file_name,
  provider_file_uri,
  provider_expires_at,
  status,
  created_at,
  updated_at
FROM documents;

DROP TABLE documents;
ALTER TABLE documents_next RENAME TO documents;

CREATE INDEX documents_installation_id_idx
  ON documents (installation_id);

CREATE TABLE document_analyses (
  document_id TEXT PRIMARY KEY NOT NULL,
  schema_version TEXT NOT NULL,
  prompt_version TEXT NOT NULL,
  model TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  topics_json TEXT NOT NULL CHECK (json_valid(topics_json)),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  FOREIGN KEY (document_id)
    REFERENCES documents (id)
    ON DELETE CASCADE
) WITHOUT ROWID;
