import React from 'react';

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Keep lightweight client-side logging for production diagnostics.
    console.error('ThreadNet UI error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false });
    window.location.assign('/');
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="error-shell" role="alert" aria-live="assertive">
        <div className="error-card">
          <h1>Something went wrong</h1>
          <p>The interface hit an unexpected error. Please refresh the page.</p>
          <button className="btn btn-primary" onClick={this.handleReset}>
            Reload App
          </button>
        </div>
      </div>
    );
  }
}

export default AppErrorBoundary;
