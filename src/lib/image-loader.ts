/**
 * Custom Unsplash Image Loader
 * Bypasses Next.js built-in hostname validation by handling URL generation manually.
 */
export default function unsplashLoader({ src, width, quality }: { src: string, width: number, quality?: number }) {
    // Check if it's an Unsplash URL
    if (src.includes('images.unsplash.com')) {
        try {
            const url = new URL(src);
            // Set optimization parameters
            url.searchParams.set('w', width.toString());
            url.searchParams.set('q', (quality || 75).toString());
            url.searchParams.set('auto', 'format');
            url.searchParams.set('fit', 'crop');
            return url.toString();
        } catch (e) {
            // Fallback if URL parsing fails
            return src;
        }
    }
    
    // Return original src if not an Unsplash URL (e.g. local assets)
    return src;
}
