"use client";

import React from "react";
import { viewableAssetUrl } from "@/lib/assets";

export interface CourseFormCourseItem {
    id?: number;
    code: string;
    title: string;
    units: number;
    statusCode?: string; // 'C' | 'E' | 'R'
    isCarryOver?: boolean;
}

export interface CourseFormData {
    matricNumber: string;
    fullName: string;
    levelLabel: string;
    program: string;
    sessionSemester: string;
    departmentName: string;
    imageUrl?: string | null;
    signatureUrl?: string | null;
    courses: CourseFormCourseItem[];
}

const NIGERIA_COAT_OF_ARMS_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 110" width="76" height="70">
  <!-- Eagle -->
  <path d="M60 4 L53 13 L45 11 L51 19 L34 15 L44 25 L38 28 L52 29 L55 34 L65 34 L68 29 L82 28 L76 25 L86 15 L69 19 L75 11 L67 13 Z" fill="#222"/>
  <!-- Wreath under eagle -->
  <rect x="46" y="33" width="28" height="4" rx="2" fill="#444" stroke="#000" stroke-width="1"/>
  <!-- Left Horse -->
  <path d="M40 42 C30 35, 18 42, 16 54 C14 64, 22 72, 20 84 L26 84 C28 74, 25 66, 30 60 C34 56, 38 62, 42 66 L42 46 Z" fill="#fff" stroke="#000" stroke-width="2"/>
  <path d="M22 44 C16 38, 12 45, 15 50" fill="none" stroke="#000" stroke-width="2"/>
  <!-- Right Horse -->
  <path d="M80 42 C90 35, 102 42, 104 54 C106 64, 98 72, 100 84 L94 84 C92 74, 95 66, 90 60 C86 56, 82 62, 78 66 L78 46 Z" fill="#fff" stroke="#000" stroke-width="2"/>
  <path d="M98 44 C104 38, 108 45, 105 50" fill="none" stroke="#000" stroke-width="2"/>
  <!-- Central Shield -->
  <path d="M42 37 L78 37 L78 63 C78 76, 60 85, 60 85 C60 85, 42 76, 42 63 Z" fill="#1b1b1b" stroke="#000" stroke-width="2"/>
  <!-- Y-Pall on Shield -->
  <path d="M43 38 L60 56 L77 38 L79 42 L63 59 L63 83 L57 83 L57 59 L41 42 Z" fill="#e5e5e5" stroke="#000" stroke-width="1"/>
  <!-- Base Grass & Flowers -->
  <ellipse cx="60" cy="87" rx="38" ry="5" fill="#555" stroke="#000" stroke-width="1.2"/>
  <!-- Motto Ribbon -->
  <path d="M12 91 Q60 101 108 91 L104 100 Q60 109 16 100 Z" fill="#fff" stroke="#000" stroke-width="1.5"/>
  <text x="60" y="99" font-family="Times New Roman, serif" font-size="6.2" font-weight="bold" text-anchor="middle" fill="#000">UNITY AND FAITH, PEACE AND PROGRESS</text>
</svg>
`;

const SILHOUETTE_AVATAR_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 135" width="115" height="130">
  <rect width="120" height="135" fill="#d4d4d4"/>
  <circle cx="60" cy="46" r="24" fill="#ffffff"/>
  <path d="M14 132 C14 94, 40 80, 60 80 C80 80, 106 94, 106 132 Z" fill="#ffffff"/>
</svg>
`;

