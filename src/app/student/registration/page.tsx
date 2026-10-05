import { redirect } from "next/navigation";

/**
 * Course registration now lives at /student/courses/registration.
 *
 * The old page here grouped courses by `setting.status` and `isGST`, neither of
 * which getCourses() returns, so it rendered four empty sections while writing
 * to a separate `enrollments` store the rest of the portal did not read. It is
 * kept only as a redirect so existing bookmarks keep working.
 */
export default function StudentRegistrationRedirect() {
    redirect("/student/courses/registration");
}