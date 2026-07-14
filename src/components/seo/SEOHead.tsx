import React from "react";

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonical?: string;
  ogImage?: string;
  ogType?: "website" | "article" | "book" | "course";
  twitterHandle?: string;
  // Scholarly Meta Tags (Highwire Press)
  citationTitle?: string;
  citationAuthors?: string[];
  citationJournalTitle?: string;
  citationPublicationDate?: string;
  citationVolume?: number;
  citationIssue?: number;
  citationDoi?: string;
  citationPdfUrl?: string;
  // Dublin Core
  dcTitle?: string;
  dcCreator?: string;
  dcDescription?: string;
  dcDate?: string;
}

export const SEOHead = ({
  title,
  description,
  keywords,
  canonical,
  ogImage,
  ogType = "website",
  twitterHandle = "@schoolportal",
  citationTitle,
  citationAuthors,
  citationJournalTitle,
  citationPublicationDate,
  citationVolume,
  citationIssue,
  citationDoi,
  citationPdfUrl,
  dcTitle,
  dcCreator,
  dcDescription,
  dcDate,
}: SEOProps) => {
  const siteName = "FSSPortal";
  const fullTitle = title ? `${title} | ${siteName}` : siteName;

  return (
    <>
      <title>{fullTitle}</title>
      {description && <meta name="description" content={description} />}
      {keywords && <meta name="keywords" content={keywords} />}
      {canonical && <link rel="canonical" href={canonical} />}

      {/* Open Graph */}
      <meta property="og:site_name" content={siteName} />
      <meta property="og:title" content={fullTitle} />
      {description && <meta property="og:description" content={description} />}
      {ogImage && <meta property="og:image" content={ogImage} />}
      <meta property="og:type" content={ogType} />
      {canonical && <meta property="og:url" content={canonical} />}

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      {description && <meta name="twitter:description" content={description} />}
      {ogImage && <meta name="twitter:image" content={ogImage} />}
      <meta name="twitter:site" content={twitterHandle} />

      {/* Highwire Press (Google Scholar) */}
      {citationTitle && <meta name="citation_title" content={citationTitle} />}
      {citationAuthors?.map((author, index) => (
        <meta key={index} name="citation_author" content={author} />
      ))}
      {citationJournalTitle && <meta name="citation_journal_title" content={citationJournalTitle} />}
      {citationPublicationDate && <meta name="citation_publication_date" content={citationPublicationDate} />}
      {citationVolume && <meta name="citation_volume" content={citationVolume.toString()} />}
      {citationIssue && <meta name="citation_issue" content={citationIssue.toString()} />}
      {citationDoi && <meta name="citation_doi" content={citationDoi} />}
      {citationPdfUrl && <meta name="citation_pdf_url" content={citationPdfUrl} />}

      {/* Dublin Core */}
      {dcTitle && <meta name="DC.title" content={dcTitle} />}
      {dcCreator && <meta name="DC.creator" content={dcCreator} />}
      {dcDescription && <meta name="DC.description" content={dcDescription} />}
      {dcDate && <meta name="DC.date" content={dcDate} />}
    </>
  );
};
