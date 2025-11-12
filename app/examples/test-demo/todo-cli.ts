import { createGroq } from "@ai-sdk/groq";
import {
  createAgent,
  context,
  action,
  provider,
  input,
  validateEnv,
  randomUUIDv7,
  output,
} from "@axiomkit/core";
import { z } from "zod";

// ---------------- Console formatting helpers ----------------
function repeatChar(ch: string, count: number) {
  let s = "";
  for (let i = 0; i < count; i++) s += ch;
  return s;
}
function printBox(title: string, message: string) {
  const lines = (message || "").split("\n");
  let width = title.length;
  for (const l of lines) if (l.length > width) width = l.length;
  const top = "┌" + repeatChar("─", width + 2) + "┐";
  const mid = "├" + repeatChar("─", width + 2) + "┤";
  const bot = "└" + repeatChar("─", width + 2) + "┘";
  console.log(top);
  console.log("│ " + (title + repeatChar(" ", width - title.length)) + " │");
  console.log(mid);
  for (const l of lines) {
    console.log("│ " + (l + repeatChar(" ", width - l.length)) + " │");
  }
  console.log(bot);
}
function printInfo(title: string, message: string) {
  printBox(title, message);
}
function printSuccess(message: string) {
  printBox("Success", message);
}

function printError(message: string) {
  printBox("Error", message);
}
function printPlain(message: string) {
  if (!message) return;
  const lines = String(message).split("\n");
  for (const l of lines) console.log(l);
}

// ---------------- Pure helpers ----------------
function normalizeTitle(title: string) {
  return String(title || "").trim();
}
function isDuplicateInRun(
  title: string,
  calls: { name: string; data?: any }[]
) {
  const norm = normalizeTitle(title).toLowerCase();
  return calls.some((c) => {
    try {
      const d = (c as any).data;
      return (
        c.name === "add-task" &&
        d?.title &&
        normalizeTitle(d.title).toLowerCase() === norm
      );
    } catch {}
    return false;
  });
}
function taskExists(title: string, tasks: { title: string; done: boolean }[]) {
  const norm = normalizeTitle(title).toLowerCase();
  return tasks.some(
    (t) => !t.done && normalizeTitle(t.title).toLowerCase() === norm
  );
}
function extractContent(raw: string | any): string {
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.content === "string") return parsed.content;
    } catch {}
    return raw;
  }
  if (raw && typeof raw.content === "string") return raw.content;
  if (typeof raw === "object" && raw !== null) return JSON.stringify(raw);
  return String(raw || "");
}
function formatTaskListAsTable(
  tasks: { title: string; done: boolean; id: string }[]
): string {
  if (!tasks || tasks.length === 0) return "Your todo list is currently empty.";

  const rows: string[] = [];
  rows.push(
    "┌─────┬──────────┬─────────────────────────────────────────────┬──────────────────────────────────────┐"
  );
  rows.push(
    "│ #   │ Status   │ Title                                       │ ID                                   │"
  );
  rows.push(
    "├─────┼──────────┼─────────────────────────────────────────────┼──────────────────────────────────────┤"
  );

  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    const num = String(i + 1).padEnd(3);
    const status = task.done ? "✓ Done" : "○ Todo";
    const title =
      task.title.length > 43 ? task.title.substring(0, 40) + "..." : task.title;
    const id = task.id.length > 34 ? task.id.substring(0, 31) + "..." : task.id;
    rows.push(
      "│ " +
        num +
        " │ " +
        status.padEnd(8) +
        " │ " +
        title.padEnd(43) +
        " │ " +
        id.padEnd(34) +
        " │"
    );
  }

  rows.push(
    "└─────┴──────────┴─────────────────────────────────────────────┴──────────────────────────────────────┘"
  );
  return rows.join("\n");
}
function parseTaskListFromText(
  text: string
): { title: string; done: boolean; id: string }[] | null {
  const tasks: { title: string; done: boolean; id: string }[] = [];
  const lines = text.split("\n");
  const listRegex = /^\s*(\d+)\.\s*\[([ xX])\]\s+(.+?)\s+\(ID:\s*(.+?)\)\s*$/i;

  for (const line of lines) {
    const match = line.trim().match(listRegex);
    if (match) {
      tasks.push({
        title: match[3].trim(),
        done: match[2].toLowerCase() === "x",
        id: match[4].trim(),
      });
    }
  }

  return tasks.length > 0 ? tasks : null;
}

