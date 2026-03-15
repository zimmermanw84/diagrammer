import { useEffect, useRef, useState } from "react";
import type { DiagramPage } from "@diagrammer/shared";
import { THEME } from "../theme.js";

interface ContextMenu {
  pageId: string;
  x: number;
  y: number;
}

interface PageTabBarProps {
  pages: DiagramPage[];
  activePageId: string;
  onSelect: (pageId: string) => void;
  onAdd: () => void;
  onRename: (pageId: string, name: string) => void;
  onDelete: (pageId: string) => void;
}

export function PageTabBar({ pages, activePageId, onSelect, onAdd, onRename, onDelete }: PageTabBarProps) {
  const [menu, setMenu] = useState<ContextMenu | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const renameInputRef = useRef<HTMLInputElement>(null);

  // Focus input when rename starts
  useEffect(() => {
    if (renamingId) renameInputRef.current?.select();
  }, [renamingId]);

  // Close context menu on outside click
  useEffect(() => {
    if (!menu) return;
    const close = () => setMenu(null);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [menu]);

  const commitRename = () => {
    if (renamingId && renameValue.trim()) {
      onRename(renamingId, renameValue.trim());
    }
    setRenamingId(null);
  };

  const startRename = (page: DiagramPage) => {
    setMenu(null);
    setRenamingId(page.id);
    setRenameValue(page.name);
  };

  const MENU_WIDTH = 120;
  const MENU_HEIGHT = 76; // two items at ~38px each

  const handleContextMenu = (e: React.MouseEvent, pageId: string) => {
    e.preventDefault();
    const x = Math.min(e.clientX, window.innerWidth - MENU_WIDTH);
    const y = Math.min(e.clientY, window.innerHeight - MENU_HEIGHT);
    setMenu({ pageId, x, y });
  };

  return (
    <div style={styles.bar}>
      {pages.map((page) => {
        const isActive = page.id === activePageId;
        return (
          <div
            key={page.id}
            role="tab"
            aria-selected={isActive}
            style={{ ...styles.tab, ...(isActive ? styles.tabActive : styles.tabInactive) }}
            onClick={() => { if (!renamingId) onSelect(page.id); }}
            onContextMenu={(e) => handleContextMenu(e, page.id)}
          >
            {renamingId === page.id ? (
              <input
                ref={renameInputRef}
                style={styles.renameInput}
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onBlur={commitRename}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitRename();
                  if (e.key === "Escape") setRenamingId(null);
                }}
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span style={styles.tabLabel}>{page.name}</span>
            )}
          </div>
        );
      })}

      <button
        style={styles.addButton}
        onClick={onAdd}
        title="Add page"
        aria-label="Add page"
      >
        +
      </button>

      {menu && (
        <div
          style={{ ...styles.contextMenu, left: menu.x, top: menu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            style={styles.menuItem}
            onClick={() => {
              const page = pages.find((p) => p.id === menu.pageId);
              if (page) startRename(page);
            }}
          >
            Rename
          </button>
          <button
            style={{
              ...styles.menuItem,
              ...(pages.length <= 1 ? styles.menuItemDisabled : {}),
            }}
            onClick={() => {
              if (pages.length <= 1) return;
              onDelete(menu.pageId);
              setMenu(null);
            }}
            disabled={pages.length <= 1}
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  bar: {
    display: "flex",
    alignItems: "stretch",
    background: THEME.mantle,
    borderTop: `2px solid ${THEME.surface1}`,
    boxShadow: "0 -2px 8px rgba(0,0,0,0.25)",
    height: "32px",
    flexShrink: 0,
    overflowX: "auto",
    userSelect: "none",
    position: "relative",
  },
  tab: {
    display: "flex",
    alignItems: "center",
    padding: "0 14px",
    cursor: "pointer",
    fontSize: "12px",
    whiteSpace: "nowrap",
    borderRight: `1px solid ${THEME.surface0}`,
  },
  tabActive: {
    background: THEME.base,
    color: THEME.text,
    borderTop: `3px solid ${THEME.blue}`,
    marginTop: "-1px",
  },
  tabInactive: {
    background: "transparent",
    color: THEME.subtext0,
  },
  tabLabel: {
    pointerEvents: "none",
  },
  renameInput: {
    background: THEME.surface0,
    border: `1px solid ${THEME.blue}`,
    color: THEME.text,
    fontSize: "12px",
    borderRadius: "2px",
    padding: "1px 4px",
    width: "80px",
    outline: "none",
  },
  addButton: {
    padding: "0 12px",
    background: "transparent",
    border: "none",
    color: THEME.subtext0,
    fontSize: "18px",
    cursor: "pointer",
    lineHeight: 1,
  },
  contextMenu: {
    position: "fixed",
    background: THEME.surface0,
    border: `1px solid ${THEME.surface1}`,
    borderRadius: "4px",
    zIndex: 1000,
    minWidth: "100px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  menuItem: {
    padding: "8px 12px",
    background: "transparent",
    border: "none",
    color: THEME.text,
    fontSize: "12px",
    cursor: "pointer",
    textAlign: "left",
  },
  menuItemDisabled: {
    color: THEME.surface1,
    cursor: "not-allowed",
  },
};
