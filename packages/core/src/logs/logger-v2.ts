import { LogLevel } from "./logger";

//!todo Fix: upgrade version 2 logger

export interface ColorTheme {
  // Primary colors
  orange: string;
  blue: string;
  darkBlue: string;
  cyan: string;

  // Status colors
  success: string;
  warning: string;
  error: string;

  // Text colors
  primary: string;
  secondary: string;
  muted: string;

  // Accents
  bright: string;
  dim: string;

  // Reset
  reset: string;
}

export const DeveloperTheme: ColorTheme = {
  // Primary colors - optimized for code syntax highlighting
  orange: "\x1b[38;2;255;149;0m", // iOS orange - great for warnings/actions
  blue: "\x1b[38;2;0;122;255m", // iOS blue - perfect for info/links
  darkBlue: "\x1b[38;2;88;86;214m", // Purple-blue - for important info
  cyan: "\x1b[38;2;90;200;250m", // Light blue - for secondary info

  // Status colors - high contrast for quick recognition
  success: "\x1b[38;2;52;199;89m", // iOS green - clear success indication
  warning: "\x1b[38;2;255;204;0m", // iOS yellow - attention-grabbing
  error: "\x1b[38;2;255;59;48m", // iOS red - clear error indication

  // Text hierarchy - optimized for dark terminals
  primary: "\x1b[38;2;255;255;255m", // Pure white - maximum readability
  secondary: "\x1b[38;2;174;174;178m", // Light gray - good contrast
  muted: "\x1b[38;2;99;99;102m", // Medium gray - subtle but readable

  // Accent elements
  bright: "\x1b[38;2;255;255;255;1m", // Bold white - for emphasis
  dim: "\x1b[38;2;142;142;147m", // Dim gray - for less important info

  // Control
  reset: "\x1b[0m",
};

// Easy theme customization - export for users to modifytes
export let currentTheme: ColorTheme = DeveloperTheme;

export function setLoggerTheme(theme: ColorTheme): void {
  currentTheme = theme;
}

// --- Core Types ---

export interface LogEntry {
  level: LogLevel;
  timestamp: number;
  context?: string;
  message: string;
  data?: any;
  eventType?: string;
}

export type EventType =
  | "AGENT_START"
  | "AGENT_COMPLETE"
  | "AGENT_ERROR"
  | "MODEL_CALL_START"
  | "MODEL_CALL_COMPLETE"
  | "MODEL_CALL_ERROR"
  | "ACTION_START"
  | "ACTION_COMPLETE"
  | "ACTION_ERROR"
  | "CONTEXT_CREATE"
  | "CONTEXT_ACTIVATE"
  | "CONTEXT_UPDATE"
  | "MEMORY_READ"
  | "MEMORY_WRITE"
  | "REQUEST_START"
  | "REQUEST_COMPLETE"
  | "REQUEST_ERROR";

export interface EventData {
  // Agent events
  agentName?: string;
  executionTime?: number;
  configuration?: Record<string, unknown>;

  // Model events
  provider?: string;
  modelId?: string;
  callType?: "generate" | "stream" | "embed" | "reasoning";
  tokens?: {
    input?: number;
    output?: number;
    reasoning?: number;
    total?: number;
  };
  cost?: number;
  duration?: number;
  timeToFirstToken?: number;

  // Action events
  actionName?: string;
  parameters?: Record<string, unknown>;
  result?: unknown;

  // Context events
  contextType?: string;
  contextId?: string;
  memoryOperations?: number;
  updateType?: "memory" | "state" | "config";

  // Memory events
  keys?: string[];
  cacheHit?: boolean;
  size?: number;

  // Request events
  source?: string;
  userId?: string;
  sessionId?: string;
  requestId?: string;

  // Error events
  error?: {
    message: string;
    code?: string;
    cause?: unknown;
    stack?: string;
  };

  // Status for start/complete/error events
  status?: "start" | "complete" | "error";

  // Generic additional data
  [key: string]: unknown;
}

// --- Performance Timing Utilities ---

export interface PerformanceTimer {
  start(): void;
  end(): number;
  getDuration(): number;
  isRunning(): boolean;
}

export class SimpleTimer implements PerformanceTimer {
  private startTime?: number;
  private endTime?: number;

  start(): void {
    this.startTime = performance.now();
    this.endTime = undefined;
  }

  end(): number {
    if (!this.startTime) {
      throw new Error("Timer not started");
    }
    this.endTime = performance.now();
    return this.getDuration();
  }

  getDuration(): number {
    if (!this.startTime) return 0;
    const end = this.endTime || performance.now();
    return end - this.startTime;
  }

  isRunning(): boolean {
    return this.startTime !== undefined && this.endTime === undefined;
  }
}

export interface CostEstimator {
  estimateCost(
    tokens: { input?: number; output?: number; reasoning?: number },
    modelId: string,
    provider: string
  ): number | Promise<number>;
}

// No-op cost estimator for when cost tracking is not needed
export class NoOpCostEstimator implements CostEstimator {
  estimateCost(): number {
    return 0; // No cost tracking
  }
}

export interface CostRate {
  input: number;
  output: number;
  reasoning?: number;
  lastUpdated?: number;
  source?: string;
}

