/**
 * SKBDN extraction prompt for Gemini vision model.
 * Instructs Gemini to extract structured fields from an SKBDN document.
 * Satisfies: Requirements 3.1, 3.2, 3.3, 3.4, 3.5
 */

export const SKBDN_EXTRACTION_PROMPT = `You are a trade finance document analysis expert specializing in Indonesian domestic documentary credits. Extract structured fields from this Surat Kredit Berdokumen Dalam Negeri (SKBDN) document.

SKBDN is a domestic documentary credit instrument governed by PBI No. 5/6/PBI/2003. It follows similar structure to an international LC but operates within Indonesia.

IMPORTANT RULES:
- Return ONLY a valid JSON object matching the schema below.
- Include a "confidence" map with a score between 0.0 and 1.0 for each extracted field.
- Use null for any field that cannot be found in the document, with confidence 0.0 for that field.
- NEVER guess or hallucinate values, dates, or amounts. If uncertain, use null.
- Dates must be in ISO format: YYYY-MM-DD.
- Currency will typically be "IDR" but extract the actual currency stated.
- Amount must be a numeric value (no currency symbols or separators).
- Field names in the document may be in Bahasa Indonesia. Map them to the English schema fields.

FIELD MAPPING (Bahasa Indonesia → Schema):
- Nomor SKBDN → lcNumber
- Tanggal Penerbitan → issueDate
- Tanggal Berakhir → expiryDate
- Tempat Berakhir → expiryPlace
- Bank Penerbit → issuingBank
- Bank Penerus → advisingBank
- Pemohon → applicant
- Penerima → beneficiary
- Mata Uang → currency
- Nilai / Jumlah → amount
- Toleransi → tolerancePct
- Jangka Waktu Pembayaran → paymentTenor
- Tersedia pada → availableWith
- Tersedia dengan cara → availableBy
- Uraian Barang → goodsDescription
- Jumlah Barang → quantity
- Pelabuhan Muat → portOfLoading
- Pelabuhan Tujuan → portOfDischarge
- Tanggal Pengapalan Terakhir → latestShipmentDate
- Pengapalan Sebagian → partialShipment
- Alih Kapal → transshipment
- Jangka Waktu Penyerahan Dokumen → presentationPeriodDays
- Dokumen yang Dipersyaratkan → requiredDocuments
- Syarat Tambahan → additionalConditions

REQUIRED JSON SCHEMA:
{
  "lcNumber": string (the SKBDN number/reference),
  "issueDate": string (YYYY-MM-DD),
  "expiryDate": string (YYYY-MM-DD),
  "expiryPlace": string (place where the SKBDN expires),
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
  "currency": string (3-letter ISO 4217 code, typically "IDR"),
  "amount": number (positive numeric value),
  "tolerancePct": number or null (tolerance percentage, 0-100),
  "paymentTenor": string (e.g., "ATAS UNJUK", "60 HARI SETELAH TANGGAL B/L"),
  "availableWith": string (bank name),
  "availableBy": string (e.g., "NEGOSIASI", "PEMBAYARAN"),
  "goodsDescription": string (full goods description),
  "quantity": string or null,
  "incoterms": string (e.g., "FOB", "CIF", "CFR"),
  "portOfLoading": string,
  "portOfDischarge": string,
  "latestShipmentDate": string (YYYY-MM-DD),
  "partialShipment": "ALLOWED" | "NOT_ALLOWED" | "NOT_SPECIFIED",
  "transshipment": "ALLOWED" | "NOT_ALLOWED" | "NOT_SPECIFIED",
  "presentationPeriodDays": number or null,
  "requiredDocuments": [
    {
      "documentType": string,
      "originals": number,
      "copies": number,
      "requirements": string or null
    }
  ],
  "additionalConditions": string or null,
  "confidence": {
    "fieldName": number (0.0 to 1.0)
  }
}

Extract all fields from the document image/PDF. Return ONLY the JSON object, no additional text or markdown formatting.`
