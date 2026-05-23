#!/usr/bin/env node

/**
 * manage-bursary.ts
 * Manages direct payments and bursary transactions.
 * Mirrors Rust's bursary module subcommands.
 */

import { DirectPaymentService } from "../src/services/DirectPaymentService";

function usage() {
    console.log(`
Bursary & Direct Payment CLI
Usage: manage-bursary <command> <transaction_number> [options]

Commands:
  register      Register a new direct payment transaction
  update        Update transaction details
    --teller <val>    Set teller number
    --remark <val>    Set remark
    --amount <val>    Set amount (decimal)
    --date <val>      Set creation date (ISO string or YYYY-MM-DD)
  data          Display transaction data
  nullify       Nullify the transaction
  backlog       Excel backlog management
    preview <path>        Preview excel file
    upload <path> --name <val>  Upload and process excel backlog
    list                  List previous uploads
    transactions <id>     List transactions in an upload
    delete <id>           Delete an upload and its transactions
  preferences   Manage finance preferences
    save --session <id> --data <json> [--tuition-updated]
  payment       Payment and transaction management
    failed [--session <id>] [--term <id>] [--context <val>]
    resolve <ref> [--context <val>]
    ledger <adm> [--session <id>] [--term <id>] [--summary]
    report [--session <id>] [--term <id>] [--from <date>] [--to <date>]
    items [--admission <id>]
    setup term --session <id> --term <id>
    transaction <ref> [--delete]

Examples:
  npx tsx bin/manage-bursary.ts ledger ADM-001 --summary
  npx tsx bin/manage-bursary.ts report --from "2023-01-01" --to "2023-12-31"
  npx tsx bin/manage-bursary.ts transaction REF-990 --delete
    `);
}

