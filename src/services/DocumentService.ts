import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { UserOptions } from 'jspdf-autotable';

// Extend jsPDF with autotable types
interface jsPDFWithPlugin extends jsPDF {
    autoTable: (options: UserOptions) => jsPDF;
}

export class DocumentService {
    static async generateResultSlip(data: {
        institution: { name: string; motto: string; logoUrl?: string };
        student: { name: string; matricNumber: string; department: string; level: number; programme?: string };
        session: string;
        semester: string;
        results: { code: string; title: string; units: number; score: number; grade: string; gp: number }[];
        summary: { gpa: number; cgpa: number; tcr: number; tce: number };
        unitId?: number;
        headSignature?: { name: string; signatureUrl?: string };
        templateCode?: string;
    }) {
        const doc = new jsPDF() as jsPDFWithPlugin;

        if (data.templateCode === 'tertiary_semester') {
            await DocumentService.renderTertiarySemesterResult(doc, data);
        } else {
            const pageWidth = doc.internal.pageSize.getWidth();
            const head = data.headSignature;

            // 1. Header
            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.text(data.institution.name.toUpperCase(), pageWidth / 2, 20, { align: 'center' });

            doc.setFontSize(10);
            doc.setFont('helvetica', 'italic');
            doc.text(data.institution.motto, pageWidth / 2, 26, { align: 'center' });

            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('OFFICIAL SEMESTER RESULT SLIP', pageWidth / 2, 35, { align: 'center' });

            // 2. Student Info (Two Columns)
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');

            const leftCol = 15;
            const rightCol = 110;
            let y = 50;

            doc.text(`NAME: ${data.student.name.toUpperCase()}`, leftCol, y);
            doc.text(`SESSION: ${data.session}`, rightCol, y);
            y += 7;
            doc.text(`MATRIC NO: ${data.student.matricNumber}`, leftCol, y);
            doc.text(`SEMESTER: ${data.semester}`, rightCol, y);
            y += 7;
            doc.text(`DEPARTMENT: ${data.student.department}`, leftCol, y);
            doc.text(`LEVEL: ${data.student.level}`, rightCol, y);

            // 3. Results Table
            (doc as any).autoTable({
                startY: y + 10,
                head: [['COURSE CODE', 'COURSE TITLE', 'UNITS', 'SCORE', 'GRADE', 'GP']],
                body: data.results.map(r => [r.code, r.title, r.units, r.score, r.grade, r.gp.toFixed(2)]),
                theme: 'grid',
                headStyles: { fillColor: 200, textColor: 0, fontStyle: 'bold' },
                styles: { fontSize: 9, cellPadding: 3 },
                columnStyles: {
                    2: { halign: 'center' },
                    3: { halign: 'center' },
                    4: { halign: 'center' },
                    5: { halign: 'center' }
                }
            });

            // 4. Summary Stats
            const finalY = (doc as any).lastAutoTable.finalY + 10;
            doc.setFont('helvetica', 'bold');
            doc.text('PERFORMANCE SUMMARY', leftCol, finalY);

            doc.autoTable({
                startY: finalY + 5,
                body: [
                    ['Total Credits Registered (TCR)', data.summary.tcr.toString(), 'Total Credits Earned (TCE)', data.summary.tce.toString()],
                    ['Semester GPA', data.summary.gpa.toFixed(2), 'Cumulative GPA (CGPA)', data.summary.cgpa.toFixed(2)]
                ],
                theme: 'plain',
                styles: { fontSize: 10, cellPadding: 2, fontStyle: 'bold' }
            });

            // 5. Authentication
            const footerY = 250;
            if (head?.signatureUrl) {
                try {
                    doc.addImage(head.signatureUrl, 'PNG', leftCol, footerY - 18, 40, 15);
                } catch (e) {
                    console.error("Signature rendering failed", e);
                }
            }
            doc.line(leftCol, footerY, leftCol + 60, footerY);
            doc.setFontSize(8);
            doc.text(head?.name?.toUpperCase() || 'HEAD OF SCHOOL', leftCol + 30, footerY + 4, { align: 'center' });
            doc.text('Signature / Stamp', leftCol + 30, footerY + 8, { align: 'center' });

            doc.text(`Date Printed: ${new Date().toLocaleDateString()}`, rightCol + 30, footerY + 8, { align: 'center' });
        }

        doc.save(`Result_Slip_${data.student.matricNumber}_${data.session}_Sem${data.semester}.pdf`);
    }

    private static getClassOfDegree(cgpa: number): string {
        if (cgpa >= 4.50) return "First Class Honours";
        if (cgpa >= 3.50) return "Second Class Honours (Upper Division)";
        if (cgpa >= 2.40) return "Second Class Honours (Lower Division)";
        if (cgpa >= 1.50) return "Third Class Honours";
        if (cgpa >= 1.00) return "Pass";
        return "Fail / No Degree";
    }

    /**
     * Generates a Full Academic Transcript.
     */
    static async generateTranscript(data: {
        institution: { name: string; motto: string };
        student: { name: string; matricNumber: string; department: string; programme: string; dateOfBirth?: string; currentLevel?: number };
        sessions: {
            name: string;
            semesters: {
                number: string;
                results: { code: string; title: string; units: number; grade: string; gp: number }[];
                summary: { gpa: number; tcr: number; tce: number }
            }[]
        }[];
        finalCgpa: number;
        unitId?: number;
        registrarSignature?: { name: string; signatureUrl?: string };
    }) {
        const doc = new jsPDF('p', 'mm', 'a4') as jsPDFWithPlugin;
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const registrar = data.registrarSignature;

        // Helper to draw layout/border/watermark for a page
        const decoratePage = (pageDoc: jsPDF) => {
            pageDoc.setDrawColor(15, 23, 42); // Navy
            pageDoc.setLineWidth(1.0);
            pageDoc.rect(8, 8, pageWidth - 16, pageHeight - 16);
            pageDoc.setDrawColor(226, 232, 240);
            pageDoc.setLineWidth(0.3);
            pageDoc.rect(9.5, 9.5, pageWidth - 19, pageHeight - 19);

            // Watermark
            pageDoc.setTextColor(241, 245, 249);
            pageDoc.setFontSize(36);
            pageDoc.setFont('helvetica', 'bold');
            pageDoc.text('OFFICIAL ACADEMIC TRANSCRIPT', pageWidth / 2, pageHeight / 2, {
                align: 'center',
                angle: 45
            });
            // Reset state defaults
            pageDoc.setTextColor(0, 0, 0);
            pageDoc.setFont('helvetica', 'normal');
            pageDoc.setFontSize(10);
        };

        // Initialize first page layout
        decoratePage(doc);

        // Header
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text(data.institution.name.toUpperCase(), pageWidth / 2, 20, { align: 'center' });
        doc.setFontSize(10);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(100, 116, 139);
        doc.text(data.institution.motto, pageWidth / 2, 25, { align: 'center' });

        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(79, 70, 229);
        doc.text('OFFICIAL ACADEMIC TRANSCRIPT', pageWidth / 2, 33, { align: 'center' });

        // Student Profile Header Box
        let y = 39;
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.4);
        doc.rect(15, y, pageWidth - 30, 25, 'FD');

        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(148, 163, 184);

        // Labels
        doc.text('STUDENT NAME', 20, y + 6);
        doc.text('MATRIC NUMBER', 110, y + 6);
        doc.text('PROGRAMME', 20, y + 14);
        doc.text('DEPARTMENT', 110, y + 14);
        doc.text('DATE OF BIRTH', 20, y + 22);
        doc.text('ACADEMIC STATUS', 110, y + 22);

        // Values
        doc.setFontSize(9);
        doc.setTextColor(15, 23, 42);
        doc.text(data.student.name.toUpperCase(), 20, y + 10);
        doc.text(data.student.matricNumber.toUpperCase(), 110, y + 10);
        doc.text(data.student.programme.toUpperCase(), 20, y + 18);
        doc.text(data.student.department.toUpperCase(), 110, y + 18);
        doc.text(data.student.dateOfBirth || 'N/A', 20, y + 26);
        doc.text('GRADUATED', 110, y + 26);

        y += 34;

        // Iterate sessions & semesters
        for (let sIdx = 0; sIdx < data.sessions.length; sIdx++) {
            const session = data.sessions[sIdx];
            for (let semIdx = 0; semIdx < session.semesters.length; semIdx++) {
                const semester = session.semesters[semIdx];

                // Page boundary check
                if (y > 225) {
                    doc.addPage();
                    decoratePage(doc);
                    y = 20;
                }

                doc.setFontSize(10);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(15, 23, 42);
                doc.text(`${session.name} ACADEMIC SESSION - SEMESTER ${semester.number}`, 15, y);
                y += 2;

                const tableBody = semester.results.map(r => [
                    r.code,
                    r.title,
                    r.units.toString(),
                    r.grade,
                    r.gp.toFixed(2)
                ]);

                (doc as any).autoTable({
                    startY: y,
                    head: [['CODE', 'COURSE TITLE', 'CREDIT UNITS', 'GRADE', 'GRADE POINT']],
                    body: tableBody,
                    theme: 'grid',
                    headStyles: { fillColor: [71, 85, 105], textColor: 255, fontStyle: 'bold', fontSize: 8 },
                    styles: { fontSize: 7.5, cellPadding: 2, textColor: [51, 65, 85] },
                    columnStyles: {
                        0: { fontStyle: 'bold', cellWidth: 25 },
                        2: { halign: 'center', cellWidth: 25 },
                        3: { halign: 'center', fontStyle: 'bold', textColor: [79, 70, 229], cellWidth: 20 },
                        4: { halign: 'center', cellWidth: 25 }
                    },
                    margin: { left: 15, right: 15 }
                });

                y = (doc as any).lastAutoTable.finalY + 4;
                doc.setFontSize(8);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(15, 23, 42);
                doc.text(`Semester Summary: GPA: ${semester.summary.gpa.toFixed(2)} | TCR: ${semester.summary.tcr} | TCE: ${semester.summary.tce}`, 15, y);
                y += 8;
            }
        }

        // Final standing block
        if (y > 200) {
            doc.addPage();
            decoratePage(doc);
            y = 20;
        }

        y += 4;
        doc.setFillColor(241, 245, 249);
        doc.rect(15, y, pageWidth - 30, 22, 'F');
        doc.setDrawColor(79, 70, 229);
        doc.setLineWidth(0.5);
        doc.line(15, y, pageWidth - 15, y);
        doc.line(15, y + 22, pageWidth - 15, y + 22);

        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text('CUMULATIVE PERFORMANCE SUMMARY', 20, y + 6);
        
