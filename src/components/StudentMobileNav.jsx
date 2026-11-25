import { useState } from 'react'
import WorkspaceIcon from './WorkspaceIcon'
import { useBackHandler } from '../context/NavigationProvider'

const ITEMS = [
  ['home', 'home', 'Home'],
  ['courses', 'courses', 'Courses'],
  ['exams', 'exams', 'Exams'],
  ['papers', 'papers', 'Papers']
]

const MORE = [
  ['clinical', 'clinical', 'Clinical Lab'],
  ['simulator', 'simulator', 'Patient Simulator'],
  ['tutor', 'tutor', 'Study Tutor'],
  ['hub', 'hub', 'Knowledge Hub'],
  ['planner', 'planner', 'Study Planner'],
  ['premium', 'premium', 'Premium']
]

export default function StudentMobileNav({
  active,
  onNavigate,
  onTool
}) {
  const [open, setOpen] = useState(false)

  const moreActive = MORE.some(
    ([id]) => id === active
  )

  useBackHandler(() => {
    if (!open) return false
    setOpen(false)
    return true
  }, open, 150)

  function navigate(id) {
    setOpen(false)
    onNavigate(id)
  }

  function openTool(id) {
    setOpen(false)

    if (id === 'premium') {
      onNavigate(id)
    } else {
      onTool(id)
    }
  }

  return (
    <div className="pwm">
      {open && (
        <>
          <button
            type="button"
            className="pwm-backdrop"
            aria-label="Close learning tools"
            onClick={() => setOpen(false)}
          />

          <section
            className="pwm-more"
            id="pwm-more-menu"
            aria-label="More learning tools"
          >
            <header className="pwm-more-header">
              <h2>Learning Tools</h2>

              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setOpen(false)}
              >
                ×
              </button>
            </header>

            {MORE.map(([id, icon, label]) => (
              <button
                type="button"
                key={id}
                className="pwm-tool"
                onClick={() => openTool(id)}
              >
                <WorkspaceIcon name={icon}/>
                <span>{label}</span>
                <WorkspaceIcon
                  name="chevron"
                  size={16}
                />
              </button>
            ))}
          </section>
        </>
      )}

      <nav
        className="pwm-bar"
        aria-label="Mobile student navigation"
      >
        {ITEMS.map(([id, icon, label]) => (
          <button
            type="button"
            key={id}
            className={active === id ? 'active' : ''}
            aria-current={
              active === id ? 'page' : undefined
            }
            onClick={() => navigate(id)}
          >
            <WorkspaceIcon name={icon} size={23}/>
            <small>{label}</small>
          </button>
        ))}

        <button
          type="button"
          className={
            open || moreActive ? 'active' : ''
          }
          aria-expanded={open}
          aria-controls="pwm-more-menu"
          onClick={() => setOpen(v => !v)}
        >
          <WorkspaceIcon name="tools" size={23}/>
          <small>More</small>
        </button>
      </nav>
    </div>
  )
}
