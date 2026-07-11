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
import { generateText } from '@/lib/llm'

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
- Return an empty array [] if no discrepancy is found.
- Write "description" and "suggestedCorrection" fields in Bahasa Indonesia.

Return a JSON array of Finding objects. Each Finding must match this exact schema:
{
  "checkType": "INTERPRETIVE",
  "severity": "FATAL" | "MAJOR" | "MINOR",
  "field": string (the field name, e.g. "insuredAmount", "risksCovered"),
  "expected": string or null (the required value from the LC/SKBDN),
  "found": string or null (the value found in the insurance certificate),
  "description": string (clear explanation in Bahasa Indonesia),
  "suggestedCorrection": string or null (recommended fix in Bahasa Indonesia),
  "regulatoryRef": string (specific article/clause, e.g. "UCP 600 Art. 28(b)"),
  "ragChunkIds": []
}

Severity guide:
- FATAL: Coverage completely insufficient or currency mismatch (e.g., insured amount < 110% CIF)
- MAJOR: Significant gap in coverage requirements (e.g., required risk not covered)
- MINOR: Minor formatting or detail issue that may still be acceptable

Return ONLY valid JSON array.`

  try {
    const responseText = await generateText(prompt)
    const cleaned = responseText.replace(/```(?:json)?\s*\n?([\s\S]*?)\n?```/, '$1').trim()
    const raw = JSON.parse(cleaned)
    return FindingArraySchema.parse(raw)
  } catch (err) {
    console.error('[insuranceCoverageCheck] LLM response parsing failed:', err)
    return []
  }
}
