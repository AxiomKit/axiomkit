/**
 * {{MODEL_NAME}} template for a Axiomkit agent
 * This template includes context for goals and tasks, and actions for managing them
 */
import { {{MODEL_IMPORT_FUNCTION}} } from "{{MODEL_IMPORT_PATH}}";
import {
    createAgent,
    context,
    render,
    action,
    validateEnv,
} from "@axiomkit/core";
import { createCliExtension } from "@axiomkit/cli";
import { string, z } from "zod/v4";

// Initialize {{MODEL_NAME}} client
const env = validateEnv(
    z.object({
        {{ENV_VAR_KEY}}: z.string().min(1, "{{ENV_VAR_KEY}} is required"),
    })
);

// Initialize {{MODEL_NAME}} client
const {{MODEL_VARIABLE}} = {{MODEL_IMPORT_FUNCTION}}({
    apiKey: env.{{ENV_VAR_KEY}}!,
});

const template = `
Goal: {{goal}} 
`;

interface TodoMemory {
  tasks: { id: string; title: string; done: boolean }[];
}
const addTask = action({
  name: "add-task",
  description: "Adds a new task to the todo list",
  schema: z.object({
    title: z.string().describe("What the task is"),
  }),
  handler: async ({ title }, ctx) => {
    // Access context memory (automatically typed!)
    const memory = ctx.memory as TodoMemory;

    // Initialize if needed
    if (!memory.tasks) {
      memory.tasks = [];
    }

    // Add new task
    const newTask = {
      id: crypto.randomUUID(),
      title,
      done: false,
    };

    memory.tasks.push(newTask);

    // Changes are automatically saved
    return {
      success: true,
      taskId: newTask.id,
      message: `Added "${title}" to your todo list`,
    };
  },
});

const completeTask = action({
  name: "complete-task",
  description: "Marks a task as completed",
  schema: z.object({
    taskId: z.string().describe("ID of task to complete"),
  }),
  handler: async ({ taskId }, ctx) => {
    const memory = ctx.memory as TodoMemory;

    const task = memory.tasks?.find((t) => t.id === taskId);
    if (!task) {
      return { success: false, message: "Task not found" };
    }
    task.done = true;
    return {
      success: true,
      message: `Completed "${task.title}"`,
    };
  },
});
export const deleteTask = action({
  name: "delete-task",
  description: "Deletes a task from the todo list",
  schema: z.object({
    taskId: z.string().describe("ID of the task to delete"),
  }),
  handler: async ({ taskId }, ctx) => {
    const memory = ctx.memory as TodoMemory;
    const before = memory.tasks.length;
    memory.tasks = memory.tasks.filter((t) => t.id !== taskId);
    const after = memory.tasks.length;

    if (before === after) {
      return { success: false, message: "Task not found." };
    }

    return { success: true, message: `Deleted task with ID ${taskId}.` };
  },
});
const cliExtension = createCliExtension({
  name: "goal-extension",
  instructions: `
You are a task management assistant.

When the user says "add task finish UI", respond with:
<action_call name="add-task">{"title": "finish UI"}</action_call>

When the user says "complete task with ID 123", respond with:
<action_call name="complete-task">{"taskId": "123"}</action_call>

When the user says "delete task 123", respond with:
<action_call name="delete-task">{"taskId": "123"}</action_call>

Always respond with action_call. Do not explain or chat unless asked.
  `,
});
export const todoContext = context({
  type: "todo",
  schema: z.object({
    id: z.string(),
  }),

  key({ id }) {
    return id; // unique context key
  },

  create(state) {
    return {
      id: state.args.id,
      memory: {
        tasks: [],
      },
    };
  },

  render({ memory }: { memory: TodoMemory }) {
    if (!memory.tasks || memory.tasks.length === 0) {
      return "Your todo list is currently empty.";
    }
    const list = memory.tasks
      .map(
        (task, i) =>
          `${i + 1}. [${task.done ? "x" : " "}] ${task.title} (ID: ${task.id})`
      )
      .join("\n");

    return render(`Your current tasks:\n${list}`);
  },
  maxSteps: 3,
});


createAgent({
    model: {{MODEL_VARIABLE}}("{{MODEL_VERSION}}"),
  extensions: [cliExtension],
  context: todoContext,
     actions: [addTask, completeTask, deleteTask],
}).start({ id: "todo-user" });
