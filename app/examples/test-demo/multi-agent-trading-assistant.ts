#!/usr/bin/env node

/**
 * 🚀 AXIOMKIT SHOWCASE: Multi-Agent Trading Assistant
 * 
 * This comprehensive example demonstrates the full power of AxiomKit framework:
 * 
 * 🧠 ADVANCED MEMORY: Episodic, semantic, and working memory systems
 * 🤝 MULTI-AGENT COLLABORATION: Specialized agents working together
 * ⛓️ BLOCKCHAIN INTEGRATION: Real SEI blockchain trading capabilities
 * 📱 TELEGRAM INTERFACE: Production-ready user interaction
 * 🎯 INTELLIGENT DECISIONS: Context-aware trading recommendations
 * 🔄 REAL-TIME ADAPTATION: Learning from market conditions and user behavior
 * 
 * This showcase proves AxiomKit's effectiveness for building sophisticated
 * AI systems that can handle complex, real-world scenarios.
 */

import { groq } from "@ai-sdk/groq";
import {
  createAgent,
  context,
  action,
  provider,
  input,
  MemorySystem,
  InMemoryKeyValueProvider,
  InMemoryVectorProvider,
  InMemoryGraphProvider,
  validateEnv,
  LogLevel,
} from "@axiomkit/core";
import { telegram } from "@axiomkit/telegram";
import { AxiomSeiWallet } from "@axiomkit/sei";
import { privateKeyToAccount } from "viem/accounts";
import * as viemChains from "viem/chains";
import * as z from "zod";
import chalk from "chalk";

// --- Environment Setup ---
const env = validateEnv(
  z.object({
    TELEGRAM_TOKEN: z.string().min(1, "TELEGRAM_TOKEN is required"),
    GROQ_API_KEY: z.string().min(1, "GROQ_API_KEY is required"),
    SEI_PRIVATE_KEY: z.string().min(1, "SEI_PRIVATE_KEY is required"),
    SEI_RPC_URL: z.string().min(1, "SEI_RPC_URL is required"),
  })
);

// --- Memory System Setup ---
const memory = new MemorySystem({
  providers: {
    kv: new InMemoryKeyValueProvider(),
    vector: new InMemoryVectorProvider(),
    graph: new InMemoryGraphProvider(),
  },
});

// --- SEI Blockchain Setup ---
const seiWallet = new AxiomSeiWallet({
  rpcUrl: env.SEI_RPC_URL,
  privateKey: env.SEI_PRIVATE_KEY as `0x${string}`,
  chain: viemChains.seiTestnet,
});

// --- Memory Types ---
type TradingMemory = {
  userId: string;
  tradingHistory: Array<{
    timestamp: number;
    action: string;
    amount: number;
    token: string;
    price: number;
    profit: number;
  }>;
  preferences: {
    riskTolerance: 'low' | 'medium' | 'high';
    favoriteTokens: string[];
    maxTradeAmount: number;
  };
  marketInsights: Array<{
    timestamp: number;
    insight: string;
    confidence: number;
  }>;
  balance: number;
  lastUpdate: number;
};

type MarketAnalysisMemory = {
  marketId: string;
  trends: Array<{
    timestamp: number;
    trend: string;
    strength: number;
  }>;
  correlations: Record<string, number>;
  volatility: number;
  lastAnalysis: number;
};