export interface CostRateProvider {
  getRates(): Promise<Record<string, CostRate>>;
  getRate(modelId: string, provider: string): Promise<CostRate | null>;
}

// Dynamic cost estimator with multiple data sources
export class DynamicCostEstimator implements CostEstimator {
  private rates: Record<string, CostRate> = {};
  private lastFetch: number = 0;
  private fetchInterval: number = 3600000; // 1 hour
  private providers: CostRateProvider[] = [];
  private fallbackRates: Record<string, CostRate> = {};

  constructor(
    options: {
      providers?: CostRateProvider[];
      fetchInterval?: number;
      fallbackRates?: Record<string, CostRate>;
    } = {}
  ) {
    this.providers = options.providers || [new DefaultRateProvider()];
    this.fetchInterval = options.fetchInterval || 3600000;
    this.fallbackRates =
      options.fallbackRates || this.getDefaultFallbackRates();
  }

  async estimateCost(
    tokens: { input?: number; output?: number; reasoning?: number },
    modelId: string,
    provider: string
  ): Promise<number> {
    // Ensure we have fresh rates
    await this.ensureFreshRates();

    const modelKey = `${provider}/${modelId}`.toLowerCase();
    const rates = this.rates[modelKey] || this.fallbackRates[modelKey];

    if (!rates) {
      // Ultimate fallback - conservative estimate
      return this.calculateConservativeCost(tokens);
    }

    const inputCost = ((tokens.input || 0) * rates.input) / 1000;
    const outputCost = ((tokens.output || 0) * rates.output) / 1000;
    const reasoningCost =
      ((tokens.reasoning || 0) * (rates.reasoning || rates.output)) / 1000;

    return inputCost + outputCost + reasoningCost;
  }

  private async ensureFreshRates(): Promise<void> {
    const now = Date.now();
    if (now - this.lastFetch > this.fetchInterval) {
      await this.fetchRates();
      this.lastFetch = now;
    }
  }

  private async fetchRates(): Promise<void> {
    const newRates: Record<string, CostRate> = {};

    for (const provider of this.providers) {
      try {
        const rates = await provider.getRates();
        Object.assign(newRates, rates);
      } catch (error) {
        console.warn(`Failed to fetch rates from provider:`, error);
      }
    }

    if (Object.keys(newRates).length > 0) {
      this.rates = newRates;
    }
  }

  private getDefaultFallbackRates(): Record<string, CostRate> {
    return {
      "openai/gpt-4": { input: 0.03, output: 0.06, source: "fallback" },
      "openai/gpt-4-turbo": { input: 0.01, output: 0.03, source: "fallback" },
      "openai/gpt-3.5-turbo": {
        input: 0.0015,
        output: 0.002,
        source: "fallback",
      },
      "openai/gpt-3.5-turbo-16k": {
        input: 0.003,
        output: 0.004,
        source: "fallback",
      },
      "anthropic/claude-3-opus": {
        input: 0.015,
        output: 0.075,
        source: "fallback",
      },
      "anthropic/claude-3-sonnet": {
        input: 0.003,
        output: 0.015,
        source: "fallback",
      },
      "anthropic/claude-3-haiku": {
        input: 0.00025,
        output: 0.00125,
        source: "fallback",
      },
      "google/gemini-pro": {
        input: 0.0005,
        output: 0.0015,
        source: "fallback",
      },
      "google/gemini-pro-vision": {
        input: 0.0005,
        output: 0.0025,
        source: "fallback",
      },
    };
  }

  private calculateConservativeCost(tokens: {
    input?: number;
    output?: number;
    reasoning?: number;
  }): number {
    // Conservative estimate: $0.01 per 1K tokens
    const totalTokens =
      (tokens.input || 0) + (tokens.output || 0) + (tokens.reasoning || 0);
    return (totalTokens * 0.01) / 1000;
  }

  // Manual rate updates
  updateRates(rates: Record<string, CostRate>): void {
    this.rates = { ...this.rates, ...rates };
    this.lastFetch = Date.now();
  }

  // Get current rates for inspection
  getCurrentRates(): Record<string, CostRate> {
    return { ...this.rates };
  }
}

// Default rate provider with hardcoded rates (legacy support)
export class DefaultRateProvider implements CostRateProvider {
  async getRates(): Promise<Record<string, CostRate>> {
    return {
      "openai/gpt-4": {
        input: 0.03,
        output: 0.06,
        source: "default",
        lastUpdated: Date.now(),
      },
      "openai/gpt-4-turbo": {
        input: 0.01,
        output: 0.03,
        source: "default",
        lastUpdated: Date.now(),
      },
      "openai/gpt-3.5-turbo": {
        input: 0.0015,
        output: 0.002,
        source: "default",
        lastUpdated: Date.now(),
      },
      "openai/gpt-3.5-turbo-16k": {
        input: 0.003,
        output: 0.004,
        source: "default",
        lastUpdated: Date.now(),
      },
      "anthropic/claude-3-opus": {
        input: 0.015,
        output: 0.075,
        source: "default",
        lastUpdated: Date.now(),
      },
      "anthropic/claude-3-sonnet": {
        input: 0.003,
        output: 0.015,
        source: "default",
        lastUpdated: Date.now(),
      },
      "anthropic/claude-3-haiku": {
        input: 0.00025,
        output: 0.00125,
        source: "default",
        lastUpdated: Date.now(),
      },
      "google/gemini-pro": {
        input: 0.0005,
        output: 0.0015,
        source: "default",
        lastUpdated: Date.now(),
      },
      "google/gemini-pro-vision": {
        input: 0.0005,
        output: 0.0025,
        source: "default",
        lastUpdated: Date.now(),
      },
    };
  }

