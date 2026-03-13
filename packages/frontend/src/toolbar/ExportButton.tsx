import { useState } from "react";
import type { DiagramDocument } from "@diagrammer/shared";

const API_BASE = import.meta.env["VITE_API_URL"] ?? "http://localhost:3001";

interface ExportButtonProps {
  doc: DiagramDocument;
  disabled?: boolean;
}

export function ExportButton({ doc, disabled }: ExportButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/v1/export/vsdx`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(doc),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(data.error ?? `Export failed (${res.status})`);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = window.document.createElement("a");
      a.href = url;
      a.download = `${doc.meta.title || "diagram"}.vsdx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.wrapper}>
      <button
        onClick={handleExport}
        disabled={disabled || loading}
        style={{
          ...styles.button,
          ...(disabled || loading ? styles.buttonDisabled : {}),
        }}
        title={disabled ? "Backend offline — export unavailable" : "Export as .vsdx"}
      >
        {loading ? "Exporting…" : "Export to Visio"}
      </button>
      {error && (
        <div style={styles.toast} onClick={() => setError(null)}>
          {error}
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  button: {
    width: "100%",
    padding: "8px 12px",
    borderRadius: "6px",
    border: "1px solid #89b4fa",
    background: "#1e1e2e",
    color: "#89b4fa",
    fontSize: "12px",
    fontWeight: 600,
    cursor: "pointer",
    transition: "background 0.1s",
  },
  buttonDisabled: {
    border: "1px solid #45475a",
    color: "#45475a",
    cursor: "not-allowed",
  },
  toast: {
    padding: "6px 8px",
    borderRadius: "4px",
    background: "#f38ba8",
    color: "#1e1e2e",
    fontSize: "11px",
    cursor: "pointer",
    lineHeight: 1.4,
  },
};
