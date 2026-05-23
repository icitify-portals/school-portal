/**
 * GatewayTransactionService.ts
 * Logic for fetching transactions directly from payment gateway APIs.
 */

export class GatewayTransactionService {

    private static getSecretKey(gateway: string) {
        const prefix = gateway.toUpperCase();
        const key = process.env[`${prefix}_SECRET_KEY`];
        if (!key) throw new Error(`${gateway} secret key not configured.`);
        return key;
    }

    /**
     * Lists transactions from a gateway API.
     * Matches 'PaymentGatewayInstance::transactions' from Rust.
     */
    static async listTransactions(gateway: string, options: { page?: number, status?: string }) {
        const secretKey = this.getSecretKey(gateway);
        let url = "";

        if (gateway === "paystack") {
            url = `https://api.paystack.co/transaction?page=${options.page || 1}`;
            if (options.status) url += `&status=${options.status}`;
            
            const res = await fetch(url, {
                headers: { "Authorization": `Bearer ${secretKey}` }
            });
            return await res.json();
        }

        if (gateway === "flutterwave") {
            url = `https://api.flutterwave.com/v3/transactions?page=${options.page || 1}`;
            if (options.status) url += `&status=${options.status}`;

            const res = await fetch(url, {
                headers: { "Authorization": `Bearer ${secretKey}` }
            });
            return await res.json();
        }

        throw new Error(`Listing transactions for ${gateway} is not implemented.`);
    }

    /**
     * Searches for a specific transaction on the gateway.
     * Matches 'PaymentGatewayInstance::search_transactions' from Rust.
     */
    static async searchTransaction(gateway: string, reference: string) {
        const secretKey = this.getSecretKey(gateway);
        let url = "";

        if (gateway === "paystack") {
            url = `https://api.paystack.co/transaction/verify/${reference}`;
            const res = await fetch(url, {
                headers: { "Authorization": `Bearer ${secretKey}` }
            });
            return await res.json();
        }

        if (gateway === "flutterwave") {
            url = `https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=${reference}`;
            const res = await fetch(url, {
                headers: { "Authorization": `Bearer ${secretKey}` }
            });
            return await res.json();
        }

        throw new Error(`Searching transactions for ${gateway} is not implemented.`);
    }

    /**
     * Verifies a transaction and returns a normalized status.
     */
    static async verifyTransaction(gateway: string, reference: string) {
        const data = await this.searchTransaction(gateway, reference);
        
        let status = 'failed';
        let amount = 0;

        if (gateway === "paystack") {
            if (data.status && data.data.status === "success") {
                status = "success";
                amount = data.data.amount / 100; // Paystack is in kobo
            }
        } else if (gateway === "flutterwave") {
            if (data.status === "success" && data.data.status === "successful") {
                status = "success";
                amount = data.data.amount;
            }
        }

        return {
            success: status === "success",
            status,
            amount,
            reference,
            raw: data
        };
    }
}
