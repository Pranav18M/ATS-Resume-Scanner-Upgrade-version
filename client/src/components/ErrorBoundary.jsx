import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '20px',
          background: '#0f172a',
          color: 'white',
          textAlign: 'center'
        }}>
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '16px',
            padding: '40px',
            maxWidth: '600px'
          }}>
            <svg 
              style={{ width: '64px', height: '64px', color: '#ef4444', marginBottom: '20px' }}
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
            >
              <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
            <h1 style={{ fontSize: '2rem', marginBottom: '12px' }}>Something Went Wrong</h1>
            <p style={{ fontSize: '1rem', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '24px' }}>
              We encountered an unexpected error. Please try refreshing the page.
            </p>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div style={{
                background: 'rgba(0, 0, 0, 0.3)',
                padding: '16px',
                borderRadius: '8px',
                marginBottom: '24px',
                textAlign: 'left',
                fontSize: '0.85rem',
                fontFamily: 'monospace',
                overflowX: 'auto'
              }}>
                <strong>Error:</strong> {this.state.error.toString()}
              </div>
            )}
            <button 
              onClick={this.handleReload}
              style={{
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                color: 'white',
                border: 'none',
                padding: '14px 28px',
                borderRadius: '12px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(99, 102, 241, 0.4)',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
              onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
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

export default ErrorBoundary;