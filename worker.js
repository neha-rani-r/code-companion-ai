export default {
  async fetch(request, env) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, anthropic-version",
    };

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== "POST") {
      return new Response("Method not allowed", {
        status: 405,
        headers: corsHeaders,
      });
    }

    let artifactType, cloudStack, userMessages;
    try {
      ({ artifactType, cloudStack, messages: userMessages } = await request.json());
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const cloudInstructions = {
      aws: `MANDATORY: Use ONLY AWS services. Cloud provider is AWS.
    - Storage: S3 with s3:// paths, boto3
    - Warehouse: Redshift, RedshiftOperator, S3ToRedshiftOperator
    - ETL: AWS Glue, GlueJobOperator
    - Auth: IAM roles, aws_conn_id
    - Airflow operators: S3Hook, RedshiftSQLOperator, S3ToRedshiftOperator
    - NEVER use GCS, gs://, BigQuery, BigQueryOperator, ADLS, abfss://, Synapse or any Azure/GCP service`,
      gcp: `MANDATORY: Use ONLY GCP services. Cloud provider is GCP.
    - Storage: GCS with gs:// paths, google-cloud-storage
    - Warehouse: BigQuery, BigQueryOperator, BigQueryInsertJobOperator
    - Transfer: GCSToBigQueryOperator, GCSToGCSOperator
    - Auth: service account JSON, gcp_conn_id, google-auth-library
    - Python: google-cloud-bigquery, google-cloud-storage
    - NEVER use S3, s3://, Redshift, boto3, ADLS, abfss://, Synapse or any AWS/Azure service`,
      azure: `MANDATORY: Use ONLY Azure services. Cloud provider is Azure.
    - Storage: ADLS Gen2 with abfss:// paths, azure-storage-blob, DataLakeServiceClient
    - Warehouse: Synapse Analytics, AzureSynapseOperator
    - SDK: azure-storage-blob, azure-identity, DefaultAzureCredential
    - Auth: managed identity, service principal, azure_conn_id
    - NEVER use S3, s3://, GCS, gs://, Redshift, BigQuery, boto3 or any AWS/GCP service`,
    };

    const basePrompt = env.SYSTEM_PROMPT ||
      `You are a senior data engineer with 10+ years experience. Generate production-ready code artifacts.

Rules:
- Use ONLY the cloud services specified — no mixing cloud providers
- Use realistic field names from the user's description, never generic id/name/date
- Include proper error handling, retries, and logging
- Include idempotency — operations must be safe to re-run
- Add inline comments explaining non-obvious logic
- No placeholder values in final code — infer everything from the description`;

    const artifactRules = artifactType === "dbt" ? `

CRITICAL FOR DBT — TWO SECTIONS REQUIRED:
You MUST output BOTH sections below, in this exact order, every single time.
Outputting only one section is a failure. Both are always required.

SECTION 1 — schema.yml (output this first):

## schema.yml
\`\`\`yaml
version: 2

models:
  - name: <model_name_from_description>
    description: "<one sentence: what business entity this models>"
    config:
      tags: ["<business_domain>"]
    columns:
      - name: <primary_key>
        description: "<what uniquely identifies this record>"
        tests:
          - not_null
          - unique
      - name: <foreign_key_if_relevant>
        description: "<the parent entity this references>"
        tests:
          - not_null
          - relationships:
              to: ref('<parent_model>')
              field: <parent_primary_key>
      - name: <status_or_category_field>
        description: "<what state or category this represents>"
        tests:
          - not_null
          - accepted_values:
              values: ["<value_a>", "<value_b>", "<value_c>"]
      - name: updated_at
        description: "Timestamp of last record update, used for incremental loads"
        tests:
          - not_null
\`\`\`

SECTION 2 — model SQL (output this immediately after Section 1):

## model.sql
\`\`\`sql
{{ config(
    materialized='incremental',
    unique_key='<primary_key>',
    incremental_strategy='delete+insert',
    on_schema_change='append_new_columns',
    tags=['<business_domain>']
) }}

WITH source AS (
    SELECT
        <primary_key>,
        <field_2_from_description>,
        <field_3_from_description>,
        <field_4_from_description>,
        updated_at
    FROM {{ source('<source_schema>', '<source_table>') }}
    {% if is_incremental() %}
    -- Only process records updated since last run
    WHERE updated_at > (SELECT MAX(updated_at) FROM {{ this }})
    {% endif %}
),

final AS (
    SELECT
        *,
        CURRENT_TIMESTAMP AS dbt_loaded_at
    FROM source
)

SELECT * FROM final
\`\`\`

FIELD NAMING — derive from user description, never use placeholders:
- Bad: id, name, date, value, field1
- Good: order_id, customer_email, shipped_at, product_sku, payment_status, invoice_total_usd` : "";

    const dbtReminder = artifactType === "dbt"
      ? "\n\nREMINDER: This is dbt. Output schema.yml FIRST, then model.sql. Both code blocks are mandatory."
      : "";

    const cloudEnforcement = `\n\nCRITICAL: Cloud provider is ${cloudStack.toUpperCase()}. Every service, import, path, connection ID, and SDK must be ${cloudStack.toUpperCase()}-native. Using any service from a different cloud is a critical error.`;

    const systemPrompt = `${basePrompt}${artifactRules}\n\nArtifact type: ${artifactType}\n\n${cloudInstructions[cloudStack] || `Cloud: ${cloudStack}`}${cloudEnforcement}${dbtReminder}`;

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
          max_tokens: 2048,
          stream: true,
        }),
      }
    );

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
