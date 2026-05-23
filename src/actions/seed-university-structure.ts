"use server";

import { db } from "@/db/db";
import { faculties, departments, programmes } from "@/db/schema";
import { eq } from "drizzle-orm";

// Comprehensive seed data for University of Ibadan structure
const FACULTIES_DATA = [
    { name: "Agriculture", code: "AGR" },
    { name: "Arts", code: "ART" },
    { name: "Basic Medical Sciences", code: "BMS" },
    { name: "Clinical Sciences", code: "CLN" },
    { name: "Dentistry", code: "DEN" },
    { name: "Economics", code: "ECN" },
    { name: "Education", code: "EDU" },
    { name: "Environmental Design and Management", code: "EDM" },
    { name: "Law", code: "LAW" },
    { name: "Pharmacy", code: "PHM" },
    { name: "Public Health", code: "PUH" },
    { name: "Renewable Natural Resources", code: "RNR" },
    { name: "Science", code: "SCI" },
    { name: "Social Sciences", code: "SOC" },
    { name: "Technology", code: "TEC" },
    { name: "Veterinary Medicine", code: "VET" },
    { name: "Business Administration", code: "BUA" },
    { name: "Arts and Humanities", code: "ARH" },
    { name: "Multidisciplinary Studies", code: "MDS" },
];

