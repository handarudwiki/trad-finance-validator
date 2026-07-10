import { describe, it, expect, vi, beforeEach } from 'vitest'
import { extractSourceDocument } from '@/lib/extraction/extractSourceDocument'
import { ExtractionError } from '@/lib/extraction/ExtractionError'

const mockGenerateContent = vi.fn()

// Mock the gemini module
vi.mock('@/lib/gemini', () => ({
  ai: {
    models: {
      generateContent: (...args: any[]) => mockGenerateContent(...args),
    },
  },
  VISION_MODEL: 'gemini-2.5-flash-preview-05-20',
}))

describe('extractSourceDocument', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const validLCResponse = {
    lcNumber: 'LC-2024-001',
    issueDate: '2024-01-15',
    expiryDate: '2024-06-15',
    expiryPlace: 'Jakarta',
    issuingBank: { name: 'Bank Mandiri', address: 'Jakarta', swiftCode: 'BMRIIDJA' },
    advisingBank: null,
    applicant: { name: 'PT Importer', address: 'Surabaya, Indonesia' },
    beneficiary: { name: 'PT Exporter', address: 'Jakarta, Indonesia' },
    currency: 'USD',
    amount: 100000,
    tolerancePct: 5,
    paymentTenor: 'AT SIGHT',
    availableWith: 'Bank Mandiri',
    availableBy: 'NEGOTIATION',
    goodsDescription: 'Electronic components',
    quantity: '1000 units',
    incoterms: 'FOB',
    portOfLoading: 'Jakarta',
    portOfDischarge: 'Singapore',
    latestShipmentDate: '2024-05-15',
    partialShipment: 'ALLOWED',
    transshipment: 'NOT_ALLOWED',
    presentationPeriodDays: 21,
    requiredDocuments: [
      { documentType: 'COMMERCIAL_INVOICE', originals: 3, copies: 3, requirements: null },
    ],
    additionalConditions: null,
    confidence: { lcNumber: 0.95, issueDate: 0.9, expiryDate: 0.92 },
  }

  function mockGeminiResponse(responseText: string) {
    mockGenerateContent.mockResolvedValue({
      text: responseText,
    })
  }

  function mockGeminiError(error: Error) {
    mockGenerateContent.mockRejectedValue(error)
  }

  it('should extract LC fields from a valid Gemini response', async () => {
    mockGeminiResponse(JSON.stringify(validLCResponse))

    const result = await extractSourceDocument(
      Buffer.from('fake-pdf-content'),
      'application/pdf',
      'LC'
    )

    expect(result.lcNumber).toBe('LC-2024-001')
    expect(result.currency).toBe('USD')
    expect(result.amount).toBe(100000)
    expect(result.beneficiary.name).toBe('PT Exporter')
  })

  it('should use SKBDN prompt for SKBDN transaction type', async () => {
    const skbdnResponse = {
      ...validLCResponse,
      lcNumber: 'SKBDN-2024-001',
      currency: 'IDR',
      amount: 500000000,
    }
    mockGeminiResponse(JSON.stringify(skbdnResponse))

    const result = await extractSourceDocument(
      Buffer.from('fake-pdf-content'),
      'application/pdf',
      'SKBDN'
    )

    expect(result.lcNumber).toBe('SKBDN-2024-001')
    expect(result.currency).toBe('IDR')

    // Verify the SKBDN prompt was used in the contents
    const callArgs = mockGenerateContent.mock.calls[0][0]
    const textPart = callArgs.contents[0].parts[1].text
    expect(textPart).toContain('SKBDN')
  })

  it('should throw ExtractionError when Gemini returns invalid JSON', async () => {
    mockGeminiResponse('not valid json at all')

    try {
      await extractSourceDocument(Buffer.from('fake'), 'application/pdf', 'LC')
      expect.fail('Should have thrown')
    } catch (error) {
      expect(error).toBeInstanceOf(ExtractionError)
      expect((error as ExtractionError).message).toContain('Failed to parse Gemini response as JSON')
      expect((error as ExtractionError).code).toBe('JSON_PARSE_ERROR')
    }
  })

  it('should throw ExtractionError when response does not match schema', async () => {
    mockGeminiResponse(JSON.stringify({ lcNumber: 'LC-001' }))

    try {
      await extractSourceDocument(Buffer.from('fake'), 'application/pdf', 'LC')
      expect.fail('Should have thrown')
    } catch (error) {
      expect(error).toBeInstanceOf(ExtractionError)
      expect((error as ExtractionError).message).toContain('does not conform to schema')
      expect((error as ExtractionError).code).toBe('SCHEMA_VALIDATION_ERROR')
    }
  })

  it('should throw ExtractionError when Gemini API call fails', async () => {
    mockGeminiError(new Error('API rate limit exceeded'))

    try {
      await extractSourceDocument(Buffer.from('fake'), 'application/pdf', 'LC')
      expect.fail('Should have thrown')
    } catch (error) {
      expect(error).toBeInstanceOf(ExtractionError)
      expect((error as ExtractionError).message).toContain('Source document extraction failed')
      expect((error as ExtractionError).code).toBe('GEMINI_API_ERROR')
    }
  })

  it('should handle Gemini response wrapped in markdown code block', async () => {
    const wrappedResponse = '```json\n' + JSON.stringify(validLCResponse) + '\n```'
    mockGeminiResponse(wrappedResponse)

    const result = await extractSourceDocument(
      Buffer.from('fake-pdf'),
      'application/pdf',
      'LC'
    )

    expect(result.lcNumber).toBe('LC-2024-001')
  })
})
