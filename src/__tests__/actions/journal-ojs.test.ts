import { describe, it, expect, vi, beforeEach } from "vitest";
import { sanitizeHtmlClean, sanitizeTitleHtml } from "@/lib/sanitizer";
import { createAltchaChallenge, verifyAltchaSolution } from "@/lib/altcha";
import { sendJournalEmail } from "@/actions/journal-emails";
import { CronService } from "@/services/CronService";
import { sendEmail } from "@/lib/mail";
import { db } from "@/db/db";
import config from "@/lib/config";

vi.mock("@/lib/mail", () => ({
    sendEmail: vi.fn().mockResolvedValue({ success: true })
}));

vi.mock("@/db/db", () => ({
    db: {
        select: vi.fn(),
        update: vi.fn(),
        transaction: vi.fn((cb) => cb(db)),
    }
}));

describe("OJS-Grade Journal Architecture Upgrades", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        config.altcha.enabled = false; // default disabled
    });

    describe("HTML Input Sanitization Engine", () => {
        it("should allow safe layout and styling HTML tags", () => {
            const input = "<p>This is a <strong>strong</strong> tag with a <a href='https://link.com'>link</a>.</p>";
            const output = sanitizeHtmlClean(input);
            expect(output).toContain("<p>");
            expect(output).toContain("<strong>strong</strong>");
            expect(output).toContain("<a href=\"https://link.com\">");
        });

        it("should strip malicious script and iframe injections", () => {
            const input = "<p>Safe text</p><script>alert('xss')</script><iframe src='danger'></iframe>";
            const output = sanitizeHtmlClean(input);
            expect(output).toBe("<p>Safe text</p>");
            expect(output).not.toContain("<script>");
            expect(output).not.toContain("<iframe>");
        });

        it("should restrict titles to only scientific formatting tags", () => {
            const input = "<p>Title</p> with <i>italics</i> and <sup>superscript</sup><script>alert(1)</script>";
            const output = sanitizeTitleHtml(input);
            // Strips p, retains italics and superscript
            expect(output).toBe("Title with <i>italics</i> and <sup>superscript</sup>");
        });
    });

    describe("ALTCHA Cryptographic Proof-of-Work spam validation", () => {
        it("should pass verification unconditionally when disabled", () => {
            config.altcha.enabled = false;
            const res = verifyAltchaSolution({
                challenge: "some-challenge",
                salt: "some-salt",
                number: 123,
                signature: "some-signature"
            });
            expect(res).toBe(true);
        });

        it("should verify successfully when challenge is generated and correctly solved", () => {
            config.altcha.enabled = true;
            config.altcha.hmacKey = "TestSecretKey";
            
            const challenge = createAltchaChallenge(100);
            
            // Solver: find the matching number in the background
            let solvedNumber = -1;
            const crypto = require("crypto");
            for (let i = 0; i <= 100; i++) {
                const testHash = crypto.createHash("sha256").update(challenge.salt + i).digest("hex");
                if (testHash === challenge.challenge) {
                    solvedNumber = i;
                    break;
                }
            }

            expect(solvedNumber).toBeGreaterThan(-1);

            const result = verifyAltchaSolution({
                challenge: challenge.challenge,
                salt: challenge.salt,
                number: solvedNumber,
                signature: challenge.signature
            });

            expect(result).toBe(true);
        });

        it("should fail verification with wrong solved numbers", () => {
            config.altcha.enabled = true;
            config.altcha.hmacKey = "TestSecretKey";
            const challenge = createAltchaChallenge(100);

            const result = verifyAltchaSolution({
                challenge: challenge.challenge,
                salt: challenge.salt,
                number: 999, // Wrong solution
                signature: challenge.signature
            });

            expect(result).toBe(false);
        });
    });

    describe("DMARC-Compliant Transactional Mail Engine", () => {
        it("should send direct email unmodified if domain matches", async () => {
            config.mail.from = "noreply@schoolportal.com";

            await sendJournalEmail({
                to: "reviewer@gmail.com",
                subject: "Review Assignment",
                html: "<p>Hello</p>",
                fromEmail: "editor@schoolportal.com",
                fromName: "Chief Editor"
            });

            expect(sendEmail).toHaveBeenCalledWith(
                "reviewer@gmail.com",
                "Review Assignment",
                "<p>Hello</p>",
                "Chief Editor <editor@schoolportal.com>"
            );
        });

        it("should swap From headers and append warnings if domain does not match", async () => {
            config.mail.from = "noreply@schoolportal.com";

            await sendJournalEmail({
                to: "reviewer@gmail.com",
                subject: "Review Assignment",
                html: "<p>Hello</p>",
                fromEmail: "external.editor@gmail.com",
                fromName: "Guest Editor"
            });

            expect(sendEmail).toHaveBeenCalledWith(
                "reviewer@gmail.com",
                "Review Assignment",
                expect.stringContaining("DMARC Delivery Routing:"),
                "Guest Editor via Portal <noreply@schoolportal.com>"
            );
        });
    });

    describe("Background Expiry Cron", () => {
        it("should expire review invitations older than 3 days", async () => {
            const mockPendingReview = {
                id: 10,
                articleId: 5,
                invitationStatus: "pending",
                invitedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) // 4 days ago
            };

            const mockSelect = vi.fn().mockReturnValue({
                from: vi.fn(() => ({
                    where: vi.fn().mockResolvedValue([mockPendingReview])
                }))
            });
            db.select = mockSelect;

            const mockUpdateSet = vi.fn().mockReturnValue({
                where: vi.fn().mockResolvedValue({ success: true })
            });
            db.update = vi.fn().mockReturnValue({
                set: mockUpdateSet
            });

            const cronResult = await CronService.expireJournalReviewInvitations();
            
            expect(cronResult.success).toBe(true);
            expect(cronResult.expiredCount).toBe(1);
            expect(db.update).toHaveBeenCalled();
            expect(mockUpdateSet).toHaveBeenCalledWith({ invitationStatus: "expired" });
        });
    });
});
