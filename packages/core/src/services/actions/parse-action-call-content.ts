import type { ActionCall, AnyAction } from "@/types";
import { parseJSONContent, parseXMLContent } from "@/utils";
import { ParsingError } from "@/types";
/**
 *
 * @param param0 call - The action call object containing the content to be parsed.
 * @param param1 action - The action definition which may include a parser or schema.
 * @returns data - The parsed content, which can be of any type depending on the action's parser or schema.
 * @throws ParsingError - If parsing fails, a ParsingError is thrown with details about the call and the original error.
 */
export function parseActionCallContent({
  call,
  action,
}: {
  call: ActionCall;
  action: AnyAction;
}) {
  try {
    const content = call.content.trim();

    let data: unknown;

    if (action.parser) {
      data = action.parser(call);
    } else if (action.schema && action.schema?._def?.typeName !== "ZodString") {
      if (action.callFormat === "xml") {
        data = parseXMLContent(content);
      } else {
        data = parseJSONContent(content);
      }
    } else {
      data = content;
    }

    return data;
  } catch (error) {
    throw new ParsingError(call, error);
  }
}
