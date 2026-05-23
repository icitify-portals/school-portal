
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function patch() {
    const connection = await mysql.createConnection(process.env.DATABASE_URL!);

    console.log('Connected to database. Patching School Bills schema...');

    try {
        // 1. Create student_bills table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS student_bills (
                id INT AUTO_INCREMENT PRIMARY KEY,
                student_id INT NOT NULL,
                session_id INT NOT NULL,
                bill_number VARCHAR(50) UNIQUE NOT NULL,
                total_amount DECIMAL(12, 2) NOT NULL,
                status ENUM('pending', 'partially_paid', 'paid') DEFAULT 'pending',
                note TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (student_id) REFERENCES students(id),
                FOREIGN KEY (session_id) REFERENCES academic_sessions(id)
            ) ENGINE=InnoDB;
        `);
        console.log('✓ student_bills table created/exists');

        // 2. Create student_bill_items table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS student_bill_items (
                id INT AUTO_INCREMENT PRIMARY KEY,
                bill_id INT NOT NULL,
                fee_item_id INT NOT NULL,
                amount DECIMAL(12, 2) NOT NULL,
                FOREIGN KEY (bill_id) REFERENCES student_bills(id) ON DELETE CASCADE,
                FOREIGN KEY (fee_item_id) REFERENCES fee_items(id)
            ) ENGINE=InnoDB;
        `);
        console.log('✓ student_bill_items table created/exists');

        console.log('Patching complete!');
    } catch (error) {
        console.error('Error patching database:', error);
    } finally {
        await connection.end();
    }
}

patch();
