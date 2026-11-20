import { Component } from 'react'

export default class ExamPageErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('Published examination page crashed:', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <main style={{
          minHeight: '100vh',
          padding: 24,
          background: '#f3f6fb',
          fontFamily: 'system-ui, sans-serif'
        }}>
          <section style={{
            maxWidth: 700,
            margin: '40px auto',
            padding: 24,
            background: '#fff',
            border: '1px solid #fecaca',
            borderRadius: 12
          }}>
            <h2>Examination page error</h2>
            <p>The published examination page encountered an error.</p>
            <pre style={{
              whiteSpace: 'pre-wrap',
              overflowWrap: 'anywhere',
              padding: 12,
              background: '#fff1f2',
              color: '#991b1b',
              borderRadius: 8
            }}>
              {this.state.error?.message || String(this.state.error)}
            </pre>
            <button onClick={this.props.onBack}>← Back to Examination Centre</button>
          </section>
        </main>
      )
    }

    return this.props.children
  }
}
