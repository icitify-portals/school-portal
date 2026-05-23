import { db } from "@/db/db";
import { documentTemplates } from "@/db/schema";

export async function seedDocumentTemplates() {
    // 1. ARCHETYPE: THE ROYAL CLASSIC (Formal & Traditional)
    const royalClassicHtml = `
<div style="font-family: 'Times New Roman', serif; max-width: 800px; margin: auto; padding: 50px; border: 15px double #1e293b; background: #fffaf0;">
    <div style="text-align: center; border-bottom: 2px solid #1e293b; padding-bottom: 20px; margin-bottom: 30px;">
        <h1 style="font-size: 32px; color: #1e293b; margin: 0; text-transform: uppercase;">{{institution_name}}</h1>
        <p style="font-style: italic; color: #475569;">In Pursuit of Excellence and Integrity</p>
    </div>
    <h2 style="text-align: center; font-size: 24px; text-decoration: underline;">OFFICIAL TRANSCRIPT OF ACADEMIC RECORD</h2>
    <div style="margin: 30px 0; line-height: 1.8;">
        <p>This is to certify that <b>{{candidate_name}}</b> ({{academic_number}}) has completed the requirements for the semester.</p>
    </div>
    <table style="width: 100%; border: 1px solid #000; border-collapse: collapse;">
        <thead style="background: #f1f5f9;">
            <tr><th style="border: 1px solid #000; padding: 10px;">Course</th><th style="border: 1px solid #000; padding: 10px;">Units</th><th style="border: 1px solid #000; padding: 10px;">Grade</th></tr>
        </thead>
        <tbody>{{course_rows}}</tbody>
    </table>
    <div style="margin-top: 50px; display: flex; justify-content: space-between;">
        <div style="border-top: 1px solid #000; width: 200px; text-align: center;">Registrar</div>
        <div style="font-weight: bold;">GPA: {{gpa}}</div>
    </div>
</div>`;

    // 2. ARCHETYPE: THE MODERN MINIMALIST (Sleek & Clean)
    const modernMinimalistHtml = `
<div style="font-family: 'Inter', sans-serif; max-width: 800px; margin: auto; padding: 60px; background: #fff;">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 60px;">
        <div style="font-size: 40px; font-weight: 900; letter-spacing: -2px; color: #000;">{{institution_name}}</div>
        <div style="text-align: right; color: #64748b; font-size: 12px; font-weight: 600;">ACADEMIC REPORT<br/>{{session}}</div>
    </div>
    <div style="margin-bottom: 40px;">
        <div style="font-size: 14px; color: #94a3b8; font-weight: 700; text-transform: uppercase;">Student</div>
        <div style="font-size: 24px; font-weight: 800;">{{candidate_name}}</div>
        <div style="color: #6366f1; font-weight: 700;">ID: {{academic_number}}</div>
    </div>
    <div style="border-top: 1px solid #f1f5f9; padding-top: 30px;">
        {{course_rows}}
    </div>
    <div style="margin-top: 60px; display: flex; justify-content: flex-end; gap: 40px;">
        <div><div style="font-size: 10px; color: #94a3b8;">SEMESTER</div><div style="font-size: 24px; font-weight: 900;">{{gpa}}</div></div>
        <div><div style="font-size: 10px; color: #94a3b8;">CUMULATIVE</div><div style="font-size: 24px; font-weight: 900; color: #6366f1;">{{cgpa}}</div></div>
    </div>
</div>`;

    // 3. ARCHETYPE: TECH-FORWARD (Glassmorphism & Gradients)
    const techForwardHtml = `
<div style="font-family: 'JetBrains Mono', monospace; max-width: 800px; margin: auto; padding: 40px; background: #0f172a; color: #f8fafc; border-radius: 30px; border: 1px solid #1e293b;">
    <div style="background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%); padding: 40px; border-radius: 20px; margin-bottom: 40px;">
        <h1 style="margin: 0; font-size: 30px; letter-spacing: -1px;">VERIFIED_RESULT_CORE</h1>
        <p style="opacity: 0.8;">Institutional Blockchain Record v2.4</p>
    </div>
    <div style="display: grid; grid-template-cols: 1fr 1fr; gap: 20px; margin-bottom: 40px;">
        <div style="background: #1e293b; padding: 20px; border-radius: 15px;">
            <div style="font-size: 10px; color: #6366f1;">USER_IDENTIFIER</div>
            <div style="font-size: 16px; font-weight: bold;">{{candidate_name}}</div>
        </div>
        <div style="background: #1e293b; padding: 20px; border-radius: 15px;">
            <div style="font-size: 10px; color: #6366f1;">SYSTEM_ID</div>
            <div style="font-size: 16px; font-weight: bold;">{{academic_number}}</div>
        </div>
    </div>
    <div style="space-y-4">{{course_rows}}</div>
    <div style="margin-top: 40px; padding: 20px; border: 1px dashed #334155; border-radius: 15px; text-align: center;">
        <div style="font-size: 10px; margin-bottom: 10px;">FINAL_AGGR_SCORE</div>
        <div style="font-size: 40px; font-weight: 900; color: #10b981;">{{cgpa}}</div>
    </div>
</div>`;

    // 4. ARCHETYPE: VIBRANT ACADEMIC (Dynamic & High Contrast)
    const vibrantAcademicHtml = `
<div style="font-family: 'Outfit', sans-serif; max-width: 800px; margin: auto; padding: 60px; background: #f0f9ff; border-radius: 40px; position: relative; overflow: hidden;">
    <div style="position: absolute; top: -50px; right: -50px; width: 200px; height: 200px; background: #e0f2fe; border-radius: 50%;"></div>
    <div style="position: relative;">
        <div style="background: #fff; padding: 40px; border-radius: 30px; shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);">
            <div style="display: flex; gap: 20px; align-items: center; margin-bottom: 30px;">
                <div style="width: 60px; height: 60px; background: #0369a1; border-radius: 15px;"></div>
                <h1 style="color: #0c4a6e; font-size: 26px; margin: 0;">{{institution_name}}</h1>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: flex-end;">
                <div>
                    <h2 style="color: #0369a1; font-size: 32px; margin: 0;">{{candidate_name}}</h2>
                    <p style="color: #7dd3fc; font-weight: bold;">{{academic_number}}</p>
                </div>
                <div style="text-align: right;">
                    <div style="font-size: 48px; font-weight: 900; color: #0369a1;">{{gpa}}</div>
                    <div style="font-size: 10px; font-weight: 800; color: #bae6fd; text-transform: uppercase;">GPA SCORE</div>
                </div>
            </div>
        </div>
        <div style="margin-top: 30px;">{{course_rows}}</div>
    </div>
</div>`;

    await db.insert(documentTemplates).values([
        { name: "Royal Classic", type: "result_slip", level: "tertiary", templateHtml: royalClassicHtml, isActive: false },
        { name: "Modern Minimalist", type: "result_slip", level: "tertiary", templateHtml: modernMinimalistHtml, isActive: true },
        { name: "Tech Forward", type: "result_slip", level: "tertiary", templateHtml: techForwardHtml, isActive: false },
        { name: "Vibrant Academic", type: "result_slip", level: "tertiary", templateHtml: vibrantAcademicHtml, isActive: false }
    ]);
}
