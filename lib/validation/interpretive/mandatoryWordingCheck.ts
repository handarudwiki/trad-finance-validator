/**
 * Interpretive mandatory wording check for certificate documents.
 * Uses RAG + Gemini to verify certificate documents contain required wording
 * as specified in the LC/SKBDN requiredDocuments list.
 * Satisfies: Requirements 8.1, 8.2, 8.3, 8.4, 8.5, 8.8, 8.10
 */

import type { ExtractedLCFields } from '@/schema/extraction'
import type { Finding } from '@/schema/finding'
import { FindingArraySchema } from '@/schema/finding'
import { retrieveRegulatory } from '@/lib/rag/retrieve'
import { ai, VISION_MODEL } from '@/lib/gemini'

/**
 * Checks that certificate documents contain mandatory wording
 * as specified in the LC/SKBDN requiredDocuments list.
 *
 * @param lcFields - The reviewed LC/SKBDN fields
 * @param docData - Extracted data from the certificate document
 * @param documentType - The document type being checked
 * @param transactionType - LC or SKBDN
 * @returns Array of findings for mandatory wording discrepancies
 */
export async function mandatoryWordingCheck(
  lcFields: ExtractedLCFields,
  docData: Record<string, unknown>,
  documentType: string,
  transactionType: 'LC' | 'SKBDN',
): Promise<Finding[]> {
  const ragContext = await retrieveRegulatory(
    'mandatory wording certificate beneficiary ISBP 745',
    transactionType,
    documentType,
  )

  // Find requirements for this document type from the LC
  const requiredDoc = lcFields.requiredDocuments.find(
    (d) => d.documentType === documentType,
  )
  const requirements = requiredDoc?.requirements ?? ''

  const docContent = docData.content ?? docData.text ?? docData.wording ?? JSON.stringify(docData)

  const regulatoryContext = ragContext.map((c) => `[${c.source} ${c.article}] ${c.text}`).join('\n\n')

  const prompt = `You are a trade finance document checker. Check if the certificate document contains the mandatory wording as required by the LC/SKBDN.

Document Type: ${documentType}
LC Requirements for this document: "${requirements}"

Document Content/Extracted Fields:
${typeof docContent === 'string' ? docContent : JSON.stringify(docContent)}

Regulatory Context:
${regulatoryContext}

Rules:
- Check if the document contains required wording specified in the LC requirements.
- Check compliance with ISBP 745 certificate requirements.
- Return a JSON array of findings. Each finding must have: checkType, severity, field, expected, found, description, suggestedCorrection, regulatoryRef, ragChunkIds.
- Use checkType: "INTERPRETIVE"
- Return an empty array [] if no discrepancy is found.

Return ONLY valid JSON array.`

  try {
    const result = await ai.models.generateContent({
      model: VISION_MODEL,
      contents: prompt,
    })
    const responseText = result.text!
    const raw = JSON.parse(responseText)
    return FindingArraySchema.parse(raw)
  } catch {
    return [
      {
        checkType: 'INTERPRETIVE',
        severity: 'MAJOR',
        field: 'mandatoryWording',
        expected: null,
        found: null,
        description:
          'Interpretive check could not be completed: mandatory wording response parsing failed',
        suggestedCorrection: null,
        regulatoryRef: 'N/A',
        ragChunkIds: [],
      },
    ]
  }
}
