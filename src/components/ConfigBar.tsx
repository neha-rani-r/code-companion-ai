import { useState } from "react";
import { ArtifactType, CloudStack, ARTIFACT_OPTIONS, CLOUD_OPTIONS } from "@/lib/types";

interface ConfigBarProps {
  artifactType: ArtifactType;
  cloudStack: CloudStack;
  onArtifactChange: (v: ArtifactType) => void;
  onCloudChange: (v: CloudStack) => void;
}

export function ConfigBar({ artifactType, cloudStack, onArtifactChange, onCloudChange }: ConfigBarProps) {
  return (
    <div className="flex flex-wrap gap-2 p-3 border-b border-border bg-secondary/30">
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
      <div className="w-px bg-border mx-1" />
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
    </div>
  );
}
