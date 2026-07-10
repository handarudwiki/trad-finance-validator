/**
 * Packing List extraction prompt for Gemini vision model.
 * Satisfies: Requirement 6.3
 */

export const PACKING_LIST_EXTRACTION_PROMPT = `You are a trade finance document analysis expert. Extract structured fields from this Packing List document.

IMPORTANT RULES:
- Return ONLY a valid JSON object matching the schema below.
- Include a "confidence" map with a score between 0.0 and 1.0 for each extracted field.
- Use null for any field that cannot be found in the document, with confidence 0.0.
- NEVER guess or hallucinate values. If uncertain, use null.
- Dates must be in ISO format: YYYY-MM-DD.
- Weights should be in the unit stated (kg, MT, etc.).

REQUIRED JSON SCHEMA:
{
  "packingListNumber": string or null,
  "packingListDate": string (YYYY-MM-DD) or null,
  "seller": {
    "name": string or null,
    "address": string or null
  },
  "buyer": {
    "name": string or null,
    "address": string or null
  },
  "items": [
    {
      "description": string,
      "quantity": number or null,
      "unit": string or null,
      "netWeight": number or null,
      "grossWeight": number or null,
      "dimensions": string or null,
      "containerNumber": string or null,
      "marksAndNumbers": string or null
    }
  ] or null,
  "totalQuantity": string or null,
  "totalNetWeight": number or null,
  "totalNetWeightUnit": string or null,
  "totalGrossWeight": number or null,
  "totalGrossWeightUnit": string or null,
  "totalPackages": number or null,
  "containerNumbers": string[] or null,
  "portOfLoading": string or null,
  "portOfDischarge": string or null,
  "lcReference": string or null,
  "confidence": {
    "fieldName": number (0.0 to 1.0)
  }
}

Extract all fields from the document. Return ONLY the JSON object, no additional text or markdown formatting.`
