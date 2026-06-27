"use server";

import { upsertNews, upsertEvent } from "@/actions/cms-publishing";
import { registerMedia } from "@/actions/cms-media";
import { db } from "@/db/db";
import { users } from "@/db/schema";

export async function seedInstitutionalHub() {
    try {
        const user = await db.query.users.findFirst();
        if (!user) return { success: false, error: "No user found" };

        const media1 = await registerMedia({ filename: "research.jpg", url: "https://images.unsplash.com/photo-1523050335392-9bc56753d100?auto=format&fit=crop&q=80&w=1200", mimeType: "image/jpeg" });

        await upsertNews({
            title: "University Achieves Global Top 5 Ranking in Research Excellence",
            slug: "global-top-5-ranking",
            teaser: "Our institution has been recognized globally for its groundbreaking work in sustainable technology and medical innovation, securing a position in the elite top 5 of the World University Rankings.",
            content: "<h2>A Milestone for Academic Excellence</h2><p>Today marks a historic day for our community. The latest World Academic Rankings have placed us among the top 5 institutions worldwide for research output and citations.</p><p>This achievement is a testament to the tireless dedication of our faculty members and the brilliant minds of our student researchers.</p>",
            featuredImageId: media1.id,
            status: "published",
            authorId: user.id
        });

        const media2 = await registerMedia({ filename: "library.jpg", url: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&q=80&w=1200", mimeType: "image/jpeg" });

        await upsertNews({
            title: "New AI-Driven Library System Launched for All Students",
            slug: "ai-library-launch",
            teaser: "Experience the next generation of academic discovery. Our new digital library uses advanced AI to help you find resources and summarize key papers in seconds.",
            content: "<h2>Transforming How We Learn</h2><p>The University Library is proud to announce the integration of a state-of-the-art AI retrieval system. Students can now access over 50 million journals with intelligent search capabilities.</p>",
            featuredImageId: media2.id,
            status: "published",
            authorId: user.id
        });

        const media3 = await registerMedia({ filename: "symposium.jpg", url: "https://images.unsplash.com/photo-1540575861501-7ad0582373f2?auto=format&fit=crop&q=80&w=1200", mimeType: "image/jpeg" });

        await upsertEvent({
            title: "Annual Global Research Symposium 2026",
            slug: "research-symposium-2026",
            description: "Join international scholars for a 3-day conference on the future of energy, health, and society. Keynote speakers from Oxford, MIT, and Stanford.",
            location: "Main Convocation Square",
            startDate: new Date("2026-05-15T09:00:00"),
            endDate: new Date("2026-05-17T18:00:00"),
            isVirtual: false,
            featuredImageId: media3.id,
            status: "published",
            authorId: user.id
        });

        const media4 = await registerMedia({ filename: "townhall.jpg", url: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&q=80&w=1200", mimeType: "image/jpeg" });

        await upsertEvent({
            title: "Virtual Town Hall with the Vice Chancellor",
            slug: "virtual-town-hall",
            description: "An open forum for all students to discuss campus improvements, academic policies, and future strategic plans directly with the Vice Chancellor.",
            location: "Virtual (Zoom)",
            startDate: new Date("2026-03-20T14:00:00"),
            endDate: new Date("2026-03-20T15:30:00"),
            isVirtual: true,
            eventLink: "https://zoom.us/j/123456789",
            featuredImageId: media4.id,
            status: "published",
            authorId: user.id
        });

        return { success: true };
    } catch (error) {
        console.error("Hub Seed Error:", error);
        return { success: false, error: "Hub seeding failed" };
    }
}
