import { useEffect, useState } from 'react'
import { useBackHandler } from '../context/NavigationProvider'
import { supabase } from '../lib/supabase'
import './ControlCentre.css'
import Monetization from './Monetization'

const SECTIONS = [
  { id: 'overview', label: 'Overview' },
  { id: 'users', label: 'Users' },
  { id: 'courses', label: 'Courses & Units' },
  { id: 'materials', label: 'Learning Materials' },
  { id: 'exams', label: 'Examinations' },
  { id: 'results', label: 'Results & Analytics' },
  { id: 'announcements', label: 'Announcements' },
  { id: 'monetization', label: 'Monetization' }
]

export default function ControlCentre({ onClose }) {
  const [section, setSection] = useState('overview')
  const [sectionHistory, setSectionHistory] = useState([])
  const [profiles, setProfiles] = useState([])
  const [courses, setCourses] = useState([])
  const [announcements, setAnnouncements] = useState([])
  const [userSearch, setUserSearch] = useState('')
  const [userFilter, setUserFilter] = useState('all')
  const [showCourseForm, setShowCourseForm] = useState(false)
  const [courseTitle, setCourseTitle] = useState('')
  const [courseCode, setCourseCode] = useState('')
  const [description, setDescription] = useState('')
  const [programme, setProgramme] = useState('BSc Nursing')
  const [year, setYear] = useState('1')
  const [semester, setSemester] = useState('1')
  const [savingCourse, setSavingCourse] = useState(false)
  const [courseMessage, setCourseMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  function navigateSection(nextSection) {
    if (nextSection === section) return
    setSectionHistory(previous => [...previous, section])
    setSection(nextSection)
  }

  function handleSectionBack() {
    if (sectionHistory.length === 0) return false
    const previousSection = sectionHistory[sectionHistory.length - 1]
    setSectionHistory(previous => previous.slice(0, -1))
    setSection(previousSection)
    return true
  }

  useBackHandler(handleSectionBack, sectionHistory.length > 0, 30)

  async function loadDashboard() {
    setLoading(true)
    setError('')

    const results = await Promise.all([
      supabase.from('profiles')
        .select('id, full_name, username, email, phone_number, role, created_at')
        .order('created_at', { ascending: false }),
      supabase.from('courses')
        .select('id, title, code, status')
        .order('created_at', { ascending: false }),
      supabase.from('announcements')
        .select('id, title, audience, status, created_at')
        .order('created_at', { ascending: false })
    ])

    const failed = results.find(result => result.error)

    if (failed) {
      setError('Unable to load dashboard information. Check database permissions.')
    } else {
      setProfiles(results[0].data || [])
      setCourses(results[1].data || [])
      setAnnouncements(results[2].data || [])
    }

    setLoading(false)
  }

  useEffect(() => {
    loadDashboard()
  }, [])

  async function createCourse(event) {
    event.preventDefault()
    setCourseMessage('')

    if (!courseTitle.trim()) {
      setCourseMessage('Please enter the course title.')
      return
    }

    setSavingCourse(true)

    const { data: userData, error: userError } = await supabase.auth.getUser()

    if (userError || !userData.user) {
      setCourseMessage('Unable to identify the administrator. Please sign in again.')
      setSavingCourse(false)
      return
    }

    const { error: insertError } = await supabase
      .from('courses')
      .insert({
        title: courseTitle.trim(),
        code: courseCode.trim() || null,
        description: description.trim() || null,
        programme: programme.trim() || null,
        year: Number(year),
        semester: Number(semester),
        status: 'draft',
        created_by: userData.user.id
      })

    if (insertError) {
      setCourseMessage(`Course could not be created: ${insertError.message}`)
    } else {
      setCourseMessage('Course created successfully.')
      setCourseTitle('')
      setCourseCode('')
      setDescription('')
      setYear('1')
      setSemester('1')
      setShowCourseForm(false)
      await loadDashboard()
    }

    setSavingCourse(false)
  }

  const students = profiles.filter(user => user.role === 'student')
  const admins = profiles.filter(user => user.role === 'admin')

  const filteredUsers = profiles.filter(user => {
    const search = userSearch.trim().toLowerCase()
    const searchable = [
      user.full_name,
      user.username,
      user.email,
      user.phone_number
    ].filter(Boolean).join(' ').toLowerCase()
    const matchesSearch = searchable.includes(search)
    const matchesRole = userFilter === 'all' || user.role === userFilter
    return matchesSearch && matchesRole
  })

  return (
    <main className="control-centre">
      <header className="cc-header">
        <div>
          <span className="cc-eyebrow">PERIAK MANAGEMENT</span>
          <h1>Control Centre</h1>
          <p>Manage your nursing learning platform.</p>
        </div>
        <button onClick={onClose}>Back to Learning</button>
      </header>

      <nav className="cc-navigation">
        {SECTIONS.map(item => (
          <button
            key={item.id}
            className={section === item.id ? 'active' : ''}
            onClick={() => navigateSection(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {error && <p className="cc-error">{error}</p>}

      {loading ? (
        <p className="cc-empty">Loading Control Centre...</p>
      ) : (
        <section className="cc-content">
          {section === 'overview' && (
            <>
              <h2>Platform Overview</h2>
              <div className="cc-stats">
                <article><span>Total Users</span><strong>{profiles.length}</strong></article>
                <article><span>Students</span><strong>{students.length}</strong></article>
                <article><span>Administrators</span><strong>{admins.length}</strong></article>
                <article><span>Courses</span><strong>{courses.length}</strong></article>
              </div>
              <div className="cc-panel">
                <h3>Recent Announcements</h3>
                {announcements.length === 0
                  ? <p>No announcements have been created.</p>
                  : announcements.slice(0, 5).map(item => (
                    <p key={item.id}>{item.title} · {item.status}</p>
                  ))}
              </div>
            </>
          )}

          {section === 'users' && (
            <>
              <h2>User Management</h2>
              <div className="cc-user-tools">
                <input
                  type="search"
                  placeholder="Search name, username, email or phone..."
                  value={userSearch}
                  onChange={event => setUserSearch(event.target.value)}
                />
                <select
                  value={userFilter}
                  onChange={event => setUserFilter(event.target.value)}
                >
                  <option value="all">All users</option>
                  <option value="student">Students</option>
                  <option value="admin">Administrators</option>
                </select>
              </div>
              <p>Showing {filteredUsers.length} of {profiles.length} users</p>
              <div className="cc-table-wrap">
                <table className="cc-table">
                  <thead>
                    <tr>
                      <th>Full Name</th>
                      <th>Username</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Role</th>
                      <th>Date Registered</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(user => (
                      <tr key={user.id}>
                        <td>{user.full_name || 'Name not provided'}</td>
                        <td>{user.username ? `@${user.username}` : '—'}</td>
                        <td>{user.email || 'Not available'}</td>
                        <td>{user.phone_number || 'Not provided'}</td>
                        <td>{user.role}</td>
                        <td>{user.created_at
                          ? new Date(user.created_at).toLocaleDateString()
                          : 'Not available'}</td>
                      </tr>
                    ))}
                    {filteredUsers.length === 0 && (
                      <tr><td colSpan="6">No matching users found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {section === 'courses' && (
            <>
              <div className="cc-section-heading">
                <div>
                  <h2>Courses & Units</h2>
                  <p>Registered courses: {courses.length}</p>
                </div>
                <button onClick={() => {
                  setShowCourseForm(!showCourseForm)
                  setCourseMessage('')
                }}>
                  {showCourseForm ? 'Cancel' : '+ Add Course'}
                </button>
              </div>

              {courseMessage && <p className="cc-course-message">{courseMessage}</p>}

              {showCourseForm && (
                <form className="cc-course-form" onSubmit={createCourse}>
                  <h3>Create a New Course</h3>

                  <label>Course Title *</label>
                  <input
                    value={courseTitle}
                    onChange={event => setCourseTitle(event.target.value)}
                    placeholder="e.g. Medical-Surgical Nursing II"
                    required
                  />

                  <label>Course Code</label>
                  <input
                    value={courseCode}
                    onChange={event => setCourseCode(event.target.value)}
                    placeholder="e.g. NUR 204"
                  />

                  <label>Description</label>
                  <textarea
                    value={description}
                    onChange={event => setDescription(event.target.value)}
                    placeholder="Brief description of the course"
                    rows="3"
                  />

                  <label>Programme</label>
                  <input
                    value={programme}
                    onChange={event => setProgramme(event.target.value)}
                    placeholder="e.g. BSc Nursing"
                  />

                  <div className="cc-form-row">
                    <div>
                      <label>Year of Study</label>
                      <select value={year} onChange={event => setYear(event.target.value)}>
                        <option value="1">Year 1</option>
                        <option value="2">Year 2</option>
                        <option value="3">Year 3</option>
                        <option value="4">Year 4</option>
                      </select>
                    </div>
                    <div>
                      <label>Semester</label>
                      <select value={semester} onChange={event => setSemester(event.target.value)}>
                        <option value="1">Semester 1</option>
                        <option value="2">Semester 2</option>
                      </select>
                    </div>
                  </div>

                  <button type="submit" disabled={savingCourse}>
                    {savingCourse ? 'Creating Course...' : 'Save Course'}
                  </button>
                </form>
              )}

              <div className="cc-table-wrap">
                <table className="cc-table">
                  <thead>
                    <tr><th>Course</th><th>Code</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {courses.map(course => (
                      <tr key={course.id}>
                        <td>{course.title}</td>
                        <td>{course.code || '—'}</td>
                        <td>{course.status}</td>
                      </tr>
                    ))}
                    {courses.length === 0 && (
                      <tr><td colSpan="3">No courses have been created.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {section === 'monetization' && <Monetization />}

          {section === 'materials' && (
            <>
              <h2>Learning Materials</h2>
              <p>Learning resource management will be added here.</p>
            </>
          )}

          {section === 'exams' && (
            <>
              <h2>Examination Management</h2>
              <p>Examination and question-bank management will be added here.</p>
            </>
          )}

          {section === 'results' && (
            <>
              <h2>Results & Analytics</h2>
              <p>Student examination performance will be displayed here.</p>
            </>
          )}

          {section === 'announcements' && (
            <>
              <h2>Announcements</h2>
              <div className="cc-table-wrap">
                <table className="cc-table">
                  <thead><tr><th>Title</th><th>Audience</th><th>Status</th></tr></thead>
                  <tbody>
                    {announcements.map(item => (
                      <tr key={item.id}>
                        <td>{item.title}</td>
                        <td>{item.audience}</td>
                        <td>{item.status}</td>
                      </tr>
                    ))}
                    {announcements.length === 0 && (
                      <tr><td colSpan="3">No announcements have been created.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      )}

      <footer className="cc-footer">
        <button onClick={loadDashboard} disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh Dashboard'}
        </button>
      </footer>
    </main>
  )
}