  async getRate(modelId: string, provider: string): Promise<CostRate | null> {
    const rates = await this.getRates();
    const key = `${provider}/${modelId}`.toLowerCase();
    return rates[key] || null;
  }
}

// API-based rate provider
export class APIRateProvider implements CostRateProvider {
  constructor(
    private endpoint: string,
    private options: {
      headers?: Record<string, string>;
      timeout?: number;
      cacheDuration?: number;
    } = {}
  ) {
    this.options.timeout = options.timeout || 5000;
    this.options.cacheDuration = options.cacheDuration || 3600000; // 1 hour
  }

  async getRates(): Promise<Record<string, CostRate>> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        this.options.timeout
      );

      const response = await fetch(this.endpoint, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...this.options.headers,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return this.normalizeRates(data);
    } catch (error) {
      console.warn(`Failed to fetch rates from API:`, error);
      return {};
    }
  }

  async getRate(modelId: string, provider: string): Promise<CostRate | null> {
    const rates = await this.getRates();
    const key = `${provider}/${modelId}`.toLowerCase();
    return rates[key] || null;
  }

  private normalizeRates(data: any): Record<string, CostRate> {
    const rates: Record<string, CostRate> = {};

    // Handle different API response formats
    if (Array.isArray(data)) {
      data.forEach((item: any) => {
        const key = `${item.provider}/${item.model}`.toLowerCase();
        rates[key] = {
          input: item.input_rate || item.input,
          output: item.output_rate || item.output,
          reasoning: item.reasoning_rate || item.reasoning,
          lastUpdated: Date.now(),
          source: "api",
        };
      });
    } else if (typeof data === "object") {
      Object.entries(data).forEach(([key, value]: [string, any]) => {
        rates[key.toLowerCase()] = {
          input: value.input_rate || value.input,
          output: value.output_rate || value.output,
          reasoning: value.reasoning_rate || value.reasoning,
          lastUpdated: Date.now(),
          source: "api",
        };
      });
    }

    return rates;
  }
}

// File-based rate provider
export class FileRateProvider implements CostRateProvider {
  private rates: Record<string, CostRate> = {};
  private lastLoad: number = 0;
  private loadInterval: number = 300000; // 5 minutes

  constructor(private filePath: string) {}

  async getRates(): Promise<Record<string, CostRate>> {
    const now = Date.now();
    if (now - this.lastLoad > this.loadInterval) {
      await this.loadRates();
      this.lastLoad = now;
    }
    return this.rates;
  }

  async getRate(modelId: string, provider: string): Promise<CostRate | null> {
    const rates = await this.getRates();
    const key = `${provider}/${modelId}`.toLowerCase();
    return rates[key] || null;
  }

  private async loadRates(): Promise<void> {
    try {
      const fs = await import("fs");
      const data = await fs.promises.readFile(this.filePath, "utf8");
      this.rates = JSON.parse(data);
    } catch (error) {
      console.warn(`Failed to load rates from file:`, error);
    }
  }
}

// Environment-based rate provider
export class EnvironmentRateProvider implements CostRateProvider {
  async getRates(): Promise<Record<string, CostRate>> {
    const rates: Record<string, CostRate> = {};

    // Parse rates from environment variables
    // Format: COST_RATE_PROVIDER_MODEL_INPUT=0.03
    Object.entries(process.env).forEach(([key, value]) => {
      if (key.startsWith("COST_RATE_")) {
        const parts = key.replace("COST_RATE_", "").toLowerCase().split("_");
        if (parts.length >= 4) {
          const [provider, model, type] = parts;
          const rateKey = `${provider}/${model}`;

          if (!rates[rateKey]) {
            rates[rateKey] = { input: 0, output: 0, source: "env" };
          }

          const numValue = parseFloat(value || "0");
          if (type === "input") rates[rateKey].input = numValue;
          else if (type === "output") rates[rateKey].output = numValue;
          else if (type === "reasoning") rates[rateKey].reasoning = numValue;
        }
      }
    });

    return rates;
  }

  async getRate(modelId: string, provider: string): Promise<CostRate | null> {
    const rates = await this.getRates();
    const key = `${provider}/${modelId}`.toLowerCase();
    return rates[key] || null;
  }
}

// Legacy support - backward compatibility
export class DefaultCostEstimator implements CostEstimator {
  private estimator: DynamicCostEstimator;

  constructor() {
    this.estimator = new DynamicCostEstimator({
      providers: [new DefaultRateProvider()],
    });
  }

  async estimateCost(
    tokens: { input?: number; output?: number; reasoning?: number },
    modelId: string,
    provider: string
  ): Promise<number> {
    return this.estimator.estimateCost(tokens, modelId, provider);
  }
}

