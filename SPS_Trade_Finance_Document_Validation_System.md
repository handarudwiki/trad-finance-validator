# Software Product Specification (SPS)
## Trade Finance Document Validation System (LC & SKBDN)

| Field | Detail |
|---|---|
| Document Version | 1.0 |
| Date | July 9, 2026 |
| Status | Draft |
| Based On | BRD v1.0 — Trade Finance Document Validation System |
| Tech Stack | Next.js, PostgreSQL, Qdrant, Gemini, Prisma, Zod, React Hook Form |

---

## 1. System Overview

A full-stack AI-assisted document validation platform for trade finance operations. Users upload an LC or SKBDN source document and its supporting documents; the system extracts structured data, runs deterministic and LLM-based interpretive validation, and delivers a structured discrepancy report with regulatory citations.

**Phase 1 scope: validation only. Document generation is out of scope.**

---

## 2. Tech Stack & Rationale

| Layer | Technology | Role |
|---|---|---|
| Frontend | Next.js 15 (App Router) | Server components, file upload, report rendering |
| Forms | React Hook Form + Zod | Field validation, extraction review gate, form state |
| ORM | Prisma | Type-safe database access |
| Database | PostgreSQL | Transactional data: transactions, documents, findings |
| Vector Store | Qdrant | RAG knowledge base for UCP 600, ISBP 745, PBI SKBDN |
| AI / LLM | Gemini (vision-capable) | Document extraction + interpretive validation |
| Runtime | Node.js (Next.js API Routes / Server Actions) | Backend logic, orchestration |


---

## 3. Data Architecture

### 3.1 PostgreSQL Schema (Prisma)

#### `Transaction`
Represents one LC or SKBDN validation session.

```prisma
model Transaction {
  id                String              @id @default(cuid())
  type              TransactionType     // LC | SKBDN
  status            TransactionStatus   // DRAFT | EXTRACTION_REVIEW | VALIDATING | COMPLETED | FAILED
  createdAt         DateTime            @default(now())
  updatedAt         DateTime            @updatedAt
  sourceDocument    SourceDocument?
  supportingDocs    SupportingDocument[]
  discrepancyReport DiscrepancyReport?
}

enum TransactionType {
  LC
  SKBDN
}

enum TransactionStatus {
  DRAFT
  EXTRACTION_REVIEW
  VALIDATING
  COMPLETED
  FAILED
}
```

#### `SourceDocument`
The LC or SKBDN instrument itself.

```prisma
model SourceDocument {
  id              String      @id @default(cuid())
  transactionId   String      @unique
  transaction     Transaction @relation(fields: [transactionId], references: [id])
  filePath        String      // storage path
  mimeType        String
  extractedFields Json        // structured extraction result
  reviewedFields  Json?       // user-corrected version
  confidence      Json?       // per-field confidence scores
  extractedAt     DateTime?
  reviewedAt      DateTime?
}
```

#### `SupportingDocument`
Each required supporting document per transaction.

```prisma
model SupportingDocument {
  id            String       @id @default(cuid())
  transactionId String
  transaction   Transaction  @relation(fields: [transactionId], references: [id])
  documentType  DocumentType // INVOICE | PACKING_LIST | BILL_OF_LADING | etc.
  filePath      String
  mimeType      String
  extractedData Json?
  uploadedAt    DateTime     @default(now())
  extractedAt   DateTime?
  findings      Finding[]
}
```


#### `DiscrepancyReport`

