import { db } from "@/db/db";
import { journalArticles, journals, journalIssues, journalArticleAuthors, journalArticleFiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const doi = searchParams.get("doi");
        
        if (doi) {
            const articlesList = await db.select()
                .from(journalArticles)
                .where(eq(journalArticles.doi, doi));
                
            if (articlesList.length === 0) {
                return NextResponse.json({ error: "Article not found by DOI" }, { status: 404 });
            }
            
            // Enrich this single article
            const article = articlesList[0];
            const [journal] = await db.select().from(journals).where(eq(journals.id, article.journalId)).limit(1);
            const issue = article.issueId ? (await db.select().from(journalIssues).where(eq(journalIssues.id, article.issueId)).limit(1))[0] : null;
            const authors = await db.select().from(journalArticleAuthors).where(eq(journalArticleAuthors.articleId, article.id));
            const files = await db.select().from(journalArticleFiles).where(eq(journalArticleFiles.articleId, article.id));
            
            return NextResponse.json({
                ...article,
                journal,
                issue,
                authors,
                files
            });
        }
        
        // Otherwise return all published articles
        const publishedArticles = await db.select()
            .from(journalArticles)
            .where(eq(journalArticles.status, "published"));
            
        // Batch enrich with journals, issues and authors
        const enriched = await Promise.all(publishedArticles.map(async (article) => {
            const [journal] = await db.select().from(journals).where(eq(journals.id, article.journalId)).limit(1);
            const issue = article.issueId ? (await db.select().from(journalIssues).where(eq(journalIssues.id, article.issueId)).limit(1))[0] : null;
            const authors = await db.select().from(journalArticleAuthors).where(eq(journalArticleAuthors.articleId, article.id));
            return {
                ...article,
                journal,
                issue,
                authors
            };
        }));
        
        return NextResponse.json(enriched);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        console.error("Failed to fetch articles API:", error);
        return NextResponse.json({ error: "Failed to fetch articles", details: message }, { status: 500 });
    }
}
