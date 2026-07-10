import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("WealthOS crash:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          textAlign: "center",
          fontFamily: "'Nunito Sans', -apple-system, sans-serif",
          background: "#0d1b2e",
          color: "#e8f1ff",
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>😕</div>
          <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>
            Něco se pokazilo
          </h1>
          <p style={{ fontSize: 14, color: "#8aafd4", marginBottom: 8, maxWidth: 400 }}>
            Aplikace narazila na neočekávanou chybu. Tvá data jsou v bezpečí
            (localStorage + Google Sheets).
          </p>
          {this.state.error && (
            <pre style={{
              fontSize: 11,
              color: "#4a6a8a",
              background: "rgba(255,255,255,0.05)",
              padding: "8px 12px",
              borderRadius: 8,
              marginBottom: 20,
              maxWidth: "90vw",
              overflow: "auto",
            }}>
              {String(this.state.error.message || this.state.error)}
            </pre>
          )}
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: "10px 24px",
              fontSize: 14,
              fontWeight: 700,
              background: "#4da6ff",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              cursor: "pointer",
            }}
          >
            Obnovit stránku
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
