import { Component } from 'react'

export default class AppErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { failed: false }
  }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error) {
    console.error(
      '[PERIAK] Application rendering error:',
      error?.name || 'Unknown error'
    )
  }

  render() {
    if (!this.state.failed) {
      return this.props.children
    }

    return (
      <main className="periak-recovery-page" role="alert">
        <section className="periak-recovery-card">
          <span className="periak-recovery-icon">✚</span>
          <small>PERIAK</small>
          <h1>Something went wrong</h1>

          <p>
            PERIAK encountered an unexpected problem.
            You can reload the application and try again.
          </p>

          <p>
            Your account and saved online learning records
            are not deleted by reloading.
            Unsaved activity may be lost.
          </p>

          <button
            type="button"
            onClick={() => window.location.reload()}
          >
            Reload PERIAK
          </button>

          <button
            type="button"
            className="periak-recovery-secondary"
            onClick={() =>
              window.location.assign(window.location.origin)
            }
          >
            Return to application
          </button>
        </section>
      </main>
    )
  }
}
