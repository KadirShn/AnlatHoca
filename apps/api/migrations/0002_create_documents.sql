CREATE TABLE documents (
  id TEXT PRIMARY KEY NOT NULL,
  installation_id TEXT NOT NULL,
  original_name TEXT NOT NULL,
  size_bytes INTEGER NOT NULL CHECK (size_bytes > 0),
  mime_type TEXT NOT NULL CHECK (mime_type = 'application/pdf'),
  provider TEXT NOT NULL CHECK (provider = 'gemini'),
  provider_file_name TEXT NOT NULL,
  provider_file_uri TEXT NOT NULL,
  provider_expires_at TEXT,
  status TEXT NOT NULL CHECK (status = 'uploaded'),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  FOREIGN KEY (installation_id)
    REFERENCES guest_installations (installation_id)
    ON DELETE CASCADE
) WITHOUT ROWID;

CREATE INDEX documents_installation_id_idx
  ON documents (installation_id);
