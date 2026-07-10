/**
 * Interpretive goods description consistency check.
 * Uses RAG + Gemini to check goods description consistency between
 * LC/SKBDN terms and invoice/packing list documents.
 * Satisfies: Requirements 8.1, 8.2, 8.3, 8.4, 8.5, 8.7, 8.10
 */

import type { ExtractedLCFields } from '@/schema/extraction'
import type { Finding } from '@/schema/finding'
import { FindingArraySchema } from '@/schema/finding'
import { retrieveRegulatory } from '@/lib/rag/retrieve'
import { generateText } from '@/lib/llm'

/**
 * Checks goods description consistency between the LC/SKBDN and supporting documents.
 * Retrieves relevant regulatory context and uses Gemini for nuanced comparison.
 *
 * @param lcFields - The reviewed LC/SKBDN fields
 * @param docsData - Map of document type to extracted data for invoice/packing list
 * @param transactionType - LC or SKBDN
 * @returns Array of findings for goods description discrepancies
 */
export async function goodsDescriptionCheck(
  lcFields: ExtractedLCFields,
  docsData: Map<string, Record<string, unknown>>,
  transactionType: 'LC' | 'SKBDN',
): Promise<Finding[]> {
  const ragContext = await retrieveRegulatory(
    'goods description consistency invoice UCP 600',
    transactionType,
    'COMMERCIAL_INVOICE',
  )

  const docDescriptions: string[] = []
  for (const [docType, data] of docsData) {
    const desc = data.goodsDescription ?? data.description
    if (desc) {
      docDescriptions.push(`${docType}: "${String(desc)}"`)
    }
  }

  if (docDescriptions.length === 0) {
    return []
  }

  const regulatoryContext = ragContext.map((c) => `[${c.source} ${c.article}] ${c.text}`).join('\n\n')

  const prompt = `You are a trade finance document checker. Compare the goods description in the LC/SKBDN against the goods descriptions found in supporting documents.

LC/SKBDN Goods Description: "${lcFields.goodsDescription}"

Supporting Document Descriptions:
${docDescriptions.join('\n')}

Regulatory Context:
${regulatoryContext}

Rules:
- The invoice description must NOT be inconsistent with the LC description (UCP 600 Art. 18(c)).
- Minor wording differences that do not change meaning are acceptable.
- Return a JSON array of findings. Each finding must have: checkType, severity, field, expected, found, description, suggestedCorrection, regulatoryRef, ragChunkIds.
- Use checkType: "INTERPRETIVE"
- Return an empty array [] if no discrepancy is found.
- Write "description" and "suggestedCorrection" fields in Bahasa Indonesia.

Return ONLY valid JSON array.`

  try {
    const responseText = await generateText(prompt)
    const cleaned = responseText.replace(/```(?:json)?\s*\n?([\s\S]*?)\n?```/, '$1').trim()
    const raw = JSON.parse(cleaned)
    return FindingArraySchema.parse(raw)
  } catch {
    return [
      {
        checkType: 'INTERPRETIVE',
        severity: 'MAJOR',
        field: 'goodsDescription',
        expected: null,
        found: null,
        description:
          'Interpretive check could not be completed: goods description response parsing failed',
        suggestedCorrection: null,
        regulatoryRef: 'N/A',
        ragChunkIds: [],
      },
    ]
  }
}
