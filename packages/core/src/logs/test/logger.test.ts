import { describe, it, expect, beforeEach } from "vitest";
import { Logger, type LogEntry, LogLevel } from "../logger";

// Mock transport to capture logs
class MockTransport {
  logs: { formatted: string; entry: LogEntry }[] = [];
  log(formattedMessage: string, entry: LogEntry) {
    this.logs.push({ formatted: formattedMessage, entry });
  }
  clear() {
    this.logs = [];
  }
}

describe("Logger", () => {
  let mockTransport: MockTransport;
  let logger: Logger;

  beforeEach(() => {
    mockTransport = new MockTransport();
    logger = new Logger({
      level: LogLevel.DEBUG,
      transports: [mockTransport],
      style: "default",
      enableColors: false,
    });
    mockTransport.clear();
  });

  it("logs an info message", () => {
    logger.info("test-context", "This is an info message");
    expect(mockTransport.logs.length).toBe(1);
    expect(mockTransport.logs[0].entry.level).toBe(LogLevel.INFO);
    expect(mockTransport.logs[0].entry.message).toBe("This is an info message");
  });

  it("logs an error message", () => {
    logger.error("test-context", "This is an error", { foo: "bar" });
    expect(mockTransport.logs.length).toBe(1);
    expect(mockTransport.logs[0].entry.level).toBe(LogLevel.ERROR);
    expect(mockTransport.logs[0].entry.data).toEqual({ foo: "bar" });
  });

  it("logs a debug message", () => {
    logger.debug("test-context", "Debugging");
    expect(mockTransport.logs.length).toBe(1);
    expect(mockTransport.logs[0].entry.level).toBe(LogLevel.DEBUG);
  });

  it("logs a structured message", () => {
    logger.structured(LogLevel.INFO, "test-structured", "Structured log", {
      custom: "data",
      correlationIds: { requestId: "abc123" },
    });
    expect(mockTransport.logs.length).toBe(1);
    expect(mockTransport.logs[0].entry.context).toBe("test-structured");
    expect(mockTransport.logs[0].entry.data.custom).toBe("data");
    expect(mockTransport.logs[0].entry.data.correlationIds.requestId).toBe(
      "abc123"
    );
  });

  it("does not log below the set level", () => {
    logger = new Logger({
      level: LogLevel.ERROR,
      transports: [mockTransport],
      style: "default",
      enableColors: false,
    });
    logger.info("test-context", "Should not log");
    expect(mockTransport.logs.length).toBe(0);
    logger.error("test-context", "Should log");
    expect(mockTransport.logs.length).toBe(1);
  });
});
