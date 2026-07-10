import { PDFDocument, rgb, StandardFonts, PDFPage, PDFFont } from 'pdf-lib'
import { prisma } from '@/lib/prisma'

// Bahasa Indonesia labels (Req 16.7)
const LABELS = {
  reportTitle: 'Laporan Penyimpangan Dokumen Trade Finance',
  generatedAt: 'Tanggal Dibuat',
  transactionId: 'ID Transaksi',
  transactionType: 'Tipe Transaksi',
  status: 'Status',
  summaryTitle: 'Ringkasan Temuan',
  fatal: 'Fatal',
  major: 'Besar',
  minor: 'Kecil',
  total: 'Total',
  findingsPerDoc: 'Temuan per Dokumen',
  crossDocFindings: 'Temuan Lintas Dokumen',
  field: 'Bidang',
  expected: 'Diharapkan',
  found: 'Ditemukan',
  description: 'Deskripsi',
  suggestedCorrection: 'Saran Koreksi',
  regulatoryRef: 'Referensi Regulasi',
} as const

// Indonesian status labels (Req 16.5)
const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draf',
  EXTRACTION_REVIEW: 'Meninjau Ekstraksi',
  VALIDATING: 'Sedang Divalidasi',
  COMPLETED: 'Selesai',
  FAILED: 'Gagal',
}

// Indonesian document type labels
const DOC_TYPE_LABELS: Record<string, string> = {
  BILL_OF_EXCHANGE: 'Bill of Exchange',
  COMMERCIAL_INVOICE: 'Faktur Komersial',
  PACKING_LIST: 'Daftar Pengepakan',
  BILL_OF_LADING: 'Bill of Lading',
  AIRWAY_BILL: 'Airway Bill',
  SURAT_JALAN: 'Surat Jalan',
  CERTIFICATE_OF_ORIGIN: 'Sertifikat Asal',
  INSURANCE_CERTIFICATE: 'Sertifikat Asuransi',
  INSPECTION_CERTIFICATE: 'Sertifikat Inspeksi',
  BENEFICIARY_CERTIFICATE: 'Sertifikat Beneficiary',
  CERTIFICATE_OF_ANALYSIS: 'Sertifikat Analisis',
  PHYTOSANITARY_CERTIFICATE: 'Sertifikat Fitosanitari',
  OTHER: 'Lainnya',
}

// Severity colors
const SEVERITY_COLORS = {
  FATAL: rgb(0.8, 0.1, 0.1),
  MAJOR: rgb(0.85, 0.5, 0.0),
  MINOR: rgb(0.75, 0.65, 0.0),
} as const

// Severity labels in Indonesian
const SEVERITY_LABELS: Record<string, string> = {
  FATAL: 'Fatal',
  MAJOR: 'Besar',
  MINOR: 'Kecil',
}

const PAGE_MARGIN = 50
const PAGE_WIDTH = 595.28 // A4 width in points
const PAGE_HEIGHT = 841.89 // A4 height in points
const CONTENT_WIDTH = PAGE_WIDTH - 2 * PAGE_MARGIN
const LINE_HEIGHT = 16
const SECTION_GAP = 24

interface DrawContext {
  pdfDoc: PDFDocument
  font: PDFFont
  boldFont: PDFFont
  currentPage: PDFPage
  y: number
}

function addPage(ctx: DrawContext): void {
  ctx.currentPage = ctx.pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
  ctx.y = PAGE_HEIGHT - PAGE_MARGIN
}

function ensureSpace(ctx: DrawContext, requiredHeight: number): void {
  if (ctx.y - requiredHeight < PAGE_MARGIN) {
    addPage(ctx)
  }
}

function drawText(
  ctx: DrawContext,
  text: string,
  options?: { font?: PDFFont; size?: number; color?: ReturnType<typeof rgb>; x?: number },
): void {
  const font = options?.font ?? ctx.font
  const size = options?.size ?? 10
  const x = options?.x ?? PAGE_MARGIN

  ensureSpace(ctx, LINE_HEIGHT)
  ctx.currentPage.drawText(text, {
    x,
    y: ctx.y,
    size,
    font,
    color: options?.color ?? rgb(0, 0, 0),
  })
  ctx.y -= LINE_HEIGHT
}

