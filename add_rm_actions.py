import sys

content = open('src/actions/result-module.ts', 'r', encoding='utf-8').read()

new_actions = """
export async function createStudentRm(data: any) {
  try {
    const allowed = await hasRole("admin") || await hasRole("superadmin") || await hasPermission("result_module.manage");
    if (!allowed) return { success: false, error: "Unauthorized" };
    
    // Simplistic creation of user + student
    const [userRes] = await db.insert(users).values({
      name: data.name,
      email: (data.matricNumber || "unknown") + "@fssibadan.edu.ng",
      password: "hashed_password",
      role: "student"
    });
    
    await db.insert(students).values({
      userId: userRes.insertId,
      matricNumber: data.matricNumber,
    });
    
    revalidatePath("/admin/result-module/students");
    return { success: true };
  } catch(e) {
    return { success: false, error: "Failed to create student. " + String(e) };
  }
}

export async function deleteStudentRm(id: number) {
  try {
    const allowed = await hasRole("admin") || await hasRole("superadmin") || await hasPermission("result_module.manage");
    if (!allowed) return { success: false, error: "Unauthorized" };
    
    const [stu] = await db.select().from(students).where(eq(students.id, id));
    if (stu) {
      await db.delete(students).where(eq(students.id, id));
      await db.delete(users).where(eq(users.id, stu.userId));
    }
    
    revalidatePath("/admin/result-module/students");
    return { success: true };
  } catch(e) {
    return { success: false, error: "Failed to delete student. " + String(e) };
  }
}

export async function updateStudentRm(id: number, data: any) {
  try {
    const allowed = await hasRole("admin") || await hasRole("superadmin") || await hasPermission("result_module.manage");
    if (!allowed) return { success: false, error: "Unauthorized" };
    
    await db.update(students).set({
      matricNumber: data.matricNumber,
    }).where(eq(students.id, id));
    
    const [stu] = await db.select().from(students).where(eq(students.id, id));
    if (stu) {
      await db.update(users).set({ name: data.name }).where(eq(users.id, stu.userId));
    }
    
    revalidatePath("/admin/result-module/students");
    return { success: true };
  } catch(e) {
    return { success: false, error: "Failed to update student. " + String(e) };
  }
}
"""

if 'createStudentRm' not in content:
    content += new_actions
    open('src/actions/result-module.ts', 'w', encoding='utf-8').write(content)
    print('SUCCESS')
