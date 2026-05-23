
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function patch() {
    const connection = await mysql.createConnection(process.env.DATABASE_URL!);

    console.log('Connected to database. Patching Refund Module schema...');

    try {
        // Create refund_requests table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS refund_requests (
                id INT AUTO_INCREMENT PRIMARY KEY,
                student_id INT NOT NULL,
                transaction_id INT NULL,
                amount DECIMAL(12, 2) NOT NULL,
                reason TEXT NOT NULL,
                bank_name VARCHAR(255) NOT NULL,
                account_number VARCHAR(20) NOT NULL,
                account_name VARCHAR(255) NOT NULL,
                status ENUM('pending', 'approved', 'rejected', 'disbursed') DEFAULT 'pending',
                approved_by INT NULL,
                approved_at TIMESTAMP NULL,
                disbursed_at TIMESTAMP NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (student_id) REFERENCES students(id),
                FOREIGN KEY (transaction_id) REFERENCES transactions(id),
                FOREIGN KEY (approved_by) REFERENCES users(id)
            )
        `);
        console.log('✓ refund_requests table created');

        console.log('Patching complete!');
    } catch (error) {
        console.error('Error patching database:', error);
    } finally {
        await connection.end();
    }
}

patch();
