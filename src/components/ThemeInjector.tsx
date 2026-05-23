import { getBrandingSettings } from "@/actions/settings";

export default async function ThemeInjector() {
    const branding = await getBrandingSettings();

    // Inject CSS variables based on branding settings
    return (
        <style dangerouslySetInnerHTML={{
            __html: `
                :root {
                    --brand-primary: ${branding.COLOR_PRIMARY || '#4f46e5'};
                    --brand-secondary: ${branding.COLOR_SECONDARY || '#0f172a'};
                    --brand-primary-rgb: ${hexToRgb(branding.COLOR_PRIMARY || '#4f46e5')};
                    --brand-secondary-rgb: ${hexToRgb(branding.COLOR_SECONDARY || '#0f172a')};
                }
                
                /* Global Overrides */
                .bg-brand { background-color: var(--brand-primary) !important; }
                .text-brand { color: var(--brand-primary) !important; }
                .border-brand { border-color: var(--brand-primary) !important; }
                .hover\:text-brand:hover { color: var(--brand-primary) !important; }
                .hover\:bg-brand:hover { background-color: var(--brand-primary) !important; }

                /* Dynamic Background and Borders for Shell/Layout Containers */
                .bg-slate-900 { background-color: var(--brand-secondary) !important; }
                .bg-slate-950 { background-color: var(--brand-secondary) !important; filter: brightness(0.85); }
                .border-slate-800 { border-color: rgba(255, 255, 255, 0.08) !important; }
                
                /* Tailwind Indigo Overrides */
                .bg-indigo-600 { background-color: var(--brand-primary) !important; }
                .bg-indigo-50 { background-color: rgba(var(--brand-primary-rgb), 0.08) !important; }
                .text-indigo-600 { color: var(--brand-primary) !important; }
                .text-indigo-400 { color: var(--brand-primary) !important; opacity: 0.9; }
                .border-indigo-600 { border-color: var(--brand-primary) !important; }
                .hover\:bg-indigo-600:hover { background-color: var(--brand-primary) !important; }
                .hover\:bg-indigo-700:hover { background-color: var(--brand-primary) !important; filter: brightness(0.9); }
                .hover\:text-indigo-600:hover { color: var(--brand-primary) !important; }
                .hover\:text-indigo-400:hover { color: var(--brand-primary) !important; }
                .group-hover\:text-indigo-300:group-hover { color: var(--brand-primary) !important; }
                .group-hover\:text-indigo-600:group-hover { color: var(--brand-primary) !important; }
                .group-focus\:text-indigo-600:group-focus { color: var(--brand-primary) !important; }
                .focus\:bg-indigo-50:focus { background-color: rgba(var(--brand-primary-rgb), 0.08) !important; }
                .ring-indigo-500\/20 { --tw-ring-color: rgba(var(--brand-primary-rgb), 0.2) !important; }
                .focus\:ring-indigo-500:focus { --tw-ring-color: var(--brand-primary) !important; }

                /* Tailwind Blue Overrides */
                .bg-blue-600 { background-color: var(--brand-primary) !important; }
                .bg-blue-500 { background-color: var(--brand-primary) !important; }
                .bg-blue-50 { background-color: rgba(var(--brand-primary-rgb), 0.08) !important; }
                .text-blue-600 { color: var(--brand-primary) !important; }
                .text-blue-500 { color: var(--brand-primary) !important; }
                .text-blue-700 { color: var(--brand-primary) !important; filter: brightness(0.85); }
                .border-blue-600 { border-color: var(--brand-primary) !important; }
                .hover\:bg-blue-600:hover { background-color: var(--brand-primary) !important; }
                .hover\:bg-blue-700:hover { background-color: var(--brand-primary) !important; filter: brightness(0.9); }
                .hover\:text-blue-600:hover { color: var(--brand-primary) !important; }
                .hover\:text-blue-800:hover { color: var(--brand-primary) !important; filter: brightness(0.8); }
                .shadow-blue-500\/20 { --tw-shadow-color: rgba(var(--brand-primary-rgb), 0.2) !important; }
                .shadow-blue-600\/40 { --tw-shadow-color: rgba(var(--brand-primary-rgb), 0.4) !important; }
                .focus\:ring-blue-500:focus { --tw-ring-color: var(--brand-primary) !important; }

                /* Tailwind Emerald Overrides */
                .bg-emerald-600 { background-color: var(--brand-primary) !important; }
                .bg-emerald-500 { background-color: var(--brand-primary) !important; }
                .bg-emerald-500\/10 { background-color: rgba(var(--brand-primary-rgb), 0.1) !important; }
                .bg-emerald-500\/20 { background-color: rgba(var(--brand-primary-rgb), 0.2) !important; }
                .bg-emerald-600\/30 { background-color: rgba(var(--brand-primary-rgb), 0.3) !important; }
                .text-emerald-600 { color: var(--brand-primary) !important; }
                .text-emerald-400 { color: var(--brand-primary) !important; opacity: 0.95; }
                .text-emerald-700 { color: var(--brand-primary) !important; filter: brightness(0.85); }
                .text-emerald-100 { color: rgba(255, 255, 255, 0.9) !important; }
                .border-emerald-500\/20 { border-color: rgba(var(--brand-primary-rgb), 0.2) !important; }
                .hover\:bg-emerald-700:hover { background-color: var(--brand-primary) !important; filter: brightness(0.9); }
                .hover\:bg-emerald-600:hover { background-color: var(--brand-primary) !important; filter: brightness(0.95); }
                .shadow-emerald-600\/40 { --tw-shadow-color: rgba(var(--brand-primary-rgb), 0.4) !important; }
                .shadow-emerald-500\/20 { --tw-shadow-color: rgba(var(--brand-primary-rgb), 0.2) !important; }
                .from-emerald-500\/10 { --tw-gradient-from: rgba(var(--brand-primary-rgb), 0.1) !important; }
                .prose-a\:text-emerald-600 a { color: var(--brand-primary) !important; }
            `
        }} />
    );
}

function hexToRgb(hex: string) {
    var result = /^#?([a-f\\d]{2})([a-f\\d]{2})([a-f\\d]{2})$/i.exec(hex);
    return result ?
        `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` :
        "79, 70, 229";
}
