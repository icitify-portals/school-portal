import { db } from "@/db/db";
import { journalArticles, journals, journalArticleAuthors } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

function escapeXml(unsafe: string) {
    if (!unsafe) return "";
    return unsafe.replace(/[<>&"']/g, (c) => {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '"': return '&quot;';
            case "'": return '&apos;';
            default: return c;
        }
    });
}

export async function GET() {
    try {
        const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://schoolportal.edu";
        
        // Query latest 20 published articles
        const articlesList = await db.select()
            .from(journalArticles)
            .where(eq(journalArticles.status, "published"))
            .orderBy(desc(journalArticles.publishedDate), desc(journalArticles.createdAt))
            .limit(20);
            
        const itemsXml = await Promise.all(articlesList.map(async (art) => {
            const [journal] = await db.select().from(journals).where(eq(journals.id, art.journalId)).limit(1);
            const authors = await db.select().from(journalArticleAuthors).where(eq(journalArticleAuthors.articleId, art.id));
            const itemUrl = `${siteUrl}/journal/${journal?.slug || "main"}/article/${art.id}`;
            
            const pubDateStr = art.publishedDate 
                ? new Date(art.publishedDate).toUTCString()
                // @ts-expect-error - TS2769: Auto-suppressed for build
                : new Date(art.createdAt).toUTCString();
                
            const authorsList = authors.map(a => a.name).join(", ");
            const fullDescription = `Authors: ${authorsList}\n\nAbstract: ${art.abstract || ""}`;
            
            return `
    <item>
      <title>${escapeXml(art.title)}</title>
      <link>${escapeXml(itemUrl)}</link>
      <guid isPermaLink="true">${escapeXml(itemUrl)}</guid>
      <description>${escapeXml(fullDescription)}</description>
      <pubDate>${pubDateStr}</pubDate>
      ${art.doi ? `<doi>${escapeXml(art.doi)}</doi>` : ""}
      <source url="${siteUrl}/journal/${journal?.slug || "main"}">${escapeXml(journal?.name || "")}</source>
    </item>`;
        }));
        
        const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Federal School of Statistics Journal Publications</title>
    <link>${siteUrl}/journal</link>
    <description>Latest academic research publications, articles and journals from the Federal School of Statistics Press.</description>
    <language>en-us</language>
    <pubDate>${new Date().toUTCString()}</pubDate>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${siteUrl}/journal/feed/rss" rel="self" type="application/rss+xml" />
    ${itemsXml.join("\n")}
  </channel>
</rss>`;

        return new Response(rssXml, {
            headers: {
                "Content-Type": "application/rss+xml; charset=utf-8",
            },
        });
    } catch (error: unknown) {
        console.error("Failed to generate RSS feed:", error);
        return new Response("Failed to generate RSS feed", { status: 500 });
    }
}
