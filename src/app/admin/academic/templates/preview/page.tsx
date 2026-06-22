import { db } from "@/db/db";
import { documentTemplates } from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function ResultTemplatePreview({
    searchParams,
}: {
    searchParams: { id?: string }
}) {
    if (!searchParams.id) {
        return <div className="p-10 text-center">No template ID provided</div>;
    }

    const template = await db.query.documentTemplates.findFirst({
        where: eq(documentTemplates.id, parseInt(searchParams.id))
    });

    if (!template) {
        return <div className="p-10 text-center">Template not found</div>;
    }

    const htmlContent = template.templateHtml
        .replace('{{institution_name}}', 'State Global University')
        .replace('{{candidate_name}}', 'Olanrewaju Ibrahim')
        .replace('{{academic_number}}', 'MAT/2026/001')
        .replace('{{gpa}}', '4.85')
        .replace('{{cgpa}}', '4.72')
        .replace('{{session}}', '2026/2027')
        .replace('{{semester}}', 'First')
        .replace('{{classification}}', 'First Class Honours')
        .replace('{{course_rows}}', `
            <tr><td style="padding: 15px;">Advanced Computer Architecture</td><td style="text-align:center;">3</td><td style="text-align:center; font-weight:900; color:#059669;">A</td></tr>
            <tr><td style="padding: 15px;">Database Management Systems</td><td style="text-align:center;">3</td><td style="text-align:center; font-weight:900; color:#059669;">A</td></tr>
            <tr><td style="padding: 15px;">Software Engineering</td><td style="text-align:center;">3</td><td style="text-align:center; font-weight:900; color:#059669;">A</td></tr>
            <tr><td style="padding: 15px;">Artificial Intelligence</td><td style="text-align:center;">3</td><td style="text-align:center; font-weight:900; color:#059669;">A</td></tr>
            <tr><td style="padding: 15px;">Research Methodology</td><td style="text-align:center;">2</td><td style="text-align:center; font-weight:900; color:#2563eb;">B</td></tr>
        `);

    return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-8">
            <div className="bg-white max-w-4xl w-full shadow-2xl origin-top">
                <style dangerouslySetInnerHTML={{ __html: template.templateCss || '' }} />
                <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
            </div>
        </div>
    );
}
