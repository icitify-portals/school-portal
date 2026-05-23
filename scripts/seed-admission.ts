
import { db } from "../src/db/db";
import { programmes, departments, jambCandidates, users, admissionApplications, institutionalUnits, faculties, oLevelResults } from "../src/db/schema";
import { eq, sql } from "drizzle-orm";

async function seed() {
    console.log("Seeding Admission Data...");

    // 0. Ensure Unit and Faculty exist
    let unit = await db.query.institutionalUnits.findFirst();
    if (!unit) {
        console.log("Creating Default Unit...");
        await db.insert(institutionalUnits).values({
            name: "Main Campus",
            code: "MAIN", // Fixed: slug -> code
            type: "campus" // Fixed: category -> type (checked schema)
        });
        unit = await db.query.institutionalUnits.findFirst();
    }

    let faculty = await db.query.faculties.findFirst();
    if (!faculty) {
        console.log("Creating Faculty of Sciences...");
        await db.insert(faculties).values({
            name: "Faculty of Sciences",
            code: "SCI", // Added required field
            unitId: unit!.id
        });
        faculty = await db.query.faculties.findFirst();
    }

    // 1. Ensure Department exists
    let dept = await db.query.departments.findFirst({
        where: eq(departments.name, "Computer Science")
    });

    if (!dept) {
        console.log("Creating CS Department...");
        await db.insert(departments).values({
            name: "Computer Science",
            code: "CSC",
            unitId: unit!.id,
            facultyId: faculty!.id
        });
        dept = await db.query.departments.findFirst({
            where: eq(departments.name, "Computer Science")
        });
    }

    if (!dept) {
        console.error("Failed to create/find department.");
        return;
    }

    // 2. Create/Update Programme
    console.log("Creating Programmes...");
    await db.insert(programmes).values({
        name: "B.Sc. Computer Science",
        deptId: dept.id,
        durationMonths: 48,
        cutOffMark: 200,
        scoringStrategy: "WEIGHTED_AGGREGATE",
        scoringConfig: JSON.stringify({ utmeWeight: 50, screeningWeight: 50 })
    }).onDuplicateKeyUpdate({ set: { name: "B.Sc. Computer Science" } });

    // 3. Create Candidates & Users
    const candidates = [
        {
            regNo: "2024999999CS",
            surname: "Doe",
            firstname: "Jane",
            score: 280,
            email: "jane.doe@example.com",
            dob: "2005-01-01"
        },
        {
            regNo: "2024888888SE",
            surname: "Smith",
            firstname: "John",
            score: 190,
            email: "john.smith@example.com",
            dob: "2006-05-15"
        }
    ];

    for (const c of candidates) {
        let user = await db.query.users.findFirst({
            where: eq(users.email, c.email)
        });

        if (!user) {
            console.log(`Creating user ${c.email} using RAW SQL...`);
            await db.execute(
                sql`INSERT INTO users (name, email, password, role, status) VALUES (${c.firstname + " " + c.surname}, ${c.email}, 'hashed_password_raw', 'student', 'active')`
            );
            user = await db.query.users.findFirst({ where: eq(users.email, c.email) });
        }

        if (user) {
            console.log("---------------------------------------------------");
            console.log(`User Found: ID=${user.id} (Type: ${typeof user.id})`);
            console.log(`User Email: ${user.email}`);
            console.log(`Linking candidate ${c.regNo} to User ID ${user.id}...`);

            try {
                await db.insert(jambCandidates).values({
                    jambRegNo: c.regNo,
                    surname: c.surname,
                    firstname: c.firstname,
                    dob: c.dob,
                    score: c.score,
                    deptId: dept.id,
                    isClaimed: true,
                    claimedUserId: user.id
                }).onDuplicateKeyUpdate({ set: { score: c.score } });
                console.log(`Successfully linked candidate ${c.regNo}`);

                // 4. Create O-Level Results
                console.log(`Seeding O-Level for ${c.regNo}...`);
                await db.insert(oLevelResults).values({
                    jambRegNo: c.regNo,
                    examType: "WAEC",
                    examNumber: `WAEC${Math.floor(Math.random() * 1000000)}`,
                    examYear: 2023,
                    subjects: JSON.stringify({
                        "Mathematics": "A1",
                        "English Language": "B2",
                        "Physics": "B3",
                        "Chemistry": "A1",
                        "Biology": "C4"
                    })
                });
            } catch (err: any) {
                console.error(`FAILED to link candidate ${c.regNo}:`, err.message);
                if (err.sqlMessage) console.error("SQL Message:", err.sqlMessage);
            }
        } else {
            console.error(`CRITICAL: User ${c.email} was NOT found even after insert!`);
        }
    }

    console.log("Seeding Complete!");
}

seed().catch(console.error).then(() => process.exit(0));
