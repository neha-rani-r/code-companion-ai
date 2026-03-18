import { useMemo } from "react";
import { Copy, Check, FileCode, Download } from "lucide-react";
import { useState } from "react";

interface CodePreviewProps {
  code: string;
  language: string;
  isStreaming: boolean;
}

export function CodePreview({ code, language, isStreaming }: CodePreviewProps) {
  const [copied, setCopied] = useState(false);

  const extractedCode = useMemo(() => {
    // Extract code from markdown code blocks
    const match = code.match(/```[\w]*\n([\s\S]*?)```/);
    if (match) return match[1].trim();
    // If no code block, check if it looks like code
    if (code.includes("def ") || code.includes("SELECT") || code.includes("import ") || code.includes("CREATE")) {
      return code.trim();
    }
    return "";
  }, [code]);

  const lines = extractedCode.split("\n");

  const handleCopy = async () => {
    await navigator.clipboard.writeText(extractedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const ext = language === "sql" ? "sql" : language === "yaml" ? "yaml" : "py";
    const blob = new Blob([extractedCode], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `artifact.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!extractedCode && !isStreaming) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3">
        <FileCode className="w-12 h-12 opacity-30" />
        <p className="font-mono text-sm">Generated code will appear here</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-secondary/30 flex-wrap">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="flex gap-1.5 flex-shrink-0">
            <span className="w-3 h-3 rounded-full bg-destructive/60" />
            <span className="w-3 h-3 rounded-full bg-accent/40" />
            <span className="w-3 h-3 rounded-full bg-primary/60" />
          </div>
          <span className="text-xs font-mono text-muted-foreground ml-2 truncate">
            artifact.{language === "python" ? "py" : "sql"}
          </span>
          {isStreaming && (
            <span className="text-xs font-mono text-primary animate-pulse-glow flex-shrink-0">● streaming</span>
          )}
        </div>
        {extractedCode && (
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={handleDownload}
              className="flex items-center gap-1 px-2 py-1 text-xs font-mono rounded-md bg-secondary text-secondary-foreground hover:bg-muted transition-colors"
            >
              <Download className="w-3 h-3" />
              Download
            </button>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-2 py-1 text-xs font-mono rounded-md bg-secondary text-secondary-foreground hover:bg-muted transition-colors"
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-auto bg-code-bg p-0">
        <pre className="text-sm font-mono leading-relaxed">
          {lines.map((line, i) => (
            <div key={i} className="flex hover:bg-code-line/50 transition-colors">
              <span className="w-12 flex-shrink-0 text-right pr-4 text-muted-foreground/40 select-none text-xs leading-relaxed py-px">
                {i + 1}
              </span>
              <code className="flex-1 text-foreground/90 py-px pr-4">{line || " "}</code>
            </div>
          ))}
          {isStreaming && (
            <div className="flex">
              <span className="w-12 flex-shrink-0" />
              <span className="w-2 h-4 bg-primary animate-cursor-blink" />
            </div>
          )}
        </pre>
      </div>
    </div>
  );
}
