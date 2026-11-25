import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import WorkspaceIcon from './WorkspaceIcon'
import './StudentDashboard.css'

function ProgressBar({ percent }) {
  const value = Math.min(
    100,
    Math.max(0, Number(percent) || 0)
  )

  return (
    <div
      className="psd-progress-track"
      role="progressbar"
      aria-label="Course completion"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
    >
      <div style={{ width: `${value}%` }}/>
    </div>
  )
}

function PanelHeading({ icon, title, subtitle }) {
  return (
    <div className="psd-panel-heading">
      <WorkspaceIcon name={icon} size={26}/>
      <div>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
    </div>
  )
}

export default function StudentDashboard({
  courses = [],
  units = {},
  learningData,
  courseProgress,
  studyStreak,
  onCourse,
  onLesson,
  onCatalogue,
  onFeature
}) {
  const [counts, setCounts] = useState({
    mcqs: null,
    papers: null
  })

  const [toolsOpen, setToolsOpen] = useState(false)

  useEffect(() => {
    let active = true

    async function loadCounts() {
      try {
        const [questions, papers] = await Promise.all([
          supabase
            .from('smart_exam_course_catalogue')
            .select('mcq_count'),

          supabase
            .from('past_papers')
            .select('id', {
              count: 'exact',
              head: true
            })
            .eq('status', 'published')
        ])

        if (!active) return

        setCounts({
          mcqs: questions.error
            ? null
            : (questions.data || []).reduce(
                (total, row) =>
                  total + Number(row.mcq_count || 0),
                0
              ),

          papers: papers.error
            ? null
            : papers.count
        })

      } catch {
        // Learning navigation remains available
        // when catalogue statistics cannot load.
      }
    }

    loadCounts()

    return () => {
      active = false
    }
  }, [])

  const recent = (learningData?.recent || [])
    .map(item => ({
      ...item,
      course: courses.find(
        c => c.title === item.courseTitle
      )
    }))
    .filter(item =>
      item.course &&
      (units[item.courseTitle] || [])
        .includes(item.unit)
    )

  const latest = recent[0]

  const totals = courses.reduce(
    (result, course) => {
      const progress = courseProgress(course)

      result.units += progress.total
      result.done += progress.done

      if (
        progress.total > 0 &&
        progress.done === progress.total
      ) {
        result.completedCourses += 1
      }

      return result
    },
    {
      units: 0,
      done: 0,
      completedCourses: 0
    }
  )

  const overall = totals.units
    ? Math.round(
        totals.done / totals.units * 100
      )
    : 0

  const orderedCourses = [...courses].sort((a, b) => {
    const aRecent = recent.findIndex(
      item => item.courseTitle === a.title
    )

    const bRecent = recent.findIndex(
      item => item.courseTitle === b.title
    )

    const aRank = aRecent < 0 ? 9999 : aRecent
    const bRank = bRecent < 0 ? 9999 : bRecent

    return (
      aRank - bRank ||
      courseProgress(b).done -
        courseProgress(a).done ||
      a.title.localeCompare(b.title)
    )
  })

  const myCourses = orderedCourses.slice(0, 4)

  const stats = [
    {
      label: 'Courses',
      value: courses.length,
      icon: 'courses',
      action: onCatalogue
    },
    {
      label: 'Units',
      value: totals.units,
      icon: 'book',
      action: onCatalogue
    },
    {
      label: 'Practice Questions',
      value: counts.mcqs,
      icon: 'question',
      action: () => onFeature('exams')
    },
    {
      label: 'Past Papers',
      value: counts.papers,
      icon: 'papers',
      action: () => onFeature('pastpapers'),
      tour: 'pastpapers'
    }
  ]

  const actions = [
    ['exams', 'question', 'Practice MCQs'],
    ['pastpapers', 'papers', 'Open Past Papers']
  ]

  function resumeLesson() {
    if (latest) {
      onLesson(latest.course, latest.unit)
    } else {
      onCatalogue()
    }
  }

  return (
    <main
      className="psd"
      id="dashboard"
      data-periak-tour="learning-dashboard"
    >
      <header className="psd-heading">
        <h1>Dashboard</h1>
        <p>
          Your study hub for courses,
          practice and revision.
        </p>
      </header>

      <div className="psd-stats">
        {stats.map(stat => (
          <button
            type="button"
            key={stat.label}
            className="psd-stat"
            onClick={stat.action}
            data-periak-tour={stat.tour}
          >
            <span className="psd-icon-box">
              <WorkspaceIcon
                name={stat.icon}
                size={27}
              />
            </span>

            <span className="psd-stat-copy">
              <small>{stat.label}</small>
              <strong>
                {stat.value == null
                  ? '—'
                  : Number(stat.value)
                      .toLocaleString('en-KE')}
              </strong>
            </span>
          </button>
        ))}
      </div>

      <div className="psd-grid">

        <section className="psd-panel">
          <PanelHeading
            icon="play"
            title="Continue Learning"
            subtitle="Pick up where you left off."
          />

          {latest ? (
            <div className="psd-resume">
              <span className="psd-icon-box psd-book-box">
                <WorkspaceIcon name="book" size={30}/>
              </span>

              <div className="psd-resume-copy">
                <strong>{latest.courseTitle}</strong>
                <small>{latest.unit}</small>

                <div className="psd-progress-line">
                  <ProgressBar
                    percent={
                      courseProgress(latest.course).percent
                    }
                  />

                  <small>
                    {courseProgress(latest.course).percent}%
                  </small>
                </div>

                <small className="psd-muted">
                  Course completion
                </small>
              </div>

              <button
                type="button"
                className="psd-primary"
                onClick={resumeLesson}
              >
                <WorkspaceIcon name="play" size={16}/>
                Resume
              </button>
            </div>
          ) : (
            <div className="psd-empty">
              <WorkspaceIcon name="book" size={28}/>

              <div>
                <strong>Start learning</strong>
                <p>
                  Your latest studied lesson
                  will appear here.
                </p>
              </div>

              <button
                type="button"
                className="psd-primary"
                onClick={onCatalogue}
              >
                Browse courses
              </button>
            </div>
          )}
        </section>

        <section className="psd-panel">
          <PanelHeading
            icon="progress"
            title="Study Progress"
            subtitle="Your completion across available courses."
          />

          <div className="psd-study-progress">
            <div
              className="psd-ring"
              role="img"
              aria-label={`${overall}% of available units completed`}
              style={{
                '--psd-progress': `${overall}%`
              }}
            >
              <div>
                <strong>{overall}%</strong>
                <small>Overall</small>
              </div>
            </div>

            <div className="psd-progress-details">
              <div>
                <WorkspaceIcon name="check"/>
                <span>
                  <small>Units completed</small>
                  <strong>
                    {totals.done} / {totals.units}
                  </strong>
                </span>
              </div>

              <div>
                <WorkspaceIcon name="courses"/>
                <span>
                  <small>Courses completed</small>
                  <strong>
                    {totals.completedCourses} / {courses.length}
                  </strong>
                </span>
              </div>

              <div>
                <WorkspaceIcon name="planner"/>
                <span>
                  <small>Study streak</small>
                  <strong>
                    {studyStreak ?? '—'}
                    {studyStreak != null
                      ? Number(studyStreak) === 1
                        ? ' day'
                        : ' days'
                      : ''}
                  </strong>
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="psd-panel">
          <PanelHeading
            icon="courses"
            title="My Courses"
            subtitle="Your recent courses and study progress."
          />

          <div className="psd-course-list">
            {myCourses.map(course => {
              const progress = courseProgress(course)

              return (
                <button
                  type="button"
                  className="psd-course-row"
                  key={course.title}
                  onClick={() => onCourse(course)}
                >
                  <span className="psd-small-icon">
                    <WorkspaceIcon name="book" size={20}/>
                  </span>

                  <strong>{course.title}</strong>

                  <span className="psd-course-progress">
                    <ProgressBar
                      percent={progress.percent}
                    />
                    <small>{progress.percent}%</small>
                  </span>

                  <WorkspaceIcon name="chevron" size={16}/>
                </button>
              )
            })}

            {!myCourses.length && (
              <p className="psd-muted">
                No courses available.
              </p>
            )}
          </div>

          <button
            type="button"
            className="psd-text-button"
            data-periak-tour="courses"
            onClick={onCatalogue}
          >
            Explore all courses
            <WorkspaceIcon name="chevron" size={15}/>
          </button>
        </section>

        <section className="psd-panel">
          <PanelHeading
            icon="bolt"
            title="Quick Actions"
            subtitle="Essential study and revision tools."
          />

          <div className="psd-actions">
            {actions.map(([id, icon, title], i) => (
              <button
                type="button"
                key={id}
                data-periak-tour={id}
                className={
                  'psd-action' +
                  (i === 0 ? ' psd-action-primary' : '')
                }
                onClick={() => onFeature(id)}
              >
                <WorkspaceIcon name={icon} size={23}/>
                <strong>{title}</strong>
                <WorkspaceIcon name="chevron" size={17}/>
              </button>
            ))}

            <button
              type="button"
              className="psd-action"
              onClick={resumeLesson}
            >
              <WorkspaceIcon name="play" size={23}/>
              <strong>
                {latest ? 'Resume Lesson' : 'Start Learning'}
              </strong>
              <WorkspaceIcon name="chevron" size={17}/>
            </button>

            <button
              type="button"
              className="psd-action"
              aria-expanded={toolsOpen}
              onClick={() => setToolsOpen(v => !v)}
            >
              <WorkspaceIcon name="tools" size={23}/>
              <strong>Learning Tools</strong>
              <WorkspaceIcon
                name="down"
                size={17}
              />
            </button>

            {toolsOpen && (
              <div className="psd-tool-list">
                {[
                  ['clinical', 'clinical', 'Clinical Lab'],
                  ['simulator', 'simulator', 'Patient Simulator'],
                  ['tutor', 'tutor', 'Study Tutor'],
                  ['hub', 'hub', 'Knowledge Hub'],
                  ['planner', 'planner', 'Study Planner']
                ].map(([id, icon, title]) => (
                  <button
                    type="button"
                    className="psd-action"
                    key={id}
                    data-periak-tour={id}
                    onClick={() => onFeature(id)}
                  >
                    <WorkspaceIcon name={icon} size={20}/>
                    <strong>{title}</strong>
                    <WorkspaceIcon name="chevron" size={15}/>
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

      </div>
    </main>
  )
}
