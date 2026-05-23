import * as XLSX from 'xlsx';
import { db } from "@/db/db";
import { excelUploads, directPayments } from "@/db/schema";
import { eq } from "drizzle-orm";

export class ExcelBacklogService {
    
    /**
     * Initiates an excel upload record.
     * Matches 'ExcelUpload::initiate' from Rust.
     */
    static async initiateUpload(name: string, filename: string, userId: number, branchId: number) {
        const [result] = await db.insert(excelUploads).values({
            name,
            filename,
            userId,
            branchId,
            status: 'pending'
        });
        return { uploadId: result.insertId };
    }

    /**
     * Sets the progress of an upload.
     * Matches 'excel_upload.set_progress' from Rust.
     */
    static async setProgress(uploadId: number, processed: number) {
        return await db.update(excelUploads)
            .set({ processedRows: processed })
            .where(eq(excelUploads.id, uploadId));
    }

    /**
     * Lists all uploads for a branch.
     * Matches 'ExcelBacklog::uploads' from Rust.
     */
    static async listUploads(branchId: number) {
        return await db.select()
            .from(excelUploads)
            .where(eq(excelUploads.branchId, branchId));
    }

    /**
     * Retrieves transactions for a specific upload.
     * Matches 'ExcelBacklog::transactions' from Rust.
     */
    static async getTransactions(uploadId: number) {
        return await db.select()
            .from(directPayments)
            .where(eq(directPayments.excelUploadId, uploadId));
    }

    /**
     * Deletes an upload and all its associated transactions.
     * Matches 'ExcelBacklog::delete' from Rust.
     */
    static async deleteUpload(uploadId: number) {
        return await db.transaction(async (tx) => {
            // Delete associated transactions
            await tx.delete(directPayments)
                .where(eq(directPayments.excelUploadId, uploadId));
            
            // Mark upload as deleted
            await tx.update(excelUploads)
                .set({ status: 'deleted' })
                .where(eq(excelUploads.id, uploadId));
        });
    }

    /**
     * Processes an excel file and registers transactions.
     * Implements the core logic from the Rust 'upload' module.
     */
    static async processFile(uploadId: number, filePath: string) {
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

        if (data.length < 2) throw new Error("Excel file is empty or missing headers");

        const headers = data[0].map(h => String(h).trim());
        const rows = data.slice(1);

        await db.update(excelUploads).set({ 
            totalRows: rows.length,
            status: 'processing'
        }).where(eq(excelUploads.id, uploadId));

        const getIndex = (name: string) => headers.indexOf(name);
        
        const indices = {
            admissionNo: getIndex("Admission Number"),
            session: getIndex("Session"),
            term: getIndex("Term"),
            date: getIndex("Date"),
            time: getIndex("Time"),
            tellerNo: getIndex("Teller Number"),
            remark: getIndex("Remark"),
            amount: getIndex("Amount")
        };

        // If 'Amount' column not found, try common alternatives
        if (indices.amount === -1) {
            indices.amount = headers.findIndex(h => h.toLowerCase().includes("total") || h.toLowerCase().includes("amount"));
        }

        const [upload] = await db.select().from(excelUploads).where(eq(excelUploads.id, uploadId)).limit(1);

        let processed = 0;
        for (const row of rows) {
            const transNo = `EX-${uploadId}-${processed + 1}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
            
            await db.insert(directPayments).values({
                transactionNumber: transNo,
                excelUploadId: uploadId,
                branchId: upload.branchId,
                operatorId: upload.userId,
                tellerNumber: String(row[indices.tellerNo] || ""),
                remark: String(row[indices.remark] || `Bulk upload: ${upload.name}`),
                amount: String(row[indices.amount] || "0.00"),
                status: 'active'
            });

            processed++;
            await this.setProgress(uploadId, processed);
        }

        await db.update(excelUploads).set({ status: 'completed' }).where(eq(excelUploads.id, uploadId));
        return { success: true, processed };
    }

    /**
     * Previews the first few rows of an excel file.
     * Matches 'ExcelWorkbook::to_array' from Rust.
     */
    static async previewFile(filePath: string, limit = 5) {
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
        return data.slice(0, limit + 1); // Headers + limit
    }
}
