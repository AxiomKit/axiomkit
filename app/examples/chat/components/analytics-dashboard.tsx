"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  BarChart3,
  TrendingUp,
  Users,
  MessageSquare,
  DollarSign,
  Clock,
  Activity,
  AlertTriangle,
  CheckCircle,
  Zap,
  Server,
  Cpu,
  MemoryStick,
  Network,
  RefreshCw,
  Download,
} from "lucide-react";
import { analytics, type UsageAnalytics } from "@/lib/analytics";

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884D8",
  "#82CA9D",
];

interface AnalyticsDashboardProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AnalyticsDashboard({
  isOpen,
  onOpenChange,
}: AnalyticsDashboardProps) {
  const [analyticsData, setAnalyticsData] = useState<UsageAnalytics | null>(
    null
  );
  const [timeRange, setTimeRange] = useState("24h");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadAnalytics();
    }
  }, [isOpen]);

  const loadAnalytics = async () => {
    setRefreshing(true);
    // Simulate loading delay
    await new Promise((resolve) => setTimeout(resolve, 500));
    const data = analytics.getAnalytics();
    setAnalyticsData(data);
    setRefreshing(false);
  };

  const handleRefresh = () => {
    loadAnalytics();
  };

  const handleGenerateMockData = () => {
    analytics.generateMockData();
    loadAnalytics();
  };

  const exportData = () => {
    if (analyticsData) {
      const dataStr = JSON.stringify(analyticsData, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `axiomkit-analytics-${
        new Date().toISOString().split("T")[0]
      }.json`;
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-7xl h-[90vh] bg-card border border-border rounded-lg shadow-lg flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
              <p className="text-sm text-muted-foreground">
                AxiomKit Usage & Performance Monitoring
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1h">Last Hour</SelectItem>
                <SelectItem value="24h">Last 24h</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerateMockData}
            >
              Generate Mock Data
            </Button>
            <Button variant="outline" size="sm" onClick={exportData}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw
                className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {analyticsData ? (
            <Tabs defaultValue="overview" className="h-full flex flex-col">
              <TabsList className="mx-6 mt-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="performance">Performance</TabsTrigger>
                <TabsTrigger value="usage">Usage Patterns</TabsTrigger>
                <TabsTrigger value="costs">Cost Analysis</TabsTrigger>
                <TabsTrigger value="system">System Health</TabsTrigger>
              </TabsList>

              <div className="flex-1 overflow-hidden">
                <TabsContent value="overview" className="h-full m-0">
                  <ScrollArea className="h-full">
                    <div className="p-6 space-y-6">
                      {/* Key Metrics */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card>
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                  Total Users
                                </p>
                                <p className="text-3xl font-bold">
                                  {analyticsData.totalUsers.toLocaleString()}
                                </p>
                              </div>
                              <Users className="w-8 h-8 text-blue-500" />
                            </div>
                            <div className="mt-4 flex items-center text-sm">
                              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                              <span className="text-green-500">+12.5%</span>
                              <span className="text-muted-foreground ml-1">
                                vs last period
                              </span>
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                  Total Sessions
                                </p>
                                <p className="text-3xl font-bold">
                                  {analyticsData.totalSessions.toLocaleString()}
                                </p>
                              </div>
                              <MessageSquare className="w-8 h-8 text-green-500" />
                            </div>
                            <div className="mt-4 flex items-center text-sm">
                              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                              <span className="text-green-500">+8.2%</span>
                              <span className="text-muted-foreground ml-1">
                                vs last period
                              </span>
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                  Total Messages
                                </p>
                                <p className="text-3xl font-bold">
                                  {analyticsData.totalMessages.toLocaleString()}
                                </p>
                              </div>
                              <Activity className="w-8 h-8 text-purple-500" />
                            </div>
                            <div className="mt-4 flex items-center text-sm">
                              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                              <span className="text-green-500">+15.7%</span>
                              <span className="text-muted-foreground ml-1">
                                vs last period
                              </span>
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                  Total Cost
                                </p>
                                <p className="text-3xl font-bold">
                                  ${analyticsData.totalCost.toFixed(2)}
                                </p>
                              </div>
                              <DollarSign className="w-8 h-8 text-yellow-500" />
                            </div>
                            <div className="mt-4 flex items-center text-sm">
                              <TrendingUp className="w-4 h-4 text-red-500 mr-1" />
                              <span className="text-red-500">+5.3%</span>
                              <span className="text-muted-foreground ml-1">
                                vs last period
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Time Series Chart */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="w-5 h-5" />
                            Usage Over Time
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={analyticsData.timeSeriesData}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis
                                dataKey="timestamp"
                                tickFormatter={(value) =>
                                  new Date(value).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                }
                              />
                              <YAxis />
                              <Tooltip
                                labelFormatter={(value) =>
                                  new Date(value).toLocaleString()
                                }
                                formatter={(value, name) => [
                                  typeof value === "number"
                                    ? value.toLocaleString()
                                    : value,
                                  name,
                                ]}
                              />
                              <Legend />
                              <Area
                                type="monotone"
                                dataKey="sessions"
                                stackId="1"
                                stroke="#8884d8"
                                fill="#8884d8"
                                name="Sessions"
                              />
                              <Area
                                type="monotone"
                                dataKey="messages"
                                stackId="1"
                                stroke="#82ca9d"
                                fill="#82ca9d"
                                name="Messages"
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Popular Scenarios */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <Zap className="w-5 h-5" />
                              Popular Scenarios
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              {analyticsData.popularScenarios
                                .slice(0, 6)
                                .map((scenario, index) => (
                                  <div
                                    key={scenario.name}
                                    className="flex items-center justify-between"
                                  >
                                    <div className="flex items-center gap-3">
                                      <Badge
                                        variant="outline"
                                        className="w-6 h-6 p-0 flex items-center justify-center"
                                      >
                                        {index + 1}
                                      </Badge>
                                      <span className="text-sm font-medium">
                                        {scenario.name}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm text-muted-foreground">
                                        {scenario.count}
                                      </span>
                                      <Progress
                                        value={
                                          (scenario.count /
                                            analyticsData.popularScenarios[0]
                                              .count) *
                                          100
                                        }
                                        className="w-16 h-2"
                                      />
                                    </div>
                                  </div>
                                ))}
                            </div>
                          </CardContent>
                        </Card>

                        {/* Provider Usage */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <Server className="w-5 h-5" />
                              Provider Distribution
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ResponsiveContainer width="100%" height={200}>
                              <PieChart>
                                <Pie
                                  data={analyticsData.providerUsage}
                                  cx="50%"
                                  cy="50%"
                                  labelLine={false}
                                  label={({ provider, usage }) =>
                                    `${provider}: ${usage}`
                                  }
                                  outerRadius={80}
                                  fill="#8884d8"
                                  dataKey="usage"
                                >
                                  {analyticsData.providerUsage.map(
                                    (entry, index) => (
                                      <Cell
                                        key={`cell-${index}`}
                                        fill={COLORS[index % COLORS.length]}
                                      />
                                    )
                                  )}
                                </Pie>
                                <Tooltip />
                              </PieChart>
                            </ResponsiveContainer>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="performance" className="h-full m-0">
                  <ScrollArea className="h-full">
                    <div className="p-6 space-y-6">
                      {/* Performance Metrics */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card>
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                  Avg Response Time
                                </p>
                                <p className="text-2xl font-bold">
                                  {(
                                    analyticsData.metrics.reduce(
                                      (sum, m) => sum + m.responseTime,
                                      0
                                    ) /
                                    analyticsData.metrics.length /
                                    1000
                                  ).toFixed(2)}
                                  s
                                </p>
                              </div>
                              <Clock className="w-6 h-6 text-blue-500" />
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                  Success Rate
                                </p>
                                <p className="text-2xl font-bold">
                                  {(
                                    (analyticsData.metrics.filter(
                                      (m) => m.success
                                    ).length /
                                      analyticsData.metrics.length) *
                                    100
                                  ).toFixed(1)}
                                  %
                                </p>
                              </div>
                              <CheckCircle className="w-6 h-6 text-green-500" />
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                  Error Rate
                                </p>
                                <p className="text-2xl font-bold">
                                  {(
                                    (analyticsData.metrics.filter(
                                      (m) => !m.success
                                    ).length /
                                      analyticsData.metrics.length) *
                                    100
                                  ).toFixed(1)}
                                  %
                                </p>
                              </div>
                              <AlertTriangle className="w-6 h-6 text-red-500" />
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Response Time Chart */}
                      <Card>
                        <CardHeader>
                          <CardTitle>Response Time Trends</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={analyticsData.timeSeriesData}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis
                                dataKey="timestamp"
                                tickFormatter={(value) =>
                                  new Date(value).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                }
                              />
                              <YAxis />
                              <Tooltip
                                labelFormatter={(value) =>
                                  new Date(value).toLocaleString()
                                }
                                formatter={(value) => [
                                  `${Number(value).toFixed(2)}ms`,
                                  "Avg Response Time",
                                ]}
                              />
                              <Line
                                type="monotone"
                                dataKey="avgResponseTime"
                                stroke="#8884d8"
                                strokeWidth={2}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>

                      {/* Provider Performance Comparison */}
                      <Card>
                        <CardHeader>
                          <CardTitle>Provider Performance Comparison</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={analyticsData.providerUsage}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="provider" />
                              <YAxis />
                              <Tooltip />
                              <Legend />
                              <Bar
                                dataKey="usage"
                                fill="#8884d8"
                                name="Usage Count"
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="usage" className="h-full m-0">
                  <ScrollArea className="h-full">
                    <div className="p-6 space-y-6">
                      {/* Usage Patterns */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                          <CardHeader>
                            <CardTitle>Session Duration Distribution</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ResponsiveContainer width="100%" height={250}>
                              <BarChart
                                data={[
                                  {
                                    range: "0-5min",
                                    count: analyticsData.sessions.filter(
                                      (s) => s.duration < 300000
                                    ).length,
                                  },
                                  {
                                    range: "5-15min",
                                    count: analyticsData.sessions.filter(
                                      (s) =>
                                        s.duration >= 300000 &&
                                        s.duration < 900000
                                    ).length,
                                  },
                                  {
                                    range: "15-30min",
                                    count: analyticsData.sessions.filter(
                                      (s) =>
                                        s.duration >= 900000 &&
                                        s.duration < 1800000
                                    ).length,
                                  },
                                  {
                                    range: "30min+",
                                    count: analyticsData.sessions.filter(
                                      (s) => s.duration >= 1800000
                                    ).length,
                                  },
                                ]}
                              >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="range" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="count" fill="#82ca9d" />
                              </BarChart>
                            </ResponsiveContainer>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader>
                            <CardTitle>Messages per Session</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ResponsiveContainer width="100%" height={250}>
                              <BarChart
                                data={[
                                  {
                                    range: "1-5",
                                    count: analyticsData.sessions.filter(
                                      (s) => s.messageCount <= 5
                                    ).length,
                                  },
                                  {
                                    range: "6-10",
                                    count: analyticsData.sessions.filter(
                                      (s) =>
                                        s.messageCount > 5 &&
                                        s.messageCount <= 10
                                    ).length,
                                  },
                                  {
                                    range: "11-20",
                                    count: analyticsData.sessions.filter(
                                      (s) =>
                                        s.messageCount > 10 &&
                                        s.messageCount <= 20
                                    ).length,
                                  },
                                  {
                                    range: "20+",
                                    count: analyticsData.sessions.filter(
                                      (s) => s.messageCount > 20
                                    ).length,
                                  },
                                ]}
                              >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="range" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="count" fill="#ffc658" />
                              </BarChart>
                            </ResponsiveContainer>
                          </CardContent>
                        </Card>
                      </div>

                      {/* User Satisfaction */}
                      <Card>
                        <CardHeader>
                          <CardTitle>User Satisfaction Ratings</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-5 gap-4 mb-6">
                            {[5, 4, 3, 2, 1].map((rating) => {
                              const count = analyticsData.sessions.filter(
                                (s) =>
                                  s.userSatisfaction &&
                                  Math.floor(s.userSatisfaction) === rating
                              ).length;
                              const percentage =
                                (count /
                                  analyticsData.sessions.filter(
                                    (s) => s.userSatisfaction
                                  ).length) *
                                100;

                              return (
                                <div key={rating} className="text-center">
                                  <div className="text-2xl font-bold">
                                    {count}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {rating} Stars
                                  </div>
                                  <Progress
                                    value={percentage}
                                    className="mt-2"
                                  />
                                  <div className="text-xs text-muted-foreground mt-1">
                                    {percentage.toFixed(1)}%
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          <div className="text-center">
                            <div className="text-3xl font-bold">
                              {(
                                analyticsData.sessions
                                  .filter((s) => s.userSatisfaction)
                                  .reduce(
                                    (sum, s) => sum + (s.userSatisfaction || 0),
                                    0
                                  ) /
                                analyticsData.sessions.filter(
                                  (s) => s.userSatisfaction
                                ).length
                              ).toFixed(1)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Average Rating
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="costs" className="h-full m-0">
                  <ScrollArea className="h-full">
                    <div className="p-6 space-y-6">
                      {/* Cost Overview */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card>
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                  Total Spend
                                </p>
                                <p className="text-2xl font-bold">
                                  ${analyticsData.totalCost.toFixed(2)}
                                </p>
                              </div>
                              <DollarSign className="w-6 h-6 text-green-500" />
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                  Avg Cost per Session
                                </p>
                                <p className="text-2xl font-bold">
                                  $
                                  {(
                                    analyticsData.totalCost /
                                    analyticsData.totalSessions
                                  ).toFixed(4)}
                                </p>
                              </div>
                              <Activity className="w-6 h-6 text-blue-500" />
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                  Cost per 1K Tokens
                                </p>
                                <p className="text-2xl font-bold">
                                  $
                                  {(
                                    (analyticsData.totalCost /
                                      analyticsData.sessions.reduce(
                                        (sum, s) => sum + s.totalTokens,
                                        0
                                      )) *
                                    1000
                                  ).toFixed(4)}
                                </p>
                              </div>
                              <Zap className="w-6 h-6 text-purple-500" />
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Cost Trends */}
                      <Card>
                        <CardHeader>
                          <CardTitle>Cost Trends Over Time</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={analyticsData.timeSeriesData}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis
                                dataKey="timestamp"
                                tickFormatter={(value) =>
                                  new Date(value).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                }
                              />
                              <YAxis />
                              <Tooltip
                                labelFormatter={(value) =>
                                  new Date(value).toLocaleString()
                                }
                                formatter={(value) => [
                                  `$${Number(value).toFixed(4)}`,
                                  "Cost",
                                ]}
                              />
                              <Area
                                type="monotone"
                                dataKey="cost"
                                stroke="#82ca9d"
                                fill="#82ca9d"
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>

                      {/* Provider Cost Breakdown */}
                      <Card>
                        <CardHeader>
                          <CardTitle>Cost by Provider</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {analyticsData.providerUsage.map(
                              (provider, index) => (
                                <div
                                  key={provider.provider}
                                  className="flex items-center justify-between p-4 border rounded-lg"
                                >
                                  <div className="flex items-center gap-3">
                                    <div
                                      className="w-4 h-4 rounded-full"
                                      style={{
                                        backgroundColor:
                                          COLORS[index % COLORS.length],
                                      }}
                                    />
                                    <div>
                                      <p className="font-medium capitalize">
                                        {provider.provider}
                                      </p>
                                      <p className="text-sm text-muted-foreground">
                                        {provider.usage} requests
                                      </p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-bold">
                                      ${provider.cost.toFixed(4)}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      {(
                                        (provider.cost /
                                          analyticsData.totalCost) *
                                        100
                                      ).toFixed(1)}
                                      %
                                    </p>
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="system" className="h-full m-0">
                  <ScrollArea className="h-full">
                    <div className="p-6 space-y-6">
                      {/* System Health Overview */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Card>
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                  CPU Usage
                                </p>
                                <p className="text-2xl font-bold">
                                  {analyticsData.systemHealth.length > 0
                                    ? analyticsData.systemHealth[
                                        analyticsData.systemHealth.length - 1
                                      ].cpuUsage.toFixed(1)
                                    : "0"}
                                  %
                                </p>
                              </div>
                              <Cpu className="w-6 h-6 text-blue-500" />
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                  Memory Usage
                                </p>
                                <p className="text-2xl font-bold">
                                  {analyticsData.systemHealth.length > 0
                                    ? analyticsData.systemHealth[
                                        analyticsData.systemHealth.length - 1
                                      ].memoryUsage.toFixed(1)
                                    : "0"}
                                  %
                                </p>
                              </div>
                              <MemoryStick className="w-6 h-6 text-green-500" />
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                  Active Connections
                                </p>
                                <p className="text-2xl font-bold">
                                  {analyticsData.systemHealth.length > 0
                                    ? analyticsData.systemHealth[
                                        analyticsData.systemHealth.length - 1
                                      ].activeConnections
                                    : "0"}
                                </p>
                              </div>
                              <Network className="w-6 h-6 text-purple-500" />
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                  Queue Length
                                </p>
                                <p className="text-2xl font-bold">
                                  {analyticsData.systemHealth.length > 0
                                    ? analyticsData.systemHealth[
                                        analyticsData.systemHealth.length - 1
                                      ].queueLength
                                    : "0"}
                                </p>
                              </div>
                              <Activity className="w-6 h-6 text-yellow-500" />
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* System Health Charts */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card>
                          <CardHeader>
                            <CardTitle>CPU & Memory Usage</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ResponsiveContainer width="100%" height={250}>
                              <LineChart
                                data={analyticsData.systemHealth.slice(-20)}
                              >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis
                                  dataKey="timestamp"
                                  tickFormatter={(value) =>
                                    new Date(value).toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })
                                  }
                                />
                                <YAxis />
                                <Tooltip
                                  labelFormatter={(value) =>
                                    new Date(value).toLocaleString()
                                  }
                                  formatter={(value, name) => [
                                    `${Number(value).toFixed(1)}%`,
                                    name,
                                  ]}
                                />
                                <Legend />
                                <Line
                                  type="monotone"
                                  dataKey="cpuUsage"
                                  stroke="#8884d8"
                                  name="CPU Usage"
                                />
                                <Line
                                  type="monotone"
                                  dataKey="memoryUsage"
                                  stroke="#82ca9d"
                                  name="Memory Usage"
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader>
                            <CardTitle>Network Activity</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ResponsiveContainer width="100%" height={250}>
                              <AreaChart
                                data={analyticsData.systemHealth.slice(-20)}
                              >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis
                                  dataKey="timestamp"
                                  tickFormatter={(value) =>
                                    new Date(value).toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })
                                  }
                                />
                                <YAxis />
                                <Tooltip
                                  labelFormatter={(value) =>
                                    new Date(value).toLocaleString()
                                  }
                                />
                                <Area
                                  type="monotone"
                                  dataKey="activeConnections"
                                  stroke="#ffc658"
                                  fill="#ffc658"
                                  name="Active Connections"
                                />
                              </AreaChart>
                            </ResponsiveContainer>
                          </CardContent>
                        </Card>
                      </div>

                      {/* System Status */}
                      <Card>
                        <CardHeader>
                          <CardTitle>System Status</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {[
                              {
                                name: "API Gateway",
                                status: "Healthy",
                                uptime: "99.9%",
                              },
                              {
                                name: "Load Balancer",
                                status: "Healthy",
                                uptime: "99.8%",
                              },
                              {
                                name: "Database",
                                status: "Healthy",
                                uptime: "99.9%",
                              },
                              {
                                name: "Cache Layer",
                                status: "Healthy",
                                uptime: "99.7%",
                              },
                              {
                                name: "Message Queue",
                                status: "Healthy",
                                uptime: "99.9%",
                              },
                              {
                                name: "Monitoring",
                                status: "Healthy",
                                uptime: "100%",
                              },
                            ].map((service, index) => (
                              <div
                                key={service.name}
                                className="flex items-center justify-between p-4 border rounded-lg"
                              >
                                <div className="flex items-center gap-3">
                                  <CheckCircle className="w-5 h-5 text-green-500" />
                                  <div>
                                    <p className="font-medium">
                                      {service.name}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      Uptime: {service.uptime}
                                    </p>
                                  </div>
                                </div>
                                <Badge
                                  variant="secondary"
                                  className="bg-green-100 text-green-800"
                                >
                                  {service.status}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </ScrollArea>
                </TabsContent>
              </div>
            </Tabs>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <BarChart3 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">
                  Loading Analytics...
                </h3>
                <p className="text-muted-foreground">
                  Gathering usage data and performance metrics
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
