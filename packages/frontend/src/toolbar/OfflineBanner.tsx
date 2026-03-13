export function OfflineBanner() {
  return (
    <div style={styles.banner}>
      ⚠ Backend offline — export unavailable
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  banner: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    background: "#f38ba8",
    color: "#1e1e2e",
    textAlign: "center",
    padding: "6px 16px",
    fontSize: "13px",
    fontWeight: 600,
  },
};
