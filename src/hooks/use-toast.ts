"use client"

export function useToast() {
    const toast = ({ title, description, variant }: { title: string, description?: string, variant?: 'default' | 'destructive' }) => {
        const prefix = variant === 'destructive' ? 'ERROR: ' : '';
        alert(`${prefix}${title}${description ? '\n' + description : ''}`);
    };

    return { toast };
}
