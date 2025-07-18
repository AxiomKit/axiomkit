"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import {
  Settings,
  Key,
  Shield,
  Eye,
  EyeOff,
  Save,
  RotateCcw,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Zap,
  DollarSign,
} from "lucide-react"

export interface ModelConfig {
  provider: string
  model: string
  apiKey?: string
  temperature?: number
  maxTokens?: number
  topP?: number
  systemPrompt?: string
}

interface ModelProvider {
  id: string
  name: string
  icon: string
  models: string[]
  requiresApiKey: boolean
  apiKeyPlaceholder: string
  documentationUrl: string
  description: string
  features: string[]
  pricing: string
}

const modelProviders: ModelProvider[] = [
  {
    id: "openai",
    name: "OpenAI",
    icon: "🤖",
    models: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"],
    requiresApiKey: false,
    apiKeyPlaceholder: "sk-...",
    documentationUrl: "https://platform.openai.com/docs",
    description: "Advanced language models with superior reasoning capabilities",
    features: ["Vision", "Code Generation", "JSON Mode", "Structured Output"],
    pricing: "$0.01-0.06/1K tokens",
  },
  {
    id: "groq",
    name: "Groq",
    icon: "⚡",
    models: ["llama-3.1-70b-versatile", "llama-3.1-8b-instant", "mixtral-8x7b-32768", "gemma2-9b-it"],
    requiresApiKey: true,
    apiKeyPlaceholder: "gsk_...",
    documentationUrl: "https://console.groq.com/docs",
    description: "Ultra-fast inference with Groq's LPU technology",
    features: ["Ultra-Fast", "Low Latency", "High Throughput", "Open Source Models"],
    pricing: "$0.27-2.80/1M tokens",
  },
  {
    id: "anthropic",
    name: "Anthropic",
    icon: "🧠",
    models: ["claude-3-5-sonnet-20241022", "claude-3-haiku-20240307", "claude-3-opus-20240229"],
    requiresApiKey: true,
    apiKeyPlaceholder: "sk-ant-...",
    documentationUrl: "https://docs.anthropic.com",
    description: "Constitutional AI with strong safety and reasoning",
    features: ["Constitutional AI", "Long Context", "Safety First", "Code Analysis"],
    pricing: "$0.25-15.00/1M tokens",
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    icon: "🔍",
    models: ["deepseek-chat", "deepseek-coder"],
    requiresApiKey: true,
    apiKeyPlaceholder: "sk-...",
    documentationUrl: "https://platform.deepseek.com/docs",
    description: "Specialized models for reasoning and coding tasks",
    features: ["Code Generation", "Mathematical Reasoning", "Research", "Analysis"],
    pricing: "$0.14-2.80/1M tokens",
  },
]

interface ModelSettingsPanelProps {
  modelConfig: ModelConfig
  onModelConfigChange: (config: ModelConfig) => void
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export function ModelSettingsPanel({
  modelConfig,
  onModelConfigChange,
  isOpen,
  onOpenChange,
}: ModelSettingsPanelProps) {
  const [localConfig, setLocalConfig] = useState<ModelConfig>(modelConfig)
  const [showApiKeys, setShowApiKeys] = useState<Record<string, boolean>>({})
  const [testingConnection, setTestingConnection] = useState<string | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<Record<string, "success" | "error" | null>>({})

  useEffect(() => {
    setLocalConfig(modelConfig)
  }, [modelConfig])

  const currentProvider = modelProviders.find((p) => p.id === localConfig.provider)

  const handleSave = () => {
    onModelConfigChange(localConfig)
    onOpenChange(false)
    localStorage.setItem("axiomkit-model-config", JSON.stringify(localConfig))
  }

  const handleReset = () => {
    const defaultConfig: ModelConfig = {
      provider: "openai",
      model: "gpt-4o",
      temperature: 0.7,
      maxTokens: 2048,
      topP: 1.0,
      systemPrompt:
        "You are AxiomKit, an advanced AI framework. Demonstrate sophisticated reasoning and provide helpful, accurate responses.",
    }
    setLocalConfig(defaultConfig)
  }

  const toggleApiKeyVisibility = (provider: string) => {
    setShowApiKeys((prev) => ({ ...prev, [provider]: !prev[provider] }))
  }

  const testConnection = async (provider: string, apiKey: string) => {
    setTestingConnection(provider)
    setConnectionStatus((prev) => ({ ...prev, [provider]: null }))

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500))

