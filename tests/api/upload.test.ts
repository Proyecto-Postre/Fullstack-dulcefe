import { describe, it, expect } from 'vitest'
import { validateImageBuffer, MAX_IMAGE_SIZE_BYTES } from '../../server/utils/image-validator'

describe('Image Validator — Magic Bytes & Size Limits (PR-1d / §9.2 / §20.1 V9)', () => {
  it('debe rechazar archivos que superen los 2 MB (MAX_IMAGE_SIZE_BYTES)', () => {
    const fakeBuffer = new Uint8Array([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01])
    const oversizedLength = MAX_IMAGE_SIZE_BYTES + 1
    const result = validateImageBuffer(fakeBuffer, oversizedLength)

    expect(result.valid).toBe(false)
    expect(result.error?.code).toBe('FILE_TOO_LARGE')
  })

  it('debe rechazar buffers corruptos o menores a 12 bytes', () => {
    const tinyBuffer = new Uint8Array([0xFF, 0xD8])
    const result = validateImageBuffer(tinyBuffer, tinyBuffer.length)

    expect(result.valid).toBe(false)
    expect(result.error?.code).toBe('FILE_CORRUPTED')
  })

  it('debe validar exitosamente un archivo JPEG auténtico (FF D8 FF)', () => {
    const jpegBuffer = new Uint8Array([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01])
    const result = validateImageBuffer(jpegBuffer, jpegBuffer.length)

    expect(result.valid).toBe(true)
    expect(result.extension).toBe('jpg')
    expect(result.mimeType).toBe('image/jpeg')
  })

  it('debe validar exitosamente un archivo PNG auténtico (89 50 4E 47 0D 0A 1A 0A)', () => {
    const pngBuffer = new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D])
    const result = validateImageBuffer(pngBuffer, pngBuffer.length)

    expect(result.valid).toBe(true)
    expect(result.extension).toBe('png')
    expect(result.mimeType).toBe('image/png')
  })

  it('debe validar exitosamente un archivo WebP auténtico (RIFF....WEBP)', () => {
    const webpBuffer = new Uint8Array([
      0x52, 0x49, 0x46, 0x46, // RIFF
      0x24, 0x00, 0x00, 0x00, // file size
      0x57, 0x45, 0x42, 0x50  // WEBP
    ])
    const result = validateImageBuffer(webpBuffer, webpBuffer.length)

    expect(result.valid).toBe(true)
    expect(result.extension).toBe('webp')
    expect(result.mimeType).toBe('image/webp')
  })

  it('debe rechazar archivos ejecutables o scripts camuflados (ej. PHP, HTML, EXE)', () => {
    // Archivo PHP con cabecera <?php
    const phpBuffer = new Uint8Array([0x3C, 0x3F, 0x70, 0x68, 0x70, 0x20, 0x65, 0x63, 0x68, 0x6F, 0x20, 0x31])
    const result = validateImageBuffer(phpBuffer, phpBuffer.length)

    expect(result.valid).toBe(false)
    expect(result.error?.code).toBe('UNSUPPORTED_IMAGE_TYPE')
  })
})
