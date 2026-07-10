/**
 * Certificate of Origin extraction prompt for Gemini vision model.
 * Satisfies: Requirement 6.3
 */

export const CERTIFICATE_OF_ORIGIN_EXTRACTION_PROMPT = `You are a trade finance document analysis expert. Extract structured fields from this Certificate of Origin document.

IMPORTANT RULES:
- Return ONLY a valid JSON object matching the schema below.
- Include a "confidence" map with a score between 0.0 and 1.0 for each extracted field.
- Use null for any field that cannot be found in the document, with confidence 0.0.
- NEVER guess or hallucinate values. If uncertain, use null.
- Dates must be in ISO format: YYYY-MM-DD.

REQUIRED JSON SCHEMA:
{
  "certificateNumber": string or null,
  "certificateDate": string (YYYY-MM-DD) or null,
  "exporter": {
    "name": string or null,
    "address": string or null
  },
  "importer": {
    "name": string or null,
    "address": string or null
  },
  "countryOfOrigin": string or null,
  "countryOfDestination": string or null,
  "goodsDescription": string or null,
  "quantity": string or null,
  "grossWeight": number or null,
  "grossWeightUnit": string or null,
  "invoiceNumber": string or null,
  "invoiceDate": string (YYYY-MM-DD) or null,
  "hsCode": string or null,
  "issuingAuthority": string or null,
  "declarationText": string or null,
  "lcReference": string or null,
  "confidence": {
    "fieldName": number (0.0 to 1.0)
  }
}

Extract all fields from the document. Return ONLY the JSON object, no additional text or markdown formatting.`
