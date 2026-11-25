import { useEffect, useState } from 'react'
import WorkspaceIcon from './WorkspaceIcon'

const PRIMARY = [
  ['home', 'home', 'Dashboard'],
  ['courses', 'courses', 'Courses'],
  ['exams', 'exams', 'Smart Exam'],
  ['papers', 'papers', 'Past Papers']
]

const TOOLS = [
  ['clinical', 'clinical', 'Clinical Lab'],
  ['simulator', 'simulator', 'Patient Simulator'],
  ['tutor', 'tutor', 'Tutor'],
  ['hub', 'hub', 'Knowledge Hub']
]

export default function StudentWorkspaceNav({
  active = 'home',
  onNavigate,
  onTool,
  onAccount
}) {
  const [toolsOpen, setToolsOpen] = useState(false)

  const activeTool = TOOLS.some(
    ([id]) => id === active
  )

  useEffect(() => {
    if (activeTool) setToolsOpen(true)
  }, [activeTool])

  function item(id, icon, label, action) {
    return (
      <button
        type="button"
        key={id}
        data-periak-tour={
          id === 'papers' ? 'pastpapers' : id
        }
        className={
          'pw-nav-item' +
          (active === id ? ' pw-active' : '')
        }
        aria-current={
          active === id ? 'page' : undefined
        }
        onClick={action || (() => onNavigate(id))}
      >
        <WorkspaceIcon name={icon}/>
        <span>{label}</span>
      </button>
    )
  }

  return (
    <aside className="pw-sidebar">

      <div className="pw-brand">
        <span className="auth-logo">✚</span>
        <strong>PERIAK</strong>
      </div>

      <nav aria-label="Student navigation">

        {PRIMARY.map(([id, icon, label]) =>
          item(id, icon, label)
        )}

        <button
          type="button"
          className={
            'pw-nav-item' +
            (activeTool ? ' pw-group-active' : '')
          }
          aria-expanded={toolsOpen}
          aria-controls="pw-learning-tools"
          onClick={() => setToolsOpen(v => !v)}
        >
          <WorkspaceIcon name="tools"/>
          <span>Learning Tools</span>
          <WorkspaceIcon
            name="down"
            size={15}
            className={
              toolsOpen ? 'pw-chevron-open' : ''
            }
          />
        </button>

        {toolsOpen && (
          <div
            className="pw-subnav"
            id="pw-learning-tools"
          >
            {TOOLS.map(([id, icon, label]) =>
              item(
                id,
                icon,
                label,
                () => onTool(id)
              )
            )}
          </div>
        )}

        {item(
          'planner',
          'planner',
          'Planner',
          () => onTool('planner')
        )}

        {item('premium', 'premium', 'Premium')}

        <div className="pw-nav-divider"/>

        {item(
          'account',
          'account',
          'Account',
          onAccount
        )}

      </nav>
    </aside>
  )
}