function drawWrappedText(
  ctx: DrawContext,
  text: string,
  options?: { font?: PDFFont; size?: number; color?: ReturnType<typeof rgb>; x?: number; maxWidth?: number },
): void {
  const font = options?.font ?? ctx.font
  const size = options?.size ?? 10
  const x = options?.x ?? PAGE_MARGIN
  const maxWidth = options?.maxWidth ?? CONTENT_WIDTH - (x - PAGE_MARGIN)

  const words = text.split(' ')
  let currentLine = ''

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word
    const testWidth = font.widthOfTextAtSize(testLine, size)

    if (testWidth > maxWidth && currentLine) {
      ensureSpace(ctx, LINE_HEIGHT)
      ctx.currentPage.drawText(currentLine, {
        x,
        y: ctx.y,
        size,
        font,
        color: options?.color ?? rgb(0, 0, 0),
      })
      ctx.y -= LINE_HEIGHT
      currentLine = word
    } else {
      currentLine = testLine
    }
  }

  if (currentLine) {
    ensureSpace(ctx, LINE_HEIGHT)
    ctx.currentPage.drawText(currentLine, {
      x,
      y: ctx.y,
      size,
      font,
      color: options?.color ?? rgb(0, 0, 0),
    })
    ctx.y -= LINE_HEIGHT
  }
}

function drawLabelValue(ctx: DrawContext, label: string, value: string): void {
  ensureSpace(ctx, LINE_HEIGHT)
  const labelWidth = ctx.boldFont.widthOfTextAtSize(`${label}: `, 10)
  ctx.currentPage.drawText(`${label}: `, {
    x: PAGE_MARGIN,
    y: ctx.y,
    size: 10,
    font: ctx.boldFont,
    color: rgb(0, 0, 0),
  })
  ctx.currentPage.drawText(value, {
    x: PAGE_MARGIN + labelWidth,
    y: ctx.y,
    size: 10,
    font: ctx.font,
    color: rgb(0, 0, 0),
  })
  ctx.y -= LINE_HEIGHT
}

function drawHorizontalLine(ctx: DrawContext): void {
  ensureSpace(ctx, 8)
  ctx.currentPage.drawLine({
    start: { x: PAGE_MARGIN, y: ctx.y },
    end: { x: PAGE_WIDTH - PAGE_MARGIN, y: ctx.y },
    thickness: 0.5,
    color: rgb(0.7, 0.7, 0.7),
  })
  ctx.y -= 8
}

export async function generateReportPDF(transactionId: string): Promise<Buffer> {
  const report = await prisma.discrepancyReport.findUniqueOrThrow({
    where: { transactionId },
    include: {
      findings: { include: { supportingDoc: true } },
      transaction: true,
    },
  })

  const pdfDoc = await PDFDocument.create()
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  const ctx: DrawContext = {
    pdfDoc,
    font,
    boldFont,
    currentPage: pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]),
    y: PAGE_HEIGHT - PAGE_MARGIN,
  }

  // === Page 1: Header ===
  drawText(ctx, LABELS.reportTitle, { font: boldFont, size: 16, color: rgb(0.1, 0.1, 0.4) })
  ctx.y -= 8

  drawHorizontalLine(ctx)
  ctx.y -= 4

  const generatedAt = new Date().toLocaleString('id-ID', {
    dateStyle: 'long',
    timeStyle: 'medium',
  })
  drawLabelValue(ctx, LABELS.generatedAt, generatedAt)
  drawLabelValue(ctx, LABELS.transactionId, report.transaction.id)
  drawLabelValue(ctx, LABELS.transactionType, report.transaction.type)
  drawLabelValue(ctx, LABELS.status, STATUS_LABELS[report.transaction.status] ?? report.transaction.status)

  ctx.y -= SECTION_GAP

  // === Summary Table ===
  const summary = report.summary as { fatal: number; major: number; minor: number; total: number }

  drawText(ctx, LABELS.summaryTitle, { font: boldFont, size: 13, color: rgb(0.1, 0.1, 0.4) })
  ctx.y -= 4
  drawHorizontalLine(ctx)

  // Summary grid
  const summaryItems = [
    { label: LABELS.fatal, value: summary.fatal, color: SEVERITY_COLORS.FATAL },
    { label: LABELS.major, value: summary.major, color: SEVERITY_COLORS.MAJOR },
    { label: LABELS.minor, value: summary.minor, color: SEVERITY_COLORS.MINOR },
    { label: LABELS.total, value: summary.total, color: rgb(0, 0, 0) },
  ]

  ensureSpace(ctx, LINE_HEIGHT * 2)
  const colWidth = CONTENT_WIDTH / summaryItems.length
  for (let i = 0; i < summaryItems.length; i++) {
    const item = summaryItems[i]
    const x = PAGE_MARGIN + i * colWidth
    ctx.currentPage.drawText(item.label, {
      x,
      y: ctx.y,
      size: 10,
      font: boldFont,
      color: item.color,
    })
    ctx.currentPage.drawText(String(item.value), {
      x,
      y: ctx.y - LINE_HEIGHT,
      size: 12,
      font: boldFont,
      color: item.color,
    })
  }
  ctx.y -= LINE_HEIGHT * 2 + 8

  ctx.y -= SECTION_GAP

  // === Findings Section ===
  // Group findings by document type, then by severity
  const findingsByDoc = new Map<string, typeof report.findings>()
  const crossDocFindings: typeof report.findings = []

  for (const finding of report.findings) {
    if (finding.checkType === 'CROSS_DOCUMENT' || !finding.supportingDoc) {
      crossDocFindings.push(finding)
    } else {
      const docType = finding.supportingDoc.documentType
      const existing = findingsByDoc.get(docType) ?? []
      existing.push(finding)
      findingsByDoc.set(docType, existing)
    }
  }

  // Render per-document findings
  if (findingsByDoc.size > 0) {
    drawText(ctx, LABELS.findingsPerDoc, { font: boldFont, size: 13, color: rgb(0.1, 0.1, 0.4) })
    ctx.y -= 4
    drawHorizontalLine(ctx)

    const severityOrder = ['FATAL', 'MAJOR', 'MINOR'] as const

    for (const [docType, findings] of findingsByDoc) {
      ensureSpace(ctx, LINE_HEIGHT * 3)
      const docLabel = DOC_TYPE_LABELS[docType] ?? docType
      drawText(ctx, docLabel, { font: boldFont, size: 11, color: rgb(0.2, 0.2, 0.2) })
      ctx.y -= 4

      // Sort findings by severity
      const sortedFindings = [...findings].sort((a, b) => {
        return severityOrder.indexOf(a.severity as typeof severityOrder[number]) -
          severityOrder.indexOf(b.severity as typeof severityOrder[number])
      })

      for (const finding of sortedFindings) {
        drawFinding(ctx, finding)
      }

      ctx.y -= 12
    }
  }

  // Render cross-document findings
  if (crossDocFindings.length > 0) {
    ctx.y -= 8
    drawText(ctx, LABELS.crossDocFindings, { font: boldFont, size: 13, color: rgb(0.1, 0.1, 0.4) })
    ctx.y -= 4
    drawHorizontalLine(ctx)

    for (const finding of crossDocFindings) {
      drawFinding(ctx, finding)
    }
  }

  const pdfBytes = await pdfDoc.save()
  return Buffer.from(pdfBytes)
}

