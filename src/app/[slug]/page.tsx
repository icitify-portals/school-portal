import { getPageBySlug } from "@/actions/cms";
import { notFound } from "next/navigation";
import { sanitizeRichContent } from "@/lib/sanitizer";
import { Metadata } from "next";
import { cookies } from "next/headers";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    const cookieStore = await cookies();
    const locale = cookieStore.get('portal-language')?.value || 'en';
    const res = await getPageBySlug(slug, locale);
    if (!res.success || !res.data) return { title: "Page Not Found" };

    const page = res.data;
    const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://schoolportal.edu";
    const fullUrl = `${siteUrl}/${slug}`;

    return {
        title: page.metaTitle || page.title,
        description: page.metaDescription ?? undefined,
        keywords: page.keywords ?? undefined,
        alternates: {
            canonical: page.canonicalUrl || fullUrl,
        },
        openGraph: {
            title: page.metaTitle || page.title,
            description: page.metaDescription ?? undefined,
            url: fullUrl,
            images: page.ogImage ? [{ url: page.ogImage }] : undefined,
            type: 'website',
        },
        twitter: {
            card: 'summary_large_image',
            title: page.metaTitle || page.title,
            description: page.metaDescription ?? undefined,
            images: page.ogImage ? [page.ogImage] : undefined,
        }
    };
}

export default async function CMSPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const cookieStore = await cookies();
    const locale = cookieStore.get('portal-language')?.value || 'en';
    const res = await getPageBySlug(slug, locale);

    if (!res.success || !res.data) {
        return notFound();
    }

    const page = res.data;
    const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://schoolportal.edu";
    const fullUrl = `${siteUrl}/${slug}`;

    // Automatic Schema Generation
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": page.title,
        "description": page.metaDescription,
        "url": fullUrl,
        "breadcrumb": {
            "@type": "BreadcrumbList",
            "itemListElement": [
                { "@type": "ListItem", "position": 1, "name": "Home", "item": siteUrl },
                { "@type": "ListItem", "position": 2, "name": page.title, "item": fullUrl }
            ]
        }
    };

    return (
        <div className="min-h-screen bg-white">
            {/* SEO Structured Data */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            {page.structuredData && (() => {
                    try {
                        // SECURITY FIX H-2b: Re-parse and re-serialize structuredData to
                        // prevent raw HTML/script injection via the ld+json script tag.
                        const parsedData = JSON.parse(page.structuredData);
                        return (
                            <script
                                type="application/ld+json"
                                dangerouslySetInnerHTML={{ __html: JSON.stringify(parsedData) }}
                            />
                        );
                    } catch { return null; }
                })()
            }
            
            {/* Header / Hero for the page */}
            <div className="bg-slate-900 pt-32 pb-20 text-center px-4 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 via-slate-900 to-slate-950 z-0" />
                <div className="max-w-4xl mx-auto relative z-10 space-y-4">
                    <h1 className="text-4xl md:text-6xl font-black text-white uppercase italic tracking-tighter">
                        {page.title}
                    </h1>
                    <div className="h-1 w-20 bg-indigo-500 mx-auto rounded-full" />
                </div>
            </div>

            {/* Main Content */}
            <main className="max-w-4xl mx-auto px-4 py-16 sm:py-24">
                <article
                    className="prose prose-slate prose-lg lg:prose-xl max-w-none prose-headings:font-black prose-headings:uppercase prose-headings:italic prose-a:text-indigo-600 prose-img:rounded-2xl prose-img:shadow-xl"
                    dangerouslySetInnerHTML={{ __html: sanitizeRichContent(page.content || "") }}
                />
            </main>
        </div>
    );
}
