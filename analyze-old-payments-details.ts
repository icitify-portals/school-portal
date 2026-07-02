import mysql from 'mysql2/promise';
import fs from 'fs';

async function main() {
    const db = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'oldfsstable'
    });

    const paymentTables = [
        'acceptance_fee', 'allumni_fee', 'certificate_payment', 'convocation_payment', 
        'courseform_payment', 'developmental_fee', 'dpt_fee', 'idcard_fee', 
        'incidental_payment', 'latefee_fee', 'matriculation_fee', 'medical_fee', 
        'processing_fee', 'project_fee', 'pycometrics_fee', 'school_fee', 
        'school_fee_part', 'stateunion_fee', 'sug_fee', 'transcript_payment'
    ];

    let sessionTotals: Record<string, number> = {};
    let sessionMonthTotals: Record<string, Record<string, number>> = {};
    let tableTotals: Record<string, number> = {};

    for (const table of paymentTables) {
        try {
            // Some tables might have different status values or column names.
            // We check if amount, payment_date, session, status exist
            const [columnsRows] = await db.query(`DESCRIBE ${table}`);
            const columns = (columnsRows as any[]).map(c => c.Field);
            
            if (columns.includes('amount') && columns.includes('payment_date') && columns.includes('session') && columns.includes('status')) {
                const [rows] = await db.query(`
                    SELECT session, payment_date, amount, status 
                    FROM ${table} 
                    WHERE LOWER(status) = 'successful'
                `);

                let tableSum = 0;

                for (const row of (rows as any[])) {
                    let amount = parseFloat(row.amount);
                    if (isNaN(amount)) continue;

                    let session = (row.session || 'Unknown').trim();
                    if (!session) session = 'Unknown';
                    
                    let dateStr = row.payment_date;
                    let month = 'Unknown';
                    
                    if (dateStr) {
                        try {
                            const d = new Date(dateStr);
                            if (!isNaN(d.getTime())) {
                                month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                            } else if (typeof dateStr === 'string' && dateStr.length >= 7) {
                                month = dateStr.substring(0, 7); // e.g. YYYY-MM
                            }
                        } catch (e) {
                            // ignore
                        }
                    }

                    tableSum += amount;

                    if (!sessionTotals[session]) sessionTotals[session] = 0;
                    sessionTotals[session] += amount;

                    if (!sessionMonthTotals[session]) sessionMonthTotals[session] = {};
                    if (!sessionMonthTotals[session][month]) sessionMonthTotals[session][month] = 0;
                    sessionMonthTotals[session][month] += amount;
                }
                tableTotals[table] = tableSum;
            }
        } catch (e) {
            console.error(`Error querying ${table}:`, e);
        }
    }

    let md = `# Legacy Payment Analysis\n\n`;
    md += `## Included Tables\n`;
    for (const table of paymentTables) {
        md += `- **${table}**: ₦${(tableTotals[table] || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}\n`;
    }

    md += `\n## Session by Session Total\n`;
    md += `| Session | Total Inflow (₦) |\n`;
    md += `|---|---|\n`;
    const sortedSessions = Object.keys(sessionTotals).sort();
    for (const s of sortedSessions) {
        md += `| ${s} | ₦${sessionTotals[s].toLocaleString(undefined, {minimumFractionDigits: 2})} |\n`;
    }

    md += `\n## Monthly Summation per Session\n`;
    for (const s of sortedSessions) {
        md += `### Session: ${s}\n`;
        md += `| Month | Total Inflow (₦) |\n`;
        md += `|---|---|\n`;
        const sortedMonths = Object.keys(sessionMonthTotals[s]).sort();
        for (const m of sortedMonths) {
            md += `| ${m} | ₦${sessionMonthTotals[s][m].toLocaleString(undefined, {minimumFractionDigits: 2})} |\n`;
        }
        md += `\n`;
    }

    fs.writeFileSync('C:\\Users\\dell\\.gemini\\antigravity\\brain\\eb491633-a609-4653-8a6c-62904d486b53\\legacy_payment_analysis.md', md);
    console.log("Analysis completed and saved to legacy_payment_analysis.md");

    await db.end();
}

main().catch(console.error);