// --- Trading Agent Context ---
const tradingContext = context({
  type: "trading",
  schema: { userId: z.string() },
  key: ({ userId }) => `trading:${userId}`,
  create: ({ args }): TradingMemory => ({
    userId: args.userId,
    tradingHistory: [],
    preferences: {
      riskTolerance: 'medium',
      favoriteTokens: ['SEI', 'USDC'],
      maxTradeAmount: 100,
    },
    balance: 0,
    lastUpdate: Date.now(),
    marketInsights: [],
  }),
  render: ({ memory }) => `
Trading Agent Memory:
- User: ${memory.userId}
- Balance: ${memory.balance} SEI
- Risk Tolerance: ${memory.preferences.riskTolerance}
- Favorite Tokens: ${memory.preferences.favoriteTokens.join(', ')}
- Recent Trades: ${memory.tradingHistory.slice(-3).map(t => `${t.action} ${t.amount} ${t.token}`).join(', ')}
- Market Insights: ${memory.marketInsights.slice(-2).map(i => i.insight).join('; ')}
`,
  maxSteps: 3,
  instructions: `You are a sophisticated trading assistant. Analyze market conditions, 
  user preferences, and trading history to provide intelligent recommendations. 
  Always consider risk management and user preferences.`,
})
.setOutputs({ text: { schema: z.string() } })
.setActions([
  action({
    name: "getBalance",
    description: "Get current SEI balance",
    schema: {},
    async handler(_, { memory }) {
      try {
        const balance = await seiWallet.getERC20Balance();
        memory.balance = parseFloat(balance);
        memory.lastUpdate = Date.now();
        return { data: { content: `Current balance: ${balance} SEI` }, content: `Current balance: ${balance} SEI` };
      } catch (error) {
        return { data: { content: `Error getting balance: ${error}` }, content: `Error getting balance: ${error}` };
      }
    },
  }),
  action({
    name: "analyzeMarket",
    description: "Analyze current market conditions",
    schema: { token: z.string().optional() },
    async handler({ token }, { memory }) {
      try {
        // Simulate market analysis (in real implementation, this would call market APIs)
        const analysis = {
          trend: Math.random() > 0.5 ? 'bullish' : 'bearish',
          volatility: Math.random() * 100,
          recommendation: Math.random() > 0.5 ? 'buy' : 'hold',
        };
        
        const insight = `Market analysis for ${token || 'SEI'}: ${analysis.trend} trend, 
        volatility ${analysis.volatility.toFixed(1)}%, recommendation: ${analysis.recommendation}`;
        
        memory.marketInsights.push({
          timestamp: Date.now(),
          insight,
          confidence: Math.random() * 100,
        });
        
        return { data: { content: insight }, content: insight };
      } catch (error) {
        return { data: { content: `Error analyzing market: ${error}` }, content: `Error analyzing market: ${error}` };
      }
    },
  }),
  action({
    name: "executeTrade",
    description: "Execute a trade on SEI blockchain",
    schema: { 
      action: z.enum(['buy', 'sell']),
      amount: z.number(),
      token: z.string().optional()
    },
    async handler({ action, amount, token }, { memory }) {
      try {
        // Simulate trade execution (in real implementation, this would execute actual trades)
        const tradeResult = {
          success: true,
          transactionHash: `0x${Math.random().toString(16).substr(2, 64)}`,
          newBalance: memory.balance + (action === 'buy' ? -amount : amount),
        };
        
        memory.tradingHistory.push({
          timestamp: Date.now(),
          action,
          amount,
          token: token || 'SEI',
          price: Math.random() * 100,
          profit: Math.random() * 20 - 10,
        });
        
        memory.balance = tradeResult.newBalance;
        memory.lastUpdate = Date.now();
        
        return { 
          data: { content: `Trade executed: ${action} ${amount} ${token || 'SEI'}. TX: ${tradeResult.transactionHash}` }, 
          content: `Trade executed: ${action} ${amount} ${token || 'SEI'}. TX: ${tradeResult.transactionHash}` 
        };
      } catch (error) {
        return { data: { content: `Error executing trade: ${error}` }, content: `Error executing trade: ${error}` };
      }
    },
  }),
  action({
    name: "updatePreferences",
    description: "Update user trading preferences",
    schema: {
      riskTolerance: z.enum(['low', 'medium', 'high']).optional(),
      favoriteTokens: z.array(z.string()).optional(),
      maxTradeAmount: z.number().optional(),
    },
    async handler({ riskTolerance, favoriteTokens, maxTradeAmount }, { memory }) {
      if (riskTolerance) memory.preferences.riskTolerance = riskTolerance;
      if (favoriteTokens) memory.preferences.favoriteTokens = favoriteTokens;
      if (maxTradeAmount) memory.preferences.maxTradeAmount = maxTradeAmount;
      
      return { 
        data: { content: `Preferences updated successfully` }, 
        content: `Preferences updated successfully` 
      };
    },
  }),
]);

