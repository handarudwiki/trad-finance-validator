/**
 * Source document extraction service.
 * Pipeline: Tesseract OCR → LLM structured mapping (Gemini → OpenRouter → Grok fallback)
 * Satisfies: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6
 */

import { ExtractedLCFieldsSchema, type ExtractedLCFields } from '../../schema/extraction'
import { LC_EXTRACTION_PROMPT } from './prompts/lcExtractionPrompt'
import { SKBDN_EXTRACTION_PROMPT } from './prompts/skbdnExtractionPrompt'
import { ExtractionError } from './ExtractionError'
import { extractTextFromDocument } from './ocr'
import { extractWithLLMFallback } from './llmFallback'

/**
 * Extracts structured fields from a source document (LC or SKBDN).
 *
 * 1. Uses Tesseract.js OCR to extract raw text from the PDF/image.
 * 2. Sends OCR text to an LLM (Gemini first, then OpenRouter, then Grok)
 *    to map it into the structured ExtractedLCFields format.
 */
export async function extractSourceDocument(
  fileBuffer: Buffer,
  mimeType: string,
  transactionType: 'LC' | 'SKBDN',
): Promise<ExtractedLCFields> {
  const prompt = transactionType === 'LC' ? LC_EXTRACTION_PROMPT : SKBDN_EXTRACTION_PROMPT

  // Step 1: OCR - extract raw text from document
  let ocrText: string
  try {
    ocrText = await extractTextFromDocument(fileBuffer, mimeType)
  } catch (error) {
    throw new ExtractionError(
      `OCR failed: ${error instanceof Error ? error.message : String(error)}`,
      { code: 'OCR_ERROR', cause: error }
    )
  }

  // Step 2: LLM structured extraction with fallback chain
  let parsed: unknown
  try {
    const result = await extractWithLLMFallback(prompt, ocrText)
    parsed = result.data
    console.log(`[extractSourceDocument] Extraction succeeded using provider: ${result.provider}`)
  } catch (error) {
    throw new ExtractionError(
      `LLM extraction failed (all providers exhausted): ${error instanceof Error ? error.message : String(error)}`,
      { code: 'LLM_FALLBACK_ERROR', cause: error }
    )
  }

  // Step 3: Validate against schema
  const validationResult = ExtractedLCFieldsSchema.safeParse(parsed)
  if (!validationResult.success) {
    const errorMessages = validationResult.error.issues
      .map((e) => `${e.path.join('.')}: ${e.message}`)
      .join('; ')
    throw new ExtractionError(
      `Extracted data does not conform to schema: ${errorMessages}`,
      { code: 'SCHEMA_VALIDATION_ERROR' }
    )
  }

  return validationResult.data
}
