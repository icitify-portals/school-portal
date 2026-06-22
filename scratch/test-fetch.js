import { getStaffProfileByUserId } from "../src/actions/hr_leave.js";

async function run() {
    try {
        console.log("Fetching staff profile for userId 5...");
        const prof = await getStaffProfileByUserId(5);
        console.log("Result:", JSON.stringify(prof, null, 2));
    } catch (e) {
        console.error("Error during fetch:", e);
    }
}

run();
