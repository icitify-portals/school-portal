import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitizes rich text content to match the OJS 'allowed_html' setting.
 * Allows common formatting and link tags, stripping scripts, styles, events, etc.
 */
export function sanitizeHtmlClean(html: string): string {
    if (!html) return "";
    return DOMPurify.sanitize(html, {
        ALLOWED_TAGS: [
            'a', 'em', 'strong', 'cite', 'code', 'ul', 'ol', 'li', 'dl', 'dt', 'dd', 
            'b', 'i', 'u', 'img', 'sup', 'sub', 'br', 'p'
        ],
        ALLOWED_ATTR: ['href', 'target', 'title', 'src', 'alt', 'class']
    });
}

/**
 * Sanitizes submission titles to match the OJS 'allowed_title_html' setting.
 * Allows ONLY basic scientific formatting tags: b, i, u, sup, sub.
 */
export function sanitizeTitleHtml(html: string): string {
    if (!html) return "";
    return DOMPurify.sanitize(html, {
        ALLOWED_TAGS: ['b', 'i', 'u', 'sup', 'sub'],
        ALLOWED_ATTR: []
    });
}
