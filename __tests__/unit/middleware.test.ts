import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { middleware, config } from '@/middleware'

/**
 * Helper to create a valid HMAC-SHA256 signed session cookie.
 * Cookie format: payload.hexSignature
 */
async function createSignedSession(
  payload: string,
  secret: string,
): Promise<string> {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const signatureBytes = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(payload),
  )
  const signature = Array.from(new Uint8Array(signatureBytes))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
  return `${payload}.${signature}`
}

function createRequest(url: string, sessionCookie?: string): NextRequest {
  const req = new NextRequest(new URL(url, 'http://localhost:3000'))
  if (sessionCookie) {
    req.cookies.set('session', sessionCookie)
  }
  return req
}

describe('Auth Middleware', () => {
  const TEST_SECRET = 'test-session-secret-for-unit-tests'

  beforeEach(() => {
    vi.stubEnv('SESSION_SECRET', TEST_SECRET)
  })

  describe('config.matcher', () => {
    it('should match /api/:path* routes', () => {
      expect(config.matcher).toBe('/api/:path*')
    })
  })

  describe('requests without session cookie', () => {
    it('should return 401 when session cookie is missing', async () => {
      const req = createRequest('http://localhost:3000/api/transactions')
      const res = await middleware(req)

      expect(res.status).toBe(401)
      const body = await res.json()
      expect(body).toEqual({ error: 'Unauthorized' })
    })
  })

  describe('requests with invalid session cookie', () => {
    it('should return 401 when session cookie has no dot separator', async () => {
      const req = createRequest(
        'http://localhost:3000/api/transactions',
        'invalid-no-dot',
      )
      const res = await middleware(req)

      expect(res.status).toBe(401)
      const body = await res.json()
      expect(body).toEqual({ error: 'Unauthorized' })
    })

    it('should return 401 when session cookie has empty payload', async () => {
      const req = createRequest(
        'http://localhost:3000/api/transactions',
        '.somesignature',
      )
      const res = await middleware(req)

      expect(res.status).toBe(401)
      const body = await res.json()
      expect(body).toEqual({ error: 'Unauthorized' })
    })

    it('should return 401 when session cookie has empty signature', async () => {
      const req = createRequest(
        'http://localhost:3000/api/transactions',
        'somepayload.',
      )
      const res = await middleware(req)

      expect(res.status).toBe(401)
      const body = await res.json()
      expect(body).toEqual({ error: 'Unauthorized' })
    })

    it('should return 401 when signature is incorrect', async () => {
      const req = createRequest(
        'http://localhost:3000/api/transactions',
        'mypayload.invalidsignaturehex',
      )
      const res = await middleware(req)

      expect(res.status).toBe(401)
      const body = await res.json()
      expect(body).toEqual({ error: 'Unauthorized' })
    })

    it('should return 401 when signed with a different secret', async () => {
      const session = await createSignedSession('user123', 'wrong-secret')
      const req = createRequest(
        'http://localhost:3000/api/transactions',
        session,
      )
      const res = await middleware(req)

      expect(res.status).toBe(401)
      const body = await res.json()
      expect(body).toEqual({ error: 'Unauthorized' })
    })
  })

  describe('requests with valid session cookie', () => {
    it('should pass through when session is properly signed', async () => {
      const session = await createSignedSession('user123', TEST_SECRET)
      const req = createRequest(
        'http://localhost:3000/api/transactions',
        session,
      )
      const res = await middleware(req)

      // NextResponse.next() returns a response that is not a JSON error
      expect(res.status).toBe(200)
      expect(res.headers.get('x-middleware-next')).toBe('1')
    })

    it('should pass through for nested API paths', async () => {
      const session = await createSignedSession(
        'admin-user',
        TEST_SECRET,
      )
      const req = createRequest(
        'http://localhost:3000/api/transactions/abc123/report',
        session,
      )
      const res = await middleware(req)

      expect(res.status).toBe(200)
      expect(res.headers.get('x-middleware-next')).toBe('1')
    })

    it('should handle payload with dots in it', async () => {
      // Payload itself contains a dot - should use lastIndexOf
      const payload = 'user.data.here'
      const session = await createSignedSession(payload, TEST_SECRET)
      const req = createRequest(
        'http://localhost:3000/api/transactions',
        session,
      )
      const res = await middleware(req)

      expect(res.status).toBe(200)
      expect(res.headers.get('x-middleware-next')).toBe('1')
    })
  })

  describe('SESSION_SECRET not configured', () => {
    it('should return 401 when SESSION_SECRET is empty', async () => {
      vi.stubEnv('SESSION_SECRET', '')
      const req = createRequest(
        'http://localhost:3000/api/transactions',
        'payload.signature',
      )
      const res = await middleware(req)

      expect(res.status).toBe(401)
      const body = await res.json()
      expect(body).toEqual({ error: 'Unauthorized' })
    })
  })
})
