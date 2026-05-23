import { NextResponse } from "next/server";
import { db } from "@/db/db";
import { issuedBadges, badgeTemplates, students, users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    const badgeId = parseInt(id);
    if (isNaN(badgeId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    const results = await db.select({
        issuedBadge: issuedBadges,
        template: badgeTemplates,
        studentName: users.name,
        studentEmail: users.email
    })
        .from(issuedBadges)
        .innerJoin(badgeTemplates, eq(issuedBadges.badgeId, badgeTemplates.id))
        .innerJoin(students, eq(issuedBadges.studentId, students.id))
        .innerJoin(users, eq(students.userId, users.id))
        .where(eq(issuedBadges.id, badgeId))
        .limit(1);

    if (results.length === 0) return NextResponse.json({ error: "Badge not found" }, { status: 404 });

    const data = results[0];
    const baseUrl = process.env.NEXTAUTH_URL || "https://portal.example.com";

    // Open Badges v2.0 Assertion
    const assertion = {
        "@context": "https://w3id.org/openbadges/v2",
        "type": "Assertion",
        "id": `${baseUrl}/api/verify/badge/${id}`,
        "recipient": {
            "type": "email",
            "hashed": false,
            "identity": data.studentEmail
        },
        "issuedOn": data.issuedBadge.issuedAt?.toISOString(),
        "badge": {
            "id": `${baseUrl}/api/badges/template/${data.template.id}`,
            "type": "BadgeClass",
            "name": data.template.name,
            "description": data.template.description,
            "image": data.template.imageUrl || `${baseUrl}/default-badge.png`,
            "criteria": {
                "narrative": data.template.criteria || "Awarded for exceptional performance and mastery of the course curriculum."
            },
            "issuer": {
                "id": data.template.issuerUrl || baseUrl,
                "type": "Issuer",
                "name": data.template.issuerName || "Academic Portal",
                "url": data.template.issuerUrl || baseUrl,
                "email": "credentials@example.com"
            }
        },
        "verification": {
            "type": "HostedVerification"
        },
        "evidence": data.issuedBadge.evidenceUrl || undefined
    };

    return NextResponse.json(assertion);
}
