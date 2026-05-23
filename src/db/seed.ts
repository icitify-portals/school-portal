import { db } from "./db";
import * as schema from "./schema";
import bcrypt from "bcryptjs";

async function main() {
  console.log("Seeding data...");

  // 1. Create Organization
  const [org] = await db.insert(schema.organizations).values({
    name: "Main University",
    slug: "main-uni",
  });
  const orgId = (org as any).insertId;

  // 2. Create Institutional Unit
  const [unit] = await db.insert(schema.institutionalUnits).values({
    organizationId: orgId,
    name: "Main Campus",
    code: "MC001",
    slug: "main",
    type: "campus",
    academicTier: "tertiary",
  });
  const unitId = (unit as any).insertId;

  // 3. Create Faculty
  const [faculty] = await db.insert(schema.faculties).values({
    unitId: unitId,
    name: "Faculty of Science",
    code: "FSC",
  });
  const facultyId = (faculty as any).insertId;

  // 4. Create Department
  const [dept] = await db.insert(schema.departments).values({
    facultyId: facultyId,
    unitId: unitId,
    name: "Computer Science",
    code: "CSC",
  });
  const deptId = (dept as any).insertId;

  // 5. Create Programme
  const [prog] = await db.insert(schema.programmes).values({
    deptId: deptId,
    name: "B.Sc. Computer Science",
    code: "BSCCSC",
    durationMonths: 48,
    durationYears: 4,
  });
  const progId = (prog as any).insertId;

  // 6. Create Academic Session
  const [session] = await db.insert(schema.academicSessions).values({
    name: "2024/2025",
    startDate: "2024-09-01",
    endDate: "2025-08-31",
    isCurrent: true,
    currentSemester: "1",
    isRegistrationOpen: true,
    status: "active",
  } as any);
  const sessionId = (session as any).insertId;

  // 7. Create Roles and Permissions (if needed, but usually roles are enums in users table)
  // Let's create some users

  const password = await bcrypt.hash("password123", 10);

  // Admin User
  const [adminUser] = await db.insert(schema.users).values({
    name: "System Admin",
    email: "admin@test.com",
    password: password,
    role: "admin",
    status: "active",
  });
  const adminUserId = (adminUser as any).insertId;

  // Staff User
  const [staffUser] = await db.insert(schema.users).values({
    name: "Mary Staff",
    email: "staff@test.com",
    password: password,
    role: "staff",
    status: "active",
  });
  const staffUserId = (staffUser as any).insertId;

  await db.insert(schema.staffProfiles).values({
    userId: staffUserId,
    staffId: "STF001",
    departmentId: deptId,
    unitId: unitId,
    jobTitle: "Lecturer I",
    rank: "Lecturer",
    designation: "Academic",
  });

  // Student User
  const [studentUser] = await db.insert(schema.users).values({
    name: "John Student",
    email: "student@test.com",
    password: password,
    role: "student",
    status: "active",
  });
  const studentUserId = (studentUser as any).insertId;

  await db.insert(schema.students).values({
    userId: studentUserId,
    firstName: "John",
    lastName: "Doe",
    programmeId: progId,
    deptId: deptId,
    unitId: unitId,
    matricNumber: "CSC/2024/001",
    admissionYear: 2024,
    admissionSessionId: sessionId,
    currentLevel: 100,
    gender: "male",
    status: "active",
  });

  // 8. Create some courses
  const [course] = await db.insert(schema.courses).values({
    name: "Introduction to Computing",
    code: "CSC101",
    creditUnits: 3,
    description: "Basic concepts of computing",
  });
  const courseId = (course as any).insertId;

  await db.insert(schema.courseDepartmentSettings).values({
    courseId: courseId,
    deptId: deptId,
    semester: "1",
    status: "compulsory",
    level: 100,
  });

  console.log("Seeding completed successfully!");
  process.exit(0);
}

main().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