```prisma
model DiscrepancyReport {
  id            String      @id @default(cuid())
  transactionId String      @unique
  transaction   Transaction @relation(fields: [transactionId], references: [id])
  generatedAt   DateTime    @default(now())
  summary       Json        // total counts per severity
  findings      Finding[]
  exportPath    String?     // PDF export path
}

model Finding {
  id                  String             @id @default(cuid())
  reportId            String
  report              DiscrepancyReport  @relation(fields: [reportId], references: [id])
  supportingDocId     String?
  supportingDoc       SupportingDocument? @relation(fields: [supportingDocId], references: [id])
  checkType           CheckType          // DETERMINISTIC | INTERPRETIVE | CROSS_DOCUMENT
  severity            Severity           // FATAL | MAJOR | MINOR
  field               String
  expected            String?
  found               String?
  description         String
  suggestedCorrection String?
  regulatoryRef       String             // e.g. "UCP 600 Art. 14(a)" or "ISBP 745 A1"
  ragChunkIds         String[]           // Qdrant chunk IDs used for this finding
}

enum DocumentType {
  BILL_OF_EXCHANGE
  COMMERCIAL_INVOICE
  PACKING_LIST
  BILL_OF_LADING
  AIRWAY_BILL
  SURAT_JALAN
  CERTIFICATE_OF_ORIGIN
  INSURANCE_CERTIFICATE
  INSPECTION_CERTIFICATE
  BENEFICIARY_CERTIFICATE
  CERTIFICATE_OF_ANALYSIS
  PHYTOSANITARY_CERTIFICATE
  OTHER
}

enum CheckType {
  DETERMINISTIC
  INTERPRETIVE
  CROSS_DOCUMENT
}

enum Severity {
  FATAL
  MAJOR
  MINOR
}
```

### 3.2 Qdrant Collections

**Collection: `regulatory_knowledge`**

Each document chunk represents one article or clause.

```json
{
  "id": "ucp600-art14a",
  "vector": [/* embedding */],
  "payload": {
    "source": "UCP_600",
    "article": "14(a)",
    "title": "Standard for Examination of Documents",
    "text": "A nominated bank acting on its nomination...",
    "relatedClauses": ["ISBP_745_A1", "ISBP_745_A4"],
    "applicableTo": ["LC"],
    "documentTypes": ["ALL"]
  }
}
```

Chunking rule: one chunk per article/clause. No arbitrary token splits.
Metadata filters used at query time: `source`, `applicableTo`, `documentTypes`.


---

## 4. Zod Schemas

Zod is used for API request/response validation, form schema, and extraction output validation.

### 4.1 Transaction Creation

```typescript
// schema/transaction.ts
import { z } from 'zod'

export const CreateTransactionSchema = z.object({
  type: z.enum(['LC', 'SKBDN']),
})

export const TransactionTypeSchema = z.enum(['LC', 'SKBDN'])
```

### 4.2 Extracted LC/SKBDN Fields

```typescript
// schema/extraction.ts
export const ExtractedLCFieldsSchema = z.object({
  lcNumber: z.string().min(1),
  issueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  expiryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  expiryPlace: z.string(),
  issuingBank: z.object({
    name: z.string(),
    address: z.string().optional(),
    swiftCode: z.string().optional(),
  }),
  advisingBank: z.object({
    name: z.string(),
    address: z.string().optional(),
    swiftCode: z.string().optional(),
  }).optional(),
  applicant: z.object({ name: z.string(), address: z.string() }),
  beneficiary: z.object({ name: z.string(), address: z.string() }),
  currency: z.string().length(3),
  amount: z.number().positive(),
  tolerancePct: z.number().min(0).max(100).optional(),
  paymentTenor: z.string(),
  availableWith: z.string(),
  availableBy: z.string(),
  goodsDescription: z.string(),
  quantity: z.string().optional(),
  incoterms: z.string(),
  portOfLoading: z.string(),
  portOfDischarge: z.string(),
  latestShipmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  partialShipment: z.enum(['ALLOWED', 'NOT_ALLOWED', 'NOT_SPECIFIED']),
  transshipment: z.enum(['ALLOWED', 'NOT_ALLOWED', 'NOT_SPECIFIED']),
  presentationPeriodDays: z.number().int().positive().optional(),
  requiredDocuments: z.array(z.object({
    documentType: z.string(),
    originals: z.number().int().min(0),
    copies: z.number().int().min(0),
    requirements: z.string().optional(),
  })),
  additionalConditions: z.string().optional(),
  confidence: z.record(z.string(), z.number().min(0).max(1)).optional(),
})

export type ExtractedLCFields = z.infer<typeof ExtractedLCFieldsSchema>
```

