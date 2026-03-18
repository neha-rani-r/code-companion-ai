export default {
  async fetch(request, env) {
    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, anthropic-version",
        },
      });
    }

    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    const { artifactType, cloudStack, messages: userMessages } = await request.json();

    const cloudInstructions = {
      aws: "Use AWS: S3, Redshift, Glue, boto3, s3:// paths",
      gcp: "Use GCP: BigQuery, GCS, gs:// paths, google-cloud-bigquery",
      azure: "Use Azure: ADLS Gen2, Synapse, abfss://, azure-storage-blob",
    };

    const basePrompt = env.SYSTEM_PROMPT ||
      `You are a senior data engineer with 10+ years experience. Generate production-ready code artifacts based on the user's description.

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

    const artifactRules = artifactType === "dbt" ? `

DBT ARTIFACT RULES — follow these exactly:

1. Always output TWO sections in a single response:
   - Section 1: schema.yml (YAML code block)
   - Section 2: the .sql model file (SQL code block)
   Label them clearly: "## schema.yml" and "## model.sql"

2. Use realistic field names derived from the user's description.
   Never use generic placeholders like id/name/date — infer real
   business fields (e.g. order_id, customer_email, shipped_at).

3. schema.yml must include:
   - not_null test on every key/required field
   - unique test on the primary key
   - accepted_values test wherever a status/type/category field appears
   - relationships test for any foreign key column
   - A meaningful description on the model and each column
   - tags: list reflecting the business domain (e.g. [finance, orders])

4. The SQL model must include:
   - {{ config(...) }} block with:
       materialized='incremental',
       incremental_strategy='delete+insert',
       unique_key='<primary_key>',
       on_schema_change='append_new_columns',
       tags=[<domain tags>]
   - A WHERE clause guard for incremental runs:
       {% if is_incremental() %}
         WHERE updated_at > (SELECT MAX(updated_at) FROM {{ this }})
       {% endif %}
   - Inline SQL comments explaining non-obvious logic
   - Real field names that match schema.yml exactly` : "";

    const systemPrompt = `${basePrompt}${artifactRules}\n\nArtifact type: ${artifactType}\nCloud: ${cloudInstructions[cloudStack] || cloudStack}`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...userMessages
        .map(({ role, content }) => ({ role, content }))
        .filter(({ content }) => content != null && content !== ""),
    ];

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages,
          max_tokens: 1000,
          stream: true,
        }),
      }
    );

    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, anthropic-version",
    };

    return new Response(response.body, {
      status: response.status,
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
      },
    });
  },
};
