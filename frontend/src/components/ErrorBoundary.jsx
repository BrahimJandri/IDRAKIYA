import { Component } from 'react'

export default class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          minHeight: '100vh', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          background: 'var(--bg)', gap: '1rem', padding: '2rem',
        }}>
          <div style={{ fontSize: '2.5rem' }}>⚠️</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--text-1)' }}>
            Something went wrong
          </h2>
          <p style={{ color: 'var(--text-3)', fontSize: '.9rem', maxWidth: 380, textAlign: 'center' }}>
            {this.state.error?.message || 'An unexpected error occurred.'}
          </p>
          <button className="btn btn-primary" onClick={() => window.location.href = '/'}>
            Go home
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