// Departments organized by faculty
const DEPARTMENTS_DATA: Record<string, Array<{ name: string; code: string; programmes: Array<{ name: string; durationMonths: number; durationYears: number }> }>> = {
    "Agriculture": [
        { 
            name: "Agricultural Economics", 
            code: "AGE",
            programmes: [
                { name: "B.Sc Agricultural Economics", durationMonths: 48, durationYears: 4 },
            ]
        },
        { 
            name: "Agricultural Extension and Rural Development", 
            code: "AER",
            programmes: [
                { name: "B.Sc Agricultural Extension and Rural Development", durationMonths: 48, durationYears: 4 },
            ]
        },
        { 
            name: "Agronomy", 
            code: "AGN",
            programmes: [
                { name: "B.Sc Agronomy", durationMonths: 48, durationYears: 4 },
            ]
        },
        { 
            name: "Animal Science", 
            code: "ANS",
            programmes: [
                { name: "B.Sc Animal Science", durationMonths: 48, durationYears: 4 },
            ]
        },
        { 
            name: "Aquaculture and Fisheries Management", 
            code: "AFM",
            programmes: [
                { name: "B.Sc Aquaculture and Fisheries Management", durationMonths: 48, durationYears: 4 },
            ]
        },
        { 
            name: "Crop Protection and Environmental Biology", 
            code: "CPB",
            programmes: [
                { name: "B.Sc Crop Protection and Environmental Biology", durationMonths: 48, durationYears: 4 },
            ]
        },
        { 
            name: "Forest Resources Management", 
            code: "FRM",
            programmes: [
                { name: "B.Sc Forest Resources Management", durationMonths: 48, durationYears: 4 },
            ]
        },
        { 
            name: "Soil Resources Management", 
            code: "SRM",
            programmes: [
                { name: "B.Sc Soil Resources Management", durationMonths: 48, durationYears: 4 },
            ]
        },
    ],
    "Arts": [
        { 
            name: "Anthropology", 
            code: "ANT",
            programmes: [
                { name: "B.A Anthropology", durationMonths: 48, durationYears: 4 },
            ]
        },
        { 
            name: "Arabic Language and Literature", 
            code: "ARA",
            programmes: [
                { name: "B.A Arabic Language and Literature", durationMonths: 48, durationYears: 4 },
            ]
        },
        { 
            name: "Archaeology", 
            code: "ARC",
            programmes: [
                { name: "B.A Archaeology", durationMonths: 48, durationYears: 4 },
            ]
        },
        { 
            name: "Classics", 
            code: "CLA",
            programmes: [
                { name: "B.A Classics", durationMonths: 48, durationYears: 4 },
            ]
        },
        { 
            name: "Communication and Language Arts", 
            code: "CLA",
            programmes: [
                { name: "B.A Communication and Language Arts", durationMonths: 48, durationYears: 4 },
            ]
        },
        { 
            name: "English", 
            code: "ENG",
            programmes: [
                { name: "B.A English", durationMonths: 48, durationYears: 4 },
            ]
        },
        { 
            name: "European Studies", 
            code: "EUS",
            programmes: [
                { name: "B.A European Studies", durationMonths: 48, durationYears: 4 },
            ]
        },
        { 
            name: "History", 
            code: "HIS",
            programmes: [
                { name: "B.A History", durationMonths: 48, durationYears: 4 },
            ]
        },
        { 
            name: "Linguistics and African Languages", 
            code: "LAL",
            programmes: [
                { name: "B.A Linguistics and African Languages", durationMonths: 48, durationYears: 4 },
            ]
        },
        { 
            name: "Music", 
            code: "MUS",
            programmes: [
                { name: "B.A Music", durationMonths: 48, durationYears: 4 },
            ]
        },
        { 
            name: "Philosophy", 
            code: "PHL",
            programmes: [
                { name: "B.A Philosophy", durationMonths: 48, durationYears: 4 },
            ]
        },
        { 
            name: "Religious Studies", 
            code: "REL",
            programmes: [
                { name: "B.A Religious Studies", durationMonths: 48, durationYears: 4 },
            ]
        },
        { 
            name: "Theatre Arts", 
            code: "THA",
            programmes: [
                { name: "B.A Theatre Arts", durationMonths: 48, durationYears: 4 },
            ]
        },
    ],
    "Basic Medical Sciences": [
        { 
            name: "Biochemistry", 
            code: "BCH",
            programmes: [
                { name: "B.Sc Biochemistry", durationMonths: 48, durationYears: 4 },
            ]
        },
        { 
            name: "Physiology", 
            code: "PHS",
            programmes: [
                { name: "B.Sc Physiology", durationMonths: 48, durationYears: 4 },
            ]
        },
        { 
            name: "Biomedical Laboratory Science", 
            code: "BLS",
            programmes: [
                { name: "B.Sc Biomedical Laboratory Science", durationMonths: 48, durationYears: 4 },
            ]
        },
    ],
    "Clinical Sciences": [
        { 
            name: "Nursing", 
            code: "NUR",
            programmes: [
                { name: "B.NSc Nursing", durationMonths: 60, durationYears: 5 },
            ]
        },
        { 
            name: "Physiotherapy", 
            code: "PHY",
            programmes: [
                { name: "B.Sc Physiotherapy", durationMonths: 60, durationYears: 5 },
            ]
        },
        { 
            name: "Medicine and Surgery", 
            code: "MBBS",
            programmes: [
                { name: "MBBS Medicine and Surgery", durationMonths: 72, durationYears: 6 },
            ]
        },
        { 
            name: "Pharmacology and Therapeutics", 
            code: "PHT",
            programmes: [
                { name: "B.Sc Pharmacology", durationMonths: 48, durationYears: 4 },
            ]
        },
    ],
    "Dentistry": [
        { 
            name: "Dentistry", 
            code: "DEN",
            programmes: [
                { name: "BDS Dental Surgery", durationMonths: 72, durationYears: 6 },
            ]
        },
    ],
    "Economics": [
        { 
            name: "Economics", 
            code: "ECN",
            programmes: [
                { name: "B.Sc Economics", durationMonths: 48, durationYears: 4 },
            ]
        },
    ],
    "Education": [
        { 
            name: "Teacher Education", 
            code: "TED",
            programmes: [
                { name: "B.Ed Teacher Education", durationMonths: 48, durationYears: 4 },
            ]
        },
        { 
            name: "Adult Education", 
            code: "ADE",
            programmes: [
                { name: "B.Ed Adult Education", durationMonths: 48, durationYears: 4 },
            ]
        },
        { 
            name: "Educational Management", 
            code: "EDM",
            programmes: [
                { name: "B.Ed Educational Management", durationMonths: 48, durationYears: 4 },
            ]
        },
        { 
            name: "Guidance and Counselling", 
            code: "GAC",
            programmes: [
                { name: "B.Ed Guidance and Counselling", durationMonths: 48, durationYears: 4 },
            ]
        },
        { 
            name: "Health Education and Human Kinetics Education", 
            code: "HEK",
            programmes: [
                { name: "B.Ed Health Education", durationMonths: 48, durationYears: 4 },
            ]
        },
        { 
            name: "Library, Archival and Information Studies", 
            code: "LIS",
            programmes: [
                { name: "B.LS Library and Information Science", durationMonths: 48, durationYears: 4 },
            ]
        },
        { 
            name: "Special Education", 
            code: "SPE",
            programmes: [
                { name: "B.Ed Special Education", durationMonths: 48, durationYears: 4 },
            ]
        },
        { 
            name: "Arts and Social Sciences Education", 
            code: "ASE",
            programmes: [
                { name: "B.Ed Arts Education", durationMonths: 48, durationYears: 4 },
            ]
        },
        { 
            name: "Early Childhood and Educational Foundations", 
            code: "ECE",
            programmes: [
                { name: "B.Ed Early Childhood Education", durationMonths: 48, durationYears: 4 },
            ]
        },
        { 
            name: "Science and Technology Education", 
            code: "STE",
            programmes: [
                { name: "B.Sc Ed Science Education", durationMonths: 48, durationYears: 4 },
            ]
        },
        { 
            name: "Human Kinetics", 
            code: "HKE",
            programmes: [
                { name: "B.Sc Human Kinetics", durationMonths: 48, durationYears: 4 },
            ]
        },
        { 
            name: "Health Education", 
            code: "HED",
            programmes: [
                { name: "B.Sc Health Education", durationMonths: 48, durationYears: 4 },
            ]
        },
    ],
    "Environmental Design and Management": [
        { 
            name: "Architecture", 
            code: "ARC",
            programmes: [
                { name: "B.Sc Architecture", durationMonths: 60, durationYears: 5 },
            ]
        },
        { 
            name: "Estate Management", 
            code: "ESM",
            programmes: [
                { name: "B.Sc Estate Management", durationMonths: 48, durationYears: 4 },
            ]
        },
        { 
            name: "Urban and Regional Planning", 
            code: "URP",
            programmes: [
                { name: "B.Sc Urban and Regional Planning", durationMonths: 48, durationYears: 4 },
            ]
        },
        { 
            name: "Quantity Surveying", 
            code: "QTS",
            programmes: [
                { name: "B.Sc Quantity Surveying", durationMonths: 48, durationYears: 4 },
            ]
        },
    ],
    "Law": [
        { 
            name: "Law", 
            code: "LAW",
            programmes: [
                { name: "LLB Law", durationMonths: 60, durationYears: 5 },
            ]
        },
    ],
    "Pharmacy": [
        { 
            name: "Pharmacy", 
            code: "PHR",
            programmes: [
                { name: "B.Pharm Pharmacy", durationMonths: 60, durationYears: 5 },
            ]
        },
    ],
    "Public Health": [
        { 
            name: "Environmental Health Science", 
            code: "EHS",
            programmes: [
                { name: "B.Sc Environmental Health Science", durationMonths: 48, durationYears: 4 },
            ]
        },
        { 
            name: "Human Nutrition and Dietetics", 
            code: "HND",
            programmes: [
                { name: "B.Sc Human Nutrition and Dietetics", durationMonths: 48, durationYears: 4 },
            ]
        },
    ],
    "Renewable Natural Resources": [
        { 
            name: "Forest Production and Products", 
            code: "FPP",
            programmes: [
                { name: "B.Sc Forest Production and Products", durationMonths: 48, durationYears: 4 },
            ]
        },
        { 
            name: "Wildlife and Fisheries Management", 
            code: "WFM",
            programmes: [
                { name: "B.Sc Wildlife and Fisheries Management", durationMonths: 48, durationYears: 4 },
            ]
        },
        { 
            name: "Social and Environmental Forestry", 
            code: "SEF",
            programmes: [
                { name: "B.Sc Social and Environmental Forestry", durationMonths: 48, durationYears: 4 },
            ]
        },
        { 
            name: "Aquaculture and Fisheries Management", 
            code: "AFM",
            programmes: [
                { name: "B.Sc Aquaculture and Fisheries Management", durationMonths: 48, durationYears: 4 },
            ]
        },
    ],
    "Science": [
        { 
            name: "Anthropology", 
            code: "ANT",
            programmes: [
                { name: "B.Sc Anthropology", durationMonths: 48, durationYears: 4 },
            ]
        },
        { 
            name: "Archaeology", 
            code: "ARC",
            programmes: [
                { name: "B.Sc Archaeology", durationMonths: 48, durationYears: 4 },
            ]
        },
        { 
            name: "Botany", 
            code: "BOT",
            programmes: [
                { name: "B.Sc Botany", durationMonths: 48, durationYears: 4 },
            ]
        },
        { 
            name: "Chemistry", 
            code: "CHM",
            programmes: [
                { name: "B.Sc Chemistry", durationMonths: 48, durationYears: 4 },
            ]
        },
        { 
            name: "Computer Science", 
            code: "CSC",
            programmes: [
                { name: "B.Sc Computer Science", durationMonths: 48, durationYears: 4 },
            ]
        },
        { 
            name: "Geography", 
            code: "GEO",
            programmes: [
                { name: "B.Sc Geography", durationMonths: 48, durationYears: 4 },
            ]
        },
        { 
            name: "Geology", 
            code: "GEL",
            programmes: [
                { name: "B.Sc Geology", durationMonths: 48, durationYears: 4 },
            ]
        },
        { 
            name: "Mathematics", 
            code: "MTH",
            programmes: [
                { name: "B.Sc Mathematics", durationMonths: 48, durationYears: 4 },
            ]
        },
        { 
            name: "Microbiology", 
            code: "MCB",
            programmes: [
                { name: "B.Sc Microbiology", durationMonths: 48, durationYears: 4 },
            ]
        },
        { 
            name: "Physics", 
            code: "PHY",
            programmes: [
                { name: "B.Sc Physics", durationMonths: 48, durationYears: 4 },
            ]
        },
        { 
            name: "Statistics", 
            code: "STA",
            programmes: [
                { name: "B.Sc Statistics", durationMonths: 48, durationYears: 4 },
            ]
        },
        { 
            name: "Zoology", 
            code: "ZOO",
            programmes: [
                { name: "B.Sc Zoology", durationMonths: 48, durationYears: 4 },
            ]
        },
        { 
            name: "Science Specializations", 
            code: "SSP",
            programmes: [
                { name: "B.Sc Science Specializations", durationMonths: 48, durationYears: 4 },
            ]
        },
    ],
    "Social Sciences": [
        { 
            name: "Political Science", 
            code: "POS",
            programmes: [
                { name: "B.Sc Political Science", durationMonths: 48, durationYears: 4 },
            ]
        },
        { 
            name: "Psychology", 
            code: "PSY",
            programmes: [
                { name: "B.Sc Psychology", durationMonths: 48, durationYears: 4 },
            ]
        },
        { 
            name: "Sociology", 
            code: "SOC",
            programmes: [
                { name: "B.Sc Sociology", durationMonths: 48, durationYears: 4 },
            ]
        },
    ],
    "Technology": [
        { 
            name: "Civil Engineering", 
            code: "CVE",
            programmes: [
                { name: "B.Sc Civil Engineering", durationMonths: 60, durationYears: 5 },
            ]
        },
        { 
            name: "Electrical and Electronic Engineering", 
            code: "EEE",
            programmes: [
                { name: "B.Sc Electrical and Electronic Engineering", durationMonths: 60, durationYears: 5 },
            ]
        },
        { 
            name: "Industrial and Production Engineering", 
            code: "IPE",
            programmes: [
                { name: "B.Sc Industrial and Production Engineering", durationMonths: 60, durationYears: 5 },
            ]
        },
        { 
            name: "Mechanical Engineering", 
            code: "MEE",
            programmes: [
                { name: "B.Sc Mechanical Engineering", durationMonths: 60, durationYears: 5 },
            ]
        },
        { 
            name: "Petroleum Engineering", 
            code: "PET",
            programmes: [
                { name: "B.Sc Petroleum Engineering", durationMonths: 60, durationYears: 5 },
            ]
        },
        { 
            name: "Agricultural and Environmental Engineering", 
            code: "AEE",
            programmes: [
                { name: "B.Sc Agricultural and Environmental Engineering", durationMonths: 60, durationYears: 5 },
            ]
        },
        { 
            name: "Computer Engineering", 
            code: "CPE",
            programmes: [
                { name: "B.Sc Computer Engineering", durationMonths: 60, durationYears: 5 },
            ]
        },
        { 
            name: "Wood Products Engineering", 
            code: "WPE",
            programmes: [
                { name: "B.Sc Wood Products Engineering", durationMonths: 60, durationYears: 5 },
            ]
        },
    ],
    "Veterinary Medicine": [
        { 
            name: "Veterinary Medicine", 
            code: "VET",
            programmes: [
                { name: "DVM Veterinary Medicine", durationMonths: 72, durationYears: 6 },
            ]
        },
    ],
    "Business Administration": [
        { 
            name: "Marketing and Consumer Studies", 
            code: "MCS",
            programmes: [
                { name: "B.Sc Marketing", durationMonths: 48, durationYears: 4 },
            ]
        },
        { 
            name: "Banking and Finance", 
            code: "BAF",
            programmes: [
                { name: "B.Sc Banking and Finance", durationMonths: 48, durationYears: 4 },
            ]
        },
        { 
            name: "Accounting", 
            code: "ACC",
            programmes: [
                { name: "B.Sc Accounting", durationMonths: 48, durationYears: 4 },
            ]
        },
        { 
            name: "Software Development", 
            code: "SFD",
            programmes: [
                { name: "B.Sc Software Development", durationMonths: 48, durationYears: 4 },
            ]
        },
        { 
            name: "Information Communication Technology", 
            code: "ICT",
            programmes: [
                { name: "B.Sc Information Technology", durationMonths: 48, durationYears: 4 },
            ]
        },
    ],
    "Arts and Humanities": [
        { 
            name: "Archaeology and Anthropology", 
            code: "AAA",
            programmes: [
                { name: "B.A Archaeology and Anthropology", durationMonths: 48, durationYears: 4 },
            ]
        },
    ],
    "Multidisciplinary Studies": [
        { 
            name: "Archaeology and Anthropology (Science)", 
            code: "AAS",
            programmes: [
                { name: "B.Sc Archaeology and Anthropology", durationMonths: 48, durationYears: 4 },
            ]
        },
        { 
            name: "Public Health", 
            code: "PUH",
            programmes: [
                { name: "B.Sc Public Health", durationMonths: 48, durationYears: 4 },
            ]
        },
        { 
            name: "Parapsychology and Parasitology", 
            code: "PNP",
            programmes: [
                { name: "B.Sc Parasitology", durationMonths: 48, durationYears: 4 },
            ]
        },
    ],
};

