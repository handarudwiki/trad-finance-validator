-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('LC', 'SKBDN');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('DRAFT', 'EXTRACTION_REVIEW', 'VALIDATING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('BILL_OF_EXCHANGE', 'COMMERCIAL_INVOICE', 'PACKING_LIST', 'BILL_OF_LADING', 'AIRWAY_BILL', 'SURAT_JALAN', 'CERTIFICATE_OF_ORIGIN', 'INSURANCE_CERTIFICATE', 'INSPECTION_CERTIFICATE', 'BENEFICIARY_CERTIFICATE', 'CERTIFICATE_OF_ANALYSIS', 'PHYTOSANITARY_CERTIFICATE', 'OTHER');

-- CreateEnum
CREATE TYPE "CheckType" AS ENUM ('DETERMINISTIC', 'INTERPRETIVE', 'CROSS_DOCUMENT');

-- CreateEnum
CREATE TYPE "Severity" AS ENUM ('FATAL', 'MAJOR', 'MINOR');

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "status" "TransactionStatus" NOT NULL DEFAULT 'DRAFT',
    "errorDetails" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SourceDocument" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "extractedFields" JSONB,
    "reviewedFields" JSONB,
    "previousVersions" JSONB[] DEFAULT ARRAY[]::JSONB[],
    "confidence" JSONB,
    "extractedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SourceDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportingDocument" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "documentType" "DocumentType" NOT NULL,
    "filePath" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "extractedData" JSONB,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "extractedAt" TIMESTAMP(3),

    CONSTRAINT "SupportingDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiscrepancyReport" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "summary" JSONB NOT NULL,
    "exportPath" TEXT,

    CONSTRAINT "DiscrepancyReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Finding" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "supportingDocId" TEXT,
    "checkType" "CheckType" NOT NULL,
    "severity" "Severity" NOT NULL,
    "field" TEXT NOT NULL,
    "expected" TEXT,
    "found" TEXT,
    "description" TEXT NOT NULL,
    "suggestedCorrection" TEXT,
    "regulatoryRef" TEXT NOT NULL,
    "ragChunkIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Finding_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SourceDocument_transactionId_key" ON "SourceDocument"("transactionId");

-- CreateIndex
CREATE INDEX "SupportingDocument_transactionId_idx" ON "SupportingDocument"("transactionId");

-- CreateIndex
CREATE UNIQUE INDEX "DiscrepancyReport_transactionId_key" ON "DiscrepancyReport"("transactionId");

-- AddForeignKey
ALTER TABLE "SourceDocument" ADD CONSTRAINT "SourceDocument_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportingDocument" ADD CONSTRAINT "SupportingDocument_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscrepancyReport" ADD CONSTRAINT "DiscrepancyReport_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Finding" ADD CONSTRAINT "Finding_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "DiscrepancyReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Finding" ADD CONSTRAINT "Finding_supportingDocId_fkey" FOREIGN KEY ("supportingDocId") REFERENCES "SupportingDocument"("id") ON DELETE SET NULL ON UPDATE CASCADE;
