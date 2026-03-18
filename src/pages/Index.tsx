import { useState, useCallback } from "react";
import { toast } from "sonner";
import { ConfigBar } from "@/components/ConfigBar";
import { ChatPanel } from "@/components/ChatPanel";
import { CodePreview } from "@/components/CodePreview";
import { streamArtifact } from "@/lib/stream";
import { ARTIFACT_OPTIONS } from "@/lib/types";
import type { ArtifactType, CloudStack, ChatMessage } from "@/lib/types";

const Index = () => {
  const [artifactType, setArtifactType] = useState<ArtifactType>("airflow");
  const [cloudStack, setCloudStack] = useState<CloudStack>("aws");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedCode, setGeneratedCode] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);

  const currentLang = ARTIFACT_OPTIONS.find((a) => a.value === artifactType)?.lang || "python";

  const handleSend = useCallback(
    async (input: string) => {
      const userMsg: ChatMessage = { role: "user", content: input };
      const newMessages = [...messages, userMsg];
      setMessages(newMessages);
      setIsLoading(true);
      setIsStreaming(true);

      let assistantContent = "";
      setGeneratedCode("");

      const upsertAssistant = (chunk: string) => {
        assistantContent += chunk;
        setGeneratedCode(assistantContent);
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant") {
            return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantContent } : m));
          }
          return [...prev, { role: "assistant", content: assistantContent }];
        });
      };

      try {
        await streamArtifact({
          messages: newMessages,
          artifactType,
          cloudStack,
          onDelta: upsertAssistant,
          onDone: () => {
            setIsLoading(false);
            setIsStreaming(false);
          },
          onError: (error) => {
            toast.error(error);
            setIsLoading(false);
            setIsStreaming(false);
          },
        });
      } catch (e) {
        toast.error("Failed to generate artifact");
        setIsLoading(false);
        setIsStreaming(false);
      }
    },
    [messages, artifactType, cloudStack]
  );

  return (
    <div className="flex flex-col h-screen">
      <header className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <svg width="32" height="16" viewBox="0 0 32 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <circle cx="4" cy="8" r="3.5" fill="#1D9E75" />
            <line x1="8" y1="8" x2="12" y2="8" stroke="#1D9E75" strokeWidth="1.5" strokeLinecap="round" />
            <polygon points="12,5.5 16,8 12,10.5" fill="#1D9E75" />
            <circle cx="20" cy="8" r="3.5" fill="#1D9E75" />
            <line x1="24" y1="8" x2="28" y2="8" stroke="#1D9E75" strokeWidth="1.5" strokeLinecap="round" />
            <polygon points="28,5.5 32,8 28,10.5" fill="#1D9E75" />
          </svg>
          <div className="flex flex-col gap-0">
            <h1 className="text-xl font-mono font-bold text-foreground leading-tight">
              DataForge<span className="text-primary">.ai</span>
            </h1>
            <span className="text-xs font-mono text-foreground/60 leading-tight tracking-wide">
              data engineering artifact generator
            </span>
          </div>
        </div>
        <span className="text-xs font-mono text-muted-foreground">
          by{" "}
          <span className="text-primary font-medium">Neha Rani</span>
          <span className="mx-1.5 opacity-40">·</span>
          <span className="text-foreground/50">Engineering Manager &amp; Data Architect</span>
          <span className="mx-1.5 opacity-40">·</span>
          <a
            href="https://www.linkedin.com/in/neha-rani-r/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Connect ↗
          </a>
        </span>
      </header>

      <ConfigBar
        artifactType={artifactType}
        cloudStack={cloudStack}
        onArtifactChange={setArtifactType}
        onCloudChange={setCloudStack}
      />

      <div className="flex flex-1 overflow-hidden">
        <div className="w-[420px] min-w-[320px] border-r border-border flex flex-col">
          <ChatPanel messages={messages} isLoading={isLoading} onSend={handleSend} />
        </div>
        <div className="flex-1 flex flex-col">
          <CodePreview code={generatedCode} language={currentLang} isStreaming={isStreaming} />
        </div>
      </div>
    </div>
  );
};

export default Index;
