/*
# Create documents and analysis_results tables

1. New Tables
- `documents`
  - id (uuid, primary key)
  - user_id (uuid, references auth.users, defaults to auth.uid())
  - filename (text, not null)
  - extracted_text (text, not null)
  - source_type (text: 'text' | 'txt' | 'pdf' | 'docx')
  - created_at (timestamptz, defaults to now())
- `analysis_results`
  - id (uuid, primary key)
  - document_id (uuid, references documents, ON DELETE CASCADE)
  - user_id (uuid, references auth.users, defaults to auth.uid())
  - pos_tags (jsonb, extracted POS tagging results)
  - entities (jsonb, extracted named entities)
  - relations (jsonb, extracted entity relations)
  - events (jsonb, extracted events)
  - timeline (jsonb, temporal ordering of events)
  - summary (jsonb, aggregate stats)
  - created_at (timestamptz, defaults to now())

2. Security
- Enable RLS on both tables.
- Owner-scoped CRUD: each authenticated user can only access rows they own.
- user_id columns default to auth.uid() so inserts that omit user_id succeed.

3. Indexes
- Index on documents.user_id for per-user listing.
- Index on analysis_results.document_id for lookups by document.
- Index on analysis_results.user_id for per-user listing.
*/

CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  filename text NOT NULL,
  extracted_text text NOT NULL,
  source_type text NOT NULL DEFAULT 'text',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_documents" ON documents;
CREATE POLICY "select_own_documents" ON documents FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_documents" ON documents;
CREATE POLICY "insert_own_documents" ON documents FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_documents" ON documents;
CREATE POLICY "update_own_documents" ON documents FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_documents" ON documents;
CREATE POLICY "delete_own_documents" ON documents FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at DESC);

CREATE TABLE IF NOT EXISTS analysis_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  pos_tags jsonb NOT NULL DEFAULT '[]'::jsonb,
  entities jsonb NOT NULL DEFAULT '[]'::jsonb,
  relations jsonb NOT NULL DEFAULT '[]'::jsonb,
  events jsonb NOT NULL DEFAULT '[]'::jsonb,
  timeline jsonb NOT NULL DEFAULT '[]'::jsonb,
  summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE analysis_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_analysis" ON analysis_results;
CREATE POLICY "select_own_analysis" ON analysis_results FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_analysis" ON analysis_results;
CREATE POLICY "insert_own_analysis" ON analysis_results FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_analysis" ON analysis_results;
CREATE POLICY "update_own_analysis" ON analysis_results FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_analysis" ON analysis_results;
CREATE POLICY "delete_own_analysis" ON analysis_results FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_analysis_document_id ON analysis_results(document_id);
CREATE INDEX IF NOT EXISTS idx_analysis_user_id ON analysis_results(user_id);
CREATE INDEX IF NOT EXISTS idx_analysis_created_at ON analysis_results(created_at DESC);
