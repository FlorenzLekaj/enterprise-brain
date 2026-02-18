'use client'

/**
 * LOGIN PAGE — Enterprise Brain
 * Industrial Design: Black background, white text, #0066FF accent.
 * Simple email/password login via Supabase Auth.
 */

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
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
        setError('Ungültige E-Mail-Adresse oder Passwort. Bitte erneut versuchen.')
        return
      }

      // Redirect to dashboard — middleware ensures session is valid
      router.push('/dashboard')
      router.refresh()
    } catch {
      setError('Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* ── Brand Header ── */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-3 mb-3">
            {/* Blue square logo mark */}
            <div className="w-7 h-7 bg-[#0066FF] rounded-[3px]" aria-hidden="true" />
            <span className="text-white text-2xl font-bold tracking-tight">
              Enterprise Brain
            </span>
          </div>
          <p className="text-zinc-500 text-sm tracking-wide uppercase">
            Firmenwissen · Präzise · Sofort
          </p>
        </div>

        {/* ── Login Card ── */}
        <div className="bg-[#111111] border border-zinc-800 rounded-xl p-8">
          <h1 className="text-white text-lg font-semibold mb-6">Anmelden</h1>

          <form onSubmit={handleLogin} className="space-y-5" noValidate>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-zinc-400 text-xs font-medium uppercase tracking-wider mb-2"
              >
                E-Mail
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="name@firma.de"
                className="w-full bg-[#1A1A1A] border border-zinc-700 rounded-lg px-4 py-3 text-white text-sm placeholder-zinc-600
                           focus:outline-none focus:border-[#0066FF] focus:ring-1 focus:ring-[#0066FF]
                           transition-colors duration-150"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-zinc-400 text-xs font-medium uppercase tracking-wider mb-2"
              >
                Passwort
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full bg-[#1A1A1A] border border-zinc-700 rounded-lg px-4 py-3 text-white text-sm placeholder-zinc-600
                           focus:outline-none focus:border-[#0066FF] focus:ring-1 focus:ring-[#0066FF]
                           transition-colors duration-150"
              />
            </div>

            {/* Error message */}
            {error && (
              <div
                role="alert"
                className="bg-red-950/60 border border-red-800 rounded-lg px-4 py-3 text-red-400 text-sm"
              >
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0066FF] hover:bg-[#0055DD] active:bg-[#0044CC]
                         disabled:bg-zinc-700 disabled:cursor-not-allowed
                         text-white font-semibold py-3 px-4 rounded-lg text-sm
                         transition-colors duration-150"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Anmelden…
                </span>
              ) : (
                'Anmelden'
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-zinc-700 text-xs mt-8">
          © {new Date().getFullYear()} Enterprise Brain. Alle Rechte vorbehalten.
        </p>
      </div>
    </main>
  )
}