        doc.setFontSize(9.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(51, 65, 85);
        doc.text(`FINAL CGPA:`, 20, y + 14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(79, 70, 229);
        doc.text(`${data.finalCgpa.toFixed(2)}`, 45, y + 14);

        const classOfDegree = DocumentService.getClassOfDegree(data.finalCgpa);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(51, 65, 85);
        doc.text(`CLASS OF DEGREE:`, 90, y + 14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(16, 185, 129); // emerald-500
        doc.text(`${classOfDegree.toUpperCase()}`, 128, y + 14);

        y += 30;

        // Registrar verification block
        if (y > 235) {
            doc.addPage();
            decoratePage(doc);
            y = 25;
        }

        // Registrar Digital Signature Seal
        doc.setFillColor(240, 253, 250);
        doc.setDrawColor(20, 184, 166);
        doc.setLineWidth(0.5);
        doc.rect(15, y, 65, 10, 'FD');
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(13, 148, 136);
        doc.text('OFFICIALLY CERTIFIED COPY', 47.5, y + 6.5, { align: 'center' });

        if (registrar?.signatureUrl) {
            try {
                doc.addImage(registrar.signatureUrl, 'PNG', pageWidth - 80, y - 12, 45, 18);
            } catch (e) {
                console.error("Registrar signature failed to load in PDF:", e);
            }
        }

        doc.setDrawColor(203, 213, 225);
        doc.setLineWidth(0.5);
        doc.line(pageWidth - 85, y + 10, pageWidth - 15, y + 10);

        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text(registrar?.name?.toUpperCase() || 'REGISTRAR', pageWidth - 50, y + 14.5, { align: 'center' });

        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(148, 163, 184);
        doc.text('UNIVERSITY REGISTRAR / SIGNATURE DATE', pageWidth - 50, y + 18, { align: 'center' });

        // Date of Issuance info
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text(`Transcript Issue Date: ${new Date().toLocaleDateString()}`, 15, y + 18);

        // Add dynamic page numbers
        const totalPages = (doc as any).internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            doc.setFontSize(7.5);
            doc.setTextColor(148, 163, 184);
            doc.text(`Page ${i} of ${totalPages}`, pageWidth - 15, pageHeight - 12, { align: 'right' });
            doc.text(`Official Academic Transcript • ${data.student.name.toUpperCase()} (${data.student.matricNumber.toUpperCase()})`, 15, pageHeight - 12);
        }

        doc.save(`Transcript_${data.student.matricNumber}.pdf`);
    }

    static k12TemplateRegistry: Record<string, (doc: jsPDF, data: any) => Promise<void> | void> = {
        '001a': (doc, data) => DocumentService.renderRowelSchoolsReport(doc, data),
        '001': (doc, data) => DocumentService.renderRowelSchoolsReport(doc, data),
        'rowel_schools': (doc, data) => DocumentService.renderRowelSchoolsReport(doc, data),
        '002': (doc, data) => DocumentService.renderRowelSchools002Report(doc, data),
        '002a': (doc, data) => DocumentService.renderRowelSchools002Report(doc, data),
        '002b': (doc, data) => DocumentService.renderRowelSchools002Report(doc, data),
        '003': (doc, data) => DocumentService.renderK12Report003(doc, data),
        '004': (doc, data) => DocumentService.renderCaramotSchool004Report(doc, data),
        '005': (doc, data) => DocumentService.renderAdaptiveReport005(doc, data),
        '006': (doc, data) => DocumentService.renderMinimalistReport006(doc, data),
        'tertiary_semester': (doc, data) => DocumentService.renderTertiarySemesterResult(doc, data),
        'default': (doc, data) => DocumentService.renderDefaultK12Report(doc, data)
    };

    static registerK12Template(code: string, renderer: (doc: jsPDF, data: any) => Promise<void> | void) {
        DocumentService.k12TemplateRegistry[code] = renderer;
    }

    /**
     * Generates a K-12 student report card PDF based on the requested theme/template archetype.
     */
    static async generateK12ReportCardPDF(data: {
        student: { name: string; matricNumber: string; admissionNumber?: string; gender: string; currentLevel: number; groupName?: string; imageUrl?: string; lastName?: string; firstName?: string; otherNames?: string };
        results: { code: string; title: string; caScore: number; examScore: number; totalScore: number; grade: string; rankClass: string; rankLevel: string; teacherRemark: string }[];
        behaviors: { name: string; category: string; score: number }[];
        remarks: { classTeacherComment: string; headTeacherComment: string; daysOpen: number; daysPresent: number; daysAbsent: number; nextTermStarts: string; nextTermEnds: string } | null;
        vitals: { height: number; weight: number } | null;
        term: string;
        session: string;
        templateCode?: string;
    }, saveToFile = true): Promise<jsPDF> {
        const doc = new jsPDF('p', 'mm', 'a4') as jsPDFWithPlugin;
        const template = data.templateCode || 'rowel_schools';
        const renderer = DocumentService.k12TemplateRegistry[template] || DocumentService.k12TemplateRegistry['default'];

        await renderer(doc, data);

        if (saveToFile) {
            doc.save(`Report_Card_${data.student.admissionNumber || data.student.matricNumber}_Term${data.term}.pdf`);
        }
        return doc;
    }

    /**
     * Generates a combined K-12 report card PDF for a class (all students on separate pages).
     */
    static async generateK12ClassReportPDF(
        studentsData: any[],
        sessionName: string,
        termLabel: string,
        templateCode = 'rowel_schools',
        saveToFile = true
    ): Promise<jsPDF> {
        const doc = new jsPDF('p', 'mm', 'a4') as jsPDFWithPlugin;
        const renderer = DocumentService.k12TemplateRegistry[templateCode] || DocumentService.k12TemplateRegistry['default'];

        for (let i = 0; i < studentsData.length; i++) {
            if (i > 0) {
                doc.addPage();
            }
            const data = {
                ...studentsData[i],
                session: sessionName,
                term: termLabel,
                templateCode
            };
            await renderer(doc, data);
        }

        if (saveToFile) {
            doc.save(`Class_Report_Cards_Term${termLabel}_Session${sessionName.replace(/\//g, '_')}.pdf`);
        }
        return doc;
    }

    private static async renderRowelSchoolsReport(doc: jsPDF, data: any) {
        // Page double border
        doc.setDrawColor(21, 128, 61); // Dark green
        doc.setLineWidth(1.2);
        doc.rect(5, 5, 200, 287);
        doc.setLineWidth(0.4);
        doc.rect(6.5, 6.5, 197, 284);

        // Header
        // Circular Vector Logo
        doc.setFillColor(21, 128, 61);
        doc.circle(22, 22, 11, 'F');
        doc.setFontSize(5.5);
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.text('THE ROWEL', 22, 20.5, { align: 'center' });
        doc.text('SCHOOLS', 22, 24.5, { align: 'center' });

        // Title info
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(18);
        doc.setTextColor(30, 41, 59);
        doc.text('The Rowel Schools', 78, 19, { align: 'center' });

        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(71, 85, 105);
        doc.text('Federal School of Statistics, Along Ajibode Shasha road, Behind NISER, Shasha-Ojoo, Ibadan.', 78, 23.5, { align: 'center' });
        doc.text('07031055352; 08133004845', 78, 27.5, { align: 'center' });

        // Term/Session box header
        doc.setFillColor(241, 245, 249);
        doc.rect(40, 31, 76, 8, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(30, 41, 59);
        const termLabel = data.term === '1' ? 'FIRST TERM' : data.term === '2' ? 'SECOND TERM' : 'THIRD TERM';
        doc.text(`${termLabel} ${data.session} ACADEMIC SESSION`, 78, 36.5, { align: 'center' });

        // Student metadata block (top right)
        doc.setDrawColor(203, 213, 225);
        doc.setLineWidth(0.3);
        doc.rect(130, 9, 65, 31);
        doc.line(178, 9, 178, 40);

        // Circular avatar
        doc.setFillColor(226, 232, 240);
        doc.circle(186.5, 20, 6, 'F');
        doc.setFillColor(148, 163, 184);
        doc.circle(186.5, 23, 8, 'F');
        doc.setFillColor(255, 255, 255);
        doc.circle(186.5, 23, 8, 'F');

        doc.setFontSize(6.5);
        doc.setTextColor(30, 41, 59);
        let infoY = 13;
        doc.setFont('helvetica', 'bold');
        doc.text('SURNAME:', 132, infoY);
        doc.setFont('helvetica', 'normal');
        doc.text(data.student.lastName?.toUpperCase() || 'OLADIPO', 148, infoY);

        infoY += 5;
        doc.setFont('helvetica', 'bold');
        doc.text('OTHER NAMES:', 132, infoY);
        doc.setFont('helvetica', 'normal');
        doc.text(`${data.student.firstName || ''} ${data.student.otherNames || ''}`.toUpperCase().trim() || 'RADIYYAH TENIOLA', 151, infoY);

        infoY += 5;
        doc.setFont('helvetica', 'bold');
        doc.text('ADMISSION NO:', 132, infoY);
        doc.setFont('helvetica', 'normal');
        doc.text(data.student.admissionNumber || data.student.matricNumber || 'TRC/024/0001', 152, infoY);

        infoY += 5;
        doc.setFont('helvetica', 'bold');
        doc.text('GENDER:', 132, infoY);
        doc.setFont('helvetica', 'normal');
        doc.text(data.student.gender?.toUpperCase() || 'FEMALE', 145, infoY);

        infoY += 5;
        doc.setFont('helvetica', 'bold');
        doc.text('CLASS:', 132, infoY);
        doc.setFont('helvetica', 'normal');
        doc.text(`${data.student.currentLevel} ${data.student.groupName || ''}`.trim() || 'JSS 2A', 145, infoY);

        infoY += 5;
        doc.setFont('helvetica', 'bold');
        doc.text('NO IN CLASS:', 132, infoY);
        doc.setFont('helvetica', 'normal');
        const classCount = (data.templateCode === '001a' && data.term === '3') ? '18' : '6';
        doc.text(classCount, 150, infoY);

        // Section 1: ATTENDANCE
        let y = 43;
        doc.setDrawColor(30, 41, 59);
        doc.setLineWidth(0.4);
        doc.rect(10, y, 190, 10);
        
        doc.setFillColor(248, 250, 252);
        doc.rect(10, y, 190, 4, 'F');
        doc.setFontSize(6);
        doc.setFont('helvetica', 'bold');
        doc.text('1. ATTENDANCE', 105, y + 3, { align: 'center' });
        
        y += 4;
        doc.line(10, y, 200, y);
        doc.line(55, y, 55, y + 6);
        doc.line(105, y, 105, y + 6);
        doc.line(155, y, 155, y + 6);
        doc.line(180, y, 180, y + 6);
        
        doc.setFontSize(5.5);
        doc.text('NUMBER OF TIMES SCHOOL OPENED', 32.5, y + 2.2, { align: 'center' });
        doc.text('NUMBER OF TIMES PRESENT', 80, y + 2.2, { align: 'center' });
        doc.text('NUMBER OF TIMES ABSENT', 130, y + 2.2, { align: 'center' });
        doc.text('POSITION', 167.5, y + 2.2, { align: 'center' });
        
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.text(data.remarks?.daysOpen?.toString() || '122', 32.5, y + 5.2, { align: 'center' });
        doc.text(data.remarks?.daysPresent?.toString() || '122', 80, y + 5.2, { align: 'center' });
        doc.text(data.remarks?.daysAbsent?.toString() || '0', 130, y + 5.2, { align: 'center' });
        const positionStr = (data.templateCode === '001a' && data.term === '3') 
            ? (data.results[0]?.rankLevel || '1st') 
            : (data.results[0]?.rankClass || '1st');
        doc.text(positionStr, 167.5, y + 5.2, { align: 'center' });

        // Section 2: Physical Dev & Affective Domain
        y += 9;
        doc.rect(10, y, 90, 24);
        doc.rect(105, y, 95, 24);
        
        doc.setFontSize(6);
        doc.setFont('helvetica', 'bold');
        doc.text('2. PHYSICAL DEVELOPMENT AND HEALTH', 55, y + 3.5, { align: 'center' });
        doc.text('AFFECTIVE DOMAIN', 152.5, y + 3.5, { align: 'center' });
        
        doc.line(10, y + 5, 100, y + 5);
        doc.line(105, y + 5, 200, y + 5);

        // Height & Weight structure
        doc.line(55, y + 5, 55, y + 24);
        doc.text('HEIGHT', 32.5, y + 8, { align: 'center' });
        doc.text('WEIGHT', 77.5, y + 8, { align: 'center' });
        doc.line(10, y + 9.5, 100, y + 9.5);

        doc.line(32.5, y + 9.5, 32.5, y + 24);
        doc.line(77.5, y + 9.5, 77.5, y + 24);

        doc.setFontSize(5);
        doc.text('Beginning of Term', 21.25, y + 12.5, { align: 'center' });
        doc.text('End of Term', 43.75, y + 12.5, { align: 'center' });
        doc.text('Beginning of Term', 66.25, y + 12.5, { align: 'center' });
        doc.text('End of Term', 88.75, y + 12.5, { align: 'center' });
        doc.line(10, y + 14, 100, y + 14);

        // Vitals values
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.text(data.vitals?.height ? `${data.vitals.height} m` : 'm', 21.25, y + 19.5, { align: 'center' });
        doc.text(data.vitals?.height ? `${data.vitals.height} m` : 'm', 43.75, y + 19.5, { align: 'center' });
        doc.text(data.vitals?.weight ? `${data.vitals.weight} kg` : 'kg', 66.25, y + 19.5, { align: 'center' });
        doc.text(data.vitals?.weight ? `${data.vitals.weight} kg` : 'kg', 88.75, y + 19.5, { align: 'center' });

        // Affective domains
        const defaultTraits = [
            { name: 'Punctuality', score: 'Very Good' },
            { name: 'Neatness', score: 'Excellent' },
            { name: 'Cooperation with others', score: 'Very Good' },
            { name: 'Leadership Trait', score: 'Very Good' },
            { name: 'Helping Others', score: 'Good' },
            { name: 'Emotional Stability', score: 'Good' },
            { name: 'Relationship with teachers', score: 'Good' }
        ];

        const behaviorsList = data.behaviors.filter((b: any) => b.category === 'affective').slice(0, 7);
        const activeTraits = behaviorsList.length > 0 
            ? behaviorsList.map((b: any) => ({ name: b.name, score: b.score === 5 ? 'Excellent' : b.score === 4 ? 'Very Good' : b.score === 3 ? 'Good' : b.score === 2 ? 'Fair' : 'Poor' }))
            : defaultTraits;

        let rowY = y + 7.5;
        doc.setFontSize(5.5);
        activeTraits.forEach((item: any) => {
            doc.setFont('helvetica', 'bold');
            doc.text(item.name.toUpperCase(), 108, rowY);
            doc.setFont('helvetica', 'normal');
            doc.text(item.score.toUpperCase(), 175, rowY);
            doc.setDrawColor(241, 245, 249);
            doc.line(105, rowY + 1.2, 200, rowY + 1.2);
            rowY += 2.3;
        });

        // Section 3: PERFORMANCE IN SUBJECTS
        y += 27;
        const labelWidth = 35;
        const tableW = 190;
        const subW = (tableW - labelWidth) / Math.max(10, data.results.length);

        doc.setDrawColor(30, 41, 59);
        doc.setLineWidth(0.4);
        doc.rect(10, y, tableW, 90);

        doc.setFillColor(248, 250, 252);
        doc.rect(10, y, tableW, 4, 'F');
        doc.setFontSize(6);
        doc.setFont('helvetica', 'bold');
        doc.text('3. PERFORMANCE IN SUBJECTS', 105, y + 3, { align: 'center' });

        let cellY = y + 4;
        const headerH = 34;
        doc.line(10, cellY + headerH, 200, cellY + headerH);
        doc.line(10 + labelWidth, cellY, 10 + labelWidth, cellY + 90 - 4);

        // Subject vertical labels
        data.results.forEach((r: any, idx: number) => {
            const colX = 10 + labelWidth + (idx * subW);
            doc.line(colX, cellY, colX, cellY + 90 - 4);

            doc.saveGraphicsState();
            doc.setFontSize(5.5);
            doc.setFont('helvetica', 'bold');
            const textX = colX + (subW / 2) + 1;
            const textY = cellY + headerH - 3;
            doc.text(r.title.toUpperCase(), textX, textY, { angle: 90 });
            doc.restoreGraphicsState();
        });

        const rowsConfig = [
            { label: 'Continuous Assessment', obtainable: 40, height: 6, key: 'caScore' },
            { label: 'Exam Score', obtainable: 60, height: 6, key: 'examScore' },
            { label: 'Weighted Average', obtainable: 100, height: 6, key: 'totalScore' },
            { label: 'Grade', obtainable: null, height: 6, key: 'grade' },
            { label: 'Remark', obtainable: null, height: 16, key: 'remark' }
        ];

        cellY += headerH;
        doc.setFontSize(6);
        rowsConfig.forEach((row) => {
            doc.line(10, cellY + row.height, 200, cellY + row.height);
            doc.setFont('helvetica', 'bold');
            doc.text(row.label, 12, cellY + (row.height / 2) + 1);
            
            if (row.obtainable) {
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(4.5);
                doc.text(`(Obtainable: ${row.obtainable})`, 12 + doc.getTextWidth(row.label) + 2, cellY + (row.height / 2) + 1);
                doc.setFontSize(6);
            }

            data.results.forEach((r: any, idx: number) => {
                const colX = 10 + labelWidth + (idx * subW);
                const centerValX = colX + (subW / 2);

                let scoreStr = '';
                if (row.key === 'caScore') scoreStr = r.caScore.toFixed(0);
                else if (row.key === 'examScore') scoreStr = r.examScore.toFixed(0);
                else if (row.key === 'totalScore') scoreStr = r.totalScore.toFixed(0);
                else if (row.key === 'grade') scoreStr = r.grade;
                else if (row.key === 'remark') {
                    const gradeScore = r.totalScore;
                    scoreStr = gradeScore >= 90 ? 'OUTSTANDING' : gradeScore >= 80 ? 'EXCELLENT' : gradeScore >= 70 ? 'VERY GOOD' : gradeScore >= 60 ? 'GOOD' : gradeScore >= 50 ? 'PASS' : 'FAIL';
                }

                doc.setFont('helvetica', row.key === 'totalScore' || row.key === 'grade' ? 'bold' : 'normal');
                if (row.key === 'remark') {
                    doc.saveGraphicsState();
                    doc.setFontSize(4);
                    doc.text(scoreStr, centerValX + 1.2, cellY + row.height - 2, { angle: 90 });
                    doc.restoreGraphicsState();
                } else {
                    doc.text(scoreStr, centerValX, cellY + (row.height / 2) + 1, { align: 'center' });
                }
            });

            cellY += row.height;
        });

        // Statistics row
        // cellY = y + 74
        doc.line(55, cellY, 55, cellY + 8);
        doc.line(105, cellY, 105, cellY + 8);
        doc.line(155, cellY, 155, cellY + 8);

        doc.setFontSize(5.5);
        doc.setFont('helvetica', 'bold');
        doc.text('Number of Subjects:', 32.5, cellY + 3.2, { align: 'center' });
        doc.text('Total Marks Obtainable:', 80, cellY + 3.2, { align: 'center' });
        doc.text('Total Marks Obtained:', 130, cellY + 3.2, { align: 'center' });
        doc.text('Percentage:', 177.5, cellY + 3.2, { align: 'center' });

        const totalSubjects = data.results.length;
        const totalMarksObtainable = totalSubjects * 100;
        const totalMarksObtained = data.results.reduce((s: number, r: any) => s + r.totalScore, 0);
        const scorePercentage = totalMarksObtainable > 0 ? Math.round((totalMarksObtained / totalMarksObtainable) * 100) : 0;

        doc.setFontSize(7.5);
        doc.text(totalSubjects.toString(), 32.5, cellY + 6.8, { align: 'center' });
        doc.text(totalMarksObtainable.toString(), 80, cellY + 6.8, { align: 'center' });
        doc.text(totalMarksObtained.toFixed(0), 130, cellY + 6.8, { align: 'center' });
        doc.text(`${scorePercentage}%`, 177.5, cellY + 6.8, { align: 'center' });

        // Section 4 & 5: SPORTS and CLUBS
        y += 94;
        doc.rect(10, y, tableW, 20);
        
        doc.setFillColor(248, 250, 252);
        doc.rect(10, y, 65, 4, 'F');
        doc.setFontSize(6);
        doc.setFont('helvetica', 'bold');
        doc.text('4. SPORTS', 42.5, y + 3, { align: 'center' });

        doc.rect(75, y, 125, 4, 'F');
        doc.text('5. CLUBS, YOUTH ORGANIZATION ETC', 137.5, y + 3, { align: 'center' });
        
        doc.line(75, y, 75, y + 20);
        doc.line(10, y + 4, 200, y + 4);

        // Sports dividers
        doc.line(10, y + 12, 75, y + 12);
        doc.line(26.25, y + 4, 26.25, y + 20);
        doc.line(42.5, y + 4, 42.5, y + 20);
        doc.line(58.75, y + 4, 58.75, y + 20);

        doc.setFontSize(5);
        doc.text('Indoor Games', 18.12, y + 7.5, { align: 'center' });
        doc.text('Ball Games', 34.37, y + 7.5, { align: 'center' });
        doc.text('Combative', 50.62, y + 7.5, { align: 'center' });
        doc.text('Track & Field', 66.87, y + 7.5, { align: 'center' });

        doc.setFontSize(7.5);
        doc.text('Y', 18.12, y + 17, { align: 'center' });
        doc.text('Y', 34.37, y + 17, { align: 'center' });
        doc.text('-', 50.62, y + 17, { align: 'center' });
        doc.text('Y', 66.87, y + 17, { align: 'center' });

        // Clubs Dividers
        doc.line(115, y + 4, 115, y + 20);
        doc.line(155, y + 4, 155, y + 20);

        doc.setFontSize(5);
        doc.text('ORGANIZATION', 95, y + 7.5, { align: 'center' });
        doc.text('OFFICE HELD', 135, y + 7.5, { align: 'center' });
        doc.text('SIGNIFICANT CONTRIBUTION', 177.5, y + 7.5, { align: 'center' });

        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.text('Red Cross Society', 95, y + 15, { align: 'center' });
        doc.text('Member', 135, y + 15, { align: 'center' });
        doc.text('Active support in first aid training', 177.5, y + 15, { align: 'center' });

        // Section 6: Comments & Signatures
        const usesQuran = data.templateCode === '001a' && data.quranMemorization;
        if (usesQuran) {
            y += 24;
            doc.setLineWidth(0.4);
            doc.rect(10, y, tableW, 10);
            doc.setFillColor(248, 250, 252);
            doc.rect(10, y, tableW, 4, 'F');
            
            doc.setFontSize(5.5);
            doc.setFont('helvetica', 'bold');
            doc.text("QUR'AN MEMORIZATION", 12, y + 3);
            
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(5);
            doc.text(`JUZ: ${data.quranMemorization.juzId || 'Juz 30'}`, 12, y + 7.5);
            doc.text(`READ ABILITY: ${data.quranMemorization.readingAbility || 'Very Good'}`, 65, y + 7.5);
            doc.text(`REMARK: ${data.quranMemorization.remark || 'Fluent recitation'}`, 120, y + 7.5);
            
            y += 10;
        }

        y += usesQuran ? 4 : 24;
        doc.setLineWidth(0.4);
        doc.rect(10, y, tableW, 36);

        doc.line(10, y + 18, 200, y + 18);
        doc.line(145, y, 145, y + 36);
        doc.line(105, y + 18, 105, y + 36);

        // Teacher's remarks
        doc.setFontSize(6);
        doc.setFont('helvetica', 'bold');
        doc.text("CLASS TEACHER'S COMMENT", 12, y + 3.5);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.5);
        const teacherCom = data.remarks?.classTeacherComment || "HAS SHOWN EXCELLENT PROGRESS IN ACADEMICS. DILIGENT AND MOTIVATED.";
        const wrapTeacherCom = doc.splitTextToSize(teacherCom.toUpperCase(), 130);
        doc.text(wrapTeacherCom, 12, y + 7.5);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(5.5);
        doc.text("TEACHER'S SIGNATURE", 172.5, y + 3.5, { align: 'center' });
        doc.line(152, y + 14, 192, y + 14);

        // Principal's remarks
        doc.setFontSize(6);
        doc.text("PRINCIPAL'S COMMENT", 12, y + 21.5);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.5);
        const principalCom = data.remarks?.headTeacherComment || "AN OUTSTANDING TERM RESULT. KEEP STRIVING FOR TOP STANDARDS.";
        const wrapPrincipalCom = doc.splitTextToSize(principalCom.toUpperCase(), 90);
        doc.text(wrapPrincipalCom, 12, y + 25.5);

        // Next term starts
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6);
        doc.text("NEXT TERM BEGINS ON", 107, y + 21.5);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        const nextTermStart = data.remarks?.nextTermStarts || "APRIL 28TH, 2025";
        doc.text(nextTermStart, 107, y + 29);

