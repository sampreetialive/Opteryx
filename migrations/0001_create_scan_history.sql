CREATE TABLE scan_history (
  id BIGSERIAL PRIMARY KEY,
  input_type TEXT NOT NULL,
  content_preview TEXT NOT NULL,
  risk_score INTEGER NOT NULL,
  risk_level TEXT NOT NULL,
  category TEXT NOT NULL,
  result_json TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_scan_history_created_at ON scan_history(created_at DESC);