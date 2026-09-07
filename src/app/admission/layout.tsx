import { auth } from "@/auth";

export default async function AdmissionLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    return (
        <>
            {children}
        </>
    );
}
