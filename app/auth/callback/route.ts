/**
 * AUTH CALLBACK — Enterprise Brain
 *
 * Handles OAuth/magic-link redirects from Supabase.
 * Exchanges the one-time `code` for a persistent session cookie,
 * then redirects to /dashboard.
 */

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Respect the forwarded host header for Vercel / reverse-proxy environments
      const forwardedHost = request.headers.get('x-forwarded-host')

      if (process.env.NODE_ENV === 'development') {
        return NextResponse.redirect(`${origin}${next}`)
      }

      if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Exchange failed — show a simple error page (create app/auth/error/page.tsx if needed)
  return NextResponse.redirect(`${origin}/?error=auth_callback_failed`)
}