### 4.3 Finding Schema

```typescript
// schema/finding.ts
export const FindingSchema = z.object({
  checkType: z.enum(['DETERMINISTIC', 'INTERPRETIVE', 'CROSS_DOCUMENT']),
  severity: z.enum(['FATAL', 'MAJOR', 'MINOR']),
  field: z.string(),
  expected: z.string().optional(),
  found: z.string().optional(),
  description: z.string(),
  suggestedCorrection: z.string().optional(),
  regulatoryRef: z.string(),
  ragChunkIds: z.array(z.string()).default([]),
})

export type Finding = z.infer<typeof FindingSchema>
```


---

## 5. API Routes (Next.js App Router)

All routes are under `app/api/`. Server Actions are used for form submissions.

### 5.1 Route Map

| Method | Path | Description |
|---|---|---|
| POST | `/api/transactions` | Create new transaction (LC or SKBDN) |
| GET | `/api/transactions/:id` | Get transaction status and details |
| POST | `/api/transactions/:id/source-document` | Upload LC/SKBDN document (multipart) |
| POST | `/api/transactions/:id/extract` | Trigger extraction of source document |
| PATCH | `/api/transactions/:id/review` | Submit user-reviewed/corrected extracted fields |
| POST | `/api/transactions/:id/supporting-documents` | Upload one supporting document |
| POST | `/api/transactions/:id/validate` | Trigger full validation run |
| GET | `/api/transactions/:id/report` | Fetch discrepancy report |
| GET | `/api/transactions/:id/report/export` | Download PDF report |

### 5.2 Key Request/Response Shapes

**POST `/api/transactions`**
```typescript
// Request
{ type: 'LC' | 'SKBDN' }

// Response
{ id: string; type: string; status: 'DRAFT' }
```

**PATCH `/api/transactions/:id/review`**
```typescript
// Request body — user-corrected fields (full ExtractedLCFields object)
ExtractedLCFields

// Response
{ status: 'EXTRACTION_REVIEW'; reviewedAt: string; requiredDocuments: RequiredDocument[] }
```

**POST `/api/transactions/:id/validate`**
```typescript
// No body — triggers async validation pipeline
// Response (202 Accepted)
{ message: 'Validation started'; transactionId: string }
```

**GET `/api/transactions/:id/report`**
```typescript
// Response
{
  reportId: string;
  generatedAt: string;
  summary: { fatal: number; major: number; minor: number; total: number };
  findings: Finding[];       // grouped by supporting document
}
```


---

## 6. Core Service Modules

### 6.1 Extraction Service (`lib/extraction/`)

Responsible for calling Gemini with the uploaded document (base64 or file URI) and parsing structured output.

```
lib/
  extraction/
    extractSourceDocument.ts    // calls Gemini vision → returns ExtractedLCFields
    extractSupportingDocument.ts // calls Gemini vision → returns per-doc JSON
    prompts/
      lcExtractionPrompt.ts
      skbdnExtractionPrompt.ts
      invoiceExtractionPrompt.ts
      packingListExtractionPrompt.ts
      billOfLadingExtractionPrompt.ts
      // ... one prompt template per document type
```

**Gemini call pattern (extraction):**
```typescript
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function extractSourceDocument(
  fileBuffer: Buffer,
  mimeType: string,
  transactionType: 'LC' | 'SKBDN',
): Promise<ExtractedLCFields> {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' })
  const prompt = transactionType === 'LC' ? lcExtractionPrompt : skbdnExtractionPrompt
  const result = await model.generateContent([
    { inlineData: { data: fileBuffer.toString('base64'), mimeType } },
    prompt,
  ])
  const json = JSON.parse(result.response.text())
  return ExtractedLCFieldsSchema.parse(json)
}
```

