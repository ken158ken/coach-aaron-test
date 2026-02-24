/**
 * ErrorBoundary - 全域錯誤邊界
 * @module components/ErrorBoundary
 */

import React from "react";

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("React Error Boundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#0a0a0a",
            color: "#d4af37",
            fontFamily: "sans-serif",
            padding: "2rem",
          }}
        >
          <div style={{ textAlign: "center", maxWidth: "500px" }}>
            <h1 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>
              頁面載入發生錯誤
            </h1>
            <p style={{ color: "#999", marginBottom: "1.5rem" }}>
              {this.state.error?.message || "未知錯誤"}
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: "0.75rem 2rem",
                border: "1px solid #d4af37",
                background: "transparent",
                color: "#d4af37",
                borderRadius: "9999px",
                cursor: "pointer",
                fontSize: "0.875rem",
                letterSpacing: "0.1em",
              }}
            >
              重新載入
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
