import PDFDocument from 'pdfkit';

export interface ReceiptDetails {
    reference: string;
    date: string;
    amount: number;
    purpose: string;
    payerName: string;
    payerEmail: string;
    type: 'admission' | 'student';
    additionalInfo?: Record<string, string>;
}

export class ReceiptService {
    /**
     * Generates a PDF receipt and returns it as a Buffer
     */
    static async generateReceiptPDF(details: ReceiptDetails): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({ margin: 50, size: 'A4' });
                const buffers: Buffer[] = [];
                
                doc.on('data', buffers.push.bind(buffers));
                doc.on('end', () => {
                    const pdfData = Buffer.concat(buffers);
                    resolve(pdfData);
                });

                this.generateHeader(doc);
                this.generateCustomerInformation(doc, details);
                this.generateInvoiceTable(doc, details);
                this.generateFooter(doc);

                doc.end();
            } catch (error) {
                reject(error);
            }
        });
    }

    private static generateHeader(doc: typeof PDFDocument) {
        doc
            .fillColor('#444444')
            .fontSize(20)
            .text('FSS Ibadan', 50, 57)
            .fontSize(10)
            .text('Federal School of Statistics', 200, 50, { align: 'right' })
            .text('Sango-UI Road, Ibadan', 200, 65, { align: 'right' })
            .text('Oyo State, Nigeria', 200, 80, { align: 'right' })
            .moveDown();
    }

    private static generateCustomerInformation(doc: typeof PDFDocument, details: ReceiptDetails) {
        doc
            .fillColor('#444444')
            .fontSize(20)
            .text('Payment Receipt', 50, 160);

        this.generateHr(doc, 185);

        const customerInformationTop = 200;

        doc
            .fontSize(10)
            .text('Receipt Number:', 50, customerInformationTop)
            .font('Helvetica-Bold')
            .text(details.reference, 150, customerInformationTop)
            .font('Helvetica')
            .text('Payment Date:', 50, customerInformationTop + 15)
            .text(details.date, 150, customerInformationTop + 15)
            .text('Amount Paid:', 50, customerInformationTop + 30)
            .text(`N ${details.amount.toLocaleString()}`, 150, customerInformationTop + 30)

            .text('Billed To:', 300, customerInformationTop)
            .font('Helvetica-Bold')
            .text(details.payerName, 300, customerInformationTop + 15)
            .font('Helvetica')
            .text(details.payerEmail, 300, customerInformationTop + 30)
            .moveDown();

        this.generateHr(doc, 252);
    }

    private static generateInvoiceTable(doc: typeof PDFDocument, details: ReceiptDetails) {
        let i;
        const invoiceTableTop = 330;

        doc.font('Helvetica-Bold');
        this.generateTableRow(
            doc,
            invoiceTableTop,
            'Description',
            'Type',
            'Total Amount'
        );
        this.generateHr(doc, invoiceTableTop + 20);
        doc.font('Helvetica');

        const position = invoiceTableTop + 30;
        this.generateTableRow(
            doc,
            position,
            details.purpose,
            details.type === 'admission' ? 'Admission Form' : 'Student Payment',
            `N ${details.amount.toLocaleString()}`
        );

        this.generateHr(doc, position + 20);

        let additionalInfoY = position + 40;

        if (details.additionalInfo) {
            doc.font('Helvetica-Bold').text('Additional Details:', 50, additionalInfoY);
            doc.font('Helvetica');
            additionalInfoY += 20;

            for (const [key, value] of Object.entries(details.additionalInfo)) {
                doc.text(`${key}: ${value}`, 50, additionalInfoY);
                additionalInfoY += 15;
            }
        }
    }

    private static generateFooter(doc: typeof PDFDocument) {
        doc
            .fontSize(10)
            .text(
                'Payment was successfully verified. Thank you for your business.',
                50,
                700,
                { align: 'center', width: 500 }
            );
    }

    private static generateTableRow(
        doc: typeof PDFDocument,
        y: number,
        item: string,
        description: string,
        lineTotal: string
    ) {
        doc
            .fontSize(10)
            .text(item, 50, y, { width: 200 })
            .text(description, 280, y, { width: 100 })
            .text(lineTotal, 0, y, { align: 'right' });
    }

    private static generateHr(doc: typeof PDFDocument, y: number) {
        doc
            .strokeColor('#aaaaaa')
            .lineWidth(1)
            .moveTo(50, y)
            .lineTo(550, y)
            .stroke();
    }
}
