/**
 * Commercial Invoice extraction prompt for Gemini vision model.
 * Satisfies: Requirement 6.3
 */

export const INVOICE_EXTRACTION_PROMPT = `You are a trade finance document analysis expert. Extract structured fields from this Commercial Invoice document.

IMPORTANT RULES:
- Return ONLY a valid JSON object matching the schema below.
- Include a "confidence" map with a score between 0.0 and 1.0 for each extracted field.
- Use null for any field that cannot be found in the document, with confidence 0.0.
- NEVER guess or hallucinate values. If uncertain, use null.
- Dates must be in ISO format: YYYY-MM-DD.
- Currency must be a 3-letter ISO 4217 code.
- Amounts must be numeric values.

REQUIRED JSON SCHEMA:
{
  "invoiceNumber": string or null,
  "invoiceDate": string (YYYY-MM-DD) or null,
  "seller": {
    "name": string or null,
    "address": string or null
  },
  "buyer": {
    "name": string or null,
    "address": string or null
  },
  "currency": string (3-letter ISO 4217) or null,
  "totalAmount": number or null,
  "lineItems": [
    {
      "description": string,
      "quantity": number or null,
      "unit": string or null,
      "unitPrice": number or null,
      "amount": number or null
    }
  ] or null,
  "goodsDescription": string or null,
  "totalQuantity": string or null,
  "incoterms": string or null,
  "portOfLoading": string or null,
  "portOfDischarge": string or null,
  "lcReference": string or null,
  "countryOfOrigin": string or null,
  "confidence": {
    "fieldName": number (0.0 to 1.0)
  }
}

Extract all fields from the document. Return ONLY the JSON object, no additional text or markdown formatting.`
