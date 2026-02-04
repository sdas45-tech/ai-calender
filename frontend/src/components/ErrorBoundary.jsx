import React from "react"

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, info: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    this.setState({ error, info })
    // eslint-disable-next-line no-console
    console.error("Captured error in ErrorBoundary:", error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 24, fontFamily: "sans-serif" }}>
          <h1 style={{ color: "#e11d48" }}>Application Error</h1>
          <p>{this.state.error?.message ?? "An unexpected error occurred."}</p>
          <details style={{ whiteSpace: "pre-wrap", marginTop: 12 }}>
            {this.state.info?.componentStack}
          </details>
        </div>
      )
    }

    return this.props.children
  }
}