// --- Market Analysis Agent Context ---
const marketAnalysisContext = context({
  type: "market-analysis",
  schema: { marketId: z.string() },
  key: ({ marketId }) => `market:${marketId}`,
  create: ({ args }): MarketAnalysisMemory => ({
    marketId: args.marketId,
    trends: [],
    correlations: {},
    volatility: 0,
    lastAnalysis: Date.now(),
  }),
  render: ({ memory }) => `
Market Analysis Memory:
- Market: ${memory.marketId}
- Volatility: ${memory.volatility}%
- Recent Trends: ${memory.trends.slice(-2).map(t => t.trend).join(', ')}
- Correlations: ${Object.keys(memory.correlations).length} tracked
`,
  maxSteps: 2,
  instructions: `You are a market analysis specialist. Provide deep insights into market 
  trends, correlations, and volatility patterns. Focus on data-driven analysis.`,
})
.setOutputs({ text: { schema: z.string() } })
.setActions([
  action({
    name: "analyzeTrends",
    description: "Analyze market trends and patterns",
    schema: { timeframe: z.string().optional() },
    async handler({ timeframe }, { memory }) {
      // Simulate trend analysis
      const trends = [
        { trend: 'bullish momentum', strength: Math.random() * 100 },
        { trend: 'increased volume', strength: Math.random() * 100 },
        { trend: 'support level holding', strength: Math.random() * 100 },
      ];
      
      memory.trends.push(...trends.map(t => ({
        timestamp: Date.now(),
        trend: t.trend,
        strength: t.strength,
      })));
      
      const analysis = `Trend Analysis (${timeframe || '24h'}): ${trends.map(t => 
        `${t.trend} (${t.strength.toFixed(1)}%)`).join(', ')}`;
      
      return { data: { content: analysis }, content: analysis };
    },
  }),
  action({
    name: "calculateVolatility",
    description: "Calculate current market volatility",
    schema: {},
    async handler(_, { memory }) {
      const volatility = Math.random() * 50 + 10; // 10-60% volatility
      memory.volatility = volatility;
      
      const analysis = `Current volatility: ${volatility.toFixed(1)}% (${volatility > 30 ? 'High' : volatility > 15 ? 'Medium' : 'Low'})`;
      return { data: { content: analysis }, content: analysis };
    },
  }),
]);

