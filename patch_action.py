import sys

try:
    content = open('src/actions/result-module.ts', 'r', encoding='utf-8').read()

    old_func = """export async function getBulkTranscripts(programmeId?: number) {
  try {
    const query = programmeId 
      ? eq(students.programmeId, programmeId)
      : undefined;
      
    const matchingStudents = await db.query.students.findMany({
      where: query,
      with: { user: true }
    });
    
    // Process in batches so we don't overload the DB
    const results = [];
    for (const student of matchingStudents) {
      try {
        const tData = await getStudentTranscriptData(student.id);
        if (tData.transcripts && tData.transcripts.length > 0) {
          results.push(tData);
        }
      } catch (e) {
        console.error("Failed to fetch transcript for student", student.id, e);
      }
    }
    
    return { success: true, data: results };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}"""

    new_func = """export async function getBulkTranscripts(filters: { programmeId?: number, departmentId?: number, facultyId?: number, studentIds?: number[], all?: boolean }) {
  try {
    let queryConditions = [];
    
    if (filters.studentIds && filters.studentIds.length > 0) {
      queryConditions.push(inArray(students.id, filters.studentIds));
    } else if (!filters.all) {
      if (filters.programmeId) {
        queryConditions.push(eq(students.programmeId, filters.programmeId));
      } else if (filters.departmentId) {
        queryConditions.push(eq(students.deptId, filters.departmentId));
      } else if (filters.facultyId) {
        // Find all departments in this faculty
        const depts = await db.query.departments.findMany({
          where: eq(departments.facultyId, filters.facultyId),
          columns: { id: true }
        });
        const deptIds = depts.map(d => d.id);
        if (deptIds.length > 0) {
          queryConditions.push(inArray(students.deptId, deptIds));
        } else {
          // Empty faculty
          queryConditions.push(eq(students.id, 0)); 
        }
      }
    }

    const matchingStudents = await db.query.students.findMany({
      where: queryConditions.length > 0 ? and(...queryConditions) : undefined,
      with: { user: true }
    });
    
    // Process in batches so we don't overload the DB
    const results = [];
    for (const student of matchingStudents) {
      try {
        const tData = await getStudentTranscriptData(student.id);
        if (tData.transcripts && tData.transcripts.length > 0) {
          results.push(tData);
        }
      } catch (e) {
        console.error("Failed to fetch transcript for student", student.id, e);
      }
    }
    
    return { success: true, data: results };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}"""
    if old_func in content:
        content = content.replace(old_func, new_func)
        
        # Need to import departments, inArray, and from drizzle-orm if not already
        if " departments," not in content and "{ departments }" not in content:
            content = content.replace("import { students", "import { students, departments")
        if "inArray" not in content:
            content = content.replace("eq, ", "eq, inArray, ")
            
        open('src/actions/result-module.ts', 'w', encoding='utf-8').write(content)
        print("SUCCESS")
    else:
        print("Function not found")
except Exception as e:
    print(e)
