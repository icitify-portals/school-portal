import { db } from './src/db/db';
import { sql } from 'drizzle-orm';
async function run() {
    try {
        await db.execute(sqlALTER TABLE students ADD COLUMN study_mode ENUM('full-time', 'part-time', 'elearning') DEFAULT 'full-time');
        console.log('Students updated.');
    } catch(e) { console.log(e.message); }
    try {
        await db.execute(sqlALTER TABLE admission_applications_v2 ADD COLUMN study_mode ENUM('full-time', 'part-time', 'elearning') DEFAULT 'full-time');
        console.log('Admissions updated.');
    } catch(e) { console.log(e.message); }
    process.exit(0);
}
run();
