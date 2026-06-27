"use server";

import { db } from "@/db/db";
import { roles, permissions, rolePermissions, cmsPages } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/auth";

export async function seedPrincipalRoles() {
    const session = await auth();
    if ((session?.user as any)?.role !== "superadmin" && (session?.user as any)?.role !== "admin") {
        return { success: false, error: "Unauthorized" };
    }

    try {
        // 1. Define Permissions
        const officerPermissions = [
            { name: "finance.view_summary", category: "Bursary", description: "View financial summary reports" },
            { name: "finance.view_detailed", category: "Bursary", description: "View individual student payment records" },
            { name: "finance.sign_receipt", category: "Bursary", description: "Authorize and sign receipts" },
            { name: "finance.fee.manage", category: "Bursary", description: "Configure fee structures and payment items" },
            { name: "finance.backlog.manage", category: "Bursary", description: "Upload and process Excel payment backlogs" },
            { name: "finance.ledger.manage", category: "Bursary", description: "Manage general ledger, accounts, and budgets" },
            { name: "finance.expenditure.manage", category: "Bursary", description: "Approve expenditure and vendor payout requests" },
            { name: "finance.refund.manage", category: "Bursary", description: "Approve student refund requests" },
            { name: "finance.dashboard.view", category: "Bursary", description: "View overall financial metrics and dashboard" },
            { name: "academic.sign_report", category: "Academic", description: "Sign student report cards/result slips" },
            { name: "academic.sign_transcript", category: "Academic", description: "Sign official transcripts" },
            { name: "academic.results.upload", category: "Academic", description: "Upload and modify course results" },
            { name: "academic.results.approve", category: "Academic", description: "Approve, lock, and publish student scores" },
            { name: "academic.registration.approve", category: "Academic", description: "Approve or reject student course registrations" },
            { name: "academic.waiver.manage", category: "Academic", description: "Grant or revoke student course registration waivers" },
            { name: "academic.results.audit", category: "Academic", description: "View result change audit logs and history" },
            { name: "academic.results.compute", category: "Academic", description: "Compute and recalculate student GPAs and class grades" },
            { name: "admission.screening.view", category: "Admission", description: "View the list of applicants undergoing admission screening" },
            { name: "admission.applicant.admit", category: "Admission", description: "Admit or reject applicants and issue admission letters" },
            { name: "officers.manage", category: "System", description: "Assign and manage Principal Officers" },
            { name: "maintenance.request.view", category: "Works", description: "View all facility and vehicle maintenance requests" },
            { name: "maintenance.request.assign", category: "Works", description: "Assign work orders to technicians" },
            { name: "maintenance.request.resolve", category: "Works", description: "Close or override work orders" },
            { name: "maintenance.fleet.manage", category: "Works", description: "Schedule and manage vehicle servicing logs" },
            { name: "maintenance.preventive.manage", category: "Works", description: "Create and configure routine maintenance schedules" },
            { name: "maintenance.staff.manage", category: "Works", description: "Update technician trade specialties and workloads" },
            { name: "maintenance.technician.view", category: "Works", description: "View assigned technician tasks" },
            { name: "maintenance.technician.update", category: "Works", description: "Update work order status and write resolution notes" },
            { name: "maintenance.quote.submit", category: "Works", description: "Submit repair cost quotes for parts or service" },
            { name: "maintenance.quote.review", category: "Works", description: "Review and approve/reject technician repair quotes" },
            { name: "security.vehicle.register", category: "Security", description: "Register personal or visitor vehicles" },
            { name: "security.vehicle.approve", category: "Security", description: "Review and approve/revoke vehicle gate passes" },
            { name: "security.vehicle.scan", category: "Security", description: "Scan vehicle gate passes to log entry/exit traffic" },
            { name: "security.position.manage", category: "Security", description: "Manage strategic campus patrol checkpoints" },
            { name: "security.patrol.log", category: "Security", description: "Scan patrol checkpoints and log safety status" },
            { name: "security.incident.report", category: "Security", description: "Report and log campus safety incidents" },
            { name: "security.incident.manage", category: "Security", description: "Investigate, update status, and resolve incident cases" },
            { name: "security.dashboard.view", category: "Security", description: "View campus security dashboard stats and analytics" },
            { name: "inventory.items.manage", category: "Inventory", description: "Manage stock items, record purchases, issuances, adjustments, and returns" },
            { name: "library.catalog.manage", category: "Library", description: "Add, edit and manage library book catalog and digital resources" },
            { name: "library.circulation.manage", category: "Library", description: "Issue and check-in library books and track loans" },
            { name: "library.fines.manage", category: "Library", description: "Apply, review, and clear library fines" },
            { name: "library.analytics.view", category: "Library", description: "View library circulation and catalog analytics" },
            { name: "siwes.config.manage", category: "SIWES", description: "Configure SIWES sessions, departments, eligibility criteria" },
            { name: "siwes.placement.view", category: "SIWES", description: "View all student placement records, companies, logbooks" },
            { name: "siwes.placement.assess", category: "SIWES", description: "Evaluate, grade, and approve completed student logbooks and supervisor assessments" },
            { name: "hr.staff.view", category: "HR", description: "View staff directory and profiles" },
            { name: "hr.staff.manage", category: "HR", description: "Hire, update, and terminate staff profiles" },
            { name: "hr.leave.manage", category: "HR", description: "Review and approve/reject staff leave requests" },
            { name: "audit.logs.view", category: "Audit", description: "View system audit logs and action histories" },
            { name: "audit.financials.verify", category: "Audit", description: "Audit and verify financial vouchers, payroll, and stock" },
            { name: "finance.payroll.run", category: "Bursary", description: "Prepare and compute staff payroll sheets" },
            { name: "finance.payroll.approve", category: "Bursary", description: "Approve, release, and post payroll expenses" },
            { name: "finance.clearance.manage", category: "Bursary", description: "Manually override and clear student finances" },
            { name: "finance.vendors.manage", category: "Bursary", description: "Register, modify, and manage third-party vendors" },
            { name: "users.manage", category: "System", description: "Manage user accounts, details, and deletions" },
            { name: "permissions.manage", category: "System", description: "Grant or revoke user roles and permissions" },
            { name: "student_affairs.event.manage", category: "Student Affairs", description: "Create, edit, cancel events" },
            { name: "student_affairs.club.approve", category: "Student Affairs", description: "Approve or reject club application requests" },
            { name: "student_affairs.bulletin.manage", category: "Student Affairs", description: "Create, publish, and broadcast school bulletins" },
            { name: "student_affairs.club.manage", category: "Student Affairs", description: "Manage specific club details - e.g. for Club Presidents" },
            // CMS Permissions
            { name: "cms.pages.manage", category: "CMS", description: "Create, edit, and delete school pages" },
            { name: "cms.menus.manage", category: "CMS", description: "Manage school navigation menus" },
            { name: "cms.media.manage", category: "CMS", description: "Upload and manage CMS media files" },
            { name: "cms.homepage.manage", category: "CMS", description: "Configure school home pages, sliders, and sections" },
            { name: "cms.content.manage", category: "CMS", description: "Create and manage news posts and school events" },
            { name: "cms.taxonomy.manage", category: "CMS", description: "Manage vocabulary, categories, and tags" },
            { name: "cms.publishing.approve", category: "CMS", description: "Approve or reject content queued for review" },
            // PhD / Postgraduate Permissions
            { name: "phd.applications.view", category: "PhD", description: "View list and details of all PhD applications" },
            { name: "phd.supervisors.assign", category: "PhD", description: "Assign supervisors to PhD candidates" },
            { name: "phd.fees.verify", category: "PhD", description: "Verify candidacy fees paid by PhD students" },
            { name: "phd.thesis.review", category: "PhD", description: "Review and approve/reject submitted PhD theses" },
            { name: "phd.defense.schedule", category: "PhD", description: "Schedule PhD viva/defense sessions and assign examiners" },
            { name: "phd.defense.record_result", category: "PhD", description: "Record the outcome of a PhD defense (pass/fail)" },
            { name: "phd.graduation.confirm", category: "PhD", description: "Give provost-level approval to confirm PhD graduation" },
            { name: "phd.examiners.manage", category: "PhD", description: "Add, update, and manage PhD external/internal examiners" },
            // Graduate Registry / Document Permissions
            { name: "registry.documents.view", category: "Registry", description: "View graduate document application queue" },
            { name: "registry.documents.process", category: "Registry", description: "Update document application status (review, dispatch, complete)" },
            { name: "registry.forms.manage", category: "Registry", description: "Create and configure dynamic graduate document forms" },
            { name: "registry.pricing.manage", category: "Registry", description: "Set and update pricing rules for document types" },
            { name: "registry.graduation.promote", category: "Registry", description: "Promote an eligible student to graduate status" },
            // Academic Structure Management
            { name: "academic.faculties.manage", category: "Academic", description: "Create, update, and delete faculties" },
            { name: "academic.departments.manage", category: "Academic", description: "Create, update, and delete departments" },
            { name: "academic.programmes.manage", category: "Academic", description: "Create, update, and delete academic programmes" },
            { name: "academic.courses.manage", category: "Academic", description: "Create, update, and delete courses and course components" },
            { name: "academic.courses.assign", category: "Academic", description: "Assign lecturers and staff to courses" },
            { name: "academic.curriculum.manage", category: "Academic", description: "Manage curriculum frameworks, topics, and outcomes" },
            { name: "academic.timetable.manage", category: "Academic", description: "Create and publish academic timetables" },
            { name: "academic.timetable.view", category: "Academic", description: "View academic timetables" },
            { name: "academic.timetable.exams.manage", category: "Academic", description: "Schedule and manage examination timetables" },
            { name: "academic.grading.manage", category: "Academic", description: "Configure grading systems, rubrics, and scale assignments" },
            { name: "academic.promotion.manage", category: "Academic", description: "Run and manage student promotion exercises" },
            { name: "academic.matriculation.manage", category: "Academic", description: "Manage matriculation register and sequences" },
            { name: "academic.broadsheet.view", category: "Academic", description: "View class broadsheets and result summaries" },
            { name: "academic.cohorts.manage", category: "Academic", description: "Create and manage student cohort groups" },
            { name: "academic.qualityassurance.manage", category: "Academic", description: "Manage QA evaluations, programme reviews and compliance" },
            // Admission Management
            { name: "admission.sessions.manage", category: "Admission", description: "Create and configure admission sessions" },
            { name: "admission.applications.manage", category: "Admission", description: "View, process, and manage admission applications" },
            { name: "admission.data.capture", category: "Admission", description: "Bulk-capture student data into the system" },
            { name: "admission.cbt.manage", category: "Admission", description: "Create and manage admission CBT quizzes and attempts" },
            { name: "admission.exams.manage", category: "Admission", description: "Manage admission entrance examination settings" },
            // Student Management
            { name: "students.manage", category: "Students", description: "Create, update and manage student profiles" },
            { name: "students.view", category: "Students", description: "View student profiles and records" },
            { name: "students.transfer", category: "Students", description: "Process student inter-programme transfers" },
            { name: "students.registration.manage", category: "Students", description: "Manage student course registrations" },
            { name: "students.enroll", category: "Students", description: "Enroll students into programmes and sessions" },
            // Results & Exams
            { name: "results.view", category: "Results", description: "View student results and scores" },
            { name: "results.manage", category: "Results", description: "Enter, edit, and delete result records" },
            { name: "results.exams.manage", category: "Results", description: "Manage exam records, invigilation, and exam slots" },
            { name: "results.broadsheet.manage", category: "Results", description: "Generate and export class broadsheets" },
            // Attendance
            { name: "attendance.manage", category: "Attendance", description: "Mark, edit, and manage student attendance records" },
            { name: "attendance.view", category: "Attendance", description: "View student and staff attendance records" },
            { name: "attendance.staff.manage", category: "Attendance", description: "Record and manage staff attendance" },
            // LMS / E-Learning
            { name: "lms.courses.manage", category: "LMS", description: "Create and manage LMS course content, modules, and lessons" },
            { name: "lms.assignments.manage", category: "LMS", description: "Create, grade, and manage student assignments" },
            { name: "lms.quizzes.manage", category: "LMS", description: "Create and manage LMS quizzes and CBT assessments" },
            { name: "lms.gradebook.manage", category: "LMS", description: "Manage the LMS gradebook and scoring" },
            // Health / Medical
            { name: "health.records.view", category: "Health", description: "View student health records and vitals" },
            { name: "health.records.manage", category: "Health", description: "Create and update student health records, vitals, appointments" },
            { name: "health.inventory.manage", category: "Health", description: "Manage medical inventory and dispensations" },
            { name: "health.excusat.manage", category: "Health", description: "Issue and manage medical excuse notes" },
            // Hostel / Accommodation
            { name: "hostel.manage", category: "Hostel", description: "Manage hostel blocks, rooms, and settings" },
            { name: "hostel.applications.manage", category: "Hostel", description: "Process and manage student hostel applications" },
            { name: "hostel.allocation.manage", category: "Hostel", description: "Allocate and de-allocate hostel rooms to students" },
            // Sports
            { name: "sports.teams.manage", category: "Sports", description: "Create and manage sports teams and rosters" },
            { name: "sports.fixtures.manage", category: "Sports", description: "Schedule and manage sports fixtures and results" },
            // Disciplinary
            { name: "disciplinary.records.manage", category: "Disciplinary", description: "Create and manage student disciplinary records" },
            { name: "disciplinary.records.view", category: "Disciplinary", description: "View student disciplinary history" },
            // HR Extended
            { name: "hr.leave.approve", category: "HR", description: "Approve or reject staff leave requests" },
            { name: "hr.attendance.manage", category: "HR", description: "Manage staff attendance records and reports" },
            { name: "hr.performance.manage", category: "HR", description: "Manage staff performance reviews and KPIs" },
            { name: "hr.relations.manage", category: "HR", description: "Handle staff grievances, loans, and welfare records" },
            { name: "hr.recruitment.manage", category: "HR", description: "Post vacancies and manage job applications" },
            // Finance Extended
            { name: "finance.loans.manage", category: "Bursary", description: "Create and manage student/staff loan records" },
            { name: "finance.scholarships.manage", category: "Bursary", description: "Create, fund, and manage scholarship awards" },
            { name: "finance.import.manage", category: "Bursary", description: "Import and export financial data (bulk Excel/CSV)" },
            // System Administration
            { name: "system.settings.manage", category: "System", description: "Manage global system settings and configurations" },
            { name: "system.backup.manage", category: "System", description: "Initiate, download, and manage system backups" },
            { name: "system.modules.manage", category: "System", description: "Enable/disable application modules" },
            { name: "system.import.manage", category: "System", description: "Perform bulk data imports and exports" },
            // Communication
            { name: "communication.broadcast.manage", category: "Communication", description: "Send broadcast messages to students and staff" },
            { name: "communication.announcements.manage", category: "Communication", description: "Create and publish school-wide announcements" },
            // Teachers / Staff Assignments
            { name: "teachers.manage", category: "Academic", description: "Manage teacher profiles and subject/class assignments" },
            { name: "teachers.lesson_notes.approve", category: "Academic", description: "Review and approve teacher lesson notes" },
            // Helpdesk / Support Tickets
            { name: "support.tickets.create", category: "Helpdesk", description: "Create and respond to own support tickets" },
            { name: "support.tickets.view", category: "Helpdesk", description: "View all student/user support tickets" },
            { name: "support.tickets.reply", category: "Helpdesk", description: "Reply to any support tickets" },
            { name: "support.tickets.assign", category: "Helpdesk", description: "Assign tickets to support agents" },
            { name: "support.tickets.manage", category: "Helpdesk", description: "Update ticket status and configurations" },
        ];

        for (const perm of officerPermissions) {
            const [existing] = await db.select().from(permissions).where(eq(permissions.name, perm.name)).limit(1);
            if (!existing) {
                await db.insert(permissions).values(perm);
            }
        }

        // 2. Define Roles
        const officerRoles = [
            { 
                name: "Bursar", 
                description: "Chief Financial Officer of the School/Branch", 
                permissions: [
                    "finance.view_summary", 
                    "finance.view_detailed", 
                    "finance.sign_receipt",
                    "finance.fee.manage",
                    "finance.backlog.manage",
                    "finance.ledger.manage",
                    "finance.expenditure.manage",
                    "finance.refund.manage",
                    "finance.dashboard.view",
                    "finance.payroll.run",
                    "finance.payroll.approve",
                    "finance.clearance.manage",
                    "finance.vendors.manage"
                ] 
            },
            {
                name: "Bursary Cashier",
                description: "Process payments, view transaction histories, and sign payment receipts.",
                permissions: [
                    "finance.view_detailed",
                    "finance.sign_receipt",
                    "finance.dashboard.view"
                ]
            },
            {
                name: "Fee Officer",
                description: "Set up and manage academic session fee items and structures.",
                permissions: [
                    "finance.view_summary",
                    "finance.fee.manage",
                    "finance.dashboard.view"
                ]
            },
            { name: "Principal", description: "Head of School Operations and Academic Oversight", permissions: ["academic.sign_report", "finance.view_summary", "officers.manage", "academic.results.approve", "academic.results.audit", "academic.results.compute"] },
            { name: "Headteacher", description: "Primary School Head of Operations", permissions: ["academic.sign_report", "finance.view_summary"] },
            { name: "Registrar", description: "Custodian of Academic Records", permissions: ["academic.sign_transcript", "officers.manage", "academic.registration.approve", "academic.waiver.manage", "academic.results.audit", "admission.manage", "admission.screening.view", "admission.applicant.admit"] },
            { name: "VP Academics", description: "Vice Principal (Academic Affairs)", permissions: ["academic.sign_report", "academic.sign_transcript", "academic.results.approve", "academic.results.compute"] },
            { name: "Dean", description: "Dean of Faculty. Approves faculty-level results and course waivers.", permissions: ["academic.results.approve", "academic.waiver.manage"] },
            { name: "HOD", description: "Head of Department. Computes department GPAs, approves department-level results, and course waivers.", permissions: ["academic.results.approve", "academic.waiver.manage", "academic.results.compute"] },
            {
                name: "Admission Officer",
                description: "Admissions Office staff responsible for applicant screening and validation.",
                permissions: [
                    "admission.screening.view",
                    "admission.applicant.admit"
                ]
            },
            { name: "Stakeholder", description: "External auditor or observer with limited view access", permissions: ["finance.view_summary"] },
            {
                name: "Works Director",
                description: "Director of Works & Maintenance. Oversees school facilities, utilities, assets, and vehicle fleet.",
                permissions: [
                    "maintenance.request.view",
                    "maintenance.request.assign",
                    "maintenance.request.resolve",
                    "maintenance.fleet.manage",
                    "maintenance.preventive.manage",
                    "maintenance.staff.manage"
                ]
            },
            {
                name: "Head of Maintenance",
                description: "Head of Maintenance / Supervisor. Manages daily repairs, technicians, and approves repair quote expenditures.",
                permissions: [
                    "maintenance.request.view",
                    "maintenance.request.assign",
                    "maintenance.request.resolve",
                    "maintenance.quote.review",
                    "maintenance.staff.manage"
                ]
            },
            {
                name: "Maintenance Technician",
                description: "Field technician in the Works department responsible for executing repairs.",
                permissions: [
                    "maintenance.technician.view",
                    "maintenance.technician.update",
                    "maintenance.quote.submit"
                ]
            },
            {
                name: "Chief Security Officer",
                description: "Chief Security Officer (CSO). Oversees campus-wide security operations, patrols, and incident management.",
                permissions: [
                    "security.vehicle.register",
                    "security.vehicle.approve",
                    "security.vehicle.scan",
                    "security.position.manage",
                    "security.patrol.log",
                    "security.incident.report",
                    "security.incident.manage",
                    "security.dashboard.view"
                ]
            },
            {
                name: "Security Officer",
                description: "On-duty security officer responsible for patrols, vehicle screening, and incident logs.",
                permissions: [
                    "security.vehicle.scan",
                    "security.patrol.log",
                    "security.incident.report"
                ]
            },
            {
                name: "Store Keeper",
                description: "Manages school inventory items, stock levels, and logs items issuance/receipts.",
                permissions: [
                    "inventory.items.manage"
                ]
            },
            {
                name: "Librarian",
                description: "Manager of the Library Resources Catalog and Journal Portal.",
                permissions: [
                    "library.manage",
                    "library.catalog.manage",
                    "library.circulation.manage",
                    "library.fines.manage",
                    "library.analytics.view"
                ]
            },
            {
                name: "Library Assistant",
                description: "Assists with daily book checkouts, check-ins, and shelf monitoring.",
                permissions: [
                    "library.circulation.manage"
                ]
            },
            {
                name: "SIWES Coordinator",
                description: "Coordinates student industrial placements, logbooks, and assessments.",
                permissions: [
                    "siwes.config.manage",
                    "siwes.placement.view",
                    "siwes.placement.assess"
                ]
            },
            {
                name: "Auditor",
                description: "Internal Auditor. Performs independent audits on finances, payroll, and stock.",
                permissions: [
                    "audit.logs.view",
                    "audit.financials.verify"
                ]
            },
            {
                name: "HR Officer",
                description: "Human Resources Officer. Manages staff files, hiring, and leave requests.",
                permissions: [
                    "hr.staff.view",
                    "hr.staff.manage",
                    "hr.leave.manage"
                ]
            },
            {
                name: "IT Admin",
                description: "IT Administrator. Manages user accounts, branches, and system permission grants.",
                permissions: [
                    "users.manage",
                    "permissions.manage",
                    "support.tickets.create",
                    "support.tickets.view",
                    "support.tickets.reply",
                    "support.tickets.assign",
                    "support.tickets.manage"
                ]
            },
            {
                name: "Support Agent",
                description: "Helpdesk staff responsible for resolving user support tickets.",
                permissions: [
                    "support.tickets.view",
                    "support.tickets.reply",
                    "support.tickets.assign"
                ]
            },
            {
                name: "Support Manager",
                description: "Helpdesk supervisor who oversees all tickets and configurations.",
                permissions: [
                    "support.tickets.create",
                    "support.tickets.view",
                    "support.tickets.reply",
                    "support.tickets.assign",
                    "support.tickets.manage"
                ]
            },
            {
                name: "Student Affairs Officer",
                description: "Manages events, student clubs and organizations, and issues bulletins.",
                permissions: [
                    "student_affairs.event.manage",
                    "student_affairs.club.approve",
                    "student_affairs.bulletin.manage"
                ]
            },
            {
                name: "Club President",
                description: "Manages specific student club/organization details.",
                permissions: [
                    "student_affairs.club.manage"
                ]
            },
            {
                name: "CMS Manager",
                description: "Manages school pages, menus, homepage sections, and media library.",
                permissions: [
                    "cms.pages.manage",
                    "cms.menus.manage",
                    "cms.media.manage",
                    "cms.homepage.manage",
                    "cms.content.manage",
                    "cms.taxonomy.manage",
                    "cms.publishing.approve"
                ]
            },
            {
                name: "Postgraduate Coordinator",
                description: "Oversees PhD/postgraduate workflows: supervisors, thesis reviews, defenses, and graduations.",
                permissions: [
                    "phd.applications.view",
                    "phd.supervisors.assign",
                    "phd.fees.verify",
                    "phd.thesis.review",
                    "phd.defense.schedule",
                    "phd.defense.record_result",
                    "phd.graduation.confirm",
                    "phd.examiners.manage",
                    "registry.graduation.promote",
                ]
            },
            {
                name: "Graduate Registry Officer",
                description: "Manages graduate document requests, pricing rules, and certificate dispatch.",
                permissions: [
                    "registry.documents.view",
                    "registry.documents.process",
                    "registry.forms.manage",
                    "registry.pricing.manage",
                ]
            },
            {
                name: "Academic Registrar",
                description: "Manages academic structure: faculties, departments, programmes, courses, timetables, and student enrolment.",
                permissions: [
                    "academic.faculties.manage",
                    "academic.departments.manage",
                    "academic.programmes.manage",
                    "academic.courses.manage",
                    "academic.courses.assign",
                    "academic.curriculum.manage",
                    "academic.timetable.manage",
                    "academic.timetable.view",
                    "academic.timetable.exams.manage",
                    "academic.grading.manage",
                    "academic.promotion.manage",
                    "academic.matriculation.manage",
                    "academic.broadsheet.view",
                    "academic.cohorts.manage",
                    "academic.qualityassurance.manage",
                    "students.manage",
                    "students.view",
                    "students.transfer",
                    "students.registration.manage",
                    "students.enroll",
                    "results.view",
                    "results.manage",
                    "results.exams.manage",
                    "results.broadsheet.manage",
                    "attendance.view",
                    "academic.results.upload",
                    "academic.results.approve",
                    "academic.results.audit",
                    "academic.results.compute",
                    "academic.sign_transcript",
                    "academic.registration.approve",
                    "academic.waiver.manage",
                    "teachers.manage",
                    "teachers.lesson_notes.approve",
                ]
            },
            {
                name: "Lecturer",
                description: "Teaching staff who manage course content, attendance, results, and assignments.",
                permissions: [
                    "lms.courses.manage",
                    "lms.assignments.manage",
                    "lms.quizzes.manage",
                    "lms.gradebook.manage",
                    "attendance.manage",
                    "results.manage",
                    "academic.broadsheet.view",
                    "academic.timetable.view",
                ]
            },
            {
                name: "Medical Officer",
                description: "Manages student health records, medical inventory, vitals, and excuse notes.",
                permissions: [
                    "health.records.view",
                    "health.records.manage",
                    "health.inventory.manage",
                    "health.excusat.manage",
                    "students.view",
                ]
            },
            {
                name: "Hostel Manager",
                description: "Manages hostel facilities, student applications, and room allocations.",
                permissions: [
                    "hostel.manage",
                    "hostel.applications.manage",
                    "hostel.allocation.manage",
                    "students.view",
                    "maintenance.request.view",
                ]
            },
            {
                name: "Sports Officer",
                description: "Manages sports teams, fixtures, and school sports activities.",
                permissions: [
                    "sports.teams.manage",
                    "sports.fixtures.manage",
                    "students.view",
                ]
            },
            {
                name: "Disciplinary Officer",
                description: "Manages student conduct records and disciplinary proceedings.",
                permissions: [
                    "disciplinary.records.manage",
                    "disciplinary.records.view",
                    "students.view",
                ]
            },
            {
                name: "System Administrator",
                description: "Manages system settings, backups, module toggles, and data imports.",
                permissions: [
                    "system.settings.manage",
                    "system.backup.manage",
                    "system.modules.manage",
                    "system.import.manage",
                    "users.manage",
                    "permissions.manage",
                ]
            },
            {
                name: "Dean of Students",
                description: "Student-facing administrator with oversight over affairs, disciplines, and welfare.",
                permissions: [
                    "student_affairs.event.manage",
                    "student_affairs.club.approve",
                    "student_affairs.bulletin.manage",
                    "disciplinary.records.manage",
                    "disciplinary.records.view",
                    "students.view",
                    "communication.broadcast.manage",
                    "communication.announcements.manage",
                ]
            },
            {
                name: "Admissions Officer",
                description: "Manages the full admissions pipeline: sessions, applications, CBT, and data capture.",
                permissions: [
                    "admission.sessions.manage",
                    "admission.applications.manage",
                    "admission.data.capture",
                    "admission.cbt.manage",
                    "admission.exams.manage",
                    "admission.screening.view",
                    "admission.applicant.admit",
                    "students.manage",
                    "students.enroll",
                ]
            },
            {
                name: "HR Officer",
                description: "Manages all HR operations: staff attendance, leaves, performance, and recruitment.",
                permissions: [
                    "hr.staff.view",
                    "hr.staff.manage",
                    "hr.leave.manage",
                    "hr.leave.approve",
                    "hr.attendance.manage",
                    "hr.performance.manage",
                    "hr.relations.manage",
                    "hr.recruitment.manage",
                ]
            },
            {
                name: "Scholarship Officer",
                description: "Manages student scholarship awards and bursary loan records.",
                permissions: [
                    "finance.scholarships.manage",
                    "finance.loans.manage",
                    "students.view",
                ]
            },
        ];

        for (const roleDef of officerRoles) {
            let roleId: number;
            const [existingRole] = await db.select().from(roles).where(eq(roles.name, roleDef.name)).limit(1);
            
            if (!existingRole) {
                const [newRole] = await db.insert(roles).values({
                    name: roleDef.name,
                    description: roleDef.description
                });
                roleId = newRole.insertId;
            } else {
                roleId = existingRole.id;
            }

            // Bind Permissions to Role
            for (const permName of roleDef.permissions) {
                const [perm] = await db.select().from(permissions).where(eq(permissions.name, permName)).limit(1);
                if (perm) {
                    const [existingRP] = await db.select().from(rolePermissions).where(and(
                        eq(rolePermissions.roleId, roleId),
                        eq(rolePermissions.permissionId, perm.id)
                    )).limit(1);
                    
                    if (!existingRP) {
                        await db.insert(rolePermissions).values({
                            roleId,
                            permissionId: perm.id
                        });
                    }
                }
            }
        }

        // 3. Seed "Portal Usage Instructions" CMS page
        const [existingPage] = await db.select()
            .from(cmsPages)
            .where(and(eq(cmsPages.slug, "portal-usage"), eq(cmsPages.locale, "en")))
            .limit(1);

        if (!existingPage) {
            const pageData = {
                title: "Portal Usage Instructions",
                slug: "portal-usage",
                content: `<h2>Portal Navigation & Usage Guide</h2>
<p>Welcome to the official <strong>School Portal</strong>! This comprehensive guide provides step-by-step instructions on how to navigate and utilize the various modules available to students, staff, and administrators.</p>

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
                metaDescription: "Learn how to use the school portal, register courses, request maintenance, and check results.",
                status: "published" as const,
                isSystemPage: false,
                locale: "en",
                createdAt: new Date(),
                updatedAt: new Date()
            };
            await db.insert(cmsPages).values(pageData);
        }

        return { success: true, message: "Principal roles, permissions, and default pages seeded successfully" };
    } catch (error: any) {
        console.error("Seeding error:", error);
        return { success: false, error: error.message };
    }
}

