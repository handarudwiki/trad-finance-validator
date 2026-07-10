/**
 * Document text extraction module.
 * - For PDFs: uses unpdf to extract text directly (works for text-based PDFs).
 *   If the PDF is scanned (yields little text), falls back to Tesseract OCR on images.
 * - For images: uses Tesseract OCR directly.
 */

import Tesseract from 'tesseract.js'
import { extractText, getDocumentProxy } from 'unpdf'

const MIN_TEXT_LENGTH = 50 // threshold to detect scanned/image-only PDFs

/**
 * Extracts text from a document buffer.
 * Handles both PDFs and images.
 */
export async function extractTextFromDocument(
  fileBuffer: Buffer,
  mimeType: string
): Promise<string> {
  if (mimeType === 'application/pdf') {
    return extractTextFromPDF(fileBuffer)
  }

  // For images, use Tesseract directly
  if (mimeType.startsWith('image/')) {
    return extractTextWithTesseract(fileBuffer)
  }

  throw new Error(`Unsupported mime type for OCR: ${mimeType}`)
}

/**
 * Extracts text from a PDF buffer.
 * First tries direct text extraction with unpdf.
 * If the PDF is scanned (minimal embedded text), falls back to Tesseract OCR.
 */
async function extractTextFromPDF(fileBuffer: Buffer): Promise<string> {
  // Try direct text extraction first (fast, works for text-based PDFs)
  try {
    const pdf = await getDocumentProxy(new Uint8Array(fileBuffer))
    const { text } = await extractText(pdf, { mergePages: true })

    if (text && text.trim().length >= MIN_TEXT_LENGTH) {
      return text
    }
  } catch {
    // If unpdf fails, fall through to Tesseract
  }

  // Scanned PDF or extraction failed - use Tesseract on the raw buffer
  // Tesseract.js can handle PDF files directly
  return extractTextWithTesseract(fileBuffer)
}

/**
 * Runs Tesseract OCR on an image or PDF buffer.
 */
async function extractTextWithTesseract(buffer: Buffer): Promise<string> {
  const result = await Tesseract.recognize(buffer, 'eng')
  const text = result.data.text

  if (!text || !text.trim()) {
    throw new Error('OCR produced empty text from document')
  }

  return text
}
