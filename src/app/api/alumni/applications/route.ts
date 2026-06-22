import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db/db";
import { graduateDocumentApplications } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = parseInt(session.user.id!);

  try {
    const list = await db.query.graduateDocumentApplications.findMany({
      where: eq(graduateDocumentApplications.userId, userId),
      with: {
        form: {
          with: {
            documentType: true
          }
        },
        graduateProfile: {
          with: {
            programme: true
          }
        }
      },
      orderBy: desc(graduateDocumentApplications.createdAt)
    });

    return NextResponse.json(list);
  } catch (error: any) {
    console.error("API error fetching applications:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
