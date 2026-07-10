// middleware.ts — Auth disabled for development
// Re-enable when authentication is needed

import { NextResponse, type NextRequest } from 'next/server'

export function middleware(_request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: '/api/:path*',
}
