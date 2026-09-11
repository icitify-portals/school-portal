import { NextRequest, NextResponse } from "next/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// The Wasabi account disables anonymous (public) reads entirely, so raw object
// URLs always return 403. This route streams stored objects with the app's
// credentials so images render on forms, review pages, slips and prints.
export async function GET(req: NextRequest) {
    const rawUrl = req.nextUrl.searchParams.get("url");
    if (!rawUrl || !rawUrl.startsWith("http")) {
        return new NextResponse("Bad Request", { status: 400 });
    }

    const bucket = process.env.WASABI_BUCKET_NAME || "fssbucket";
    const region = process.env.WASABI_REGION || "eu-west-1";
    const endpoint = process.env.WASABI_ENDPOINT || `https://s3.${region}.wasabisys.com`;

    // Only proxy objects that live in our own bucket endpoint.
    const marker = `/${bucket}/`;
    const idx = rawUrl.indexOf(marker);
    if (idx === -1) {
        return new NextResponse("Forbidden", { status: 403 });
    }
    const key = decodeURIComponent(rawUrl.slice(idx + marker.length).split("?")[0]);
    if (!key || key.includes("..")) {
        return new NextResponse("Forbidden", { status: 403 });
    }

    const client = new S3Client({
        region,
        endpoint,
        credentials: {
            accessKeyId: process.env.WASABI_ACCESS_KEY_ID || "",
            secretAccessKey: process.env.WASABI_SECRET_ACCESS_KEY || process.env.WASABI_SECRET || "",
        },
        forcePathStyle: true,
    });

    try {
        const obj = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
        const bytes = await obj.Body?.transformToByteArray?.();
        if (!bytes) {
            return new NextResponse("Not Found", { status: 404 });
        }
        return new NextResponse(Buffer.from(bytes), {
            status: 200,
            headers: {
                "Content-Type": obj.ContentType || "application/octet-stream",
                "Cache-Control": "public, max-age=3600, immutable",
            },
        });
    } catch (err: any) {
        console.error("[wasabi-proxy] fetch failed:", key, err?.name, err?.message);
        return new NextResponse("Not Found", { status: 404 });
    }
}