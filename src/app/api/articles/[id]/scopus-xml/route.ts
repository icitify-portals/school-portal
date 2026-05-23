import { getArticleById } from "@/actions/journal";
import { NextResponse } from "next/server";

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

        // Validate completeness for Scopus readiness
        const missingFields = [];
        if (!article.doi) missingFields.push("DOI (Digital Object Identifier)");
        if (!article.title) missingFields.push("Article Title");
        if (!article.abstract) missingFields.push("Abstract");
        if (article.authors.length === 0) missingFields.push("Author list");
        if (!article.journal?.name) missingFields.push("Journal Title");
        if (!article.issue?.volume) missingFields.push("Volume Number");
        if (!article.issue?.number) missingFields.push("Issue Number");
        if (!article.startingPage) missingFields.push("Starting Page");
        if (!article.endingPage) missingFields.push("Ending Page");
        
        const isReady = missingFields.length === 0;

        // Check query param for validation only
        const { searchParams } = new URL(req.url);
        const validateOnly = searchParams.get("validate") === "true";
        if (validateOnly) {
            return NextResponse.json({
                isReady,
                missingFields,
                message: isReady ? "Article is fully Scopus-ready!" : "Article has missing metadata for Scopus."
            });
        }

        const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://schoolportal.edu";
        const articleUrl = `${siteUrl}/journal/${article.journal?.slug || "main"}/article/${article.id}`;
        const publisher = "Federal School of Statistics Press";
        const pubDate = article.publishedDate 
            ? new Date(article.publishedDate).toISOString().split('T')[0]
            : new Date(article.createdAt).toISOString().split('T')[0];

        const authorsXml = article.authors.map(a => `<dc:creator>${escapeXml(a.name)}</dc:creator>`).join("\n  ");
        const citationAuthorsXml = article.authors.map(a => `<citation:author>${escapeXml(a.name)}</citation:author>`).join("\n  ");

        // Generate Scopus Dublin Core XML
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<dc_document xmlns:dc="http://purl.org/dc/elements/1.1/" 
             xmlns:prism="http://schemas.highwire.org/prism/" 
             xmlns:citation="http://www.elsevier.com/xml/ani/common/"
             scopus-ready="${isReady}">
  <prism:doi>${escapeXml(article.doi || "")}</prism:doi>
  <prism:url>${escapeXml(articleUrl)}</prism:url>
  <prism:publicationName>${escapeXml(article.journal?.name || "")}</prism:publicationName>
  <prism:volume>${article.issue?.volume || 1}</prism:volume>
  <prism:number>${article.issue?.number || 1}</prism:number>
  <prism:startingPage>${article.startingPage || ""}</prism:startingPage>
  <prism:endingPage>${article.endingPage || ""}</prism:endingPage>
  
  <dc:title>${escapeXml(article.title)}</dc:title>
  ${authorsXml}
  <dc:description>${escapeXml(article.abstract || "")}</dc:description>
  <dc:date>${pubDate}</dc:date>
  <dc:publisher>${escapeXml(publisher)}</dc:publisher>
  
  ${citationAuthorsXml}
  <citation:title>${escapeXml(article.title)}</citation:title>
  <citation:journal_title>${escapeXml(article.journal?.name || "")}</citation:journal_title>
</dc_document>`;

        return new Response(xml, {
            headers: {
                "Content-Type": "application/xml; charset=utf-8",
            },
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        console.error("Scopus XML Export Failed:", error);
        return NextResponse.json({ error: "Failed to generate Scopus XML", details: message }, { status: 500 });
    }
}
