import { ArtifactType, CloudStack, ARTIFACT_OPTIONS, CLOUD_OPTIONS } from "@/lib/types";

interface ConfigBarProps {
  artifactType: ArtifactType;
  cloudStack: CloudStack;
  messageCount: number;
  onArtifactChange: (v: ArtifactType) => void;
  onCloudChange: (v: CloudStack) => void;
  onClear: () => void;
}

export function ConfigBar({ artifactType, cloudStack, messageCount, onArtifactChange, onCloudChange, onClear }: ConfigBarProps) {
  const artifactLabel = ARTIFACT_OPTIONS.find((a) => a.value === artifactType)?.label ?? artifactType;
  const cloudLabel = CLOUD_OPTIONS.find((c) => c.value === cloudStack)?.label ?? cloudStack;
  const msgText = messageCount === 0 ? "no messages" : `${messageCount} message${messageCount !== 1 ? "s" : ""}`;

  return (
    <div className="flex flex-wrap items-center gap-2 px-3 py-2 border-b border-border bg-secondary/30">
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Artifact</span>
        <div className="flex gap-1">
          {ARTIFACT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onArtifactChange(opt.value)}
              className={`px-2.5 py-1 text-xs font-mono rounded-md transition-all ${
                artifactType === opt.value
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-secondary text-secondary-foreground hover:bg-muted"
              }`}
            >
              {opt.icon} {opt.label}
            </button>
          ))}
        </div>
      </div>
      <div className="w-px h-4 bg-border mx-1" />
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Cloud</span>
        <div className="flex gap-1">
          {CLOUD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onCloudChange(opt.value)}
              className={`px-2.5 py-1 text-xs font-mono rounded-md transition-all ${
                cloudStack === opt.value
                  ? "bg-accent text-accent-foreground shadow-sm"
                  : "bg-secondary text-secondary-foreground hover:bg-muted"
              }`}
            >
              {opt.icon} {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="ml-auto flex items-center gap-3">
        <span className="text-xs font-mono text-muted-foreground/60 hidden sm:block">
          {cloudLabel} · {artifactLabel} · {msgText}
        </span>
        <button
          onClick={onClear}
          title="New session"
          className="flex items-center gap-1 px-2.5 py-1 text-xs font-mono rounded-md bg-secondary text-muted-foreground hover:bg-muted hover:text-foreground transition-all border border-border/50"
        >
          <span className="inline-block transition-transform duration-300 hover:rotate-180">↺</span>
          New
        </button>
      </div>
    </div>
  );
}
