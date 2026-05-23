import { getNews } from "@/actions/cms-publishing";
import NewsEditorForm from "../../editor-form";
import { notFound } from "next/navigation";

export default async function EditNewsPage({ params }: { params: { id: string } }) {
    const res = await getNews();
    const item = res.data?.find(n => n.id === parseInt(params.id));
    
    if (!item) {
        return notFound();
    }

    return <NewsEditorForm initialData={item} />;
}
