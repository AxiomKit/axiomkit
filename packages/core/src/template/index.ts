import { formatWorkingMemory } from "../context";
import {
  formatAction,
  formatContextLog,
  formatContextState,
  formatOutputInterface,
  render,
  xml,
} from "../utils/formatters";

import type {
  AnyAction,
  AnyContext,
  ContextState,
  Output,
  WorkingMemory,
} from "../types";

export const templateSections = {
  intro: `\
  You are tasked with analyzing inputs, formulating outputs, and initiating actions based on the given contexts. 
  You will be provided with a set of available actions, outputs, and contexts. 
  Your instructions are to analyze the situation and respond appropriately.`,
  instructions: `\
Follow these steps to process the updates:

1. Analyze the updates and available data:
   Wrap your reasoning process in <reasoning> tags. Consider:

   - Check the available data to avoid redundant action calls
   - The availabe contexts and their state
   - The available actions and their asynchronous nature
   - The content of the new updates
   - Potential dependencies between actions

   Response determination guidelines:

   a) First check if required state exists in the available contexts
   b) Respond to direct questions or requests for information

2. Plan actions:
   Before formulating a response, consider:
   - What data is already available
   - Which actions need to be initiated
   - The order of dependencies between actions
   - How to handle potential action failures
   - What information to provide while actions are processing

3. Formulate a output (if needed):
   If you decide to respond to the message, use <output> tags to enclose your output.
   Consider:

   - Using available data when possible
   - Acknowledging that certain information may not be immediately available
   - Setting appropriate expectations about action processing time
   - Indicating what will happen after actions complete
   - You can only use outputs listed in the <available_outputs> section
   - Follow the schemas provided for each output
  
4. Initiate actions (if needed):
   Use <action_call> tags to initiate actions. Remember:

   - Actions are processed asynchronously after your response
   - Results will not be immediately available
   - You can only use actions listed in the <available_actions> section
   - Follow the schemas provided for each action
   - Actions should be used when necessary to fulfill requests or provide information that cannot be conveyed through a simple response
   - If action belongs to a context and there is many instances of the context use <action_call contextKey="[Context key]">

5. No output or action:
   If you determine that no output or action is necessary, don't respond to that message.`,
  /*
   */
  /*

Configuration: Access pre-defined configuration values using {{config.key.name}} (e.g., {{config.default_user_id}}). (Assumption: Configuration is structured)

 (e.g., {{shortTermMemory.current_project_file}}).

*/
  content: `\
Here are the available actions you can initiate:
{{actions}}

Here are the available outputs you can use (full details):
{{outputs}}

Here is the current contexts:
{{contexts}}

Here is a summary of the available output types you can use:
{{output_types_summary}}

<template-engine>
Purpose: Utilize the template engine ({{...}} syntax) primarily to streamline workflows by transferring data between different components within the same turn. This includes passing outputs from actions into subsequent action arguments, or embedding data from various sources directly into response outputs. This enhances efficiency and reduces interaction latency.

Data Referencing: You can reference data from:
Action Results: Use {{calls[index].path.to.value}} to access outputs from preceding actions in the current turn (e.g., {{calls[0].sandboxId}}). Ensure the index correctly points to the intended action call.
Short-Term Memory: Retrieve values stored in short-term memory using {{shortTermMemory.key}}

When to Use:
Data Injection: Apply templating when an action argument or a response output requires specific data (like an ID, filename, status, or content) from an action result, configuration, or short-term memory available within the current turn.
Direct Dependencies: Particularly useful when an action requires a specific result from an action called immediately before it in the same turn.
</template-engine>

Here is the current working memory:
{{workingMemory}}

Now, analyze the following updates:
{{updates}}`,
  response: `\
Here's how you structure your response:
<response>
<reasoning>
[Your reasoning of the context, think, messages, and planned actions]
</reasoning>

[List of async action calls to be initiated, if applicable]
<action_call name="[Action name]">[action arguments using the schema and format]</action_call>

[List of outputs, if applicable]
<output type="[Output type]" {...output attributes using the attributes_schema}>
[output content using the content_schema]
</output>
</response>

IMPORTANT ACTION CALL FORMAT:
- Use XML format with name as attribute: <action_call name="actionName">{"arg": "value"}</action_call>
- DO NOT use function calling format: {"name": "actionName", "arguments": {...}}
- The action name goes in the XML attribute, not in the JSON content

Examples:
<action_call name="search">{"query": "AI news", "limit": 10}</action_call>
<action_call name="sendMessage">{"recipient": "user", "content": "Hello"}</action_call>`,

  footer: `\
Remember:
- Always correlate results with their original actions using callId
- Never repeat your outputs
- Consider the complete chain of events when formulating responses
- Address any failures or unexpected results explicitly
- Initiate follow-up actions only when necessary
- Provide clear, actionable insights based on the combined results
- Maintain context awareness between original request and final results

CRITICAL FORMATTING RULES: 
- Action calls: <action_call name="actionName">{"arguments": "here"}</action_call>
- Output calls: <output type="outputType">content here</output>
- DO NOT use function calling format like {"name": "action", "arguments": {...}}
- The action name MUST be in the XML attribute, NOT in the JSON content
- If you say you will perform an action, you MUST issue the corresponding action call
`,
} as const;

export const promptTemplate = `\
{{intro}}

{{instructions}}

{{content}}

{{response}}

{{footer}}
`;

export function formatPromptSections({
  contexts,
  outputs,
  actions,
  workingMemory,
  maxWorkingMemorySize,
  chainOfThoughtSize,
}: {
  contexts: ContextState<AnyContext>[];
  outputs: Output[];
  actions: AnyAction[];
  workingMemory: WorkingMemory;
  maxWorkingMemorySize?: number;
  chainOfThoughtSize?: number;
}) {
  // Create a simple list of output types
  const outputTypesSummary =
    outputs.length > 0
      ? xml(
          "output_types_summary",
          undefined,
          outputs.map((o) => `- ${o.type}`).join("\\n")
        )
      : xml(
          "output_types_summary",
          undefined,
          "No outputs are currently available."
        );

  return {
    actions: xml("available-actions", undefined, actions.map(formatAction)),
    outputs: xml(
      "available-outputs",
      undefined,
      outputs.map(formatOutputInterface)
    ),
    output_types_summary: outputTypesSummary,
    contexts: xml("contexts", undefined, contexts.map(formatContextState)),
    workingMemory: xml(
      "working-memory",
      undefined,
      formatWorkingMemory({
        memory: workingMemory,
        size: maxWorkingMemorySize,
        processed: true,
      })
    ),
    thoughts: xml(
      "thoughts",
      undefined,
      workingMemory.thoughts
        .map((log) => formatContextLog(log))
        .slice(-(chainOfThoughtSize ?? 5))
    ),
    updates: xml(
      "updates",
      undefined,
      formatWorkingMemory({
        memory: workingMemory,
        processed: false,
      })
    ),
  };
}

// WIP
export const mainPrompt = {
  name: "main",
  template: promptTemplate,
  sections: templateSections,
  render: (data: ReturnType<typeof formatPromptSections>) => {
    const sections = Object.fromEntries(
      Object.entries(mainPrompt.sections).map(([key, templateSection]) => [
        key,
        render(templateSection, data as any),
      ])
    ) as Record<keyof typeof templateSections, string>;
    return render(mainPrompt.template, sections);
  },
  formatter: formatPromptSections,
} as const;

export type PromptConfig = typeof mainPrompt;