function drawFinding(ctx: DrawContext, finding: {
  severity: string
  field: string
  expected: string | null
  found: string | null
  description: string
  suggestedCorrection: string | null
  regulatoryRef: string
}): void {
  // Estimate required space for this finding
  ensureSpace(ctx, LINE_HEIGHT * 5)

  // Severity badge
  const severityLabel = SEVERITY_LABELS[finding.severity] ?? finding.severity
  const severityColor = SEVERITY_COLORS[finding.severity as keyof typeof SEVERITY_COLORS] ?? rgb(0.5, 0.5, 0.5)

  ctx.currentPage.drawText(`[${severityLabel}]`, {
    x: PAGE_MARGIN + 8,
    y: ctx.y,
    size: 9,
    font: ctx.boldFont,
    color: severityColor,
  })

  const badgeWidth = ctx.boldFont.widthOfTextAtSize(`[${severityLabel}] `, 9)
  ctx.currentPage.drawText(`${LABELS.field}: ${finding.field}`, {
    x: PAGE_MARGIN + 8 + badgeWidth + 4,
    y: ctx.y,
    size: 10,
    font: ctx.boldFont,
    color: rgb(0, 0, 0),
  })
  ctx.y -= LINE_HEIGHT

  const indent = PAGE_MARGIN + 16

  if (finding.expected) {
    drawWrappedText(ctx, `${LABELS.expected}: ${finding.expected}`, { x: indent, size: 9 })
  }

  if (finding.found) {
    drawWrappedText(ctx, `${LABELS.found}: ${finding.found}`, { x: indent, size: 9 })
  }

  drawWrappedText(ctx, `${LABELS.description}: ${finding.description}`, { x: indent, size: 9 })

  if (finding.suggestedCorrection) {
    drawWrappedText(ctx, `${LABELS.suggestedCorrection}: ${finding.suggestedCorrection}`, { x: indent, size: 9, color: rgb(0.0, 0.4, 0.0) })
  }

  // Regulatory reference — NOT translated per Req 16.8
  drawWrappedText(ctx, `${LABELS.regulatoryRef}: ${finding.regulatoryRef}`, { x: indent, size: 9, color: rgb(0.3, 0.3, 0.6) })

  ctx.y -= 8
}
