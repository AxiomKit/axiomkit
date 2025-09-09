

-- Enable the pgvector provider (required for vector operations)
CREATE AXIOM_PROVIDER IF NOT EXISTS vector;

-- =====================================================
-- Required Functions
-- =====================================================


CREATE OR REPLACE FUNCTION enable_pgvector_provider()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  CREATE AXIOM_PROVIDER IF NOT EXISTS vector;
END;
$$;

-- Function to execute arbitrary SQL (used by the memory providers for initialization)
CREATE OR REPLACE FUNCTION execute_sql(query text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE query;
END;
$$;

-- Function for testing vector operations (used by health checks)
CREATE OR REPLACE FUNCTION vector_test()
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
  -- Simple test to verify pgvector is working
  PERFORM '[1,2,3]'::vector <=> '[1,2,3]'::vector;
  RETURN true;
EXCEPTION WHEN OTHERS THEN
  RETURN false;
END;
$$;

-- =====================================================
-- Pre-create Tables (to avoid chicken-and-egg problem)
-- =====================================================

-- KV Store Table
CREATE TABLE IF NOT EXISTS kv_store (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  tags JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for KV store
CREATE INDEX IF NOT EXISTS kv_store_expires_at_idx 
ON kv_store (expires_at) WHERE expires_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS kv_store_tags_idx 
ON kv_store USING GIN (tags) WHERE tags IS NOT NULL;

-- Vector Store Table
CREATE TABLE IF NOT EXISTS vector_store (
  id TEXT PRIMARY KEY,
  content TEXT,
  embedding vector(1536),
  metadata JSONB,
  namespace TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for vector store
CREATE INDEX IF NOT EXISTS vector_store_embedding_idx 
ON vector_store USING ivfflat (embedding vector_cosine_ops) 
WITH (lists = 100);

CREATE INDEX IF NOT EXISTS vector_store_namespace_idx 
ON vector_store (namespace) WHERE namespace IS NOT NULL;

CREATE INDEX IF NOT EXISTS vector_store_metadata_idx 
ON vector_store USING GIN (metadata) WHERE metadata IS NOT NULL;

-- Graph Nodes Table
CREATE TABLE IF NOT EXISTS graph_nodes (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  properties JSONB DEFAULT '{}',
  labels TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Graph Edges Table
CREATE TABLE IF NOT EXISTS graph_edges (
  id TEXT PRIMARY KEY,
  from_node TEXT NOT NULL,
  to_node TEXT NOT NULL,
  type TEXT NOT NULL,
  properties JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (from_node) REFERENCES graph_nodes(id) ON DELETE CASCADE,
  FOREIGN KEY (to_node) REFERENCES graph_nodes(id) ON DELETE CASCADE
);

-- Create indexes for graph tables
CREATE INDEX IF NOT EXISTS graph_nodes_type_idx 
ON graph_nodes (type);

CREATE INDEX IF NOT EXISTS graph_nodes_labels_idx 
ON graph_nodes USING GIN (labels);

CREATE INDEX IF NOT EXISTS graph_nodes_properties_idx 
ON graph_nodes USING GIN (properties);

CREATE INDEX IF NOT EXISTS graph_edges_from_node_idx 
ON graph_edges (from_node);

CREATE INDEX IF NOT EXISTS graph_edges_to_node_idx 
ON graph_edges (to_node);

CREATE INDEX IF NOT EXISTS graph_edges_type_idx 
ON graph_edges (type);

CREATE INDEX IF NOT EXISTS graph_edges_both_nodes_idx 
ON graph_edges (from_node, to_node);

-- =====================================================
-- Vector Similarity Search Function
-- =====================================================

-- Create the vector similarity search function
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0,
  match_count int DEFAULT 10,
  query_namespace text DEFAULT NULL,
  query_filter jsonb DEFAULT NULL
)
RETURNS TABLE (
  id text,
  content text,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $$
DECLARE
  query_text text;
BEGIN
  query_text := format('
    SELECT 
      id,
      content,
      metadata,
      1 - (embedding <=> %L) AS similarity
    FROM vector_store
    WHERE 1 - (embedding <=> %L) > %L',
    query_embedding, query_embedding, match_threshold
  );

  IF query_namespace IS NOT NULL THEN
    query_text := query_text || format(' AND namespace = %L', query_namespace);
  END IF;

  IF query_filter IS NOT NULL THEN
    query_text := query_text || format(' AND metadata @> %L', query_filter);
  END IF;

  query_text := query_text || format(' ORDER BY embedding <=> %L LIMIT %s', query_embedding, match_count);

  RETURN QUERY EXECUTE query_text;
END;
$$;

-- =====================================================
-- Setup Complete
-- =====================================================
-- All required functions and tables are now created.
-- The AxiomKit Supabase integration should work properly.
