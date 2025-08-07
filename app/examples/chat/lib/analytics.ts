"use client"

export interface ChatSession {
  id: string
  timestamp: number
  duration: number
  messageCount: number
  modelConfig: {
    provider: string
    model: string
    temperature: number
    maxTokens: number
  }
  totalTokens: number
  totalCost: number
  avgResponseTime: number
  scenarios: string[]
  userSatisfaction?: number
}

export interface PerformanceMetric {
  timestamp: number
  responseTime: number
  tokenUsage: {
    input: number
    output: number
    total: number
  }
  cost: number
  provider: string
  model: string
  success: boolean
  errorType?: string
}

export interface SystemHealth {
  timestamp: number
  cpuUsage: number
  memoryUsage: number
  activeConnections: number
  queueLength: number
  errorRate: number
  uptime: number
}

export interface UsageAnalytics {
  sessions: ChatSession[]
  metrics: PerformanceMetric[]
  systemHealth: SystemHealth[]
  totalUsers: number
  totalSessions: number
  totalMessages: number
  totalCost: number
  avgSessionDuration: number
  popularScenarios: Array<{ name: string; count: number }>
  providerUsage: Array<{ provider: string; usage: number; cost: number }>
  timeSeriesData: Array<{
    timestamp: number
    sessions: number
    messages: number
    cost: number
    avgResponseTime: number
  }>
}

class AnalyticsManager {
  private static instance: AnalyticsManager
  private sessions: ChatSession[] = []
  private metrics: PerformanceMetric[] = []
  private systemHealth: SystemHealth[] = []

  static getInstance(): AnalyticsManager {
    if (!AnalyticsManager.instance) {
      AnalyticsManager.instance = new AnalyticsManager()
    }
    return AnalyticsManager.instance
  }

  constructor() {
    this.loadFromStorage()
    this.startSystemHealthMonitoring()
  }

