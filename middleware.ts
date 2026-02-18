import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Middleware: Runs on every request (except static assets).
 * - Refreshes the Supabase session cookie
 * - Redirects unauthenticated users to /
 * - Redirects authenticated users away from the login page to /dashboard
 */
export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setAll(cookiesToSet: any[]) {
          // Apply cookies to the request (for downstream route handlers)
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          // Create a fresh response with the updated cookies
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Do not add any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make the session invalid.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Guard: send unauthenticated users to login
  if (
    !user &&
    pathname !== '/' &&
    !pathname.startsWith('/auth') &&
    !pathname.startsWith('/api')
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  // Convenience: send logged-in users straight to dashboard
  if (user && pathname === '/') {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    // Run on everything except Next.js internals and static files
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
