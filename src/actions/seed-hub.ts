"use server";

import { upsertNews, upsertEvent } from "@/actions/cms-publishing";
import { db } from "@/db/db";
import { users } from "@/db/schema";

export async function seedInstitutionalHub() {
    try {
        const user = await db.query.users.findFirst();
        if (!user) return { success: false, error: "No user found" };

        // Seed News
        await upsertNews({
            title: "University Achieves Global Top 5 Ranking in Research Excellence",
            slug: "global-top-5-ranking",
            category: "Research",
            teaser: "Our institution has been recognized globally for its groundbreaking work in sustainable technology and medical innovation, securing a position in the elite top 5 of the World University Rankings.",
            content: "<h2>A Milestone for Academic Excellence</h2><p>Today marks a historic day for our community. The latest World Academic Rankings have placed us among the top 5 institutions worldwide for research output and citations.</p><p>This achievement is a testament to the tireless dedication of our faculty members and the brilliant minds of our student researchers.</p>",
            featuredImage: "https://images.unsplash.com/photo-1523050335392-9bc56753d100?auto=format&fit=crop&q=80&w=1200",
            status: "published",
            authorId: user.id
        });

        await upsertNews({
            title: "New AI-Driven Library System Launched for All Students",
            slug: "ai-library-launch",
            category: "Academic",
            teaser: "Experience the next generation of academic discovery. Our new digital library uses advanced AI to help you find resources and summarize key papers in seconds.",
            content: "<h2>Transforming How We Learn</h2><p>The University Library is proud to announce the integration of a state-of-the-art AI retrieval system. Students can now access over 50 million journals with intelligent search capabilities.</p>",
            featuredImage: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&q=80&w=1200",
            status: "published",
            authorId: user.id
        });

        // Seed Events
        await upsertEvent({
            title: "Annual Global Research Symposium 2026",
            slug: "research-symposium-2026",
            description: "Join international scholars for a 3-day conference on the future of energy, health, and society. Keynote speakers from Oxford, MIT, and Stanford.",
            location: "Main Convocation Square",
            startDate: new Date("2026-05-15T09:00:00"),
            endDate: new Date("2026-05-17T18:00:00"),
            isVirtual: false,
            featuredImage: "https://images.unsplash.com/photo-1540575861501-7ad0582373f2?auto=format&fit=crop&q=80&w=1200",
            status: "published",
            authorId: user.id
        });

        await upsertEvent({
            title: "Virtual Town Hall with the Vice Chancellor",
            slug: "town-hall-vc",
            description: "An open session for students to ask questions about the new academic calendar, tuition grants, and campus improvements.",
            location: "https://zoom.us/j/institutional-hub",
            startDate: new Date("2026-04-20T14:00:00"),
            endDate: new Date("2026-04-20T16:00:00"),
            isVirtual: true,
            featuredImage: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=1200",
            status: "published",
            authorId: user.id
        });

        return { success: true };
    } catch (error) {
        console.error("Hub Seed Error:", error);
        return { success: false, error: "Hub seeding failed" };
    }
}