// --- Transport System ---

export interface Transport {
  name: string;
  log(entry: LogEntry): void | Promise<void>;
  init?(): Promise<void> | void;
  close?(): Promise<void> | void;
}

export class ConsoleTransport implements Transport {
  name = "console";
  private styled: boolean = true;

  constructor(options: { styled?: boolean } = {}) {
    this.styled = options.styled ?? true;
  }

  log(entry: LogEntry): void {
    const formatted = this.format(entry);

    switch (entry.level) {
      case LogLevel.ERROR:
        console.error(formatted);
        break;
      case LogLevel.WARN:
        console.warn(formatted);
        break;
      case LogLevel.INFO:
        console.info(formatted);
        break;
      case LogLevel.DEBUG:
      case LogLevel.TRACE:
        console.debug(formatted);
        break;
      default:
        console.log(formatted);
    }
  }

  private format(entry: LogEntry): string {
    if (!this.styled) {
      return this.formatPlain(entry);
    }

    const theme = currentTheme;
    const timestamp = this.formatTimestamp(entry.timestamp);
    const level = this.formatLevel(entry.level);
    const context = this.formatContext(entry.context, entry.eventType);
    const message = this.formatMessage(
      entry.message,
      entry.level,
      entry.eventType
    );

    let formatted = `${timestamp} ${level} ${context}${message}`;

    // Add structured data with syntax highlighting
    if (entry.data && Object.keys(entry.data).length > 0) {
      const dataStr = this.formatData(entry.data);
      formatted += `\n${dataStr}`;
    }

    return formatted + theme.reset;
  }

  private formatPlain(entry: LogEntry): string {
    const timestamp = new Date(entry.timestamp).toISOString();
    const level = LogLevel[entry.level].padEnd(5);
    const context = entry.context ? `[${entry.context}]` : "";
    const message = entry.message;

    let formatted = `${timestamp} [${level}] ${context} ${message}`;

    if (entry.data && Object.keys(entry.data).length > 0) {
      const dataStr = JSON.stringify(entry.data, null, 2);
      formatted += `\n${dataStr}`;
    }

    return formatted;
  }

  private formatTimestamp(timestamp: number): string {
    const theme = currentTheme;
    const date = new Date(timestamp);
    const timeStr = date.toISOString().replace("T", " ").slice(0, -1);
    return `${theme.dim}${timeStr}${theme.reset}`;
  }

  private formatLevel(level: LogLevel): string {
    const theme = currentTheme;
    const levelStr = LogLevel[level].padEnd(5);

    switch (level) {
      case LogLevel.ERROR:
        return `${theme.error}[${levelStr}]${theme.reset}`;
      case LogLevel.WARN:
        return `${theme.warning}[${levelStr}]${theme.reset}`;
      case LogLevel.INFO:
        return `${theme.blue}[${levelStr}]${theme.reset}`;
      case LogLevel.DEBUG:
        return `${theme.success}[${levelStr}]${theme.reset}`;
      case LogLevel.TRACE:
        return `${theme.muted}[${levelStr}]${theme.reset}`;
      default:
        return `${theme.secondary}[${levelStr}]${theme.reset}`;
    }
  }

  private formatContext(context?: string, eventType?: string): string {
    if (!context && !eventType) return "";

    const theme = currentTheme;

    if (eventType) {
      // Color contexts based on event type categories
      if (eventType.startsWith("AGENT_")) {
        return `${theme.orange}[${context || "agent"}]${theme.reset} `;
      } else if (eventType.startsWith("MODEL_")) {
        return `${theme.blue}[${context || "model"}]${theme.reset} `;
      } else if (eventType.startsWith("ACTION_")) {
        return `${theme.cyan}[${context || "action"}]${theme.reset} `;
      } else if (eventType.startsWith("CONTEXT_")) {
        return `${theme.darkBlue}[${context || "context"}]${theme.reset} `;
      } else if (eventType.startsWith("MEMORY_")) {
        return `${theme.success}[${context || "memory"}]${theme.reset} `;
      }
    }

    return context ? `${theme.secondary}[${context}]${theme.reset} ` : "";
  }

  private formatMessage(
    message: string,
    level: LogLevel,
    eventType?: string
  ): string {
    const theme = currentTheme;

    // Style message based on level and event type
    if (level === LogLevel.ERROR) {
      return `${theme.error}${message}${theme.reset}`;
    } else if (eventType) {
      if (eventType.endsWith("_START")) {
        return `${theme.cyan}▶ ${theme.primary}${message}${theme.reset}`;
      } else if (eventType.endsWith("_COMPLETE")) {
        return `${theme.success}✓ ${theme.primary}${message}${theme.reset}`;
      } else if (eventType.endsWith("_ERROR")) {
        return `${theme.error}✗ ${theme.primary}${message}${theme.reset}`;
      } else {
        return `${theme.orange}◆ ${theme.primary}${message}${theme.reset}`;
      }
    }

    return `${theme.primary}${message}${theme.reset}`;
  }

  private formatData(data: any, indent: number = 2): string {
    const theme = currentTheme;

    try {
      const jsonStr = JSON.stringify(data, null, indent);
      return this.syntaxHighlight(jsonStr);
    } catch (error) {
      return `${theme.muted}${String(data)}${theme.reset}`;
    }
  }

