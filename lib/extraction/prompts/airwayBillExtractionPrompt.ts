/**
 * Airway Bill extraction prompt for Gemini vision model.
 * Satisfies: Requirement 6.3
 */

export const AIRWAY_BILL_EXTRACTION_PROMPT = `You are a trade finance document analysis expert. Extract structured fields from this Air Waybill (AWB) document.

IMPORTANT RULES:
- Return ONLY a valid JSON object matching the schema below.
- Include a "confidence" map with a score between 0.0 and 1.0 for each extracted field.
- Use null for any field that cannot be found in the document, with confidence 0.0.
- NEVER guess or hallucinate values. If uncertain, use null.
- Dates must be in ISO format: YYYY-MM-DD.
- The flight date/on-board date is critical for trade finance validation.

REQUIRED JSON SCHEMA:
{
  "awbNumber": string or null,
  "awbDate": string (YYYY-MM-DD) or null,
  "onBoardDate": string (YYYY-MM-DD) or null (the date goods were accepted for carriage),
  "shipper": {
    "name": string or null,
    "address": string or null
  },
  "consignee": {
    "name": string or null,
    "address": string or null
  },
  "carrier": string or null,
  "flightNumber": string or null,
  "airportOfDeparture": string or null,
  "airportOfDestination": string or null,
  "portOfLoading": string or null,
  "portOfDischarge": string or null,
  "goodsDescription": string or null,
  "totalPackages": number or null,
  "totalGrossWeight": number or null,
  "totalGrossWeightUnit": string or null,
  "chargeableWeight": number or null,
  "freightTerms": string or null (e.g., "PREPAID", "COLLECT"),
  "lcReference": string or null,
  "confidence": {
    "fieldName": number (0.0 to 1.0)
  }
}

Extract all fields from the document. Return ONLY the JSON object, no additional text or markdown formatting.`
