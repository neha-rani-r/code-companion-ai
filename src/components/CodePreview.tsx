import { useMemo, useState } from "react";
import { Copy, Check, FileCode, Download } from "lucide-react";

interface CodePreviewProps {
  code: string;
  language: string;
  isStreaming: boolean;
}

export function CodePreview({ code, language, isStreaming }: CodePreviewProps) {
  const [copied, setCopied] = useState(false);

  const extractedCode = useMemo(() => {
    // Prefer sql block (dbt responses have yaml first, sql second)
    const sqlMatch = code.match(/```sql\n([\s\S]*?)```/);
    if (sqlMatch) return sqlMatch[1].trim();
    // Fall back to first code block of any language
    const anyMatch = code.match(/```[\w]*\n([\s\S]*?)```/);
    if (anyMatch) return anyMatch[1].trim();
    // Fall back to raw code heuristic
    if (code.includes("def ") || code.includes("SELECT") || code.includes("import ") || code.includes("CREATE")) {
      return code.trim();
    }
    return "";
  }, [code]);

  const lines = extractedCode.split("\n");

  const handleCopy = async () => {
    if (!extractedCode) return;
    try {
      await navigator.clipboard.writeText(extractedCode);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = extractedCode;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!extractedCode) {
      console.log("[CodePreview] download attempted but extractedCode is empty");
      return;
    }
    console.log("[CodePreview] downloading, code length:", extractedCode.length);
    const ext = language === "sql" ? "sql" : language === "yaml" ? "yaml" : "py";
    const blob = new Blob([extractedCode], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `artifact.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
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
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-secondary/30 flex-shrink-0">
        <div className="flex gap-1.5 flex-shrink-0">
          <span className="w-3 h-3 rounded-full bg-destructive/60" />
          <span className="w-3 h-3 rounded-full bg-accent/40" />
          <span className="w-3 h-3 rounded-full bg-primary/60" />
        </div>
        <span className="text-xs font-mono text-muted-foreground ml-2 truncate flex-1 min-w-0">
          artifact.{language === "python" ? "py" : "sql"}
        </span>
        {isStreaming && (
          <span className="text-xs font-mono text-primary animate-pulse-glow flex-shrink-0">● streaming</span>
        )}
      </div>

      {/* Code area */}
      <div className="flex-1 overflow-auto bg-code-bg p-0 min-h-0">
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

      {/* Sticky bottom action bar — always visible when code exists */}
      {extractedCode && (
        <div className="flex items-center justify-end gap-2 px-4 py-2 border-t border-border bg-card flex-shrink-0">
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded-md bg-secondary text-secondary-foreground hover:bg-muted hover:text-foreground transition-colors border border-border/50"
          >
            <Download className="w-3 h-3" />
            Download
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      )}
    </div>
  );
}
