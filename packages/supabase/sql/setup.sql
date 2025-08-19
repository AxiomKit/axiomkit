-- Enable the pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Function to enable pgvector extension (used by the SupabaseVectorStore)
CREATE OR REPLACE FUNCTION enable_pgvector_extension()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS vector;
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
