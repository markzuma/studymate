import { useState } from 'react'

const GROUPS = [
  {
    title: 'Workspace',
    items: [
      ['overview', 'Executive Dashboard', '⌂'],
      ['operations', 'Platform Operations', '▦']
    ]
  },
  {
    title: 'Students & Operations',
    items: [
      ['users', 'Users', '◉'],
      ['usage', 'Usage Analytics', '▥'],
      ['support', 'Support & Feedback', '☏'],
      ['announcements', 'Announcements', '⚑']
    ]
  },
  {
    title: 'Academics',
    items: [
      ['courses', 'Courses & Units', '▤'],
      ['materials', 'Learning Materials', '▣'],
      ['outlines', 'Course Outlines', '≡'],
      ['academic-quality', 'Academic Quality', '✓']
    ]
  },
  {
    title: 'Examinations',
    items: [
      ['exams', 'Examinations', '✎'],
      ['exam-quality', 'Question Bank', '▦'],
      ['results', 'Results & Analytics', '▥'],
      ['pastpapers', 'Past Papers Library', '▧']
    ]
  },
  {
    title: 'Business',
    items: [
      ['business', 'Business Intelligence', '▥'],
      ['monetization', 'Monetization & Payments', '◆'],
      ['growth', 'Growth & Referrals', '↗']
    ]
  }
]

export default function ControlCentreNavigation({
  section,
  onNavigate,
  mobileOpen
}) {
  const [search, setSearch] = useState('')
  const query = search.trim().toLowerCase()

  return (
    <nav
      className={
        'ccv2-sidebar cc3-navigation' +
        (mobileOpen ? ' ccv2-sidebar-open' : '')
      }
      id="ccv2-navigation"
      aria-label="Administration navigation"
    >
      <div className="cc3-nav-heading">
        <strong>Admin Workspace</strong>
        <small>Management navigation</small>
      </div>

      <input
        className="cc3-nav-search"
        type="search"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Find a section..."
        aria-label="Search administration sections"
      />

      {GROUPS.map(group => {
        const items = group.items.filter(item =>
          !query ||
          item[1].toLowerCase().includes(query) ||
          group.title.toLowerCase().includes(query)
        )

        if (!items.length) return null

        return (
          <section className="cc3-nav-group" key={group.title}>
            <h3>{group.title}</h3>

            {items.map(([id, label, icon]) => (
              <button
                key={id}
                type="button"
                className={
                  'cc3-nav-link' +
                  (section === id ? ' active' : '')
                }
                aria-current={
                  section === id ? 'page' : undefined
                }
                onClick={() => onNavigate(id)}
              >
                <span aria-hidden="true">{icon}</span>
                <strong>{label}</strong>
              </button>
            ))}
          </section>
        )
      })}

      {query && !GROUPS.some(group =>
        group.title.toLowerCase().includes(query) ||
        group.items.some(item =>
          item[1].toLowerCase().includes(query)
        )
      ) && (
        <small className="cc3-nav-empty">
          No matching sections.
        </small>
      )}
    </nav>
  )
}
