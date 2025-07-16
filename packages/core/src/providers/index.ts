/**
 * Generic standard response structure for GraphQL queries
 */
interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{
    message: string;
    locations?: Array<{
      line: number;
      column: number;
    }>;
    path?: string[];
  }>;
}

/**
 * A custom error class for API-related issues, providing a message
 * and optional additional details for debugging.
 */
class ApiError extends Error {
  constructor(public message: string, public details?: unknown) {
    super(message);
  }
}

/**
 * Performs a generic REST API request.
 * Throws an `ApiError` on HTTP errors (non-2xx status codes) or other fetch issues.
 *
 * @param url The full endpoint URL (including protocol, domain, and path).
 * @param options Standard `RequestInit` options for the fetch request (e.g., method, headers, body).
 * @returns A Promise that resolves with the parsed JSON response of type `ResponseType`.
 * @throws {ApiError} If the network request fails, the response status is not OK, or JSON parsing fails.
 */
export async function fetchRest<ResponseType = unknown>(
  url: string,
  options: RequestInit = {}
): Promise<ResponseType> {
  try {
    const res = await fetch(url, options);
    if (!res.ok) {
      throw new ApiError(
        `REST API HTTP Error: ${res.status} ${res.statusText} for URL: ${url}`,
        {
          status: res.status,
          statusText: res.statusText,
        }
      );
    }
    return (await res.json()) as ResponseType;
  } catch (error) {
    throw error instanceof ApiError
      ? error
      : new ApiError(
          `Unknown error during REST API fetch for URL: ${url}`,
          error
        );
  }
}

/**
 * Performs a GraphQL query against a specified endpoint.
 * Throws an `ApiError` if the HTTP response is not OK, if the GraphQL response
 * contains errors, or if no data is returned when expected.
 *
 * @param endpoint The GraphQL endpoint URL.
 * @param query The GraphQL query string (e.g., `query { user { id name } }`).
 * @param variables An optional object containing variables for the GraphQL query.
 * @returns A Promise that resolves with the `DataType` from the GraphQL response.
 * @throws {ApiError} If the network request fails, the HTTP response is not OK,
 * the GraphQL response contains errors, or no data is returned.
 */
export async function fetchGraphQL<DataType = unknown>(
  endpoint: string,
  query: string,
  variables?: Record<string, unknown>
): Promise<DataType | Error> {
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    if (!res.ok) {
      throw new ApiError(
        `GraphQL API HTTP Error: ${res.status} ${res.statusText} for endpoint: ${endpoint}`,
        {
          status: res.status,
          statusText: res.statusText,
        }
      );
    }

    const result = (await res.json()) as GraphQLResponse<DataType>;

    if (result.errors && result.errors.length > 0) {
      //   return new ApiError(result.errors[0].message, result.errors);
      throw new ApiError(`GraphQL Error: ${result.errors[0].message}`, {
        graphqlErrors: result.errors,
        query: query,
      });
    }

    if (!result.data) {
      throw new ApiError("GraphQL query returned no data", {
        query: query,
        variables: variables,
      });
    }

    return result.data;
  } catch (error) {
    return error instanceof ApiError
      ? error
      : new ApiError(
          `Unknown error during GraphQL API fetch for endpoint: ${endpoint}`,
          error
        );
  }
}
