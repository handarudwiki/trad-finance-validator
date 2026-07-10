import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import * as fs from 'fs'
import * as path from 'path'

async function generateInvoice() {
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([600, 800])
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica)

  // Title
  page.drawText('COMMERCIAL INVOICE', { x: 50, y: 740, size: 24, font })

  // Meta Info
  page.drawText('Invoice Number: INV-2024-001', { x: 50, y: 700, size: 12, font })
  page.drawText('Date: 2024-06-15', { x: 50, y: 680, size: 12, font: regularFont })

  // Financial details
  page.drawText('Currency: USD', { x: 50, y: 640, size: 12, font: regularFont })
  page.drawText('Amount: 100,000.00', { x: 50, y: 620, size: 12, font: regularFont })
  page.drawText('Total Quantity: 1000 units', { x: 50, y: 600, size: 12, font: regularFont })

  // Description
  page.drawText('Description of Goods:', { x: 50, y: 560, size: 12, font })
  page.drawText('1000 units of High-performance Agricultural Water Pumps, Model WP-900', { x: 50, y: 540, size: 11, font: regularFont })

  const pdfBytes = await pdfDoc.save()
  return pdfBytes
}

async function generateBillOfLading() {
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([600, 800])
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica)

  // Title
  page.drawText('BILL OF LADING', { x: 50, y: 740, size: 24, font })

  // Meta Info
  page.drawText('B/L Number: BL-987654321', { x: 50, y: 700, size: 12, font })
  page.drawText('Date of Issue: 2024-10-15', { x: 50, y: 680, size: 12, font: regularFont })
  page.drawText('Shipped on Board Date: 2024-10-15', { x: 50, y: 660, size: 12, font: regularFont })

  // Cargo details
  page.drawText('Container Number: HLXU1234567', { x: 50, y: 620, size: 12, font: regularFont })
  page.drawText('Gross Weight: 12,500.00 kg', { x: 50, y: 600, size: 12, font: regularFont })
  page.drawText('Port of Loading: Port of Tanjung Priok, Jakarta', { x: 50, y: 560, size: 12, font: regularFont })
  page.drawText('Port of Discharge: Port of Rotterdam, Netherlands', { x: 50, y: 540, size: 12, font: regularFont })

  const pdfBytes = await pdfDoc.save()
  return pdfBytes
}

async function generatePackingList() {
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([600, 800])
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica)

  // Title
  page.drawText('PACKING LIST', { x: 50, y: 740, size: 24, font })

  // Meta Info
  page.drawText('Packing List Ref: PK-2024-001', { x: 50, y: 700, size: 12, font })
  page.drawText('Date: 2024-06-15', { x: 50, y: 680, size: 12, font: regularFont })

  // Packing Details
  page.drawText('Total Quantity: 1000', { x: 50, y: 640, size: 12, font: regularFont })
  page.drawText('Total Packages: 10 wooden crates', { x: 50, y: 620, size: 12, font: regularFont })
  page.drawText('Total Gross Weight: 12,500.00 kg', { x: 50, y: 600, size: 12, font: regularFont })
  page.drawText('Total Net Weight: 11,800.00 kg', { x: 50, y: 580, size: 12, font: regularFont })

  const pdfBytes = await pdfDoc.save()
  return pdfBytes
}

async function main() {
  const outputDir = path.join(__dirname, '../public/examples')
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  const invoiceBytes = await generateInvoice()
  fs.writeFileSync(path.join(outputDir, 'commercial_invoice.pdf'), invoiceBytes)
  console.log('Generated: commercial_invoice.pdf')

  const blBytes = await generateBillOfLading()
  fs.writeFileSync(path.join(outputDir, 'bill_of_lading.pdf'), blBytes)
  console.log('Generated: bill_of_lading.pdf')

  const plBytes = await generatePackingList()
  fs.writeFileSync(path.join(outputDir, 'packing_list.pdf'), plBytes)
  console.log('Generated: packing_list.pdf')
}

main().catch(console.error)
