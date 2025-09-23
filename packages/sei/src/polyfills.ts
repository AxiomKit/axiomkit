import fetch from "node-fetch";

// Set up global fetch polyfill for Node.js v16 compatibility
if (typeof globalThis.fetch === 'undefined') {
  globalThis.fetch = fetch as any;
}

// Export fetch for use in other modules
export { fetch };
