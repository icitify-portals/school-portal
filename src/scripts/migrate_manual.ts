import { db } from "../db/db";
import { sql } from "drizzle-orm";

async function run() {
    try {
        console.log("Adding lesson_id to assignments...");
        await db.execute(sql`ALTER TABLE assignments ADD COLUMN lesson_id int`);

        console.log("Adding lesson_id to quizzes...");
        await db.execute(sql`ALTER TABLE quizzes ADD COLUMN lesson_id int`);

        console.log("Adding FK to assignments...");
        await db.execute(sql`ALTER TABLE assignments ADD CONSTRAINT assignments_lesson_id_course_lessons_id_fk FOREIGN KEY (lesson_id) REFERENCES course_lessons(id) ON DELETE NO ACTION ON UPDATE NO ACTION`);

        console.log("Adding FK to quizzes...");
        await db.execute(sql`ALTER TABLE quizzes ADD CONSTRAINT quizzes_lesson_id_course_lessons_id_fk FOREIGN KEY (lesson_id) REFERENCES course_lessons(id) ON DELETE NO ACTION ON UPDATE NO ACTION`);

        console.log("Migration successful");
        process.exit(0);
    } catch (e) {
        console.error("Migration failed:", e);
        process.exit(1);
    }
}

run();