  private syntaxHighlight(json: string): string {
    const theme = currentTheme;

    return json
      .replace(/(".*?"):/g, `${theme.orange}$1${theme.reset}:`) // Keys in orange
      .split("\n")
      .map((line) => `${theme.dim}│${theme.reset} ${line}`) // Left border
      .join("\n");
  }
}

export class FileTransport implements Transport {
  name = "file";
  private writeStream?: any; // fs.WriteStream

  constructor(private filePath: string) {}

  async init(): Promise<void> {
    const fs = await import("fs");
    this.writeStream = fs.createWriteStream(this.filePath, { flags: "a" });
  }

  log(entry: LogEntry): void {
    if (!this.writeStream) {
      console.error("FileTransport not initialized");
      return;
    }

    const formatted = this.format(entry);
    this.writeStream.write(formatted + "\n");
  }

  async close(): Promise<void> {
    if (this.writeStream) {
      return new Promise((resolve) => {
        this.writeStream.end(resolve);
      });
    }
  }

  private format(entry: LogEntry): string {
    // JSON format for file logging - easier to parse
    return JSON.stringify({
      timestamp: entry.timestamp,
      level: LogLevel[entry.level],
      context: entry.context,
      message: entry.message,
      eventType: entry.eventType,
      data: entry.data,
    });
  }
}

export class StreamTransport implements Transport {
  name = "stream";

  constructor(private stream: NodeJS.WritableStream) {}

  log(entry: LogEntry): void {
    const formatted = JSON.stringify(entry) + "\n";
    this.stream.write(formatted);
  }
}

export class HttpTransport implements Transport {
  name = "http";
  private buffer: LogEntry[] = [];
  private flushTimer?: NodeJS.Timeout;

  constructor(
    private endpoint: string,
    private options: {
      batchSize?: number;
      flushInterval?: number;
      headers?: Record<string, string>;
    } = {}
  ) {
    this.options.batchSize = options.batchSize ?? 100;
    this.options.flushInterval = options.flushInterval ?? 5000;
  }

  log(entry: LogEntry): void {
    this.buffer.push(entry);

    if (this.buffer.length >= this.options.batchSize!) {
      this.flush();
    } else if (!this.flushTimer) {
      this.flushTimer = setTimeout(
        () => this.flush(),
        this.options.flushInterval
      );
    }
  }

  private async flush(): Promise<void> {
    if (this.buffer.length === 0) return;

    const batch = [...this.buffer];
    this.buffer = [];

    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = undefined;
    }

    try {
      await fetch(this.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...this.options.headers,
        },
        body: JSON.stringify({ logs: batch }),
      });
    } catch (error) {
      console.error("HttpTransport flush failed:", error);
      // Could implement retry logic here
    }
  }

  async close(): Promise<void> {
    await this.flush();
  }
}

// --- Logger Implementation ---

export class Logger {
  private transports: Transport[] = [];
  private level: LogLevel = LogLevel.INFO;
  private eventListeners: Map<
    EventType | "*",
    Array<(entry: LogEntry) => void>
  > = new Map();
  private costEstimator?: CostEstimator;
  private activeTimers = new Map<string, PerformanceTimer>();

  constructor(
    options: {
      level?: LogLevel;
      transports?: Transport[];
      costEstimator?: CostEstimator | null;
      enableCostTracking?: boolean;
    } = {}
  ) {
    this.level = options.level ?? LogLevel.INFO;
    this.transports = options.transports ?? [new ConsoleTransport()];

    // Cost estimator is optional - only set if explicitly provided or enabled
    if (options.costEstimator !== null) {
      this.costEstimator =
        options.costEstimator ??
        (options.enableCostTracking ? new DefaultCostEstimator() : undefined);
    }

    // Initialize transports
    this.init();
  }

  private async init(): Promise<void> {
    for (const transport of this.transports) {
      if (transport.init) {
        try {
          await transport.init();
        } catch (error) {
          console.error(
            `Failed to initialize transport ${transport.name}:`,
            error
          );
        }
      }
    }
  }

  // --- Configuration ---

  configure(options: { level?: LogLevel }): void {
    if (options.level !== undefined) {
      this.level = options.level;
    }
  }

  addTransport(transport: Transport): void {
    this.transports.push(transport);
    if (transport.init) {
      const result = transport.init();
      if (result instanceof Promise) {
        result.catch((error: any) =>
          console.error(
            `Failed to initialize transport ${transport.name}:`,
            error
          )
        );
      }
    }
  }

  removeTransport(name: string): void {
    const index = this.transports.findIndex((t) => t.name === name);
    if (index >= 0) {
      const transport = this.transports[index];
      this.transports.splice(index, 1);

      if (transport.close) {
        const result = transport.close();
        if (result instanceof Promise) {
          result.catch((error: any) =>
            console.error(`Failed to close transport ${transport.name}:`, error)
          );
        }
      }
    }
  }

  // --- Simple Logging API ---

  error(message: string, context?: string, data?: any): void {
    this.log(LogLevel.ERROR, message, context, data);
  }

  warn(message: string, context?: string, data?: any): void {
    this.log(LogLevel.WARN, message, context, data);
  }

