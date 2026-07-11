/**
 * Interpretive validation: Party name consistency check.
 * Verifies beneficiary and applicant name consistency across all documents.
 * Satisfies: Requirements 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.10
 */

import { retrieveRegulatory } from '@/lib/rag/retrieve'
import { generateText } from '@/lib/llm'
import { FindingArraySchema, type Finding } from '@/schema/finding'
import type { ExtractedLCFields } from '@/schema/extraction'

/**
 * Check beneficiary and applicant name consistency across the LC/SKBDN
 * and all supporting documents.
 *
 * Uses RAG to retrieve relevant regulatory context on name variation
 * acceptability, then calls Gemini to perform the interpretive judgment.
 *
 * @param lcFields - The reviewed LC/SKBDN extracted fields
 * @param supportingDocs - Map of document type to extracted data for each supporting document
 * @param transactionType - LC or SKBDN to filter RAG context
 * @returns Array of Findings for any name consistency discrepancies
 */
export async function checkPartyNameConsistency(
  lcFields: ExtractedLCFields,
  supportingDocs: Map<string, Record<string, unknown>>,
  transactionType: 'LC' | 'SKBDN',
): Promise<Finding[]> {
  // 1. Retrieve regulatory context via RAG
  let ragChunks: Awaited<ReturnType<typeof retrieveRegulatory>> = []
  try {
    ragChunks = await retrieveRegulatory(
      'name variations beneficiary applicant consistency UCP ISBP',
      transactionType,
    )
  } catch (ragErr) {
    console.warn('[checkPartyNameConsistency] RAG retrieval failed, continuing without regulatory context:', ragErr)
  }

  const ragContext = ragChunks
    .map((chunk) => `[${chunk.source} ${chunk.article}] ${chunk.title}: ${chunk.text}`)
    .join('\n\n')

  const ragChunkIds = ragChunks.map((chunk) => chunk.article)

  // 2. Build grouped prompt with beneficiary/applicant names from all docs
  const namesFromDocs: Record<string, { beneficiary?: string; applicant?: string }> = {}

  for (const [docType, docData] of supportingDocs.entries()) {
    const entry: { beneficiary?: string; applicant?: string } = {}
    if (docData.beneficiaryName && typeof docData.beneficiaryName === 'string') {
      entry.beneficiary = docData.beneficiaryName
    }
    if (docData.beneficiary && typeof docData.beneficiary === 'string') {
      entry.beneficiary = docData.beneficiary
    }
    if (docData.applicantName && typeof docData.applicantName === 'string') {
      entry.applicant = docData.applicantName
    }
    if (docData.applicant && typeof docData.applicant === 'string') {
      entry.applicant = docData.applicant
    }
    // Also check nested objects for party names
    if (docData.shipper && typeof docData.shipper === 'object') {
      const shipper = docData.shipper as Record<string, unknown>
      if (shipper.name && typeof shipper.name === 'string') {
        entry.beneficiary = entry.beneficiary || shipper.name
      }
    }
    if (docData.consignee && typeof docData.consignee === 'object') {
      const consignee = docData.consignee as Record<string, unknown>
      if (consignee.name && typeof consignee.name === 'string') {
        entry.applicant = entry.applicant || consignee.name
      }
    }
    if (entry.beneficiary || entry.applicant) {
      namesFromDocs[docType] = entry
    }
  }

  const prompt = `You are a trade finance document validation expert. Check beneficiary and applicant name consistency across the LC/SKBDN and all supporting documents.

## Regulatory Context
${ragContext}

## LC/SKBDN Terms
- Beneficiary Name: ${lcFields.beneficiary.name}
- Beneficiary Address: ${lcFields.beneficiary.address}
- Applicant Name: ${lcFields.applicant.name}
- Applicant Address: ${lcFields.applicant.address}

## Names Found in Supporting Documents
${Object.entries(namesFromDocs)
  .map(([docType, names]) => {
    const parts: string[] = [`Document: ${docType}`]
    if (names.beneficiary) parts.push(`  Beneficiary: ${names.beneficiary}`)
    if (names.applicant) parts.push(`  Applicant: ${names.applicant}`)
    return parts.join('\n')
  })
  .join('\n\n')}

## Instructions
Compare the beneficiary and applicant names across the LC/SKBDN and all supporting documents. Consider acceptable name variations per the regulatory context (e.g., abbreviations, trade names). Flag only genuine discrepancies that would be rejected by a bank checker.

Return an empty array [] if no discrepancies are found.
Write "description" and "suggestedCorrection" fields in Bahasa Indonesia.

Return a JSON array of Finding objects. Each Finding must match this exact schema:
{
  "checkType": "INTERPRETIVE",
  "severity": "FATAL" | "MAJOR" | "MINOR",
  "field": string (e.g. "beneficiaryName", "applicantName"),
  "expected": string or null (the value from the LC/SKBDN),
  "found": string or null (the value from the supporting document),
  "description": string (clear explanation in Bahasa Indonesia),
  "suggestedCorrection": string or null (recommended fix in Bahasa Indonesia),
  "regulatoryRef": string (specific article/clause from the regulatory context provided),
  "ragChunkIds": []
}

Severity guide:
- FATAL: Completely different entity name (e.g., different company entirely)
- MAJOR: Significant name difference that a bank checker would likely reject
- MINOR: Minor variation (abbreviation, punctuation) that may be acceptable per ISBP

Return ONLY the JSON array, no other text.`

  // 3. Call LLM with fallback
  try {
    const responseText = await generateText(prompt)
    const cleaned = responseText.replace(/```(?:json)?\s*\n?([\s\S]*?)\n?```/, '$1').trim()

    // 4. Parse response with FindingArraySchema
    const raw = JSON.parse(cleaned)
    const findings = FindingArraySchema.parse(raw)
    // Attach RAG chunk IDs to each finding
    return findings.map((f) => ({ ...f, ragChunkIds: ragChunkIds }))
  } catch (err) {
    console.error('[partyNameConsistency] LLM response parsing failed:', err)
    return []
  }
}
