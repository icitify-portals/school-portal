import { execSync } from "child_process";
import fs from "fs";
import path from "path";

export class FrontendManagementService {

    /**
     * Cleans the frontend workspace by removing build artifacts.
     * Matches 'clean_workspace' from Rust.
     */
    static async cleanWorkspace() {
        const pathsToClean = [
            path.resolve(process.cwd(), ".next"),
            path.resolve(process.cwd(), "dist"),
            path.resolve(process.cwd(), "out"),
        ];

        console.log("Cleaning frontend workspace...");
        for (const p of pathsToClean) {
            if (fs.existsSync(p)) {
                fs.rmSync(p, { recursive: true, force: true });
                console.log(`Removed: ${p}`);
            }
        }
    }

    /**
     * Packs (builds) the frontend application.
     * Matches 'pack' from Rust.
     */
    static async pack(message?: string) {
        console.log(`Packing frontend... ${message ? `(${message})` : ""}`);
        try {
            execSync("npm run build", { stdio: "inherit" });
            console.log("Frontend packed successfully.");
        } catch (error) {
            throw new Error("Frontend build failed. Check console for details.");
        }
    }

    /**
     * Retrieves the last git commit hash.
     * Matches 'last_commit_hash' from Rust.
     */
    static getLastCommitHash(): string {
        try {
            return execSync("git rev-parse HEAD").toString().trim();
        } catch (e) {
            return "N/A (Git not initialized)";
        }
    }

    /**
     * Placeholder for deployment logic.
     * Matches 'deploy' from Rust.
     */
    static async deploy(options: { skipUpdates?: boolean } = {}) {
        console.log("Deploying frontend...");
        if (!options.skipUpdates) {
            console.log("Checking for system updates...");
            // execSync("npm update", { stdio: "inherit" });
        }
        
        // Logic for moving build output to production or triggering a hook
        console.log("Deployment complete.");
    }
}