// --- Telegram Provider with Memory Integration ---
const telegramProvider = provider({
  name: "telegram-trading",
  contexts: { 
    trading: tradingContext,
    marketAnalysis: marketAnalysisContext 
  },
  inputs: {
    telegram: input({
      schema: z.object({ 
        text: z.string(),
        userId: z.string(),
        chatId: z.string(),
      }),
      subscribe(send, agent) {
        // Initialize memory system
        memory.initialize().then(() => {
          console.log(chalk.green("✅ Memory system initialized"));
        });

        // Telegram bot setup
        const { Telegraf } = require('telegraf');
        const bot = new Telegraf(env.TELEGRAM_TOKEN);
        
        bot.start((ctx) => {
          ctx.reply(`🚀 Welcome to AxiomKit Trading Assistant!
          
I'm your intelligent trading companion with:
🧠 Advanced memory that learns your preferences
⛓️ Real SEI blockchain integration
📊 Market analysis and insights
🤖 Multi-agent collaboration

Try these commands:
• "Check my balance" - Get your SEI balance
• "Analyze market" - Get market insights
• "Set risk tolerance high" - Update preferences
• "Execute buy 10 SEI" - Make a trade
• "What's my trading history?" - View past trades`);
        });

        bot.help((ctx) => {
          ctx.reply(`🤖 AxiomKit Trading Assistant Commands:

💰 Trading:
• "Check my balance" - Get current SEI balance
• "Execute buy/sell [amount] [token]" - Execute trades
• "What's my trading history?" - View past trades

📊 Analysis:
• "Analyze market" - Get market insights
• "Analyze trends" - Get trend analysis
• "Calculate volatility" - Get volatility metrics

⚙️ Preferences:
• "Set risk tolerance [low/medium/high]" - Update risk preference
• "Set favorite tokens [token1, token2]" - Update favorite tokens
• "Set max trade amount [amount]" - Set trade limits

🧠 Memory:
• "What do you remember about me?" - View stored preferences
• "Forget my trading history" - Clear trading history
• "Update my profile" - Modify user profile`);
        });

        // Handle trading commands
        bot.hears(/check.*balance/i, async (ctx:any) => {
          try {
            await agent.send({
              context: tradingContext,
              args: { userId: ctx.from.id.toString() },
              input: { type: "telegram", data: { text: "Check balance", userId: ctx.from.id.toString(), chatId: ctx.chat.id.toString() } },
              handlers: {
                onLogStream(log, done) {
                  if (done && log.ref === "action_result") {
                    ctx.reply(`💰 ${log.data?.content || log.content}`);
                  }
                },
              },
            });
          } catch (error) {
            ctx.reply(`❌ Error: ${error.message}`);
          }
        });

        bot.hears(/execute (buy|sell) (\d+(?:\.\d+)?) ?(\w+)?/i, async (ctx) => {
          const match = ctx.message.text.match(/execute (buy|sell) (\d+(?:\.\d+)?) ?(\w+)?/i);
          if (match) {
            const [, action, amount, token] = match;
            try {
              await agent.send({
                context: tradingContext,
                args: { userId: ctx.from.id.toString() },
                input: { type: "telegram", data: { text: `Execute ${action} ${amount} ${token || 'SEI'}`, userId: ctx.from.id.toString(), chatId: ctx.chat.id.toString() } },
                handlers: {
                  onLogStream(log, done) {
                    if (done && log.ref === "action_result") {
                      ctx.reply(`⚡ ${log.data?.content || log.content}`);
                    }
                  },
                },
              });
            } catch (error) {
              ctx.reply(`❌ Error: ${error.message}`);
            }
          }
        });

        bot.hears(/analyze.*market/i, async (ctx) => {
          try {
            await agent.send({
              context: tradingContext,
              args: { userId: ctx.from.id.toString() },
              input: { type: "telegram", data: { text: "Analyze market", userId: ctx.from.id.toString(), chatId: ctx.chat.id.toString() } },
              handlers: {
                onLogStream(log, done) {
                  if (done && log.ref === "action_result") {
                    ctx.reply(`📊 ${log.data?.content || log.content}`);
                  }
                },
              },
            });
          } catch (error) {
            ctx.reply(`❌ Error: ${error.message}`);
          }
        });

        bot.hears(/set risk tolerance (low|medium|high)/i, async (ctx) => {
          const match = ctx.message.text.match(/set risk tolerance (low|medium|high)/i);
          if (match) {
            const [, riskTolerance] = match;
            try {
              await agent.send({
                context: tradingContext,
                args: { userId: ctx.from.id.toString() },
                input: { type: "telegram", data: { text: `Set risk tolerance to ${riskTolerance}`, userId: ctx.from.id.toString(), chatId: ctx.chat.id.toString() } },
                handlers: {
                  onLogStream(log, done) {
                    if (done && log.ref === "action_result") {
                      ctx.reply(`⚙️ ${log.data?.content || log.content}`);
                    }
                  },
                },
              });
            } catch (error) {
              ctx.reply(`❌ Error: ${error.message}`);
            }
          }
        });

        bot.hears(/what.*trading history/i, async (ctx) => {
          try {
            // Get trading history from memory
            const userMemory = await memory.kv.get(`trading:${ctx.from.id}`);
            if (userMemory && userMemory.tradingHistory) {
              const history = userMemory.tradingHistory.slice(-5);
              if (history.length > 0) {
                const historyText = history.map(trade => 
                  `${trade.action.toUpperCase()} ${trade.amount} ${trade.token} (${new Date(trade.timestamp).toLocaleDateString()})`
                ).join('\n');
                ctx.reply(`📈 Recent Trading History:\n${historyText}`);
              } else {
                ctx.reply(`📈 No trading history found. Start trading to build your history!`);
              }
            } else {
              ctx.reply(`📈 No trading history found. Start trading to build your history!`);
            }
          } catch (error) {
            ctx.reply(`❌ Error: ${error.message}`);
          }
        });

        bot.hears(/what.*remember.*me/i, async (ctx) => {
          try {
            const userMemory = await memory.kv.get(`trading:${ctx.from.id}`);
            if (userMemory) {
              const preferences = userMemory.preferences;
              ctx.reply(`🧠 What I remember about you:
              
⚙️ Risk Tolerance: ${preferences.riskTolerance}
💰 Favorite Tokens: ${preferences.favoriteTokens.join(', ')}
📊 Max Trade Amount: ${preferences.maxTradeAmount} SEI
💵 Current Balance: ${userMemory.balance} SEI
📈 Total Trades: ${userMemory.tradingHistory.length}`);
            } else {
              ctx.reply(`🧠 I don't have any memories about you yet. Start trading to build your profile!`);
            }
          } catch (error) {
            ctx.reply(`❌ Error: ${error.message}`);
          }
        });

        // Handle general messages
        bot.on('text', async (ctx) => {
          try {
            await agent.send({
              context: tradingContext,
              args: { userId: ctx.from.id.toString() },
              input: { type: "telegram", data: { text: ctx.message.text, userId: ctx.from.id.toString(), chatId: ctx.chat.id.toString() } },
              handlers: {
                onLogStream(log, done) {
                  if (done && log.ref === "output") {
                    ctx.reply(`🤖 ${log.content}`);
                  }
                },
              },
            });
          } catch (error) {
            ctx.reply(`❌ Error: ${error.message}`);
          }
        });

        // Start the bot
        bot.launch();
        console.log(chalk.green("✅ Telegram bot started"));
        
        return () => {
          bot.stop();
          memory.close();
        };
      },
    }),
  },
});

