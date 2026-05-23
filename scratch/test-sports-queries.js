import { getSportsTeams, getSportsFixtures, getSportsInventory, getSportsMedia } from "../src/actions/sports.js";

async function testQueries() {
    process.env.CLI_DB_OVERRIDE = "school_portal";
    console.log("Testing sports actions...");
    try {
        const teams = await getSportsTeams(1);
        console.log("Teams fetched successfully, count:", teams.length);
        console.log("Teams sample:", JSON.stringify(teams.slice(0, 2), null, 2));
    } catch (e) {
        console.error("Error fetching teams:", e);
    }

    try {
        const fixtures = await getSportsFixtures(1);
        console.log("Fixtures fetched successfully, count:", fixtures.length);
        console.log("Fixtures sample:", JSON.stringify(fixtures.slice(0, 2), null, 2));
    } catch (e) {
        console.error("Error fetching fixtures:", e);
    }

    try {
        const inventory = await getSportsInventory(1);
        console.log("Inventory fetched successfully, count:", inventory.length);
        console.log("Inventory sample:", JSON.stringify(inventory.slice(0, 2), null, 2));
    } catch (e) {
        console.error("Error fetching inventory:", e);
    }

    try {
        const media = await getSportsMedia(1);
        console.log("Media fetched successfully, count:", media.length);
        console.log("Media sample:", JSON.stringify(media.slice(0, 2), null, 2));
    } catch (e) {
        console.error("Error fetching media:", e);
    }
}

testQueries().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
});
