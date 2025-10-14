import * as z from "zod/v4";
import { context } from "@axiomkit/core";
import { service } from "@axiomkit/core";
import { Telegraf } from "telegraf";
import type { Chat } from "@telegraf/types";
import { provider, input, output, splitTextIntoChunks } from "@axiomkit/core";

const telegramService = service({
  register(container) {
    container.singleton(
      "telegraf",
      () => new Telegraf(process.env.TELEGRAM_TOKEN!)
    );
  },
  async boot(container) {
    const telegraf = container.resolve<Telegraf>("telegraf");
    console.log("starting..");
    telegraf.launch({ dropPendingUpdates: true });
    const telegrafInfo = await telegraf.telegram.getMe();
    console.log(telegrafInfo);
  },
});

const telegramChat = context({
  type: "telegram:chat",
  key: ({ chatId }) => chatId.toString(),
  schema: { chatId: z.number() },
  async setup(args, settings, { container }) {
    const telegraf = container.resolve<Telegraf>("telegraf");
    const chat: Chat = await telegraf.telegram.getChat(args.chatId);
    return {
      chat,
    };
  },
  description({ options: { chat } }) {
    if (chat.type === "private") {
      return `You are in private telegram chat with ${chat.username} id: ${chat.id}`;
    }
    return "";
  },
  inputs: {
    "telegram:message": input({
      schema: {
        user: z.object({ id: z.number(), username: z.string() }),
        text: z.string(),
      },
      format({ data: { user, text } }) {
        return {
          tag: "input",
          params: {
            type: "telegram:message",
            userId: user.id.toString(),
            username: user.username,
          },
          children: text,
        };
      },
      subscribe(send, { container }) {
        const tg = container.resolve<Telegraf>("telegraf");
        tg.on("message", (ctx) => {
          const chat = ctx.chat;
          const user = ctx.msg.from;

          if ("text" in ctx.message) {
            send(
              telegramChat,
              { chatId: chat.id },
              {
                user: {
                  id: user.id,
                  username: user.username!,
                },
                text: ctx.message.text,
              }
            );
          }
        });

        return () => {};
      },
    }),
  },
  outputs: {
    "telegram:message": output({
      attributes: {
        userId: z
          .string()
          .describe("the userId to send the message to, you must include this"),
      },
      schema: z
        .object({
          content: z
            .string()
            .describe(
              "the content of the message to send using markdown format"
            ),
        })
        .or(z.string())
        .describe('Preferred: {"content": "..."}. Back-compat: plain string.'),
      description: "use this to send a telegram message to user",
      examples: [
        `<output name="telegram:message" userId="123456789">{"content":"Hello! How can I assist you today?"}</output>`,
      ],
      handler: async (data: any, ctx, { container }) => {
        const tg = container.resolve<Telegraf>("telegraf").telegram;

        // const extractTextContent = (raw: unknown): string => {
        //   if (raw && typeof raw === "object" && "content" in (raw as any)) {
        //     const c = (raw as any).content;
        //     if (typeof c === "string") return c;
        //   }
        //   if (typeof raw === "string") {
        //     const trimmed = raw.trim();
        //     if (
        //       (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
        //       (trimmed.startsWith("[") && trimmed.endsWith("]"))
        //     ) {
        //       try {
        //         const parsed = JSON.parse(trimmed);
        //         if (
        //           parsed &&
        //           typeof parsed === "object" &&
        //           "content" in parsed &&
        //           typeof (parsed as any).content === "string"
        //         ) {
        //           return (parsed as any).content as string;
        //         }
        //       } catch {
        //         // ignore
        //       }
        //     }
        //     return raw;
        //   }
        //   return String(raw ?? "");
        // };

        // const text = extractTextContent(data.content);
        const text = data.content;
        const userIdParam = ctx.outputRef.params?.userId;
        const fallbackChatId = (ctx.options as any)?.chat?.id;
        const chatId =
          userIdParam ??
          (fallbackChatId != null ? String(fallbackChatId) : undefined);

        if (!chatId || String(chatId).trim() === "") {
          console.error(
            "telegram:message missing userId and no fallback chat id available"
          );
          return { data, timestamp: Date.now(), processed: true } as any;
        }

        const chunks = splitTextIntoChunks(text, {
          maxChunkSize: 4096,
        });

        for (const chunk of chunks) {
          await tg.sendMessage(chatId, chunk, {
            parse_mode: "Markdown",
          });
        }

        return {
          data,
          timestamp: Date.now(),
        };
      },
    }),
  },
});

export const telegram = provider({
  name: "telegram",
  contexts: {
    chat: telegramChat,
  },
  services: [telegramService],
});
