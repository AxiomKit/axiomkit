import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type {
  VectorProvider,
  VectorDocument,
  VectorQuery,
  VectorResult,
  HealthStatus,
} from "@axiomkit/core";

/**
 * Configuration for the Supabase Vector provider
 */
export interface SupabaseVectorProviderConfig {
  /** Supabase URL */
  url: string;
  /** Supabase API key */
  key: string;
  /** Table name for storing vector embeddings */
  tableName?: string;
  /** Embedding dimension */
  embeddingDimension?: number;
  /** Whether to automatically setup database */
  autoSetup?: boolean;
  /** Setup options */
  setupOptions?: {
    createTables?: boolean;
    createFunctions?: boolean;
    schema?: string;
  };
}

/**
 * Supabase implementation of VectorProvider
 */
export class SupabaseVectorProvider implements VectorProvider {
  private client: SupabaseClient;
  private tableName: string;
  private embeddingDimension: number;
  private autoSetup: boolean;
  private setupOptions: Required<NonNullable<SupabaseVectorProviderConfig['setupOptions']>>;
  private initialized = false;

  constructor(config: SupabaseVectorProviderConfig) {
    const { 
      url, 
      key, 
      tableName = "axiomkit_vector_store",
      embeddingDimension = 1536,
      autoSetup = true,
      setupOptions = {}
    } = config;
    
    this.client = createClient(url, key);
    this.tableName = tableName;
    this.embeddingDimension = embeddingDimension;
    this.autoSetup = autoSetup;
    this.setupOptions = {
      createTables: setupOptions.createTables ?? true,
      createFunctions: setupOptions.createFunctions ?? true,
      schema: setupOptions.schema ?? "public",
    };
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    if (this.autoSetup) {
      await this.setupDatabase();
    } else {
      await this.initializeTable();
    }

    this.initialized = true;
  }

  async close(): Promise<void> {
    // Supabase client doesn't need explicit cleanup
  }

