import ExamSlotManager from "@/components/admin/cbt/ExamSlotManager";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Exam Slot Management | School Portal",
    description: "Centrally manage examination and quiz time slots.",
};

export default function ExamSlotsPage() {
    return (
        <div className="p-6 md:p-10 max-w-[1600px] w-full mx-auto space-y-10">
            <ExamSlotManager />
        </div>
    );
}
