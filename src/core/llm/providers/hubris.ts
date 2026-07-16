import type { LLMClient, LLMMessage, LLMResponse, ToolDefinition, StreamCallback } from "../types.js";

/**
 * Simple Hubris LLM client (OpenAI-compatible API)
 * Works from Russia with ruble payments
 * https://hubris.pw
 */
export function createHubrisClient(apiKey: string, model: string): LLMClient {
  const baseUrl = "https://api.hubris.pw/v1";

  return {
    async complete(messages: LLMMessage[], tools?: ToolDefinition[], streamCb?: StreamCallback): Promise<LLMResponse> {
      const payload: Record<string, unknown> = {
        model,
        messages: messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        temperature: 0.7,
        max_tokens: 2000,
      };

      if (tools?.length) {
        payload.tools = tools.map((t) => ({
          type: "function",
          function: {
            name: t.name,
            description: t.description,
            parameters: {
              type: "object",
              properties: Object.fromEntries(
                t.parameters.map((p) => [
                  p.name,
                  {
                    type: p.type,
                    description: p.description,
                  },
                ])
              ),
              required: t.parameters.filter((p) => p.required).map((p) => p.name),
            },
          },
        }));
      }

      if (streamCb) {
        payload.stream = true;

        const response = await fetch(`${baseUrl}/chat/completions`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`Hubris API error ${response.status}: ${error}`);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response body");

        let content = "";
        let toolCalls: Array<{ name: string; arguments: string }> = [];

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = new TextDecoder().decode(value);
            const lines = chunk.split("\n");

            for (const line of lines) {
              if (!line.startsWith("data: ")) continue;
              const data = line.slice(6);
              if (data === "[DONE]") continue;

              try {
                const json = JSON.parse(data);
                const delta = json.choices?.[0]?.delta;
                if (delta?.content) {
                  content += delta.content;
                  streamCb({ type: "text_chunk", chunk: delta.content });
                }
                if (delta?.tool_calls) {
                  for (const tool of delta.tool_calls) {
                    toolCalls.push({
                      name: tool.function.name,
                      arguments: tool.function.arguments,
                    });
                  }
                }
              } catch {
                // Ignore parse errors
              }
            }
          }
        } finally {
          reader.releaseLock();
        }

        return {
          text: content,
          toolCalls: toolCalls.length
            ? toolCalls.map((tc) => ({
                name: tc.name,
                parameters: JSON.parse(tc.arguments),
              }))
            : undefined,
          stopReason: "end_turn",
        };
      } else {
        // Non-streaming request
        const response = await fetch(`${baseUrl}/chat/completions`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`Hubris API error ${response.status}: ${error}`);
        }

        const data = (await response.json()) as Record<string, unknown>;
        const message = (data.choices as Array<{ message: Record<string, unknown> }>)?.[0]?.message;

        return {
          text: (message?.content as string) || "",
          toolCalls: undefined,
          stopReason: "end_turn",
        };
      }
    },
  };
}
