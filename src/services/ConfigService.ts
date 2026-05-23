import path from "path";
import fs from "fs";
import { execSync } from "child_process";

export class ConfigService {

    /**
     * Returns the path to the configuration file (.env).
     * Matches 'Node::config_file' from Rust.
     */
    static getConfigPath(): string {
        return path.resolve(process.cwd(), ".env");
    }

    /**
     * Opens the configuration file in a specified editor.
     * Matches 'config edit' from Rust.
     */
    static editConfig(editor: 'code' | 'nano' | 'vi' = 'code'): void {
        const filePath = this.getConfigPath();
        
        if (!fs.existsSync(filePath)) {
            throw new Error(`Configuration file not found at ${filePath}`);
        }

        try {
            // Use shell execution to open editor
            // For Windows 'code' works, 'nano'/'vi' might need WSL or Git Bash
            console.log(`Opening ${filePath} with ${editor}...`);
            execSync(`${editor} "${filePath}"`, { stdio: 'inherit' });
        } catch (error) {
            throw new Error(`Failed to open editor: ${editor}. Ensure it is in your PATH.`);
        }
    }

    /**
     * Returns the current configuration as an object.
     * Matches 'Node::pretty_print' from Rust.
     */
    static async showConfig() {
        const filePath = this.getConfigPath();
        if (!fs.existsSync(filePath)) return {};

        const content = fs.readFileSync(filePath, 'utf-8');
        const config: Record<string, string> = {};

        content.split('\n').forEach(line => {
            const [key, ...value] = line.split('=');
            if (key && value.length > 0) {
                config[key.trim()] = value.join('=').trim();
            }
        });

        return config;
    }
}
