# Business Requirements Document (BRD)
## Trade Finance Document Validation System (LC & SKBDN)

| Field | Detail |
|---|---|
| Document Version | 1.0 |
| Date | July 9, 2026 |
| Status | Draft |
| Prepared For | Trade Finance Digitalization Initiative |

---

## 1. Executive Summary

Trade finance operations — both international Letters of Credit (LC) and domestic Surat Kredit Berdokumen Dalam Negeri (SKBDN) — remain heavily manual and paper-based. Each transaction requires 8–12 distinct document types, totaling 100+ pages when combined, all of which must comply with strict, precise regulatory frameworks (UCP 600 and ISBP 745 for LC; PBI No. 5/6/PBI/2003 for SKBDN). Manual cross-checking of these documents against the credit instrument is slow, error-prone, and a leading cause of payment delays due to discrepancies.

This system proposes an AI-assisted document validation platform that uses vision-capable LLMs (e.g., Gemini) for document extraction, combined with a Retrieval-Augmented Generation (RAG) knowledge base of governing rules, to automatically detect and report discrepancies between the credit instrument (LC/SKBDN) and its supporting documents — before submission to the bank.

**Phase 1 scope is validation only.** Automated document generation is explicitly out of scope for this phase and is proposed as a future roadmap item (see Section 12).

---

## 2. Background & Problem Statement

### 2.1 Current State