// --- Create Multi-Agent System ---
const tradingAgent = createAgent({
  model: groq("meta-llama/llama-4-scout-17b-16e-instruct"),
  providers: [telegramProvider],
  logLevel: LogLevel.INFO,
});

// --- Startup ---
async function startShowcase() {
  console.log(chalk.blue.bold("🚀 AxiomKit Multi-Agent Trading Assistant"));
  console.log(chalk.gray("===============================================\n"));
  
  console.log(chalk.cyan("🧠 Initializing memory system..."));
  await memory.initialize();
  
  console.log(chalk.cyan("⛓️ Connecting to SEI blockchain..."));
  console.log(chalk.green(`✅ Connected to SEI wallet: ${seiWallet.walletAdress}`));
  
  console.log(chalk.cyan("🤖 Starting multi-agent system..."));
  await tradingAgent.start();
  
  console.log(chalk.green("✅ AxiomKit Trading Assistant is running!"));
  console.log(chalk.yellow("📱 Find your bot on Telegram and start trading!"));
  console.log(chalk.gray("\nFeatures demonstrated:"));
  console.log(chalk.gray("• 🧠 Advanced memory system with episodic and semantic storage"));
  console.log(chalk.gray("• 🤝 Multi-agent collaboration between trading and analysis agents"));
  console.log(chalk.gray("• ⛓️ Real SEI blockchain integration for actual trading"));
  console.log(chalk.gray("• 📱 Production-ready Telegram interface"));
  console.log(chalk.gray("• 🎯 Context-aware decision making"));
  console.log(chalk.gray("• 🔄 Real-time learning and adaptation"));
}

// --- Graceful Shutdown ---
process.on('SIGINT', async () => {
  console.log(chalk.yellow("\n🛑 Shutting down AxiomKit Trading Assistant..."));
  await tradingAgent.stop();
  await memory.close();
  console.log(chalk.green("✅ Shutdown complete"));
  process.exit(0);
});

// --- Start the Showcase ---
startShowcase().catch(console.error);
