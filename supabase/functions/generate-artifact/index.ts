import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are an expert data engineer who generates production-ready code artifacts. You specialize in:
- Apache Airflow DAGs (Python)
- dbt models (SQL + YAML)
- Apache Spark jobs (PySpark)
- Amazon Redshift SQL (DDL, queries, stored procedures)

Rules:
1. Generate ONLY the code artifact — no explanations before or after unless the user asks.
2. Use best practices: proper error handling, logging, idempotency, and documentation.
3. Include inline comments explaining key decisions.
4. For Airflow: use TaskFlow API when appropriate, set proper retries/timeouts.
5. For dbt: include schema.yml tests, use refs, document columns.
6. For Spark: optimize for large datasets, use proper partitioning.
7. For Redshift: use SORTKEY/DISTKEY, optimize for columnar storage.
8. Adapt to the user's specified cloud provider (AWS, GCP, Azure).
9. Wrap all code in a single markdown code block with the appropriate language tag.
10. If the request is ambiguous, generate the most common/useful interpretation.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, artifactType, cloudStack } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const contextMessage = `Context: The user wants a ${artifactType} artifact for ${cloudStack} cloud infrastructure.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "system", content: contextMessage },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits in Settings → Usage." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI generation failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("generate-artifact error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
