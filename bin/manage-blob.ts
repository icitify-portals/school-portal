#!/usr/bin/env node

/**
 * manage-blob.ts
 * Mirrors Rust's blob module dispatcher (url, path, save, delete, base64, datauri, exists).
 *
 * Usage:
 *   npx tsx bin/manage-blob.ts <command> <component1> [component2 ...] [options]
 *
 * The "components" form the file path segments, e.g.:
 *   students 1001 photo.jpg  →  public/uploads/students/1001/photo.jpg
 */

import { BlobService } from "../src/services/BlobService";
import * as fs from "fs";

function usage() {
    console.log(`
Blob Management CLI
Usage: manage-blob <command> <component> [component ...] [options]

Commands:
  url           Print the public URL of the blob
  path          Print the filesystem path  (--relative for relative path)
  save          Save content to the blob   (--content <text>  |  --path <file>)
  delete        Delete the blob
  base64        Print Base64-encoded content of the blob
  datauri       Print Data URI of the blob (for images)
  exists        Print 1 if blob exists, 0 otherwise

Examples:
  npx tsx bin/manage-blob.ts url students 1001 photo.jpg
  npx tsx bin/manage-blob.ts path students 1001 photo.jpg --relative
  npx tsx bin/manage-blob.ts save students 1001 photo.jpg --path /tmp/img.jpg
  npx tsx bin/manage-blob.ts save students 1001 note.txt --content "Hello world"
  npx tsx bin/manage-blob.ts delete students 1001 photo.jpg
  npx tsx bin/manage-blob.ts base64 students 1001 photo.jpg
  npx tsx bin/manage-blob.ts datauri students 1001 photo.jpg
  npx tsx bin/manage-blob.ts exists students 1001 photo.jpg
    `);
}

function main() {
    const rawArgs = process.argv.slice(2);
    const command = rawArgs[0];

    if (!command || command === "--help") {
        usage();
        process.exit(0);
    }

    // --- Parse: collect components (positional) and named flags ---
    function opt(name: string): string | undefined {
        const idx = rawArgs.indexOf(`--${name}`);
        return idx !== -1 ? rawArgs[idx + 1] : undefined;
    }
    function flag(name: string): boolean {
        return rawArgs.includes(`--${name}`);
    }

    // Components are all positional args after the command that don't start with "--"
    const components: string[] = [];
    for (let i = 1; i < rawArgs.length; i++) {
        if (rawArgs[i].startsWith("--")) break;
        components.push(rawArgs[i]);
    }

    if (components.length === 0) {
        console.error("Error: at least one path component is required.");
        usage();
        process.exit(1);
    }

    const blob = new BlobService(components);

    switch (command) {
        case "url":
            console.log(blob.url());
            break;

        case "path":
            if (flag("relative")) {
                console.log(blob.relativePath());
            } else {
                if (!blob.exists()) {
                    console.error("Error: Blob does not exist");
                    process.exit(1);
                }
                console.log(blob.absolutePath());
            }
            break;

        case "save": {
            const srcPath  = opt("path");
            const content  = opt("content");
            let data: Buffer | string;

            if (srcPath) {
                if (!fs.existsSync(srcPath)) {
                    console.error(`Error: source file not found: ${srcPath}`);
                    process.exit(1);
                }
                data = fs.readFileSync(srcPath);
            } else {
                data = content ?? "";
            }

            const saved = blob.save(data);
            console.log(saved);
            break;
        }

        case "delete":
            if (!blob.exists()) {
                console.error("Error: Blob does not exist");
                process.exit(1);
            }
            blob.delete();
            console.log(`Deleted blob: ${blob.absolutePath()}`);
            break;

        case "base64":
            try {
                console.log(blob.base64());
            } catch {
                console.error("Error: Blob does not exist");
                process.exit(1);
            }
            break;

        case "datauri":
            try {
                console.log(blob.dataUri());
            } catch {
                console.error("Error: Blob does not exist");
                process.exit(1);
            }
            break;

        case "exists":
            // Matches Rust: `println!("{}", blob.exists() as i32)` → 0 or 1
            console.log(blob.exists() ? "1" : "0");
            break;

        default:
            console.error(`Unknown command: ${command}`);
            usage();
            process.exit(1);
    }
}

main();
