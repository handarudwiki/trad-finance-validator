/**
 * Source document extraction service.
 * Extracts structured fields from an LC or SKBDN document using Gemini vision.
 * Satisfies: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6
 */

import { getVisionModel } from '../gemini'
import { ExtractedLCFieldsSchema, type ExtractedLCFields } from '../../schema/extraction'
import { LC_EXTRACTION_PROMPT } from './prompts/lcExtractionPrompt'
import { SKBDN_EXTRACTION_PROMPT } from './prompts/skbdnExtractionPrompt'
import { ExtractionError } from './ExtractionError'

const MAX_INLINE_SIZE = 20 * 1024 * 1024 // 20MB

/**
 * Extracts structured fields from a source document (LC or SKBDN).
 *
 * @param fileBuffer - The file content as a Buffer
 * @param mimeType - The MIME type of the file (e.g., 'application/pdf', 'image/jpeg')
 * @param transactionType - The transaction type: 'LC' or 'SKBDN'
 * @returns Parsed and validated ExtractedLCFields object
 * @throws ExtractionError on any failure (API error, parse error, validation error)
 */
export async function extractSourceDocument(
  fileBuffer: Buffer,
  mimeType: string,
  transactionType: 'LC' | 'SKBDN',
): Promise<ExtractedLCFields> {
  const prompt = transactionType === 'LC' ? LC_EXTRACTION_PROMPT : SKBDN_EXTRACTION_PROMPT

  try {
    const model = getVisionModel()
    let result

    if (fileBuffer.length > MAX_INLINE_SIZE) {
      // For files >20MB, use the Gemini Files API upload-then-reference pattern
      // In this implementation, we still pass inline data but with a note for future optimization
      // The @google/generative-ai SDK handles large payloads, but for production
      // consider implementing the File API upload pattern
      result = await model.generateContent([
        {
          inlineData: {
            data: fileBuffer.toString('base64'),
            mimeType,
          },
        },
        prompt,
      ])
    } else {
      result = await model.generateContent([
        {
          inlineData: {
            data: fileBuffer.toString('base64'),
            mimeType,
          },
        },
        prompt,
      ])
    }

    const responseText = result.response.text()

    // Parse JSON from response (handle potential markdown code blocks)
    const jsonString = extractJsonFromResponse(responseText)

    let parsed: unknown
    try {
      parsed = JSON.parse(jsonString)
    } catch (parseError) {
      throw new ExtractionError(
        `Failed to parse Gemini response as JSON: ${parseError instanceof Error ? parseError.message : String(parseError)}`,
        { code: 'JSON_PARSE_ERROR', cause: parseError }
      )
    }

    // Validate against the schema
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
  } catch (error) {
    if (error instanceof ExtractionError) {
      throw error
    }
    throw new ExtractionError(
      `Source document extraction failed: ${error instanceof Error ? error.message : String(error)}`,
      { code: 'GEMINI_API_ERROR', cause: error }
    )
  }
}

/**
 * Extracts JSON content from a Gemini response that may be wrapped in markdown code blocks.
 */
function extractJsonFromResponse(responseText: string): string {
  // Try to extract from markdown code block if present
  const codeBlockMatch = responseText.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/)
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim()
  }
  // Otherwise return the raw response trimmed
  return responseText.trim()
}