  async health(): Promise<HealthStatus> {
    try {
      // Test connectivity with a simple query
      const { error } = await this.client
        .from(this.tableName)
        .select("id")
        .limit(1);

      if (error) {
        return {
          status: "unhealthy",
          message: `Database error: ${error.message}`,
          details: { error: error.code },
        };
      }

      return {
        status: "healthy",
        message: "Supabase Vector provider is operational",
      };
    } catch (error) {
      return {
        status: "unhealthy",
        message: `Connection failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      };
    }
  }

  async index(documents: VectorDocument[]): Promise<void> {
    if (documents.length === 0) return;

    const records = documents.map((doc) => ({
      id: doc.id,
      content: doc.content,
      embedding: doc.embedding,
      metadata: doc.metadata ? JSON.stringify(doc.metadata) : null,
      namespace: doc.namespace || null,
      created_at: new Date().toISOString(),
    }));

    const { error } = await this.client
      .from(this.tableName)
      .upsert(records)
      .select();

    if (error) {
      throw new Error(`Failed to index documents: ${error.message}`);
    }
  }

  async search(query: VectorQuery): Promise<VectorResult[]> {
    const {
      query: queryText,
      embedding,
      namespace,
      filter,
      limit = 10,
      includeMetadata = true,
      includeContent = true,
      minScore = 0,
    } = query;

    if (!embedding && !queryText) {
      throw new Error("Either query text or embedding must be provided");
    }

    let rpcQuery: any = {
      query_embedding: embedding,
      match_threshold: minScore,
      match_count: limit,
    };

    if (namespace) {
      rpcQuery.query_namespace = namespace;
    }

    if (filter) {
      rpcQuery.query_filter = JSON.stringify(filter);
    }

    // Use the RPC function for vector similarity search
    const { data, error } = await this.client.rpc("match_documents", rpcQuery);

    if (error) {
      throw new Error(`Vector search failed: ${error.message}`);
    }

    if (!data) {
      return [];
    }

    return data.map((row: any) => ({
      id: row.id,
      score: row.similarity,
      content: includeContent ? row.content : undefined,
      metadata:
        includeMetadata && row.metadata ? JSON.parse(row.metadata) : undefined,
    }));
  }

  async delete(ids: string[]): Promise<void> {
    if (ids.length === 0) return;

    const { error } = await this.client
      .from(this.tableName)
      .delete()
      .in("id", ids);

    if (error) {
      throw new Error(`Failed to delete documents: ${error.message}`);
    }
  }

  async update(id: string, updates: Partial<VectorDocument>): Promise<void> {
    const updateData: any = {};

    if (updates.content !== undefined) {
      updateData.content = updates.content;
    }
    if (updates.embedding !== undefined) {
      updateData.embedding = updates.embedding;
    }
    if (updates.metadata !== undefined) {
      updateData.metadata = JSON.stringify(updates.metadata);
    }
    if (updates.namespace !== undefined) {
      updateData.namespace = updates.namespace;
    }

    updateData.updated_at = new Date().toISOString();

    const { error } = await this.client
      .from(this.tableName)
      .update(updateData)
      .eq("id", id);

    if (error) {
      throw new Error(`Failed to update document ${id}: ${error.message}`);
    }
  }

  async count(namespace?: string): Promise<number> {
    let query = this.client
      .from(this.tableName)
      .select("*", { count: "exact", head: true });

    if (namespace) {
      query = query.eq("namespace", namespace);
    }

    const { error, count } = await query;

    if (error) {
      throw new Error(`Failed to count documents: ${error.message}`);
    }

    return count ?? 0;
  }

  private async initializeTable(): Promise<void> {
    // Check if the table exists
    const { error } = await this.client
      .from(this.tableName)
      .select("id")
      .limit(1);

    // If the table doesn't exist, create it
    if (error && error.code === "42P01") {
      const createTableQuery = `
        -- Enable the pgvector extension
        CREATE EXTENSION IF NOT EXISTS vector;

        -- Create the vector store table
        CREATE TABLE IF NOT EXISTS ${this.tableName} (
          id TEXT PRIMARY KEY,
          content TEXT,
          embedding vector(${this.embeddingDimension}),
          metadata JSONB,
          namespace TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Create indexes for better performance
        CREATE INDEX IF NOT EXISTS ${this.tableName}_embedding_idx 
        ON ${this.tableName} USING ivfflat (embedding vector_cosine_ops) 
        WITH (lists = 100);

        CREATE INDEX IF NOT EXISTS ${this.tableName}_namespace_idx 
        ON ${this.tableName} (namespace) WHERE namespace IS NOT NULL;

        CREATE INDEX IF NOT EXISTS ${this.tableName}_metadata_idx 
        ON ${this.tableName} USING GIN (metadata) WHERE metadata IS NOT NULL;

        -- Create the vector similarity search function
        CREATE OR REPLACE FUNCTION match_documents(
          query_embedding vector(${this.embeddingDimension}),
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
            FROM %I
            WHERE 1 - (embedding <=> %L) > %L',
            query_embedding, '${this.tableName}', query_embedding, match_threshold
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
      `;

      try {
        await this.client.rpc("execute_sql", {
          query: createTableQuery,
        });
        console.log(`Created vector table: ${this.tableName}`);
      } catch (e) {
        console.error(`Failed to create vector table ${this.tableName}:`, e);
        throw e;
      }
    } else if (error) {
      console.error(`Error checking vector table ${this.tableName}:`, error);
    }
  }

  private async setupDatabase(): Promise<void> {
    const { schema } = this.setupOptions;

    // Enable pgvector extension
    await this.client.rpc("execute_sql", {
      query: `CREATE EXTENSION IF NOT EXISTS vector SCHEMA ${schema};`,
    });
    console.log(`Enabled pgvector extension in schema ${schema}`);

    // Create the vector store table
    await this.client.rpc("execute_sql", {
      query: `
        CREATE TABLE IF NOT EXISTS ${this.tableName} (
          id TEXT PRIMARY KEY,
          content TEXT,
          embedding vector(${this.embeddingDimension}),
          metadata JSONB,
          namespace TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        ) SCHEMA ${schema};
      `,
    });
    console.log(`Created vector table: ${this.tableName} in schema ${schema}`);

    // Create indexes for better performance
    await this.client.rpc("execute_sql", {
      query: `
        CREATE INDEX IF NOT EXISTS ${this.tableName}_embedding_idx 
        ON ${this.tableName} USING ivfflat (embedding vector_cosine_ops) 
        WITH (lists = 100) SCHEMA ${schema};
      `,
    });
    console.log(`Created embedding index for ${this.tableName} in schema ${schema}`);

    await this.client.rpc("execute_sql", {
      query: `
        CREATE INDEX IF NOT EXISTS ${this.tableName}_namespace_idx 
        ON ${this.tableName} (namespace) WHERE namespace IS NOT NULL SCHEMA ${schema};
      `,
    });
    console.log(`Created namespace index for ${this.tableName} in schema ${schema}`);

    await this.client.rpc("execute_sql", {
      query: `
        CREATE INDEX IF NOT EXISTS ${this.tableName}_metadata_idx 
        ON ${this.tableName} USING GIN (metadata) WHERE metadata IS NOT NULL SCHEMA ${schema};
      `,
    });
    console.log(`Created metadata index for ${this.tableName} in schema ${schema}`);

    // Create the vector similarity search function
    await this.client.rpc("execute_sql", {
      query: `
        CREATE OR REPLACE FUNCTION match_documents(
          query_embedding vector(${this.embeddingDimension}),
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
            FROM %I
            WHERE 1 - (embedding <=> %L) > %L',
            query_embedding, '${this.tableName}', query_embedding, match_threshold
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
        $$ SCHEMA ${schema};
      `,
    });
    console.log(`Created match_documents function in schema ${schema}`);
  }
}

/**
 * Factory function to create a Supabase Vector provider
 */
export function createSupabaseVectorProvider(
  config: SupabaseVectorProviderConfig
): SupabaseVectorProvider {
  return new SupabaseVectorProvider(config);
}
