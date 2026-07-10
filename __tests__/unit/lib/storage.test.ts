import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { rm, readFile as fsReadFile, stat } from 'fs/promises'
import { join } from 'path'
import {
  ALLOWED_MIME_TYPES,
  isAllowedMimeType,
  generateStoragePath,
  saveFile,
  readFile,
} from '@/lib/storage'

describe('lib/storage', () => {
  const TEST_STORAGE_PATH = './test-uploads-tmp'

  beforeEach(() => {
    process.env.STORAGE_PATH = TEST_STORAGE_PATH
  })

  afterEach(async () => {
    // Clean up test files
    try {
      await rm(TEST_STORAGE_PATH, { recursive: true, force: true })
    } catch {
      // ignore if doesn't exist
    }
  })

  describe('ALLOWED_MIME_TYPES', () => {
    it('should include PDF, JPEG, PNG, and TIFF', () => {
      expect(ALLOWED_MIME_TYPES).toContain('application/pdf')
      expect(ALLOWED_MIME_TYPES).toContain('image/jpeg')
      expect(ALLOWED_MIME_TYPES).toContain('image/png')
      expect(ALLOWED_MIME_TYPES).toContain('image/tiff')
    })

    it('should contain exactly 4 entries', () => {
      expect(ALLOWED_MIME_TYPES).toHaveLength(4)
    })
  })

  describe('isAllowedMimeType', () => {
    it('should return true for allowed MIME types', () => {
      expect(isAllowedMimeType('application/pdf')).toBe(true)
      expect(isAllowedMimeType('image/jpeg')).toBe(true)
      expect(isAllowedMimeType('image/png')).toBe(true)
      expect(isAllowedMimeType('image/tiff')).toBe(true)
    })

    it('should return false for disallowed MIME types', () => {
      expect(isAllowedMimeType('text/plain')).toBe(false)
      expect(isAllowedMimeType('application/json')).toBe(false)
      expect(isAllowedMimeType('image/gif')).toBe(false)
      expect(isAllowedMimeType('image/svg+xml')).toBe(false)
      expect(isAllowedMimeType('application/octet-stream')).toBe(false)
      expect(isAllowedMimeType('')).toBe(false)
    })
  })

  describe('generateStoragePath', () => {
    it('should return a path under STORAGE_PATH', () => {
      const path = generateStoragePath()
      expect(path.startsWith(TEST_STORAGE_PATH + '/')).toBe(true)
    })

    it('should contain a UUID pattern', () => {
      const path = generateStoragePath()
      const filename = path.replace(TEST_STORAGE_PATH + '/', '')
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      expect(filename).toMatch(uuidRegex)
    })

    it('should generate unique paths on each call', () => {
      const path1 = generateStoragePath()
      const path2 = generateStoragePath()
      expect(path1).not.toEqual(path2)
    })

    it('should use default ./uploads if STORAGE_PATH is not set', () => {
      delete process.env.STORAGE_PATH
      const path = generateStoragePath()
      expect(path.startsWith('./uploads/')).toBe(true)
    })
  })

  describe('saveFile', () => {
    it('should write a buffer to the specified path', async () => {
      const content = Buffer.from('test file content')
      const storagePath = join(TEST_STORAGE_PATH, 'test-file')

      await saveFile(content, storagePath)

      const result = await fsReadFile(storagePath)
      expect(result).toEqual(content)
    })

    it('should create parent directories recursively', async () => {
      const content = Buffer.from('nested content')
      const storagePath = join(TEST_STORAGE_PATH, 'nested', 'deep', 'file')

      await saveFile(content, storagePath)

      const result = await fsReadFile(storagePath)
      expect(result).toEqual(content)
    })
  })

  describe('readFile', () => {
    it('should read a file buffer from the specified path', async () => {
      const content = Buffer.from('read me back')
      const storagePath = join(TEST_STORAGE_PATH, 'readable-file')

      await saveFile(content, storagePath)
      const result = await readFile(storagePath)

      expect(result).toEqual(content)
    })

    it('should throw if the file does not exist', async () => {
      await expect(readFile(join(TEST_STORAGE_PATH, 'non-existent'))).rejects.toThrow()
    })
  })
})
