/**
 * Source document extraction service.
 * Extracts structured fields from an LC or SKBDN document using Gemini vision.
 * Satisfies: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6
 */

import { ai, VISION_MODEL } from '../gemini'
import { ExtractedLCFieldsSchema, type ExtractedLCFields } from '../../schema/extraction'
import { LC_EXTRACTION_PROMPT } from './prompts/lcExtractionPrompt'
import { SKBDN_EXTRACTION_PROMPT } from './prompts/skbdnExtractionPrompt'
import { ExtractionError } from './ExtractionError'

/**
 * Extracts structured fields from a source document (LC or SKBDN).
 */
export async function extractSourceDocument(
  fileBuffer: Buffer,
  mimeType: string,
  transactionType: 'LC' | 'SKBDN',
): Promise<ExtractedLCFields> {
  const prompt = transactionType === 'LC' ? LC_EXTRACTION_PROMPT : SKBDN_EXTRACTION_PROMPT

  try {
    const result = await ai.models.generateContent({
      model: VISION_MODEL,
      contents: [
        {
          role: 'user',
          parts: [
            { inlineData: { data: fileBuffer.toString('base64'), mimeType } },
            { text: prompt },
          ],
        },
      ],
    })

    const responseText = result.text!

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
  const codeBlockMatch = responseText.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/)
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim()
  }
  return responseText.trim()
}
