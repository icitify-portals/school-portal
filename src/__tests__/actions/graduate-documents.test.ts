import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  checkGraduationEligibility,
  promoteStudentToGraduate,
  applyForGraduateDocument,
  confirmDocumentApplicationPayment,
  updateRegistryApplicationStatus,
  createDocumentForm,
  configureDocumentPricingRule
} from '../../actions/graduate-documents';
import { db } from '@/db/db';
import { auth } from '@/auth';

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('@/db/schema', () => ({
  students: { id: 'id' },
  studentCourseRegistrations: { studentId: 'studentId' },
  courseDepartmentSettings: { deptId: 'deptId' },
  courses: { id: 'id' },
  resultMarks: { studentId: 'studentId' },
  studentClearances: { studentId: 'studentId' },
  academicSessions: { name: 'name' },
  graduateProfiles: { studentId: 'studentId', category: 'category' },
  documentApplications: { id: 'id' },
  documentPricingRules: { id: 'id' },
  payment_transactions: { transactionReference: 'tx' },
  transactions: { gatewayReference: 'tx' },
  graduateDocumentApplications: { id: 'id' },
  systemAuditLogs: { id: 'id' },
  settlementAccounts: { id: 'id' },
  documentTypes: { id: 'id' },
  documentForms: { id: 'id' }
}));

