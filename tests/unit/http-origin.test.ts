import { describe, it, expect } from 'vitest'
import { validateRequestOrigin } from '../../server/utils/http-origin'
import type { H3Event } from 'h3'

function mockEventWithOrigin(origin?: string): H3Event {
  return {
    node: {
      req: {
        headers: origin ? { origin } : {}
      }
    }
  } as unknown as H3Event
}

describe('Validación de Origen HTTP (server/utils/http-origin.ts)', () => {
  it('permite peticiones sin cabecera origin (curl o llamadas directas)', () => {
    const event = mockEventWithOrigin(undefined)
    expect(() => validateRequestOrigin(event, 'req-test-1')).not.toThrow()
  })

  it('permite desarrollo local en localhost con cualquier puerto (3000, 3001, 3002)', () => {
    const event3000 = mockEventWithOrigin('http://localhost:3000')
    const event3002 = mockEventWithOrigin('http://localhost:3002')
    const eventCustom = mockEventWithOrigin('http://localhost:8080')

    expect(() => validateRequestOrigin(event3000, 'req-test-2')).not.toThrow()
    expect(() => validateRequestOrigin(event3002, 'req-test-3')).not.toThrow()
    expect(() => validateRequestOrigin(eventCustom, 'req-test-4')).not.toThrow()
  })

  it('permite desarrollo local con 127.0.0.1 y cualquier puerto', () => {
    const event127 = mockEventWithOrigin('http://127.0.0.1:3002')
    expect(() => validateRequestOrigin(event127, 'req-test-5')).not.toThrow()
  })

  it('permite dominios oficiales desplegados en vercel.app', () => {
    const eventVercel = mockEventWithOrigin('https://dulce-fe-demo.vercel.app')
    expect(() => validateRequestOrigin(eventVercel, 'req-test-6')).not.toThrow()
  })

  it('rechaza orígenes externos maliciosos o no autorizados con FORBIDDEN_ORIGIN', () => {
    const maliciousEvent = mockEventWithOrigin('http://evil-attacker.com')
    expect(() => validateRequestOrigin(maliciousEvent, 'req-test-7')).toThrowError(/FORBIDDEN_ORIGIN/)
  })
})
