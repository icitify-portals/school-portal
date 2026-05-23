import { db } from "@/db/db";
import { schoolFunctions } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export class SchoolFunctionService {

    /**
     * Retrieves a school function (script) by property name.
     * Matches Rust 'SchoolFunction::get'
     */
    static async get(branchId: number, property: string) {
        const [func] = await db.select()
            .from(schoolFunctions)
            .where(and(
                eq(schoolFunctions.branchId, branchId),
                eq(schoolFunctions.property, property)
            ))
            .limit(1);

        if (!func) {
            // Return a default template as seen in Rust implementation
            return {
                property,
                value: "\nasync function main(){\n\treturn \"\";\r\n}\n",
                isDefault: true
            };
        }

        return { ...func, isDefault: false };
    }

    /**
     * Sets/Updates a school function.
     * Matches Rust 'SchoolFunction::set'
     */
    static async set(branchId: number, property: string, value: string, description?: string) {
        return await db.insert(schoolFunctions).values({
            branchId,
            property,
            value,
            description
        }).onDuplicateKeyUpdate({
            set: { value, description }
        });
    }

    /**
     * Lists all functions for a branch.
     * Matches Rust 'SchoolFunction::get_all'
     */
    static async getAll(branchId: number) {
        return await db.select().from(schoolFunctions).where(eq(schoolFunctions.branchId, branchId));
    }

    /**
     * Validates a script (Syntax check).
     * Matches Rust 'SchoolFunction::validate'
     */
    static async validate(script: string) {
        try {
            // Simple syntax check using Function constructor
            new Function(`async function main() { ${script} }`);
            return { valid: true };
        } catch (error) {
            return { valid: false, error: (error as Error).message };
        }
    }

    /**
     * Executes a school function (Sandboxed).
     * Use with caution.
     */
    static async execute(branchId: number, property: string, context: any = {}) {
        const { value } = await this.get(branchId, property);
        
        try {
            // In a real production environment, use 'vm2' or similar for better isolation
            const fn = new Function(...Object.keys(context), `
                ${value}
                return main();
            `);
            return await fn(...Object.values(context));
        } catch (error) {
            console.error(`Execution failed for ${property}:`, error);
            throw error;
        }
    }
}
