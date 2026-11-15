import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import './ProfileSettings.css'

export default function ProfileSettings({ user, onClose }) {
  const [profile, setProfile] = useState(null)
  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function loadProfile() {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, username, email, phone_number, role, created_at')
        .eq('id', user.id)
        .single()

      if (!active) return

      if (error) {
        setError('Unable to load your profile. Please try again.')
      } else {
        setProfile(data)
        setFullName(data.full_name || '')
        setUsername(data.username || '')
        setPhoneNumber(data.phone_number || '')
      }

      setLoading(false)
    }

    loadProfile()
    return () => { active = false }
  }, [user.id])

  function clearMessages() {
    setMessage('')
    setError('')
  }

  async function saveProfile(event) {
    event.preventDefault()
    clearMessages()

    const cleanName = fullName.trim()
    const cleanUsername = username.trim().toLowerCase()
    const cleanPhone = phoneNumber.trim()

    if (!cleanName) {
      setError('Please enter your full name.')
      return
    }

    if (!/^[a-z0-9._]{3,24}$/.test(cleanUsername)) {
      setError('Username must be 3–24 characters using letters, numbers, dots or underscores.')
      return
    }

    if (cleanPhone.length > 25) {
      setError('Please enter a valid phone number.')
      return
    }

    setSaving(true)

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          full_name: cleanName,
          username: cleanUsername,
          phone_number: cleanPhone || null
        })
        .eq('id', user.id)
        .select('full_name, username, email, phone_number, role, created_at')
        .single()

      if (error) {
        if (error.code === '23505') {
          throw new Error('That username is already taken. Please choose another.')
        }
        if (error.code === '23514') {
          throw new Error('Your username format is invalid.')
        }
        throw error
      }

      setProfile(data)
      setMessage('Your profile has been updated successfully.')
    } catch (err) {
      setError(err.message || 'Unable to update your profile.')
    } finally {
      setSaving(false)
    }
  }

  async function changePassword(event) {
    event.preventDefault()
    clearMessages()

    if (!currentPassword) {
      setError('Enter your current password.')
      return
    }

    if (newPassword.length < 8) {
      setError('Your new password must contain at least 8 characters.')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('The new passwords do not match.')
      return
    }

    if (newPassword === currentPassword) {
      setError('Choose a password different from your current password.')
      return
    }

    if (!user.email) {
      setError('Your account has no email address for password verification.')
      return
    }

    setChangingPassword(true)

    try {
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword
      })

      if (verifyError) {
        throw new Error('Your current password is incorrect.')
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (updateError) throw updateError

      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setMessage('Your password has been changed successfully.')
    } catch (err) {
      setError(err.message || 'Unable to change your password.')
    } finally {
      setChangingPassword(false)
    }
  }

  if (loading) {
    return (
      <div className="profile-overlay">
        <section className="profile-panel">
          <p>Loading your account settings...</p>
        </section>
      </div>
    )
  }

  return (
    <div className="profile-overlay" onMouseDown={e => {
      if (e.target === e.currentTarget) onClose()
    }}>
      <section className="profile-panel" role="dialog"
        aria-modal="true" aria-labelledby="profile-title">

        <header className="profile-header">
          <div>
            <span className="profile-eyebrow">YOUR PERIAK ACCOUNT</span>
            <h2 id="profile-title">Profile & Security</h2>
            <p>Manage your personal information and account security.</p>
          </div>
          <button className="profile-close" onClick={onClose}
            aria-label="Close profile settings">×</button>
        </header>

        <div className="profile-identity">
          <div className="profile-avatar">
            {(profile?.full_name || user.email || 'S').charAt(0).toUpperCase()}
          </div>
          <div>
            <strong>{profile?.full_name || 'PERIAK Student'}</strong>
            <span>@{profile?.username || 'username not set'}</span>
            <small>{profile?.role === 'admin' ? 'Administrator' : 'Student account'}</small>
          </div>
        </div>

        {error && <div className="profile-alert profile-error" role="alert">{error}</div>}
        {message && <div className="profile-alert profile-success" role="status">{message}</div>}

        <form className="profile-section" onSubmit={saveProfile}>
          <h3>Personal information</h3>
          <p>Keep your details accurate and up to date.</p>

          <label>
            Full name
            <input value={fullName}
              onChange={e => setFullName(e.target.value)}
              maxLength={100} autoComplete="name" required />
          </label>

          <label>
            Username
            <input value={username}
              onChange={e => setUsername(e.target.value)}
              minLength={3} maxLength={24}
              pattern="[A-Za-z0-9._]{3,24}"
              autoComplete="username" required />
            <small>3–24 characters. Letters, numbers, dots and underscores only.</small>
          </label>

          <label>
            Phone number <span className="profile-optional">Optional</span>
            <input type="tel" value={phoneNumber}
              onChange={e => setPhoneNumber(e.target.value)}
              maxLength={25} autoComplete="tel"
              placeholder="e.g. 07XX XXX XXX" />
          </label>

          <label>
            Registered email
            <input type="email" value={profile?.email || user.email || ''}
              readOnly disabled />
            <small>Email changes require a separate verification process.</small>
          </label>

          <button className="profile-primary" type="submit" disabled={saving}>
            {saving ? 'Saving profile...' : 'Save profile changes'}
          </button>
        </form>

        <form className="profile-section" onSubmit={changePassword}>
          <h3>Change password</h3>
          <p>Verify your current password before setting a new one.</p>

          <label>
            Current password
            <input type="password" value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              autoComplete="current-password" required />
          </label>

          <label>
            New password
            <input type="password" value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              minLength={8} autoComplete="new-password" required />
            <small>Use at least 8 characters.</small>
          </label>

          <label>
            Confirm new password
            <input type="password" value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              minLength={8} autoComplete="new-password" required />
          </label>

          <button className="profile-primary" type="submit"
            disabled={changingPassword}>
            {changingPassword ? 'Updating password...' : 'Update password'}
          </button>
        </form>

        <div className="profile-section profile-account-info">
          <h3>Account information</h3>
          <div><span>Account type</span><strong>{profile?.role || 'Student'}</strong></div>
          <div><span>Registration date</span><strong>
            {profile?.created_at
              ? new Date(profile.created_at).toLocaleDateString()
              : 'Not available'}
          </strong></div>
          <div><span>Account email</span><strong>{profile?.email || user.email}</strong></div>
        </div>

        <footer className="profile-footer">
          <button onClick={onClose}>Done</button>
        </footer>
      </section>
    </div>
  )
}
