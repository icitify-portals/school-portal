export function amountInWords(amount: number): string {
    const ones = [
        "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
        "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
        "Seventeen", "Eighteen", "Nineteen"
    ];
    const tens = [
        "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"
    ];
    const scales = ["", "Thousand", "Million", "Billion"];

    function convertLessThanThousand(num: number): string {
        let words = "";
        if (num >= 100) {
            words += ones[Math.floor(num / 100)] + " Hundred";
            num %= 100;
            if (num > 0) words += " and ";
        }
        if (num >= 20) {
            words += tens[Math.floor(num / 10)];
            num %= 10;
            if (num > 0) words += "-" + ones[num];
        } else if (num > 0) {
            words += ones[num];
        }
        return words;
    }

    if (amount === 0) return "Zero Naira Only";

    // Handle floating point inaccuracies
    const totalCents = Math.round(amount * 100);
    const nairaPart = Math.floor(totalCents / 100);
    const koboPart = totalCents % 100;

    let nairaWords = "";
    if (nairaPart > 0) {
        let temp = nairaPart;
        let scaleIndex = 0;
        const groups: string[] = [];

        while (temp > 0) {
            const group = temp % 1000;
            if (group > 0) {
                const groupWords = convertLessThanThousand(group);
                const scale = scales[scaleIndex];
                groups.unshift(groupWords + (scale ? " " + scale : ""));
            }
            temp = Math.floor(temp / 1000);
            scaleIndex++;
        }
        nairaWords = groups.join(", ") + " Naira";
    }

    let koboWords = "";
    if (koboPart > 0) {
        const koboValWords = convertLessThanThousand(koboPart);
        koboWords = koboValWords + " Kobo";
    }

    if (nairaWords && koboWords) {
        return `${nairaWords} and ${koboWords} Only`;
    } else if (nairaWords) {
        return `${nairaWords} Only`;
    } else if (koboWords) {
        return `${koboWords} Only`;
    }

    return "Zero Naira Only";
}
