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
      "https://api.anthropic.com/v1/messages",
      {
        method: "POST",
        headers: {
          "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: `${SYSTEM_PROMPT}\n\nArtifact type: ${artifactType}\nCloud: ${cloudInstructions[cloudStack]}`,
          messages: messages,
          stream: true,
        }),
      }
    );

    if (!response.ok) {
      const err = await response.json();
      onError(err.error?.message || "Generation failed");
      return;
    }

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value);
      const lines = chunk.split("\n")
        .filter(l => l.startsWith("data: "));
      
      for (const line of lines) {
        const data = line.slice(6).trim();
        if (data === "[DONE]") continue;
        try {
          const parsed = JSON.parse(data);
          if (parsed.type === "content_block_delta") {
            onDelta(parsed.delta?.text || "");
          }
        } catch {}
      }
    }
    onDone();
  } catch (e) {
    onError("Failed to generate artifact");
  }
}
```

---

## Then add your Claude API key

In GitHub repo → **Settings** → **Secrets and variables** → **Actions** → add:
```
VITE_ANTHROPIC_API_KEY = your_claude_api_key
```

Get your free Claude API key at:
```
console.anthropic.com
