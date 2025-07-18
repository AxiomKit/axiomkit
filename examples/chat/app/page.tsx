"use client"

import { useChat } from "@ai-sdk/react"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Brain,
  MessageSquare,
  Settings,
  Eye,
  EyeOff,
  Play,
  Pause,
  Menu,
  X,
  Zap,
  ChevronRight,
  Sparkles,
  BarChart3,
} from "lucide-react"
import { ModelSettingsPanel, type ModelConfig } from "@/components/model-settings-panel"
import { AgentInsightsPanel } from "@/components/agent-insights-panel"
import { AnalyticsDashboard } from "@/components/analytics-dashboard"
import { analytics } from "@/lib/analytics"

interface AxiomKitMetadata {
  processingSteps: Array<{
    id: string
    step: string
    module: string
    description: string
    timestamp: number
    duration: number
    status: "pending" | "active" | "completed" | "error"
    details?: any
  }>
  metrics: {
    responseTime: string
    tokens: {
      input: number
      output: number
      total: number
    }
    estimatedTaskTime: string
    provider: string
    model: string
    cost?: number
  }
  featureHighlights: Array<{
    feature: string
    status: string
    active: boolean
    confidence?: number
  }>
  internalMonologue: string[]
  reasoning: {
    approach: string
    keyFactors: string[]
    confidence: number
  }
}

const demoScenarios = [
  {
    title: "Complex Planning Demo",
    prompt:
      "Plan a comprehensive marketing strategy for launching a new AI-powered productivity app targeting remote teams",
    description: "Showcases HTN Planner and multi-step reasoning capabilities",
    icon: "🎯",
    complexity: "High",
  },
  {
    title: "Adaptive Learning Example",
    prompt:
      "I prefer concise, technical explanations with code examples. Explain how transformer attention mechanisms work.",
    description: "Demonstrates Memory Curator and user preference adaptation",
    icon: "🧠",
    complexity: "Medium",
  },
  {
    title: "Multi-Agent Research",
    prompt:
      "Research the latest developments in quantum computing and create a comprehensive analysis report with market implications",
    description: "Shows Consensus Layer and collaborative task delegation",
    icon: "🔬",
    complexity: "High",
  },
  {
    title: "Ethical Reasoning",
    prompt: "Analyze the ethical implications of using AI for hiring decisions and provide balanced recommendations",
    description: "Highlights XAI and Ethical Guardrails in action",
    icon: "⚖️",
    complexity: "Medium",
  },
  {
    title: "Creative Problem Solving",
    prompt: "Design an innovative solution for reducing food waste in urban restaurants using IoT and AI technologies",
    description: "Demonstrates creative reasoning and solution synthesis",
    icon: "💡",
    complexity: "Medium",
  },
  {
    title: "Code Analysis & Optimization",
    prompt:
      "Review this Python function and suggest optimizations for better performance and readability: def fibonacci(n): return n if n <= 1 else fibonacci(n-1) + fibonacci(n-2)",
    description: "Shows technical analysis and code improvement capabilities",
    icon: "💻",
    complexity: "Low",
  },
]

