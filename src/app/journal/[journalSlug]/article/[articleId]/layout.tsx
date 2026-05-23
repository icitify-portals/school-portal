import { Metadata } from "next";
import { db } from "@/db";
import { journalArticles, journals, journalIssues, journalArticleAuthors } from "@/db/schema";
import { eq } from "drizzle-orm";

type Props = {
  params: { journalSlug: string; articleId: string };
};

export async function generateMetadata(
  { params }: Props
): Promise<Metadata> {
  const articleId = parseInt(params.articleId);
  const [article] = await db.select().from(journalArticles).where(eq(journalArticles.id, articleId)).limit(1);
  if (!article) {
    return { title: "Article Not Found" };
  }

  const [journal] = await db.select().from(journals).where(eq(journals.id, article.journalId)).limit(1);
  const issue = article.issueId ? (await db.select().from(journalIssues).where(eq(journalIssues.id, article.issueId)).limit(1))[0] : null;
  const authors = await db.select().from(journalArticleAuthors).where(eq(journalArticleAuthors.articleId, articleId));

  // Robust Meta Tags for Google Scholar / Highwire Press
  return {
    title: article.title,
    description: article.abstract ?? undefined,
    other: {
      "citation_title": article.title,
      "citation_journal_title": journal?.name || "",
      "citation_issn": journal?.issn || "",
      "citation_author": authors.map(a => a.name),
      "citation_publication_date": article.publishedDate ? article.publishedDate.toISOString().split('T')[0] : "",
      "citation_volume": issue?.volume?.toString() || "",
      "citation_issue": issue?.number?.toString() || "",
      "citation_doi": article.doi || "",
      "citation_abstract_html_url": `${process.env.NEXT_PUBLIC_APP_URL}/journal/${params.journalSlug}/article/${params.articleId}`,
      "citation_language": "en",
    },
  };
}

export default function ArticleLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
