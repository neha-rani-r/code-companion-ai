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

DBT ARTIFACT RULES — follow ALL of these exactly, no exceptions:

OUTPUT STRUCTURE — always produce exactly two labelled sections:

## schema.yml
\`\`\`yaml
version: 2

models:
  - name: <model_name>
    description: "<one sentence describing what this model represents>"
    config:
      tags: ["<domain>"]
    columns:
      - name: <primary_key_field>
        description: "<what this field represents>"
        tests:
          - not_null
          - unique
      - name: <foreign_key_field>
        description: "<what this field represents>"
        tests:
          - not_null
          - relationships:
              to: ref('<parent_model>')
              field: <parent_pk>
      - name: <status_or_type_field>
        description: "<what this field represents>"
        tests:
          - not_null
          - accepted_values:
              values: ["<val1>", "<val2>", "<val3>"]
      - name: <other_field>
        description: "<what this field represents>"
        tests:
          - not_null
\`\`\`

## model.sql
\`\`\`sql
{{ config(
    materialized='incremental',
    incremental_strategy='delete+insert',
    unique_key='<primary_key_field>',
    on_schema_change='append_new_columns',
    tags=['<domain>']
) }}

SELECT
    <primary_key_field>,
    <other_fields_derived_from_user_description>,
    updated_at
FROM {{ source('<schema>', '<source_table>') }}

{% if is_incremental() %}
-- Only process rows newer than the latest record already in this table
WHERE updated_at > (SELECT MAX(updated_at) FROM {{ this }})
{% endif %}
\`\`\`

FIELD NAMING RULES — this is critical:
- Derive ALL field names from the user's description
- NEVER use generic placeholders: id, name, date, value, field1, column1
- Examples of good field names: order_id, customer_email, shipped_at,
  product_sku, payment_status, invoice_total_usd, warehouse_region
- The SQL field names MUST exactly match the column names in schema.yml
- Choose a realistic primary key name (e.g. order_id, session_id, event_id)
- Add a timestamp field (created_at or updated_at) always` : "";

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
