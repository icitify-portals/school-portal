
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function patch() {
    const connection = await mysql.createConnection(process.env.DATABASE_URL!);

    console.log('Connected to database. Patching Multi-Gateway & Reversals schema...');

    try {
        // 1. Update transactions table
        console.log('Updating transactions table...');

        // Check if columns exist first to avoid errors on re-run
        const [columns]: any = await connection.query('SHOW COLUMNS FROM transactions');
        const columnNames = columns.map((c: any) => c.Field);

        if (!columnNames.includes('gateway')) {
            await connection.query(`
                ALTER TABLE transactions 
                ADD COLUMN gateway ENUM('paystack', 'flutterwave', 'remita', 'opay', 'manual') DEFAULT 'manual',
                ADD COLUMN gateway_reference VARCHAR(255);
            `);
            console.log('✓ gateway and gateway_reference columns added to transactions');
        }

        // Update status enum
        await connection.query(`
            ALTER TABLE transactions 
            MODIFY COLUMN status ENUM('pending', 'completed', 'failed', 'reversed') DEFAULT 'pending';
        `);
        console.log('✓ transactions status enum updated');

        // 2. Update external_inflows table
        console.log('Updating external_inflows table...');
        const [inflowColumns]: any = await connection.query('SHOW COLUMNS FROM external_inflows');
        const inflowColumnNames = inflowColumns.map((c: any) => c.Field);

        if (!inflowColumnNames.includes('status')) {
            await connection.query(`
                ALTER TABLE external_inflows 
                ADD COLUMN status ENUM('active', 'reversed') DEFAULT 'active';
            `);
            console.log('✓ status column added to external_inflows');
        }

        console.log('Patching complete!');
    } catch (error) {
        console.error('Error patching database:', error);
    } finally {
        await connection.end();
    }
}

patch();