  info(message: string, context?: string, data?: any): void {
    this.log(LogLevel.INFO, message, context, data);
  }

  debug(message: string, context?: string, data?: any): void {
    this.log(LogLevel.DEBUG, message, context, data);
  }

  trace(message: string, context?: string, data?: any): void {
    this.log(LogLevel.TRACE, message, context, data);
  }

  // --- Backward Compatibility ---

  /**
   * Legacy structured logging method - now delegates to regular log
   * @deprecated Use event() for structured logging or regular log methods
   */
  structured(
    level: LogLevel,
    context: string,
    message: string,
    data?: any
  ): void {
    this.log(level, message, context, data);
  }

  // --- Event-Based Structured Logging ---

  event(type: EventType, data: EventData = {}): void {
    const level = this.getEventLevel(type);
    const message = this.formatEventMessage(type, data);
    const context = this.getEventContext(type);

    this.log(level, message, context, data, type);
  }

  // --- Performance-Focused Methods ---

  /**
   * Start timing an operation
   */
  startTimer(timerId: string): void {
    const timer = new SimpleTimer();
    timer.start();
    this.activeTimers.set(timerId, timer);
  }

  /**
   * End timing an operation and log the duration
   */
  endTimer(timerId: string, context?: string, additionalData?: any): number {
    const timer = this.activeTimers.get(timerId);
    if (!timer) {
      throw new Error(`Timer ${timerId} not found`);
    }

    const duration = timer.end();
    this.activeTimers.delete(timerId);

    this.debug(`Timer ${timerId} completed`, context, {
      duration,
      timerId,
      ...additionalData,
    });

    return duration;
  }

  /**
   * Get duration of an active timer without ending it
   */
  getTimerDuration(timerId: string): number {
    const timer = this.activeTimers.get(timerId);
    return timer ? timer.getDuration() : 0;
  }

  /**
   * Log a model call with automatic cost estimation
   */
  async logModelCall(
    provider: string,
    modelId: string,
    callType: "generate" | "stream" | "embed" | "reasoning",
    tokens: { input?: number; output?: number; reasoning?: number },
    duration: number,
    context?: string,
    additionalData?: any
  ): Promise<void> {
    let cost = 0;

    if (this.costEstimator) {
      cost = await this.costEstimator.estimateCost(tokens, modelId, provider);
    }

    this.event("MODEL_CALL_COMPLETE", {
      provider,
      modelId,
      callType,
      tokens,
      cost,
      duration,
      ...additionalData,
    });
  }

  /**
   * Log a model call start
   */
  logModelCallStart(
    provider: string,
    modelId: string,
    callType: "generate" | "stream" | "embed" | "reasoning",
    context?: string,
    additionalData?: any
  ): void {
    this.event("MODEL_CALL_START", {
      provider,
      modelId,
      callType,
      ...additionalData,
    });
  }

  /**
   * Log a model call error
   */
  logModelCallError(
    provider: string,
    modelId: string,
    callType: "generate" | "stream" | "embed" | "reasoning",
    error: Error | string,
    context?: string,
    additionalData?: any
  ): void {
    this.event("MODEL_CALL_ERROR", {
      provider,
      modelId,
      callType,
      error: {
        message: typeof error === "string" ? error : error.message,
        stack: error instanceof Error ? error.stack : undefined,
      },
      ...additionalData,
    });
  }

  /**
   * Log an action with timing
   */
  logAction(
    actionName: string,
    duration: number,
    context?: string,
    additionalData?: any
  ): void {
    this.event("ACTION_COMPLETE", {
      actionName,
      executionTime: duration,
      ...additionalData,
    });
  }

  /**
   * Log an action start
   */
  logActionStart(
    actionName: string,
    parameters?: Record<string, unknown>,
    context?: string,
    additionalData?: any
  ): void {
    this.event("ACTION_START", {
      actionName,
      parameters,
      ...additionalData,
    });
  }

  /**
   * Log an action error
   */
  logActionError(
    actionName: string,
    error: Error | string,
    context?: string,
    additionalData?: any
  ): void {
    this.event("ACTION_ERROR", {
      actionName,
      error: {
        message: typeof error === "string" ? error : error.message,
        stack: error instanceof Error ? error.stack : undefined,
      },
      ...additionalData,
    });
  }

  /**
   * Set custom cost estimator
   */
  setCostEstimator(estimator: CostEstimator | null): void {
    this.costEstimator = estimator || undefined;
  }

  /**
   * Get current cost estimator
   */
  getCostEstimator(): CostEstimator | undefined {
    return this.costEstimator;
  }

  /**
   * Check if cost tracking is enabled
   */
  isCostTrackingEnabled(): boolean {
    return this.costEstimator !== undefined;
  }

  // --- Event Streaming for External Consumption ---

  on(
    eventType: EventType | "*",
    listener: (entry: LogEntry) => void
  ): () => void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    this.eventListeners.get(eventType)!.push(listener);

