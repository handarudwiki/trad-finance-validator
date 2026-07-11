/**
 * File storage utility using Supabase Storage.
 * Files are stored using server-generated UUID paths in a Supabase bucket.
 * Satisfies: Requirements 2.2, 2.3, 2.4, 2.5, 5.2, 5.3, 5.5, 15.2, 15.3
 */

import { randomUUID } from 'crypto'
import { createClient } from '@supabase/supabase-js'

/** Supabase Storage bucket name for document uploads */
const BUCKET_NAME = 'documents'

/**
 * Lazy-initialized Supabase client using service role key for server-side access.
 */
function getSupabase() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables')
  }
  return createClient(url, key)
}

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
 * Generates a UUID-based storage path.
 * The path does not contain the original filename, preventing path traversal
 * and filename inference attacks.
 */
export function generateStoragePath(): string {
  return `uploads/${randomUUID()}`
}

/**
 * Saves a file buffer to Supabase Storage at the given path.
 * Creates the bucket if it doesn't exist.
 */
export async function saveFile(buffer: Buffer, storagePath: string, mimeType?: string): Promise<void> {
  const supabase = getSupabase()

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(storagePath, buffer, {
      contentType: mimeType || 'application/octet-stream',
      upsert: true,
    })

  if (error) {
    throw new Error(`Failed to upload file to Supabase Storage: ${error.message}`)
  }
}

/**
 * Reads a file buffer from Supabase Storage at the given path.
 */
export async function readFile(storagePath: string): Promise<Buffer> {
  const supabase = getSupabase()

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .download(storagePath)

  if (error || !data) {
    throw new Error(`Failed to download file from Supabase Storage: ${error?.message || 'No data'}`)
  }

  const arrayBuffer = await data.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

/**
 * Deletes a file from Supabase Storage at the given path.
 */
export async function deleteFile(storagePath: string): Promise<void> {
  const supabase = getSupabase()

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([storagePath])

  if (error) {
    throw new Error(`Failed to delete file from Supabase Storage: ${error.message}`)
  }
}