// Validate required env vars
const env = validateEnv(
  z.object({
    GROQ_API_KEY: z.string().min(1, "GROQ_API_KEY is required"),
  })
);

// Create Groq model factory
const groq = createGroq({ apiKey: env.GROQ_API_KEY! });

// ---- Types ----
interface TodoTask {
  id: string;
  title: string;
  done: boolean;
}
interface TodoMemory {
  tasks: TodoTask[];
}

// ---- Actions ----
const addTask = action({
  name: "add-task",
  description: "Adds a new task to the todo list",
  schema: z.object({
    title: z.string().describe("What the task is"),
  }),
  async handler({ title }, ctx) {
    const memory = ctx.memory as TodoMemory;
    const normalized = normalizeTitle(title);
    if (!normalized) return { success: false, message: "Title is required" };

    if (isDuplicateInRun(normalized, ctx.workingMemory.calls)) {
      return {
        success: false,
        message: 'Task "' + normalized + '" already added in this request',
      };
    }

    if (!memory.tasks) memory.tasks = [];
    if (taskExists(normalized, memory.tasks)) {
      return {
        success: false,
        message: 'Task "' + normalized + '" already exists',
      };
    }

    const newTask: TodoTask = {
      id: randomUUIDv7(),
      title: normalized,
      done: false,
    };
    memory.tasks.push(newTask);
    return {
      success: true,
      taskId: newTask.id,
      message: 'Added "' + normalized + '" to your todo list',
    };
  },
});

const completeTask = action({
  name: "complete-task",
  description: "Marks a task as completed",
  schema: z.object({ taskId: z.string().describe("ID of task to complete") }),
  async handler({ taskId }, ctx) {
    const memory = ctx.memory as TodoMemory;
    const task = memory.tasks?.find((t) => t.id === taskId);
    if (!task) return { success: false, message: "Task not found" };
    task.done = true;
    return { success: true, message: 'Completed "' + task.title + '"' };
  },
});

const deleteTask = action({
  name: "delete-task",
  description: "Deletes a task from the todo list",
  schema: z.object({ taskId: z.string().describe("ID of the task to delete") }),
  async handler({ taskId }, ctx) {
    const memory = ctx.memory as TodoMemory;
    const before = memory.tasks?.length ?? 0;
    memory.tasks = (memory.tasks ?? []).filter((t) => t.id !== taskId);
    const after = memory.tasks.length;
    if (before === after) return { success: false, message: "Task not found." };
    return { success: true, message: "Deleted task with ID " + taskId + "." };
  },
});

const showTasks = action({
  name: "show-tasks",
  description: "Shows the current todo list",
  schema: z.object({}),
  async handler(_args, ctx) {
    const memory = ctx.memory as TodoMemory;
    if (!memory.tasks || memory.tasks.length === 0) {
      return { success: true, message: "Your todo list is currently empty." };
    }
    const table = formatTaskListAsTable(memory.tasks);
    return { success: true, message: table };
  },
});

// ---------------- Instruction strings ----------------
const INSTR_HEADER = [
  "You are a task management assistant.",
  "Use action_call for task operations. Use message output for normal chat.",
  "Prefer structured actions. You may emit multiple action_call entries if the user asks to do multiple tasks in one message.",
  "When an action completes successfully, do NOT output a follow-up message unless the user explicitly asks a question.",
].join("\n");
const INSTR_EXAMPLES = [
  'When the user says "add task finish UI", respond with:\n<action_call name="add-task">{"title": "finish UI"}</action_call>',
  'When the user says "complete task with ID 123", respond with:\n<action_call name="complete-task">{"taskId": "123"}</action_call>',
  'When the user says "delete task 123", respond with:\n<action_call name="delete-task">{"taskId": "123"}</action_call>',
  'When the user asks to show or list tasks (e.g., "what is my current list", "list my todo", "show tasks"), respond with:\n<action_call name="show-tasks">{}</action_call>',
  'When the user says "add task build frontend and create banner", respond with TWO action calls (one per task):\n<action_call name="add-task">{"title": "build frontend"}</action_call>\n<action_call name="add-task">{"title": "create banner"}</action_call>',
  "For general questions or small talk, respond using the message output with plain text.",
  "Avoid duplicates: do not add the same task twice in one message.",
].join("\n\n");