        // Principal signature
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(5.5);
        doc.text("PRINCIPAL'S SIGNATURE", 172.5, y + 21.5, { align: 'center' });
        doc.line(152, y + 32, 192, y + 32);
    }

    private static async renderRowelSchools002Report(doc: jsPDF, data: any) {
        // Page double border
        doc.setDrawColor(2, 132, 199); // Sky Blue (0284c7)
        doc.setLineWidth(1.2);
        doc.rect(5, 5, 200, 287);
        doc.setLineWidth(0.4);
        doc.rect(6.5, 6.5, 197, 284);

        // Header
        // Circular Vector Logo
        doc.setFillColor(2, 132, 199);
        doc.circle(22, 22, 11, 'F');
        doc.setFontSize(5.5);
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        if (data.templateCode === '002') {
            doc.text('ROWEL', 22, 21.5, { align: 'center' });
            doc.text('SCHOOLS', 22, 24.5, { align: 'center' });
        } else {
            doc.text('ROWEL GROUP', 22, 21, { align: 'center' });
            doc.text('OF SCHOOLS', 22, 24, { align: 'center' });
        }

        // Title info
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(18);
        doc.setTextColor(30, 41, 59);
        const schoolTitle = data.templateCode === '002' ? 'The Rowel Schools' : 'Rowel Group of Schools';
        doc.text(schoolTitle, 78, 19, { align: 'center' });

        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(71, 85, 105);
        doc.text('Federal School of Statistics, Along Ajibode Shasha road, Behind NISER, Shasha-Ojoo, Ibadan.', 78, 23.5, { align: 'center' });
        doc.text('07031055352; 08133004845', 78, 27.5, { align: 'center' });

        // Term/Session box header
        doc.setFillColor(241, 245, 249);
        doc.rect(40, 31, 76, 8, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(30, 41, 59);
        const termLabel = data.term === '1' ? 'FIRST TERM' : data.term === '2' ? 'SECOND TERM' : 'THIRD TERM';
        doc.text(`${termLabel} ${data.session} ACADEMIC SESSION`, 78, 36.5, { align: 'center' });

        // Student metadata block (top right)
        doc.setDrawColor(203, 213, 225);
        doc.setLineWidth(0.3);
        doc.rect(130, 9, 65, 37);
        doc.line(178, 9, 178, 46);

        // Circular avatar
        doc.setFillColor(226, 232, 240);
        doc.circle(186.5, 20, 6, 'F');
        doc.setFillColor(148, 163, 184);
        doc.circle(186.5, 23, 8, 'F');
        doc.setFillColor(255, 255, 255);
        doc.circle(186.5, 23, 8, 'F');

        doc.setFontSize(6.5);
        doc.setTextColor(30, 41, 59);
        let infoY = 13;
        doc.setFont('helvetica', 'bold');
        doc.text('SURNAME:', 132, infoY);
        doc.setFont('helvetica', 'normal');
        doc.text(data.student.lastName?.toUpperCase() || 'OLADIPO', 148, infoY);

        infoY += 5;
        doc.setFont('helvetica', 'bold');
        doc.text('OTHER NAMES:', 132, infoY);
        doc.setFont('helvetica', 'normal');
        doc.text(`${data.student.firstName || ''} ${data.student.otherNames || ''}`.toUpperCase().trim() || 'RADIYYAH TENIOLA', 151, infoY);

        infoY += 5;
        doc.setFont('helvetica', 'bold');
        doc.text('ADMISSION NO:', 132, infoY);
        doc.setFont('helvetica', 'normal');
        doc.text(data.student.admissionNumber || data.student.matricNumber || 'TRC/024/0001', 152, infoY);

        infoY += 5;
        doc.setFont('helvetica', 'bold');
        doc.text('GENDER:', 132, infoY);
        doc.setFont('helvetica', 'normal');
        doc.text(data.student.gender?.toUpperCase() || 'FEMALE', 145, infoY);

        infoY += 5;
        doc.setFont('helvetica', 'bold');
        doc.text('CLASS:', 132, infoY);
        doc.setFont('helvetica', 'normal');
        doc.text(`${data.student.currentLevel} ${data.student.groupName || ''}`.trim() || 'JSS 2A', 145, infoY);

        infoY += 5;
        doc.setFont('helvetica', 'bold');
        doc.text('NO IN CLASS:', 132, infoY);
        doc.setFont('helvetica', 'normal');
        const classCount = data.templateCode === '002b' 
            ? (data.studentsInClassCount?.toString() || '18') 
            : (data.studentsInClassDivisionCount?.toString() || '6');
        doc.text(classCount, 150, infoY);

        infoY += 5;
        doc.setFont('helvetica', 'bold');
        doc.text('POSITION:', 132, infoY);
        doc.setFont('helvetica', 'normal');
        const positionStr = data.templateCode === '002a'
            ? (data.results[0]?.rankClass || '1st')
            : (data.results[0]?.rankLevel || '1st');
        doc.text(positionStr, 146, infoY);

        // Subject Table
        const termNumber = parseInt(data.term);
        const isThirdTerm = termNumber === 3;
        
        const headers = isThirdTerm
            ? [['Subject', 'CA1 (20)', 'CA2 (20)', 'Exam (60)', 'Term Total', '2nd Term', '1st Term', 'Annual Avg', 'Grade', 'Remark']]
            : [['Subject', 'CA1 (20)', 'CA2 (20)', 'Exam (60)', 'Term Total', 'Grade', 'Remark']];
            
        const body = data.results.map((r: any) => {
            const test1Val = r.test1 !== undefined ? r.test1 : (r.caScore ? Math.round(r.caScore / 2) : 0);
            const test2Val = r.test2 !== undefined ? r.test2 : (r.caScore ? r.caScore - test1Val : 0);
            
            const total = r.totalScore || 0;
            const grade = r.grade || 'N/A';
            const remark = r.teacherRemark || '';
            
            if (isThirdTerm) {
                return [
                    r.title.toUpperCase(),
                    test1Val.toString(),
                    test2Val.toString(),
                    (r.examScore || 0).toString(),
                    total.toString(),
                    (r.secondTermTotal || total).toString(),
                    (r.firstTermTotal || total).toString(),
                    (r.classAverage || total).toString(),
                    grade,
                    remark.toUpperCase()
                ];
            } else {
                return [
                    r.title.toUpperCase(),
                    test1Val.toString(),
                    test2Val.toString(),
                    (r.examScore || 0).toString(),
                    total.toString(),
                    grade,
                    remark.toUpperCase()
                ];
            }
        });

        (doc as any).autoTable({
            startY: 48,
            head: headers,
            body: body,
            theme: 'grid',
            headStyles: { fillColor: [2, 132, 199], textColor: 255, fontStyle: 'bold', fontSize: 8 },
            styles: { fontSize: 7.5, cellPadding: 2.5 },
            columnStyles: isThirdTerm 
                ? {
                    0: { cellWidth: 45, fontStyle: 'bold' },
                    1: { halign: 'center' },
                    2: { halign: 'center' },
                    3: { halign: 'center' },
                    4: { halign: 'center', fontStyle: 'bold' },
                    5: { halign: 'center' },
                    6: { halign: 'center' },
                    7: { halign: 'center', fontStyle: 'bold' },
                    8: { halign: 'center', fontStyle: 'bold' },
                    9: { cellWidth: 30 }
                  }
                : {
                    0: { cellWidth: 65, fontStyle: 'bold' },
                    1: { halign: 'center' },
                    2: { halign: 'center' },
                    3: { halign: 'center' },
                    4: { halign: 'center', fontStyle: 'bold' },
                    5: { halign: 'center', fontStyle: 'bold' },
                    6: { cellWidth: 40 }
                  }
        });

        let currentY = (doc as any).lastAutoTable.finalY + 6;

        // Stats Box
        const totalSubjects = data.results.length;
        const totalMarksObtainable = totalSubjects * 100;
        const totalMarksObtained = data.results.reduce((s: number, r: any) => s + (r.totalScore || 0), 0);
        const scorePercentage = totalMarksObtainable > 0 ? Math.round((totalMarksObtained / totalMarksObtainable) * 100) : 0;
        const daysOpen = data.remarks?.daysOpen || 122;
        const daysPresent = data.remarks?.daysPresent || 122;

        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.3);
        doc.rect(10, currentY, 190, 8, 'DF');

        doc.setFontSize(6.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(100, 116, 139);
        doc.text('OFFERED:', 15, currentY + 5.5);
        doc.setTextColor(15, 23, 42);
        doc.text(totalSubjects.toString(), 28, currentY + 5.5);

        doc.setTextColor(100, 116, 139);
        doc.text('OBTAINABLE:', 45, currentY + 5.5);
        doc.setTextColor(15, 23, 42);
        doc.text(totalMarksObtainable.toString(), 64, currentY + 5.5);

        doc.setTextColor(100, 116, 139);
        doc.text('OBTAINED:', 85, currentY + 5.5);
        doc.setTextColor(15, 23, 42);
        doc.text(totalMarksObtained.toFixed(0), 102, currentY + 5.5);

        doc.setTextColor(100, 116, 139);
        doc.text('PERCENTAGE:', 125, currentY + 5.5);
        doc.setTextColor(2, 132, 199);
        doc.text(`${scorePercentage}%`, 145, currentY + 5.5);

        doc.setTextColor(100, 116, 139);
        doc.text('ATTENDANCE:', 160, currentY + 5.5);
        doc.setTextColor(15, 23, 42);
        doc.text(`${daysPresent}/${daysOpen}`, 180, currentY + 5.5);

        currentY += 13;

        // Quran Box
        if (data.templateCode !== '002' && data.quranMemorization) {
            doc.setDrawColor(186, 230, 253);
            doc.setFillColor(240, 249, 255);
            doc.rect(10, currentY, 190, 16, 'DF');

            doc.setFontSize(7);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(3, 105, 161);
            doc.text("QUR'AN MEMORIZATION EVALUATION", 13, currentY + 4.5);

            doc.setFontSize(6.5);
            doc.setTextColor(100, 116, 139);
            doc.text('JUZ', 13, currentY + 9);
            doc.text('READ ABILITY', 70, currentY + 9);
            doc.text('REMARK', 120, currentY + 9);

            doc.setFont('helvetica', 'normal');
            doc.setTextColor(15, 23, 42);
            doc.text(data.quranMemorization.juzId || 'N/A', 13, currentY + 13.5);
            doc.text(data.quranMemorization.readingAbility || 'N/A', 70, currentY + 13.5);
            doc.text(data.quranMemorization.remark || 'N/A', 120, currentY + 13.5);

            currentY += 21;
        }

        // Ratings & Comments layout boxes
        const boxWidth = 92;
        const boxHeight = 35;
        
        doc.setDrawColor(226, 232, 240);
        doc.setFillColor(255, 255, 255);
        doc.rect(10, currentY, boxWidth, boxHeight, 'DF');

        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text('AFFECTIVE DOMAIN RATINGS', 14, currentY + 5);

        const behaviorsList = data.behaviors.filter((b: any) => b.category === 'affective').slice(0, 5);
        const defaultTraits = [
            { name: 'Punctuality', score: 5 },
            { name: 'Neatness', score: 5 },
            { name: 'Emotional Stability', score: 4 },
            { name: 'Cooperation', score: 4 },
            { name: 'Leadership', score: 4 }
        ];
        const ratings = behaviorsList.length > 0 ? behaviorsList : defaultTraits;

        doc.setFontSize(6.5);
        let ratingY = currentY + 11;
        ratings.forEach((r: any) => {
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(71, 85, 105);
            doc.text(r.name.toUpperCase(), 14, ratingY);
            
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(2, 132, 199);
            const scoreStr = r.score === 5 ? 'A' : r.score === 4 ? 'B' : r.score === 3 ? 'C' : r.score === 2 ? 'D' : 'E';
            doc.text(scoreStr, 92, ratingY, { align: 'right' });

            doc.setDrawColor(241, 245, 249);
            doc.line(10, ratingY + 2, 10 + boxWidth, ratingY + 2);
            ratingY += 5;
        });

        doc.setDrawColor(226, 232, 240);
        doc.rect(108, currentY, boxWidth, boxHeight, 'DF');

        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(100, 116, 139);
        doc.text('TEACHER COMMENT', 112, currentY + 5);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(15, 23, 42);
        const classTeacherComment = data.remarks?.classTeacherComment || "GOOD EFFORT. KEEP STRIVING.";
        const wrappedComment = doc.splitTextToSize(classTeacherComment.toUpperCase(), boxWidth - 8);
        doc.text(wrappedComment, 112, currentY + 9);

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(100, 116, 139);
        doc.text('NEXT TERM BEGINS', 112, currentY + 26);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(2, 132, 199);
        doc.setFontSize(7.5);
        doc.text(data.remarks?.nextTermStarts || 'APRIL 28, 2025', 112, currentY + 31);
    }

    private static async renderK12Report003(doc: jsPDF, data: any) {
        const pageWidth = doc.internal.pageSize.getWidth();
        const termNumber = parseInt(data.term);
        const isThirdTerm = termNumber === 3;

        // Header
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 41, 59); // Slate-800
        const schoolTitle = data.session ? 'Rowel Institution' : 'THE INSTITUTION NAME';
        doc.text(schoolTitle.toUpperCase(), pageWidth / 2, 20, { align: 'center' });

        doc.setFontSize(9);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(148, 163, 184); // Slate-400
        doc.text('Learning for Excellence', pageWidth / 2, 25, { align: 'center' });

        // Circular Logo in Center
        doc.setFillColor(241, 245, 249);
        doc.circle(pageWidth / 2, 36, 7, 'F');
        doc.setDrawColor(203, 213, 225);
        doc.setLineWidth(0.4);
        doc.circle(pageWidth / 2, 36, 7, 'S');

        // Draw basic school icon using lines
        doc.setDrawColor(100, 116, 139);
        doc.line(pageWidth / 2 - 3, 37, pageWidth / 2 + 3, 37);
        doc.line(pageWidth / 2 - 3, 37, pageWidth / 2, 33);
        doc.line(pageWidth / 2, 33, pageWidth / 2 + 3, 37);
        doc.line(pageWidth / 2 - 1.5, 37, pageWidth / 2 - 1.5, 39);
        doc.line(pageWidth / 2 + 1.5, 37, pageWidth / 2 + 1.5, 39);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 41, 59);
        const termLabel = termNumber === 1 ? "FIRST TERM" : termNumber === 2 ? "SECOND TERM" : "THIRD TERM";
        doc.text(`${termLabel} REPORT SHEET`, pageWidth / 2, 49, { align: 'center' });

        // Student metadata block
        doc.setFillColor(248, 250, 252);
        doc.rect(10, 54, 190, 16, 'F');
        doc.setDrawColor(226, 232, 240);
        doc.rect(10, 54, 190, 16, 'S');

        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(100, 116, 139);
        doc.text('STUDENT NAME:', 14, 60);
        doc.setTextColor(30, 41, 59);
        doc.text(data.student.name.toUpperCase(), 38, 60);

        doc.setTextColor(100, 116, 139);
        doc.text('MATRIC / ADM NO:', 110, 60);
        doc.setTextColor(30, 41, 59);
        doc.text((data.student.admissionNumber || data.student.matricNumber || '').toUpperCase(), 138, 60);

        doc.setTextColor(100, 116, 139);
        doc.text('CLASS LEVEL:', 14, 66);
        doc.setTextColor(30, 41, 59);
        doc.text(`${data.student.currentLevel} ${data.student.groupName || ''}`.toUpperCase().trim(), 34, 66);

        doc.setTextColor(100, 116, 139);
        doc.text('CLASS SIZE:', 110, 66);
        doc.setTextColor(30, 41, 59);
        doc.text((data.studentsInClassDivisionCount || 6).toString(), 130, 66);

        // Purpose statement box
        doc.setFillColor(240, 249, 255); // light blue
        doc.setDrawColor(186, 230, 253);
        doc.rect(10, 74, 190, 15, 'DF');

        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(3, 105, 161); // sky-700
        doc.text('Purpose Statement', 14, 79);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.5);
        doc.setTextColor(7, 89, 133);
        const purposeText = "The purpose of this report sheet is to communicate the pupil's progress towards learning standards and demonstrating work and life skills. This feedback will support a partnership among pupils, parents and teachers in setting goals and monitoring progress towards meeting the established standards.";
        const wrappedPurpose = doc.splitTextToSize(purposeText, 182);
        doc.text(wrappedPurpose, 14, 83);

        // Table
        const headers = isThirdTerm
            ? [['Subject Name', 'Test (40)', 'Exam (60)', 'Total (100)', '2nd Term', '1st Term', 'Ann Avg', 'Grade', 'Highest', 'Lowest', 'Average', 'Position']]
            : [['Subject Name', 'Test (40)', 'Exam (60)', 'Total (100)', 'Grade', 'Highest', 'Lowest', 'Average', 'Position']];

        const body = data.results.map((r: any) => {
            const testVal = r.test1 !== undefined ? r.test1 : (r.caScore || 0);
            const total = r.totalScore || 0;
            const grade = r.grade || 'C';
            const highest = r.highestScore || total;
            const lowest = r.lowestScore || total;
            const avg = r.classAverage || total;
            const pos = r.rankClass || '1/6';

            if (isThirdTerm) {
                return [
                    r.title.toUpperCase(),
                    testVal.toString(),
                    (r.examScore || 0).toString(),
                    total.toString(),
                    (r.secondTermTotal || total).toString(),
                    (r.firstTermTotal || total).toString(),
                    avg.toString(),
                    grade,
                    highest.toString(),
                    lowest.toString(),
                    avg.toString(),
                    pos
                ];
            } else {
                return [
                    r.title.toUpperCase(),
                    testVal.toString(),
                    (r.examScore || 0).toString(),
                    total.toString(),
                    grade,
                    highest.toString(),
                    lowest.toString(),
                    avg.toString(),
                    pos
                ];
            }
        });

        (doc as any).autoTable({
            startY: 93,
            head: headers,
            body: body,
            theme: 'grid',
            headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: 'bold', fontSize: 7.5 },
            styles: { fontSize: 7, cellPadding: 2 },
            columnStyles: isThirdTerm
                ? {
                    0: { cellWidth: 35, fontStyle: 'bold' },
                    1: { halign: 'center' },
                    2: { halign: 'center' },
                    3: { halign: 'center', fontStyle: 'bold' },
                    4: { halign: 'center' },
                    5: { halign: 'center' },
                    6: { halign: 'center', fontStyle: 'bold' },
                    7: { halign: 'center', fontStyle: 'bold' },
                    8: { halign: 'center' },
                    9: { halign: 'center' },
                    10: { halign: 'center' },
                    11: { halign: 'center' }
                  }
                : {
                    0: { cellWidth: 50, fontStyle: 'bold' },
                    1: { halign: 'center' },
                    2: { halign: 'center' },
                    3: { halign: 'center', fontStyle: 'bold' },
                    4: { halign: 'center', fontStyle: 'bold' },
                    5: { halign: 'center' },
                    6: { halign: 'center' },
                    7: { halign: 'center' },
                    8: { halign: 'center' }
                  }
        });

        let currentY = (doc as any).lastAutoTable.finalY + 6;

        // Performance Stats
        const totalSubjects = data.results.length;
        const totalMarksObtainable = totalSubjects * 100;
        const totalMarksObtained = data.results.reduce((s: number, r: any) => s + (r.totalScore || 0), 0);
        const scorePercentage = totalMarksObtainable > 0 ? Math.round((totalMarksObtained / totalMarksObtainable) * 100) : 0;

        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(226, 232, 240);
        doc.rect(10, currentY, 190, 8, 'DF');

        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(100, 116, 139);
        doc.text('NO. OF SUBJECTS:', 15, currentY + 5.5);
        doc.setTextColor(30, 41, 59);
        doc.text(totalSubjects.toString(), 40, currentY + 5.5);

        doc.setTextColor(100, 116, 139);
        doc.text('OBTAINABLE MARKS:', 60, currentY + 5.5);
        doc.setTextColor(30, 41, 59);
        doc.text(totalMarksObtainable.toString(), 92, currentY + 5.5);

        doc.setTextColor(100, 116, 139);
        doc.text('MARKS OBTAINED:', 115, currentY + 5.5);
        doc.setTextColor(30, 41, 59);
        doc.text(totalMarksObtained.toFixed(0), 143, currentY + 5.5);

        doc.setTextColor(100, 116, 139);
        doc.text('AVERAGE:', 160, currentY + 5.5);
        doc.setTextColor(79, 70, 229); // indigo-600
        doc.text(`${scorePercentage}%`, 178, currentY + 5.5);

        currentY += 14;

        // Comments
        doc.setDrawColor(226, 232, 240);
        doc.setFillColor(255, 255, 255);
        doc.rect(10, currentY, 92, 20, 'DF');
        doc.rect(108, currentY, 92, 20, 'DF');

        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(100, 116, 139);
        doc.text('TEACHER COMMENT', 14, currentY + 5.5);
        doc.text('HOS COMMENT', 112, currentY + 5.5);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(71, 85, 105);
        const classTeacherComment = data.remarks?.classTeacherComment || "GOOD WORK.";
        const headTeacherComment = data.remarks?.headTeacherComment || "AN EXCELLENT PERFORMANCE.";

        doc.text(doc.splitTextToSize(classTeacherComment, 84), 14, currentY + 11);
        doc.text(doc.splitTextToSize(headTeacherComment, 84), 112, currentY + 11);
    }

    private static async renderCaramotSchool004Report(doc: jsPDF, data: any) {
        const termNumber = parseInt(data.term);
        const isThirdTerm = termNumber === 3;

        // Blue header banner border
        doc.setDrawColor(29, 78, 216); // Blue
        doc.setLineWidth(1.2);
        doc.rect(5, 5, 200, 287);

        // Header logo
        doc.setDrawColor(29, 78, 216);
        doc.setLineWidth(0.4);
        doc.circle(25, 22, 11, 'S');
        doc.setFontSize(6);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(29, 78, 216);
        doc.text('CARAMOT', 25, 20.5, { align: 'center' });
        doc.text('SCHOOL', 25, 24.5, { align: 'center' });

        // School Title info
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(45, 45, 108); // Dark blue #2d2d6c
        doc.text('CARAMOT SCHOOL', 85, 19);

        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(71, 85, 105);
        doc.text('Creche * Nursery * Primary/Basic Education', 85, 24);
        doc.text('Tel: 0803-XXXX-XXX | E-mail: info@caramotschools.com', 85, 28);

        // Term/Session box header (top right)
        doc.setFillColor(239, 246, 255);
        doc.rect(148, 11, 47, 18, 'F');
        doc.rect(148, 11, 47, 18, 'S');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(29, 78, 216);
        const termLabel = termNumber === 1 ? 'FIRST TERM' : termNumber === 2 ? 'SECOND TERM' : 'THIRD TERM';
        doc.text(termLabel, 171.5, 18, { align: 'center' });
        doc.setFontSize(8);
        doc.setTextColor(71, 85, 105);
        doc.text(data.session || '2024/2025', 171.5, 24, { align: 'center' });

        // Personal data block
        doc.setFillColor(248, 250, 252);
        doc.rect(10, 36, 190, 16, 'F');
        doc.setDrawColor(226, 232, 240);
        doc.rect(10, 36, 190, 16, 'S');

        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(100, 116, 139);
        doc.text('NAME:', 14, 42);
        doc.setTextColor(45, 45, 108);
        doc.text(data.student.name.toUpperCase(), 28, 42);

        doc.setTextColor(100, 116, 139);
        doc.text('CLASS:', 110, 42);
        doc.setTextColor(45, 45, 108);
        doc.text(`${data.student.currentLevel} ${data.student.groupName || ''}`.toUpperCase().trim(), 125, 42);

        doc.setTextColor(100, 116, 139);
        doc.text('MATRIC NO:', 14, 48);
        doc.setTextColor(45, 45, 108);
        doc.text((data.student.admissionNumber || data.student.matricNumber || '').toUpperCase(), 34, 48);

        const totalSubjects = data.results.length;
        const totalMarksObtained = data.results.reduce((s: number, r: any) => s + (r.totalScore || 0), 0);
        const scorePercentage = totalSubjects > 0 ? Math.round((totalMarksObtained / (totalSubjects * 100)) * 100) : 0;

        doc.setTextColor(100, 116, 139);
        doc.text('PERCENTAGE:', 110, 48);
        doc.setTextColor(29, 78, 216);
        doc.text(`${scorePercentage}%`, 134, 48);

        // Subject Grid (left, width 135mm) & Sidebar (right, width 50mm, X=150mm)
        const leftColW = 135;
        const sidebarX = 150;
        const sidebarW = 50;

        // Subject Table
        const headers = isThirdTerm
            ? [['Subject', 'Test1 (20)', 'Test2 (20)', 'Exam (60)', 'Total', '2nd Term', '1st Term', 'Ann Avg', 'Grade']]
            : [['Subject', 'Test1 (20)', 'Test2 (20)', 'Exam (60)', 'Total', 'Grade']];

        const body = data.results.map((r: any) => {
            const test1Val = r.test1 !== undefined ? r.test1 : (r.caScore ? Math.round(r.caScore / 2) : 0);
            const test2Val = r.test2 !== undefined ? r.test2 : (r.caScore ? r.caScore - test1Val : 0);
            const total = r.totalScore || 0;
            const grade = r.grade || 'C';

            if (isThirdTerm) {
                return [
                    r.title.toUpperCase(),
                    test1Val.toString(),
                    test2Val.toString(),
                    (r.examScore || 0).toString(),
                    total.toString(),
                    (r.secondTermTotal || total).toString(),
                    (r.firstTermTotal || total).toString(),
                    (r.classAverage || total).toString(),
                    grade
                ];
            } else {
                return [
                    r.title.toUpperCase(),
                    test1Val.toString(),
                    test2Val.toString(),
                    (r.examScore || 0).toString(),
                    total.toString(),
                    grade
                ];
            }
        });

        (doc as any).autoTable({
            startY: 58,
            head: headers,
            body: body,
            theme: 'grid',
            headStyles: { fillColor: [29, 78, 216], textColor: 255, fontStyle: 'bold', fontSize: 7 },
            styles: { fontSize: 6.5, cellPadding: 2 },
            margin: { left: 10, right: 210 - 10 - leftColW },
            columnStyles: isThirdTerm
                ? {
                    0: { cellWidth: 35, fontStyle: 'bold' },
                    1: { halign: 'center' },
                    2: { halign: 'center' },
                    3: { halign: 'center' },
                    4: { halign: 'center', fontStyle: 'bold' },
                    5: { halign: 'center' },
                    6: { halign: 'center' },
                    7: { halign: 'center', fontStyle: 'bold' },
                    8: { halign: 'center', fontStyle: 'bold' }
                  }
                : {
                    0: { cellWidth: 50, fontStyle: 'bold' },
                    1: { halign: 'center' },
                    2: { halign: 'center' },
                    3: { halign: 'center' },
                    4: { halign: 'center', fontStyle: 'bold' },
                    5: { halign: 'center', fontStyle: 'bold' }
                  }
        });

        const tableFinalY = (doc as any).lastAutoTable.finalY;

        // Draw Sidebar starting at Y=58
        let sideY = 58;
        
        // Skills Box
        doc.setDrawColor(226, 232, 240);
        doc.setFillColor(248, 250, 252);
        doc.rect(sidebarX, sideY, sidebarW, 35, 'DF');

        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(45, 45, 108);
        doc.text('SKILLS & RATING', sidebarX + 4, sideY + 5);
        doc.line(sidebarX, sideY + 7, sidebarX + sidebarW, sideY + 7);

        const behaviorsList = data.behaviors.slice(0, 6);
        const defaultBehaviors = [
            { name: 'Punctuality', score: 5 },
            { name: 'Neatness', score: 5 },
            { name: 'Cooperation', score: 4 },
            { name: 'Attentiveness', score: 4 },
            { name: 'Honesty', score: 4 }
        ];
        const activeBehaviors = behaviorsList.length > 0 ? behaviorsList : defaultBehaviors;

        doc.setFontSize(6);
        let itemY = sideY + 11;
        activeBehaviors.forEach((b: any) => {
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(71, 85, 105);
            doc.text(b.name.toUpperCase(), sidebarX + 4, itemY);
            doc.setTextColor(29, 78, 216);
            doc.text(b.score.toString(), sidebarX + sidebarW - 6, itemY, { align: 'right' });
            itemY += 4.5;
        });

        sideY += 39;

        // Grade scale Box
        doc.setFillColor(255, 255, 255);
        doc.rect(sidebarX, sideY, sidebarW, 28, 'DF');

        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(45, 45, 108);
        doc.text('GRADE SCALE', sidebarX + 4, sideY + 5);
        doc.line(sidebarX, sideY + 7, sidebarX + sidebarW, sideY + 7);

        doc.setFontSize(5.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        const scales = [
            { range: '80 - 100', name: 'Excellent' },
            { range: '70 - 79', name: 'Very Good' },
            { range: '60 - 69', name: 'Good' },
            { range: '50 - 59', name: 'Pass' },
            { range: '0 - 49', name: 'Fail' }
        ];

        let scaleY = sideY + 11;
        scales.forEach((s) => {
            doc.text(s.range, sidebarX + 4, scaleY);
            doc.text(s.name, sidebarX + sidebarW - 4, scaleY, { align: 'right' });
            scaleY += 3.8;
        });

        // Determine final split column Y
        const contentFinalY = Math.max(tableFinalY, sideY + 28) + 10;

        // Remarks Footer
        doc.setDrawColor(226, 232, 240);
        doc.setFillColor(255, 255, 255);
        doc.rect(10, contentFinalY, 92, 22, 'DF');
        doc.rect(108, contentFinalY, 92, 22, 'DF');

        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(100, 116, 139);
        doc.text('CLASS TEACHER REMARK', 14, contentFinalY + 5.5);
        doc.text('HEAD TEACHER REMARK', 112, contentFinalY + 5.5);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(71, 85, 105);
        const classTeacherComment = data.remarks?.classTeacherComment || "GOOD PERFORMANCE.";
        const headTeacherComment = data.remarks?.headTeacherComment || "KEEP STRIVING.";

        doc.text(doc.splitTextToSize(classTeacherComment, 84), 14, contentFinalY + 11);
        doc.text(doc.splitTextToSize(headTeacherComment, 84), 112, contentFinalY + 11);

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(29, 78, 216);
        doc.text(`NEXT TERM RESUMPTION: ${data.remarks?.nextTermStarts || 'APRIL 28, 2025'}`, 14, contentFinalY + 18.5);
    }

    private static async renderAdaptiveReport005(doc: jsPDF, data: any) {
        const pageWidth = doc.internal.pageSize.getWidth();
        const termNumber = parseInt(data.term);
        const isThirdTerm = termNumber === 3;
        
        // Detect pre-primary class
        const isPrePrimary = /creche|nursery|pre\s*school|reception/i.test(data.student.currentLevel?.toString() || "");

        if (isPrePrimary) {
            // Header
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(17, 24, 39); // Gray-900
            const schoolTitle = data.session ? 'THE INSTITUTION' : 'THE SCHOOL NAME';
            doc.text(schoolTitle.toUpperCase(), pageWidth / 2, 20, { align: 'center' });

            doc.setFontSize(8.5);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(107, 114, 128);
            doc.text('Nurturing Young Minds', pageWidth / 2, 24.5, { align: 'center' });

            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(79, 70, 229); // indigo-600
            doc.text('PRE-PRIMARY PROGRESS REPORT', pageWidth / 2, 33, { align: 'center' });

            // Metadata
            doc.setFillColor(249, 250, 251);
            doc.rect(10, 38, 190, 10, 'F');
            doc.setDrawColor(229, 231, 235);
            doc.rect(10, 38, 190, 10, 'S');

            doc.setFontSize(7.5);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(107, 114, 128);
            doc.text('NAME:', 14, 44.5);
            doc.setTextColor(17, 24, 39);
            doc.text(data.student.name.toUpperCase(), 26, 44.5);

            doc.setTextColor(107, 114, 128);
            doc.text('CLASS:', 110, 44.5);
            doc.setTextColor(17, 24, 39);
            doc.text(data.student.currentLevel?.toUpperCase() || '', 122, 44.5);

            // Areas of assessment textual table
            const headers = [['AREAS OF ASSESSMENT', 'DEVELOPMENTAL REMARKS']];
            const body = data.results.map((r: any) => [
                r.title.toUpperCase(),
                (r.teacherRemark || 'Demonstrating satisfactory progress and developmental traits.').toUpperCase()
            ]);

            (doc as any).autoTable({
                startY: 52,
                head: headers,
                body: body,
                theme: 'grid',
                headStyles: { fillColor: [17, 24, 39], textColor: 255, fontStyle: 'bold', fontSize: 8 },
                styles: { fontSize: 7, cellPadding: 3.5, fontStyle: 'normal' },
                columnStyles: {
                    0: { cellWidth: 55, fontStyle: 'bold', textColor: [31, 41, 55] },
                    1: { cellWidth: 135 }
                }
            });

            let currentY = (doc as any).lastAutoTable.finalY + 8;

            // Remarks
            doc.setDrawColor(229, 231, 235);
            doc.setFillColor(255, 255, 255);
            doc.rect(10, currentY, 190, 22, 'DF');

            doc.setFontSize(7.5);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(107, 114, 128);
            doc.text('HEAD TEACHER COMMENT', 14, currentY + 5.5);
            
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7);
            doc.setTextColor(31, 41, 55);
            const headComment = data.remarks?.headTeacherComment || "Satisfactory development. Keep it up.";
            doc.text(doc.splitTextToSize(headComment.toUpperCase(), 182), 14, currentY + 10);

            doc.setFont('helvetica', 'bold');
            doc.setTextColor(79, 70, 229);
            doc.text(`NEXT TERM RESUMPTION: ${data.remarks?.nextTermStarts || 'April 28, 2025'}`, 14, currentY + 17.5);

        } else {
            // Primary layout
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(17, 24, 39);
            const schoolTitle = data.session ? 'THE INSTITUTION' : 'THE SCHOOL NAME';
            doc.text(schoolTitle.toUpperCase(), pageWidth / 2, 20, { align: 'center' });

            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(107, 114, 128);
            doc.text('PRIMARY REPORT CARD', pageWidth / 2, 26, { align: 'center' });

            // Metadata
            doc.setFillColor(249, 250, 251);
            doc.rect(10, 32, 190, 10, 'F');
            doc.setDrawColor(229, 231, 235);
            doc.rect(10, 32, 190, 10, 'S');

            doc.setFontSize(7.5);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(107, 114, 128);
            doc.text('NAME:', 14, 38.5);
            doc.setTextColor(17, 24, 39);
            doc.text(data.student.name.toUpperCase(), 26, 38.5);

            doc.setTextColor(107, 114, 128);
            doc.text('CLASS:', 110, 38.5);
            doc.setTextColor(17, 24, 39);
            doc.text(`${data.student.currentLevel} ${data.student.groupName || ''}`.toUpperCase().trim(), 122, 38.5);

            // Table
            const headers = isThirdTerm
                ? [['Subject', 'Test1 (20)', 'Test2 (20)', 'Total (40)', 'Exam (60)', '2nd Term', '1st Term', 'Ann Avg', 'Grade']]
                : [['Subject', 'Test1 (20)', 'Test2 (20)', 'Total (40)', 'Exam (60)', 'Grade']];

            const body = data.results.map((r: any) => {
                const test1Val = r.test1 !== undefined ? r.test1 : (r.caScore ? Math.round(r.caScore / 2) : 0);
                const test2Val = r.test2 !== undefined ? r.test2 : (r.caScore ? r.caScore - test1Val : 0);
                const total = r.totalScore || 0;
                const grade = r.grade || 'C';

                if (isThirdTerm) {
                    return [
                        r.title.toUpperCase(),
                        test1Val.toString(),
                        test2Val.toString(),
                        (r.caScore || 0).toString(),
                        (r.examScore || 0).toString(),
                        (r.secondTermTotal || total).toString(),
                        (r.firstTermTotal || total).toString(),
                        (r.classAverage || total).toString(),
                        grade
                    ];
                } else {
                    return [
                        r.title.toUpperCase(),
                        test1Val.toString(),
                        test2Val.toString(),
                        (r.caScore || 0).toString(),
                        (r.examScore || 0).toString(),
                        grade
                    ];
                }
            });

            (doc as any).autoTable({
                startY: 47,
                head: headers,
                body: body,
                theme: 'grid',
                headStyles: { fillColor: [17, 24, 39], textColor: 255, fontStyle: 'bold', fontSize: 7.5 },
                styles: { fontSize: 7, cellPadding: 2.5 },
                columnStyles: isThirdTerm
                    ? {
                        0: { cellWidth: 45, fontStyle: 'bold' },
                        1: { halign: 'center' },
                        2: { halign: 'center' },
                        3: { halign: 'center' },
                        4: { halign: 'center' },
                        5: { halign: 'center' },
                        6: { halign: 'center' },
                        7: { halign: 'center', fontStyle: 'bold' },
                        8: { halign: 'center', fontStyle: 'bold' }
                      }
                    : {
                        0: { cellWidth: 70, fontStyle: 'bold' },
                        1: { halign: 'center' },
                        2: { halign: 'center' },
                        3: { halign: 'center' },
                        4: { halign: 'center' },
                        5: { halign: 'center', fontStyle: 'bold' }
                      }
            });

            let currentY = (doc as any).lastAutoTable.finalY + 6;

            // Summary row
            const totalSubjects = data.results.length;
            const totalMarksObtainable = totalSubjects * 100;
            const totalMarksObtained = data.results.reduce((s: number, r: any) => s + (r.totalScore || 0), 0);
            const scorePercentage = totalSubjects > 0 ? Math.round((totalMarksObtained / (totalSubjects * 100)) * 100) : 0;

            doc.setFillColor(249, 250, 251);
            doc.rect(10, currentY, 190, 8, 'F');
            doc.rect(10, currentY, 190, 8, 'S');

            doc.setFontSize(7.5);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(107, 114, 128);
            doc.text('OBTAINABLE:', 15, currentY + 5.5);
            doc.setTextColor(17, 24, 39);
            doc.text(totalMarksObtainable.toString(), 38, currentY + 5.5);

            doc.setTextColor(107, 114, 128);
            doc.text('OBTAINED:', 75, currentY + 5.5);
            doc.setTextColor(17, 24, 39);
            doc.text(totalMarksObtained.toFixed(0), 95, currentY + 5.5);

            doc.setTextColor(107, 114, 128);
            doc.text('PERCENTAGE:', 135, currentY + 5.5);
            doc.setTextColor(79, 70, 229);
            doc.text(`${scorePercentage}%`, 160, currentY + 5.5);

            currentY += 14;

            // Comments
            doc.rect(10, currentY, 190, 26, 'S');
            doc.setFontSize(7);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(107, 114, 128);
            doc.text('TEACHER COMMENT:', 14, currentY + 5);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(31, 41, 55);
            doc.text((data.remarks?.classTeacherComment || "GOOD WORK.").toUpperCase(), 48, currentY + 5);

            doc.setFont('helvetica', 'bold');
            doc.setTextColor(107, 114, 128);
            doc.text('HEAD TEACHER COMMENT:', 14, currentY + 11);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(31, 41, 55);
            doc.text((data.remarks?.headTeacherComment || "KEEP STRIVING.").toUpperCase(), 53, currentY + 11);

            doc.setFont('helvetica', 'bold');
            doc.setTextColor(79, 70, 229);
            doc.text(`NEXT TERM RESUMPTION: ${data.remarks?.nextTermStarts || 'April 28, 2025'}`, 14, currentY + 20);
        }
    }

    private static async renderMinimalistReport006(doc: jsPDF, data: any) {
        const pageWidth = doc.internal.pageSize.getWidth();
        const termNumber = parseInt(data.term);

        // Header
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42); // slate-900
        const schoolTitle = data.session ? 'THE INSTITUTION' : 'THE SCHOOL NAME';
        doc.text(schoolTitle.toUpperCase(), pageWidth / 2, 20, { align: 'center' });

        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(148, 163, 184); // slate-400
        doc.text(data.remarks?.nextTermStarts ? 'Nurturing Leaders' : 'Motto Text', pageWidth / 2, 25, { align: 'center' });

        // Metadata grid (drawn as a simple block with dividers)
        let currentY = 32;
        doc.setDrawColor(226, 232, 240);
        doc.setFillColor(248, 250, 252);
        doc.rect(10, currentY, 190, 16, 'DF');

        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(100, 116, 139);
        doc.text('NAME:', 14, currentY + 6);
        doc.setTextColor(15, 23, 42);
        doc.text(data.student.name.toUpperCase(), 26, currentY + 6);

        doc.setTextColor(100, 116, 139);
        doc.text('CLASS:', 85, currentY + 6);
        doc.setTextColor(15, 23, 42);
        doc.text(data.student.currentLevel?.toUpperCase() || '', 97, currentY + 6);

        doc.setTextColor(100, 116, 139);
        doc.text('TERM:', 140, currentY + 6);
        doc.setTextColor(15, 23, 42);
        const termLabel = termNumber === 1 ? 'First Term' : termNumber === 2 ? 'Second Term' : 'Third Term';
        doc.text(termLabel.toUpperCase(), 152, currentY + 6);

        doc.setTextColor(100, 116, 139);
        doc.text('OPENED:', 14, currentY + 12);
        doc.setTextColor(15, 23, 42);
        doc.text((data.remarks?.daysOpen || 122).toString(), 30, currentY + 12);

        doc.setTextColor(100, 116, 139);
        doc.text('PRESENT:', 85, currentY + 12);
        doc.setTextColor(15, 23, 42);
        doc.text((data.remarks?.daysPresent || 122).toString(), 102, currentY + 12);

        doc.setTextColor(100, 116, 139);
        doc.text('ABSENT:', 140, currentY + 12);
        doc.setTextColor(15, 23, 42);
        doc.text((data.remarks?.daysAbsent || 0).toString(), 156, currentY + 12);

        // Subject Table
        const headers = [['Subject', 'CA', 'Exam', 'Total', 'Grade']];
        const body = data.results.map((r: any) => [
            r.title.toUpperCase(),
            (r.caScore || 0).toString(),
            (r.examScore || 0).toString(),
            (r.totalScore || 0).toString(),
            r.grade || 'C'
        ]);

        (doc as any).autoTable({
            startY: currentY + 22,
            head: headers,
            body: body,
            theme: 'grid',
            headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: 'bold', fontSize: 7.5 },
            styles: { fontSize: 7, cellPadding: 2.5 },
            columnStyles: {
                0: { cellWidth: 90, fontStyle: 'bold' },
                1: { halign: 'center' },
                2: { halign: 'center' },
                3: { halign: 'center', fontStyle: 'bold' },
                4: { halign: 'center', fontStyle: 'bold' }
            }
        });

        currentY = (doc as any).lastAutoTable.finalY + 8;

        // Traits & Remarks split side-by-side
        doc.setDrawColor(226, 232, 240);
        doc.setFillColor(255, 255, 255);
        doc.rect(10, currentY, 92, 34, 'DF');
        doc.rect(108, currentY, 92, 34, 'DF');

        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text('TRAITS & REMARKS', 14, currentY + 5.5);
        doc.line(10, currentY + 7.5, 102, currentY + 7.5);

        const behaviorsList = data.behaviors.slice(0, 5);
        const defaultBehaviors = [
            { name: 'Punctuality', score: 5 },
            { name: 'Neatness', score: 5 },
            { name: 'Emotional Stability', score: 4 },
            { name: 'Cooperation', score: 4 },
            { name: 'Leadership', score: 4 }
        ];
        const ratings = behaviorsList.length > 0 ? behaviorsList : defaultBehaviors;

        doc.setFontSize(6.5);
        let traitY = currentY + 11.5;
        ratings.forEach((b: any) => {
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(100, 116, 139);
            doc.text(b.name.toUpperCase(), 14, traitY);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(15, 23, 42);
            doc.text(b.score.toString(), 98, traitY, { align: 'right' });
            traitY += 4.5;
        });

        // Right comments box
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(100, 116, 139);
        doc.text('CLASS TEACHER SIGNATURE', 112, currentY + 5.5);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(15, 23, 42);
        doc.text('Signed online by class teacher.', 112, currentY + 10);

        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(100, 116, 139);
        doc.text("PRINCIPAL'S COMMENTS", 112, currentY + 18.5);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(15, 23, 42);
        const headComment = data.remarks?.headTeacherComment || "KEEP IT UP.";
        doc.text(doc.splitTextToSize(headComment, 84), 112, currentY + 23);
    }

    private static async renderDefaultK12Report(doc: jsPDF, data: any) {
        // Simple default fallback styling
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.text('K-12 ACADEMIC REPORT CARD', 105, 20, { align: 'center' });

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Student: ${data.student.name}`, 15, 35);
        doc.text(`Matric / ID: ${data.student.matricNumber || data.student.admissionNumber}`, 15, 41);
        doc.text(`Level: ${data.student.currentLevel} | Term: ${data.term} | Session: ${data.session}`, 15, 47);

        (doc as any).autoTable({
            startY: 55,
            head: [['Subject Code', 'Subject Title', 'CA', 'Exam', 'Total', 'Grade']],
            body: data.results.map((r: any) => [r.code, r.title, r.caScore, r.examScore, r.totalScore, r.grade]),
            theme: 'grid'
        });
    }

    private static getGpForGrade(grade: string): number {
        const g = grade.toUpperCase();
        if (g.startsWith('A')) return 5.0;
        if (g.startsWith('B')) return 4.0;
        if (g.startsWith('C')) return 3.0;
        if (g.startsWith('D')) return 2.0;
        if (g.startsWith('E')) return 1.0;
        return 0.0;
    }

    private static async renderTertiarySemesterResult(doc: jsPDF, data: any) {
        // Page double border
        doc.setDrawColor(79, 70, 229); // Accent indigo
        doc.setLineWidth(1.2);
        doc.rect(5, 5, 200, 287);
        doc.setLineWidth(0.4);
        doc.setDrawColor(226, 232, 240); // light gray
        doc.rect(6.5, 6.5, 197, 284);

        // Circular Logo placeholder or loaded image
        const logoUrl = data.institution?.logoUrl;
        let logoLoaded = false;
        if (logoUrl) {
            try {
                doc.addImage(logoUrl, 'PNG', 15, 12, 22, 22);
                logoLoaded = true;
            } catch (e) {
                console.error("Failed to render institution logo in tertiary result PDF:", e);
            }
        }

        if (!logoLoaded) {
            doc.setFillColor(79, 70, 229); // Indigo
            doc.circle(26, 23, 11, 'F');
            doc.setFontSize(6.5);
            doc.setTextColor(255, 255, 255);
            doc.setFont('helvetica', 'bold');
            doc.text('TERTIARY', 26, 21.5, { align: 'center' });
            doc.text('PORTAL', 26, 25.5, { align: 'center' });
        }

        // Header text info
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(18);
        doc.setTextColor(15, 23, 42); // slate-900
        const schoolName = data.institution?.name || "TERTIARY INSTITUTION";
        doc.text(schoolName.toUpperCase(), 43, 19);

        doc.setFontSize(9);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(71, 85, 105);
        doc.text(data.institution?.motto || "Excellence and Integrity", 43, 24);

        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text(`Official Academic Record • Date Printed: ${new Date().toLocaleDateString()}`, 43, 28.5);

        // Header Title banner
        doc.setFillColor(241, 245, 249);
        doc.rect(15, 38, 180, 10, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10.5);
        doc.setTextColor(79, 70, 229); // Indigo
        const termLabel = data.semester?.toString() === '1' ? 'FIRST SEMESTER' : data.semester?.toString() === '2' ? 'SECOND SEMESTER' : `SEMESTER ${data.semester || data.term}`;
        doc.text(`${termLabel} REPORT FOR THE ${data.session} ACADEMIC SESSION`, 105, 44.5, { align: 'center' });

        // Student Profile section
        const leftCol = 15;
        let profileY = 52;

        // Draw profile background box
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.4);
        doc.rect(15, profileY, 180, 24, 'FD');

        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(148, 163, 184);

        // Row 1 label
        doc.text('STUDENT NAME', leftCol + 5, profileY + 6);
        doc.text('MATRIC / ADMISSION NO', leftCol + 65, profileY + 6);
        doc.text('LEVEL', leftCol + 125, profileY + 6);

        // Row 1 value
        doc.setFontSize(9);
        doc.setTextColor(15, 23, 42);
        const nameVal = data.student?.name || `${data.student?.firstName || ''} ${data.student?.lastName || ''}`.trim() || 'STUDENT';
        doc.text(nameVal.toUpperCase(), leftCol + 5, profileY + 11);
        const matricVal = data.student?.matricNumber || data.student?.admissionNumber || 'N/A';
        doc.text(matricVal.toUpperCase(), leftCol + 65, profileY + 11);
        const levelVal = data.student?.currentLevel || data.student?.level || 100;
        doc.text(`${levelVal} LEVEL`, leftCol + 125, profileY + 11);

        // Row 2 label
        doc.setFontSize(7.5);
        doc.setTextColor(148, 163, 184);
        doc.text('DEPARTMENT', leftCol + 5, profileY + 18);
        doc.text('PROGRAMME', leftCol + 65, profileY + 18);
        doc.text('STATUS', leftCol + 125, profileY + 18);

        // Row 2 value
        doc.setFontSize(9);
        doc.setTextColor(15, 23, 42);
        const deptVal = data.student?.department || 'N/A';
        doc.text(deptVal.toUpperCase(), leftCol + 5, profileY + 23);
        const progVal = data.student?.programme || 'N/A';
        doc.text(progVal.toUpperCase(), leftCol + 65, profileY + 23);
        doc.text('ACTIVE', leftCol + 125, profileY + 23);

        // Results Table using AutoTable
        let tableY = profileY + 29;
        
        const results = data.results || [];
        const tableBody = results.map((r: any) => [
            r.code || r.courseCode || 'N/A',
            r.title || r.courseTitle || 'N/A',
            (r.units || r.creditUnits || 3).toString(),
            (r.score || r.totalScore || 0).toString(),
            r.grade || 'N/A',
            (r.gp || r.gradePoint || DocumentService.getGpForGrade(r.grade || '')).toFixed(2)
        ]);

        (doc as any).autoTable({
            startY: tableY,
            head: [['COURSE CODE', 'COURSE TITLE', 'CREDIT UNITS', 'SCORE', 'GRADE', 'GRADE POINT']],
            body: tableBody,
            theme: 'grid',
            headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: 'bold', fontSize: 8 },
            styles: { fontSize: 8, cellPadding: 2.5, textColor: [51, 65, 85] },
            columnStyles: {
                0: { fontStyle: 'bold', halign: 'left', cellWidth: 35 },
                1: { halign: 'left' },
                2: { halign: 'center', cellWidth: 25 },
                3: { halign: 'center', cellWidth: 20 },
                4: { halign: 'center', fontStyle: 'bold', textColor: [79, 70, 229], cellWidth: 20 },
                5: { halign: 'center', cellWidth: 25 }
            },
            margin: { left: 15, right: 15 }
        });

        const finalTableY = (doc as any).lastAutoTable.finalY || (tableY + 30);
        let summaryY = finalTableY + 8;

        // Perform TCR, TCE, SGPA calculations
        let tcr = data.summary?.tcr || 0;
        let tce = data.summary?.tce || 0;
        let sgpa = data.summary?.gpa || 0;
        let cgpa = data.summary?.cgpa || 0;
        let twgp = 0;

        if (data.summary) {
            twgp = results.reduce((s: number, r: any) => s + ((r.gp || r.gradePoint || 0) * (r.units || r.creditUnits || 0)), 0);
        } else {
            tcr = results.reduce((s: number, r: any) => s + (r.units || r.creditUnits || 3), 0);
            tce = results.reduce((s: number, r: any) => s + (r.grade !== 'F' ? (r.units || r.creditUnits || 3) : 0), 0);
            twgp = results.reduce((s: number, r: any) => {
                const gpVal = r.gp || r.gradePoint || DocumentService.getGpForGrade(r.grade || '');
                return s + (gpVal * (r.units || r.creditUnits || 3));
            }, 0);
            sgpa = tcr > 0 ? (twgp / tcr) : 0;
            cgpa = sgpa;
        }

        // Draw summary box header
        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text('ACADEMIC STANDING / PERFORMANCE SUMMARY', leftCol, summaryY);

        summaryY += 3;
        (doc as any).autoTable({
            startY: summaryY,
            body: [
                ['Total Credits Registered (TCR)', tcr.toString(), 'Total Credits Earned (TCE)', tce.toString(), 'Total Weighted Points (TWGP)', twgp.toFixed(2)],
                ['Semester GPA (SGPA)', sgpa.toFixed(2), 'Cumulative GPA (CGPA)', cgpa.toFixed(2), 'Academic Standing', sgpa >= 2.0 ? 'GOOD STANDING' : 'PROBATION']
            ],
            theme: 'grid',
            styles: { fontSize: 7.5, cellPadding: 2.5 },
            columnStyles: {
                0: { fontStyle: 'bold', fillColor: [248, 250, 252], cellWidth: 45 },
                1: { halign: 'center', fontStyle: 'bold', cellWidth: 15 },
                2: { fontStyle: 'bold', fillColor: [248, 250, 252], cellWidth: 45 },
                3: { halign: 'center', fontStyle: 'bold', cellWidth: 15 },
                4: { fontStyle: 'bold', fillColor: [248, 250, 252], cellWidth: 45 },
                5: { halign: 'center', fontStyle: 'bold', textColor: [79, 70, 229], cellWidth: 15 }
            },
            margin: { left: 15, right: 15 }
        });

        const finalSummaryY = (doc as any).lastAutoTable.finalY || (summaryY + 20);
        let signatureY = finalSummaryY + 12;

        if (signatureY > 250) {
            doc.addPage();
            signatureY = 30;
            doc.setDrawColor(79, 70, 229);
            doc.setLineWidth(1.2);
            doc.rect(5, 5, 200, 287);
            doc.setLineWidth(0.4);
            doc.setDrawColor(226, 232, 240);
            doc.rect(6.5, 6.5, 197, 284);
        }

        const sigWidth = 80;
        const hodX = 15;
        const deanX = 115;

        doc.setFillColor(240, 253, 250);
        doc.setDrawColor(20, 184, 166);
        doc.setLineWidth(0.5);
        
        doc.rect(hodX + 15, signatureY, 50, 8, 'FD');
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(13, 148, 136);
        doc.text('APPROVED DIGITALLY', hodX + 40, signatureY + 5.5, { align: 'center' });

        doc.rect(deanX + 15, signatureY, 50, 8, 'FD');
        doc.text('APPROVED DIGITALLY', deanX + 40, signatureY + 5.5, { align: 'center' });

        signatureY += 16;
        doc.setDrawColor(203, 213, 225);
        doc.setLineWidth(0.5);
        doc.line(hodX, signatureY, hodX + sigWidth, signatureY);
        doc.line(deanX, signatureY, deanX + sigWidth, signatureY);

        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text('HEAD OF DEPARTMENT (HOD)', hodX + (sigWidth / 2), signatureY + 4, { align: 'center' });
        doc.text('DEAN OF FACULTY', deanX + (sigWidth / 2), signatureY + 4, { align: 'center' });

        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(140, 140, 140);
        doc.text('OFFICIAL SIGNATURE / DATE STAMP', hodX + (sigWidth / 2), signatureY + 7.5, { align: 'center' });
        doc.text('OFFICIAL SIGNATURE / DATE STAMP', deanX + (sigWidth / 2), signatureY + 7.5, { align: 'center' });
    }
}

