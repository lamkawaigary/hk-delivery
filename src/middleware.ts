import { NextRequest, NextResponse } from 'next/server'

export function middleware(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith('/admin')) {
    const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL
    const userEmail = req.cookies.get('user_email')?.value
    if (adminEmail && userEmail !== adminEmail) {
      return NextResponse.redirect(new URL('/', req.url))
    }
  }
  return NextResponse.next()
}

export const config = { matcher: ['/admin/:path*'] }