    // Return unsubscribe function
    return () => {
      const listeners = this.eventListeners.get(eventType);
      if (listeners) {
        const index = listeners.indexOf(listener);
        if (index >= 0) {
          listeners.splice(index, 1);
        }
      }
    };
  }

  createStream(): ReadableStream<LogEntry> {
    let unsubscribeFn: (() => void) | undefined;

    return new ReadableStream({
      start: (controller) => {
        unsubscribeFn = this.on("*", (entry) => {
          controller.enqueue(entry);
        });
      },
      cancel: () => {
        if (unsubscribeFn) {
          unsubscribeFn();
        }
      },
    });
  }

  // --- Core Logging Implementation ---

  private log(
    level: LogLevel,
    message: string,
    context?: string,
    data?: any,
    eventType?: string
  ): void {
    if (level > this.level) return;

    const entry: LogEntry = {
      level,
      timestamp: Date.now(),
      context,
      message,
      data,
      eventType,
    };

    // Send to transports
    this.transports.forEach((transport) => {
      try {
        transport.log(entry);
      } catch (error) {
        console.error(`Transport ${transport.name} failed:`, error);
      }
    });

    // Emit to event listeners
    this.emitToListeners(entry);
  }

  private emitToListeners(entry: LogEntry): void {
    // Emit to specific event type listeners
    if (entry.eventType) {
      const listeners = this.eventListeners.get(entry.eventType as EventType);
      listeners?.forEach((listener) => {
        try {
          listener(entry);
        } catch (error) {
          console.error("Event listener error:", error);
        }
      });
    }

    // Emit to wildcard listeners
    const wildcardListeners = this.eventListeners.get("*");
    wildcardListeners?.forEach((listener) => {
      try {
        listener(entry);
      } catch (error) {
        console.error("Wildcard event listener error:", error);
      }
    });
  }

  private getEventLevel(type: EventType): LogLevel {
    if (type.endsWith("_ERROR")) return LogLevel.ERROR;
    if (type.endsWith("_START") || type.endsWith("_COMPLETE")) {
      if (type.startsWith("AGENT_") || type.startsWith("REQUEST_")) {
        return LogLevel.INFO;
      }
      return LogLevel.DEBUG;
    }
    return LogLevel.TRACE;
  }

  private formatEventMessage(type: EventType, data: EventData): string {
    switch (type) {
      case "AGENT_START":
        return `Starting agent: ${data.agentName || "unknown"}`;
      case "AGENT_COMPLETE":
        return `Agent completed: ${data.agentName || "unknown"} (${
          data.executionTime || 0
        }ms)`;
      case "AGENT_ERROR":
        return `Agent failed: ${data.agentName || "unknown"} - ${
          data.error?.message || "Unknown error"
        }`;

      case "MODEL_CALL_START":
        return `Model call started: ${data.provider}/${data.modelId} (${
          data.callType || "unknown"
        })`;
      case "MODEL_CALL_COMPLETE":
        const tokens = data.tokens
          ? `${data.tokens.input || 0}→${data.tokens.output || 0}`
          : "unknown tokens";
        return `Model call completed: ${data.provider}/${data.modelId} (${
          data.duration || 0
        }ms, ${tokens})`;
      case "MODEL_CALL_ERROR":
        return `Model call failed: ${data.provider}/${data.modelId} - ${
          data.error?.message || "Unknown error"
        }`;

      case "ACTION_START":
        return `Action started: ${data.actionName}`;
      case "ACTION_COMPLETE":
        return `Action completed: ${data.actionName} (${
          data.executionTime || 0
        }ms)`;
      case "ACTION_ERROR":
        return `Action failed: ${data.actionName} - ${
          data.error?.message || "Unknown error"
        }`;

      case "CONTEXT_CREATE":
        return `Context created: ${data.contextType}`;
      case "CONTEXT_ACTIVATE":
        return `Context activated: ${data.contextType}`;
      case "CONTEXT_UPDATE":
        return `Context updated: ${data.contextType} (${
          data.updateType || "unknown"
        })`;

      case "MEMORY_READ":
        return `Memory read: ${data.keys?.length || 0} keys (${
          data.cacheHit ? "hit" : "miss"
        })`;
      case "MEMORY_WRITE":
        return `Memory write: ${data.keys?.length || 0} keys`;

      case "REQUEST_START":
        return `Request started: ${data.source}`;
      case "REQUEST_COMPLETE":
        return `Request completed: ${data.source} (${
          data.executionTime || 0
        }ms)`;
      case "REQUEST_ERROR":
        return `Request failed: ${data.source} - ${
          data.error?.message || "Unknown error"
        }`;

      default:
        return `Event: ${type}`;
    }
  }

  private getEventContext(type: EventType): string {
    if (type.startsWith("AGENT_")) return "agent";
    if (type.startsWith("MODEL_")) return "model";
    if (type.startsWith("ACTION_")) return "action";
    if (type.startsWith("CONTEXT_")) return "context";
    if (type.startsWith("MEMORY_")) return "memory";
    if (type.startsWith("REQUEST_")) return "request";
    return "event";
  }

  // --- Cleanup ---

  async close(): Promise<void> {
    for (const transport of this.transports) {
      if (transport.close) {
        try {
          await transport.close();
        } catch (error) {
          console.error(`Failed to close transport ${transport.name}:`, error);
        }
      }
    }

    // Clear event listeners
    this.eventListeners.clear();
  }
}

