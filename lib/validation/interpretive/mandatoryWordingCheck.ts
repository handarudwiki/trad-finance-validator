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
import { generateText } from '@/lib/llm'

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
  let ragContext: Awaited<ReturnType<typeof retrieveRegulatory>> = []
  try {
    ragContext = await retrieveRegulatory(
      'mandatory wording certificate beneficiary ISBP 745',
      transactionType,
      documentType,
    )
  } catch (ragErr) {
    console.warn('[mandatoryWordingCheck] RAG retrieval failed, continuing without regulatory context:', ragErr)
  }

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
- Return an empty array [] if no discrepancy is found.
- Write "description" and "suggestedCorrection" fields in Bahasa Indonesia.

Return a JSON array of Finding objects. Each Finding must match this exact schema:
{
  "checkType": "INTERPRETIVE",
  "severity": "FATAL" | "MAJOR" | "MINOR",
  "field": string (the field name, e.g. "mandatoryWording"),
  "expected": string or null (the required wording from the LC/SKBDN),
  "found": string or null (what was found in the document, or null if missing),
  "description": string (clear explanation in Bahasa Indonesia),
  "suggestedCorrection": string or null (recommended fix in Bahasa Indonesia),
  "regulatoryRef": string (specific article/clause, e.g. "ISBP 745 Para. A23"),
  "ragChunkIds": []
}

Severity guide:
- FATAL: Required wording completely missing or contradicts LC requirements
- MAJOR: Significant deviation from required wording that likely causes discrepancy
- MINOR: Minor formatting or phrasing difference that may still be acceptable

Return ONLY valid JSON array.`

  try {
    const responseText = await generateText(prompt)
    const cleaned = responseText.replace(/```(?:json)?\s*\n?([\s\S]*?)\n?```/, '$1').trim()
    const raw = JSON.parse(cleaned)
    return FindingArraySchema.parse(raw)
  } catch (err) {
    console.error('[mandatoryWordingCheck] LLM response parsing failed:', err)
    // Don't surface system errors as document findings — just skip
    return []
  }
}
