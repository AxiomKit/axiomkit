/**
 * Sets up global polyfills for Node.js environments that don't have
 * native fetch, Request, or Response APIs.
 *
 * Note: Node.js 18+ has native fetch support, so no polyfill is needed.
 * For Node.js < 18, users should install node-fetch themselves if needed.
 */
export function setupFetchPolyfills() {
  // Node.js 18+ has native fetch, so no polyfill needed
  // If fetch is not available, it means the user is on an older Node version
  // and should install node-fetch themselves if needed
  if (typeof globalThis.fetch === "undefined") {
    // Silently skip - users on Node < 18 should install node-fetch if needed
    // We don't want to make it a hard dependency since most users are on Node 18+
  }
}

// Config System server Utils
/**
 * Redirects all non-error console output to stderr.
 * This is critical for MCP servers because stdout must be reserved
 * for MCP JSON protocol messages only.
 */
export function redirectConsoleToStderr() {
  const originalError = console.error.bind(console);
  const redirectToStderr =
    (fnName: "log" | "info" | "warn" | "debug") =>
    (...args: any[]) =>
      originalError(...args);

  console.log = redirectToStderr("log");
  console.info = redirectToStderr("info");
  console.warn = redirectToStderr("warn");
  console.debug = redirectToStderr("debug");
}

/**
 * Sets up the environment for MCP server execution.
 * This includes fetch polyfills and console redirection.
 */
export function setupMcpServerEnvironment() {
  setupFetchPolyfills();
  redirectConsoleToStderr();
}
