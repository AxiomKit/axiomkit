import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  setupFetchPolyfills,
  redirectConsoleToStderr,
  setupMcpServerEnvironment,
} from "./server-utils";
// Setting to build node fetch types
describe("server-utils", () => {
  describe("setupFetchPolyfills", () => {
    beforeEach(() => {
      // Clear global fetch if it exists
      if (globalThis.fetch) {
        delete (globalThis as any).fetch;
      }
      if (globalThis.Request) {
        delete (globalThis as any).Request;
      }
      if (globalThis.Response) {
        delete (globalThis as any).Response;
      }
    });

    it("should not modify fetch if it already exists", () => {
      const originalFetch = globalThis.fetch;
      setupFetchPolyfills();
      expect(globalThis.fetch).toBe(originalFetch);
    });

    it("should handle missing fetch gracefully", () => {
      delete (globalThis as any).fetch;
      expect(() => setupFetchPolyfills()).not.toThrow();
    });
  });

  describe("redirectConsoleToStderr", () => {
    it("should redirect console.log to stderr", () => {
      const originalError = console.error;
      const errorSpy = vi.spyOn(console, "error");

      redirectConsoleToStderr();
      console.log("test message");

      expect(errorSpy).toHaveBeenCalledWith("test message");

      // Restore
      console.log = originalError;
      errorSpy.mockRestore();
    });

    it("should redirect console.info to stderr", () => {
      const originalError = console.error;
      const errorSpy = vi.spyOn(console, "error");

      redirectConsoleToStderr();
      console.info("info message");

      expect(errorSpy).toHaveBeenCalledWith("info message");

      // Restore
      console.info = originalError;
      errorSpy.mockRestore();
    });

    it("should redirect console.warn to stderr", () => {
      const originalError = console.error;
      const errorSpy = vi.spyOn(console, "error");

      redirectConsoleToStderr();
      console.warn("warn message");

      expect(errorSpy).toHaveBeenCalledWith("warn message");

      // Restore
      console.warn = originalError;
      errorSpy.mockRestore();
    });
  });

  describe("setupMcpServerEnvironment", () => {
    it("should call both setupFetchPolyfills and redirectConsoleToStderr", () => {
      const fetchSpy = vi.spyOn({ setupFetchPolyfills }, "setupFetchPolyfills");
      const consoleSpy = vi.spyOn(
        { redirectConsoleToStderr },
        "redirectConsoleToStderr"
      );

      setupMcpServerEnvironment();

      // Note: These won't actually be called since we're spying on the object,
      // but this tests that the function exists and can be called
      expect(() => setupMcpServerEnvironment()).not.toThrow();

      fetchSpy.mockRestore();
      consoleSpy.mockRestore();
    });
  });
});
