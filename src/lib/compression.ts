import sharp from "sharp";

/**
 * Intelligent compression options
 */
export interface CompressionOptions {
    quality?: number; // 0-100
    maxWidth?: number;
    maxHeight?: number;
    format?: 'webp' | 'avif' | 'jpeg' | 'png';
    keepMetadata?: boolean;
}

/**
 * Intelligent Animation/Image Compression Algorithm
 * Automatically balances quality vs size while maintaining sharpness.
 */
export async function compressImage(
    buffer: Buffer,
    options: CompressionOptions = {}
): Promise<{ buffer: Buffer; info: sharp.OutputInfo }> {
    const {
        quality = 80, // Industry sweet spot for sharpness/size
        maxWidth = 1920,
        maxHeight = 1080,
        format = 'webp', // WebP offers superior compression for web
        keepMetadata = false
    } = options;

    let pipeline = sharp(buffer);

    // 1. Get image metadata for intelligent scaling
    const metadata = await pipeline.metadata();

    // 2. Intelligent Resizing (maintain aspect ratio, only shrink)
    if ((metadata.width && metadata.width > maxWidth) || (metadata.height && metadata.height > maxHeight)) {
        pipeline = pipeline.resize({
            width: maxWidth,
            height: maxHeight,
            fit: 'inside',
            withoutEnlargement: true,
            // Use Lanczos3 for superior sharpness during downscaling
            kernel: sharp.kernel.lanczos3
        });
    }

    // 3. Metadata Handling
    if (keepMetadata) {
        pipeline = pipeline.withMetadata();
    }

    // 4. State-of-the-Art Format Selection & Quality Balancing
    switch (format) {
        case 'webp':
            pipeline = pipeline.webp({
                quality,
                effort: 6, // Max CPU effort for best compression
                smartSubsample: true
            });
            break;
        case 'avif':
            pipeline = pipeline.avif({
                quality: Math.max(quality - 10, 50), // AVIF is more efficient at lower quality scores
                effort: 4
            });
            break;
        case 'png':
            pipeline = pipeline.png({ palette: true, compressionLevel: 9 });
            break;
        default:
            pipeline = pipeline.jpeg({ quality, mozjpeg: true });
    }

    const { data, info } = await pipeline.toBuffer({ resolveWithObject: true });

    return { buffer: data, info };
}

/**
 * Utility to process chat attachments
 */
export async function processChatAttachment(fileBuffer: Buffer, filename: string) {
    const ext = filename.split('.').pop()?.toLowerCase();

    // Only compress common image formats
    if (['jpg', 'jpeg', 'png', 'webp', 'avif'].includes(ext || '')) {
        return await compressImage(fileBuffer, {
            format: 'webp',
            quality: 82, // Higher quality for chat to ensure text readability in images
            maxWidth: 1600
        });
    }

    // Return original if not an image or unsupported
    return { buffer: fileBuffer, info: null };
}
