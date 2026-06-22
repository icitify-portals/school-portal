import { db } from "@/db/db";
import { journalArticles, journals, journalIssues, journalArticleAuthors } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import config from "@/lib/config";

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

/**
 * Enterprise OJS-compliant OAI-PMH Harvesting Endpoint.
 * Supports all 6 required verbs, Dublin Core formats, set Spec, and Resumption Tokens.
 */
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const verb = searchParams.get("verb") || "Identify";
        const metadataPrefix = searchParams.get("metadataPrefix") || "oai_dc";
        const set = searchParams.get("set"); // e.g. journal:slug
        const identifier = searchParams.get("identifier"); // e.g. oai:fss-portal.edu.ng:article/12
        const resumptionToken = searchParams.get("resumptionToken");

        const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://schoolportal.edu";
        const repositoryId = config.ojs.repositoryId || "ojs2.localhost";
        const responseDate = new Date().toISOString();
        
        let xmlContent = "";
        let errorContent = "";

        // Standard OAI-PMH Error checks
        const validVerbs = ["Identify", "ListMetadataFormats", "ListSets", "ListIdentifiers", "GetRecord", "ListRecords"];
        if (!validVerbs.includes(verb)) {
            errorContent = `<error code="badVerb">Illegal OAI verb: '${escapeXml(verb)}'</error>`;
        } else if (verb !== "Identify" && verb !== "ListSets" && verb !== "ListMetadataFormats" && !resumptionToken && metadataPrefix !== "oai_dc") {
            errorContent = `<error code="cannotDisseminateFormat">Metadata prefix '${escapeXml(metadataPrefix)}' is not supported.</error>`;
        }

        if (errorContent) {
            return new Response(`<?xml version="1.0" encoding="UTF-8"?>
<OAI-PMH xmlns="http://www.openarchives.org/OAI/2.0/" 
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://www.openarchives.org/OAI/2.0/ http://www.openarchives.org/OAI/2.0/OAI-PMH.xsd">
  <responseDate>${responseDate}</responseDate>
  <request>${siteUrl}/api/journal/oai</request>
  ${errorContent}
</OAI-PMH>`, {
                headers: { "Content-Type": "application/xml; charset=utf-8" }
            });
        }

        // 1. Verb: Identify
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
    <description>
      <oai-identifier xmlns="http://www.openarchives.org/OAI/2.0/oai-identifier"
                      xsi:schemaLocation="http://www.openarchives.org/OAI/2.0/oai-identifier http://www.openarchives.org/OAI/2.0/oai-identifier.xsd">
        <scheme>oai</scheme>
        <repositoryIdentifier>${repositoryId}</repositoryIdentifier>
        <delimiter>:</delimiter>
        <sampleIdentifier>oai:${repositoryId}:article/1</sampleIdentifier>
      </oai-identifier>
    </description>
  </Identify>`;
        } 
        // 2. Verb: ListMetadataFormats
        else if (verb === "ListMetadataFormats") {
            xmlContent = `
  <ListMetadataFormats>
    <metadataFormat>
      <metadataPrefix>oai_dc</metadataPrefix>
      <schema>http://www.openarchives.org/OAI/2.0/oai_dc.xsd</schema>
      <metadataNamespace>http://www.openarchives.org/OAI/2.0/oai_dc/</metadataNamespace>
    </metadataFormat>
  </ListMetadataFormats>`;
        }
        // 3. Verb: ListSets (Lists all active journals as sets)
        else if (verb === "ListSets") {
            const allJournals = await db.select().from(journals).where(eq(journals.isActive, true));
            const setsXml = allJournals.map(j => `
    <set>
      <setSpec>journal:${j.slug}</setSpec>
      <setName>${escapeXml(j.name)}</setName>
      <setDescription>
        <oai_dc:dc xmlns:oai_dc="http://www.openarchives.org/OAI/2.0/oai_dc/" 
                   xmlns:dc="http://purl.org/dc/elements/1.1/">
          <dc:description>${escapeXml(j.description || "")}</dc:description>
        </oai_dc:dc>
      </setDescription>
    </set>`).join("\n");
            
            xmlContent = `
  <ListSets>
    ${setsXml}
  </ListSets>`;
        }
        // 4. Verb: GetRecord
        else if (verb === "GetRecord") {
            if (!identifier) {
                return new Response(`<?xml version="1.0" encoding="UTF-8"?>
<OAI-PMH xmlns="http://www.openarchives.org/OAI/2.0/">
  <responseDate>${responseDate}</responseDate>
  <request verb="GetRecord">${siteUrl}/api/journal/oai</request>
  <error code="badArgument">Identifier is a required parameter for GetRecord.</error>
</OAI-PMH>`, { headers: { "Content-Type": "application/xml" } });
            }

            const prefix = `oai:${repositoryId}:article/`;
            if (!identifier.startsWith(prefix)) {
                return new Response(`<?xml version="1.0" encoding="UTF-8"?>
<OAI-PMH xmlns="http://www.openarchives.org/OAI/2.0/">
  <responseDate>${responseDate}</responseDate>
  <request verb="GetRecord">${siteUrl}/api/journal/oai</request>
  <error code="idDoesNotExist">Invalid identifier scheme: '${escapeXml(identifier)}'</error>
</OAI-PMH>`, { headers: { "Content-Type": "application/xml" } });
            }

            const articleId = parseInt(identifier.replace(prefix, ""));
            const [art] = await db.select().from(journalArticles).where(and(eq(journalArticles.id, articleId), eq(journalArticles.status, "published"))).limit(1);

            if (!art) {
                return new Response(`<?xml version="1.0" encoding="UTF-8"?>
