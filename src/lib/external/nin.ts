export interface NinData {
    nin: string;
    firstName: string;
    lastName: string;
    middleName?: string;
    dob: string;
    gender: string;
}

export class NinMockProvider {
    /**
     * Simulates fetching data from the National Identity Management Commission (NIMC)
     */
    async verify(nin: string): Promise<{ success: boolean; data?: NinData; error?: string }> {
        console.log(`[NIN API] Verifying NIN: ${nin}...`);

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        if (nin.length !== 11 || !/^\d+$/.test(nin)) {
            return { success: false, error: "Invalid NIN format. Must be 11 digits." };
        }

        // Mock data mapping (Last digits of NIN determine the mock profile)
        const lastDigit = nin.charAt(10);

        const mockProfiles: Record<string, NinData> = {
            '1': { nin, firstName: "Samuel", lastName: "Adeboye", middleName: "Oluwaseun", dob: "2006-03-12", gender: "male" },
            '2': { nin, firstName: "Chiamaka", lastName: "Okonkwo", middleName: "Grace", dob: "2005-11-20", gender: "female" },
            '3': { nin, firstName: "Yusuf", lastName: "Ibrahim", dob: "2007-01-15", gender: "male" },
            '4': { nin, firstName: "John", lastName: "Smith", dob: "2006-06-06", gender: "male" },
        };

        const profile = mockProfiles[lastDigit] || {
            nin,
            firstName: "Global",
            lastName: "Citizen",
            dob: "2000-01-01",
            gender: "other"
        };

        return { success: true, data: profile };
    }
}
