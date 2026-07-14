import React from "react";

interface JsonLdProps {
  data: any;
}

export const JsonLd = ({ data }: JsonLdProps) => {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
};

// Helper to generate ScholarlyArticle schema
export const generateScholarlyArticleSchema = (article: any) => ({
  "@context": "https://schema.org",
  "@type": "ScholarlyArticle",
  "headline": article.title,
  "description": article.abstract,
  "author": article.authors?.map((a: any) => ({
    "@type": "Person",
    "name": a.name,
    "affiliation": a.affiliation,
  })),
  "datePublished": article.publishedDate || article.createdAt,
  "publisher": {
    "@type": "Organization",
    "name": article.journal?.name || "FSSPortal Journals",
    "logo": {
      "@type": "ImageObject",
      "url": article.journal?.logoUrl || "https://schoolportal.com/logo.png"
    }
  },
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": `https://schoolportal.com/journal/${article.journal?.slug}/article/${article.id}`
  },
  "identifier": article.doi,
});

// Helper for Book schema
export const generateBookSchema = (book: any) => ({
  "@context": "https://schema.org",
  "@type": "Book",
  "name": book.title,
  "author": book.authors?.split(',').map((a: string) => ({
    "@type": "Person",
    "name": a.trim(),
  })),
  "isbn": book.isbn,
  "description": book.description,
  "publisher": {
    "@type": "Organization",
    "name": "FSSPortal Library"
  }
});

// Helper for Course schema
export const generateCourseSchema = (course: any) => ({
  "@context": "https://schema.org",
  "@type": "Course",
  "name": course.name,
  "description": course.description,
  "provider": {
    "@type": "Organization",
    "name": "FSSPortal eLearning",
    "sameAs": "https://schoolportal.com"
  }
});

// Helper for FAQ schema (Voice Search)
export const generateFaqSchema = (faqs: { question: string, answer: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": faqs.map(faq => ({
    "@type": "Question",
    "name": faq.question,
    "acceptedAnswer": {
      "@type": "Answer",
      "text": faq.answer
    }
  }))
});
