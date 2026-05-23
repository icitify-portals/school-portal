import { getArticleById } from "@/actions/journal";
import { NextResponse } from "next/server";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const articleId = parseInt(id);
        
        if (isNaN(articleId)) {
            return NextResponse.json({ error: "Invalid article ID format" }, { status: 400 });
        }
        
        const article = await getArticleById(articleId);
        
        if (!article) {
            return NextResponse.json({ error: "Article not found" }, { status: 404 });
        }
        
        return NextResponse.json(article);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        console.error("Failed to fetch article by ID:", error);
        return NextResponse.json({ error: "Failed to fetch article", details: message }, { status: 500 });
    }
}
