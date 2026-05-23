
import SeedingButton from "@/components/seeding/SeedingButton";

export default function SeedingPage() {
    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Law Curriculum Seeding Dashboard</h1>
            <p className="mb-6 text-muted-foreground">
                Use this dashboard to seed or re-seed the Law Faculty curriculum, including departments, courses, and staff profiles.
                Note: Existing data will not be duplicated.
            </p>

            <div className="border p-4 rounded-lg bg-card">
                <h2 className="text-xl font-semibold mb-2">Actions</h2>
                <div className="flex gap-4 items-center">
                    <SeedingButton />
                </div>
            </div>
        </div>
    );
}
