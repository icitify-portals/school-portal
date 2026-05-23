import { db } from "@/db/db";
import { journalArticles, journals, journalIssues, journalArticleAuthors } from "@/db/schema";
import { eq } from "drizzle-orm";
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

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const verb = searchParams.get("verb") || "Identify";
        const metadataPrefix = searchParams.get("metadataPrefix") || "oai_dc";
        const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://schoolportal.edu";
        
        const responseDate = new Date().toISOString();
        
        let xmlContent = "";
        
        if (verb === "Identify") {
            xmlContent = `
  <Identify>
    <repositoryName>Federal School of Statistics Journal Repository</repositoryName>
    <baseURL>${siteUrl}/api/journal/oai</baseURL>
    <protocolVersion>2.0</protocolVersion>
    <adminEmail>press@fss-portal.edu.ng</adminEmail>
    <earliestDatestamp>2020-01-01T00:00:00Z</earliestDatestamp>
    <deletedRecord>no</deletedRecord>
    <granularity>YYYY-MM-DDThh:mm:ssZ</granularity>
  </Identify>`;
        } else if (verb === "ListRecords") {
            if (metadataPrefix !== "oai_dc") {
                return new Response(`<?xml version="1.0" encoding="UTF-8"?>
<OAI-PMH xmlns="http://www.openarchives.org/OAI/2.0/" 
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://www.openarchives.org/OAI/2.0/ http://www.openarchives.org/OAI/2.0/OAI-PMH.xsd">
  <responseDate>${responseDate}</responseDate>
  <request verb="ListRecords" metadataPrefix="${metadataPrefix}">${siteUrl}/api/journal/oai</request>
  <error code="cannotDisseminateFormat">Metadata format '${metadataPrefix}' is not supported.</error>
</OAI-PMH>`, {
                    headers: { "Content-Type": "application/xml" }
                });
            }
            
            // Query all published articles
            const articles = await db.select().from(journalArticles).where(eq(journalArticles.status, "published"));
            
            const recordsXml = await Promise.all(articles.map(async (art) => {
                const [journal] = await db.select().from(journals).where(eq(journals.id, art.journalId)).limit(1);
                const authors = await db.select().from(journalArticleAuthors).where(eq(journalArticleAuthors.articleId, art.id));
                const itemUrl = `${siteUrl}/journal/${journal?.slug || "main"}/article/${art.id}`;
                const pubDate = art.publishedDate 
                    ? new Date(art.publishedDate).toISOString().split('T')[0]
                    : new Date(art.createdAt).toISOString().split('T')[0];
                
                const creators = authors.map(a => `<dc:creator>${escapeXml(a.name)}</dc:creator>`).join("\n        ");
                const keywords = art.keywords ? art.keywords.split(",").map(k => `<dc:subject>${escapeXml(k.trim())}</dc:subject>`).join("\n        ") : "";
                
                return `
    <record>
      <header>
        <identifier>oai:fss-portal.edu.ng:article/${art.id}</identifier>
        <datestamp>${pubDate}T00:00:00Z</datestamp>
        <setSpec>journal:${journal?.slug || "general"}</setSpec>
      </header>
      <metadata>
        <oai_dc:dc xmlns:oai_dc="http://www.openarchives.org/OAI/2.0/oai_dc/" 
                   xmlns:dc="http://purl.org/dc/elements/1.1/" 
                   xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
                   xsi:schemaLocation="http://www.openarchives.org/OAI/2.0/oai_dc/ http://www.openarchives.org/OAI/2.0/oai_dc.xsd">
          <dc:title>${escapeXml(art.title)}</dc:title>
          ${creators}
          ${keywords}
          <dc:description>${escapeXml(art.abstract || "")}</dc:description>
          <dc:publisher>Federal School of Statistics Press</dc:publisher>
          <dc:date>${pubDate}</dc:date>
          <dc:type>Text</dc:type>
          <dc:type>Journal Article</dc:type>
          <dc:format>application/pdf</dc:format>
          <dc:identifier>${escapeXml(itemUrl)}</dc:identifier>
          ${art.doi ? `<dc:identifier>info:doi/${escapeXml(art.doi)}</dc:identifier>` : ""}
          <dc:language>en</dc:language>
          <dc:rights>info:eu-repo/semantics/openAccess</dc:rights>
          <dc:rights>${escapeXml(journal?.license || "CC BY 4.0")}</dc:rights>
        </oai_dc:dc>
      </metadata>
    </record>`;
            }));
            
            xmlContent = `
  <ListRecords>
    ${recordsXml.join("\n")}
  </ListRecords>`;
        } else {
            // Error code for unsupported verb
            return new Response(`<?xml version="1.0" encoding="UTF-8"?>
<OAI-PMH xmlns="http://www.openarchives.org/OAI/2.0/" 
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://www.openarchives.org/OAI/2.0/ http://www.openarchives.org/OAI/2.0/OAI-PMH.xsd">
  <responseDate>${responseDate}</responseDate>
  <request>${siteUrl}/api/journal/oai</request>
  <error code="badVerb">Illegal OAI verb: '${verb}'</error>
</OAI-PMH>`, {
                headers: { "Content-Type": "application/xml" }
            });
        }
        
        const fullXml = `<?xml version="1.0" encoding="UTF-8"?>
<OAI-PMH xmlns="http://www.openarchives.org/OAI/2.0/" 
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://www.openarchives.org/OAI/2.0/ http://www.openarchives.org/OAI/2.0/OAI-PMH.xsd">
  <responseDate>${responseDate}</responseDate>
  <request verb="${verb}" ${verb === "ListRecords" ? `metadataPrefix="${metadataPrefix}"` : ""}>${siteUrl}/api/journal/oai</request>${xmlContent}
</OAI-PMH>`;

        return new Response(fullXml, {
            headers: {
                "Content-Type": "application/xml; charset=utf-8",
            },
        });
    } catch (error: any) {
        console.error("OAI-PMH harvester failed:", error);
        return new Response(`<?xml version="1.0" encoding="UTF-8"?>
<OAI-PMH xmlns="http://www.openarchives.org/OAI/2.0/">
  <responseDate>${new Date().toISOString()}</responseDate>
  <request>https://schoolportal.edu/api/journal/oai</request>
  <error code="badArgument">Internal server error processing harvester endpoint</error>
</OAI-PMH>`, {
            headers: { "Content-Type": "application/xml" },
            status: 500
        });
    }
}
