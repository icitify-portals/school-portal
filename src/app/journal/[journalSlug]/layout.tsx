import { Metadata } from "next";
import { getJournalBySlug, getIssuesByJournalId } from "@/actions/journal";

type Props = {
  params: Promise<{ journalSlug: string }>;
  children: React.ReactNode;
};

export async function generateMetadata(
  { params }: Props
): Promise<Metadata> {
  const { journalSlug } = await params;
  const journal = await getJournalBySlug(journalSlug);
  
  if (!journal) {
    return {
      title: "Journal Not Found",
    };
  }

  const issues = await getIssuesByJournalId(journal.id);
  const currentIssue = issues.find(i => i.isPublished);

  // Base metadata
  const metadata: Metadata = {
    title: journal.name,
    description: journal.description ?? undefined,
    openGraph: {
      title: journal.name,
      description: journal.description ?? undefined,
      type: "website",
      images: journal.logoUrl ? [journal.logoUrl] : [],
    },
    // Custom scholarly tags for Google Scholar / Highwire Press
    other: {
      "citation_journal_title": journal.name,
      "citation_issn": journal.issn || "",
    }
  };

  if (currentIssue) {
    // If we're on the main page, maybe we want general journal tags
    // But usually these are more relevant for specific article pages.
    // For now, let's keep the core journal info.
  }

  return metadata;
}

export default function JournalLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