// ---- Context ----
const todoContext = context({
  type: "todo",
  schema: z.object({ id: z.string() }),
  key({ id }) {
    return id;
  },
  async create() {
    return { tasks: [] } as TodoMemory;
  },
  instructions: ({ memory }) => {
    const tasks = memory?.tasks || [];
    const list =
      tasks.length === 0
        ? "Your todo list is currently empty."
        : tasks
            .map(
              (t, i) =>
                `${i + 1}. [${t.done ? "x" : " "}] ${t.title} (ID: ${t.id})`
            )
            .join("\n");
    return [INSTR_HEADER, "\nCurrent tasks:", list, "\n", INSTR_EXAMPLES];
  },
  // Allow multiple actions in a single run, with a safe cap to avoid loops
  shouldContinue: (ctx) =>
    ctx.workingMemory.calls.length < 5 &&
    ctx.workingMemory.outputs.length === 0,
  maxSteps: 5,
})
  .setActions([addTask, completeTask, deleteTask, showTasks])
  .setOutputs({
    message: output({
      description: "Send a message back to the user",
      schema: z.string(),
      handler: async (data) => ({ data }),
    }),
    text: output({
      description: "Alias for chat messages",
      schema: z.string(),
      handler: async (data) => ({ data }),
    }),
  });

// ---- Provider (CLI input bound to todo context) ----
const todoCliProvider = provider({
  name: "todo-cli",
  contexts: { todo: todoContext },
  inputs: {
    cli: input({
      schema: z.object({ text: z.string() }),
      subscribe(send, agent) {
        const rl = require("readline").createInterface({
          input: process.stdin,
          output: process.stdout,
        });
        const loop = () =>
          rl.question("> ", async (text: string) => {
            if (text.trim().toLowerCase() === "exit") {
              rl.close();
              return;
            }
            if (text.trim()) {
              try {
                // Track action results across all logs in this stream
                const actionResults = new Set<string>();
                await agent.send({
                  context: todoContext,
                  args: { id: "todo-user" },
                  input: { type: "cli", data: { text } },
                  handlers: {
                    onLogStream(log, done) {
                      if (!done) return;
                      if (log.ref === "action_result" && log.data?.message) {
                        const actionName = (log as any).name || "";
                        actionResults.add(actionName);
                        // For show-tasks, print a clean plain list without box
                        if (actionName === "show-tasks") {
                          printPlain(log.data.message);
                        } else {
                          printSuccess(log.data.message);
                        }
                      }
                      if (log.ref === "output") {
                        const content = extractContent(
                          log.content || log.data || ""
                        );
                        // Skip redundant confirmations after actions
                        if (
                          actionResults.size > 0 &&
                          /i've\s+(added|completed|deleted)|hello.*how.*can.*i.*assist/i.test(
                            content
                          )
                        )
                          return;

                        // Check for task list and format as table
                        const parsedTasks = parseTaskListFromText(content);
                        if (parsedTasks && parsedTasks.length > 0) {
                          printPlain(formatTaskListAsTable(parsedTasks));
                          // Show any additional text after the list
                          const afterList = content
                            .split("\n")
                            .filter((l) => !/^\s*\d+\.\s*\[[ xX]\]/.test(l))
                            .join("\n")
                            .trim();
                          if (afterList) printInfo("Assistant", afterList);
                        } else {
                          printPlain(content);
                        }
                      }
                    },
                  },
                });
              } catch (err: any) {
                printError(err?.message || String(err));
              }
            }
            loop();
          });
        printPlain(
          "Type a message to chat, or commands like 'add task finish UI', 'show tasks'. Type 'exit' to quit."
        );
        loop();
        return () => rl.close();
      },
    }),
  },
});

// ---- Agent ----
const todoAgent = createAgent({
  model: groq("qwen/qwen3-32b"),
  // logLevel: LogLevel.DISABLED,
  providers: [todoCliProvider],
});

async function main() {
  await todoAgent.start({
    id: "todo-cli-agent",
  });
  printSuccess("Todo agent started and ready");
}

main().catch((err) => {
  printError(err && err.message ? err.message : String(err));
  process.exit(1);
});