### 6.2 RAG Service (`lib/rag/`)

Handles embedding generation and Qdrant retrieval.

```
lib/
  rag/
    embed.ts           // wraps Gemini embedding model
    retrieve.ts        // queries Qdrant with metadata filters
    ingest.ts          // CLI script for loading regulatory docs into Qdrant
```

**Retrieval pattern:**
```typescript
// lib/rag/retrieve.ts
import { QdrantClient } from '@qdrant/js-client-rest'

const qdrant = new QdrantClient({ url: process.env.QDRANT_URL })

export async function retrieveRegulatory(
  query: string,
  transactionType: 'LC' | 'SKBDN',
  documentType?: string,
  topK = 5,
) {
  const embedding = await embedText(query)
  const filter = {
    must: [
      { key: 'applicableTo', match: { any: [transactionType, 'ALL'] } },
      ...(documentType ? [{ key: 'documentTypes', match: { any: [documentType, 'ALL'] } }] : []),
    ],
  }
  const results = await qdrant.search('regulatory_knowledge', {
    vector: embedding,
    filter,
    limit: topK,
    with_payload: true,
  })
  return results.map(r => r.payload)
}
```

### 6.3 Validation Service (`lib/validation/`)

Orchestrates deterministic and interpretive checks per document type.

```
lib/
  validation/
    orchestrator.ts            // entry point: runs all validators for a transaction
    deterministic/
      dateChecks.ts            // expiry, latest shipment, presentation period
      amountChecks.ts          // amount vs LC + tolerance
      currencyChecks.ts
      quantityChecks.ts
    interpretive/
      partyNameConsistency.ts  // Gemini + RAG
      goodsDescriptionCheck.ts // Gemini + RAG
      mandatoryWordingCheck.ts // Gemini + RAG
    crossDocument/
      consistencyValidator.ts  // container no., weight, quantity across docs
    validators/
      invoiceValidator.ts
      packingListValidator.ts
      billOfLadingValidator.ts
      certificateOfOriginValidator.ts
      insuranceCertificateValidator.ts
      // ... one file per document type
```


**Orchestrator pattern:**
```typescript
// lib/validation/orchestrator.ts
export async function runValidation(transactionId: string): Promise<void> {
  const tx = await prisma.transaction.findUniqueOrThrow({
    where: { id: transactionId },
    include: { sourceDocument: true, supportingDocs: true },
  })

  const lcFields = tx.sourceDocument!.reviewedFields as ExtractedLCFields

  // 1. Run extraction for any supporting docs not yet extracted (parallel)
  await Promise.all(
    tx.supportingDocs
      .filter(d => !d.extractedData)
      .map(d => extractAndStoreSupportingDoc(d)),
  )

  // 2. Re-fetch with extracted data
  const docs = await prisma.supportingDocument.findMany({ where: { transactionId } })

  // 3. Per-document validators
  const allFindings: Finding[] = []
  for (const doc of docs) {
    const validator = getValidator(doc.documentType)
    const findings = await validator.validate(lcFields, doc.extractedData, tx.type)
    allFindings.push(...findings)
  }

  // 4. Cross-document consistency
  const crossFindings = await runCrossDocumentValidation(lcFields, docs)
  allFindings.push(...crossFindings)

  // 5. Persist report
  await persistReport(transactionId, allFindings)

  await prisma.transaction.update({
    where: { id: transactionId },
    data: { status: 'COMPLETED' },
  })
}
```

---

## 7. Frontend Architecture (Next.js App Router)

### 7.1 Page Structure

