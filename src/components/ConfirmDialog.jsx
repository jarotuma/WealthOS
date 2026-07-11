import React, { useState, useCallback, createContext, useContext, useEffect } from "react";

// ── Context pro globální confirm() přístupný odkudkoliv ──────────
const ConfirmContext = createContext(null);

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm musí být uvnitř <ConfirmProvider>");
  return ctx;
}

export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null); // { message, title, danger, resolve }

  // Vrací Promise<boolean> — await confirm("Opravdu?")
  const confirm = useCallback((message, opts = {}) => {
    return new Promise((resolve) => {
      setState({
        message,
        title: opts.title || "Potvrzení",
        confirmLabel: opts.confirmLabel || "Potvrdit",
        cancelLabel: opts.cancelLabel || "Zrušit",
        danger: opts.danger !== false, // default true (mazání)
        resolve,
      });
    });
  }, []);

  const handleClose = useCallback((result) => {
    if (state?.resolve) state.resolve(result);
    setState(null);
  }, [state]);

  // Zavření na Escape, potvrzení na Enter
  useEffect(() => {
    if (!state) return;
    const onKey = (e) => {
      if (e.key === "Escape") handleClose(false);
      if (e.key === "Enter") handleClose(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [state, handleClose]);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {state && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-title"
          onClick={() => handleClose(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 9999,
            background: "rgba(0,0,0,0.45)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 20, backdropFilter: "blur(2px)",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--surface)",
              borderRadius: "var(--radius)",
              boxShadow: "var(--shadow)",
              maxWidth: 380, width: "100%",
              padding: "24px 24px 20px",
              border: "1px solid var(--border)",
            }}
          >
            <div id="confirm-title" style={{ fontSize: 17, fontWeight: 800, marginBottom: 8, color: "var(--text)" }}>
              {state.title}
            </div>
            <div style={{ fontSize: 14, color: "var(--text2)", marginBottom: 20, lineHeight: 1.5, whiteSpace: "pre-line" }}>
              {state.message}
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                onClick={() => handleClose(false)}
                style={{
                  padding: "9px 18px", fontSize: 14, fontWeight: 600,
                  background: "var(--surface2)", color: "var(--text2)",
                  border: "1px solid var(--border)", borderRadius: 10, cursor: "pointer",
                }}
              >
                {state.cancelLabel}
              </button>
              <button
                onClick={() => handleClose(true)}
                autoFocus
                style={{
                  padding: "9px 18px", fontSize: 14, fontWeight: 700,
                  background: state.danger ? "var(--red)" : "var(--blue)",
                  color: "#fff", border: "none", borderRadius: 10, cursor: "pointer",
                }}
              >
                {state.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}
