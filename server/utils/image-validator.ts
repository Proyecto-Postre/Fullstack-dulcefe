export interface ImageValidationSuccess {
  valid: true
  mime: 'image/jpeg' | 'image/png' | 'image/webp'
  ext: 'jpg' | 'png' | 'webp'
}

export interface ImageValidationFailure {
  valid: false
  code: 'BUFFER_TOO_SMALL' | 'INVALID_FILE_TYPE'
  error: string
}

export type ImageValidationResult = ImageValidationSuccess | ImageValidationFailure

/**
 * Validador de firmas binarias reales (Magic Bytes).
 * Cero confianza en extensiones o headers HTTP enviados por el navegador.
 * 
 * - JPEG: FF D8 FF
 * - PNG:  89 50 4E 47 0D 0A 1A 0A
 * - WebP: RIFF [4 bytes] WEBP
 */
export function validateImageBuffer(buffer: Uint8Array | Buffer | null | undefined): ImageValidationResult {
  if (!buffer || buffer.length < 12) {
    return {
      valid: false,
      code: 'BUFFER_TOO_SMALL',
      error: 'El archivo adjunto es demasiado pequeño o está vacío.'
    }
  }

  // 1. JPEG / JPG: FF D8 FF
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    return { valid: true, mime: 'image/jpeg', ext: 'jpg' }
  }

  // 2. PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47 &&
    buffer[4] === 0x0D && buffer[5] === 0x0A && buffer[6] === 0x1A && buffer[7] === 0x0A
  ) {
    return { valid: true, mime: 'image/png', ext: 'png' }
  }

  // 3. WebP: RIFF (bytes 0-3) y WEBP (bytes 8-11)
  if (
    buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
    buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
  ) {
    return { valid: true, mime: 'image/webp', ext: 'webp' }
  }

  return {
    valid: false,
    code: 'INVALID_FILE_TYPE',
    error: 'Formato de imagen no permitido. Solo se aceptan archivos JPEG, PNG o WebP auténticos.'
  }
}
