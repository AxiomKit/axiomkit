import { context } from "core/src";
import z from "zod";

interface UserTaskMemory {
  username: string;
  taskName: string;
  taskDescription: string;
  dateStart: string | null;
  dateEnd: string | null;
}

const todoContext = context({
  type: "todo-context",
  schema: z.object({
    username: z.string().describe("Unique Identifier for the user"), // This Only use for test
    message: z.string().describe("User Message"),
  }),
  create(params, agent): UserTaskMemory {
    return {
      username: params.args.username,
      taskName: "",
      taskDescription: "",
      dateEnd: null,
      dateStart: null,
    };
  },
  render: (state) => {
    return `
        Advance TodoTask Assitant
        User: ${state.args.username}
        taskName:
    `;
  },
  instructions: `
  You are a AI note support for builder. You will define user base on their username.

  You can static to know Statistics about:
  - Total Note
  - How the effective of they worked
  - 
  `,
});
