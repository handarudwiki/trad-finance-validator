/**
 * Interpretive insurance coverage check.
 * Uses RAG + Gemini to verify the insurance certificate meets
 * coverage requirements specified in the LC/SKBDN.
 * Satisfies: Requirements 8.1, 8.2, 8.3, 8.4, 8.9, 8.10
 */

import type { ExtractedLCFields } from '@/schema/extraction'
import type { Finding } from '@/schema/finding'
import { FindingArraySchema } from '@/schema/finding'
import { retrieveRegulatory } from '@/lib/rag/retrieve'
import { ai, VISION_MODEL } from '@/lib/gemini'

/**
 * Checks that the insurance certificate meets coverage requirements
 * specified in the LC/SKBDN terms.
 *
 * @param lcFields - The reviewed LC/SKBDN fields
 * @param docData - Extracted data from the insurance certificate
 * @param transactionType - LC or SKBDN
 * @returns Array of findings for insurance coverage discrepancies
 */
export async function insuranceCoverageCheck(
  lcFields: ExtractedLCFields,
  docData: Record<string, unknown>,
  transactionType: 'LC' | 'SKBDN',
): Promise<Finding[]> {
  const ragContext = await retrieveRegulatory(
    'insurance percentage CIF value coverage UCP 600',
    transactionType,
    'INSURANCE_CERTIFICATE',
  )

  // Find requirements for insurance certificate from the LC
  const requiredDoc = lcFields.requiredDocuments.find(
    (d) => d.documentType === 'INSURANCE_CERTIFICATE',
  )
  const requirements = requiredDoc?.requirements ?? ''

  const regulatoryContext = ragContext.map((c) => `[${c.source} ${c.article}] ${c.text}`).join('\n\n')

  const prompt = `You are a trade finance document checker. Check if the insurance certificate meets the coverage requirements specified in the LC/SKBDN.

LC/SKBDN Terms:
- Currency: ${lcFields.currency}
- Amount: ${lcFields.amount}
- Incoterms: ${lcFields.incoterms}
- Insurance Requirements: "${requirements}"

Insurance Certificate Extracted Data:
${JSON.stringify(docData, null, 2)}

Regulatory Context:
${regulatoryContext}

Rules:
- Under UCP 600 Art. 28, insurance must cover at least 110% of CIF/CIP value unless LC specifies otherwise.
- Check that the insured amount meets the minimum coverage requirement.
- Check that the currency of insurance matches the LC currency.
- Check risks covered as specified in the LC.
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
        field: 'insuranceCoverage',
        expected: null,
        found: null,
        description:
          'Interpretive check could not be completed: insurance coverage response parsing failed',
        suggestedCorrection: null,
        regulatoryRef: 'N/A',
        ragChunkIds: [],
      },
    ]
  }
}
