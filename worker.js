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

DBT ARTIFACT RULES — you MUST always output BOTH sections. Never output only one.

CRITICAL: Every response must contain SECTION 1 followed immediately by SECTION 2.
If you output schema.yml without the SQL model, your response is incomplete and wrong.

---

SECTION 1 — always output this first:

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
      - name: updated_at
        description: "Timestamp when this record was last updated"
        tests:
          - not_null
\`\`\`

SECTION 2 — always output this immediately after Section 1:

## model.sql
\`\`\`sql
{{ config(
    materialized='incremental',
    unique_key='<primary_key_field>',
    incremental_strategy='delete+insert',
    on_schema_change='append_new_columns',
    tags=['<domain>']
) }}

WITH source AS (
    SELECT
        <primary_key_field>,
        <all_other_fields_from_user_description>,
        updated_at
    FROM {{ source('<schema>', '<source_table>') }}
    {% if is_incremental() %}
    WHERE updated_at > (SELECT MAX(updated_at) FROM {{ this }})
    {% endif %}
)

SELECT * FROM source
\`\`\`

FIELD NAMING RULES — critical:
- Derive ALL field names directly from the user's description
- NEVER use generic placeholders: id, name, date, value, field1, column1
- Good examples: order_id, customer_email, shipped_at, product_sku,
  payment_status, invoice_total_usd, warehouse_region, subscription_tier
- Field names in the SQL must exactly match column names in schema.yml
- Always include updated_at as the incremental timestamp field` : "";

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
