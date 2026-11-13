
import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      hasError: false,
    };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Application Error:", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#061429] px-4 text-white">
          <div className="w-full max-w-md rounded-2xl border border-white/15 bg-white/10 p-8 text-center shadow-2xl backdrop-blur-md">
            <h1 className="mb-3 text-2xl font-bold">
              Something went wrong
            </h1>

            <p className="mb-6 text-sm leading-6 text-white/70">
              An unexpected error occurred. Please reload the page and try again.
            </p>

            <button
              onClick={this.handleReload}
              className="rounded-lg bg-[#0066FF] px-6 py-3 font-semibold text-white transition hover:bg-[#014883]"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
