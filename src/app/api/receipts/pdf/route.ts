import { getTransactionForReceipt } from "@/actions/bursary";
import { ReceiptService } from "@/services/ReceiptService";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = parseInt(searchParams.get("id") || "0");
        if (!id) return Response.json({ error: "Missing receipt id" }, { status: 400 });

        const data: any = await getTransactionForReceipt(id);
        if (!data?.transaction) return Response.json({ error: "Receipt not found or unauthorized" }, { status: 404 });

        const tx = data.transaction;
        const student = data.student || {};
        const payerName = `${student.firstName || ""} ${student.lastName || ""}`.trim() || "Payer";
        const pdf = await ReceiptService.generateReceiptPDF({
            reference: tx.gatewayReference || tx.rrr || `TRX-${tx.id}`,
            date: new Date(tx.createdAt).toLocaleDateString('en-GB'),
            amount: parseFloat(tx.amount?.toString() || "0"),
            purpose: tx.purpose || "Payment",
            payerName,
            payerEmail: student.email || "",
            type: 'student',
            additionalInfo: {
                "Receipt No": `#${String(tx.id).padStart(6, '0')}`,
                "Method": tx.gateway || "N/A",
                "Status": tx.status || "completed",
            },
        });

        return new Response(pdf as any, {
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="receipt-TRX-${tx.id}.pdf"`,
            },
        });
    } catch (e: any) {
        return Response.json({ error: e.message || "Failed to generate PDF" }, { status: 500 });
    }
}