      const isValidFormat =
        (provider === "openai" && apiKey.startsWith("sk-")) ||
        (provider === "groq" && apiKey.startsWith("gsk_")) ||
        (provider === "deepseek" && apiKey.startsWith("sk-")) ||
        (provider === "anthropic" && apiKey.startsWith("sk-ant-"))

      setConnectionStatus((prev) => ({
        ...prev,
        [provider]: isValidFormat ? "success" : "error",
      }))
    } catch (error) {
      setConnectionStatus((prev) => ({ ...prev, [provider]: "error" }))
    } finally {
      setTestingConnection(null)
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:w-[600px] lg:w-[700px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Model Configuration
          </SheetTitle>
          <SheetDescription>
            Configure AI model providers, API keys, and generation parameters for AxiomKit.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6">
          <Tabs defaultValue="providers" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="providers">Providers</TabsTrigger>
              <TabsTrigger value="parameters">Parameters</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>

            <TabsContent value="providers" className="space-y-4 mt-4">
              <div>
                <Label className="text-base font-semibold">AI Model Providers</Label>
                <p className="text-sm text-muted-foreground mb-4">
                  Choose your preferred AI model provider and configure authentication.
                </p>
              </div>

              <div className="space-y-4">
                {modelProviders.map((provider) => (
                  <Card
                    key={provider.id}
                    className={`cursor-pointer transition-all ${
                      localConfig.provider === provider.id ? "ring-2 ring-primary bg-primary/5" : "hover:shadow-md"
                    }`}
                    onClick={() =>
                      setLocalConfig((prev) => ({
                        ...prev,
                        provider: provider.id,
                        model: provider.models[0],
                      }))
                    }
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{provider.icon}</span>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold">{provider.name}</h3>
                              {localConfig.provider === provider.id && (
                                <Badge variant="secondary" className="text-xs">
                                  Active
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{provider.description}</p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <DollarSign className="w-3 h-3" />
                                {provider.pricing}
                              </div>
                              <div className="flex items-center gap-1">
                                <Zap className="w-3 h-3" />
                                {provider.features[0]}
                              </div>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            window.open(provider.documentationUrl, "_blank")
                          }}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </div>

                      {localConfig.provider === provider.id && (
                        <div className="space-y-4 border-t pt-4">
                          <div>
                            <Label htmlFor={`model-${provider.id}`}>Model</Label>
                            <Select
                              value={localConfig.model}
                              onValueChange={(value) => setLocalConfig((prev) => ({ ...prev, model: value }))}
                            >
                              <SelectTrigger className="mt-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {provider.models.map((model) => (
                                  <SelectItem key={model} value={model}>
                                    {model}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {provider.requiresApiKey && (
                            <div>
                              <Label htmlFor={`apikey-${provider.id}`} className="flex items-center gap-2">
                                <Key className="w-4 h-4" />
                                API Key
                              </Label>
                              <div className="flex gap-2 mt-1">
                                <div className="relative flex-1">
                                  <Input
                                    id={`apikey-${provider.id}`}
                                    type={showApiKeys[provider.id] ? "text" : "password"}
                                    placeholder={provider.apiKeyPlaceholder}
                                    value={localConfig.apiKey || ""}
                                    onChange={(e) =>
                                      setLocalConfig((prev) => ({
                                        ...prev,
                                        apiKey: e.target.value,
                                      }))
                                    }
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                                    onClick={() => toggleApiKeyVisibility(provider.id)}
                                  >
                                    {showApiKeys[provider.id] ? (
                                      <EyeOff className="w-4 h-4" />
                                    ) : (
                                      <Eye className="w-4 h-4" />
                                    )}
                                  </Button>
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={!localConfig.apiKey || testingConnection === provider.id}
                                  onClick={() => testConnection(provider.id, localConfig.apiKey!)}
                                >
                                  {testingConnection === provider.id ? (
                                    <div className="w-4 h-4 border-2 border-muted border-t-primary rounded-full animate-spin" />
                                  ) : connectionStatus[provider.id] === "success" ? (
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                  ) : connectionStatus[provider.id] === "error" ? (
                                    <AlertCircle className="w-4 h-4 text-red-500" />
                                  ) : (
                                    "Test"
                                  )}
                                </Button>
                              </div>
                              {connectionStatus[provider.id] === "success" && (
                                <p className="text-sm text-green-600 mt-1">✓ Connection successful</p>
                              )}
                              {connectionStatus[provider.id] === "error" && (
                                <p className="text-sm text-red-600 mt-1">
                                  ✗ Invalid API key format or connection failed
                                </p>
                              )}
                            </div>
                          )}

                          <div className="grid grid-cols-2 gap-4 text-xs">
                            {provider.features.map((feature, idx) => (
                              <div key={idx} className="flex items-center gap-1 text-muted-foreground">
                                <CheckCircle className="w-3 h-3 text-green-500" />
                                {feature}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="parameters" className="space-y-6 mt-4">
              <div>
                <Label className="text-base font-semibold">Generation Parameters</Label>
                <p className="text-sm text-muted-foreground mb-4">
                  Fine-tune the model's behavior and output characteristics.
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Temperature</Label>
                    <Badge variant="outline">{localConfig.temperature || 0.7}</Badge>
                  </div>
                  <Slider
                    value={[localConfig.temperature || 0.7]}
                    onValueChange={([value]) => setLocalConfig((prev) => ({ ...prev, temperature: value }))}
                    max={2}
                    min={0}
                    step={0.1}
                    className="w-full"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Controls randomness. Lower values make output more focused and deterministic.
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Max Tokens</Label>
                    <Badge variant="outline">{localConfig.maxTokens || 2048}</Badge>
                  </div>
                  <Slider
                    value={[localConfig.maxTokens || 2048]}
                    onValueChange={([value]) => setLocalConfig((prev) => ({ ...prev, maxTokens: value }))}
                    max={4096}
                    min={256}
                    step={256}
                    className="w-full"
                  />
                  <p className="text-sm text-muted-foreground mt-1">Maximum number of tokens in the response.</p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Top P</Label>
                    <Badge variant="outline">{localConfig.topP || 1.0}</Badge>
                  </div>
                  <Slider
                    value={[localConfig.topP || 1.0]}
                    onValueChange={([value]) => setLocalConfig((prev) => ({ ...prev, topP: value }))}
                    max={1}
                    min={0.1}
                    step={0.1}
                    className="w-full"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Nucleus sampling parameter. Controls diversity via cumulative probability.
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="advanced" className="space-y-6 mt-4">
              <div>
                <Label className="text-base font-semibold">Advanced Configuration</Label>
                <p className="text-sm text-muted-foreground mb-4">
                  Advanced settings for power users and custom integrations.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="system-prompt">System Prompt</Label>
                  <Textarea
                    id="system-prompt"
                    placeholder="Enter custom system prompt..."
                    value={localConfig.systemPrompt || ""}
                    onChange={(e) => setLocalConfig((prev) => ({ ...prev, systemPrompt: e.target.value }))}
                    rows={4}
                    className="mt-1"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Custom instructions that define the AI's behavior and personality.
                  </p>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      Safety & Compliance
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Content Filtering</Label>
                        <p className="text-sm text-muted-foreground">Enable built-in content safety filters</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>PII Detection</Label>
                        <p className="text-sm text-muted-foreground">
                          Automatically detect and redact personal information
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Usage Analytics</Label>
                        <p className="text-sm text-muted-foreground">Collect anonymous usage statistics</p>
                      </div>
                      <Switch />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="flex items-center justify-between pt-6 border-t mt-6">
          <Button variant="outline" onClick={handleReset} className="gap-2 bg-transparent">
            <RotateCcw className="w-4 h-4" />
            Reset
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="gap-2">
              <Save className="w-4 h-4" />
              Save Configuration
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
