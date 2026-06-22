import mysql from 'mysql2/promise';

async function run() {
    console.log("Starting database seeding for PhD and Referee testing modules...");

    const connection = await mysql.createConnection("mysql://root:@localhost:3306/school_portal");

    try {
        // Enable transactions to ensure database consistency
        await connection.beginTransaction();

        // 1. Seed/Verify Active Academic Session
        console.log("Seeding/checking current academic session...");
        await connection.execute(`
            INSERT INTO academic_sessions (name, is_current, current_semester, status, is_active)
            VALUES ('2025/2026', 1, '2', 'active', 1)
            ON DUPLICATE KEY UPDATE is_current = 1, status = 'active';
        `);

        const [[session]] = await connection.execute(
            "SELECT id FROM academic_sessions WHERE name = '2025/2026' LIMIT 1"
        );
        const sessionId = session.id;
        console.log(`Using Session ID: ${sessionId}`);

        // 2. Create Dummy Department if none exists
        await connection.execute(`
            INSERT INTO departments (id, name, code)
            VALUES (1, 'Doctorate College of Sciences', 'DCS')
            ON DUPLICATE KEY UPDATE name = 'Doctorate College of Sciences';
        `);

        // 3. Create dummy staff HOD user if not exists
        console.log("Seeding staff reviewer...");
        await connection.execute(`
            INSERT INTO users (id, name, email, password, role, status)
            VALUES (1010, '[TEST-SEED] Dept HOD', 'phd.hod@test.edu', '$2a$10$T8Z.QW/a3Hl7xQk0n1J6E.iN2wF89Z.eQ3B.k2eN2yM3xP4zQ5wRy', 'staff', 'active')
            ON DUPLICATE KEY UPDATE name = '[TEST-SEED] Dept HOD', status = 'active';
        `);

        await connection.execute(`
            INSERT INTO staff_profiles (id, user_id, staff_id, job_title, grade_level, rank, designation, is_active)
            VALUES (1010, 1010, 'STAFF/PHD/HOD', 'Department Head', 'L15', 'Professor', 'Academic Staff', 1)
            ON DUPLICATE KEY UPDATE job_title = 'Department Head', is_active = 1;
        `);

        // Helper to register test student user
        async function createTestStudent(userId, email, name, matric) {
            await connection.execute(`
                INSERT INTO users (id, name, email, password, role, status)
                VALUES (${userId}, '${name}', '${email}', '$2a$10$T8Z.QW/a3Hl7xQk0n1J6E.iN2wF89Z.eQ3B.k2eN2yM3xP4zQ5wRy', 'student', 'active')
                ON DUPLICATE KEY UPDATE name = '${name}', status = 'active';
            `);
            await connection.execute(`
                INSERT INTO students (id, user_id, first_name, last_name, matric_number, programme_id, dept_id, current_level, admission_year, status, gender)
                VALUES (${userId}, ${userId}, '${name.split(' ')[1]}', 'Student', '${matric}', 1, 1, 800, 2025, 'active', 'male')
                ON DUPLICATE KEY UPDATE matric_number = '${matric}', status = 'active';
            `);
            return userId;
        }

        // 4. Seed Candidate A (Supervisors Pending Stage)
        console.log("Configuring Candidate A (Supervisors Pending Stage)...");
        const studentA = await createTestStudent(2001, "candA@test.edu", "[TEST-SEED] Candidate A", "PHD/2026/A");
        await connection.execute(`
            INSERT INTO phd_applications (id, student_id, research_title, abstract, status)
            VALUES (3001, ${studentA}, '[TEST-SEED] Deep Learning in Renewable Energy Grid Networks', 'This research explores artificial neural architectures applied to decentralized photovoltaics scheduling.', 'supervisors_pending')
            ON DUPLICATE KEY UPDATE research_title = '[TEST-SEED] Deep Learning in Renewable Energy Grid Networks', status = 'supervisors_pending';
        `);
        // Seed supervisors
        await connection.execute(`DELETE FROM phd_supervisors WHERE phd_application_id = 3001`);
        await connection.execute(`
            INSERT INTO phd_supervisors (phd_application_id, type, name, email, token, status)
            VALUES 
            (3001, 'internal', '[TEST-SEED] Dr. Albert Einstein', 'einstein@test.edu', 'token-sup-pending', 'pending'),
            (3001, 'external', '[TEST-SEED] Prof. Marie Curie', 'curie@external.edu', 'token-sup-accepted', 'accepted')
        `);

        // 5. Seed Candidate B (Fees Clearance Gating Stage)
        console.log("Configuring Candidate B (Fees Clearance Gating Stage)...");
        const studentB = await createTestStudent(2002, "candB@test.edu", "[TEST-SEED] Candidate B", "PHD/2026/B");
        await connection.execute(`
            INSERT INTO phd_applications (id, student_id, research_title, abstract, status)
            VALUES (3002, ${studentB}, '[TEST-SEED] Advanced Cryptography in E-Governance Protocols', 'Investigating Zero-Knowledge Proof security infrastructures inside multi-tenant public portals.', 'supervisors_accepted')
            ON DUPLICATE KEY UPDATE research_title = '[TEST-SEED] Advanced Cryptography in E-Governance Protocols', status = 'supervisors_accepted';
        `);
        // Seed accepted supervisors
        await connection.execute(`DELETE FROM phd_supervisors WHERE phd_application_id = 3002`);
        await connection.execute(`
            INSERT INTO phd_supervisors (phd_application_id, type, name, email, token, status)
            VALUES 
            (3002, 'internal', '[TEST-SEED] Dr. Alan Turing', 'turing@test.edu', 'token-b1', 'accepted'),
            (3002, 'external', '[TEST-SEED] Prof. Richard Feynman', 'feynman@external.edu', 'token-b2', 'accepted')
        `);
        // Seed outstanding unpaid bill
        await connection.execute(`DELETE FROM student_bills WHERE student_id = ${studentB}`);
        await connection.execute(`
            INSERT INTO student_bills (student_id, session_id, bill_number, total_amount, amount_paid, status, note)
            VALUES (${studentB}, ${sessionId}, 'BILL-[TEST-SEED]-B', '150000.00', '0.00', 'pending', 'Postgraduate PhD Fees')
        `);

        // 6. Seed Candidate C (HOD Sequential Review Stage)
        console.log("Configuring Candidate C (Thesis Uploaded / HOD Review Stage)...");
        const studentC = await createTestStudent(2003, "candC@test.edu", "[TEST-SEED] Candidate C", "PHD/2026/C");
        await connection.execute(`
            INSERT INTO phd_applications (id, student_id, research_title, abstract, status)
            VALUES (3003, ${studentC}, '[TEST-SEED] Quantum Computing in FinTech Transaction Engines', 'Evaluating scalability models of quantum computing registers applied to large transaction logs.', 'thesis_uploaded')
            ON DUPLICATE KEY UPDATE research_title = '[TEST-SEED] Quantum Computing in FinTech Transaction Engines', status = 'thesis_uploaded';
        `);
        await connection.execute(`DELETE FROM phd_supervisors WHERE phd_application_id = 3003`);
        await connection.execute(`
            INSERT INTO phd_supervisors (phd_application_id, type, name, email, token, status)
            VALUES 
            (3003, 'internal', '[TEST-SEED] Dr. Max Planck', 'planck@test.edu', 'token-c1', 'accepted'),
            (3003, 'external', '[TEST-SEED] Prof. Niels Bohr', 'bohr@external.edu', 'token-c2', 'accepted')
        `);
        // Paid bill
        await connection.execute(`DELETE FROM student_bills WHERE student_id = ${studentC}`);
        await connection.execute(`
            INSERT INTO student_bills (student_id, session_id, bill_number, total_amount, amount_paid, status, note)
            VALUES (${studentC}, ${sessionId}, 'BILL-[TEST-SEED]-C', '150000.00', '150000.00', 'paid', 'Postgraduate PhD Fees')
        `);
        // Uploaded Thesis under HOD review
        await connection.execute(`DELETE FROM phd_theses WHERE phd_application_id = 3003`);
        await connection.execute(`
            INSERT INTO phd_theses (id, phd_application_id, file_url, status, is_corrected_version)
            VALUES (4003, 3003, 'https://s3.aws.com/school-portal/thesis-c-quantum.pdf', 'dept_review', 0)
        `);

        // 7. Seed Candidate D (Approved Review / Plagiarism Gated Stage)
        console.log("Configuring Candidate D (Approved / Corrected Thesis Re-upload Stage)...");
        const studentD = await createTestStudent(2004, "candD@test.edu", "[TEST-SEED] Candidate D", "PHD/2026/D");
        await connection.execute(`
            INSERT INTO phd_applications (id, student_id, research_title, abstract, status)
            VALUES (3004, ${studentD}, '[TEST-SEED] Autonomous Robotics in African Arid Agriculture', 'Testing neural feedback loops in autonomous drone harvesting in high thermal stress conditions.', 'approved_corrections')
            ON DUPLICATE KEY UPDATE research_title = '[TEST-SEED] Autonomous Robotics in African Arid Agriculture', status = 'approved_corrections';
        `);
        await connection.execute(`DELETE FROM phd_supervisors WHERE phd_application_id = 3004`);
        await connection.execute(`
            INSERT INTO phd_supervisors (phd_application_id, type, name, email, token, status)
            VALUES 
            (3004, 'internal', '[TEST-SEED] Dr. Nikola Tesla', 'tesla@test.edu', 'token-d1', 'accepted'),
            (3004, 'external', '[TEST-SEED] Prof. Galileo Galilei', 'galileo@external.edu', 'token-d2', 'accepted')
        `);
        // Paid bill
        await connection.execute(`DELETE FROM student_bills WHERE student_id = ${studentD}`);
        await connection.execute(`
            INSERT INTO student_bills (student_id, session_id, bill_number, total_amount, amount_paid, status, note)
            VALUES (${studentD}, ${sessionId}, 'BILL-[TEST-SEED]-D', '150000.00', '150000.00', 'paid', 'Postgraduate PhD Fees')
        `);
        // Draft thesis initial approved
        await connection.execute(`DELETE FROM phd_theses WHERE phd_application_id = 3004`);
        await connection.execute(`
            INSERT INTO phd_theses (id, phd_application_id, file_url, status, is_corrected_version)
            VALUES (4004, 3004, 'https://s3.aws.com/school-portal/thesis-d-initial.pdf', 'approved', 0)
        `);

        // 8. Seed Candidate E (Scheduled Defense Gated Stage)
        console.log("Configuring Candidate E (Defense Scheduled Stage)...");
        const studentE = await createTestStudent(2005, "candE@test.edu", "[TEST-SEED] Candidate E", "PHD/2026/E");
        await connection.execute(`
            INSERT INTO phd_applications (id, student_id, research_title, abstract, status)
            VALUES (3005, ${studentE}, '[TEST-SEED] Bio-mimetic Nanostructures for Bone Tissue Regeneration', 'Designing scaffold frameworks simulating human osteoblasts using molecular carbon layers.', 'defense_scheduled')
            ON DUPLICATE KEY UPDATE research_title = '[TEST-SEED] Bio-mimetic Nanostructures for Bone Tissue Regeneration', status = 'defense_scheduled';
        `);
        await connection.execute(`DELETE FROM phd_supervisors WHERE phd_application_id = 3005`);
        await connection.execute(`
            INSERT INTO phd_supervisors (phd_application_id, type, name, email, token, status)
            VALUES 
            (3005, 'internal', '[TEST-SEED] Dr. Stephen Hawking', 'hawking@test.edu', 'token-e1', 'accepted'),
            (3005, 'external', '[TEST-SEED] Prof. Isaac Newton', 'newton@external.edu', 'token-e2', 'accepted')
        `);
        // Paid bill
        await connection.execute(`DELETE FROM student_bills WHERE student_id = ${studentE}`);
        await connection.execute(`
            INSERT INTO student_bills (student_id, session_id, bill_number, total_amount, amount_paid, status, note)
            VALUES (${studentE}, ${sessionId}, 'BILL-[TEST-SEED]-E', '150000.00', '150000.00', 'paid', 'Postgraduate PhD Fees')
        `);
        // Seed corrected Turnitin verified thesis
        await connection.execute(`DELETE FROM phd_theses WHERE phd_application_id = 3005`);
        await connection.execute(`
            INSERT INTO phd_theses (id, phd_application_id, file_url, turnitin_report_url, turnitin_score, status, is_corrected_version)
            VALUES (4005, 3005, 'https://s3.aws.com/school-portal/thesis-e-corrected.pdf', 'https://s3.aws.com/school-portal/turnitin-e.pdf', 11, 'approved', 1)
        `);
        // Seed Defense schedule
        await connection.execute(`DELETE FROM phd_defenses WHERE phd_application_id = 3005`);
        await connection.execute(`
            INSERT INTO phd_defenses (phd_application_id, defense_date, location, status)
            VALUES (3005, '2026-06-15 10:00:00', 'PG Seminar Room A', 'scheduled')
        `);
        // Seed Examiners (3 external, 2 internal)
        await connection.execute(`DELETE FROM phd_examiners WHERE phd_application_id = 3005`);
        await connection.execute(`
            INSERT INTO phd_examiners (phd_application_id, name, email, type, honorarium_amount, payment_status)
            VALUES 
            (3005, '[TEST-SEED] Prof. Ada Lovelace', 'ada@external.edu', 'external', '150000.00', 'pending'),
            (3005, '[TEST-SEED] Prof. Grace Hopper', 'grace@external.edu', 'external', '150000.00', 'pending'),
            (3005, '[TEST-SEED] Prof. Katherine Johnson', 'katherine@external.edu', 'external', '150000.00', 'pending'),
            (3005, '[TEST-SEED] Dr. Charles Babbage', 'charles@test.edu', 'internal', '80000.00', 'pending'),
            (3005, '[TEST-SEED] Dr. John von Neumann', 'john@test.edu', 'internal', '80000.00', 'pending')
        `);

        // 9. Seed Candidate F (Defense Successful / Provost Graduation Gated Stage)
        console.log("Configuring Candidate F (Defense Successful / Graduation Gated Stage)...");
        const studentF = await createTestStudent(2006, "candF@test.edu", "[TEST-SEED] Candidate F", "PHD/2026/F");
        await connection.execute(`
            INSERT INTO phd_applications (id, student_id, research_title, abstract, status)
            VALUES (3006, ${studentF}, '[TEST-SEED] Cyber-Physical Power Networks for Smart Cities Grid', 'Analyzing digital feedback systems gating renewable supply channels.', 'defense_scheduled')
            ON DUPLICATE KEY UPDATE research_title = '[TEST-SEED] Cyber-Physical Power Networks for Smart Cities Grid', status = 'defense_scheduled';
        `);
        await connection.execute(`DELETE FROM phd_supervisors WHERE phd_application_id = 3006`);
        await connection.execute(`
            INSERT INTO phd_supervisors (phd_application_id, type, name, email, token, status)
            VALUES 
            (3006, 'internal', '[TEST-SEED] Dr. Tim Berners-Lee', 'timbl@test.edu', 'token-f1', 'accepted'),
            (3006, 'external', '[TEST-SEED] Prof. Vint Cerf', 'vint@external.edu', 'token-f2', 'accepted')
        `);
        // Paid bill
        await connection.execute(`DELETE FROM student_bills WHERE student_id = ${studentF}`);
        await connection.execute(`
            INSERT INTO student_bills (student_id, session_id, bill_number, total_amount, amount_paid, status, note)
            VALUES (${studentF}, ${sessionId}, 'BILL-[TEST-SEED]-F', '150000.00', '150000.00', 'paid', 'Postgraduate PhD Fees')
        `);
        // Seed corrected Turnitin verified thesis
        await connection.execute(`DELETE FROM phd_theses WHERE phd_application_id = 3006`);
        await connection.execute(`
            INSERT INTO phd_theses (id, phd_application_id, file_url, turnitin_report_url, turnitin_score, status, is_corrected_version)
            VALUES (4006, 3006, 'https://s3.aws.com/school-portal/thesis-f-corrected.pdf', 'https://s3.aws.com/school-portal/turnitin-f.pdf', 6, 'approved', 1)
        `);
        // Seed Defense schedule as SUCCESSFUL
        await connection.execute(`DELETE FROM phd_defenses WHERE phd_application_id = 3006`);
        await connection.execute(`
            INSERT INTO phd_defenses (phd_application_id, defense_date, location, status)
            VALUES (3006, '2026-05-20 14:00:00', 'PG Boardroom B', 'successful')
        `);
        // Seed Examiners (3 external, 2 internal) approved for payment
        await connection.execute(`DELETE FROM phd_examiners WHERE phd_application_id = 3006`);
        await connection.execute(`
            INSERT INTO phd_examiners (phd_application_id, name, email, type, honorarium_amount, payment_status)
            VALUES 
            (3006, '[TEST-SEED] Prof. Dennis Ritchie', 'dennis@external.edu', 'external', '150000.00', 'approved_by_provost'),
            (3006, '[TEST-SEED] Prof. Ken Thompson', 'ken@external.edu', 'external', '150000.00', 'approved_by_provost'),
            (3006, '[TEST-SEED] Prof. Linus Torvalds', 'linus@external.edu', 'external', '150000.00', 'approved_by_provost'),
            (3006, '[TEST-SEED] Dr. Donald Knuth', 'donald@test.edu', 'internal', '80000.00', 'approved_by_provost'),
            (3006, '[TEST-SEED] Dr. Edsger Dijkstra', 'edsger@test.edu', 'internal', '80000.00', 'approved_by_provost')
        `);

        // 10. Seed Referee Invitations
        console.log("Configuring Referee invitations...");
        await connection.execute(`DELETE FROM referee_invitations WHERE referee_name LIKE '[TEST-SEED]%'`);
        await connection.execute(`
            INSERT INTO referee_invitations (application_id, application_type, referee_name, referee_email, token, status)
            VALUES 
            (3001, 'postgraduate', '[TEST-SEED] Academic Referee (Dr. Turing)', 'referee-academic@test.edu', 'referee-token-academic', 'pending'),
            (9999, 'job', '[TEST-SEED] Professional Referee (Dr. Hopper)', 'referee-job@test.edu', 'referee-token-job', 'pending')
        `);

        // Commit transaction
        await connection.commit();
        console.log("\nDatabase Seeding Completed Successfully!");
        console.log("=========================================");
        console.log("Seed Portal Tokens to test:");
        console.log("1. Supervisor Accept Link:   https://schoolportal.edu/supervisor/accept?token=token-sup-pending");
        console.log("2. Academic Referee Form Link: https://schoolportal.edu/referee/respond?token=referee-token-academic");
        console.log("3. Professional Referee Link:  https://schoolportal.edu/referee/respond?token=referee-token-job");
        console.log("=========================================");
        console.log("Use scratch/cleanup-phd-data.js to wipe out all seed data.");

    } catch (error) {
        await connection.rollback();
        console.error("Database seeding failed:", error);
    } finally {
        await connection.end();
    }
}

run();
