const SYSTEM_PROMPT = `You are a senior data engineer 
with 10+ years experience. Generate production-ready 
code artifacts based on the user's description.

Always include:
- Proper error handling
- Idempotency checks  
- Inline comments
- Cloud-specific services as instructed

Format response as:
## Code
\`\`\`python or sql
[code here]
\`\`\`
## Why this approach
## Watch out for`;

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
  const cloudInstructions: Record<string, string> = {
    aws: "Use AWS: S3, Redshift, Glue, boto3, s3:// paths",
    gcp: "Use GCP: BigQuery, GCS, gs:// paths, google-cloud-bigquery",
    azure: "Use Azure: ADLS Gen2, Synapse, abfss://, azure-storage-blob",
  };

  try {
    const response = await fetch(
      import.meta.env.VITE_WORKER_URL,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          systemPrompt: `${SYSTEM_PROMPT}\n\nArtifact type: ${artifactType}\nCloud: ${cloudInstructions[cloudStack]}`,
          messages: messages,
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