```
app/
  (marketing)/
    page.tsx                         // landing / home
  transactions/
    new/
      page.tsx                       // Step 1: Select LC or SKBDN
    [id]/
      upload/
        page.tsx                     // Step 2: Upload source document
      review/
        page.tsx                     // Step 3: Review extracted fields (React Hook Form)
      documents/
        page.tsx                     // Step 4: Upload supporting documents
      validate/
        page.tsx                     // Step 5: Trigger validation / progress
      report/
        page.tsx                     // Step 6: View discrepancy report
        export/
          route.ts                   // PDF download endpoint
  api/
    transactions/
      route.ts
      [id]/
        route.ts
        source-document/route.ts
        extract/route.ts
        review/route.ts
        supporting-documents/route.ts
        validate/route.ts
        report/route.ts
        report/export/route.ts
```

### 7.2 Key UI Components

| Component | Description |
|---|---|
| `TransactionTypeSelector` | Radio card: LC or SKBDN |
| `DocumentUploader` | Drag-and-drop file upload with progress |
| `ExtractionReviewForm` | React Hook Form + Zod; shows all extracted fields with confidence badges; allows correction |
| `DocumentChecklist` | Dynamic list of required documents from extraction; upload slot per item |
| `ValidationProgress` | Polling indicator while validation runs |
| `DiscrepancyReport` | Grouped findings: per-document → per-field; severity badge; regulatory ref; suggested fix |
| `FindingCard` | Single finding: severity color, field, description, RAG source, correction |
| `ReportExportButton` | Triggers PDF generation/download |


### 7.3 Extraction Review Form (React Hook Form + Zod)

The review gate is the most critical form. All extracted LC/SKBDN fields are editable.

```typescript
// app/transactions/[id]/review/ExtractionReviewForm.tsx
'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ExtractedLCFieldsSchema, type ExtractedLCFields } from '@/schema/extraction'

interface Props {
  initialValues: ExtractedLCFields
  onSubmit: (data: ExtractedLCFields) => Promise<void>
}

export function ExtractionReviewForm({ initialValues, onSubmit }: Props) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ExtractedLCFields>({
    resolver: zodResolver(ExtractedLCFieldsSchema),
    defaultValues: initialValues,
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Field groups: Identity, Financial, Goods & Shipment, Required Documents */}
      {/* Each field shows confidence badge if confidence[fieldName] < 0.85 */}
      <button type="submit" disabled={isSubmitting}>
        Confirm & Proceed to Document Upload
      </button>
    </form>
  )
}
```

Confidence threshold: fields with confidence < 0.85 are highlighted in amber and must be explicitly confirmed by the user before the form can be submitted.

---

## 8. Validation Logic Detail

### 8.1 Deterministic Checks

Executed in TypeScript, no LLM call. Examples:

| Check | Rule | Severity |
|---|---|---|
| Expiry date | `supportingDoc.date <= lcFields.expiryDate` | FATAL |
| Amount | `invoice.amount <= lcFields.amount * (1 + tolerance/100)` | FATAL |
| Currency | `invoice.currency === lcFields.currency` | FATAL |
| Presentation period | `billOfLading.date + presentationDays <= expiryDate` | FATAL |
| Late shipment | `billOfLading.onBoardDate <= lcFields.latestShipmentDate` | FATAL |
| Quantity | `invoice.quantity == packingList.quantity` | MAJOR |

### 8.2 Interpretive Checks (Gemini + RAG)

Each interpretive call follows this pattern:
1. Retrieve top-K regulatory chunks from Qdrant using a targeted query.
2. Construct a structured prompt: regulatory context + LC fields + extracted doc values.
3. Call Gemini with the prompt.
4. Parse the JSON response into `Finding[]`.

