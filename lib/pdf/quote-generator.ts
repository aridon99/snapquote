// PDF Quote Generator using PDFKit
import PDFDocument from 'pdfkit'
import { Quote, QuoteItem, QuoteTemplate } from '@/types/quotes'
import { plumberQuoteTemplate } from './templates/plumber-quote'

export class QuoteGenerator {
  private doc: InstanceType<typeof PDFDocument>
  private quote: Quote
  private items: QuoteItem[]
  private template: QuoteTemplate

  constructor(quote: Quote, items: QuoteItem[], template: QuoteTemplate) {
    this.quote = quote
    this.items = items
    this.template = template
    this.doc = new PDFDocument({
      size: 'LETTER',
      margins: {
        top: plumberQuoteTemplate.formatting.margins.top,
        bottom: plumberQuoteTemplate.formatting.margins.bottom,
        left: plumberQuoteTemplate.formatting.margins.left,
        right: plumberQuoteTemplate.formatting.margins.right
      }
    })
  }

  async generate(): Promise<Buffer> {
    // Header
    this.addHeader()
    
    // Quote details
    this.addQuoteDetails()
    
    // Customer information
    this.addCustomerInfo()
    
    // Project description
    this.addProjectDescription()
    
    // Itemized services
    this.addItemizedServices()
    
    // Totals
    this.addTotals()
    
    // Terms and conditions
    this.addTermsAndConditions()
    
    // Signature lines
    this.addSignatureLines()
    
    // Footer
    this.addFooter()

    // Finalize PDF
    this.doc.end()
    
    // Convert to buffer
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = []
      this.doc.on('data', (chunk) => chunks.push(chunk))
      this.doc.on('end', () => resolve(Buffer.concat(chunks)))
      this.doc.on('error', reject)
    })
  }

  private addHeader() {
    const colors = plumberQuoteTemplate.colors
    const fontSize = plumberQuoteTemplate.formatting.fontSize

    // Company name in primary color
    this.doc
      .fillColor(colors.primary)
      .fontSize(fontSize.companyName)
      .font('Helvetica-Bold')
      .text(this.template.business_name, { align: 'center' })
      .moveDown(0.2)

    // Company contact info
    this.doc
      .fillColor(colors.text)
      .fontSize(fontSize.small)
      .font('Helvetica')
      .text(`${this.template.business_phone} • ${this.template.business_email}`, { align: 'center' })
      .text(this.template.business_address, { align: 'center' })
      
    if (this.template.license_number) {
      this.doc.text(`License #${this.template.license_number}`, { align: 'center' })
    }

    // Draw header line
    this.doc
      .moveDown()
      .strokeColor(colors.borderGray)
      .lineWidth(1)
      .moveTo(50, this.doc.y)
      .lineTo(this.doc.page.width - 50, this.doc.y)
      .stroke()
      .moveDown()
  }

  private addQuoteDetails() {
    const colors = plumberQuoteTemplate.colors
    const fontSize = plumberQuoteTemplate.formatting.fontSize

    // Quote title
    this.doc
      .fillColor(colors.primary)
      .fontSize(fontSize.heading)
      .font('Helvetica-Bold')
      .text('SERVICE QUOTE', { align: 'center' })
      .moveDown(0.5)

    // Quote metadata
    this.doc
      .fillColor(colors.text)
      .fontSize(fontSize.normal)
      .font('Helvetica')

    const leftCol = 50
    const rightCol = this.doc.page.width / 2

    this.doc.text(`Quote #: ${this.quote.id.slice(0, 8).toUpperCase()}`, leftCol, this.doc.y)
    this.doc.text(`Date: ${new Date(this.quote.created_at).toLocaleDateString()}`, rightCol, this.doc.y - fontSize.normal - 2)
    
    this.doc.text(`Version: ${this.quote.version}`, leftCol)
    this.doc.text(`Valid Until: ${new Date(this.quote.valid_until).toLocaleDateString()}`, rightCol, this.doc.y - fontSize.normal - 2)
    
    this.doc.moveDown()
  }

  private addCustomerInfo() {
    const colors = plumberQuoteTemplate.colors
    const fontSize = plumberQuoteTemplate.formatting.fontSize

    // Customer section header
    this.doc
      .fillColor(colors.primary)
      .fontSize(fontSize.subheading)
      .font('Helvetica-Bold')
      .text('CUSTOMER INFORMATION')
      .moveDown(0.5)

    // Customer details
    this.doc
      .fillColor(colors.text)
      .fontSize(fontSize.normal)
      .font('Helvetica')
      .text(`Name: ${this.quote.customer_name}`)
      .text(`Phone: ${this.quote.customer_phone}`)
    
    if (this.quote.customer_email) {
      this.doc.text(`Email: ${this.quote.customer_email}`)
    }
    
    this.doc
      .text(`Service Address: ${this.quote.customer_address}`)
      .moveDown()
  }

  private addProjectDescription() {
    const colors = plumberQuoteTemplate.colors
    const fontSize = plumberQuoteTemplate.formatting.fontSize

    if (this.quote.project_description) {
      this.doc
        .fillColor(colors.primary)
        .fontSize(fontSize.subheading)
        .font('Helvetica-Bold')
        .text('PROJECT DESCRIPTION')
        .moveDown(0.5)

      this.doc
        .fillColor(colors.text)
        .fontSize(fontSize.normal)
        .font('Helvetica')
        .text(this.quote.project_description, {
          align: 'justify',
          lineGap: 2
        })
        .moveDown()
    }
  }

  private addItemizedServices() {
    const colors = plumberQuoteTemplate.colors
    const fontSize = plumberQuoteTemplate.formatting.fontSize

    // Services header
    this.doc
      .fillColor(colors.primary)
      .fontSize(fontSize.subheading)
      .font('Helvetica-Bold')
      .text('ITEMIZED SERVICES')
      .moveDown(0.5)

    // Group items by category
    const groupedItems = this.groupItemsByCategory()

    // Table headers
    const tableTop = this.doc.y
    const col1 = 50 // Description
    const col2 = 350 // Quantity
    const col3 = 410 // Unit Price
    const col4 = 480 // Total

    this.doc
      .fillColor(colors.text)
      .fontSize(fontSize.normal)
      .font('Helvetica-Bold')
      .text('Description', col1, tableTop)
      .text('Qty', col2, tableTop)
      .text('Price', col3, tableTop)
      .text('Total', col4, tableTop)

    // Draw header underline
    this.doc
      .strokeColor(colors.borderGray)
      .lineWidth(0.5)
      .moveTo(col1, this.doc.y + 2)
      .lineTo(550, this.doc.y + 2)
      .stroke()
      .moveDown(0.5)

    // Add items by category
    let currentY = this.doc.y
    
    Object.entries(groupedItems).forEach(([category, items]) => {
      // Category header
      const categoryName = (plumberQuoteTemplate.categories as any)[category] || category
      this.doc
        .fillColor(colors.secondary)
        .fontSize(fontSize.normal)
        .font('Helvetica-Bold')
        .text(categoryName, col1, currentY)
        .moveDown(0.3)
      
      currentY = this.doc.y

      // Items in category
      items.forEach(item => {
        this.doc
          .fillColor(colors.text)
          .fontSize(fontSize.normal)
          .font('Helvetica')
          .text(item.description, col1, currentY, { width: 280 })
          
        const quantity = `${item.quantity} ${item.unit}`
        this.doc.text(quantity, col2, currentY)
        this.doc.text(`$${item.unit_price.toFixed(2)}`, col3, currentY)
        this.doc.text(`$${item.total_price.toFixed(2)}`, col4, currentY)
        
        currentY = this.doc.y + 20
        this.doc.y = currentY
      })
      
      this.doc.moveDown(0.5)
      currentY = this.doc.y
    })
  }

  private addTotals() {
    const colors = plumberQuoteTemplate.colors
    const fontSize = plumberQuoteTemplate.formatting.fontSize

    // Draw separator line
    this.doc
      .strokeColor(colors.borderGray)
      .lineWidth(1)
      .moveTo(350, this.doc.y)
      .lineTo(550, this.doc.y)
      .stroke()
      .moveDown(0.5)

    // Calculate totals
    const laborTotal = this.items
      .filter(i => i.category === 'labor')
      .reduce((sum, i) => sum + i.total_price, 0)
    
    const materialTotal = this.items
      .filter(i => i.category === 'material')
      .reduce((sum, i) => sum + i.total_price, 0)

    // Subtotals
    const col1 = 400
    const col2 = 480
    
    if (laborTotal > 0) {
      this.doc
        .fillColor(colors.text)
        .fontSize(fontSize.normal)
        .font('Helvetica')
        .text('Labor:', col1, this.doc.y)
        .text(`$${laborTotal.toFixed(2)}`, col2, this.doc.y - fontSize.normal - 2)
    }
    
    if (materialTotal > 0) {
      this.doc
        .text('Materials:', col1)
        .text(`$${materialTotal.toFixed(2)}`, col2, this.doc.y - fontSize.normal - 2)
    }

    // Total
    this.doc
      .fillColor(colors.accent)
      .fontSize(fontSize.subheading)
      .font('Helvetica-Bold')
      .text('TOTAL:', col1, this.doc.y + 10)
      .text(`$${this.quote.total_amount.toFixed(2)}`, col2, this.doc.y - fontSize.subheading - 2)
      
    this.doc.moveDown(2)
  }

  private addTermsAndConditions() {
    const colors = plumberQuoteTemplate.colors
    const fontSize = plumberQuoteTemplate.formatting.fontSize

    // Only add if there's room on the page
    if (this.doc.y > 500) {
      this.doc.addPage()
    }

    this.doc
      .fillColor(colors.primary)
      .fontSize(fontSize.subheading)
      .font('Helvetica-Bold')
      .text('TERMS AND CONDITIONS')
      .moveDown(0.5)

    this.doc
      .fillColor(colors.text)
      .fontSize(fontSize.small)
      .font('Helvetica')
      .text(this.template.terms_and_conditions || plumberQuoteTemplate.defaultTerms, {
        align: 'justify',
        lineGap: 1
      })
      .moveDown()
  }

  private addSignatureLines() {
    const colors = plumberQuoteTemplate.colors
    const fontSize = plumberQuoteTemplate.formatting.fontSize

    // Check if we need a new page
    if (this.doc.y > 600) {
      this.doc.addPage()
    }

    const leftCol = 50
    const rightCol = 320

    // Customer signature
    this.doc
      .strokeColor(colors.borderGray)
      .lineWidth(0.5)
      .moveTo(leftCol, this.doc.y + 30)
      .lineTo(leftCol + 200, this.doc.y + 30)
      .stroke()

    this.doc
      .fillColor(colors.text)
      .fontSize(fontSize.small)
      .font('Helvetica')
      .text('Customer Signature', leftCol, this.doc.y + 35)
      .text(`Date: ${new Date().toLocaleDateString()}`, leftCol, this.doc.y + 10)

    // Contractor signature
    this.doc
      .strokeColor(colors.borderGray)
      .lineWidth(0.5)
      .moveTo(rightCol, this.doc.y - 55)
      .lineTo(rightCol + 200, this.doc.y - 55)
      .stroke()

    this.doc
      .text('Contractor Signature', rightCol, this.doc.y - 20)
      .text(`Date: ${new Date().toLocaleDateString()}`, rightCol, this.doc.y + 10)
  }

  private addFooter() {
    const colors = plumberQuoteTemplate.colors
    const fontSize = plumberQuoteTemplate.formatting.fontSize

    // Add warranty info at bottom
    this.doc
      .fillColor(colors.secondary)
      .fontSize(fontSize.small)
      .font('Helvetica-Bold')
      .text(this.template.warranty_info || plumberQuoteTemplate.defaultWarranty, 50, 720, {
        align: 'center',
        width: this.doc.page.width - 100
      })
  }

  private groupItemsByCategory(): Record<string, QuoteItem[]> {
    const grouped: Record<string, QuoteItem[]> = {}
    
    this.items.forEach(item => {
      const category = item.category || 'other'
      if (!grouped[category]) {
        grouped[category] = []
      }
      grouped[category].push(item)
    })

    // Sort by display order within each category
    Object.keys(grouped).forEach(category => {
      grouped[category].sort((a, b) => a.display_order - b.display_order)
    })

    return grouped
  }
}

// Helper function to generate PDF from quote data
export async function generateQuotePDF(
  quote: Quote,
  items: QuoteItem[],
  template: QuoteTemplate
): Promise<Buffer> {
  const generator = new QuoteGenerator(quote, items, template)
  return await generator.generate()
}