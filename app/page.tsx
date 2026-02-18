'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState<string | null>(null)
  const [loading, setLoading]   = useState(false)
  const router   = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })
      if (authError) {
        setError('Ungültige E-Mail-Adresse oder Passwort.')
        return
      }
      router.push('/dashboard')
      router.refresh()
    } catch {
      setError('Ein unerwarteter Fehler ist aufgetreten.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main style={{ minHeight: '100vh', background: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 20px', fontFamily: "-apple-system,BlinkMacSystemFont,'SF Pro Display','Helvetica Neue',sans-serif" }}>

      {/* ── Brand ── */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 40 }}>
        <div style={{ width: 68, height: 68, borderRadius: 22, background: 'linear-gradient(145deg,#0071e3,#34aadc)', boxShadow: '0 8px 32px rgba(0,113,227,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
          </svg>
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-0.5px', color: '#1d1d1f', margin: 0 }}>Enterprise Brain</h1>
        <p style={{ fontSize: 15, color: '#6e6e73', marginTop: 6 }}>Melden Sie sich an, um fortzufahren</p>
      </div>

      {/* ── Form card ── */}
      <div style={{ width: '100%', maxWidth: 400, background: '#f5f5f7', borderRadius: 20, padding: '32px 28px' }}>
        <form onSubmit={handleLogin} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#1d1d1f', marginBottom: 7 }}>E-Mail</label>
            <input
              type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="name@firma.de"
              style={{ width: '100%', background: '#fff', border: '1.5px solid rgba(0,0,0,0.1)', borderRadius: 12, padding: '13px 16px', fontSize: 15, color: '#1d1d1f', outline: 'none', fontFamily: 'inherit' }}
              onFocus={e => { e.target.style.borderColor = '#0071e3'; e.target.style.boxShadow = '0 0 0 3px rgba(0,113,227,0.15)' }}
              onBlur={e  => { e.target.style.borderColor = 'rgba(0,0,0,0.1)'; e.target.style.boxShadow = 'none' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#1d1d1f', marginBottom: 7 }}>Passwort</label>
            <input
              type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••"
              style={{ width: '100%', background: '#fff', border: '1.5px solid rgba(0,0,0,0.1)', borderRadius: 12, padding: '13px 16px', fontSize: 15, color: '#1d1d1f', outline: 'none', fontFamily: 'inherit' }}
              onFocus={e => { e.target.style.borderColor = '#0071e3'; e.target.style.boxShadow = '0 0 0 3px rgba(0,113,227,0.15)' }}
              onBlur={e  => { e.target.style.borderColor = 'rgba(0,0,0,0.1)'; e.target.style.boxShadow = 'none' }}
            />
          </div>

          {error && (
            <div style={{ background: '#fff0f0', border: '1px solid rgba(255,59,48,0.2)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#ff3b30' }}>
              {error}
            </div>
          )}

          <button
            type="submit" disabled={loading}
            style={{ width: '100%', marginTop: 4, background: loading ? '#aeaeb2' : '#0071e3', color: '#fff', border: 'none', borderRadius: 12, padding: '14px 0', fontSize: 15, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', letterSpacing: '-0.1px', boxShadow: loading ? 'none' : '0 2px 10px rgba(0,113,227,0.25)', fontFamily: 'inherit' }}
            onMouseEnter={e => { if (!loading) (e.target as HTMLElement).style.background = '#0077ed' }}
            onMouseLeave={e => { if (!loading) (e.target as HTMLElement).style.background = '#0071e3' }}
          >
            {loading
              ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.35)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                  Anmelden…
                </span>
              : 'Anmelden'}
          </button>

        </form>
      </div>

      <p style={{ marginTop: 36, fontSize: 12, color: '#aeaeb2' }}>© {new Date().getFullYear()} Enterprise Brain</p>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </main>
  )
}