**Example — Party Name Consistency:**
```typescript
// lib/validation/interpretive/partyNameConsistency.ts
export async function checkPartyNameConsistency(
  lcFields: ExtractedLCFields,
  docData: Record<string, unknown>,
  transactionType: 'LC' | 'SKBDN',
): Promise<Finding[]> {
  const ragContext = await retrieveRegulatory(
    'name variations beneficiary applicant consistency',
    transactionType,
    'ALL',
  )

  const prompt = buildPartyNamePrompt(lcFields, docData, ragContext)
  const result = await geminiModel.generateContent(prompt)
  const json = JSON.parse(result.response.text())
  return z.array(FindingSchema).parse(json)
}
```

**Grouped interpretive call strategy:**

| Call Group | Checks Covered | Shared RAG Query |
|---|---|---|
| Party identity | Beneficiary name, applicant name | "name variations acceptable UCP ISBP" |
| Goods description | Description consistency across docs | "goods description consistency invoice" |
| Mandatory wording | Certificate wording requirements | "mandatory wording certificate beneficiary" |
| Insurance coverage | Coverage amount, risks | "insurance percentage CIF value" |

### 8.3 Cross-Document Consistency

After all per-document extractions are complete, a final pass checks:
- Container number consistency across B/L, Packing List, Insurance Certificate.
- Total gross weight across Packing List, B/L, Insurance Certificate.
- Quantity across Invoice, Packing List.
- Port of loading/discharge across B/L and Insurance Certificate.


---

## 9. Gemini Integration Details

### 9.1 Model Selection

| Task | Model | Reason |
|---|---|---|
| Document extraction | `gemini-1.5-pro` | Vision capability required for scan/image/PDF |
| Interpretive validation | `gemini-1.5-pro` | Complex regulatory reasoning, long context |
| Embeddings | `text-embedding-004` | For Qdrant ingestion and retrieval |

### 9.2 Extraction Prompt Contract

Each extraction prompt must instruct Gemini to:
- Return a single JSON object matching the target Zod schema.
- Include a `confidence` map (`{ [fieldName]: 0.0–1.0 }`).
- Use `null` for fields not found in the document rather than guessing.
- Not hallucinate amounts, dates, or names — use `null` with low confidence instead.

### 9.3 Interpretive Validation Prompt Contract

Each interpretive prompt must instruct Gemini to:
- Return a JSON array of findings matching `FindingSchema[]`.
- Return an empty array `[]` if no discrepancy is found for that check group.
- Cite the specific regulatory article used for each finding.
- Use only the provided regulatory context (RAG chunks) for citations — no hallucinated references.

---

## 10. Project Directory Structure

```
trade-finance-validator/
├── app/
│   ├── (marketing)/page.tsx
│   ├── transactions/
│   │   ├── new/page.tsx
│   │   └── [id]/
│   │       ├── upload/page.tsx
│   │       ├── review/page.tsx
│   │       ├── documents/page.tsx
│   │       ├── validate/page.tsx
│   │       └── report/page.tsx
│   └── api/
│       └── transactions/
│           ├── route.ts
│           └── [id]/
│               ├── route.ts
│               ├── source-document/route.ts
│               ├── extract/route.ts
│               ├── review/route.ts
│               ├── supporting-documents/route.ts
│               ├── validate/route.ts
│               └── report/
│                   ├── route.ts
│                   └── export/route.ts
├── components/
│   ├── TransactionTypeSelector.tsx
│   ├── DocumentUploader.tsx
│   ├── ExtractionReviewForm.tsx
│   ├── DocumentChecklist.tsx
│   ├── ValidationProgress.tsx
│   ├── DiscrepancyReport.tsx
│   ├── FindingCard.tsx
│   └── ReportExportButton.tsx
├── lib/
│   ├── extraction/
│   │   ├── extractSourceDocument.ts
│   │   ├── extractSupportingDocument.ts
│   │   └── prompts/
│   ├── rag/
│   │   ├── embed.ts
│   │   ├── retrieve.ts
│   │   └── ingest.ts
│   ├── validation/
│   │   ├── orchestrator.ts
│   │   ├── deterministic/
│   │   ├── interpretive/
│   │   ├── crossDocument/
│   │   └── validators/
│   └── pdf/
│       └── generateReport.ts
├── prisma/
│   └── schema.prisma
├── schema/
│   ├── transaction.ts
│   ├── extraction.ts
│   └── finding.ts
├── scripts/
│   └── ingest-regulatory-docs.ts
├── public/
├── .env.local
├── next.config.ts
└── package.json
```


