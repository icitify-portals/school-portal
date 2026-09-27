import { describe, it, expect } from "vitest";
import { resolveJambNumber } from "@/lib/jamb";

describe("resolveJambNumber", () => {
    it("prefers the dedicated jambRegNumber column", () => {
        const r = resolveJambNumber("202660003248HI", { "JAMB Score": "147" });
        expect(r.raw).toBe("202660003248HI");
        expect(r.persistable).toBe("202660003248HI");
        expect(r.plausible).toBe(true);
    });

    it("trims surrounding whitespace from the column value", () => {
        const r = resolveJambNumber("  202331672293CAP  ", {});
        expect(r.persistable).toBe("202331672293CAP");
    });

    // Regression: the form carries both a score and a registration number, and
    // "JAMB Score" sorts first. The old code took it and produced "0", which
    // collided with the unique index on students.jamb_number.
    it("does not mistake JAMB Score for the registration number", () => {
        const formData = {
            "JAMB Score": "0",
            "JAMB Registration Number": "202331672293CAP",
        };
        const r = resolveJambNumber(null, formData);
        expect(r.raw).toBe("202331672293CAP");
        expect(r.persistable).toBe("202331672293CAP");
    });

    it("works regardless of key order", () => {
        const a = resolveJambNumber(null, {
            "JAMB Score": "145",
            "JAMB Registration Number": "202661787619AB",
        });
        const b = resolveJambNumber(null, {
            "JAMB Registration Number": "202661787619AB",
            "JAMB Score": "145",
        });
        expect(a.persistable).toBe("202661787619AB");
        expect(b.persistable).toBe("202661787619AB");
    });

    it.each([
        ["0"],
        ["00000000"],
        [""],
        ["   "],
        ["N/A"],
        ["none"],
        ["null"],
        ["undefined"],
    ])("returns null for placeholder value %j instead of persisting it", (value) => {
        const r = resolveJambNumber(null, { "JAMB Registration Number": value });
        expect(r.persistable).toBeNull();
        expect(r.plausible).toBe(false);
    });

    it("rejects a placeholder supplied via the column", () => {
        expect(resolveJambNumber("0", {}).persistable).toBeNull();
    });

    it("skips date, result and centre style jamb fields", () => {
        const r = resolveJambNumber(null, {
            "JAMB Date": "2026-03-01",
            "JAMB Result": "A",
            "JAMB Centre": "Ibadan",
            "JAMB Reg No": "202612345678AB",
        });
        expect(r.persistable).toBe("202612345678AB");
    });

    it("returns null when no jamb information exists at all", () => {
        const r = resolveJambNumber(null, { surname: "Adekunle", firstName: "Ada" });
        expect(r.raw).toBe("");
        expect(r.persistable).toBeNull();
    });

    it("tolerates null/undefined form data", () => {
        expect(resolveJambNumber(null, null).persistable).toBeNull();
        expect(resolveJambNumber(undefined, undefined).persistable).toBeNull();
    });

    it("coerces a numeric jamb value to its string form", () => {
        const r = resolveJambNumber(null, { "JAMB Registration Number": 202612345678 });
        expect(r.persistable).toBe("202612345678");
    });

    it("rejects values that are too long or contain punctuation", () => {
        expect(resolveJambNumber("2026-0012-3456-78", {}).persistable).toBeNull();
        expect(resolveJambNumber("A".repeat(25), {}).persistable).toBeNull();
    });
});
