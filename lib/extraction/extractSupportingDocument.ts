/**
 * Supporting document extraction service.
 * Extracts structured data from supporting documents using Gemini vision.
 * Dispatches the appropriate prompt based on document type.
 * Satisfies: Requirements 6.3
 */

import { getVisionModel } from '../gemini'
import { ExtractionError } from './ExtractionError'
import { INVOICE_EXTRACTION_PROMPT } from './prompts/invoiceExtractionPrompt'
import { PACKING_LIST_EXTRACTION_PROMPT } from './prompts/packingListExtractionPrompt'
import { BILL_OF_LADING_EXTRACTION_PROMPT } from './prompts/billOfLadingExtractionPrompt'
import { AIRWAY_BILL_EXTRACTION_PROMPT } from './prompts/airwayBillExtractionPrompt'
import { CERTIFICATE_OF_ORIGIN_EXTRACTION_PROMPT } from './prompts/certificateOfOriginExtractionPrompt'
import { INSURANCE_CERTIFICATE_EXTRACTION_PROMPT } from './prompts/insuranceCertificateExtractionPrompt'
import { GENERIC_DOCUMENT_EXTRACTION_PROMPT } from './prompts/genericDocumentExtractionPrompt'

/**
 * Document types matching the Prisma DocumentType enum.
 */
export type DocumentType =
  | 'BILL_OF_EXCHANGE'
  | 'COMMERCIAL_INVOICE'
  | 'PACKING_LIST'
  | 'BILL_OF_LADING'
  | 'AIRWAY_BILL'
  | 'SURAT_JALAN'
  | 'CERTIFICATE_OF_ORIGIN'
  | 'INSURANCE_CERTIFICATE'
  | 'INSPECTION_CERTIFICATE'
  | 'BENEFICIARY_CERTIFICATE'
  | 'CERTIFICATE_OF_ANALYSIS'
  | 'PHYTOSANITARY_CERTIFICATE'
  | 'OTHER'

/**
 * Returns the appropriate extraction prompt based on document type.
 */
export function getDocumentPrompt(documentType: DocumentType): string {
  switch (documentType) {
    case 'COMMERCIAL_INVOICE':
      return INVOICE_EXTRACTION_PROMPT
    case 'PACKING_LIST':
      return PACKING_LIST_EXTRACTION_PROMPT
    case 'BILL_OF_LADING':
      return BILL_OF_LADING_EXTRACTION_PROMPT
    case 'AIRWAY_BILL':
      return AIRWAY_BILL_EXTRACTION_PROMPT
    case 'CERTIFICATE_OF_ORIGIN':
      return CERTIFICATE_OF_ORIGIN_EXTRACTION_PROMPT
    case 'INSURANCE_CERTIFICATE':
      return INSURANCE_CERTIFICATE_EXTRACTION_PROMPT
    case 'BILL_OF_EXCHANGE':
    case 'SURAT_JALAN':
    case 'INSPECTION_CERTIFICATE':
    case 'BENEFICIARY_CERTIFICATE':
    case 'CERTIFICATE_OF_ANALYSIS':
    case 'PHYTOSANITARY_CERTIFICATE':
    case 'OTHER':
    default:
      return GENERIC_DOCUMENT_EXTRACTION_PROMPT
  }
}

/**
 * Extracts structured data from a supporting document.
 *
 * @param fileBuffer - The file content as a Buffer
 * @param mimeType - The MIME type of the file
 * @param documentType - The type of supporting document
 * @returns Parsed JSON data as Record<string, unknown>
 * @throws ExtractionError on any failure
 */
export async function extractSupportingDocument(
  fileBuffer: Buffer,
  mimeType: string,
  documentType: DocumentType,
): Promise<Record<string, unknown>> {
  const prompt = getDocumentPrompt(documentType)

  try {
    const model = getVisionModel()

    const result = await model.generateContent([
      {
        inlineData: {
          data: fileBuffer.toString('base64'),
          mimeType,
        },
      },
      prompt,
    ])

    const responseText = result.response.text()

    // Parse JSON from response (handle potential markdown code blocks)
    const jsonString = extractJsonFromResponse(responseText)

    let parsed: Record<string, unknown>
    try {
      parsed = JSON.parse(jsonString)
    } catch (parseError) {
      throw new ExtractionError(
        `Failed to parse Gemini response as JSON for ${documentType}: ${parseError instanceof Error ? parseError.message : String(parseError)}`,
        { code: 'JSON_PARSE_ERROR', documentType, cause: parseError }
      )
    }

    return parsed
  } catch (error) {
    if (error instanceof ExtractionError) {
      throw error
    }
    throw new ExtractionError(
      `Supporting document extraction failed for ${documentType}: ${error instanceof Error ? error.message : String(error)}`,
      { code: 'GEMINI_API_ERROR', documentType, cause: error }
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