  private loadFromStorage() {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("axiomkit-analytics")
      if (stored) {
        try {
          const data = JSON.parse(stored)
          this.sessions = data.sessions || []
          this.metrics = data.metrics || []
          this.systemHealth = data.systemHealth || []
        } catch (error) {
          console.error("Failed to load analytics data:", error)
        }
      }
    }
  }

  private saveToStorage() {
    if (typeof window !== "undefined") {
      const data = {
        sessions: this.sessions.slice(-1000), // Keep last 1000 sessions
        metrics: this.metrics.slice(-5000), // Keep last 5000 metrics
        systemHealth: this.systemHealth.slice(-1000), // Keep last 1000 health checks
      }
      localStorage.setItem("axiomkit-analytics", JSON.stringify(data))
    }
  }

  private startSystemHealthMonitoring() {
    // Simulate system health monitoring
    setInterval(() => {
      const health: SystemHealth = {
        timestamp: Date.now(),
        cpuUsage: Math.random() * 80 + 10,
        memoryUsage: Math.random() * 70 + 20,
        activeConnections: Math.floor(Math.random() * 100) + 10,
        queueLength: Math.floor(Math.random() * 20),
        errorRate: Math.random() * 5,
        uptime: Date.now() - (Date.now() - Math.random() * 86400000), // Random uptime up to 24h
      }
      this.systemHealth.push(health)
      this.saveToStorage()
    }, 30000) // Every 30 seconds
  }

  trackSession(session: ChatSession) {
    this.sessions.push(session)
    this.saveToStorage()
  }

  trackMetric(metric: PerformanceMetric) {
    this.metrics.push(metric)
    this.saveToStorage()
  }

  getAnalytics(): UsageAnalytics {
    const now = Date.now()
    const last24h = now - 24 * 60 * 60 * 1000
    const last7d = now - 7 * 24 * 60 * 60 * 1000

    // Filter recent data
    const recentSessions = this.sessions.filter((s) => s.timestamp > last7d)
    const recentMetrics = this.metrics.filter((m) => m.timestamp > last7d)

    // Calculate aggregated metrics
    const totalUsers = new Set(this.sessions.map((s) => s.id.split("-")[0])).size
    const totalSessions = this.sessions.length
    const totalMessages = this.sessions.reduce((sum, s) => sum + s.messageCount, 0)
    const totalCost = this.sessions.reduce((sum, s) => sum + s.totalCost, 0)
    const avgSessionDuration = this.sessions.reduce((sum, s) => sum + s.duration, 0) / this.sessions.length

    // Popular scenarios
    const scenarioCount: Record<string, number> = {}
    this.sessions.forEach((session) => {
      session.scenarios.forEach((scenario) => {
        scenarioCount[scenario] = (scenarioCount[scenario] || 0) + 1
      })
    })
    const popularScenarios = Object.entries(scenarioCount)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // Provider usage
    const providerStats: Record<string, { usage: number; cost: number }> = {}
    recentSessions.forEach((session) => {
      const provider = session.modelConfig.provider
      if (!providerStats[provider]) {
        providerStats[provider] = { usage: 0, cost: 0 }
      }
      providerStats[provider].usage += session.messageCount
      providerStats[provider].cost += session.totalCost
    })
    const providerUsage = Object.entries(providerStats).map(([provider, stats]) => ({ provider, ...stats }))

    // Time series data (hourly for last 24h)
    const timeSeriesData = []
    for (let i = 23; i >= 0; i--) {
      const hourStart = now - (i + 1) * 60 * 60 * 1000
      const hourEnd = now - i * 60 * 60 * 1000

      const hourSessions = recentSessions.filter((s) => s.timestamp >= hourStart && s.timestamp < hourEnd)
      const hourMetrics = recentMetrics.filter((m) => m.timestamp >= hourStart && m.timestamp < hourEnd)

      timeSeriesData.push({
        timestamp: hourStart,
        sessions: hourSessions.length,
        messages: hourSessions.reduce((sum, s) => sum + s.messageCount, 0),
        cost: hourSessions.reduce((sum, s) => sum + s.totalCost, 0),
        avgResponseTime:
          hourMetrics.length > 0 ? hourMetrics.reduce((sum, m) => sum + m.responseTime, 0) / hourMetrics.length : 0,
      })
    }

    return {
      sessions: recentSessions,
      metrics: recentMetrics,
      systemHealth: this.systemHealth.slice(-100), // Last 100 health checks
      totalUsers,
      totalSessions,
      totalMessages,
      totalCost,
      avgSessionDuration,
      popularScenarios,
      providerUsage,
      timeSeriesData,
    }
  }

  generateMockData() {
    // Generate mock historical data for demonstration
    const now = Date.now()
    const providers = ["openai", "groq", "anthropic", "deepseek"]
    const models = {
      openai: ["gpt-4o", "gpt-4-turbo", "gpt-3.5-turbo"],
      groq: ["llama-3.1-70b-versatile", "llama-3.1-8b-instant"],
      anthropic: ["claude-3-5-sonnet-20241022", "claude-3-haiku-20240307"],
      deepseek: ["deepseek-chat", "deepseek-coder"],
    }
    const scenarios = [
      "Complex Planning Demo",
      "Adaptive Learning Example",
      "Multi-Agent Research",
      "Ethical Reasoning",
      "Creative Problem Solving",
      "Code Analysis & Optimization",
    ]

    // Generate sessions for the last 7 days
    for (let day = 0; day < 7; day++) {
      const dayStart = now - (day + 1) * 24 * 60 * 60 * 1000
      const sessionsPerDay = Math.floor(Math.random() * 50) + 20

      for (let i = 0; i < sessionsPerDay; i++) {
        const provider = providers[Math.floor(Math.random() * providers.length)]
        const model = models[provider][Math.floor(Math.random() * models[provider].length)]
        const sessionScenarios = scenarios.filter(() => Math.random() > 0.7)

        const session: ChatSession = {
          id: `user-${Math.floor(Math.random() * 1000)}-${Date.now()}-${i}`,
          timestamp: dayStart + Math.random() * 24 * 60 * 60 * 1000,
          duration: Math.random() * 1800000 + 300000, // 5-35 minutes
          messageCount: Math.floor(Math.random() * 20) + 3,
          modelConfig: {
            provider,
            model,
            temperature: Math.random() * 1.5 + 0.3,
            maxTokens: Math.floor(Math.random() * 2048) + 512,
          },
          totalTokens: Math.floor(Math.random() * 5000) + 500,
          totalCost: Math.random() * 0.5 + 0.01,
          avgResponseTime: Math.random() * 3000 + 500,
          scenarios: sessionScenarios,
          userSatisfaction: Math.random() * 2 + 3, // 3-5 rating
        }

        this.sessions.push(session)

        // Generate metrics for this session
        for (let j = 0; j < session.messageCount; j++) {
          const metric: PerformanceMetric = {
            timestamp: session.timestamp + j * (session.duration / session.messageCount),
            responseTime: Math.random() * 4000 + 300,
            tokenUsage: {
              input: Math.floor(Math.random() * 200) + 50,
              output: Math.floor(Math.random() * 400) + 100,
              total: 0,
            },
            cost: Math.random() * 0.1 + 0.001,
            provider: session.modelConfig.provider,
            model: session.modelConfig.model,
            success: Math.random() > 0.05, // 95% success rate
            errorType: Math.random() > 0.95 ? "timeout" : undefined,
          }
          metric.tokenUsage.total = metric.tokenUsage.input + metric.tokenUsage.output
          this.metrics.push(metric)
        }
      }
    }

    this.saveToStorage()
  }
}

export const analytics = AnalyticsManager.getInstance()
