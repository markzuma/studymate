import { ACCENTS, useAppearance } from '../context/ThemeProvider'
import './ThemeSettings.css'

export default function ThemeSettings({ onClose }) {
  const { appearance, updateAppearance, resetAppearance, isDark } = useAppearance()

  return (
    <div className="appearance-overlay" onMouseDown={e => {
      if (e.target === e.currentTarget) onClose()
    }}>
      <section className="appearance-panel" role="dialog"
        aria-modal="true" aria-labelledby="appearance-title">
        <header className="appearance-header">
          <div>
            <span className="appearance-eyebrow">PERSONALISE YOUR SPACE</span>
            <h2 id="appearance-title">Appearance</h2>
            <p>Make PERIAK comfortable for the way you study.</p>
          </div>
          <button className="appearance-close" onClick={onClose}
            aria-label="Close appearance settings">×</button>
        </header>

        <div className="appearance-preview">
          <div className="preview-top">
            <span className="preview-logo">✚ PERIAK</span>
            <span className="preview-status">LIVE PREVIEW</span>
          </div>
          <div className="preview-content">
            <span className="preview-icon">📚</span>
            <div>
              <strong>Your learning space</strong>
              <p>Learn. Practise. Excel.</p>
            </div>
          </div>
          <div className="preview-bottom">
            <span>Study resources</span>
            <span>Exam practice</span>
          </div>
        </div>

        <div className="appearance-section">
          <h3>Display mode</h3>
          <p>Choose how PERIAK looks on your device.</p>
          <div className="appearance-choice-grid">
            {[
              ['light', '☀️', 'Light'],
              ['dark', '🌙', 'Dark'],
              ['system', '💻', 'System'],
            ].map(([value, icon, label]) => (
              <button key={value}
                className={`appearance-choice ${appearance.mode === value ? 'active' : ''}`}
                onClick={() => updateAppearance('mode', value)}>
                <span>{icon}</span>
                <strong>{label}</strong>
              </button>
            ))}
          </div>
        </div>

        <div className="appearance-section">
          <h3>Accent colour</h3>
          <p>Choose the colour used for highlights and controls.</p>
          <div className="accent-grid">
            {Object.entries(ACCENTS).map(([key, accent]) => (
              <button key={key}
                className={`accent-option ${appearance.accent === key ? 'active' : ''}`}
                onClick={() => updateAppearance('accent', key)}
                aria-label={accent.name}
                title={accent.name}>
                <span style={{ background: accent.color }} />
                <small>{accent.name}</small>
                {appearance.accent === key && <b>✓</b>}
              </button>
            ))}
          </div>
        </div>

        <div className="appearance-section">
          <h3>Text size</h3>
          <p>Adjust reading comfort throughout the app.</p>
          <div className="appearance-segment">
            {['small', 'normal', 'large'].map(value => (
              <button key={value}
                className={appearance.fontSize === value ? 'active' : ''}
                onClick={() => updateAppearance('fontSize', value)}>
                {value[0].toUpperCase() + value.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="appearance-section">
          <h3>Interface density</h3>
          <p>Choose the spacing between cards and content.</p>
          <div className="appearance-segment">
            {['compact', 'comfortable'].map(value => (
              <button key={value}
                className={appearance.density === value ? 'active' : ''}
                onClick={() => updateAppearance('density', value)}>
                {value[0].toUpperCase() + value.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="appearance-section">
          <h3>Card corners</h3>
          <div className="appearance-segment">
            <button className={appearance.corners === 'rounded' ? 'active' : ''}
              onClick={() => updateAppearance('corners', 'rounded')}>Rounded</button>
            <button className={appearance.corners === 'standard' ? 'active' : ''}
              onClick={() => updateAppearance('corners', 'standard')}>Standard</button>
          </div>
        </div>

        <div className="appearance-section appearance-toggles">
          <label>
            <span>
              <strong>Reduce animations</strong>
              <small>Minimise motion and transitions.</small>
            </span>
            <input type="checkbox" checked={appearance.reducedMotion}
              onChange={e => updateAppearance('reducedMotion', e.target.checked)} />
          </label>
        </div>

        <footer className="appearance-footer">
          <button className="appearance-reset" onClick={resetAppearance}>
            Reset to defaults
          </button>
          <button className="appearance-done" onClick={onClose}>Done</button>
        </footer>
        <p className="appearance-sync-note">
          {isDark ? 'Dark appearance is active.' : 'Light appearance is active.'}
          {' '}Your preferences are saved automatically.
        </p>
      </section>
    </div>
  )
}
