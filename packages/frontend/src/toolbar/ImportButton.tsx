import { useRef, useState } from "react";
import type { DiagramDocument } from "@diagrammer/shared";
import { API_BASE } from "../config.js";
import { THEME } from "../theme.js";
import { useDiagram } from "../state/index.js";

function isNonEmpty(doc: DiagramDocument): boolean {
  return doc.pages.some((p) => p.shapes.length > 0 || p.connectors.length > 0);
}

export function ImportButton({ disabled }: { disabled?: boolean }) {
  const { state, dispatch } = useDiagram();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    if (
      isNonEmpty(state.document) &&
      !window.confirm("Importing will replace the current diagram. Continue?")
    ) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${API_BASE}/api/v1/import/vsdx`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const msg = typeof data.error === "string" ? data.error : `Import failed (${res.status})`;
        throw new Error(msg);
      }

      const document: DiagramDocument = await res.json();
      dispatch({ type: "LOAD_DOCUMENT", payload: { document } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.wrapper}>
      <input
        ref={inputRef}
        type="file"
        accept=".vsdx"
        style={styles.hiddenInput}
        onChange={handleFileChange}
        aria-label="Import .vsdx file"
        tabIndex={-1}
        disabled={disabled || loading}
      />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={disabled || loading}
        style={{
          ...styles.button,
          ...(disabled || loading ? styles.buttonDisabled : {}),
        }}
        title={disabled ? "Backend offline — import unavailable" : "Import a .vsdx file"}
      >
        {loading ? "Importing…" : "Import .vsdx"}
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
  hiddenInput: {
    display: "none",
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