describe('Graduate Documents Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock db.query object completely
    db.query = {
      students: {
        findFirst: vi.fn(),
      },
      academicSessions: {
        findFirst: vi.fn(),
      },
      graduateProfiles: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
      documentPricingRules: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
      documentForms: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
      graduateDocumentApplications: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      }
    } as any;
  });

  describe('checkGraduationEligibility', () => {
    it('should return error if student or programme is not found', async () => {
      (db.query.students.findFirst as any).mockResolvedValue(null);
      const result = await checkGraduationEligibility(999);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Student profile not found');
    });

    it('should evaluate eligible students as graduation-ready', async () => {
      // 1. Mock student query response
      (db.query.students.findFirst as any).mockResolvedValue({
        id: 1,
        userId: 10,
        currentLevel: 400,
        gender: 'Male',
        dob: '2000-01-01',
        deptId: 5,
        user: { name: 'John Doe' },
        programme: { name: 'B.Sc. Computer Science' }
      });

      // 2. Mock db.select responses:
      // - First select: registered semesters spent (count)
      // - Second select: compulsory courses
      // - Third select: resultMarks
      // - Fourth select: studentClearances
      let selectCallIndex = 0;
      (db.select as any).mockImplementation(() => {
        const count = selectCallIndex++;
        const results = [
          // Query 1: unique registered semesters
          [{ count: 8 }],
          // Query 2: compulsory courses
          [
            { courseId: 101, code: 'CSC401', name: 'Software Engineering', creditUnits: 3 },
            { courseId: 102, code: 'CSC402', name: 'Database Systems', creditUnits: 3 }
          ],
          // Query 3: result marks (passed all with score >= 40)
          [
            { courseId: 101, grade: 'A', totalScore: '80', gradePoint: 5 },
            { courseId: 102, grade: 'B', totalScore: '65', gradePoint: 4 }
          ],
          // Query 4: clearances
          [
            { id: 1, status: 'cleared' }
          ]
        ];

        const data = results[count] || [];
        const chain: any = {
          from: vi.fn(() => chain),
          where: vi.fn(() => chain),
          innerJoin: vi.fn(() => chain),
          limit: vi.fn(() => chain),
          orderBy: vi.fn(() => chain),
          then: vi.fn((cb) => Promise.resolve(cb(data))),
        };
        
        return Object.assign(Promise.resolve(data), chain);
      });

      const result = await checkGraduationEligibility(1);
      expect(result.success).toBe(true);
      expect(result.isEligible).toBe(true);
      expect(result.semestersSpent).toBe(8);
      expect(result.passedCredits).toBe(6); // 3 + 3
      expect(result.cgpa).toBe(4.5); // (5*3 + 4*3) / 6 = 4.5
      expect(result.unpassedCompulsoryCourses).toHaveLength(0);
    });

    it('should flag carryover courses and mark student as ineligible', async () => {
      (db.query.students.findFirst as any).mockResolvedValue({
        id: 1,
        userId: 10,
        currentLevel: 400,
        gender: 'Male',
        dob: '2000-01-01',
        deptId: 5,
        user: { name: 'John Doe' },
        programme: { name: 'B.Sc. Computer Science' }
      });

      let selectCallIndex = 0;
      (db.select as any).mockImplementation(() => {
        const count = selectCallIndex++;
        const results = [
          [{ count: 8 }],
          // Compulsory courses
          [
            { courseId: 101, code: 'CSC401', name: 'Software Engineering', creditUnits: 3 },
            { courseId: 102, code: 'CSC402', name: 'Database Systems', creditUnits: 3 }
          ],
          // Result marks (failed CSC402)
          [
            { courseId: 101, grade: 'A', totalScore: '80', gradePoint: 5 },
            { courseId: 102, grade: 'F', totalScore: '30', gradePoint: 0 }
          ],
          // Clearances
          [{ id: 1, status: 'cleared' }]
        ];

        const data = results[count] || [];
        const chain: any = {
          from: vi.fn(() => chain),
          where: vi.fn(() => chain),
          innerJoin: vi.fn(() => chain),
          limit: vi.fn(() => chain),
          orderBy: vi.fn(() => chain),
          then: vi.fn((cb) => Promise.resolve(cb(data))),
        };
        return Object.assign(Promise.resolve(data), chain);
      });

      const result = await checkGraduationEligibility(1);
      expect(result.success).toBe(true);
      expect(result.isEligible).toBe(false);
      expect(result.unpassedCompulsoryCourses).toContain('CSC402 - Database Systems');
    });
  });

  describe('promoteStudentToGraduate', () => {
    it('should prevent promotion for non-admin roles', async () => {
      (auth as any).mockResolvedValue({ user: { id: '2', role: 'student' } });
      const result = await promoteStudentToGraduate(1);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Unauthorized');
    });

    it('should promote an eligible student and create graduate profile', async () => {
      (auth as any).mockResolvedValue({ user: { id: '99', role: 'registrar' } });

      (db.query.students.findFirst as any).mockImplementation(async () => {
        return {
          id: 1,
          userId: 10,
          currentLevel: 400,
          gender: 'Male',
          dob: '2000-01-01',
          deptId: 5,
          programmeId: 12,
          user: { name: 'John Doe' },
          programme: { name: 'B.Sc. Computer Science' }
        };
      });

      (db.query.academicSessions.findFirst as any).mockResolvedValue({
        id: 3,
        name: '2025/2026'
      });

      let selectCallIndex = 0;
      (db.select as any).mockImplementation(() => {
        const count = selectCallIndex++;
        const results = [
          [{ count: 8 }], // registered semesters count
          [{ courseId: 101, code: 'CSC401', name: 'Software Eng', creditUnits: 3 }], // compulsory
          [{ courseId: 101, grade: 'A', totalScore: '80', gradePoint: 5 }], // results
          [{ id: 1, status: 'cleared' }], // clearances
          [] // existing graduate profile check
        ];

        const data = results[count] || [];
        const chain: any = {
          from: vi.fn(() => chain),
          where: vi.fn(() => chain),
          innerJoin: vi.fn(() => chain),
          limit: vi.fn(() => chain),
          orderBy: vi.fn(() => chain),
          then: vi.fn((cb) => Promise.resolve(cb(data))),
        };
        return Object.assign(Promise.resolve(data), chain);
      });

      const mockInsertValues = vi.fn().mockResolvedValue([{ insertId: 77 }]);
      (db.insert as any).mockReturnValue({
        values: mockInsertValues
      });

      const mockUpdateSet = vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([{}])
      });
      (db.update as any).mockReturnValue({
        set: mockUpdateSet
      });

      const result = await promoteStudentToGraduate(1, 'First Class');
      console.log("promoteStudentToGraduate result:", result);
      expect(result.success).toBe(true);
      expect(result.profileId).toBe(77);
      expect(db.insert).toHaveBeenCalled();
      expect(db.update).toHaveBeenCalled();
    });
  });

  describe('applyForGraduateDocument', () => {
    it('should create document request application and setup pending transaction', async () => {
      (auth as any).mockResolvedValue({ user: { id: '10' } });

      (db.query.graduateProfiles.findFirst as any).mockResolvedValue({
        id: 50,
        studentId: 1,
        userId: 10
      });

      (db.query.documentPricingRules.findFirst as any).mockResolvedValue({
        id: 200,
        formId: 5,
        feeAmount: '5000.00'
      });

      let insertCallCount = 0;
      const mockInsertValues = vi.fn().mockImplementation(() => {
        const count = insertCallCount++;
        const ids = [1001, 5001]; // transactionId, applicationId
        return [{ insertId: ids[count] }];
      });
      (db.insert as any).mockReturnValue({
        values: mockInsertValues
      });

      const result = await applyForGraduateDocument({
        graduateProfileId: 50,
        formId: 5,
        formData: { reason: 'Employment' },
        deliveryMethod: 'courier_local',
        courierAddress: '123 Main St',
        contactEmail: 'graduate@example.com'
      });

      expect(result.success).toBe(true);
      expect(result.applicationId).toBe(5001);
      expect(result.checkoutUrl).toContain('amount=5000');
      expect(mockInsertValues).toHaveBeenCalledTimes(2);
    });
  });

  describe('confirmDocumentApplicationPayment', () => {
    it('should complete transaction and mark application as paid', async () => {
      let selectCallIndex = 0;
      (db.select as any).mockImplementation(() => {
        const count = selectCallIndex++;
        const results = [
          [{ id: 1001, amount: '5000.00', gatewayReference: 'TX-123' }], // tx
          [{ id: 5001, transactionId: 1001, paymentStatus: 'unpaid' }] // app
        ];

        const data = results[count] || [];
        const chain: any = {
          from: vi.fn(() => chain),
          where: vi.fn(() => chain),
          limit: vi.fn(() => chain),
          then: vi.fn((cb) => Promise.resolve(cb(data))),
        };
        return Object.assign(Promise.resolve(data), chain);
      });

      const mockUpdateSet = vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([{}])
      });
      (db.update as any).mockReturnValue({
        set: mockUpdateSet
      });

      const result = await confirmDocumentApplicationPayment('TX-123');
      expect(result.success).toBe(true);
      expect(result.applicationId).toBe(5001);
      expect(db.update).toHaveBeenCalledTimes(2);
    });
  });

  describe('updateRegistryApplicationStatus', () => {
    it('should update application status and insert audit log', async () => {
      (auth as any).mockResolvedValue({ user: { id: '99', role: 'registrar' } });

      const mockUpdateSet = vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([{}])
      });
      (db.update as any).mockReturnValue({
        set: mockUpdateSet
      });

      const mockInsertValues = vi.fn().mockResolvedValue([{}]);
      (db.insert as any).mockReturnValue({
        values: mockInsertValues
      });

      const result = await updateRegistryApplicationStatus({
        applicationId: 5001,
        status: 'dispatched',
        comments: 'Sent via DHL',
        trackingNumber: 'DHL987654'
      });

      expect(result.success).toBe(true);
      expect(db.update).toHaveBeenCalled();
      expect(db.insert).toHaveBeenCalled();
    });
  });
});
