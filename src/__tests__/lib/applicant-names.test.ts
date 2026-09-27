import { describe, it, expect } from "vitest";
import { extractNameParts, buildFullName, findFormValue } from "@/lib/applicant-names";

/**
 * Regression tests for the admission template label mismatch.
 *
 * Production templates key their data JSON by the human field label, and the
 * labels are inconsistent: templates 17/18 use "FirstName" (no space) together
 * with "Last Name" (with a space) and "Email" (capitalised). Code that read
 * formData.firstName / formData.surname / formData.email therefore resolved to
 * undefined, which wrote NULL first_name/last_name onto student rows and
 * silently skipped the acceptance email.
 *
 * These assert the alias-aware helpers used by finalizeStudentAdmission resolve
 * the real production payloads.
 */

describe("extractNameParts with production template labels", () => {
    it("resolves the app 253 payload (FirstName / Middle Name / Last Name)", () => {
        const data = {
            "FirstName": "MARIAM",
            "Middle Name": "ABIDEMI",
            "Last Name": "AFOLABI",
            Email: "afolabiaduni244@gmail.com",
        };
        expect(extractNameParts(data)).toEqual({
            firstName: "MARIAM",
            middleName: "ABIDEMI",
            lastName: "AFOLABI",
        });
    });

    it("resolves the app 99 payload", () => {
        const data = {
            "FirstName": "Adeola",
            "Middle Name": "Nafisat",
            "Last Name": "Adeleke",
        };
        expect(extractNameParts(data)).toEqual({
            firstName: "Adeola",
            middleName: "Nafisat",
            lastName: "Adeleke",
        });
    });

    it("does not mix up the first/last boundary when only one label uses a space", () => {
        const parts = extractNameParts({ "FirstName": "Oluwadamilare", "Last Name": "Adewale" });
        expect(parts.firstName).toBe("Oluwadamilare");
        expect(parts.lastName).toBe("Adewale");
    });

    it("accepts Surname as a last-name alias", () => {
        expect(extractNameParts({ firstName: "Ada", surname: "Lovelace" }).lastName).toBe("Lovelace");
    });

    it("is case-insensitive on the label", () => {
        expect(extractNameParts({ firstname: "Ada", LASTNAME: "Lovelace" })).toEqual({
            firstName: "Ada",
            middleName: "",
            lastName: "Lovelace",
        });
    });

    it("trims and collapses whitespace, e.g. ' PRECIOUS '", () => {
        expect(extractNameParts({ "First Name": "  PRECIOUS  ", "Last  Name": " OBI " })).toEqual({
            firstName: "PRECIOUS",
            middleName: "",
            lastName: "OBI",
        });
    });

    it("returns empty strings for a payload with no name labels", () => {
        expect(extractNameParts({ Email: "a@b.com" })).toEqual({ firstName: "", middleName: "", lastName: "" });
    });

    it("returns empty strings for null/empty form data", () => {
        expect(extractNameParts(null as any)).toEqual({ firstName: "", middleName: "", lastName: "" });
        expect(extractNameParts({})).toEqual({ firstName: "", middleName: "", lastName: "" });
    });

    it("ignores non-string values without throwing", () => {
        expect(extractNameParts({ "First Name": null, "Last Name": undefined }).firstName).toBe("");
    });
});

describe("buildFullName", () => {
    it("builds SURNAME First Middle per portal convention", () => {
        expect(buildFullName({ firstName: "MARIAM", middleName: "ABIDEMI", lastName: "AFOLABI" })).toBe(
            "AFOLABI MARIAM ABIDEMI"
        );
    });

    it("omits a missing middle name without leaving a double space", () => {
        const name = buildFullName(extractNameParts({ "FirstName": "Oluwadamilare", "Last Name": "Adewale" }));
        expect(name).toBe("Adewale Oluwadamilare");
        expect(name).not.toMatch(/\s{2}/);
    });

    it("never returns the literal 'undefined'", () => {
        expect(buildFullName(extractNameParts({}))).toBe("");
    });
});

describe("findFormValue for the Email label", () => {
    const EMAIL_ALIASES = ["email", "e-mail", "e mail", "email address", "e-mail address"];

    it("resolves the capitalised 'Email' label used by production templates", () => {
        const data = { Email: "adelekeadeola042@gmail.com", "Next of Kin email": "x@y.com" };
        expect(findFormValue(data, EMAIL_ALIASES)).toBe("adelekeadeola042@gmail.com");
    });

    it("prefers the applicant's own email over the next-of-kin email", () => {
        const data = { "Email of Sponsor": "sponsor@x.com", Email: "applicant@x.com" };
        expect(findFormValue(data, EMAIL_ALIASES)).toBe("applicant@x.com");
    });

    it("resolves lowercase 'email' for other templates", () => {
        expect(findFormValue({ email: "a@b.com" }, EMAIL_ALIASES)).toBe("a@b.com");
    });

    it("returns '' when the form has no email field, so the caller can fall back", () => {
        expect(findFormValue({ "First Name": "Ada" }, EMAIL_ALIASES)).toBe("");
    });
});
