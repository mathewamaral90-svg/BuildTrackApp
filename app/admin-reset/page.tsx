'use client'

import Link from 'next/link'
import { FormEvent, useState } from 'react'

export default function AdminResetPage() {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setLoading(true)

    const form = new FormData(event.currentTarget)
    const token = String(form.get('token') || '')
    const password = String(form.get('password') || '')
    const confirm = String(form.get('confirm') || '')

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      setLoading(false)
      return
    }

    if (password !== confirm) {
      setError('Passwords do not match.')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/admin-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Unable to reset the admin password.')
        return
      }

      setDone(true)
      event.currentTarget.reset()
    } catch {
      setError('Connection error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <main className="auth-wrap">
        <div className="auth-card">
          <h1>Admin password updated</h1>
          <p className="muted">
            The Mick_EvoAdmin password has been changed and all previous admin sessions were signed out.
          </p>
          <Link className="btn btn-primary" href="/login">Go to login</Link>
        </div>
      </main>
    )
  }

  return (
    <main className="auth-wrap">
      <div className="auth-card">
        <Link className="small-link" href="/login">← Back to login</Link>
        <h1>Admin reset</h1>
        <p className="muted">
          This protected setup page is for resetting the BuildTrack administrator account.
        </p>

        <form className="form" onSubmit={submit}>
          {error && <div className="error">{error}</div>}

          <label>
            Temporary reset key
            <input name="token" type="password" required autoComplete="off" />
          </label>

          <label>
            New admin password
            <input name="password" type="password" minLength={8} maxLength={200} required autoComplete="new-password" />
          </label>

          <label>
            Confirm new password
            <input name="confirm" type="password" minLength={8} maxLength={200} required autoComplete="new-password" />
          </label>

          <button className="btn btn-primary" disabled={loading}>
            {loading ? 'Updating…' : 'Reset admin password'}
          </button>
        </form>
      </div>
    </main>
  )
}
