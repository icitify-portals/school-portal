export interface JambCandidateData {
    jambRegNo: string;
    surname: string;
    middlename?: string;
    firstname: string;
    dob: string;
    score: number;
    subjects: string[]; // ["Use of English", "Mathematics", "Physics", "Chemistry"]
    courseCode: string; // "CSC"
    imageUrl?: string;
}

export interface JambApiResponse {
    success: boolean;
    data?: JambCandidateData[];
    error?: string;
}

/**
 * Mock Service to simulate JAMB API interactions.
 * In production, this would make HTTP requests to the actual JAMB endpoint.
 */
export class JambMockProvider {
    private apiKey: string;
    private apiSecret: string; // Not used in mock but part of contract

    constructor(apiKey: string, secret: string) {
        this.apiKey = apiKey;
        this.apiSecret = secret;
    }

    async validateCredentials(): Promise<boolean> {
        // Simulate API check
        await new Promise(resolve => setTimeout(resolve, 1000));
        return this.apiKey.length > 5;
    }

    async fetchCandidates(year: string): Promise<JambApiResponse> {
        console.log(`[JAMB API] Fetching candidates for year ${year}...`);

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 2000));

        if (!this.apiKey) {
            return { success: false, error: "Invalid API Key" };
        }

        // Return mock data
        const mockData: JambCandidateData[] = [
            {
                jambRegNo: `${year}992837GH`,
                surname: "Adeboye",
                firstname: "Samuel",
                middlename: "Oluwaseun",
                dob: "2006-03-12",
                score: 285,
                subjects: ["Use of English", "Mathematics", "Physics", "Chemistry"],
                courseCode: "CSC",
                imageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Adeboye"
            },
            {
                jambRegNo: `${year}112233AB`,
                surname: "Okonkwo",
                firstname: "Chiamaka",
                middlename: "Grace",
                dob: "2005-11-20",
                score: 292,
                subjects: ["Use of English", "Biology", "Chemistry", "Physics"],
                courseCode: "MED", // Medicine - might not map if not in DB, good for testing
                imageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Okonkwo"
            },
            {
                jambRegNo: `${year}778899YZ`,
                surname: "Ibrahim",
                firstname: "Yusuf",
                dob: "2007-01-15",
                score: 240,
                subjects: ["Use of English", "Government", "Literature", "CRS"],
                courseCode: "LAW",
                imageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ibrahim"
            },
            {
                jambRegNo: `${year}554433XW`,
                surname: "Smith",
                firstname: "John",
                dob: "2006-06-06",
                score: 180,
                subjects: ["Use of English", "Mathematics", "Geography", "Economics"],
                courseCode: "GEO",
                imageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Smith"
            }
        ];

        return { success: true, data: mockData };
    }
}
