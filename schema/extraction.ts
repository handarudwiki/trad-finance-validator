/**
 * Extraction Zod schema for validating extracted LC/SKBDN fields.
 * Satisfies: Requirements 3.1, 3.2, 3.3, 3.5, 4.4
 */

import { z } from 'zod'

const ISODateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD')

export const ExtractedLCFieldsSchema = z.object({
  lcNumber: z.string().min(1),
  issueDate: ISODateString,
  expiryDate: ISODateString,
  expiryPlace: z.string().min(1),
  issuingBank: z.object({
    name: z.string().min(1),
    address: z.string().optional(),
    swiftCode: z.string().optional(),
  }),
  advisingBank: z.object({
    name: z.string(),
    address: z.string().optional(),
    swiftCode: z.string().optional(),
  }).optional().nullable(),
  applicant: z.object({
    name: z.string().min(1),
    address: z.string().min(1),
  }),
  beneficiary: z.object({
    name: z.string().min(1),
    address: z.string().min(1),
  }),
  currency: z.string().length(3, 'Must be ISO 4217 3-letter currency code'),
  amount: z.number().positive(),
  tolerancePct: z.number().min(0).max(100).optional().nullable(),
  paymentTenor: z.string().min(1),
  availableWith: z.string().min(1),
  availableBy: z.string().min(1),
  goodsDescription: z.string().min(1),
  quantity: z.string().optional().nullable(),
  incoterms: z.string().min(1),
  portOfLoading: z.string().min(1),
  portOfDischarge: z.string().min(1),
  latestShipmentDate: ISODateString,
  partialShipment: z.enum(['ALLOWED', 'NOT_ALLOWED', 'NOT_SPECIFIED']),
  transshipment: z.enum(['ALLOWED', 'NOT_ALLOWED', 'NOT_SPECIFIED']),
  presentationPeriodDays: z.number().int().positive().optional().nullable(),
  requiredDocuments: z.array(z.object({
    documentType: z.string().min(1),
    originals: z.number().int().min(0),
    copies: z.number().int().min(0),
    requirements: z.string().optional().nullable(),
  })).min(1),
  additionalConditions: z.string().optional().nullable(),
  confidence: z.record(z.string(), z.number().min(0).max(1)).optional(),
})

export type ExtractedLCFields = z.infer<typeof ExtractedLCFieldsSchema>
