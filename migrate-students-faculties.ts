import path from 'path';
import { db } from './src/db/db';
import { sql } from 'drizzle-orm';

async function run() {
    console.log("Ensuring target Faculties exist...");
    const facs = [
        { name: 'Faculty of Science', code: 'FSC', depts: ['Computer Science', 'Artificial Intelligence', 'Networking and cloud computing', 'Statistics'] },
        { name: 'Faculty of Business Administration', code: 'FBA', depts: ['Business Administration', 'Accountancy'] }
    ];

    let validFacIds = [];
    let validDeptIds = [];
    let validProgIds = [];

    await db.execute(sql`SET FOREIGN_KEY_CHECKS = 0;`);

    for (const f of facs) {
        await db.execute(sql.raw(`INSERT INTO faculties (unit_id, name, code) VALUES (1, '${f.name}', '${f.code}') ON DUPLICATE KEY UPDATE name=name`));
        const [res] = await db.execute(sql.raw(`SELECT id FROM faculties WHERE name = '${f.name}'`));
        const facId = res[0].id;
        validFacIds.push(facId);

        for (const d of f.depts) {
            await db.execute(sql.raw(`INSERT INTO departments (faculty_id, unit_id, name, code) VALUES (${facId}, 1, '${d}', '${d.substring(0,3).toUpperCase()}') ON DUPLICATE KEY UPDATE name=name`));
            const [deptRes] = await db.execute(sql.raw(`SELECT id FROM departments WHERE name = '${d}' AND faculty_id = ${facId}`));
            const deptId = deptRes[0].id;
            validDeptIds.push(deptId);

            // Ensure a programme exists
            const progName = `B.Sc ${d}`;
            await db.execute(sql.raw(`INSERT INTO programmes (dept_id, name, code, duration_months, duration_years) VALUES (${deptId}, '${progName}', '${d.substring(0,3).toUpperCase()}', 48, 4) ON DUPLICATE KEY UPDATE name=name`));
            const [progRes] = await db.execute(sql.raw(`SELECT id FROM programmes WHERE name = '${progName}' AND dept_id = ${deptId}`));
            const progId = progRes[0].id;
            validProgIds.push(progId);
        }
    }

    console.log("Valid Facs: ", validFacIds);
    console.log("Valid Depts: ", validDeptIds);
    console.log("Valid Progs: ", validProgIds);

    const defaultProgId = validProgIds[0];
    const invalidProgStr = validProgIds.join(',');
    console.log(`Moving orphaned students to Programme ID ${defaultProgId}`);
    await db.execute(sql.raw(`UPDATE students SET programme_id = ${defaultProgId} WHERE programme_id NOT IN (${invalidProgStr}) OR programme_id IS NULL`));

    const defaultDeptId = validDeptIds[0];
    const invalidDeptStr = validDeptIds.join(',');
    console.log(`Moving orphaned staff to Dept ID ${defaultDeptId}`);
    await db.execute(sql.raw(`UPDATE staff_profiles SET department_id = ${defaultDeptId} WHERE department_id NOT IN (${invalidDeptStr}) OR department_id IS NULL`));

    console.log("Deleting extraneous programmes...");
    await db.execute(sql.raw(`DELETE FROM programmes WHERE id NOT IN (${invalidProgStr})`));

    console.log("Deleting extraneous departments...");
    await db.execute(sql.raw(`DELETE FROM departments WHERE id NOT IN (${invalidDeptStr})`));

    console.log("Deleting extraneous faculties...");
    const invalidFacStr = validFacIds.join(',');
    await db.execute(sql.raw(`DELETE FROM faculties WHERE id NOT IN (${invalidFacStr})`));

    await db.execute(sql`SET FOREIGN_KEY_CHECKS = 1;`);
    console.log("Migration complete.");
    process.exit(0);
}
run();
