import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type {
  GraphProvider,
  GraphNode,
  GraphEdge,
  GraphFilter,
  GraphTraversal,
  GraphPath,
  HealthStatus,
} from "@axiomkit/core";

/**
 * Configuration for the Supabase Graph provider
 */
export interface SupabaseGraphProviderConfig {
  /** Supabase URL */
  url: string;
  /** Supabase API key */
  key: string;
  /** Table name for storing graph nodes */
  nodesTableName?: string;
  /** Table name for storing graph edges */
  edgesTableName?: string;
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
 * Supabase implementation of GraphProvider
 */
export class SupabaseGraphProvider implements GraphProvider {
  private client: SupabaseClient;
  private nodesTable: string;
  private edgesTable: string;
  private autoSetup: boolean;
  private setupOptions: Required<NonNullable<SupabaseGraphProviderConfig['setupOptions']>>;
  private initialized = false;

  constructor(config: SupabaseGraphProviderConfig) {
    const { 
      url, 
      key, 
      nodesTableName = "axiomkit_graph_nodes",
      edgesTableName = "axiomkit_graph_edges",
      autoSetup = true,
      setupOptions = {}
    } = config;
    
    this.client = createClient(url, key);
    this.nodesTable = nodesTableName;
    this.edgesTable = edgesTableName;
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
      await this.initializeTables();
    }

    this.initialized = true;
  }

  async close(): Promise<void> {
    // Supabase client doesn't need explicit cleanup
  }

  async health(): Promise<HealthStatus> {
    try {
      // Test connectivity with a simple query
      const [nodesError, edgesError] = await Promise.all([
        this.client.from(this.nodesTable).select("id").limit(1).then(r => r.error),
        this.client.from(this.edgesTable).select("id").limit(1).then(r => r.error),
      ]);

      if (nodesError || edgesError) {
        return {
          status: "unhealthy",
          message: `Database error: ${nodesError?.message || edgesError?.message}`,
          details: { nodesError: nodesError?.code, edgesError: edgesError?.code },
        };
      }

      return {
        status: "healthy",
        message: "Supabase Graph provider is operational",
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

  async addNode(node: GraphNode): Promise<string> {
    const record = {
      id: node.id,
      type: node.type,
      properties: JSON.stringify(node.properties),
      labels: node.labels || [],
      created_at: new Date().toISOString(),
    };

    const { error } = await this.client
      .from(this.nodesTable)
      .upsert(record)
      .select();

    if (error) {
      throw new Error(`Failed to add node ${node.id}: ${error.message}`);
    }

    return node.id;
  }

  async getNode(id: string): Promise<GraphNode | null> {
    const { data, error } = await this.client
      .from(this.nodesTable)
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      id: data.id,
      type: data.type,
      properties: JSON.parse(data.properties || "{}"),
      labels: data.labels || [],
    };
  }

  async updateNode(id: string, updates: Partial<GraphNode>): Promise<void> {
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (updates.type !== undefined) {
      updateData.type = updates.type;
    }
    if (updates.properties !== undefined) {
      updateData.properties = JSON.stringify(updates.properties);
    }
    if (updates.labels !== undefined) {
      updateData.labels = updates.labels;
    }

    const { error } = await this.client
      .from(this.nodesTable)
      .update(updateData)
      .eq("id", id);

    if (error) {
      throw new Error(`Failed to update node ${id}: ${error.message}`);
    }
  }

  async deleteNode(id: string): Promise<boolean> {
    // First delete all edges connected to this node
    await this.client
      .from(this.edgesTable)
      .delete()
      .or(`from_node.eq.${id},to_node.eq.${id}`);

    // Then delete the node
    const { error, count } = await this.client
      .from(this.nodesTable)
      .delete({ count: "exact" })
      .eq("id", id);

    if (error) {
      throw new Error(`Failed to delete node ${id}: ${error.message}`);
    }

    return (count ?? 0) > 0;
  }

  async addEdge(edge: GraphEdge): Promise<string> {
    const record = {
      id: edge.id,
      from_node: edge.from,
      to_node: edge.to,
      type: edge.type,
      properties: edge.properties ? JSON.stringify(edge.properties) : null,
      created_at: new Date().toISOString(),
    };

    const { error } = await this.client
      .from(this.edgesTable)
      .upsert(record)
      .select();

    if (error) {
      throw new Error(`Failed to add edge ${edge.id}: ${error.message}`);
    }

    return edge.id;
  }

  async getEdges(
    nodeId: string,
    direction: "in" | "out" | "both" = "both"
  ): Promise<GraphEdge[]> {
    let query = this.client.from(this.edgesTable).select("*");

    switch (direction) {
      case "in":
        query = query.eq("to_node", nodeId);
        break;
      case "out":
        query = query.eq("from_node", nodeId);
        break;
      case "both":
        query = query.or(`from_node.eq.${nodeId},to_node.eq.${nodeId}`);
        break;
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(
        `Failed to get edges for node ${nodeId}: ${error.message}`
      );
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      from: row.from_node,
      to: row.to_node,
      type: row.type,
      properties: row.properties ? JSON.parse(row.properties) : undefined,
    }));
  }

