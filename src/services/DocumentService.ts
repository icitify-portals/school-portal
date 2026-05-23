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
        student: { name: string; matricNumber: string; department: string; level: number };
        session: string;
        semester: string;
        results: { code: string; title: string; units: number; score: number; grade: string; gp: number }[];
        summary: { gpa: number; cgpa: number; tcr: number; tce: number };
        unitId?: number;
        headSignature?: { name: string; signatureUrl?: string };
    }) {
        const doc = new jsPDF() as jsPDFWithPlugin;
        const pageWidth = doc.internal.pageSize.getWidth();

        // Use Passed Signature
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
        doc.autoTable({
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

        doc.save(`Result_Slip_${data.student.matricNumber}_${data.session}_Sem${data.semester}.pdf`);
    }

    /**
     * Generates a Full Academic Transcript.
     */
    static async generateTranscript(data: {
        institution: { name: string; motto: string };
        student: { name: string; matricNumber: string; department: string; programme: string; dateOfBirth?: string };
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
        const doc = new jsPDF() as jsPDFWithPlugin;
        const pageWidth = doc.internal.pageSize.getWidth();

        // Use Passed Signature
        const registrar = data.registrarSignature;

        // Header (Compressed for Transcript)
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text(data.institution.name.toUpperCase(), pageWidth / 2, 15, { align: 'center' });
        doc.setFontSize(12);
        doc.text('OFFICIAL ACADEMIC TRANSCRIPT', pageWidth / 2, 22, { align: 'center' });

        // Student Profile Header
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        let y = 35;
        doc.text(`NAME: ${data.student.name}`, 15, y);
        doc.text(`MATRIC NO: ${data.student.matricNumber}`, 110, y);
        y += 5;
        doc.text(`PROGRAMME: ${data.student.programme}`, 15, y);
        doc.text(`DEPT: ${data.student.department}`, 110, y);
        y += 10;

        // Iterate through sessions and semesters
        data.sessions.forEach((session, sIdx) => {
            session.semesters.forEach((semester, semIdx) => {
                // Check if we need a new page
                if (y > 230) {
                    doc.addPage();
                    y = 20;
                }

                doc.setFont('helvetica', 'bold');
                doc.text(`${session.name} - SEMESTER ${semester.number}`, 15, y);

                doc.autoTable({
                    startY: y + 2,
                    head: [['CODE', 'COURSE TITLE', 'UNITS', 'GRADE', 'GP']],
                    body: semester.results.map(r => [r.code, r.title, r.units, r.grade, r.gp.toFixed(2)]),
                    theme: 'striped',
                    styles: { fontSize: 8, cellPadding: 1 },
                    margin: { left: 15, right: 15 }
                });

                y = (doc as any).lastAutoTable.finalY + 5;
                doc.text(`GPA: ${semester.summary.gpa.toFixed(2)} | TCR: ${semester.summary.tcr} | TCE: ${semester.summary.tce}`, 15, y);
                y += 10;
            });
        });

        // Final Standing
        if (y > 250) doc.addPage(), y = 20;
        doc.line(15, y, pageWidth - 15, y);
        y += 10;
        doc.setFontSize(12);
        doc.text(`FINAL CGPA: ${data.finalCgpa.toFixed(2)}`, 15, y);

        // Signatures at the end
        y += 20;
        if (y > 260) { doc.addPage(); y = 30; }

        if (registrar?.signatureUrl) {
            try {
                doc.addImage(registrar.signatureUrl, 'PNG', 15, y - 10, 40, 15);
            } catch (e) {}
        }
        doc.line(15, y, 75, y);
        doc.setFontSize(8);
        doc.text(registrar?.name?.toUpperCase() || 'REGISTRAR', 45, y + 4, { align: 'center' });

        doc.save(`Transcript_${data.student.matricNumber}.pdf`);
    }
}