- Trade finance document processing is largely manual, paper-based, and repetitive.
- A single documentary credit transaction can involve up to 100+ pages of printed, signed, and stamped documents (BNP Paribas Trade Finance Report, 2024).
- Between 8–12 distinct document types are typically required per transaction (e.g., Commercial Invoice, Packing List, Bill of Lading, Certificate of Origin, Insurance Certificate, Inspection Certificate, Beneficiary's Certificate, Certificate of Analysis, Phytosanitary Certificate, Bill of Exchange, and the LC/amendments themselves).
- Multiple regulatory regimes apply depending on transaction type and geography:
  - **LC (international trade):** UCP 600 and ISBP 745, published by the International Chamber of Commerce (ICC).
  - **SKBDN (domestic trade):** Peraturan Bank Indonesia (PBI) No. 5/6/PBI/2003, plus local bank practice.
- Industry data indicates a high global first-presentation discrepancy rate, causing delayed payments, discrepancy fees, and repeated document resubmission cycles.

### 2.2 Problem Statement

Exporters and trade finance staff currently rely on manual, field-by-field comparison between the LC/SKBDN and each supporting document. This process is:
- Time-consuming (multiple documents, each requiring cross-reference to LC terms).
- Dependent on staff expertise in UCP 600 / ISBP 745 / PBI regulations.
- Error-prone, particularly for nuanced compliance rules (e.g., acceptable name variations, goods description consistency) that require interpretive judgment rather than simple text matching.
- A key contributor to trade finance payment delays and cost overruns.

### 2.3 Opportunity

An AI-assisted validation layer — combining deterministic rule checks with LLM-based interpretive reasoning grounded in the correct regulatory context (RAG) — can significantly reduce discrepancy rates, cut document review time, and lower the expertise barrier for staff performing document checks, without requiring the business to change its existing document creation workflow.

---

## 3. Business Objectives

| # | Objective | Success Indicator |
|---|---|---|
| 1 | Reduce document discrepancy rate before bank submission | Measurable reduction in flagged discrepancies at first bank presentation |
| 2 | Reduce document review time per transaction | Reduction in average hours spent on manual cross-checking |
| 3 | Support both international (LC) and domestic (SKBDN) trade instruments | Both transaction types fully supported with correct regulatory context |
| 4 | Provide auditable, explainable validation output | Every finding traceable to a specific regulatory article/clause |
| 5 | Minimize implementation risk before expanding to document generation | Successful validation-only MVP adoption before Phase 2 |

---

## 4. Scope

### 4.1 In Scope (Phase 1)

- Upload and extraction of LC or SKBDN source document (image/scan/PDF).
- Extraction of key structured fields from the LC/SKBDN.
- User review and correction of extracted fields before proceeding.
- Dynamic generation of a required-supporting-document checklist based on extracted LC/SKBDN requirements.
- Upload and extraction of each supporting document.
- Validation of each supporting document against LC/SKBDN requirements, using:
  - Deterministic rule checks (dates, amounts, currency, quantities).
  - LLM + RAG interpretive checks (name consistency, goods description consistency, wording requirements), grounded in the correct rule set depending on transaction type (UCP 600 + ISBP 745 for LC; PBI SKBDN regulation for SKBDN).
- Cross-document consistency checks (e.g., container number, weight, quantity consistency across documents).
- Structured discrepancy report: per document, per field, severity classification, regulatory reference, and suggested correction.
- Exportable discrepancy report (e.g., PDF) for internal record-keeping.

### 4.2 Out of Scope (Phase 1)

- Automated generation of trade finance documents (Invoice, Packing List, Bill of Exchange, Beneficiary's Certificate, etc.).
- Integration with external systems of record (ERP, warehouse management, freight forwarder booking systems, laboratories, certification bodies).
- Electronic presentation of documents (eUCP) workflows.
- Direct submission of documents to issuing/advising banks.
- Fine-tuning of any underlying LLM model.

### 4.3 Future Scope (Phase 2+)

- Template-based automated generation of self-correctable documents (Invoice, Packing List, Bill of Exchange, Beneficiary's Certificate) using data pulled from internal systems (ERP/WMS).
- Integration with external institutions (shipping lines, Chamber of Commerce, inspection/testing bodies) for documents that require third-party issuance.
- Support for eUCP and electronic presentation workflows.

---

## 5. Stakeholders

| Role | Interest / Involvement |
|---|---|
| Export Documentation Staff / Export Admin | Primary end user; prepares and uploads documents for validation |
| Trade Finance Officer / LC Officer | Reviews validation output; makes final compliance judgment |
| Compliance / Audit | Requires traceable, rule-referenced validation output |
| Bank (Issuing/Advising/Negotiating) | Indirect beneficiary — receives fewer non-compliant presentations |
| Product/Engineering Team | Builds and maintains extraction, validation, and RAG infrastructure |

---

## 6. User Workflow (Functional Flow)

1. **Select transaction type:** User selects "LC" or "SKBDN." This determines both the extraction schema and the RAG knowledge base used downstream (UCP 600 + ISBP 745 for LC; PBI SKBDN regulation for SKBDN).
2. **Upload source document:** User uploads the LC or SKBDN (scan/image/PDF).
3. **Extraction:** System extracts key structured fields (see Section 8) using a vision-capable LLM.
4. **Review & correction gate:** Extracted fields are displayed to the user with confidence indicators where available. User reviews and corrects any misread fields before proceeding. This step is mandatory, not optional, to prevent downstream validation errors caused by extraction mistakes.
5. **Supporting document checklist generated:** Based on the extracted "required documents" list from the LC/SKBDN, the system dynamically presents an upload slot for each required document type, along with the specific requirement notes extracted for that document (e.g., "Insurance must cover 110% of invoice value").
6. **Supporting document upload:** User uploads each supporting document into its corresponding slot.
7. **Process:** User triggers validation.
8. **Validation execution:**
   - Per-document validation (deterministic + interpretive checks) against LC/SKBDN requirements.
   - Cross-document consistency validation across all supporting documents.
9. **Result output:** Structured discrepancy report displayed: per document → per field → status → severity → regulatory reference → suggested correction.
10. **Export:** User may export the discrepancy report for internal documentation or compliance records.

---

## 7. Regulatory Context (RAG Knowledge Base Requirements)

| Transaction Type | Governing Rules | Role in System |
|---|---|---|
| LC (international) | UCP 600 (ICC) | General principles: document requirements, presentation rules, bank obligations |
| LC (international) | ISBP 745 (ICC) | Detailed technical practice: field-level interpretation (name variations, date formats, per-document-type requirements) — primary source for granular field validation |
| SKBDN (domestic) | Peraturan Bank Indonesia No. 5/6/PBI/2003 | Governing framework for domestic documentary credit; substitutes UCP 600/ISBP 745 context |
| SKBDN (domestic) | Local bank practice / internal bank SOPs (if available) | Supplementary interpretive context where PBI is silent |

**Note:** ISBP 745 is expected to be the more frequently retrieved source during field-level validation, as UCP 600 provides principles while ISBP 745 provides the practical interpretation needed to judge whether a specific discrepancy is valid.

The knowledge base must be chunked by semantic unit (one article/clause per chunk, not arbitrary token length) and support metadata cross-referencing between UCP 600 and ISBP 745 provisions that refer to one another.

---

## 8. Key Data to Extract from LC / SKBDN

### 8.1 Transaction Identity
- LC/SKBDN Number
- Issue Date, Expiry Date & Place
- Issuing Bank, Advising Bank (name, address, SWIFT code where applicable)
- Applicant (buyer/importer) and Beneficiary (seller/exporter) — full name and address

### 8.2 Financial Data
- Currency and Amount (including tolerance, e.g., "+/- 10%")
- Payment tenor (sight / usance, number of days)
- Available with/by (negotiation, acceptance, deferred payment, etc.)

### 8.3 Goods & Shipment Data
- Goods description
- Quantity and unit
- Incoterms and associated place/port
- Port/Place of Loading and Discharge (LC) or shipment origin/destination (SKBDN)
- Latest shipment date
- Partial shipment and transshipment allowance

### 8.4 Required Documents
- Full list of required documents, with number of originals/copies for each
- Document-specific requirements (e.g., mandatory wording for a certificate, insurance coverage percentage)

### 8.5 Presentation Terms
- Period of presentation after shipment
- Additional conditions / special instructions

---

## 9. Validation Logic Architecture

### 9.1 Core Principle

Validation logic is **not rewritten per transaction**. The system uses a fixed set of document-type validators (one per document type, e.g., Invoice, Packing List, Bill of Lading/Surat Jalan, Certificate of Origin), each parameterized by the data extracted from the specific LC/SKBDN being processed. The number of documents required by a given LC/SKBDN only changes how many times validators are invoked — not the validators themselves.

### 9.2 Two-Layer Structure

**Layer 1 — Document Type Validators (fixed, reusable):**
Each supported document type has one validator containing both deterministic and interpretive checks. Example for Invoice:
- Deterministic: amount ≤ LC amount + tolerance; currency match.
- Interpretive (LLM + RAG): beneficiary/applicant name consistency; goods description consistency.

**Layer 2 — LC/SKBDN Requirements (dynamic parameters):**
Extracted structured data from the credit instrument (Section 8) is passed as input parameters into the relevant validators. The list of required documents determines which validators are invoked and how many times.

### 9.3 Check Classification

| Check Type | Method | Examples |
|---|---|---|
| Deterministic | Rule-based code, no LLM call | Date comparisons, amount/tolerance checks, currency code match, quantity totals |
| Interpretive | LLM + RAG | Name variation acceptability, goods description consistency, mandatory wording compliance |

### 9.4 Cross-Document Validation

A separate validator runs after all individual document validations, checking consistency of shared data points across documents (e.g., container number, total weight, quantity) regardless of which specific documents were required by the LC/SKBDN.

### 9.5 Severity Classification

Each finding must be classified to avoid alert fatigue and support prioritization:

| Severity | Description |
|---|---|
| Fatal | Clear violation with no ambiguity (e.g., LC expired, amount exceeds LC value, late shipment) |
| Major | Significant but potentially defensible discrepancy requiring review |
| Minor | Technical variation generally accepted under ISBP/PBI practice but may be challenged by a conservative bank checker |

---

## 10. LLM Call Architecture

Validation is executed via multiple, purpose-specific LLM calls rather than a single large prompt, for reasons of context precision, debuggability, and parallelization.

### 10.1 Call Categories

1. **Extraction calls** (one per document, parallelizable): convert scanned/image input into structured JSON.
2. **Deterministic checks**: executed in code, no LLM call required.
3. **Interpretive validation calls** (grouped by related context, e.g., all party-identity checks in one call, all goods-description checks in another): retrieve relevant RAG context, then compare extracted values.
4. **Cross-document consistency call(s)**: operate on already-extracted structured data across all documents.

### 10.2 Design Considerations

- Group interpretive checks by shared RAG context to reduce call count without sacrificing retrieval precision.
- Never route purely computable checks (dates, numeric comparisons) through the LLM.
- Extraction calls for independent documents should run in parallel where the underlying platform supports it.

---

## 11. Non-Functional Requirements

| Category | Requirement |
|---|---|
| Accuracy | Extraction must include confidence indicators; low-confidence fields must be flagged for mandatory human review before validation proceeds |
| Auditability | Every validation finding must cite the specific regulatory article/clause (UCP 600, ISBP 745, or PBI SKBDN) used as the basis for the decision |
| Explainability | Output must specify document, field, discrepancy description, severity, and suggested correction — not a flat, unstructured list |
| Versioning | System must support updates to LC amendments (merge/versioning logic so validation always uses the latest amended terms) |
| Data Freshness | RAG knowledge base must be updatable independently of application logic when ICC revises ISBP or BI revises SKBDN regulation |
| Performance | Independent document extraction calls should be parallelized to minimize total processing time per transaction |
| Security | Uploaded trade finance documents contain sensitive commercial and banking data; access control and data handling must meet applicable data protection standards |

---

## 12. Assumptions & Constraints

- No fine-tuning of the underlying LLM is planned for Phase 1; all regulatory knowledge is delivered via RAG.
- The system does not have access to external systems of record (ERP, WMS, forwarder booking systems) in Phase 1; all data comes from user-uploaded documents only.
- Users are assumed to have basic familiarity with trade finance document types but may not be experts in UCP 600/ISBP 745/PBI SKBDN — the system's explanations must be usable by non-specialist staff.
- Document generation (LC/SKBDN-triggered auto-drafting of Invoice, Packing List, etc.) is explicitly deferred to a future phase and is not part of this BRD's Phase 1 scope.

---

## 13. Risks

| Risk | Mitigation |
|---|---|
| OCR/extraction misreads critical fields (amount, dates, names) | Mandatory human review/correction gate before validation runs |
| LLM hallucination on interpretive checks | Ground all interpretive checks in retrieved RAG context; avoid LLM for any purely computable check |
| Alert fatigue from over-flagging minor issues | Severity classification and clear distinction between fatal/major/minor findings |
| Regulatory knowledge base becomes outdated (ISBP/PBI revisions) | RAG-based design allows knowledge base updates without re-engineering validation logic |
| Over-scoping into document generation prematurely | Phase 1 strictly limited to validation; generation deferred to Phase 2 roadmap |

---

## 14. Success Metrics (Proposed)

- Reduction in discrepancy rate at first bank presentation for transactions processed through the system.
- Average reduction in manual document review time per transaction.
- User adoption rate among export documentation / trade finance staff.
- Accuracy rate of extraction (validated against manual review corrections).
- Percentage of findings correctly classified by severity, validated against expert review.

---

## 15. Appendix

### 15.1 Common LC/SKBDN Supporting Document Types

1. Bill of Exchange (Draft)
2. Commercial Invoice
3. Packing List
4. Packing/Weight List (separate)
5. Bill of Lading / Airway Bill (LC) or Surat Jalan / Bukti Terima (SKBDN)
6. Certificate of Origin
7. Insurance Certificate/Policy
8. Inspection Certificate
9. Beneficiary's Certificate
10. Certificate of Analysis (commodity-specific)
11. Phytosanitary/Health Certificate (agricultural/food products)
12. LC/SKBDN itself plus amendments

### 15.2 Regulatory References

- International Chamber of Commerce, *Uniform Customs and Practice for Documentary Credits* (UCP 600), 2007 revision.
- International Chamber of Commerce, *International Standard Banking Practice* (ISBP 745).
- Bank Indonesia, *Peraturan Bank Indonesia No. 5/6/PBI/2003 tentang Surat Kredit Berdokumen Dalam Negeri (SKBDN)*.
- BNP Paribas Trade Finance Report, "How AI Optimises International Trade Finance," 2024.

---

*End of Document*