---

## 11. Environment Variables

```env
# .env.local

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/trade_finance"

# Qdrant
QDRANT_URL="http://localhost:6333"
QDRANT_COLLECTION="regulatory_knowledge"

# Gemini
GEMINI_API_KEY="your-gemini-api-key"

# File Storage (local or S3-compatible)
STORAGE_PATH="./uploads"
# or for S3:
# AWS_BUCKET_NAME="trade-finance-docs"
# AWS_REGION="ap-southeast-1"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

## 12. Non-Functional Implementation Notes

### 12.1 Parallelized Extraction
Supporting document extraction calls are run with `Promise.all()`. Each document is independent, so all Gemini extraction calls fire concurrently.

### 12.2 Low-Confidence Field Flagging
Fields with `confidence < 0.85` in the extraction response are rendered with an amber badge in the review form. The form submit button is disabled until the user explicitly clicks a confirmation checkbox for each flagged field.

### 12.3 Regulatory Citation on Every Finding
Every `Finding` record stores `regulatoryRef` (e.g., `"ISBP 745 A21"`) and `ragChunkIds` (Qdrant point IDs). The report UI links each finding to its source clause text, fetched from Qdrant on demand.

### 12.4 Amendment Versioning
If a user uploads an LC amendment, the system creates a new version of `SourceDocument.reviewedFields` and re-runs validation. Previous runs are retained for audit. Validation always uses the latest reviewed version.

### 12.5 RAG Knowledge Base Updateability
The `scripts/ingest-regulatory-docs.ts` script handles chunking and ingestion into Qdrant independently of the application. Updating ICC ISBP or BI PBI rules requires only re-running this script, not redeploying the app.

### 12.6 Security
- Uploaded files are stored server-side with a UUID path, not the original filename.
- API routes validate user session (Next.js Auth or session cookie).
- File access is gated through the API; no direct public file URL.
- All database queries go through Prisma (parameterized — no raw SQL injection risk).

---

## 13. Key Dependencies

```json
{
  "dependencies": {
    "next": "15.x",
    "react": "18.x",
    "react-dom": "18.x",
    "@prisma/client": "5.x",
    "@google/generative-ai": "latest",
    "@qdrant/js-client-rest": "latest",
    "react-hook-form": "7.x",
    "@hookform/resolvers": "3.x",
    "zod": "3.x",
    "pdf-lib": "latest",
    "sharp": "latest"
  },
  "devDependencies": {
    "prisma": "5.x",
    "typescript": "5.x",
    "@types/node": "20.x",
    "@types/react": "18.x"
  }
}
```

---

## 14. User Flow Summary

```
[Select LC/SKBDN]
       ↓
[Upload source document (LC/SKBDN)]
       ↓
[Extraction: Gemini vision → ExtractedLCFields JSON]
       ↓
[Review Gate: React Hook Form + Zod — user confirms/corrects all fields]
       ↓
[Dynamic checklist: required docs listed from extraction]
       ↓
[Upload each supporting document into its slot]
       ↓
[Trigger Validation]
       ↓
[Extraction (parallel): all supporting docs → JSON]
       ↓
[Deterministic checks (code)]
       ↓
[Interpretive checks (Gemini + Qdrant RAG, grouped by context)]
       ↓
[Cross-document consistency check]
       ↓
[Discrepancy Report: per-doc → per-field → severity → regulatory ref → fix]
       ↓
[Export PDF]
```

---

*End of Software Product Specification*
