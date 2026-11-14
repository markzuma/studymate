import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import './AdminDashboard.css'

export default function AdminDashboard({ onClose }) {
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadUsers() {
    setLoading(true)
    setError('')

    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, role, created_at')
      .order('created_at', { ascending: false })

    if (error) {
      setError('Unable to load users. Check administrator permissions.')
    } else {
      setProfiles(data || [])
    }

    setLoading(false)
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const students = profiles.filter(user => user.role === 'student')
  const admins = profiles.filter(user => user.role === 'admin')

  return (
    <main className="admin-dashboard">
      <header className="admin-header">
        <div>
          <span className="admin-eyebrow">PERIAK MANAGEMENT</span>
          <h1>Administrator Dashboard</h1>
          <p>Manage and monitor your nursing learning platform.</p>
        </div>
        <button className="admin-close" onClick={onClose}>
          Back to Learning
        </button>
      </header>

      <section className="admin-stats">
        <article className="admin-stat">
          <span>Total Users</span>
          <strong>{profiles.length}</strong>
        </article>
        <article className="admin-stat">
          <span>Students</span>
          <strong>{students.length}</strong>
        </article>
        <article className="admin-stat">
          <span>Administrators</span>
          <strong>{admins.length}</strong>
        </article>
      </section>

      <section className="admin-panel">
        <div className="admin-panel-heading">
          <div>
            <h2>Registered Users</h2>
            <p>Accounts registered on PERIAK.</p>
          </div>
          <button onClick={loadUsers} disabled={loading}>
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        {error && <p className="admin-error">{error}</p>}

        {loading ? (
          <p className="admin-empty">Loading registered users...</p>
        ) : profiles.length === 0 ? (
          <p className="admin-empty">No registered users found.</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Full Name</th>
                  <th>Role</th>
                  <th>Date Registered</th>
                </tr>
              </thead>
              <tbody>
                {profiles.map(user => (
                  <tr key={user.id}>
                    <td>{user.full_name || 'Name not provided'}</td>
                    <td>
                      <span className={`admin-role ${user.role}`}>
                        {user.role}
                      </span>
                    </td>
                    <td>
                      {user.created_at
                        ? new Date(user.created_at).toLocaleDateString()
                        : 'Not available'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  )
}
