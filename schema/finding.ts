/**
 * Finding Zod schema for parsing Gemini interpretive validation responses.
 * Satisfies: Requirements 8.4, 8.10
 */

import { z } from 'zod'

export const FindingSchema = z.object({
  checkType: z.enum(['DETERMINISTIC', 'INTERPRETIVE', 'CROSS_DOCUMENT']),
  severity: z.enum(['FATAL', 'MAJOR', 'MINOR']),
  field: z.string().min(1),
  expected: z.string().optional().nullable(),
  found: z.string().optional().nullable(),
  description: z.string().min(1),
  suggestedCorrection: z.string().optional().nullable(),
  regulatoryRef: z.string().min(1),
  ragChunkIds: z.array(z.string()).default([]),
})

export type Finding = z.infer<typeof FindingSchema>

export const FindingArraySchema = z.array(FindingSchema)
