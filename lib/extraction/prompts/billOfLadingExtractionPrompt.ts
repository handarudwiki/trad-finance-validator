/**
 * Bill of Lading extraction prompt for Gemini vision model.
 * Satisfies: Requirement 6.3
 */

export const BILL_OF_LADING_EXTRACTION_PROMPT = `You are a trade finance document analysis expert. Extract structured fields from this Bill of Lading (B/L) document.

IMPORTANT RULES:
- Return ONLY a valid JSON object matching the schema below.
- Include a "confidence" map with a score between 0.0 and 1.0 for each extracted field.
- Use null for any field that cannot be found in the document, with confidence 0.0.
- NEVER guess or hallucinate values. If uncertain, use null.
- Dates must be in ISO format: YYYY-MM-DD.
- Pay special attention to the on-board date (shipped on board date) as it is critical for trade finance validation.

REQUIRED JSON SCHEMA:
{
  "blNumber": string or null,
  "blDate": string (YYYY-MM-DD) or null,
  "onBoardDate": string (YYYY-MM-DD) or null (the shipped on board date),
  "shipper": {
    "name": string or null,
    "address": string or null
  },
  "consignee": {
    "name": string or null,
    "address": string or null
  },
  "notifyParty": {
    "name": string or null,
    "address": string or null
  } or null,
  "carrier": string or null,
  "vesselName": string or null,
  "voyageNumber": string or null,
  "portOfLoading": string or null,
  "portOfDischarge": string or null,
  "placeOfDelivery": string or null,
  "goodsDescription": string or null,
  "containerNumbers": string[] or null,
  "sealNumbers": string[] or null,
  "totalPackages": number or null,
  "totalGrossWeight": number or null,
  "totalGrossWeightUnit": string or null,
  "freightTerms": string or null (e.g., "PREPAID", "COLLECT"),
  "numberOfOriginals": number or null,
  "isCleanBL": boolean or null,
  "lcReference": string or null,
  "confidence": {
    "fieldName": number (0.0 to 1.0)
  }
}

Extract all fields from the document. Return ONLY the JSON object, no additional text or markdown formatting.`
