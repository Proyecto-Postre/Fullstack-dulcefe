export interface ImageValidationResult {
  valid: boolean
  extension?: 'jpg' | 'png' | 'webp'
  mimeType?: string
  error?: {
    code: string
    message: string
  }
}

export const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024 // 2 MB

/**
 * Validador estricto de imágenes mediante inspección de Magic Bytes binarios.
 * No confía en extensiones de archivo ni en headers Content-Type enviados por el cliente.
 * 
 * Firmas binarias soportadas:
 * - JPEG: FF D8 FF
 * - PNG:  89 50 4E 47 0D 0A 1A 0A
 * - WebP: 52 49 46 46 (RIFF) + 57 45 42 50 (WEBP)
 */
export function validateImageBuffer(buffer: Buffer | Uint8Array, totalSize: number): ImageValidationResult {
  // 1. Validar límite de tamaño (2 MB)
  if (totalSize > MAX_IMAGE_SIZE_BYTES) {
    return {
      valid: false,
      error: {
        code: 'FILE_TOO_LARGE',
        message: 'El archivo excede el tamaño máximo permitido de 2 MB.'
      }
    }
  }

  if (buffer.length < 12) {
    return {
      valid: false,
      error: {
        code: 'FILE_CORRUPTED',
        message: 'El archivo está dañado o es demasiado pequeño para ser una imagen válida.'
      }
    }
  }

  // 2. Verificar Magic Bytes de JPEG: FF D8 FF
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    return {
      valid: true,
      extension: 'jpg',
      mimeType: 'image/jpeg'
    }
  }

  // 3. Verificar Magic Bytes de PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4E &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0D &&
    buffer[5] === 0x0A &&
    buffer[6] === 0x1A &&
    buffer[7] === 0x0A
  ) {
    return {
      valid: true,
      extension: 'png',
      mimeType: 'image/png'
    }
  }

  // 4. Verificar Magic Bytes de WebP: "RIFF" en bytes 0-3 y "WEBP" en bytes 8-11
  // RIFF = 0x52, 0x49, 0x46, 0x46
  // WEBP = 0x57, 0x45, 0x42, 0x50
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return {
      valid: true,
      extension: 'webp',
      mimeType: 'image/webp'
    }
  }

  // Si no coincide con ninguna firma segura
  return {
    valid: false,
    error: {
      code: 'UNSUPPORTED_IMAGE_TYPE',
      message: 'Formato de imagen no permitido. Solo se aceptan archivos JPEG, PNG y WebP con firma válida.'
    }
  }
}
