import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function runTests() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  try {
    console.log("Seeding extended admission test data...");

    // 1. Seed Leads
    await connection.execute(`
        INSERT INTO admission_leads (name, email, phone, program_of_interest, source, status)
        VALUES 
        ('John Doe', 'john@example.com', '1234567890', 'BSc Computer Science', 'Website Form', 'new'),
        ('Jane Smith', 'jane@example.com', '0987654321', 'LLB Law', 'Education Fair', 'contacted'),
        ('Alice Johnson', 'alice@example.com', '1122334455', 'BSc Nursing', 'Referral', 'applied')
    `);
    console.log("✅ Seeded Leads successfully");

    // 2. Fetch a real application to attach Waitlists and Interviews to
    const [apps] = await connection.execute("SELECT * FROM admission_applications_v2 LIMIT 1");
    if (apps.length === 0) {
        console.log("⚠️ No applications found to attach waitlist/interviews. Skipping.");
        return;
    }
    const appId = apps[0].id;
    
    // Fetch a user for interviewer
    const [users] = await connection.execute("SELECT * FROM users LIMIT 1");
    const interviewerId = users.length > 0 ? users[0].id : null;

    // 3. Seed Waitlist
    await connection.execute(`
        INSERT INTO admission_waitlists (application_id, rank_position, status)
        VALUES (?, 1, 'waiting')
    `, [appId]);
    console.log("✅ Seeded Waitlist successfully");

    // 4. Seed Interview
    await connection.execute(`
        INSERT INTO admission_interviews (application_id, interview_date, interviewer_id, mode, location_or_link, status)
        VALUES (?, '2026-07-01 10:00:00', ?, 'virtual', 'https://zoom.us/j/123456', 'scheduled')
    `, [appId, interviewerId]);
    console.log("✅ Seeded Interview successfully");

    console.log("🎉 Seeding complete!");
  } catch(e) {
    console.error("❌ Test failed:", e);
  } finally {
    await connection.end();
  }
}

runTests();
