import mysql from 'mysql2/promise';

async function run() {
    try {
        const connection = await mysql.createConnection("mysql://root:@localhost:3306/school_portal");
        
        console.log("=== SEEDING SPORTS & ATHLETICS + MODULES ===");

        // Disable foreign keys temporarily
        await connection.execute("SET FOREIGN_KEY_CHECKS = 0");

        // Clear existing tables
        await connection.execute("TRUNCATE TABLE sports_team_members");
        await connection.execute("TRUNCATE TABLE sports_fixtures");
        await connection.execute("TRUNCATE TABLE sports_inventory");
        await connection.execute("TRUNCATE TABLE sports_media");
        await connection.execute("TRUNCATE TABLE sports_teams");
        await connection.execute("TRUNCATE TABLE system_modules");

        // 1. Seed System Modules
        console.log("Seeding system_modules...");
        const modules = [
            ["its", "Intelligent Tutoring System", "AI Classroom, Vision, and Automation", 1],
            ["gamification", "Gamification Engine", "XP, Badges, and Leaderboards", 1],
            ["parent_portal", "Parent Portal", "Parental child monitoring and insights", 1],
            ["admission", "Admission Management", "Applications, Screening, and Admissions", 1],
            ["finance", "Finance & Accounting", "Bursary, Payroll, and Assets", 1],
            ["lms", "E-Learning & LMS", "Courses, CBT, and Virtual Classes", 1],
            ["hr", "Human Resources", "Staff profiles, Leave, and Performance", 1],
            ["security", "Security & Visitors", "Visitor tracking and Identity management", 1],
            ["sports", "Sports & Athletics", "Manage athletic teams, fixtures, rosters, and inventory", 1]
        ];

        for (const [key, name, description, isEnabled] of modules) {
            await connection.execute(
                "INSERT INTO system_modules (`key`, `name`, `description`, `is_enabled`) VALUES (?, ?, ?, ?)",
                [key, name, description, isEnabled]
            );
        }

        // 2. Seed Sports Teams
        console.log("Seeding sports_teams...");
        const teams = [
            [1, "FSS Falcons Soccer", "Soccer", "male", 5, "The elite male soccer squadron representing Federal School of Statistics.", "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=800"],
            [1, "FSS Rockets Basketball", "Basketball", "male", 5, "High-flying dunkers and tactical playmakers competing in regional monotechnic leagues.", "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&q=80&w=800"],
            [1, "FSS Lady Harriers", "Athletics", "female", 5, "Track and field speedsters specializing in 100m, 400m, and relay championships.", "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&q=80&w=800"]
        ];

        const seededTeamIds = [];
        for (const team of teams) {
            const [result] = await connection.execute(
                "INSERT INTO sports_teams (`unit_id`, `name`, `category`, `gender`, `coach_id`, `description`, `image_url`) VALUES (?, ?, ?, ?, ?, ?, ?)",
                team
            );
            seededTeamIds.push(result.insertId);
        }
        console.log("Seeded teams:", seededTeamIds);

        // 3. Seed Team Members (Roster)
        console.log("Seeding sports_team_members...");
        const members = [
            // Soccer
            [seededTeamIds[0], 6, "Striker", 9, "active"],
            [seededTeamIds[0], 9, "Midfielder", 8, "active"],
            [seededTeamIds[0], 10, "Goalkeeper", 1, "active"],
            // Basketball
            [seededTeamIds[1], 6, "Point Guard", 10, "active"],
            [seededTeamIds[1], 9, "Shooting Guard", 23, "active"],
            [seededTeamIds[1], 10, "Power Forward", 33, "injured"],
            // Athletics
            [seededTeamIds[2], 9, "Sprinter (100m)", null, "active"],
            [seededTeamIds[2], 10, "Relay Anchor", null, "active"]
        ];

        for (const member of members) {
            await connection.execute(
                "INSERT INTO sports_team_members (`team_id`, `student_id`, `position`, `jersey_number`, `status`) VALUES (?, ?, ?, ?, ?)",
                member
            );
        }

        // 4. Seed Fixtures
        console.log("Seeding sports_fixtures...");
        const fixtures = [
            [1, seededTeamIds[0], "UI FC (University of Ibadan)", "Main Campus Stadium", "home", "2026-05-15 16:00:00", "completed", 3, 1, "FSS Falcons secured a resounding 3-1 victory against UI FC, with a spectacular brace by John Student."],
            [1, seededTeamIds[0], "Poly Ibadan FC", "Poly Sports Complex", "away", "2026-05-28 15:30:00", "scheduled", 0, 0, null],
            [1, seededTeamIds[1], "Lead City Kings", "FSS Sports Arena", "home", "2026-05-20 18:00:00", "completed", 84, 78, "A thrilling overtime game where Rockets dominated the court, clinching a narrow win."],
            [1, seededTeamIds[1], "UNILAG Marines", "UNILAG Indoor Hall", "away", "2026-06-05 17:00:00", "scheduled", 0, 0, null]
        ];

        const seededFixtureIds = [];
        for (const fixture of fixtures) {
            const [result] = await connection.execute(
                "INSERT INTO sports_fixtures (`unit_id`, `team_id`, `opponent`, `venue`, `match_type`, `scheduled_at`, `status`, `score_home`, `score_away`, `result_note`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                fixture
            );
            seededFixtureIds.push(result.insertId);
        }

        // 5. Seed Inventory
        console.log("Seeding sports_inventory...");
        const inventory = [
            [1, "FIFA Size-5 Soccer Balls", 15, 12, "good"],
            [1, "Spalding Leather Basketballs", 12, 10, "good"],
            [1, "Team Training Bibs (Neon Green)", 30, 28, "good"],
            [1, "Agility Training Cones", 60, 60, "good"],
            [1, "Professional First Aid Kit", 4, 3, "excellent"]
        ];

        for (const item of inventory) {
            await connection.execute(
                "INSERT INTO sports_inventory (`unit_id`, `item_name`, `total_quantity`, `available_quantity`, `condition`) VALUES (?, ?, ?, ?, ?)",
                item
            );
        }

        // 6. Seed Media
        console.log("Seeding sports_media...");
        const media = [
            [1, seededTeamIds[0], seededFixtureIds[0], "photo", "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=800", "John Student striking the second goal against UI FC.", 1],
            [1, seededTeamIds[1], seededFixtureIds[2], "photo", "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&q=80&w=800", "Rockets securing the crucial basket in the final quarter.", 1],
            [1, seededTeamIds[2], null, "photo", "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&q=80&w=800", "Lady Harriers dominating the track qualifiers.", 1]
        ];

        for (const m of media) {
            await connection.execute(
                "INSERT INTO sports_media (`unit_id`, `team_id`, `fixture_id`, `type`, `url`, `caption`, `is_featured`) VALUES (?, ?, ?, ?, ?, ?, ?)",
                m
            );
        }

        // Re-enable foreign keys
        await connection.execute("SET FOREIGN_KEY_CHECKS = 1");

        console.log("=== SEEDING COMPLETED SUCCESSFULLY ===");
        await connection.end();
    } catch (e) {
        console.error("Seeding failed:", e);
    }
}

run();
