"use client";

import { useState, useEffect } from "react";

import { Copy, Check, Terminal, RotateCcw, CheckCircle } from "lucide-react";

interface TerminalStep {
  type:
    | "command"
    | "output"
    | "progress"
    | "success"
    | "info"
    | "error"
    | "warning";
  content: string;
  delay: number;
  duration?: number;
  progress?: number;
  metadata?: {
    size?: string;
    time?: string;
    version?: string;
  };
}

const installationSteps: TerminalStep[] = [
  {
    type: "command",
    content: "npm install @axiomkit/core --save",
    delay: 1000,
    duration: 3000,
  },
  {
    type: "info",
    content: "📦 Resolving dependencies...",
    delay: 800,
  },
  {
    type: "progress",
    content: "⬇️  Downloading @axiomkit/core@1.2.0",
    delay: 600,
    progress: 15,
    metadata: { size: "2.1MB", time: "0.8s" },
  },
  {
    type: "progress",
    content: "⬇️  Downloading @axiomkit/memory@1.2.0",
    delay: 500,
    progress: 30,
    metadata: { size: "1.8MB", time: "0.6s" },
  },
  {
    type: "progress",
    content: "⬇️  Downloading @axiomkit/planner@1.2.0",
    delay: 450,
    progress: 45,
    metadata: { size: "1.5MB", time: "0.5s" },
  },
  {
    type: "progress",
    content: "🔧 Installing core modules",
    delay: 700,
    progress: 60,
  },
  {
    type: "progress",
    content: "🧠 Configuring memory systems",
    delay: 650,
    progress: 75,
  },
  {
    type: "progress",
    content: "🤝 Setting up multi-agent support",
    delay: 600,
    progress: 85,
  },
  {
    type: "warning",
    content: "⚠️  Peer dependency @types/node@^18.0.0 not found",
    delay: 400,
  },
  {
    type: "info",
    content: "💡 Installing recommended peer dependencies...",
    delay: 300,
  },
  {
    type: "progress",
    content: "🛡️  Installing security layers",
    delay: 550,
    progress: 95,
  },
  {
    type: "output",
    content: "+ @axiomkit/core@1.2.0",
    delay: 400,
  },
  {
    type: "output",
    content: "+ @axiomkit/memory@1.2.0",
    delay: 200,
  },
  {
    type: "output",
    content: "+ @axiomkit/planner@1.2.0",
    delay: 200,
  },
  {
    type: "output",
    content: "+ @types/node@18.17.0",
    delay: 200,
  },
  {
    type: "output",
    content: "added 47 packages from 23 contributors",
    delay: 300,
    metadata: { time: "3.2s", size: "12.4MB" },
  },
  {
    type: "success",
    content: "✅ @axiomkit/core installed successfully!",
    delay: 600,
  },
  {
    type: "info",
    content: "🚀 Ready to build intelligent agents!",
    delay: 800,
  },
  {
    type: "info",
    content: "📚 Run 'axiomkit init' to create your first agent",
    delay: 500,
  },
  {
    type: "info",
    content: "🔗 Documentation: https://axiomkit.dev/docs",
    delay: 400,
  },
];

