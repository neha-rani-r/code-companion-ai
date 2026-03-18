export async function streamArtifact({
  messages,
  artifactType,
  cloudStack,
  onDelta,
  onDone,
  onError,
}: {
  messages: { role: string; content: string }[];
  artifactType: string;
  cloudStack: string;
  onDelta: (text: string) => void;
  onDone: () => void;
  onError: (error: string) => void;
}) {
  try {
    const response = await fetch(
      import.meta.env.VITE_WORKER_URL,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          artifactType,
          cloudStack,
          messages,
        }),
      }
    );

    if (!response.ok) {
      const err = await response.json();
      onError(err.error?.message || "Generation failed");
      return;
    }

    const contentType = response.headers.get("content-type") || "";

    // Non-streaming fallback: full JSON with choices[0].message.content
    if (!contentType.includes("text/event-stream")) {
      try {
        const json = await response.json();
        const content = json?.choices?.[0]?.message?.content;
        if (content) {
          onDelta(content);
          onDone();
          return;
        }
      } catch {}
      onError("Unexpected response format");
      return;
    }

    // Streaming SSE: read chunks progressively
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const data = line.slice(6).trim();
        if (data === "[DONE]") continue;
        try {
          const parsed = JSON.parse(data);
          const delta = parsed?.choices?.[0]?.delta?.content;
          if (delta) onDelta(delta);
        } catch {}
      }
    }
    onDone();
  } catch (e) {
    onError("Failed to generate artifact");
  }
}
