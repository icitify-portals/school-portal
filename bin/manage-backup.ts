#!/usr/bin/env node

/**
 * manage-backup.ts
 * Matches Rust's Backup::archive and Backup::install(PullOptions) CLIs.
 *
 * Usage:
 *   npx tsx bin/manage-backup.ts archive [--bucket <name>]
 *   npx tsx bin/manage-backup.ts pull [--bucket <name>] [--key <s3key>] [--blob] [--database] [--local-dir <path>] [--verbose]
 */

import { BackupService, PullOptions } from "../src/services/BackupService";

function usage() {
    console.log(`
Institutional Backup CLI
Usage: manage-backup <command> [options]

Commands:
  archive               Archive database (and blobs) → S3
  pull                  Pull & restore backup from S3
  list                  List backup directories in S3
  mv                    Move local archive into structured dest path
  presign-url           Generate presigned S3 download URLs

Archive Options:
  --bucket <name>       S3 bucket name  (default: env S3_BACKUP_BUCKET)

Pull Options:
  --bucket <name>       S3 bucket name
  --key <access-key>    S3 access key override
  --blob                Include blob files (default: both)
  --database            Include database dump (default: both)
  --local-dir <path>    Local restore destination
  --verbose             Print verbose output

List Options:
  --bucket <name>       S3 bucket name
  --json                Output as JSON map (default: plain list)

Mv Options:
  --archive-dir <path>  Source archive directory
  --dest-dir <path>     Destination root path
  --bucket <name>       Bucket name (used as sub-folder)
  --key <name>          Key name (used as sub-folder)

Presign-url Options:
  --bucket <name>       S3 bucket name
  --key <access-key>    S3 access key override
  --blob                Output blob presigned URL
  --database            Output database presigned URL
    `);
}

async function main() {
    const rawArgs = process.argv.slice(2);
    const command = rawArgs[0];

    if (!command || command === "--help") {
        usage();
        process.exit(0);
    }

    // --- Argument parser ---
    function flag(name: string): boolean {
        return rawArgs.includes(`--${name}`);
    }
    function opt(name: string): string | undefined {
        const idx = rawArgs.indexOf(`--${name}`);
        return idx !== -1 ? rawArgs[idx + 1] : undefined;
    }

    switch (command) {
        case "archive": {
            const bucket = opt("bucket");
            BackupService.archive(bucket);
            break;
        }

        case "pull": {
            const bucket   = opt("bucket");
            const key      = opt("key");
            const localDir = opt("local-dir");
            const verbose  = flag("verbose");

            const hasBlob = flag("blob");
            const hasDb   = flag("database");

            // Mirror Rust logic: if neither is specified, include both
            const includeBlob     = (!hasBlob && !hasDb) || hasBlob;
            const includeDatabase = (!hasBlob && !hasDb) || hasDb;

            const options: PullOptions = {
                includeBlob,
                includeDatabase,
                localDir,
                verbose,
            };

            await BackupService.pull(bucket, key, options);
            break;
        }

        case "push": {
            const bucket = opt("bucket");
            BackupService.push(bucket);
            break;
        }

        case "push-archive": {
            const filePath = opt("path");
            if (!filePath) { console.error("push-archive requires --path"); process.exit(1); }
            const bucket = opt("bucket");
            const key    = opt("key");
            BackupService.pushArchive(filePath, bucket, key);
            break;
        }

        case "pull-local": {
            const hasBlob = flag("blob");
            const hasDb   = flag("database");
            const includeBlob     = (!hasBlob && !hasDb) || hasBlob;
            const includeDatabase = (!hasBlob && !hasDb) || hasDb;
            BackupService.pullLocal({
                includeBlob,
                includeDatabase,
                localBucket: opt("local-bucket"),
                localDir:    opt("local-dir"),
                verbose:     flag("verbose"),
            });
            break;
        }

        case "regulate": {
            const bucket    = opt("bucket");
            const keepCount = opt("keep") ? parseInt(opt("keep")!) : 10;
            await BackupService.regulate(bucket, keepCount);
            break;
        }

        case "list": {
            const bucket  = opt("bucket");
            const asJson  = flag("json");
            const dirs    = await BackupService.listDirectories(bucket);

            if (asJson) {
                console.log(JSON.stringify(dirs, null, 2));
            } else {
                for (const dir of Object.keys(dirs)) {
                    console.log(dir);
                }
                console.log();
            }
            break;
        }

        case "mv": {
            const archiveDir = opt("archive-dir");
            const destDir    = opt("dest-dir");
            if (!archiveDir || !destDir) {
                console.error("mv requires --archive-dir and --dest-dir");
                process.exit(1);
            }
            const bucket = opt("bucket");
            const key    = opt("key");
            BackupService.moveArchive(archiveDir, destDir, bucket, key);
            break;
        }

        case "presign-url": {
            const bucket  = opt("bucket");
            const key     = opt("key");
            const hasBlob = flag("blob");
            const hasDb   = flag("database");

            if (hasBlob) {
                const url = await BackupService.getPresignUrl("blob", bucket, key);
                console.log(url);
            }
            if (hasDb) {
                const url = await BackupService.getPresignUrl("database", bucket, key);
                console.log(url);
            }
            if (!hasBlob && !hasDb) {
                console.error("presign-url requires --blob and/or --database");
                process.exit(1);
            }
            break;
        }

        default:
            console.error(`Unknown command: ${command}`);
            usage();
            process.exit(1);
    }
}

main().catch(err => {
    console.error("[backup] Fatal error:", err.message);
    process.exit(1);
});