export function AutomatedTerminal() {
  const [currentStep, setCurrentStep] = useState(-1);
  const [isRunning, setIsRunning] = useState(false);
  const [displayedText, setDisplayedText] = useState("");
  const [copied, setCopied] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [showStats, setShowStats] = useState(false);
  const [cycleCount, setCycleCount] = useState(0);

  const startAnimation = () => {
    setIsRunning(true);
    setCurrentStep(-1);
    setCompletedSteps([]);
    setDisplayedText("");
    setCurrentProgress(0);
    setShowStats(false);

    let stepIndex = 0;
    const runStep = () => {
      if (stepIndex >= installationSteps.length) {
        setIsRunning(false);
        setShowStats(true);
        // Auto-restart after 5 seconds
        setTimeout(() => {
          setCycleCount((prev) => prev + 1);
          startAnimation();
        }, 5000);
        return;
      }

      const step = installationSteps[stepIndex];
      setCurrentStep(stepIndex);

      if (step.progress) {
        setCurrentProgress(step.progress);
      }

      if (step.type === "command" && step.duration) {
        // Animate typing for commands
        let charIndex = 0;
        const typeInterval = setInterval(() => {
          if (charIndex <= step.content.length) {
            setDisplayedText(step.content.slice(0, charIndex));
            charIndex++;
          } else {
            clearInterval(typeInterval);
            setCompletedSteps((prev) => [...prev, step.content]);
            setTimeout(() => {
              stepIndex++;
              runStep();
            }, step.delay);
          }
        }, step.duration / step.content.length);
      } else {
        // Instant display for other types
        setCompletedSteps((prev) => [...prev, step.content]);
        setTimeout(() => {
          stepIndex++;
          runStep();
        }, step.delay);
      }
    };

    setTimeout(runStep, 500);
  };

  const resetAnimation = () => {
    setIsRunning(false);
    setCurrentStep(-1);
    setCompletedSteps([]);
    setDisplayedText("");
    setCurrentProgress(0);
    setShowStats(false);
    setCycleCount(0);
  };

  // Auto-start animation on component mount
  useEffect(() => {
    const timer = setTimeout(() => {
      startAnimation();
    }, 1000); // Start after 1 second

    return () => clearTimeout(timer);
  }, []);

  const copyCommand = async () => {
    await navigator.clipboard.writeText("npm install @axiomkit/core --save");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStepIcon = (type: string) => {
    switch (type) {
      case "command":
        return "❯";
      case "progress":
        return "⏳";
      case "success":
        return "✅";
      case "info":
        return "ℹ️";
      case "output":
        return "📄";
      case "error":
        return "❌";
      case "warning":
        return "⚠️";
      default:
        return "•";
    }
  };

  const getStepColor = (type: string) => {
    switch (type) {
      case "command":
        return "text-blue-400";
      case "progress":
        return "text-yellow-400";
      case "success":
        return "text-green-400";
      case "info":
        return "text-cyan-400";
      case "output":
        return "text-slate-300";
      case "error":
        return "text-red-400";
      case "warning":
        return "text-orange-400";
      default:
        return "text-slate-400";
    }
  };

  return (
    <div className="bg-slate-900 border-slate-700 overflow-hidden shadow-2xl">
      {/* Terminal Header */}
      <div className="bg-slate-800 px-4 py-3 flex items-center justify-between border-b border-slate-700">
        <div className="flex items-center space-x-3">
          <div className="flex space-x-1.5">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          </div>
          <Terminal className="h-4 w-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-300 font-mono">
            axiomkit@terminal
          </span>
          {cycleCount > 0 && (
            <span className="text-xs text-slate-500 font-mono">
              cycle #{cycleCount + 1}
            </span>
          )}
        </div>

        <div className="flex items-center space-x-3">
          {/* Progress Bar */}
          {isRunning && currentProgress > 0 && (
            <div className="flex items-center space-x-2">
              <div className="w-32 h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-red-400 to-red-800 transition-all duration-300 ease-out"
                  style={{ width: `${currentProgress}%` }}
                />
              </div>
              <span className="text-xs text-slate-400 font-mono">
                {currentProgress}%
              </span>
            </div>
          )}

          {/* Copy Button */}
          <button
            onClick={copyCommand}
            className="btn-ghost  h-7 px-2 text-xs text-slate-400 hover:text-white hover:bg-slate-700"
          >
            {copied ? (
              <Check className="h-3 w-3" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </button>
        </div>
      </div>

      {/* Terminal Content */}
      <div className="p-0 bg-slate-950 font-mono text-sm">
        <div className="p-4 min-h-[400px] max-h-[400px] overflow-y-auto space-y-1">
          {/* Show completed steps */}
          {completedSteps.map((step, index) => {
            const stepData = installationSteps[index];
            return (
              <div
                key={index}
                className={`flex items-start space-x-2 ${getStepColor(stepData?.type || "output")}`}
              >
                <span className="text-slate-500 select-none min-w-[16px] flex-shrink-0">
                  {stepData?.type === "command"
                    ? "❯"
                    : getStepIcon(stepData?.type || "output")}
                </span>
                <div className="flex-1">
                  <span className="break-all">{step}</span>
                  {stepData?.metadata && (
                    <div className="text-xs text-slate-500 mt-1 ml-4">
                      {stepData.metadata.size &&
                        `Size: ${stepData.metadata.size}`}
                      {stepData.metadata.time &&
                        ` • Time: ${stepData.metadata.time}`}
                      {stepData.metadata.version &&
                        ` • Version: ${stepData.metadata.version}`}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Show currently typing command */}
          {currentStep === 0 && displayedText && (
            <div className="flex items-start space-x-2 text-blue-400">
              <span className="text-slate-500 select-none min-w-[16px] flex-shrink-0">
                ❯
              </span>
              <span className="flex-1">
                {displayedText}
                <span className="animate-pulse">|</span>
              </span>
            </div>
          )}

          {/* Show cursor when idle */}
          {!isRunning && completedSteps.length === 0 && (
            <div className="flex items-start space-x-2 text-slate-400">
              <span className="text-slate-500 select-none min-w-[16px] flex-shrink-0">
                ❯
              </span>
              <span className="animate-pulse">|</span>
            </div>
          )}

          {/* Installation Stats */}
          {showStats && (
            <div className="mt-4 p-3 bg-slate-800/50 rounded border border-slate-700">
              <div className="text-green-400 text-xs font-semibold mb-2">
                📊 Installation Summary
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
                <div>Packages: 47</div>
                <div>Size: 12.4MB</div>
                <div>Time: 3.2s</div>
                <div>Contributors: 23</div>
              </div>
            </div>
          )}
        </div>

        {/* Terminal Footer */}
        <div className="p-4 border-t border-slate-700 bg-slate-900/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 text-slate-400">
                <div
                  className={`w-2 h-2 rounded-full ${isRunning ? "bg-green-400 animate-pulse" : "bg-slate-600"}`}
                />
                <span className="text-sm font-mono">
                  {isRunning
                    ? "Installing..."
                    : showStats
                      ? "Complete"
                      : "Ready"}
                </span>
              </div>

              <button
                onClick={resetAnimation}
                disabled={isRunning}
                className="inline-flex items-center border-slate-600 text-slate-300 hover:bg-slate-800 bg-transparent"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </button>
            </div>

            {showStats && (
              <div className="flex items-center space-x-2 text-green-400">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Auto-restarting...</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