  async deleteEdge(id: string): Promise<boolean> {
    const { error, count } = await this.client
      .from(this.edgesTable)
      .delete({ count: "exact" })
      .eq("id", id);

    if (error) {
      throw new Error(`Failed to delete edge ${id}: ${error.message}`);
    }

    return (count ?? 0) > 0;
  }

  async findNodes(filter: GraphFilter): Promise<GraphNode[]> {
    let query = this.client.from(this.nodesTable).select("*");

    if (filter.type) {
      query = query.eq("type", filter.type);
    }

    if (filter.labels && filter.labels.length > 0) {
      query = query.overlaps("labels", filter.labels);
    }

    if (filter.properties) {
      const propertyFilters = Object.entries(filter.properties).map(
        ([key, value]) => `properties->>${key}.eq.${JSON.stringify(value)}`
      );
      if (propertyFilters.length > 0) {
        query = query.or(propertyFilters.join(","));
      }
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to find nodes: ${error.message}`);
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      type: row.type,
      properties: JSON.parse(row.properties || "{}"),
      labels: row.labels || [],
    }));
  }

  async traverse(traversal: GraphTraversal): Promise<GraphPath[]> {
    // For complex graph traversals, we would typically use recursive CTEs
    // This is a simplified implementation for basic traversals
    const paths: GraphPath[] = [];
    const visited = new Set<string>();
    const maxDepth = traversal.maxDepth || 3;

    const traverse = async (
      currentNodeId: string,
      currentPath: GraphNode[],
      currentEdges: GraphEdge[],
      depth: number
    ): Promise<void> => {
      if (depth >= maxDepth || visited.has(currentNodeId)) {
        return;
      }

      visited.add(currentNodeId);
      const currentNode = await this.getNode(currentNodeId);
      if (!currentNode) return;

      const newPath = [...currentPath, currentNode];

      // If we have a meaningful path, add it
      if (newPath.length > 1) {
        paths.push({
          nodes: newPath,
          edges: currentEdges,
          length: newPath.length - 1,
        });
      }

      // Get connected edges
      const edges = await this.getEdges(currentNodeId, traversal.direction);

      for (const edge of edges) {
        const nextNodeId = edge.from === currentNodeId ? edge.to : edge.from;

        // Apply filter if provided
        if (traversal.filter) {
          const nextNode = await this.getNode(nextNodeId);
          if (nextNode && !this.nodeMatchesFilter(nextNode, traversal.filter)) {
            continue;
          }
        }

        await traverse(nextNodeId, newPath, [...currentEdges, edge], depth + 1);
      }

      visited.delete(currentNodeId);
    };

    await traverse(traversal.start, [], [], 0);
    return paths;
  }

  async shortestPath(from: string, to: string): Promise<GraphPath | null> {
    // This would typically be implemented using Dijkstra's algorithm
    // For now, we'll use a simple BFS approach
    const queue: Array<{
      nodeId: string;
      path: GraphNode[];
      edges: GraphEdge[];
    }> = [{ nodeId: from, path: [], edges: [] }];
    const visited = new Set<string>();

    while (queue.length > 0) {
      const { nodeId, path, edges } = queue.shift()!;

      if (visited.has(nodeId)) continue;
      visited.add(nodeId);

      const currentNode = await this.getNode(nodeId);
      if (!currentNode) continue;

      const newPath = [...path, currentNode];

      if (nodeId === to) {
        return {
          nodes: newPath,
          edges,
          length: edges.length,
        };
      }

      // Add connected nodes to queue
      const connectedEdges = await this.getEdges(nodeId, "both");
      for (const edge of connectedEdges) {
        const nextNodeId = edge.from === nodeId ? edge.to : edge.from;
        if (!visited.has(nextNodeId)) {
          queue.push({
            nodeId: nextNodeId,
            path: newPath,
            edges: [...edges, edge],
          });
        }
      }
    }

    return null;
  }

  private nodeMatchesFilter(node: GraphNode, filter: GraphFilter): boolean {
    if (filter.type && node.type !== filter.type) {
      return false;
    }

    if (filter.labels && filter.labels.length > 0) {
      const hasMatchingLabel = filter.labels.some((label) =>
        node.labels?.includes(label)
      );
      if (!hasMatchingLabel) {
        return false;
      }
    }

    if (filter.properties) {
      for (const [key, value] of Object.entries(filter.properties)) {
        if (node.properties[key] !== value) {
          return false;
        }
      }
    }

    return true;
  }

  private async initializeTables(): Promise<void> {
    // Check if tables exist
    const [nodesError, edgesError] = await Promise.all([
      this.client
        .from(this.nodesTable)
        .select("id")
        .limit(1)
        .then((r) => r.error),
      this.client
        .from(this.edgesTable)
        .select("id")
        .limit(1)
        .then((r) => r.error),
    ]);

    // Create tables if they don't exist
    if (
      (nodesError && nodesError.code === "42P01") ||
      (edgesError && edgesError.code === "42P01")
    ) {
      const createTablesQuery = `
        -- Create nodes table
        CREATE TABLE IF NOT EXISTS ${this.nodesTable} (
          id TEXT PRIMARY KEY,
          type TEXT NOT NULL,
          properties JSONB DEFAULT '{}',
          labels TEXT[] DEFAULT '{}',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Create edges table
        CREATE TABLE IF NOT EXISTS ${this.edgesTable} (
          id TEXT PRIMARY KEY,
          from_node TEXT NOT NULL,
          to_node TEXT NOT NULL,
          type TEXT NOT NULL,
          properties JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          FOREIGN KEY (from_node) REFERENCES ${this.nodesTable}(id) ON DELETE CASCADE,
          FOREIGN KEY (to_node) REFERENCES ${this.nodesTable}(id) ON DELETE CASCADE
        );

        -- Create indexes for better performance
        CREATE INDEX IF NOT EXISTS ${this.nodesTable}_type_idx 
        ON ${this.nodesTable} (type);

        CREATE INDEX IF NOT EXISTS ${this.nodesTable}_labels_idx 
        ON ${this.nodesTable} USING GIN (labels);

        CREATE INDEX IF NOT EXISTS ${this.nodesTable}_properties_idx 
        ON ${this.nodesTable} USING GIN (properties);

        CREATE INDEX IF NOT EXISTS ${this.edgesTable}_from_node_idx 
        ON ${this.edgesTable} (from_node);

        CREATE INDEX IF NOT EXISTS ${this.edgesTable}_to_node_idx 
        ON ${this.edgesTable} (to_node);

        CREATE INDEX IF NOT EXISTS ${this.edgesTable}_type_idx 
        ON ${this.edgesTable} (type);

        CREATE INDEX IF NOT EXISTS ${this.edgesTable}_both_nodes_idx 
        ON ${this.edgesTable} (from_node, to_node);
      `;

      try {
        await this.client.rpc("execute_sql", {
          query: createTablesQuery,
        });
        console.log(
          `Created graph tables: ${this.nodesTable}, ${this.edgesTable}`
        );
      } catch (e) {
        console.error(`Failed to create graph tables:`, e);
        throw e;
      }
    }
  }

  private async setupDatabase(): Promise<void> {
    const { schema } = this.setupOptions;
    const { client } = this;

    if (this.setupOptions.createTables) {
      await this.initializeTables();
    }

    if (this.setupOptions.createFunctions) {
      const createFunctionsQuery = `
        -- Create graph_node_upsert function
        CREATE OR REPLACE FUNCTION ${schema}.graph_node_upsert(
          p_id TEXT,
          p_type TEXT,
          p_properties JSONB,
          p_labels TEXT[]
        ) RETURNS TEXT AS $$
        BEGIN
          INSERT INTO ${schema}.${this.nodesTable} (id, type, properties, labels)
          VALUES (p_id, p_type, p_properties, p_labels)
          ON CONFLICT (id) DO UPDATE SET
            type = EXCLUDED.type,
            properties = EXCLUDED.properties,
            labels = EXCLUDED.labels,
            updated_at = NOW();
          RETURN p_id;
        END;
        $$ LANGUAGE plpgsql;

        -- Create graph_edge_upsert function
        CREATE OR REPLACE FUNCTION ${schema}.graph_edge_upsert(
          p_id TEXT,
          p_from_node TEXT,
          p_to_node TEXT,
          p_type TEXT,
          p_properties JSONB
        ) RETURNS TEXT AS $$
        BEGIN
          INSERT INTO ${schema}.${this.edgesTable} (id, from_node, to_node, type, properties)
          VALUES (p_id, p_from_node, p_to_node, p_type, p_properties)
          ON CONFLICT (id) DO UPDATE SET
            from_node = EXCLUDED.from_node,
            to_node = EXCLUDED.to_node,
            type = EXCLUDED.type,
            properties = EXCLUDED.properties,
            updated_at = NOW();
          RETURN p_id;
        END;
        $$ LANGUAGE plpgsql;

        -- Create graph_node_delete function
        CREATE OR REPLACE FUNCTION ${schema}.graph_node_delete(p_id TEXT) RETURNS BOOLEAN AS $$
        BEGIN
          DELETE FROM ${schema}.${this.nodesTable} WHERE id = p_id;
          RETURN FOUND;
        END;
        $$ LANGUAGE plpgsql;

        -- Create graph_edge_delete function
        CREATE OR REPLACE FUNCTION ${schema}.graph_edge_delete(p_id TEXT) RETURNS BOOLEAN AS $$
        BEGIN
          DELETE FROM ${schema}.${this.edgesTable} WHERE id = p_id;
          RETURN FOUND;
        END;
        $$ LANGUAGE plpgsql;

        -- Create graph_get_node function
        CREATE OR REPLACE FUNCTION ${schema}.graph_get_node(p_id TEXT) RETURNS JSONB AS $$
        BEGIN
          RETURN (
            SELECT jsonb_build_object(
              'id', id,
              'type', type,
              'properties', properties,
              'labels', labels
            )
            FROM ${schema}.${this.nodesTable}
            WHERE id = p_id
          );
        END;
        $$ LANGUAGE plpgsql;

        -- Create graph_get_edges function
        CREATE OR REPLACE FUNCTION ${schema}.graph_get_edges(
          p_from_node TEXT,
          p_to_node TEXT,
          p_direction TEXT
        ) RETURNS JSONB AS $$
        BEGIN
          IF p_direction = 'in' THEN
            RETURN (
              SELECT jsonb_agg(jsonb_build_object(
                'id', id,
                'from_node', from_node,
                'to_node', to_node,
                'type', type,
                'properties', properties
              ))
              FROM ${schema}.${this.edgesTable}
              WHERE to_node = p_to_node
            );
          ELSIF p_direction = 'out' THEN
            RETURN (
              SELECT jsonb_agg(jsonb_build_object(
                'id', id,
                'from_node', from_node,
                'to_node', to_node,
                'type', type,
                'properties', properties
              ))
              FROM ${schema}.${this.edgesTable}
              WHERE from_node = p_from_node
            );
          ELSE -- both
            RETURN (
              SELECT jsonb_agg(jsonb_build_object(
                'id', id,
                'from_node', from_node,
                'to_node', to_node,
                'type', type,
                'properties', properties
              ))
              FROM ${schema}.${this.edgesTable}
              WHERE from_node = p_from_node OR to_node = p_to_node
            );
          END IF;
        END;
        $$ LANGUAGE plpgsql;

        -- Create graph_find_nodes function
        CREATE OR REPLACE FUNCTION ${schema}.graph_find_nodes(
          p_type TEXT,
          p_labels TEXT[],
          p_properties JSONB
        ) RETURNS JSONB AS $$
        BEGIN
          RETURN (
            SELECT jsonb_agg(jsonb_build_object(
              'id', id,
              'type', type,
              'properties', properties,
              'labels', labels
            ))
            FROM ${schema}.${this.nodesTable}
            WHERE (type = p_type OR p_type IS NULL)
              AND (labels && p_labels OR p_labels IS NULL)
              AND (properties @> p_properties OR p_properties IS NULL)
          );
        END;
        $$ LANGUAGE plpgsql;

        -- Create graph_traverse function
        CREATE OR REPLACE FUNCTION ${schema}.graph_traverse(
          p_start_node TEXT,
          p_direction TEXT,
          p_max_depth INTEGER,
          p_filter JSONB
        ) RETURNS JSONB AS $$
        DECLARE
          v_current_node TEXT;
          v_path JSONB[];
          v_edges JSONB[];
          v_depth INTEGER := 0;
          v_visited JSONB := '[]'::jsonb;
        BEGIN
          v_current_node := p_start_node;
          v_path := ARRAY[${schema}.graph_get_node(v_current_node)];
          v_edges := ARRAY[]::jsonb[];

          WHILE v_depth < p_max_depth AND NOT EXISTS (
            SELECT 1 FROM jsonb_array_elements(v_visited) WHERE value = v_current_node
          ) LOOP
            v_visited := v_visited || to_jsonb(v_current_node);
            v_edges := v_edges || ${schema}.graph_get_edges(v_current_node, p_direction);

            -- Apply filter
            IF p_filter IS NOT NULL THEN
              v_edges := (
                SELECT jsonb_agg(jsonb_build_object(
                  'id', id,
                  'from_node', from_node,
                  'to_node', to_node,
                  'type', type,
                  'properties', properties
                ))
                FROM jsonb_array_elements(v_edges)
                WHERE (jsonb_build_object('id', id) || jsonb_build_object('from_node', from_node) || jsonb_build_object('to_node', to_node)) @> p_filter
              );
            END IF;

            -- Find next node
            v_current_node := (
              SELECT to_node
              FROM jsonb_array_elements(v_edges)
              WHERE from_node = v_current_node
              ORDER BY (jsonb_build_object('id', id) || jsonb_build_object('from_node', from_node) || jsonb_build_object('to_node', to_node)) @> p_filter
              LIMIT 1
            );

            IF v_current_node IS NULL THEN
              EXIT;
            END IF;

            v_path := v_path || ${schema}.graph_get_node(v_current_node);
            v_edges := ARRAY[]::jsonb[]; -- Clear edges for the next depth
          END LOOP;

          RETURN jsonb_build_object(
            'nodes', v_path,
            'edges', v_edges
          );
        END;
        $$ LANGUAGE plpgsql;

        -- Create graph_shortest_path function
        CREATE OR REPLACE FUNCTION ${schema}.graph_shortest_path(
          p_from_node TEXT,
          p_to_node TEXT
        ) RETURNS JSONB AS $$
        DECLARE
          v_current_node TEXT;
          v_path JSONB[] := ARRAY[${schema}.graph_get_node(p_from_node)];
          v_visited JSONB := '[]'::jsonb;
          v_edges JSONB[] := ARRAY[]::jsonb[];
          v_depth INTEGER := 0;
        BEGIN
          v_current_node := p_from_node;
          v_visited := v_visited || to_jsonb(v_current_node);

          WHILE v_depth < 1000000000 -- Large number to prevent infinite loops
            AND NOT EXISTS (SELECT 1 FROM jsonb_array_elements(v_visited) WHERE value = v_current_node)
          LOOP
            v_edges := v_edges || ${schema}.graph_get_edges(v_current_node, 'both');

            -- Apply filter
            IF (SELECT jsonb_array_length(v_edges) > 0) THEN
              v_edges := (
                SELECT jsonb_agg(jsonb_build_object(
                  'id', id,
                  'from_node', from_node,
                  'to_node', to_node,
                  'type', type,
                  'properties', properties
                ))
                FROM jsonb_array_elements(v_edges)
                WHERE (jsonb_build_object('id', id) || jsonb_build_object('from_node', from_node) || jsonb_build_object('to_node', to_node)) @> (
                  SELECT jsonb_build_object('from_node', v_current_node)
                )
              );
            END IF;

            -- Find next node
            v_current_node := (
              SELECT to_node
              FROM jsonb_array_elements(v_edges)
              WHERE from_node = v_current_node
              ORDER BY (jsonb_build_object('id', id) || jsonb_build_object('from_node', from_node) || jsonb_build_object('to_node', to_node)) @> (
                SELECT jsonb_build_object('from_node', v_current_node)
              )
              LIMIT 1
            );

            IF v_current_node IS NULL THEN
              EXIT;
            END IF;

            v_path := v_path || ${schema}.graph_get_node(v_current_node);
            v_edges := ARRAY[]::jsonb[]; -- Clear edges for the next depth
            v_depth := v_depth + 1;
          END LOOP;

          IF v_current_node = p_to_node THEN
            RETURN jsonb_build_object(
              'nodes', v_path,
              'edges', v_edges
            );
          ELSE
            RETURN NULL;
          END IF;
        END;
        $$ LANGUAGE plpgsql;
      `;

      try {
        await client.rpc("execute_sql", {
          query: createFunctionsQuery,
        });
        console.log(
          `Created graph functions: ${schema}.graph_node_upsert, ${schema}.graph_edge_upsert, ${schema}.graph_node_delete, ${schema}.graph_edge_delete, ${schema}.graph_get_node, ${schema}.graph_get_edges, ${schema}.graph_find_nodes, ${schema}.graph_traverse, ${schema}.graph_shortest_path`
        );
      } catch (e) {
        console.error(`Failed to create graph functions:`, e);
        throw e;
      }
    }
  }
}

/**
 * Factory function to create a Supabase Graph provider
 */
export function createSupabaseGraphProvider(
  config: SupabaseGraphProviderConfig
): SupabaseGraphProvider {
  return new SupabaseGraphProvider(config);
}
