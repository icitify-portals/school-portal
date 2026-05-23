import { generateArticleDoi, registerArticleDoiWithCrossref, getArticleById } from "@/actions/journal";
import { NextResponse } from "next/server";

export async function POST(
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
        
        // 1. Generate the DOI if it doesn't exist
        let doi = article.doi;
        if (!doi) {
            const genRes = await generateArticleDoi(articleId);
            if (!genRes.success || !genRes.doi) {
                return NextResponse.json({ error: "Failed to auto-generate DOI for article" }, { status: 500 });
            }
            doi = genRes.doi;
        }
        
        // 2. Validate DOI pattern (10.XXXX/prefix.suffix pattern)
        // Match standard Crossref pattern: prefix starts with '10.', followed by 4 or more digits, then a slash and suffix
        const doiRegex = /^10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+$/;
        if (!doiRegex.test(doi)) {
            return NextResponse.json({ 
                error: `Invalid DOI format: '${doi}'. Must match '10.XXXX/prefix.suffix' pattern.` 
            }, { status: 400 });
        }
        
        // 3. Deposit to Crossref
        const depositRes = await registerArticleDoiWithCrossref(articleId);
        
        if (depositRes.success) {
            return NextResponse.json({
                success: true,
                message: "DOI successfully minted and deposited to Crossref",
                doi: doi,
                status: "registered"
            });
        } else {
            return NextResponse.json({
                success: false,
                error: depositRes.error || "Crossref deposit failed",
                doi: doi,
                status: "failed"
            }, { status: 502 }); // Bad Gateway representing integration failure
        }
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        console.error("Mint DOI Endpoint Failed:", error);
        return NextResponse.json({ error: "Failed to mint DOI", details: message }, { status: 500 });
    }
}

