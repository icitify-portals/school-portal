// Rewrites raw Wasabi/S3 object URLs to the app's credential-backed proxy so
// images render even though the account blocks anonymous reads.
export function viewableAssetUrl(url?: string | null): string | undefined {
    if (!url || typeof url !== "string" || !url.startsWith("http")) {
        return url || undefined;
    }
    if (url.includes("wasabisys.com") || url.includes("amazonaws.com")) {
        return `/api/assets/wasabi?url=${encodeURIComponent(url)}`;
    }
    return url;
}