// --- Additional Themes ---

export const ClassicTheme: ColorTheme = {
  orange: "\x1b[33m", // Yellow (classic)
  blue: "\x1b[34m", // Blue
  darkBlue: "\x1b[36m", // Cyan
  cyan: "\x1b[96m", // Bright cyan

  success: "\x1b[32m", // Green
  warning: "\x1b[33m", // Yellow
  error: "\x1b[31m", // Red

  primary: "\x1b[37m", // White
  secondary: "\x1b[90m", // Bright black
  muted: "\x1b[2m", // Dim

  bright: "\x1b[1m", // Bold
  dim: "\x1b[2m", // Dim

  reset: "\x1b[0m",
};

// Warm and cozy color theme
export const WarmTheme: ColorTheme = {
  // Warm, earthy colors
  orange: "\x1b[38;2;205;133;63m", // Peru (warm brown-orange)
  blue: "\x1b[38;2;100;149;237m", // Cornflower blue
  darkBlue: "\x1b[38;2;72;61;139m", // Dark slate blue
  cyan: "\x1b[38;2;95;158;160m", // Cadet blue

  // Status colors - warm and friendly
  success: "\x1b[38;2;85;107;47m", // Dark olive green
  warning: "\x1b[38;2;184;134;11m", // Dark goldenrod
  error: "\x1b[38;2;139;69;19m", // Saddle brown

  // Text hierarchy - warm tones
  primary: "\x1b[38;2;255;248;220m", // Cornsilk
  secondary: "\x1b[38;2;245;222;179m", // Wheat
  muted: "\x1b[38;2;160;82;45m", // Saddle brown

  // Accent elements
  bright: "\x1b[38;2;255;255;255;1m", // White + bold
  dim: "\x1b[38;2;139;69;19m", // Saddle brown

  // Control
  reset: "\x1b[0m",
};

// Cool and modern color theme
export const CoolTheme: ColorTheme = {
  // Cool, modern colors
  orange: "\x1b[38;2;255;140;0m", // Dark orange
  blue: "\x1b[38;2;30;144;255m", // Dodger blue
  darkBlue: "\x1b[38;2;25;25;112m", // Midnight blue
  cyan: "\x1b[38;2;0;191;255m", // Deep sky blue

  // Status colors - cool and professional
  success: "\x1b[38;2;46;139;87m", // Sea green
  warning: "\x1b[38;2;255;215;0m", // Gold
  error: "\x1b[38;2;220;20;60m", // Crimson

  // Text hierarchy - cool tones
  primary: "\x1b[38;2;240;248;255m", // Alice blue
  secondary: "\x1b[38;2;176;196;222m", // Light steel blue
  muted: "\x1b[38;2;119;136;153m", // Light slate gray

  // Accent elements
  bright: "\x1b[38;2;255;255;255;1m", // White + bold
  dim: "\x1b[38;2;105;105;105m", // Dim gray

  // Control
  reset: "\x1b[0m",
};

export const MonochromeTheme: ColorTheme = {
  orange: "\x1b[37m", // White
  blue: "\x1b[37m", // White
  darkBlue: "\x1b[90m", // Bright black
  cyan: "\x1b[37m", // White

  success: "\x1b[37m", // White
  warning: "\x1b[37m", // White
  error: "\x1b[37m", // White

  primary: "\x1b[37m", // White
  secondary: "\x1b[90m", // Bright black
  muted: "\x1b[2m", // Dim

  bright: "\x1b[1m", // Bold
  dim: "\x1b[2m", // Dim

  reset: "\x1b[0m",
};

// --- Convenience Factory Functions ---

export function createLogger(options?: {
  level?: LogLevel;
  style?: "console" | "file" | "json";
  theme?: ColorTheme | "developer" | "classic" | "warm" | "cool" | "monochrome";
  styled?: boolean;
  filePath?: string;
  transports?: Transport[];
  costEstimator?: CostEstimator | null;
  enableCostTracking?: boolean;
}): Logger {
  // Set theme if provided
  if (options?.theme) {
    if (typeof options.theme === "string") {
      switch (options.theme) {
        case "developer":
          setLoggerTheme(DeveloperTheme);
          break;
        case "classic":
          setLoggerTheme(ClassicTheme);
          break;
        case "warm":
          setLoggerTheme(WarmTheme);
          break;
        case "cool":
          setLoggerTheme(CoolTheme);
          break;
        case "monochrome":
          setLoggerTheme(MonochromeTheme);
          break;
      }
    } else {
      setLoggerTheme(options.theme);
    }
  }

  let transports: Transport[];

  if (options?.transports) {
    transports = options.transports;
  } else {
    switch (options?.style) {
      case "file":
        if (!options.filePath) {
          throw new Error("filePath required for file transport");
        }
        transports = [new FileTransport(options.filePath)];
        break;
      case "json":
        transports = [new StreamTransport(process.stdout)];
        break;
      case "console":
      default:
        transports = [
          new ConsoleTransport({
            styled: options?.styled !== false,
          }),
        ];
        break;
    }
  }

  return new Logger({
    level: options?.level,
    transports,
    costEstimator: options?.costEstimator,
    enableCostTracking: options?.enableCostTracking,
  });
}