export async function seedUniversityStructure() {
    try {
        console.log("🌱 Seeding University Structure (Faculties, Departments, Programmes)...");

        // 1. Seed Faculties
        console.log("1. Seeding Faculties...");
        for (const faculty of FACULTIES_DATA) {
            await db.insert(faculties).values(faculty).onDuplicateKeyUpdate({
                set: { name: faculty.name }
            });
            console.log(`   ✓ Faculty: ${faculty.name}`);
        }

        // 2. Seed Departments and Programmes
        console.log("2. Seeding Departments and Programmes...");
        
        for (const [facultyName, departmentsList] of Object.entries(DEPARTMENTS_DATA)) {
            // Get faculty ID
            const [faculty] = await db.select().from(faculties).where(eq(faculties.name, facultyName)).limit(1);
            
            if (!faculty) {
                console.warn(`   ⚠ Faculty not found: ${facultyName}`);
                continue;
            }

            for (const deptData of departmentsList) {
                // Insert/Update Department
                await db.insert(departments).values({
                    name: deptData.name,
                    code: deptData.code,
                    facultyId: faculty.id,
                }).onDuplicateKeyUpdate({
                    set: { name: deptData.name, facultyId: faculty.id }
                });

                // Get department ID
                const [department] = await db.select().from(departments).where(eq(departments.code, deptData.code)).limit(1);
                
                if (!department) {
                    console.warn(`   ⚠ Department not found: ${deptData.code}`);
                    continue;
                }

                // Seed Programmes for this department
                for (const progData of deptData.programmes) {
                    await db.insert(programmes).values({
                        name: progData.name,
                        deptId: department.id,
                        durationMonths: progData.durationMonths,
                        durationYears: progData.durationYears,
                        code: progData.name.substring(0, 3).toUpperCase() + progData.durationYears,
                    }).onDuplicateKeyUpdate({
                        set: { 
                            name: progData.name,
                            deptId: department.id,
                            durationMonths: progData.durationMonths,
                            durationYears: progData.durationYears,
                        }
                    });
                }

                console.log(`   ✓ Department: ${deptData.name} (${deptData.programmes.length} programmes)`);
            }
        }

        console.log("✅ University Structure Seeding Complete!");
        return { success: true, message: "University structure seeded successfully" };

    } catch (error) {
        console.error("❌ Seeding Error:", error);
        return { success: false, error: String(error) };
    }
}
