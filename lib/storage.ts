/**
 * File storage utility for secure document storage.
 * Files are stored using server-generated UUID paths outside of public/.
 * Satisfies: Requirements 2.2, 2.3, 2.4, 2.5, 5.2, 5.3, 5.5, 15.2, 15.3
 */

import { randomUUID } from 'crypto'
import { mkdir, writeFile, readFile as fsReadFile } from 'fs/promises'
import { dirname } from 'path'

/**
 * Allowed MIME types for document uploads.
 * Accepts PDF, JPEG, PNG, and TIFF formats.
 */
export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/tiff',
] as const

/**
 * Checks whether a given MIME type is in the allowed set.
 */
export function isAllowedMimeType(mimeType: string): boolean {
  return (ALLOWED_MIME_TYPES as readonly string[]).includes(mimeType)
}

/**
 * Generates a UUID-based storage path under STORAGE_PATH.
 * The path does not contain the original filename, preventing path traversal
 * and filename inference attacks.
 */
export function generateStoragePath(): string {
  const storagePath = process.env.STORAGE_PATH || './uploads'
  return `${storagePath}/${randomUUID()}`
}

/**
 * Saves a file buffer to the given storage path.
 * Creates parent directories recursively if they don't exist.
 */
export async function saveFile(buffer: Buffer, storagePath: string): Promise<void> {
  await mkdir(dirname(storagePath), { recursive: true })
  await writeFile(storagePath, buffer)
}

/**
 * Reads a file buffer from the given storage path.
 */
export async function readFile(storagePath: string): Promise<Buffer> {
  return fsReadFile(storagePath)
}
