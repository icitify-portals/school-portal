export interface NomenclatureSettings {
    academic_nomenclature_type?: string; // 'term' | 'semester' | 'quarter' | 'annual'
    academic_nomenclature_subdivision_names?: string; // comma-separated subdivision names
}

export class AcademicNomenclature {
    /**
     * Resolves the label for a specific subdivision (1-indexed).
     * E.g., "1" maps to "First Term" or "First Semester"
     */
    static getLabel(
        subdivision: string | number | null | undefined,
        settings?: NomenclatureSettings | Record<string, string>
    ): string {
        if (!subdivision) return "N/A";
        
        const subIndex = parseInt(subdivision.toString());
        if (isNaN(subIndex)) return subdivision.toString();

        const type = settings?.academic_nomenclature_type || "semester";
        const customNamesStr = settings?.academic_nomenclature_subdivision_names;

        if (customNamesStr) {
            const names = customNamesStr.split(",").map(n => n.trim());
            if (names[subIndex - 1]) {
                return names[subIndex - 1];
            }
        }

        // Default fallbacks
        if (type === "term") {
            const termNames = ["First Term", "Second Term", "Third Term"];
            return termNames[subIndex - 1] || `Term ${subIndex}`;
        } else if (type === "quarter") {
            const quarterNames = ["First Quarter", "Second Quarter", "Third Quarter", "Fourth Quarter"];
            return quarterNames[subIndex - 1] || `Quarter ${subIndex}`;
        } else if (type === "annual") {
            return "Annual Session";
        } else {
            // Default: semester
            const semNames = ["First Semester", "Second Semester"];
            return semNames[subIndex - 1] || `Semester ${subIndex}`;
        }
    }

    /**
     * Resolves the singular nomenclature name.
     */
    static getSingular(settings?: NomenclatureSettings | Record<string, string>): string {
        const type = settings?.academic_nomenclature_type || "semester";
        if (type === "term") return "Term";
        if (type === "quarter") return "Quarter";
        if (type === "annual") return "Annual";
        return "Semester";
    }

    /**
     * Resolves the plural nomenclature name.
     */
    static getPlural(settings?: NomenclatureSettings | Record<string, string>): string {
        const type = settings?.academic_nomenclature_type || "semester";
        if (type === "term") return "Terms";
        if (type === "quarter") return "Quarters";
        if (type === "annual") return "Annuals";
        return "Semesters";
    }
}