export function buildSingleCourseFormHTML(data: CourseFormData): string {
    const regularCourses = (data.courses || []).filter(c => !c.isCarryOver);
    const carryOverCourses = (data.courses || []).filter(c => c.isCarryOver);
    const allCoursesForTotal = data.courses || [];
    const totalUnits = allCoursesForTotal.reduce((sum, c) => sum + (Number(c.units) || 0), 0);

    const resolvedPhoto = data.imageUrl ? (viewableAssetUrl(data.imageUrl) || data.imageUrl) : null;
    const resolvedSign = data.signatureUrl ? (viewableAssetUrl(data.signatureUrl) || data.signatureUrl) : null;

    const carryOverRowCount = Math.max(3, carryOverCourses.length);
    const carryOverRowsHtml = Array.from({ length: carryOverRowCount }).map((_, idx) => {
        const co = carryOverCourses[idx];
        return `
            <tr>
                <td style="border: 1px solid #000; padding: 3px 6px; font-weight: bold; width: 16%;">${idx + 1}.${co ? ` ${co.code}` : ''}</td>
                <td style="border: 1px solid #000; padding: 3px 6px; width: 54%; text-transform: uppercase;">${co ? (co.title || '') : ''}</td>
                <td style="border: 1px solid #000; padding: 3px 6px; text-align: center; width: 8%;">${co ? co.units : ''}</td>
                <td style="border: 1px solid #000; padding: 3px 4px; text-align: center; width: 5%;">${co ? (co.statusCode || 'C') : ''}</td>
                <td style="border: 1px solid #000; padding: 3px 6px; width: 17%;"></td>
            </tr>
        `;
    }).join("");

    const regularRowsHtml = (regularCourses.length > 0 ? regularCourses : allCoursesForTotal).map((c) => `
        <tr>
            <td style="border: 1px solid #000; padding: 3px 6px; font-weight: bold; width: 16%;">${c.code || ''}</td>
            <td style="border: 1px solid #000; padding: 3px 6px; width: 54%; text-transform: uppercase;">${c.title || ''}</td>
            <td style="border: 1px solid #000; padding: 3px 6px; text-align: center; width: 8%;">${c.units ?? ''}</td>
            <td style="border: 1px solid #000; padding: 3px 4px; text-align: center; width: 5%;">${c.statusCode || 'C'}</td>
            <td style="border: 1px solid #000; padding: 3px 6px; width: 17%;"></td>
        </tr>
    `).join("");

    return `
        <div class="fss-course-form-sheet" style="font-family: 'Times New Roman', Times, serif; color: #000; background: #fff; max-width: 190mm; margin: 0 auto; box-sizing: border-box;">
            <table style="width: 100%; border-collapse: collapse; border: 2px solid #000; font-size: 12.5px; line-height: 1.25;">
                <!-- TOP INSTITUTIONAL HEADER -->
                <tbody>
                    <tr>
                        <td style="border: 1px solid #000; width: 20%; text-align: center; vertical-align: middle; padding: 6px;">
                            ${NIGERIA_COAT_OF_ARMS_SVG}
                        </td>
                        <td style="border: 1px solid #000; width: 60%; text-align: center; vertical-align: middle; padding: 6px 10px;">
                            <div style="font-size: 19px; font-weight: bold; letter-spacing: 0.3px; text-transform: uppercase;">
                                FEDERAL SCHOOL OF STATISTICS
                            </div>
                            <div style="font-size: 18px; font-weight: bold; margin-top: 4px; text-transform: uppercase;">
                                IBADAN CAMPUS
                            </div>
                        </td>
                        <td style="border: 1px solid #000; width: 20%; text-align: center; vertical-align: middle; padding: 6px;">
                            <img src="/fss_logo.png" alt="FSS Logo" style="width: 68px; height: 68px; object-fit: contain; display: inline-block;" />
                        </td>
                    </tr>
                </tbody>
            </table>

            <!-- SECTION 1: STUDENT'S INFORMATION -->
            <table style="width: 100%; border-collapse: collapse; border-left: 2px solid #000; border-right: 2px solid #000; border-bottom: 1px solid #000; font-size: 12.5px; line-height: 1.25;">
                <tbody>
                    <tr>
                        <td colspan="3" style="border: 1px solid #000; text-align: center; font-weight: bold; font-size: 13.5px; padding: 3px 6px; text-transform: uppercase;">
                            STUDENT'S INFORMATION
                        </td>
                    </tr>
                    <tr>
                        <td style="border: 1px solid #000; padding: 3px 6px; font-weight: bold; width: 22%;">Matric No:</td>
                        <td style="border: 1px solid #000; padding: 3px 6px; width: 56%;">${data.matricNumber || ''}</td>
                        <td rowspan="7" style="border: 1px solid #000; width: 22%; text-align: center; vertical-align: middle; padding: 6px;">
                            ${resolvedPhoto
                                ? `<img src="${resolvedPhoto}" alt="Passport" style="width: 115px; height: 130px; object-fit: cover; display: inline-block; border: 1px solid #999;" />`
                                : SILHOUETTE_AVATAR_SVG
                            }
                        </td>
                    </tr>
                    <tr>
                        <td style="border: 1px solid #000; padding: 3px 6px; font-weight: bold;">Full Names:</td>
                        <td style="border: 1px solid #000; padding: 3px 6px; text-transform: uppercase;">${data.fullName || ''}</td>
                    </tr>
                    <tr>
                        <td style="border: 1px solid #000; padding: 3px 6px; font-weight: bold;">Level:</td>
                        <td style="border: 1px solid #000; padding: 3px 6px; text-transform: uppercase;">${data.levelLabel || ''}</td>
                    </tr>
                    <tr>
                        <td style="border: 1px solid #000; padding: 3px 6px; font-weight: bold;">Program:</td>
                        <td style="border: 1px solid #000; padding: 3px 6px; text-transform: uppercase;">${data.program || ''}</td>
                    </tr>
                    <tr>
                        <td style="border: 1px solid #000; padding: 3px 6px; font-weight: bold;">Session/Semester:</td>
                        <td style="border: 1px solid #000; padding: 3px 6px;">${data.sessionSemester || ''}</td>
                    </tr>
                    <tr>
                        <td style="border: 1px solid #000; padding: 3px 6px; font-weight: bold;">Department:</td>
                        <td style="border: 1px solid #000; padding: 3px 6px;">${data.departmentName || ''}</td>
                    </tr>
                    <tr>
                        <td style="border: 1px solid #000; padding: 3px 6px; font-weight: bold; height: 22px;">Student Sign:</td>
                        <td style="border: 1px solid #000; padding: 3px 6px; height: 22px;">
                            ${resolvedSign ? `<img src="${resolvedSign}" alt="Sign" style="max-height: 20px; object-fit: contain;" />` : ''}
                        </td>
                    </tr>
                </tbody>
            </table>

            <!-- SECTION 2: LIST OF REGISTERED COURSES -->
            <table style="width: 100%; border-collapse: collapse; border-left: 2px solid #000; border-right: 2px solid #000; border-bottom: 1px solid #000; font-size: 12px; line-height: 1.22;">
                <tbody>
                    <tr>
                        <td colspan="5" style="border: 1px solid #000; text-align: center; font-weight: bold; font-size: 13.5px; padding: 3px 6px; text-transform: uppercase;">
                            LIST OF REGISTERED COURSES
                        </td>
                    </tr>
                    <tr>
                        <td style="border: 1px solid #000; padding: 3px 6px; font-weight: bold; width: 16%;">Code</td>
                        <td style="border: 1px solid #000; padding: 3px 6px; font-weight: bold; width: 54%;">Title</td>
                        <td style="border: 1px solid #000; padding: 3px 6px; font-weight: bold; text-align: center; width: 8%;">Unit</td>
                        <td colspan="2" style="border: 1px solid #000; padding: 3px 6px; font-weight: bold; text-align: center; width: 22%;">C S &amp; Signature</td>
                    </tr>
                    ${regularRowsHtml}
                    <tr>
                        <td style="border: 1px solid #000; padding: 3px 6px;"></td>
                        <td style="border: 1px solid #000; padding: 3px 8px; text-align: right;">Total Unit Registered</td>
                        <td style="border: 1px solid #000; padding: 3px 6px; text-align: center; font-weight: bold;">${totalUnits}</td>
                        <td style="border: 1px solid #000; padding: 3px 4px;"></td>
                        <td style="border: 1px solid #000; padding: 3px 6px;"></td>
                    </tr>
                </tbody>
            </table>

            <!-- SECTION 3: CARRY OVER -->
            <table style="width: 100%; border-collapse: collapse; border-left: 2px solid #000; border-right: 2px solid #000; border-bottom: 1px solid #000; font-size: 12px; line-height: 1.22;">
                <tbody>
                    <tr>
                        <td colspan="5" style="border: 1px solid #000; text-align: center; font-weight: bold; font-size: 13.5px; padding: 3px 6px; text-transform: uppercase;">
                            CARRY OVER
                        </td>
                    </tr>
                    <tr>
                        <td style="border: 1px solid #000; padding: 3px 6px; font-weight: bold; width: 16%;">Code</td>
                        <td style="border: 1px solid #000; padding: 3px 6px; font-weight: bold; width: 54%;">Title</td>
                        <td style="border: 1px solid #000; padding: 3px 6px; font-weight: bold; text-align: center; width: 8%;">Unit</td>
                        <td colspan="2" style="border: 1px solid #000; padding: 3px 6px; font-weight: bold; text-align: center; width: 22%;">C S Signature</td>
                    </tr>
                    ${carryOverRowsHtml}
                </tbody>
            </table>

            <!-- BOTTOM SIGNATORIES & STAMP BOX -->
            <div style="border-left: 2px solid #000; border-right: 2px solid #000; border-bottom: 2px solid #000; padding: 36px 28px 14px 28px;">
                <div style="text-align: center; margin-bottom: 22px;">
                    <div style="width: 240px; border-bottom: 1px solid #000; margin: 0 auto 4px auto;"></div>
                    <div style="font-size: 12.5px; font-weight: bold; text-transform: uppercase;">
                        SCHOOL ACCOUNTANT SIGNATURE
                    </div>
                </div>

                <div style="text-align: center; font-size: 13.5px; font-weight: bold; text-transform: uppercase; margin: 18px 0 42px 0;">
                    SIGNATURE AND OFFICIAL STAMP
                </div>

                <div style="display: flex; justify-content: space-between; align-items: flex-end; gap: 24px;">
                    <div style="text-align: center; width: 230px;">
                        <div style="border-bottom: 1px solid #000; margin-bottom: 4px;"></div>
                        <div style="font-size: 12.5px; font-weight: bold; text-transform: uppercase;">
                            H.O.D SIGNATURE
                        </div>
                    </div>
                    <div style="text-align: center; width: 230px;">
                        <div style="border-bottom: 1px solid #000; margin-bottom: 4px;"></div>
                        <div style="font-size: 12.5px; font-weight: bold; text-transform: uppercase;">
                            REGISTRAR'S SIGNATURE
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

export function printOfficialCourseForms(forms: CourseFormData[]) {
    if (!forms.length || typeof window === "undefined") return;

    const pagesHtml = forms.map((f, idx) => `
        <div style="${idx < forms.length - 1 ? 'page-break-after: always;' : ''}">
            ${buildSingleCourseFormHTML(f)}
        </div>
    `).join("");

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
        window.print();
        return;
    }

    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8" />
            <title>Official Course Registration Form — Federal School of Statistics, Ibadan</title>
            <style>
                @page {
                    size: A4 portrait;
                    margin: 10mm;
                }
                body {
                    margin: 0;
                    padding: 0;
                    background: #fff;
                    color: #000;
                    font-family: "Times New Roman", Times, serif;
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }
            </style>
        </head>
        <body>
            ${pagesHtml}
            <script>
                window.onload = function() {
                    setTimeout(function() {
                        window.focus();
                        window.print();
                    }, 250);
                };
            </script>
        </body>
        </html>
    `);
    printWindow.document.close();
}

export function CourseFormPrintable({ data }: { data: CourseFormData }) {
    const html = buildSingleCourseFormHTML(data);
    return (
        <div
            className="official-course-form-container bg-white p-4 sm:p-6 rounded-xl shadow-md border border-slate-300 print:p-0 print:shadow-none print:border-none"
            dangerouslySetInnerHTML={{ __html: html }}
        />
    );
}
