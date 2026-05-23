import * as fs from "fs";
import * as path from "path";
import * as mime from "mime-types";

/**
 * BlobService — mirrors Rust's `app::blob::Blob`.
 *
 * A "blob" is simply a file identified by an ordered list of path components,
 * e.g. ["students", "1001", "photo.jpg"].
 * The physical file lives at: <BLOB_ROOT>/<components.join("/"}>
 * The public URL is:          <BLOB_BASE_URL>/<components.join("/"}>
 */

const BLOB_ROOT     = process.env.BLOB_ROOT     || path.join(process.cwd(), "public/uploads");
const BLOB_BASE_URL = process.env.UPLOAD_BASE_URL || "/uploads";

export class BlobService {

    private components: string[];

    constructor(components: string[]) {
        this.components = components.map(c => c.replace(/\.\./g, "").replace(/\/+/g, ""));
    }

    /**
     * Absolute filesystem path to the blob.
     * Matches 'blob.absolute_path()' from Rust.
     */
    absolutePath(): string {
        return path.join(BLOB_ROOT, ...this.components);
    }

    /**
     * Relative path from the blob root.
     * Matches 'blob.relative_path()' from Rust.
     */
    relativePath(): string {
        return this.components.join("/");
    }

    /**
     * Public-facing URL for the blob.
     * Matches 'Blob::url()' from Rust.
     */
    url(): string {
        return `${BLOB_BASE_URL}/${this.components.join("/")}`;
    }

    /**
     * Returns true if the blob exists on disk.
     * Matches 'blob.exists()' from Rust.
     */
    exists(): boolean {
        return fs.existsSync(this.absolutePath());
    }

    /**
     * Reads the blob and returns its Base64-encoded content.
     * Matches 'blob.base64()' from Rust.
     */
    base64(): string {
        if (!this.exists()) throw new Error("Blob does not exist");
        return fs.readFileSync(this.absolutePath()).toString("base64");
    }

    /**
     * Returns a data URI (e.g. for embedding images in HTML).
     * Matches 'blob.datauri()' from Rust.
     */
    dataUri(): string {
        if (!this.exists()) throw new Error("Blob does not exist");
        const absPath  = this.absolutePath();
        const mimeType = mime.lookup(absPath) || "application/octet-stream";
        const b64      = fs.readFileSync(absPath).toString("base64");
        return `data:${mimeType};base64,${b64}`;
    }

    /**
     * Saves content to the blob path, creating parent directories as needed.
     * Accepts a Buffer, string content, or a source file path.
     * Matches 'blob.save(content)' / 'blob.save(&fs::read(path))' from Rust.
     */
    save(content: Buffer | string): string {
        const dest = this.absolutePath();
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        fs.writeFileSync(dest, content);
        return dest;
    }

    /**
     * Deletes the blob from disk.
     * Matches 'blob.delete()' from Rust.
     */
    delete(): void {
        if (!this.exists()) throw new Error("Blob does not exist");
        fs.unlinkSync(this.absolutePath());
    }

    // --- Static factory ---

    static fromComponents(components: string[]): BlobService {
        return new BlobService(components);
    }
}
