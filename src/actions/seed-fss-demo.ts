"use server";

import { db } from "@/db/db";
import { 
    users, 
    cmsHomePageSections, 
    cmsSectionMedia, 
    students, 
    staffProfiles 
} from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

export async function seedFssDemoData() {
    try {
        const hashedPassword = await bcrypt.hash("Password123!", 10);

        // 1. Seed FSS Ibadan Demo Accounts
        const demoAccounts = [
            { name: "FSS Super Admin", email: "superadmin@fssibadan.edu.ng", role: "superadmin" },
            { name: "FSS Registrar Office", email: "admin@fssibadan.edu.ng", role: "admin" },
            { name: "FSS Finance Office", email: "bursar@fssibadan.edu.ng", role: "admin" },
            { name: "Dr. A. S. Phillips", email: "rector@fssibadan.edu.ng", role: "staff" },
            { name: "Oluwaseun Adebayo", email: "student@fssibadan.edu.ng", role: "student" },
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

            // Retrieve the inserted or updated user to get ID
            const user = (await db.select().from(users).where(eq(users.email, account.email)).limit(1))[0];
            
            if (account.role === 'student') {
                await db.insert(students).values({
                    userId: user.id,
                    matricNumber: "FSS/ND/" + Math.floor(1000 + Math.random() * 9000),
                    firstName: account.name.split(' ')[0],
                    lastName: account.name.split(' ')[1] || "Adebayo",
                    status: "active"
                }).onDuplicateKeyUpdate({ set: { status: "active" } });
            } else if (account.role === 'staff') {
                await db.insert(staffProfiles).values({
                    userId: user.id,
                    staffId: "FSS/STF/001",
                    jobTitle: "School Rector / Director of Studies",
                    isActive: true
                }).onDuplicateKeyUpdate({ set: { isActive: true } });
            }
        }

        // 2. Clear existing homepage sections to replace with premium FSS content
        await db.delete(cmsSectionMedia);
        await db.delete(cmsHomePageSections);

        // 3. Seed Homepage Hero (Premium, HSL, Glassmorphic feel)
        await db.insert(cmsHomePageSections).values({
            type: "hero",
            title: "FEDERAL SCHOOL OF STATISTICS, IBADAN",
            subtitle: "Nigeria's Premier Center of Excellence in Statistics, Computer Science, and Management Studies under the NBS. Established 1948.",
            content: JSON.stringify({
                badge: "Official Main Portal & LMS",
                ctaText: "Apply Online Now",
                ctaLink: "/register",
                imageUrl: "https://images.unsplash.com/photo-1541339907198-e08756ebafe3?auto=format&fit=crop&q=80&w=1200"
            }),
            order: 1,
            isActive: true
        });

        // 4. Seed About & History Section (Content Type)
        await db.insert(cmsHomePageSections).values({
            type: "content",
            title: "Over 75 Years of Statistical Leadership",
            subtitle: "Nurturing West Africa's analytical, demographic, and technological pioneers since 1948.",
            content: JSON.stringify({
                body: `
                <div class="space-y-6 text-slate-700 dark:text-slate-300 font-medium leading-relaxed text-base md:text-lg text-left mt-8 max-w-4xl mx-auto">
                    <p>
                        The <strong>Federal School of Statistics, Ibadan (FSS Ibadan)</strong> is Nigeria's premier monotechnic operating directly under the aegis of the <strong>National Bureau of Statistics (NBS)</strong>. Established in <strong>1948</strong>, the institution began as a specialized training hub to equip public officers with critical analytical skills to steer post-war census, planning, and demographic datasets.
                    </p>
                    <p>
                        Over the subsequent decades, the school achieved formal accreditation from the <strong>National Board for Technical Education (NBTE)</strong> and became a powerhouse of monotechnic education, integrating rigorous data instruction with advanced computational science, financial accounting, and business leadership.
                    </p>
                    <p>
                        Under the direct guidance of the <strong>Statistician-General of the Federation</strong>, FSS Ibadan continues to pioneer digital-first initiatives, ensuring graduates possess direct access to national databases, enterprise statistical suites, and excellent pathways to careers in federal ministries, fintech, and data engineering.
                    </p>
                </div>
                `
            }),
            order: 2,
            isActive: true
        });

        // 5. Seed School Anthem (Content Type)
        await db.insert(cmsHomePageSections).values({
            type: "content",
            title: "Our School Anthem",
            subtitle: "A majestic call to truth, precision, technological growth, and patriotic duty.",
            content: JSON.stringify({
                body: `
                <div class="grid md:grid-cols-2 gap-8 mt-12 max-w-5xl mx-auto">
                    <div class="p-8 rounded-3xl bg-slate-900/5 dark:bg-white/5 border border-slate-900/10 dark:border-white/10 hover-lift backdrop-blur-sm">
                        <span class="text-xs font-black tracking-widest text-emerald-600 dark:text-emerald-400 uppercase font-mono">Stanza One</span>
                        <p class="italic text-base md:text-lg text-slate-700 dark:text-slate-300 font-medium leading-loose mt-4">
                            Great Federal School of Statistics,<br/>
                            A beacon of light in analytical fields,<br/>
                            We study, we code, we calculate truth,<br/>
                            To build our nation with honors and youth.<br/>
                            We stand for data, for science and art,<br/>
                            With strength in our mind and truth in our heart.
                        </p>
                    </div>
                    <div class="p-8 rounded-3xl bg-slate-900/5 dark:bg-white/5 border border-slate-900/10 dark:border-white/10 hover-lift backdrop-blur-sm">
                        <span class="text-xs font-black tracking-widest text-emerald-600 dark:text-emerald-400 uppercase font-mono">Stanza Two</span>
                        <p class="italic text-base md:text-lg text-slate-700 dark:text-slate-300 font-medium leading-loose mt-4">
                            FSS Ibadan, the premier of all,<br/>
                            Answering our dear fatherland's call,<br/>
                            With Statistics, Computing, and Management skills,<br/>
                            We conquer all summits, we scale all the hills.<br/>
                            To God be the glory, our efforts are blessed,<br/>
                            Forever the greatest, forever the best!
                        </p>
                    </div>
                </div>
                `
            }),
            order: 3,
            isActive: true
        });

        // 6. Seed Academic Departments Section (Features Type)
        await db.insert(cmsHomePageSections).values({
            type: "features",
            title: "Pioneering Monotechnic Programmes",
            subtitle: "Fully accredited National Diploma (ND) and Higher National Diploma (HND) paths engineered for high-growth modern careers.",
            content: JSON.stringify({
                items: [
                    {
                        title: "Department of Statistics",
                        badge: "ND & HND",
                        description: "Deep dive into regression theories, sample design, demographic projections, and quantitative analytics powered by SPSS, R, and Python.",
                        icon: "BarChart4"
                    },
                    {
                        title: "Department of Computer Science",
                        badge: "ND & HND",
                        description: "Master algorithms, software engineering, databases, and fullstack frameworks to build scalable enterprise solutions.",
                        icon: "Code2"
                    },
                    {
                        title: "Department of Accountancy",
                        badge: "ND & HND",
                        description: "Understand financial statement analysis, audit procedures, corporate governance, and digital tax frameworks.",
                        icon: "Coins"
                    },
                    {
                        title: "Business Administration",
                        badge: "ND & HND",
                        description: "Empower your entrepreneurial drive with operations management, marketing heuristics, and organizational behavior models.",
                        icon: "Briefcase"
                    },
                    {
                        title: "Artificial Intelligence (AI)",
                        badge: "ND Only",
                        description: "A pioneering technical track focusing on neural networks, natural language processing, machine learning models, and computer vision systems.",
                        icon: "Zap"
                    },
                    {
                        title: "Networking & Cloud Computing",
                        badge: "ND Only",
                        description: "Configure distributed networks, secure cybersecurity topologies, and engineer robust cloud deployments on AWS & Azure.",
                        icon: "Network"
                    }
                ]
            }),
            order: 4,
            isActive: true
        });

        // 7. Seed Leadership Block (Content Type)
        await db.insert(cmsHomePageSections).values({
            type: "content",
            title: "Administration & Rectorate",
            subtitle: "Led by national statistics architects and veteran academic administrators.",
            content: JSON.stringify({
                body: `
                <div class="grid md:grid-cols-2 gap-12 mt-12 items-center max-w-5xl mx-auto text-left">
                    <div class="space-y-6">
                        <span class="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 py-1.5 px-4 rounded-full font-black uppercase tracking-widest text-[10px]">Administrative Governance</span>
                        <h3 class="text-3xl font-black text-slate-900 dark:text-white uppercase italic tracking-tight">Statistician-General of the Federation</h3>
                        <p class="text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                            Under the direct executive leadership of <strong>Mr. Semiu Adeyemi Adeniran</strong>, the Statistician-General of the Federation and head of the National Bureau of Statistics (NBS), FSS Ibadan receives strong backing for computational infrastructures, national research project integrations, and data warehouse funding.
                        </p>
                    </div>
                    <div class="p-8 rounded-[3rem] bg-gradient-to-br from-emerald-900 to-slate-950 text-white space-y-6 shadow-2xl relative overflow-hidden border border-white/10 hover-lift">
                        <div class="absolute top-0 right-0 -translate-y-1/3 translate-x-1/3 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl" />
                        <span class="bg-emerald-500/20 text-emerald-300 py-1.5 px-4 rounded-full font-black uppercase tracking-widest text-[9px]">Rector's Address</span>
                        <blockquote class="italic text-base md:text-lg text-slate-200 font-medium leading-relaxed">
                            "Welcome to the official portal of FSS Ibadan. Our mandate is clear: to deliver state-of-the-art vocational and technical training that equips our students to transform raw data into national insight, and build highly secure computational models for a digital world."
                        </blockquote>
                        <div class="pt-4 border-t border-white/10">
                            <h4 class="font-black text-emerald-400 uppercase tracking-wide">Dr. A. S. Phillips</h4>
                            <p class="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Rector, Federal School of Statistics</p>
                        </div>
                    </div>
                </div>
                `
            }),
            order: 5,
            isActive: true
        });

        // 8. Seed Admission & System Call to Action (CTA Type)
        await db.insert(cmsHomePageSections).values({
            type: "cta",
            title: "Join the Future of Technical Innovation",
            subtitle: "Admissions are currently open for all ND, HND, and professional certification tracks. Verify your JAMB details and enroll today.",
            content: JSON.stringify({
                ctaText: "Start Application Now",
                ctaLink: "/register"
            }),
            order: 6,
            isActive: true
        });

        // 9. Seed Campus Slider Gallery (Slider Type)
        const [sliderSection] = await db.insert(cmsHomePageSections).values({
            type: "slider",
            title: "Our Premium Monotechnic Environment",
            subtitle: "Modern lecture theaters, dedicated computer labs, and state-of-the-art sports facilities.",
            order: 7,
            isActive: true
        });

        const sliderMedia = [
            {
                url: "https://images.unsplash.com/photo-1568667256549-094345857637?auto=format&fit=crop&q=80&w=1920",
                caption: "The Digital Research Library & e-Learning Commons",
                order: 1
            },
            {
                url: "https://images.unsplash.com/photo-1523050853064-8521a3e3515f?auto=format&fit=crop&q=80&w=1920",
                caption: "Active Student Innovation and Statistical Forums",
                order: 2
            },
            {
                url: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=1920",
                caption: "Modern Computational & AI Laboratories",
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

        revalidatePath("/");
        return { success: true, message: "Federal School of Statistics, Ibadan (FSS) Portal fully seeded successfully!" };

    } catch (error: any) {
        console.error("FSS Seeding Error:", error);
        return { success: false, error: error.message || "Failed to seed FSS demo data" };
    }
}
