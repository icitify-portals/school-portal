import { db } from "../src/db/db";
import { cmsPages, cmsHomePageSections, cmsSectionMedia, cmsMenus } from "../src/db/schema";
import { eq } from "drizzle-orm";

async function seedMenus() {
    console.log("🌱 Seeding Default CMS Menus...");
    await db.delete(cmsMenus);
    
    const menuItems = [
        { label: 'Home', href: '/', order: 0 },
        { label: 'About Us', href: '/about-us', order: 1 },
        { label: 'Administration', href: '/administration', order: 2 },
        { label: 'Principal Officers', href: '/principal-officers', order: 3 },
        { label: 'Programmes', href: '/programmes', order: 4 },
        { label: 'Portal Login', href: '/login', order: 5 }
    ];

    for (const item of menuItems) {
        await db.insert(cmsMenus).values(item);
    }
    console.log("✅ CMS Menus Seeding Completed!");
}

async function seedContent() {
    console.log("🌱 Seeding Default CMS Content...");
    await seedMenus();

    // 1. CLEAR EXISTING DATA
    try {
        await db.delete(cmsSectionMedia);
        await db.delete(cmsHomePageSections);
        for (const slug of ['about-us', 'administration', 'principal-officers']) {
            await db.delete(cmsPages).where(eq(cmsPages.slug, slug));
        }
    } catch (e) {
        console.log("Note: Could not clear some tables, might be empty.");
    }

    // 2. HOMEPAGE SECTIONS
    const sections = [
        {
            type: 'slider',
            title: 'Welcome to Our University',
            subtitle: 'Excellence in Teaching, Research and Service',
            order: 0,
            media: [
                {
                    url: 'https://images.unsplash.com/photo-1541339907198-e08756ebafe3?auto=format&fit=crop&q=80&w=1920',
                    mediaType: 'image' as const,
                    caption: 'Modern Learning Facilities',
                    mimeType: 'image/jpeg'
                },
                {
                    url: 'https://images.unsplash.com/photo-1523050335456-c38466a0962c?auto=format&fit=crop&q=80&w=1920',
                    mediaType: 'image' as const,
                    caption: 'Research and Innovation',
                    mimeType: 'image/jpeg'
                },
                {
                    url: 'https://images.unsplash.com/photo-1517486808906-6ca8b3ef0e6c?auto=format&fit=crop&q=80&w=1920',
                    mediaType: 'image' as const,
                    caption: 'Vibrant Campus Life',
                    mimeType: 'image/jpeg'
                }
            ]
        },
        {
            type: 'hero',
            title: 'Empowering Future Leaders',
            subtitle: 'We provide a world-class environment for academic growth and professional development.',
            content: JSON.stringify({
                badge: 'Established 1948',
                imageUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=1200',
                ctaText: 'Explore Programmes',
                ctaLink: '/programmes'
            }),
            order: 1
        },
        {
            type: 'content',
            title: 'The University of Excellence',
            subtitle: 'Cultivating minds and driving innovation across the globe.',
            content: JSON.stringify({
                body: `
                    <p>Our institution is more than just a place of learning; it is a community dedicated to pushing the boundaries of knowledge. With over 100 undergraduate and postgraduate programmes, we prepare our students to lead in their respective fields.</p>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
                        <div class="p-8 rounded-3xl bg-slate-50 border border-slate-100">
                            <h4 class="text-3xl font-black text-indigo-600">500+</h4>
                            <p class="text-sm font-bold uppercase tracking-widest text-slate-500 mt-2">Faculty Members</p>
                        </div>
                        <div class="p-8 rounded-3xl bg-slate-50 border border-slate-100">
                            <h4 class="text-3xl font-black text-indigo-600">20k+</h4>
                            <p class="text-sm font-bold uppercase tracking-widest text-slate-500 mt-2">Active Students</p>
                        </div>
                        <div class="p-8 rounded-3xl bg-slate-50 border border-slate-100">
                            <h4 class="text-3xl font-black text-indigo-600">150+</h4>
                            <p class="text-sm font-bold uppercase tracking-widest text-slate-500 mt-2">Global Partnerships</p>
                        </div>
                    </div>
                `
            }),
            order: 2
        },
        {
            type: 'gallery',
            title: 'Campus Experience',
            subtitle: 'Glimpses into the life and culture of our institution.',
            order: 3,
            media: [
                { url: 'https://images.unsplash.com/photo-1498243639351-a430ff3f2a1a?auto=format&fit=crop&q=80&w=800', mediaType: 'image' as const, caption: 'The Central Library', mimeType: 'image/jpeg' },
                { url: 'https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&q=80&w=800', mediaType: 'image' as const, caption: 'Student Activities', mimeType: 'image/jpeg' },
                { url: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&q=80&w=800', mediaType: 'image' as const, caption: 'Lecture Halls', mimeType: 'image/jpeg' },
                { url: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80&w=800', mediaType: 'image' as const, caption: 'Innovation Lab', mimeType: 'image/jpeg' }
            ]
        },
        {
            type: 'cta',
            title: 'Begin Your Journey Today',
            subtitle: 'Applications for the 2026/2027 academic session are now open for all faculties.',
            content: JSON.stringify({
                ctaText: 'Apply Now',
                ctaLink: '/admissions'
            }),
            order: 4
        }
    ];

    for (const section of sections) {
        const { media, ...sectionData } = section;
        const [result] = await db.insert(cmsHomePageSections).values(sectionData as any);
        const sectionId = result.insertId;

        if (media) {
            for (let i = 0; i < media.length; i++) {
                await db.insert(cmsSectionMedia).values({
                    ...media[i],
                    sectionId,
                    order: i
                });
            }
        }
    }

    // 3. CMS PAGES
    const pages = [
        {
            title: 'About Us',
            slug: 'about-us',
            content: `
                <section class="space-y-8">
                    <div>
                        <h2 class="text-3xl font-black italic uppercase tracking-tighter">Our History</h2>
                        <p class="mt-4 text-slate-600 leading-relaxed">Founded in 1948, our institution has grown from a small college into a leading center for academic research and professional training. We have a rich legacy of excellence and a commitment to serving our community and the world.</p>
                    </div>
                    <div class="grid md:grid-cols-2 gap-8">
                        <div class="p-8 rounded-3xl bg-indigo-50 border border-indigo-100">
                            <h3 class="text-xl font-black uppercase italic text-indigo-900">Our Vision</h3>
                            <p class="mt-2 text-indigo-700">To be a world-class institution for academic excellence geared towards meeting societal needs.</p>
                        </div>
                        <div class="p-8 rounded-3xl bg-emerald-50 border border-emerald-100">
                            <h3 class="text-xl font-black uppercase italic text-emerald-900">Our Mission</h3>
                            <p class="mt-2 text-emerald-700">To expand the frontiers of knowledge through relevant and cutting-edge research and teaching.</p>
                        </div>
                    </div>
                </section>
            `,
            status: 'published' as const,
            metaTitle: 'About Us | University Portal',
            metaDescription: 'Learn about our history, mission, and vision.'
        },
        {
            title: 'Administration',
            slug: 'administration',
            content: `
                <section class="space-y-8">
                    <p class="text-slate-600">The administration of the University is committed to providing efficient support services for the primary roles of the University in teaching, research, and service. The structure ensures accountability, transparency, and high performance across all units.</p>
                    <div class="space-y-4">
                        <div class="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                            <div class="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold">OC</div>
                            <div>
                                <h4 class="font-bold text-slate-900 text-lg">Office of the Chancellor</h4>
                                <p class="text-sm text-slate-500">The ceremonial head of the University.</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                            <div class="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold">VC</div>
                            <div>
                                <h4 class="font-bold text-slate-900 text-lg">Office of the Vice-Chancellor</h4>
                                <p class="text-sm text-slate-500">The Chief Executive and Academic Officer.</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                            <div class="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold">RE</div>
                            <div>
                                <h4 class="font-bold text-slate-900 text-lg">The Registry</h4>
                                <p class="text-sm text-slate-500">Responsible for administrative and academic processes.</p>
                            </div>
                        </div>
                    </div>
                </section>
            `,
            status: 'published' as const,
            metaTitle: 'Administration | University Portal'
        },
        {
            title: 'Principal Officers',
            slug: 'principal-officers',
            content: `
                <div class="grid grid-cols-1 md:grid-cols-2 gap-12 mt-8">
                    <div class="space-y-4">
                        <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=800&h=800&q=80" class="w-full aspect-square object-cover rounded-[3rem] shadow-xl border-4 border-white" alt="VC" />
                        <div>
                            <h3 class="text-2xl font-black text-slate-900">Professor John Doe</h3>
                            <p class="text-indigo-600 font-bold uppercase tracking-widest text-sm">Vice-Chancellor</p>
                        </div>
                    </div>
                    <div class="space-y-4">
                        <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=facearea&facepad=2&w=800&h=800&q=80" class="w-full aspect-square object-cover rounded-[3rem] shadow-xl border-4 border-white" alt="Registrar" />
                        <div>
                            <h3 class="text-2xl font-black text-slate-900">Dr. Jane Smith</h3>
                            <p class="text-indigo-600 font-bold uppercase tracking-widest text-sm">Registrar</p>
                        </div>
                    </div>
                    <div class="space-y-4">
                         <img src="https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=facearea&facepad=2&w=800&h=800&q=80" class="w-full aspect-square object-cover rounded-[3rem] shadow-xl border-4 border-white" alt="Bursar" />
                        <div>
                            <h3 class="text-2xl font-black text-slate-900">Mrs. Alice Brown</h3>
                            <p class="text-indigo-600 font-bold uppercase tracking-widest text-sm">Bursar</p>
                        </div>
                    </div>
                    <div class="space-y-4">
                        <img src="https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=facearea&facepad=2&w=800&h=800&q=80" class="w-full aspect-square object-cover rounded-[3rem] shadow-xl border-4 border-white" alt="Librarian" />
                        <div>
                            <h3 class="text-2xl font-black text-slate-900">Mr. Robert Wilson</h3>
                            <p class="text-indigo-600 font-bold uppercase tracking-widest text-sm">University Librarian</p>
                        </div>
                    </div>
                </div>
            `,
            status: 'published' as const,
            metaTitle: 'Principal Officers | University Portal'
        }
    ];

    for (const page of pages) {
        await db.insert(cmsPages).values(page as any);
    }

    console.log("✅ CMS Seeding Completed!");
    process.exit(0);
}

seedContent().catch(e => {
    console.error(e);
    process.exit(1);
});
