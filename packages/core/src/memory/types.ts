/**
 * Interface for storing and retrieving memory data
 */
export interface MemoryStore {
  /**
   * Retrieves data from memory
   * @template T - Type of data to retrieve
   * @param key - Key to lookup
   * @returns Promise resolving to data or null if not found
   */
  get<T>(key: string): Promise<T | null>;

  /**
   * Stores data in memory
   * @template T - Type of data to store
   * @param key - Key to store under
   * @param value - Data to store
   */
  set<T>(key: string, value: T): Promise<void>;

  /**
   * Removes data from memory
   * @param key - Key to remove
   */
  delete(key: string): Promise<void>;

  /**
   * Removes all data from memory
   */
  clear(): Promise<void>;

  keys(base?: string): Promise<string[]>;
}

/**
 * Interface for storing and retrieving vector data
 */
export interface VectorStore {
  /** Optional connection string for the vector store */
  connection?: string;

  /**
   * Adds or updates data in the vector store
   * @param contextId - Unique identifier for the context
   * @param data - Data to add or update
   */
  upsert(contextId: string, data: any): Promise<void>;

  /**
   * Searches the vector store for similar data
   * @param contextId - Context to search within
   * @param query - Query text to search for
   * @returns Array of matching documents
   */
  query(contextId: string, query: string): Promise<any[]>;

  /**
   * Creates a new index in the vector store
   * @param indexName - Name of the index to create
   */
  createIndex(indexName: string): Promise<void>;

  /**
   * Deletes an existing index from the vector store
   * @param indexName - Name of the index to delete
   */
  deleteIndex(indexName: string): Promise<void>;
}