<OAI-PMH xmlns="http://www.openarchives.org/OAI/2.0/">
  <responseDate>${responseDate}</responseDate>
  <request verb="GetRecord" identifier="${escapeXml(identifier)}">${siteUrl}/api/journal/oai</request>
  <error code="idDoesNotExist">Record with identifier '${escapeXml(identifier)}' does not exist.</error>
</OAI-PMH>`, { headers: { "Content-Type": "application/xml" } });
            }

            const [journal] = await db.select().from(journals).where(eq(journals.id, art.journalId)).limit(1);
            const authors = await db.select().from(journalArticleAuthors).where(eq(journalArticleAuthors.articleId, art.id));
            const itemUrl = `${siteUrl}/journal/${journal?.slug || "main"}/article/${art.id}`;
            const pubDate = art.publishedDate 
                ? new Date(art.publishedDate).toISOString().split('T')[0]
                : new Date(art.createdAt).toISOString().split('T')[0];
            
            const creators = authors.map(a => `<dc:creator>${escapeXml(a.name)}</dc:creator>`).join("\n        ");
            const keywords = art.keywords ? art.keywords.split(",").map(k => `<dc:subject>${escapeXml(k.trim())}</dc:subject>`).join("\n        ") : "";

            xmlContent = `
  <GetRecord>
    <record>
      <header>
        <identifier>${escapeXml(identifier)}</identifier>
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
    </record>
  </GetRecord>`;
        }
        // 5 & 6. Verbs: ListIdentifiers & ListRecords
        else if (verb === "ListIdentifiers" || verb === "ListRecords") {
            const pageSize = config.ojs.maxRecords || 100;
            let offset = 0;

            if (resumptionToken) {
                // Parse simple offset resumption token: e.g. "offset:100"
                const parts = resumptionToken.split(":");
                if (parts[0] === "offset") {
                    offset = parseInt(parts[1]) || 0;
                }
            }

            // Retrieve all published articles
            let articles = await db.select().from(journalArticles).where(eq(journalArticles.status, "published"));

            // Filter by journal set if specified
            if (set && set.startsWith("journal:")) {
                const journalSlug = set.split(":")[1];
                const [targetJournal] = await db.select().from(journals).where(eq(journals.slug, journalSlug)).limit(1);
                if (targetJournal) {
                    articles = articles.filter(a => a.journalId === targetJournal.id);
                } else {
                    articles = [];
                }
            }

            const totalCount = articles.length;
            const pagedArticles = articles.slice(offset, offset + pageSize);

            if (pagedArticles.length === 0) {
                return new Response(`<?xml version="1.0" encoding="UTF-8"?>
<OAI-PMH xmlns="http://www.openarchives.org/OAI/2.0/">
  <responseDate>${responseDate}</responseDate>
  <request verb="${verb}">${siteUrl}/api/journal/oai</request>
  <error code="noRecordsMatch">No matching records found for the query parameters.</error>
</OAI-PMH>`, { headers: { "Content-Type": "application/xml" } });
            }

            const itemsXml = await Promise.all(pagedArticles.map(async (art) => {
                const [journal] = await db.select().from(journals).where(eq(journals.id, art.journalId)).limit(1);
                const authors = await db.select().from(journalArticleAuthors).where(eq(journalArticleAuthors.articleId, art.id));
                const itemUrl = `${siteUrl}/journal/${journal?.slug || "main"}/article/${art.id}`;
                const pubDate = art.publishedDate 
                    ? new Date(art.publishedDate).toISOString().split('T')[0]
                    : new Date(art.createdAt).toISOString().split('T')[0];
                
                const recordIdentifier = `oai:${repositoryId}:article/${art.id}`;

                if (verb === "ListIdentifiers") {
                    return `
    <header>
      <identifier>${escapeXml(recordIdentifier)}</identifier>
      <datestamp>${pubDate}T00:00:00Z</datestamp>
      <setSpec>journal:${journal?.slug || "general"}</setSpec>
    </header>`;
                } else {
                    const creators = authors.map(a => `<dc:creator>${escapeXml(a.name)}</dc:creator>`).join("\n        ");
                    const keywords = art.keywords ? art.keywords.split(",").map(k => `<dc:subject>${escapeXml(k.trim())}</dc:subject>`).join("\n        ") : "";

                    return `
    <record>
      <header>
        <identifier>${escapeXml(recordIdentifier)}</identifier>
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
                }
            }));

            const nextOffset = offset + pageSize;
            const tokenXml = nextOffset < totalCount 
                ? `<resumptionToken completeListSize="${totalCount}" cursor="${offset}">offset:${nextOffset}</resumptionToken>` 
                : "";

            xmlContent = `
  <${verb}>
    ${itemsXml.join("\n")}
    ${tokenXml}
  </${verb}>`;
        }

        const fullXml = `<?xml version="1.0" encoding="UTF-8"?>
<OAI-PMH xmlns="http://www.openarchives.org/OAI/2.0/" 
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://www.openarchives.org/OAI/2.0/ http://www.openarchives.org/OAI/2.0/OAI-PMH.xsd">
  <responseDate>${responseDate}</responseDate>
  <request verb="${verb}" ${verb === "ListRecords" || verb === "ListIdentifiers" ? `metadataPrefix="${metadataPrefix}"` : ""}>${siteUrl}/api/journal/oai</request>${xmlContent}
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
