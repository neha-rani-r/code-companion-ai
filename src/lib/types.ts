export type ArtifactType = "airflow" | "dbt" | "spark" | "redshift";
export type CloudStack = "aws" | "gcp" | "azure";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export const ARTIFACT_OPTIONS: { value: ArtifactType; label: string; icon: string; lang: string }[] = [
  { value: "airflow", label: "Airflow DAG", icon: "🔄", lang: "python" },
  { value: "dbt", label: "dbt Model", icon: "🔧", lang: "sql" },
  { value: "spark", label: "Spark Job", icon: "⚡", lang: "python" },
  { value: "redshift", label: "Redshift SQL", icon: "🗄️", lang: "sql" },
];

export const CLOUD_OPTIONS: { value: CloudStack; label: string; icon: string }[] = [
  { value: "aws", label: "AWS", icon: "☁️" },
  { value: "gcp", label: "GCP", icon: "🌐" },
  { value: "azure", label: "Azure", icon: "🔷" },
];
