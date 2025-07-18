"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Cpu,
  Clock,
  BarChart3,
  Lightbulb,
  Network,
  Brain,
  Zap,
  Shield,
  Eye,
  Activity,
  TrendingUp,
  MessageSquare,
} from "lucide-react"

interface ProcessingStep {
  id: string
  step: string
  module: string
  description: string
  timestamp: number
  duration: number
  status: "pending" | "active" | "completed" | "error"
  details?: any
}

interface AxiomKitMetadata {
  processingSteps: ProcessingStep[]
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

interface AgentInsightsPanelProps {
  metadata: AxiomKitMetadata | null
  isProcessing: boolean
  processingStepIndex: number
}

export function AgentInsightsPanel({ metadata, isProcessing, processingStepIndex }: AgentInsightsPanelProps) {
  const [activeTab, setActiveTab] = useState("pipeline")

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Agent Insights</h3>
          {isProcessing && (
            <Badge variant="secondary" className="gap-1 animate-pulse">
              <Zap className="w-3 h-3" />
              Processing
            </Badge>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-4 mx-4 mt-4">
            <TabsTrigger value="pipeline" className="text-xs">
              Pipeline
            </TabsTrigger>
            <TabsTrigger value="metrics" className="text-xs">
              Metrics
            </TabsTrigger>
            <TabsTrigger value="features" className="text-xs">
              Features
            </TabsTrigger>
            <TabsTrigger value="reasoning" className="text-xs">
              Reasoning
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-hidden">
            <TabsContent value="pipeline" className="h-full m-0">
              <ScrollArea className="h-full">
                <div className="p-4 space-y-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Cpu className="w-4 h-4" />
                        Processing Pipeline
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {metadata?.processingSteps.map((step, index) => (
                        <div
                          key={step.id}
                          className={`flex items-start gap-3 p-3 rounded-lg transition-all ${
                            index <= processingStepIndex
                              ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                              : "bg-muted/50"
                          }`}
                        >
                          <div
                            className={`w-3 h-3 rounded-full mt-1 transition-colors ${
                              index < processingStepIndex
                                ? "bg-green-500"
                                : index === processingStepIndex && isProcessing
                                  ? "bg-blue-500 animate-pulse"
                                  : index === processingStepIndex
                                    ? "bg-green-500"
                                    : "bg-muted-foreground/30"
                            }`}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-sm font-medium">{step.step}</p>
                              <Badge variant="outline" className="text-xs">
                                {step.module}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mb-2">{step.description}</p>
                            {step.details && (
                              <div className="text-xs text-muted-foreground space-y-1">
                                {Object.entries(step.details).map(([key, value]) => (
                                  <div key={key} className="flex justify-between">
                                    <span className="capitalize">{key.replace(/([A-Z])/g, " $1")}:</span>
                                    <span className="font-mono">{String(value)}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                            {index <= processingStepIndex && step.status === "completed" && (
                              <p className="text-xs text-green-600 dark:text-green-400 mt-2 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Completed in {step.duration.toFixed(0)}ms
                              </p>
                            )}
                          </div>
                        </div>
                      )) || (
                        <div className="text-center py-8">
                          <Cpu className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">No processing data available</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="metrics" className="h-full m-0">
              <ScrollArea className="h-full">
                <div className="p-4 space-y-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <BarChart3 className="w-4 h-4" />
                        Performance Metrics
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {metadata ? (
                        <>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm font-medium">Response Time</span>
                              </div>
                              <div className="text-2xl font-bold text-primary">{metadata.metrics.responseTime}s</div>
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Zap className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm font-medium">Est. Task Time</span>
                              </div>
                              <div className="text-2xl font-bold text-primary">
                                {metadata.metrics.estimatedTaskTime}s
                              </div>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">Token Usage</span>
                              <Badge variant="outline">{metadata.metrics.tokens.total} total</Badge>
                            </div>
                            <div className="space-y-2">
                              <div className="flex justify-between text-xs">
                                <span>Input: {metadata.metrics.tokens.input}</span>
                                <span>Output: {metadata.metrics.tokens.output}</span>
                              </div>
                              <Progress
                                value={(metadata.metrics.tokens.input / metadata.metrics.tokens.total) * 100}
                                className="h-2"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-2 text-xs">
                            <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                              <div className="font-bold text-blue-600 dark:text-blue-400 text-lg">
                                {metadata.metrics.tokens.input}
                              </div>
                              <div className="text-muted-foreground">Input</div>
                            </div>
                            <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                              <div className="font-bold text-green-600 dark:text-green-400 text-lg">
                                {metadata.metrics.tokens.output}
                              </div>
                              <div className="text-muted-foreground">Output</div>
                            </div>
                            <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                              <div className="font-bold text-purple-600 dark:text-purple-400 text-lg">
                                {metadata.metrics.tokens.total}
                              </div>
                              <div className="text-muted-foreground">Total</div>
                            </div>
                          </div>

                          {metadata.metrics.cost && (
                            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                              <div className="flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm font-medium">Estimated Cost</span>
                              </div>
                              <Badge variant="secondary">${metadata.metrics.cost.toFixed(4)}</Badge>
                            </div>
                          )}

                          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                            <div className="flex items-center gap-2">
                              <Brain className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm font-medium">Model</span>
                            </div>
                            <Badge variant="outline">
                              {metadata.metrics.provider.toUpperCase()} {metadata.metrics.model}
                            </Badge>
                          </div>
                        </>
                      ) : (
                        <div className="text-center py-8">
                          <BarChart3 className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">No metrics data available</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="features" className="h-full m-0">
              <ScrollArea className="h-full">
                <div className="p-4 space-y-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Lightbulb className="w-4 h-4" />
                        Active Features
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {metadata?.featureHighlights.map((feature, index) => (
                        <div key={index} className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
                          <div className="flex items-start justify-between mb-2">
                            <p className="text-sm font-medium">{feature.feature}</p>
                            {feature.confidence && (
                              <Badge variant="secondary" className="text-xs">
                                {(feature.confidence * 100).toFixed(0)}%
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{feature.status}</p>
                          {feature.confidence && (
                            <div className="mt-2">
                              <Progress value={feature.confidence * 100} className="h-1" />
                            </div>
                          )}
                        </div>
                      )) || (
                        <div className="text-center py-8">
                          <Shield className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">No active features to display</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Network className="w-4 h-4" />
                        System Status
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {[
                        { name: "Memory Curator", status: "Active", color: "green" },
                        { name: "HTN Planner", status: "Active", color: "green" },
                        { name: "Resilience Layer", status: "Standby", color: "yellow" },
                        { name: "Ethical Guardrails", status: "Active", color: "green" },
                        { name: "Adaptation Engine", status: "Learning", color: "blue" },
                        { name: "Response Engine", status: "Ready", color: "gray" },
                      ].map((system, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">{system.name}</span>
                          <Badge
                            variant="secondary"
                            className={`
            ${system.color === "green" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" : ""}
            ${system.color === "yellow" ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" : ""}
            ${system.color === "blue" ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" : ""}
            ${system.color === "gray" ? "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200" : ""}
          `}
                          >
                            {system.status}
                          </Badge>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="reasoning" className="h-full m-0">
              <ScrollArea className="h-full">
                <div className="p-4 space-y-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" />
                        Internal Monologue
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {metadata?.internalMonologue.map((thought, index) => (
                        <div
                          key={index}
                          className={`p-2 rounded text-xs transition-all ${
                            index <= processingStepIndex
                              ? "bg-primary/10 text-primary"
                              : "bg-muted/50 text-muted-foreground"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-1.5 h-1.5 rounded-full ${
                                index <= processingStepIndex ? "bg-primary" : "bg-muted-foreground/30"
                              }`}
                            />
                            {thought}
                          </div>
                        </div>
                      )) || (
                        <div className="text-center py-8">
                          <Brain className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">No reasoning data available</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {metadata?.reasoning && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Eye className="w-4 h-4" />
                          Reasoning Analysis
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label className="text-xs font-medium text-muted-foreground">Approach</Label>
                          <p className="text-sm mt-1">{metadata.reasoning.approach}</p>
                        </div>
                        <div>
                          <Label className="text-xs font-medium text-muted-foreground">Key Factors</Label>
                          <div className="mt-2 space-y-1">
                            {metadata.reasoning.keyFactors.map((factor, index) => (
                              <div key={index} className="flex items-center gap-2 text-sm">
                                <div className="w-1 h-1 bg-primary rounded-full" />
                                {factor}
                              </div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <Label className="text-xs font-medium text-muted-foreground">Confidence</Label>
                            <Badge variant="outline">{(metadata.reasoning.confidence * 100).toFixed(0)}%</Badge>
                          </div>
                          <Progress value={metadata.reasoning.confidence * 100} className="h-2" />
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  )
}

function Label({ children, className, ...props }: { children: React.ReactNode; className?: string }) {
  return (
    <label
      className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className || ""}`}
      {...props}
    >
      {children}
    </label>
  )
}
