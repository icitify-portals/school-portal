import { db } from "@/db/db";
import { examTimetableSlots, examInvigilators, courseLecturers, courses, departments, venues as venuesTable, staffProfiles } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export class ExamTimetableAutoScheduler {
    static async generate(deptId: number, sessionId: number, semester: '1' | '2', preserveExisting: boolean = true, startDateStr: string = new Date().toISOString().split('T')[0]) {
        // Fetch courses running in this department/session/semester
        // We get courses by looking at courseLecturers
        const assignments = await db.select({
            assignment: courseLecturers,
            course: courses,
            dept: departments
        })
        .from(courseLecturers)
        .leftJoin(courses, eq(courseLecturers.courseId, courses.id))
        .leftJoin(departments, eq(courseLecturers.deptId, departments.id))
        .where(and(
            eq(courseLecturers.deptId, deptId),
            eq(courseLecturers.sessionId, sessionId),
            eq(courseLecturers.semester, semester)
        ));

        if (assignments.length === 0) return { success: false, error: "No courses found for this department." };

        const facultyId = assignments[0].dept?.facultyId;
        if (!facultyId) return { success: false, error: "Department is not linked to a faculty." };

        // Fetch Venues and Staff for Invigilation
        const availableVenues = await db.select().from(venuesTable).where(eq(venuesTable.facultyId, facultyId));
        if (availableVenues.length === 0) return { success: false, error: "No venues available." };

        const availableStaff = await db.select().from(staffProfiles).where(eq(staffProfiles.departmentId, deptId));
        if (availableStaff.length === 0) return { success: false, error: "No staff available for invigilation." };

        const existingSlots = await db.select().from(examTimetableSlots);
        
        // Find existing courses scheduled if preserving
        const existingCourseIds = preserveExisting ? new Set(existingSlots.map(s => s.courseId)) : new Set<number>();

        if (!preserveExisting) {
            // Delete slots for these courses
            const courseIds = assignments.map(a => a.course!.id);
            for (const cid of courseIds) {
                const slotsToDelete = existingSlots.filter(s => s.courseId === cid);
                for (const slot of slotsToDelete) {
                    await db.delete(examInvigilators).where(eq(examInvigilators.examSlotId, slot.id));
                    await db.delete(examTimetableSlots).where(eq(examTimetableSlots.id, slot.id));
                }
            }
        }

        const workingHours = [9, 13]; // Exams usually at 9:00 AM and 1:00 PM (3 hours duration)
        let currentDate = new Date(startDateStr);
        let successCount = 0;
        let failCount = 0;

        for (const item of assignments) {
            const courseId = item.course!.id;
            if (existingCourseIds.has(courseId)) continue; // skip if preserved

            let scheduled = false;

            // Search forward up to 14 days
            for (let dayOffset = 0; dayOffset < 14; dayOffset++) {
                if (scheduled) break;
                const testDate = new Date(currentDate);
                testDate.setDate(testDate.getDate() + dayOffset);
                if (testDate.getDay() === 0 || testDate.getDay() === 6) continue; // Skip weekends

                for (const hour of workingHours) {
                    if (scheduled) break;
                    const startTime = `${hour.toString().padStart(2, '0')}:00`;
                    const endTime = `${(hour + 3).toString().padStart(2, '0')}:00`;

                    for (const venue of availableVenues) {
                        if (scheduled) break;
                        
                        // Check Venue Clash
                        const clash = await db.select().from(examTimetableSlots).where(and(
                            eq(examTimetableSlots.examDate, testDate),
                            eq(examTimetableSlots.startTime, startTime),
                            eq(examTimetableSlots.venueId, venue.id)
                        )).limit(1);

                        if (clash.length === 0) {
                            // Assign Slot
                            const [result] = await db.insert(examTimetableSlots).values({
                                courseId,
                                examDate: testDate,
                                startTime,
                                endTime,
                                venueId: venue.id
                            });
                            
                            const slotId = (result as any).insertId;
                            
                            // Assign 1 random Invigilator
                            const randomStaff = availableStaff[Math.floor(Math.random() * availableStaff.length)];
                            await db.insert(examInvigilators).values({
                                examSlotId: slotId,
                                staffId: randomStaff.id,
                                role: 'chief'
                            });

                            scheduled = true;
                            successCount++;
                        }
                    }
                }
            }
            if (!scheduled) failCount++;
        }

        return { success: true, message: `Auto-scheduled ${successCount} exams. Failed: ${failCount}.` };
    }
}
