import { MemorySystem, type MemoryConfig } from "@axiomkit/core";

import {
  createSupabaseKVProvider,
  createSupabaseVectorProvider,
  createSupabaseGraphProvider,
} from "./providers";

/**
 * Configuration for creating a Supabase-backed memory system
 */
export interface SupabaseMemoryConfig {
  /** Supabase URL */
  url: string;
  /** Supabase API key */
  key: string;
  /** Namespace for table isolation (default: 'axiomkit') */
  namespace?: string;
  /** Whether to automatically setup database (default: true) */
  autoSetup?: boolean;
  /** Setup options */
  setupOptions?: {
    /** Create tables automatically (default: true) */
    createTables?: boolean;
    /** Create functions automatically (default: true) */
    createFunctions?: boolean;
    /** Database schema to use (default: 'public') */
    schema?: string;
  };
  /** Table name for storing key-value data */
  kvTableName?: string;
  /** Table name for storing vector embeddings */
  vectorTableName?: string;
  /** Table name for storing graph nodes */
  nodesTableName?: string;
  /** Table name for storing graph edges */
  edgesTableName?: string;
  /** Embedding dimension for vector operations */
  embeddingDimension?: number;
}

/**
 * Creates a complete memory system backed by Supabase
 *
 * This includes KV storage, vector embeddings, and graph storage all backed by Supabase.
 * The system will automatically setup the database if needed.
 *
 * @param config - Configuration for the Supabase memory system
 * @returns A MemorySystem implementation using Supabase providers
 */
export function createSupabaseMemory(
  config: SupabaseMemoryConfig
): MemorySystem {
  const {
    url,
    key,
    namespace = "axiomkit",
    autoSetup = true,
    setupOptions = {
      createTables: true,
      createFunctions: true,
      schema: "public",
    },
    kvTableName,
    vectorTableName,
    nodesTableName,
    edgesTableName,
    embeddingDimension = 1536,
  } = config;

  // Generate namespaced table names
  const kvTable = kvTableName || `${namespace}_kv_store`;
  const vectorTable = vectorTableName || `${namespace}_vector_store`;
  const graphNodesTable = nodesTableName || `${namespace}_graph_nodes`;
  const graphEdgesTable = edgesTableName || `${namespace}_graph_edges`;

  // Create the providers with enhanced configuration
  const kvProvider = createSupabaseKVProvider({
    url,
    key,
    tableName: kvTable,
    autoSetup,
    setupOptions,
  });

  const vectorProvider = createSupabaseVectorProvider({
    url,
    key,
    tableName: vectorTable,
    embeddingDimension,
    autoSetup,
    setupOptions,
  });

  const graphProvider = createSupabaseGraphProvider({
    url,
    key,
    nodesTableName: graphNodesTable,
    edgesTableName: graphEdgesTable,
    autoSetup,
    setupOptions,
  });

  // Create the memory configuration
  const memoryConfig: MemoryConfig = {
    providers: {
      kv: kvProvider,
      vector: vectorProvider,
      graph: graphProvider,
    },
  };

  // Return the complete memory system
  return new MemorySystem(memoryConfig);
}
