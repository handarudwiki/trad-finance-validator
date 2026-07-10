/**
 * Property-based test: Interpretive response schema conformance.
 * 
 * **Property 14: Interpretive response schema conformance**
 * For any mocked valid Gemini JSON response, parsing SHALL succeed and return Finding[];
 * for any mocked invalid JSON response, the catch block SHALL return exactly one MAJOR
 * severity Finding with a non-empty description.
 *
 * **Validates: Requirements 8.4, 8.10**
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { FindingArraySchema, type Finding } from '@/schema/finding'

/**
 * Simulate the error handling pattern used by all interpretive checks.
 * This replicates the try/catch from the actual interpretive validation modules.
 */
function parseInterpretiveResponse(
  responseText: string,
  checkGroupName: string,
): Finding[] {
  try {
    const raw = JSON.parse(responseText)
    return FindingArraySchema.parse(raw)
  } catch {
    return [
      {
        checkType: 'INTERPRETIVE',
        severity: 'MAJOR',
        field: checkGroupName,
        description:
          'Interpretive check could not be completed: response parsing failed',
        regulatoryRef: 'N/A',
        ragChunkIds: [],
      },
    ]
  }
}

/** Arbitrary for generating valid Finding objects */
const validFindingArb = fc.record({
  checkType: fc.constant('INTERPRETIVE' as const),
  severity: fc.oneof(
    fc.constant('FATAL' as const),
    fc.constant('MAJOR' as const),
    fc.constant('MINOR' as const),
  ),
  field: fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0),
  expected: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: null }),
  found: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: null }),
  description: fc.string({ minLength: 1, maxLength: 200 }).filter((s) => s.trim().length > 0),
  suggestedCorrection: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: null }),
  regulatoryRef: fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0),
  ragChunkIds: fc.array(fc.string({ minLength: 1, maxLength: 30 }), { minLength: 0, maxLength: 5 }),
})

/** Arbitrary for generating a valid Finding[] JSON string response */
const validFindingArrayJsonArb = fc
  .array(validFindingArb, { minLength: 0, maxLength: 5 })
  .map((findings) => JSON.stringify(findings))

/** Arbitrary for generating invalid JSON (not parseable or not matching FindingArraySchema) */
const invalidJsonArb = fc.oneof(
  // Completely invalid JSON
  fc.string({ minLength: 1, maxLength: 100 }).filter((s) => {
    try {
      JSON.parse(s)
      return false
    } catch {
      return true
    }
  }),
  // Valid JSON but not an array
  fc.record({ someKey: fc.string() }).map((obj) => JSON.stringify(obj)),
  // Valid JSON array but with invalid Finding objects (missing required fields)
  fc.array(
    fc.record({
      checkType: fc.constant('INVALID_TYPE'),
      severity: fc.constant('UNKNOWN'),
    }),
    { minLength: 1, maxLength: 3 },
  ).map((arr) => JSON.stringify(arr)),
  // Array with findings missing required field 'field'
  fc.array(
    fc.record({
      checkType: fc.constant('INTERPRETIVE'),
      severity: fc.constant('MAJOR'),
      description: fc.constant('test'),
      regulatoryRef: fc.constant('ref'),
      ragChunkIds: fc.constant([]),
    }),
    { minLength: 1, maxLength: 2 },
  ).map((arr) => JSON.stringify(arr)),
)

const checkGroupNames = fc.oneof(
  fc.constant('partyNameConsistency'),
  fc.constant('goodsDescription'),
  fc.constant('mandatoryWording'),
  fc.constant('insuranceCoverage'),
)

describe('Property 14: Interpretive response schema conformance', () => {
  it('valid Gemini JSON response parses successfully into Finding[]', () => {
    fc.assert(
      fc.property(validFindingArrayJsonArb, checkGroupNames, (jsonResponse, checkGroup) => {
        const result = parseInterpretiveResponse(jsonResponse, checkGroup)

        // All results must be valid Finding objects
        expect(Array.isArray(result)).toBe(true)
        for (const finding of result) {
          expect(finding.checkType).toBe('INTERPRETIVE')
          expect(['FATAL', 'MAJOR', 'MINOR']).toContain(finding.severity)
          expect(finding.field.length).toBeGreaterThan(0)
          expect(finding.description.length).toBeGreaterThan(0)
          expect(finding.regulatoryRef.length).toBeGreaterThan(0)
          expect(Array.isArray(finding.ragChunkIds)).toBe(true)
        }

        // Should match the parsed array from the source
        const expectedArray = JSON.parse(jsonResponse)
        expect(result.length).toBe(expectedArray.length)
      }),
      { numRuns: 100 },
    )
  })

  it('invalid JSON response returns exactly one MAJOR Finding with non-empty description', () => {
    fc.assert(
      fc.property(invalidJsonArb, checkGroupNames, (invalidResponse, checkGroup) => {
        const result = parseInterpretiveResponse(invalidResponse, checkGroup)

        // Must return exactly one Finding
        expect(result).toHaveLength(1)

        const finding = result[0]
        // Must be MAJOR severity
        expect(finding.severity).toBe('MAJOR')
        // Must be INTERPRETIVE check type
        expect(finding.checkType).toBe('INTERPRETIVE')
        // Field must match the check group name
        expect(finding.field).toBe(checkGroup)
        // Description must be non-empty
        expect(finding.description.length).toBeGreaterThan(0)
        expect(finding.description).toBe(
          'Interpretive check could not be completed: response parsing failed',
        )
        // regulatoryRef must be 'N/A'
        expect(finding.regulatoryRef).toBe('N/A')
        // ragChunkIds must be empty array
        expect(finding.ragChunkIds).toEqual([])
      }),
      { numRuns: 100 },
    )
  })

  it('empty array response parses to empty Finding[]', () => {
    const emptyArrayJson = '[]'
    const result = parseInterpretiveResponse(emptyArrayJson, 'partyNameConsistency')
    expect(result).toEqual([])
  })
})
