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
      <header className="flex items-center justify-between px-4 py-2 border-b border-border bg-card">
        <div className="flex items-center gap-2">
          <span className="text-lg">⚙️</span>
          <h1 className="text-sm font-mono font-semibold text-foreground">
            DataForge<span className="text-primary">.ai</span>
          </h1>
        </div>
        <span className="text-xs font-mono text-muted-foreground">data engineering artifact generator</span>
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
