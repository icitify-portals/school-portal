"use server";

import { db } from "@/db/db";
import { 
    users, 
    cmsHomePageSections, 
    cmsSectionMedia, 
    students, 
    staffProfiles,
    academicSessions,
    cmsPages
} from "@/db/schema";
import { eq, and } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

export async function seedDemoData() {
    try {
        const hashedPassword = await bcrypt.hash("Password123!", 10);

        // 1. Seed Demo Accounts
        const demoAccounts = [
            { name: "Super Admin", email: "superadmin@demo.edu", role: "superadmin" },
            { name: "Portal Admin", email: "admin@demo.edu", role: "admin" },
            { name: "Bursar (Finance)", email: "bursar@demo.edu", role: "admin" }, // Role can be admin with specific permissions
            { name: "Registrar", email: "registrar@demo.edu", role: "admin" },
            { name: "Dr. Alan Turing", email: "staff@demo.edu", role: "staff" },
            { name: "John Student", email: "student@demo.edu", role: "student" },
            { name: "Health Officer", email: "healthadmin@demo.edu", role: "healthadmin" },
            { name: "Deputy VC", email: "dvc@demo.edu", role: "dvc" },
        ];

        for (const account of demoAccounts) {
            await db.insert(users).values({
                name: account.name,
                email: account.email,
                password: hashedPassword,
                role: account.role as any,
                status: "active",
            }).onDuplicateKeyUpdate({
                set: { status: "active", role: account.role as any }
            });

            // Handle profiles for student/staff
            const user = (await db.select().from(users).where(eq(users.email, account.email)).limit(1))[0];
            if (account.role === 'student') {
                await db.insert(students).values({
                    userId: user.id,
                    matricNumber: "MAT/" + Math.floor(Math.random() * 10000),
                    firstName: account.name.split(' ')[0],
                    lastName: account.name.split(' ')[1] || "Demo",
                    status: "active"
                }).onDuplicateKeyUpdate({ set: { status: "active" } });
            } else if (account.role === 'staff') {
                await db.insert(staffProfiles).values({
                    userId: user.id,
                    staffId: "STF/" + Math.floor(Math.random() * 10000),
                    jobTitle: "Senior Lecturer",
                    isActive: true
                }).onDuplicateKeyUpdate({ set: { isActive: true } });
            }
        }

        // 2. Clear existing homepage sections (to avoid duplicates)
        await db.delete(cmsSectionMedia);
        await db.delete(cmsHomePageSections);

        // 3. Seed Homepage Hero
        const [heroSection] = await db.insert(cmsHomePageSections).values({
            type: "hero",
            title: "Empowering Excellence in Education",
            subtitle: "Experience a seamless management system for students, staff, and administration.",
            content: JSON.stringify({
                badge: "Welcome to Our Institutional Portal",
                ctaText: "Discover More",
                ctaLink: "/register",
                imageUrl: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=1200"
            }),
            order: 1,
            isActive: true
        });

        // 4. Seed Homepage Slider
        const [sliderSection] = await db.insert(cmsHomePageSections).values({
            type: "slider",
            title: "Life at our Campus",
            subtitle: "Glance through our world-class facilities and vibrant campus community.",
            order: 2,
            isActive: true
        });

        const sliderMedia = [
            {
                url: "https://images.unsplash.com/photo-1541339907198-e08756ebafe3?auto=format&fit=crop&q=80&w=1920",
                caption: "Iconic Main Campus",
                order: 1
            },
            {
                url: "https://images.unsplash.com/photo-1568667256549-094345857637?auto=format&fit=crop&q=80&w=1920",
                caption: "State-of-the-Art Library",
                order: 2
            },
            {
                url: "https://images.unsplash.com/photo-1523050853064-8521a3e3515f?auto=format&fit=crop&q=80&w=1920",
                caption: "Dynamic Student Life",
                order: 3
            }
        ];

        for (const media of sliderMedia) {
            await db.insert(cmsSectionMedia).values({
                sectionId: sliderSection.insertId,
                url: media.url,
                caption: media.caption,
                mediaType: "image",
                order: media.order
            });
        }

        // 5. Seed News Section
        await db.insert(cmsHomePageSections).values({
            type: "news",
            title: "Latest Institutional News",
            subtitle: "Stay updated with the recent events and announcements.",
            order: 3,
            isActive: true
        });

        // 6. Seed "Portal Usage Instructions" CMS page
        const [existingPage] = await db.select()
            .from(cmsPages)
            .where(and(eq(cmsPages.slug, "portal-usage"), eq(cmsPages.locale, "en")))
            .limit(1);

        if (!existingPage) {
            const pageData = {
                title: "Portal Usage Instructions",
                slug: "portal-usage",
                content: `<h2>Portal Navigation & Usage Guide</h2>
<p>Welcome to the official <strong>FSS Portal</strong>! This comprehensive guide provides step-by-step instructions on how to navigate and utilize the various modules available to students, staff, and administrators.</p>

<hr />

<h3>1. For Students</h3>
<ul>
  <li><strong>Course Registration:</strong> Navigate to the academics section to register for your semester courses. Ensure you complete registration before the deadline.</li>
  <li><strong>Result Checker:</strong> View your academic report cards, GPA computations, and transcript details dynamically.</li>
  <li><strong>Campus Events & Club Memberships:</strong> Register for upcoming campus events, purchase tickets, join student clubs, and view student bulletins.</li>
  <li><strong>Security Passes:</strong> Register your vehicle under the security portal to download your digital QR Code gate pass for vehicle checks at the gates.</li>
</ul>

<h3>2. For Staff Members</h3>
<ul>
  <li><strong>HR Profile & Leaves:</strong> Access your profile details, check your leave balances, and submit leave requests directly to HR.</li>
  <li><strong>Maintenance Requests:</strong> Encountered a fault? Submit works requests (electrical, plumbing, HVAC, carpentry, etc.) and check repair progress.</li>
  <li><strong>Gate & Checkpoint Operations:</strong> Log vehicle gate movements and patrol checkpoints by scanning secure QR codes.</li>
</ul>

<h3>3. For Administrators & Managers</h3>
<ul>
  <li><strong>Branding Settings:</strong> Customise the portal name, logo, theme colors, and specify a custom homepage.</li>
  <li><strong>CMS Page Builder:</strong> Author pages, configure menus, upload files, and translate content.</li>
  <li><strong>Role-Based Access (RBAC):</strong> Assign and revoke staff roles (e.g., CMS Manager, Bursar, Registrar, CSO) to delegate module responsibilities.</li>
</ul>

<hr />

<blockquote>
  <p><strong>Note:</strong> Keep your login credentials secure. Log out of public computers after use. For support, contact the IT Admin desk.</p>
</blockquote>`,
                metaTitle: "Portal Usage Instructions & Documentation",
                metaDescription: "Learn how to use the FSS Portal, register courses, request maintenance, and check results.",
                status: "published" as const,
                isSystemPage: false,
                locale: "en",
                createdAt: new Date(),
                updatedAt: new Date()
            };
            await db.insert(cmsPages).values(pageData);
        }

        revalidatePath("/");
        return { success: true, message: "Demo content, default pages and accounts seeded successfully!" };

    } catch (error: any) {
        console.error("Seeding Error:", error);
        return { success: false, error: error.message || "Failed to seed demo data" };
    }
}
