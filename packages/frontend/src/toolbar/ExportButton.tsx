import { useState } from "react";
import type { DiagramDocument } from "@diagrammer/shared";
import { API_BASE } from "../config.js";
import { THEME } from "../theme.js";

interface ExportButtonProps {
  doc: DiagramDocument;
  disabled?: boolean;
}

/** Strip characters that are invalid in filenames on Windows and Unix. */
export function sanitizeFilename(name: string): string {
  return (
    name
      .replace(/[/\\:*?"<>|]/g, "")
      .trim()
      .replace(/\.+$/, "") || "diagram"
  );
}

export function ExportButton({ doc, disabled }: ExportButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filename, setFilename] = useState(() => sanitizeFilename(doc.meta.title || "diagram"));

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
        const data = await res.json().catch(() => ({}));
        const msg = typeof data.error === "string" ? data.error : `Export failed (${res.status})`;
        throw new Error(msg);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = window.document.createElement("a");
      a.href = url;
      a.download = `${sanitizeFilename(filename)}.vsdx`;
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
      <div style={styles.filenameRow}>
        <input
          type="text"
          value={filename}
          onChange={(e) => setFilename(e.target.value)}
          style={styles.filenameInput}
          placeholder="diagram"
          aria-label="Export filename"
          disabled={disabled || loading}
        />
        <span style={styles.ext}>.vsdx</span>
      </div>
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
  filenameRow: {
    display: "flex",
    alignItems: "center",
    gap: "2px",
  },
  filenameInput: {
    flex: 1,
    minWidth: 0,
    background: THEME.surface0,
    border: `1px solid ${THEME.surface1}`,
    color: THEME.text,
    borderRadius: 3,
    padding: "3px 5px",
    fontSize: "11px",
  },
  ext: {
    fontSize: "11px",
    color: THEME.subtext0,
    whiteSpace: "nowrap",
  },
  button: {
    width: "100%",
    padding: "8px 12px",
    borderRadius: "6px",
    border: `1px solid ${THEME.blue}`,
    background: THEME.base,
    color: THEME.blue,
    fontSize: "12px",
    fontWeight: 600,
    cursor: "pointer",
    transition: "background 0.1s",
  },
  buttonDisabled: {
    border: `1px solid ${THEME.surface1}`,
    color: THEME.surface1,
    cursor: "not-allowed",
  },
  toast: {
    padding: "6px 8px",
    borderRadius: "4px",
    background: THEME.red,
    color: THEME.base,
    fontSize: "11px",
    cursor: "pointer",
    lineHeight: 1.4,
  },
};
