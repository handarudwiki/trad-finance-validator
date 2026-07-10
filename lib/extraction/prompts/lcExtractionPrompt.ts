/**
 * LC extraction prompt for Gemini vision model.
 * Instructs Gemini to extract structured fields from a Letter of Credit document.
 * Satisfies: Requirements 3.1, 3.2, 3.3, 3.4, 3.5
 */

export const LC_EXTRACTION_PROMPT = `You are a trade finance document analysis expert. Extract structured fields from this Letter of Credit (LC) document.

IMPORTANT RULES:
- Return ONLY a valid JSON object matching the schema below.
- Include a "confidence" map with a score between 0.0 and 1.0 for each extracted field.
- Use null for any field that cannot be found in the document, with confidence 0.0 for that field.
- NEVER guess or hallucinate values, dates, or amounts. If uncertain, use null.
- Dates must be in ISO format: YYYY-MM-DD.
- Currency must be a 3-letter ISO 4217 code.
- Amount must be a numeric value (no currency symbols or separators).

REQUIRED JSON SCHEMA:
{
  "lcNumber": string (the LC number/reference),
  "issueDate": string (YYYY-MM-DD),
  "expiryDate": string (YYYY-MM-DD),
  "expiryPlace": string (place where the LC expires),
  "issuingBank": {
    "name": string,
    "address": string or null,
    "swiftCode": string or null
  },
  "advisingBank": {
    "name": string,
    "address": string or null,
    "swiftCode": string or null
  } or null,
  "applicant": {
    "name": string,
    "address": string
  },
  "beneficiary": {
    "name": string,
    "address": string
  },
  "currency": string (3-letter ISO 4217 code, e.g., "USD", "IDR"),
  "amount": number (positive numeric value),
  "tolerancePct": number or null (tolerance percentage, 0-100),
  "paymentTenor": string (e.g., "AT SIGHT", "60 DAYS AFTER B/L DATE"),
  "availableWith": string (bank name where LC is available),
  "availableBy": string (e.g., "NEGOTIATION", "PAYMENT", "ACCEPTANCE"),
  "goodsDescription": string (full goods description),
  "quantity": string or null (quantity of goods),
  "incoterms": string (e.g., "FOB", "CIF", "CFR"),
  "portOfLoading": string,
  "portOfDischarge": string,
  "latestShipmentDate": string (YYYY-MM-DD),
  "partialShipment": "ALLOWED" | "NOT_ALLOWED" | "NOT_SPECIFIED",
  "transshipment": "ALLOWED" | "NOT_ALLOWED" | "NOT_SPECIFIED",
  "presentationPeriodDays": number or null (days after shipment date for document presentation),
  "requiredDocuments": [
    {
      "documentType": string (MUST be one of: "BILL_OF_EXCHANGE", "COMMERCIAL_INVOICE", "PACKING_LIST", "BILL_OF_LADING", "AIRWAY_BILL", "SURAT_JALAN", "CERTIFICATE_OF_ORIGIN", "INSURANCE_CERTIFICATE", "INSPECTION_CERTIFICATE", "BENEFICIARY_CERTIFICATE", "CERTIFICATE_OF_ANALYSIS", "PHYTOSANITARY_CERTIFICATE", "INSURANCE_POLICY", "OTHER".
        Mapping guide: Marine BL / Ocean BL / Combined Transport BL / Multimodal BL = "BILL_OF_LADING". Draft / Wesel = "BILL_OF_EXCHANGE". Insurance Policy or Certificate = "INSURANCE_POLICY" or "INSURANCE_CERTIFICATE". Survey/Analysis Report = "CERTIFICATE_OF_ANALYSIS". Beneficiary Statement/Certificate = "BENEFICIARY_CERTIFICATE". If unsure, use "OTHER"),
      "originals": number (count of originals required),
      "copies": number (count of copies required),
      "requirements": string or null (specific requirements for this document)
    }
  ],
  "additionalConditions": string or null (any additional conditions or special instructions),
  "confidence": {
    "fieldName": number (0.0 to 1.0 confidence score for each field)
  }
}

Extract all fields from the document image/PDF. Return ONLY the JSON object, no additional text or markdown formatting.`