async function main() {
    const rawArgs = process.argv.slice(2);
    const command = rawArgs[0];
    const target = rawArgs[1]; // transNo or subcommand

    if (!command || command === "--help") {
        usage();
        process.exit(0);
    }

    if (!target && !["list", "preferences", "payment", "cache", "ledger", "report", "items", "setup", "transaction"].includes(command) && !(command === "backlog" && rawArgs[1] === "list")) {
        console.error("Error: Target ID/Path required.");
        usage();
        process.exit(1);
    }

    // Simple arg parser
    function opt(name: string): string | undefined {
        const idx = rawArgs.indexOf(`--${name}`);
        return idx !== -1 ? rawArgs[idx + 1] : undefined;
    }

    function hasFlag(name: string): boolean {
        return rawArgs.includes(`--${name}`);
    }

    try {
        const ExcelBacklogService = (await import("../src/services/ExcelBacklogService")).ExcelBacklogService;
        const FinancePreferencesService = (await import("../src/services/FinancePreferencesService")).FinancePreferencesService;
        const PaymentService = (await import("../src/services/PaymentService")).PaymentService;
        const GatewayTransactionService = (await import("../src/services/GatewayTransactionService")).GatewayTransactionService;
        const BursaryCacheService = (await import("../src/services/BursaryCacheService")).BursaryCacheService;
        const BursaryService = (await import("../src/services/BursaryService")).BursaryService;
        const IndividualLedgerService = (await import("../src/services/IndividualLedgerService")).IndividualLedgerService;
        const FinanceReportService = (await import("../src/services/FinanceReportService")).FinanceReportService;
        const PaymentItemService = (await import("../src/services/PaymentItemService")).PaymentItemService;

        switch (command) {
            case "register": {
                await DirectPaymentService.registerTransaction(target, 1, 1);
                console.log(`Successfully registered transaction: ${target}`);
                break;
            }

            case "data": {
                const res = await DirectPaymentService.getTransaction(target);
                console.log(JSON.stringify(res, null, 2));
                break;
            }

            case "nullify": {
                await DirectPaymentService.nullifyTransaction(target);
                console.log(`Successfully nullified transaction: ${target}`);
                break;
            }

            case "update": {
                const teller = opt("teller");
                const remark = opt("remark");
                const amount = opt("amount");
                const date   = opt("date");

                if (teller) await DirectPaymentService.updateTellerNumber(target, teller);
                if (remark) await DirectPaymentService.updateRemark(target, remark);
                if (amount) await DirectPaymentService.updateAmount(target, amount);
                if (date)   await DirectPaymentService.updateCreatedAt(target, new Date(date));

                console.log(`Successfully updated transaction: ${target}`);
                break;
            }

            case "backlog": {
                const sub = target;
                const val = rawArgs[2];

                if (sub === "preview") {
                    const data = await ExcelBacklogService.previewFile(val);
                    console.table(data);
                } else if (sub === "list") {
                    const uploads = await ExcelBacklogService.listUploads(1); // Default branch 1
                    console.table(uploads);
                } else if (sub === "transactions") {
                    const trans = await ExcelBacklogService.getTransactions(parseInt(val));
                    console.table(trans);
                } else if (sub === "delete") {
                    await ExcelBacklogService.deleteUpload(parseInt(val));
                    console.log(`Successfully deleted upload ${val} and all associated transactions.`);
                } else if (sub === "upload") {
                    const name = opt("name") || "Untitled Upload";
                    const { uploadId } = await ExcelBacklogService.initiateUpload(name, val, 1, 1);
                    console.log(`Upload ${uploadId} initiated. Processing...`);
                    const res = await ExcelBacklogService.processFile(uploadId, val);
                    console.log(`Completed! Processed ${res.processed} rows.`);
                }
                break;
            }

            case "preferences": {
                const sub = target;
                if (sub === "save") {
                    const sessionId = parseInt(opt("session") || "0");
                    const dataJson = opt("data");
                    const tuitionUpdated = hasFlag("tuition-updated");

                    if (!sessionId || !dataJson) {
                        console.error("Error: --session and --data are required for save.");
                        process.exit(1);
                    }

                    const data = JSON.parse(dataJson);
                    await FinancePreferencesService.save(sessionId, 1, 1, data, tuitionUpdated);
                    console.log("Successfully saved finance preferences.");
                }
                break;
            }

            case "payment": {
                const sub = target;
                const ref = rawArgs[2];

                if (sub === "failed") {
                    const sessionId = parseInt(opt("session") || "0");
                    const term = opt("term");
                    const context = (opt("context") || "Main") as any;
                    const res = await PaymentService.getFailedTransactions(context, sessionId, term, 1);
                    console.table(res);
                } else if (sub === "resolve") {
                    const res = await PaymentService.resolveTransaction(ref);
                    console.log(JSON.stringify(res, null, 2));
                } else if (sub === "generate-rrr") {
                    const res = await PaymentService.generateRemitaRrr(ref);
                    console.log(JSON.stringify(res, null, 2));
                } else if (sub === "update") {
                    const session = opt("session");
                    const term = opt("term");
                    const teller = opt("teller");
                    const remark = opt("remark");
                    const date = opt("date");

                    await PaymentService.updateTransaction(ref, {
                        session,
                        term,
                        teller,
                        remark,
                        date: date ? new Date(date) : undefined
                    });
                    console.log(`Updated transaction metadata for ${ref}`);
                }
                break;
            }

            case "gateway": {
                const sub = target;
                const name = rawArgs[2];
                if (sub === "list") {
                    const page = parseInt(opt("page") || "1");
                    const status = opt("status");
                    const res = await GatewayTransactionService.listTransactions(name, { page, status });
                    console.log(JSON.stringify(res, null, 2));
                } else if (sub === "search") {
                    const ref = opt("ref");
                    if (!ref) throw new Error("--ref is required");
                    const res = await GatewayTransactionService.searchTransaction(name, ref);
                    console.log(JSON.stringify(res, null, 2));
                }
                break;
            }

            case "cache": {
                const sub = target;
                if (sub === "tuition") {
                    const count = await BursaryCacheService.cacheAllTuitionFees();
                    console.log(`Cached ${count} tuition fee structures.`);
                } else if (sub === "ledger") {
                    const adm = rawArgs[2];
                    const session = parseInt(opt("session") || "0");
                    const count = await BursaryCacheService.cacheIndividualLedger(adm, session);
                    console.log(`Cached ${count} ledger entries for ${adm}.`);
                } else if (sub === "all-ledgers") {
                    const session = parseInt(opt("session") || "0");
                    const branch = parseInt(opt("branch") || "1");
                    const count = await BursaryCacheService.cacheAllLedgers(branch, session);
                    console.log(`Cached ledgers for ${count} students.`);
                } else if (sub === "school-data") {
                    const session = parseInt(opt("session") || "0");
                    const term = opt("term") || "1";
                    await BursaryCacheService.cacheSchoolData(session, term);
                    console.log("Cached general school financial data.");
                }
                break;
            }

            case "ledger": {
                const adm = target;
                const session = parseInt(opt("session") || "1");
                const term = opt("term") || "1";
                if (hasFlag("summary")) {
                    const res = await IndividualLedgerService.summarizeLedger(adm, session, term);
                    console.log(JSON.stringify(res, null, 2));
                } else {
                    const res = await IndividualLedgerService.getLedger(adm);
                    console.table(res.entries);
                }
                break;
            }

            case "report": {
                const session = opt("session") || "Current";
                const term = opt("term") || "Current";
                const from = opt("from") ? new Date(opt("from")!) : undefined;
                const to = opt("to") ? new Date(opt("to")!) : undefined;
                const res = await FinanceReportService.generateReport(1, session, term, { from, to });
                console.log(JSON.stringify(res, null, 2));
                break;
            }

            case "items": {
                const adm = opt("admission");
                if (adm) {
                    const session = parseInt(opt("session") || "1");
                    const res = await PaymentItemService.getStudentTermItems(adm, session);
                    console.table(res);
                } else {
                    const res = await PaymentItemService.listItems();
                    console.table(res);
                }
                break;
            }

            case "setup": {
                const sub = target;
                if (sub === "term") {
                    const session = parseInt(opt("session") || "0");
                    const term = opt("term") || "1";
                    await BursaryService.createTermRecords(session, term, 1);
                    console.log(`Bursary setup complete for session ${session}, term ${term}.`);
                }
                break;
            }

            case "transaction": {
                const ref = target;
                if (hasFlag("delete")) {
                    await BursaryService.deleteTransaction(ref);
                    console.log(`Transaction ${ref} deleted successfully.`);
                } else {
                    // Get data
                    const res = await DirectPaymentService.getTransaction(ref);
                    console.log(JSON.stringify(res, null, 2));
                }
                break;
            }

            default:
                console.error(`Unknown command: ${command}`);
                usage();
                process.exit(1);
        }
    } catch (e: any) {
        console.error(`Error: ${e.message}`);
        process.exit(1);
    }

    process.exit(0);
}

main().catch(console.error);
