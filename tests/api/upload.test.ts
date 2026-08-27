import { describe, it, expect } from 'vitest'
import { validateImageBuffer } from '../../server/utils/image-validator'

describe('Upload Security — Magic Bytes & Size Validation (PR-1d / §18)', () => {
  it('debe aceptar una cabecera binaria válida de JPEG (FF D8 FF)', () => {
    // Buffer simulando un archivo JPEG válido
    const jpegBuffer = Buffer.from([
      0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01
    ])
    const result = validateImageBuffer(jpegBuffer)

    expect(result.valid).toBe(true)
    if (result.valid) {
      expect(result.mime).toBe('image/jpeg')
      expect(result.ext).toBe('jpg')
    }
  })

  it('debe aceptar una cabecera binaria válida de PNG (89 50 4E 47 0D 0A 1A 0A)', () => {
    // Buffer simulando un archivo PNG válido
    const pngBuffer = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D, 0x49
    ])
    const result = validateImageBuffer(pngBuffer)

    expect(result.valid).toBe(true)
    if (result.valid) {
      expect(result.mime).toBe('image/png')
      expect(result.ext).toBe('png')
    }
  })

  it('debe aceptar una cabecera binaria válida de WebP (RIFF....WEBP)', () => {
    // Buffer simulando un archivo WebP válido (RIFF en bytes 0-3 y WEBP en bytes 8-11)
    const webpBuffer = Buffer.from([
      0x52, 0x49, 0x46, 0x46, // R I F F
      0x24, 0x00, 0x00, 0x00, // tamaño
      0x57, 0x45, 0x42, 0x50, // W E B P
      0x56, 0x50, 0x38, 0x20  // VP8
    ])
    const result = validateImageBuffer(webpBuffer)

    expect(result.valid).toBe(true)
    if (result.valid) {
      expect(result.mime).toBe('image/webp')
      expect(result.ext).toBe('webp')
    }
  })

  it('debe rechazar un ejecutable .exe (cabecera MZ) aunque tenga nombre de imagen', () => {
    // Buffer de un binario Windows PE / DOS Executable
    const exeBuffer = Buffer.from([
      0x4D, 0x5A, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00, 0x04, 0x00, 0x00, 0x00, 0xFF
    ])
    const result = validateImageBuffer(exeBuffer)

    expect(result.valid).toBe(false)
    if (!result.valid) {
      expect(result.code).toBe('INVALID_FILE_TYPE')
    }
  })

  it('debe rechazar un script PHP o HTML camuflado como imagen', () => {
    const phpScriptBuffer = Buffer.from('<?php echo "malware"; ?>')
    const result = validateImageBuffer(phpScriptBuffer)

    expect(result.valid).toBe(false)
    if (!result.valid) {
      expect(result.code).toBe('INVALID_FILE_TYPE')
    }
  })

  it('debe rechazar un buffer vacío o truncado (< 12 bytes)', () => {
    const tinyBuffer = Buffer.from([0xFF, 0xD8])
    const result = validateImageBuffer(tinyBuffer)

    expect(result.valid).toBe(false)
    if (!result.valid) {
      expect(result.code).toBe('BUFFER_TOO_SMALL')
    }
  })
})
