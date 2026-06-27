import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitizes rich HTML content for public-facing CMS pages, news articles,
 * and LMS content. Allows a broad set of safe formatting tags while
 * stripping scripts, event handlers, and dangerous attributes.
 *
 * Use this for: CMS page content, news article bodies, assignment
 * descriptions, and teacher feedback rendered via dangerouslySetInnerHTML.
 */
export function sanitizeRichContent(html: string): string {
    if (!html) return "";
    return DOMPurify.sanitize(html, {
        ALLOWED_TAGS: [
            // Block elements
            'p', 'div', 'section', 'article', 'blockquote', 'pre',
            'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
            // Lists
            'ul', 'ol', 'li', 'dl', 'dt', 'dd',
            // Tables
            'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption',
            // Inline
            'a', 'em', 'strong', 'b', 'i', 'u', 's', 'del', 'ins',
            'code', 'kbd', 'samp', 'var', 'cite', 'abbr', 'mark',
            'sup', 'sub', 'br', 'hr', 'span',
            // Media
            'img', 'figure', 'figcaption',
        ],
        ALLOWED_ATTR: [
            'href', 'target', 'rel', 'title',
            'src', 'alt', 'width', 'height', 'loading',
            'class', 'id',
            'colspan', 'rowspan', 'scope',
            'lang', 'dir',
        ],
        // Force safe link targets and strip javascript: URIs
        FORCE_BODY: true,
        ALLOW_DATA_ATTR: false,
        FORBID_ATTR: ['style', 'onerror', 'onload', 'onclick', 'onmouseover'],
        FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'button'],
    });
}

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
