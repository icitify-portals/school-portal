import { db } from "@/db/db";
import { journalArticles, journals, journalIssues, journalArticleAuthors, journalArticleFiles } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const doi = searchParams.get("doi");
        
        if (doi) {
            const articlesList = await db.select()
                .from(journalArticles)
                .where(eq(journalArticles.doi, doi))
                .limit(1);
                
            if (articlesList.length === 0) {
                return NextResponse.json({ error: "Article not found by DOI" }, { status: 404 });
            }
            
            const article = articlesList[0];
            const [journal] = await db.select().from(journals).where(eq(journals.id, article.journalId)).limit(1);
            const issue = article.issueId ? (await db.select().from(journalIssues).where(eq(journalIssues.id, article.issueId)).limit(1))[0] : null;
            const authors = await db.select().from(journalArticleAuthors).where(eq(journalArticleAuthors.articleId, article.id));
            const files = await db.select().from(journalArticleFiles).where(eq(journalArticleFiles.articleId, article.id));
            
            return NextResponse.json({ ...article, journal, issue, authors, files });
        }
        
        // Fetch published articles with limit
        const publishedArticles = await db.select()
            .from(journalArticles)
            .where(eq(journalArticles.status, "published"))
            .limit(100);
        
        if (publishedArticles.length === 0) {
            return NextResponse.json([]);
        }
        
        // Batch-fetch journals, issues, and authors (3 queries instead of 3*N)
        const journalIds = [...new Set(publishedArticles.map(a => a.journalId).filter(Boolean) as number[])];
        const issueIds = [...new Set(publishedArticles.map(a => a.issueId).filter(Boolean) as number[])];
        const articleIds = publishedArticles.map(a => a.id);
        
        const [allJournals, allIssues, allAuthors] = await Promise.all([
            journalIds.length > 0 
                ? db.select().from(journals).where(inArray(journals.id, journalIds))
                : Promise.resolve([]),
            issueIds.length > 0
                ? db.select().from(journalIssues).where(inArray(journalIssues.id, issueIds))
                : Promise.resolve([]),
            articleIds.length > 0
                ? db.select().from(journalArticleAuthors).where(inArray(journalArticleAuthors.articleId, articleIds))
                : Promise.resolve([]),
        ]);
        
        // Build lookup maps
        const journalMap = new Map(allJournals.map(j => [j.id, j]));
        const issueMap = new Map(allIssues.map(i => [i.id, i]));
        const authorsByArticle = new Map<number, typeof allAuthors>();
        for (const author of allAuthors) {
            const aid = (author as any).articleId;
            if (!authorsByArticle.has(aid)) authorsByArticle.set(aid, []);
            authorsByArticle.get(aid)!.push(author);
        }
        
        // Enrich articles
        const enriched = publishedArticles.map(article => ({
            ...article,
            journal: journalMap.get(article.journalId!) || null,
            issue: article.issueId ? issueMap.get(article.issueId) || null : null,
            authors: authorsByArticle.get(article.id) || [],
        }));
        
        return NextResponse.json(enriched);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        console.error("Failed to fetch articles API:", error);
        return NextResponse.json({ error: "Failed to fetch articles", details: message }, { status: 500 });
    }
}