export default function AxiomKitDemo() {
  const [showInsights, setShowInsights] = useState(true)
  const [showSidebar, setShowSidebar] = useState(true)
  const [showModelSettings, setShowModelSettings] = useState(false)
  const [showAnalytics, setShowAnalytics] = useState(false)
  const [currentMetadata, setCurrentMetadata] = useState<AxiomKitMetadata | null>(null)
  const [processingStepIndex, setProcessingStepIndex] = useState(0)
  const [sessionId] = useState(() => `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`)
  const [sessionStartTime] = useState(Date.now())
  const [modelConfig, setModelConfig] = useState<ModelConfig>({
    provider: "openai",
    model: "gpt-4o",
    temperature: 0.7,
    maxTokens: 2048,
    topP: 1.0,
    systemPrompt:
      "You are AxiomKit, an advanced AI framework. Demonstrate sophisticated reasoning and provide helpful, accurate responses.",
  })

  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Load saved model configuration
  useEffect(() => {
    const saved = localStorage.getItem("axiomkit-model-config")
    if (saved) {
      try {
        const config = JSON.parse(saved)
        setModelConfig(config)
      } catch (error) {
        console.error("Failed to load saved model config:", error)
      }
    }
  }, [])

  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    body: { modelConfig },
    onFinish: (message) => {
      // Track analytics when message is completed
      if (currentMetadata) {
        analytics.trackMetric({
          timestamp: Date.now(),
          responseTime: Number.parseFloat(currentMetadata.metrics.responseTime) * 1000,
          tokenUsage: currentMetadata.metrics.tokens,
          cost: currentMetadata.metrics.cost || 0,
          provider: currentMetadata.metrics.provider,
          model: currentMetadata.metrics.model,
          success: true,
        })
      }
    },
  })

  // Track session when component unmounts or page is closed
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (messages.length > 0) {
        const sessionDuration = Date.now() - sessionStartTime
        const scenarios = demoScenarios
          .filter((scenario) => messages.some((m) => m.content.includes(scenario.prompt.substring(0, 50))))
          .map((s) => s.title)

        analytics.trackSession({
          id: sessionId,
          timestamp: sessionStartTime,
          duration: sessionDuration,
          messageCount: messages.length,
          modelConfig: {
            provider: modelConfig.provider,
            model: modelConfig.model,
            temperature: modelConfig.temperature || 0.7,
            maxTokens: modelConfig.maxTokens || 2048,
          },
          totalTokens: currentMetadata?.metrics.tokens.total || 0,
          totalCost: currentMetadata?.metrics.cost || 0,
          avgResponseTime: currentMetadata ? Number.parseFloat(currentMetadata.metrics.responseTime) * 1000 : 0,
          scenarios,
          userSatisfaction: Math.random() * 2 + 3, // Simulated satisfaction score
        })
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
      handleBeforeUnload()
    }
  }, [messages, sessionId, sessionStartTime, modelConfig, currentMetadata])

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Simulate real-time processing steps
  useEffect(() => {
    if (isLoading && currentMetadata) {
      const interval = setInterval(() => {
        setProcessingStepIndex((prev) => {
          if (prev < currentMetadata.processingSteps.length - 1) {
            return prev + 1
          }
          clearInterval(interval)
          return prev
        })
      }, 400)

      return () => clearInterval(interval)
    }
  }, [isLoading, currentMetadata])

  // Generate new metadata when a message is sent
  useEffect(() => {
    if (isLoading) {
      const mockMetadata: AxiomKitMetadata = {
        processingSteps: [
          {
            id: "input-received",
            step: "Input Received",
            module: "Core Engine",
            description: "Processing user input and initializing request pipeline",
            timestamp: Date.now(),
            duration: 75,
            status: "completed",
            details: { inputLength: input.length, encoding: "utf-8" },
          },
          {
            id: "memory-curator",
            step: "Memory Curator Activated",
            module: "Memory Curator",
            description: "Retrieved 3 relevant memories, prioritized contextual information",
            timestamp: Date.now() + 100,
            duration: 150,
            status: "completed",
            details: {
              memoriesRetrieved: 3,
              salienceUpdated: "0.9",
              contextPriority: "high",
            },
          },
          {
            id: "htn-planner",
            step: "HTN Planner Engaged",
            module: "HTN Planner",
            description: "Decomposed query into executable sub-tasks and planning hierarchy",
            timestamp: Date.now() + 300,
            duration: 200,
            status: "completed",
            details: {
              subTasks: 4,
              complexity: "medium",
              estimatedSteps: 6,
            },
          },
          {
            id: "llm-inference",
            step: "LLM Inference",
            module: "Language Model",
            description: `Processing with ${modelConfig.provider.toUpperCase()} ${modelConfig.model}`,
            timestamp: Date.now() + 600,
            duration: 800,
            status: "completed",
            details: {
              provider: modelConfig.provider,
              model: modelConfig.model,
              temperature: modelConfig.temperature,
              maxTokens: modelConfig.maxTokens,
            },
          },
          {
            id: "response-generation",
            step: "Response Generation",
            module: "Response Engine",
            description: "Formatting, optimizing, and streaming response to client",
            timestamp: Date.now() + 1400,
            duration: 75,
            status: "completed",
            details: { format: "markdown", streaming: true },
          },
        ],
        metrics: {
          responseTime: (Math.random() * 2 + 0.8).toFixed(2),
          tokens: {
            input: Math.floor(Math.random() * 200) + 50,
            output: Math.floor(Math.random() * 400) + 100,
            total: 0,
          },
          estimatedTaskTime: (Math.random() * 45 + 15).toFixed(0),
          provider: modelConfig.provider,
          model: modelConfig.model,
          cost: Number.parseFloat((Math.random() * 0.05 + 0.001).toFixed(4)),
        },
        featureHighlights: [
          {
            feature: "Adaptive Memory Curator",
            status: "Updated user preferences salience to 0.9",
            active: true,
            confidence: 0.92,
          },
          {
            feature: "HTN Planner",
            status: "Decomposed task into 4 sub-tasks with 6 decision points",
            active: true,
            confidence: 0.88,
          },
          {
            feature: "XAI & Ethical Guardrails",
            status: "Privacy guidelines applied, content safety verified",
            active: true,
            confidence: 0.95,
          },
        ],
        internalMonologue: [
          "Analyzing user intent and context...",
          "Retrieving relevant background knowledge...",
          "Considering multiple response approaches...",
          "Evaluating ethical implications...",
          "Optimizing for clarity and helpfulness...",
          "Preparing structured response...",
        ],
        reasoning: {
          approach: "Multi-step analytical reasoning with contextual awareness",
          keyFactors: [
            "User query complexity and intent",
            "Available contextual information",
            "Optimal response structure",
            "Ethical considerations",
          ],
          confidence: 0.87,
        },
      }
      mockMetadata.metrics.tokens.total = mockMetadata.metrics.tokens.input + mockMetadata.metrics.tokens.output
      setCurrentMetadata(mockMetadata)
      setProcessingStepIndex(0)
    }
  }, [isLoading, input, modelConfig])

  const handleScenarioClick = (prompt: string) => {
    handleInputChange({ target: { value: prompt } } as any)
  }

  // Responsive breakpoints
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768
  const isTablet = typeof window !== "undefined" && window.innerWidth < 1024

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div
        className={`${
          showSidebar ? "w-80" : "w-0"
        } transition-all duration-300 bg-card border-r border-border flex flex-col overflow-hidden ${
          isMobile ? "absolute inset-y-0 left-0 z-50 w-full" : ""
        }`}
      >
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">AxiomKit</h1>
                <p className="text-sm text-muted-foreground">AI Framework Demo</p>
              </div>
            </div>
            {isMobile && (
              <Button variant="ghost" size="sm" onClick={() => setShowSidebar(false)}>
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>

          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start gap-2 bg-transparent"
              onClick={() => setShowInsights(!showInsights)}
            >
              {showInsights ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showInsights ? "Hide" : "Show"} Agent Insights
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start gap-2 bg-transparent"
              onClick={() => setShowAnalytics(true)}
            >
              <BarChart3 className="w-4 h-4" />
              Analytics Dashboard
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-6">
              <h3 className="text-sm font-semibold mb-4">Demo Scenarios</h3>
              <div className="space-y-3">
                {demoScenarios.map((scenario, index) => (
                  <Card key={index} className="cursor-pointer hover:shadow-md transition-all hover:border-primary/50">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{scenario.icon}</span>
                          <h4 className="text-sm font-medium">{scenario.title}</h4>
                        </div>
                        <Badge
                          variant={
                            scenario.complexity === "High"
                              ? "destructive"
                              : scenario.complexity === "Medium"
                                ? "default"
                                : "secondary"
                          }
                          className="text-xs"
                        >
                          {scenario.complexity}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-3">{scenario.description}</p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full text-xs gap-2 bg-transparent"
                        onClick={() => {
                          handleScenarioClick(scenario.prompt)
                          if (isMobile) setShowSidebar(false)
                        }}
                      >
                        <Sparkles className="w-3 h-3" />
                        Try Scenario
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="bg-card border-b border-border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {!showSidebar && (
                <Button variant="ghost" size="sm" onClick={() => setShowSidebar(true)}>
                  <Menu className="w-4 h-4" />
                </Button>
              )}
              <MessageSquare className="w-5 h-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold">Chat Interface</h2>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="gap-1 hidden sm:flex">
                <Zap className="w-3 h-3" />
                {modelConfig.provider.toUpperCase()} {modelConfig.model}
              </Badge>
              <Badge variant={isLoading ? "default" : "secondary"} className="gap-1">
                {isLoading ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                {isLoading ? "Processing" : "Ready"}
              </Badge>
              <Button variant="outline" size="sm" onClick={() => setShowModelSettings(true)}>
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline ml-2">Settings</span>
              </Button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-6 space-y-6">
              {messages.length === 0 && (
                <div className="text-center py-12">
                  <Brain className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Welcome to AxiomKit</h3>
                  <p className="text-muted-foreground max-w-md mx-auto mb-6">
                    Experience advanced AI reasoning with full transparency into the decision-making process. Try one of
                    the demo scenarios or ask any question.
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {demoScenarios.slice(0, 3).map((scenario, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        className="gap-2 bg-transparent"
                        onClick={() => handleScenarioClick(scenario.prompt)}
                      >
                        <span>{scenario.icon}</span>
                        {scenario.title}
                        <ChevronRight className="w-3 h-3" />
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((message, index) => (
                <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-3xl ${
                      message.role === "user" ? "bg-primary text-primary-foreground" : "bg-card border border-border"
                    } rounded-lg p-4 shadow-sm`}
                  >
                    <div className="flex items-start gap-3">
                      {message.role === "assistant" && (
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <Brain className="w-4 h-4 text-white" />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="prose prose-sm max-w-none dark:prose-invert">
                          {message.parts.map((part, i) => {
                            switch (part.type) {
                              case "text":
                                return <div key={`${message.id}-${i}`}>{part.text}</div>
                              default:
                                return null
                            }
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="max-w-3xl bg-card border border-border rounded-lg p-4 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <Brain className="w-4 h-4 text-white animate-pulse" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                          <div
                            className="w-2 h-2 bg-primary rounded-full animate-bounce"
                            style={{ animationDelay: "0.1s" }}
                          ></div>
                          <div
                            className="w-2 h-2 bg-primary rounded-full animate-bounce"
                            style={{ animationDelay: "0.2s" }}
                          ></div>
                          <span className="ml-2">AxiomKit is thinking...</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
        </div>

        <div className="bg-card border-t border-border p-4">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <Input
              value={input}
              onChange={handleInputChange}
              placeholder="Ask AxiomKit anything..."
              className="flex-1"
              disabled={isLoading}
            />
            <Button type="submit" disabled={isLoading || !input.trim()}>
              <MessageSquare className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </div>

      {/* Agent Insights Panel */}
      {showInsights && !isMobile && (
        <div className="w-96 bg-card border-l border-border">
          <AgentInsightsPanel
            metadata={currentMetadata}
            isProcessing={isLoading}
            processingStepIndex={processingStepIndex}
          />
        </div>
      )}

      {/* Mobile Insights Overlay */}
      {showInsights && isMobile && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-end">
          <div className="w-full h-2/3 bg-card border-t border-border rounded-t-lg">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-semibold">Agent Insights</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowInsights(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="h-full overflow-hidden">
              <AgentInsightsPanel
                metadata={currentMetadata}
                isProcessing={isLoading}
                processingStepIndex={processingStepIndex}
              />
            </div>
          </div>
        </div>
      )}

      {/* Model Settings Panel */}
      <ModelSettingsPanel
        modelConfig={modelConfig}
        onModelConfigChange={setModelConfig}
        isOpen={showModelSettings}
        onOpenChange={setShowModelSettings}
      />

      {/* Analytics Dashboard */}
      <AnalyticsDashboard isOpen={showAnalytics} onOpenChange={setShowAnalytics} />
    </div>
  )
}
