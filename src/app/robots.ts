import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://schoolportal.edu';

    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: [
                '/admin/',
                '/api/',
                '/student/',
                '/staff/',
                '/_next/',
                '/static/',
            ],
        },
        sitemap: `${siteUrl}/sitemap.xml`,
    };
}
