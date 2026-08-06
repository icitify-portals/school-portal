import { db } from "../src/db/db";
import { users, students } from "../src/db/schema";
import { eq, like, or, and } from "drizzle-orm";
import { sendEmail } from "../src/lib/mail";

const emails = [
    "yahyahmemunat43@gmail.com",
    "gloryroseandrew@gmail.com",
    "ashadegrace200@gmail.com",
    "adeyeyesusan3@gmail.com",
    "oseniafeezolawunmi@gmail.com",
    "abdulhakeem76@gmail.com",
    "islamiyatlukmon69@gmail.com",
    "marvellousolatunji6@gmail.com",
    "jimohnaimot44@gmail.com",
    "opeyemijohn012@gmail.com",
    "pelumiprincess81@gmail.com",
    "mosespelumi368@gmail.com",
    "dasolarokeebat@gmail.com"
];

const uniqueNames = [
    "ABAYOMI FADUNSI",
    "Ifedamola Akinwunmi",
    "Fehintola Aderibigbe",
    "Adeoti Omowunmi",
    "Haliyat Ayanshina",
    "Tunmise Adepoju",
    "Anuoluwapo Ogunsiji",
    "Hammed Obasola",
    "Olayiwola Olayinka",
    "Tosin Owolabi",
    "Sulaimon Matti",
    "Owoiya Ayomide",
    "ABDULBASIT OYEKANMI",
    "Damilola Akiode",
    "MOTUNRAYO Ajayi",
    "Mary Oladeji"
];

async function run() {
    console.log("Starting Email Process...");
    const usersToProcess: {userId: number, email: string, name: string}[] = [];
    
    // Find by emails
    for (const email of emails) {
        const userRec = await db.select({
            id: users.id,
            email: users.email,
            name: users.name
        }).from(users).where(eq(users.email, email));
        if (userRec.length > 0) {
            usersToProcess.push({
                userId: userRec[0].id,
                email: userRec[0].email,
                name: userRec[0].name
            });
        }
    }
    
    // Find by unique names
    for (const fullName of uniqueNames) {
        const parts = fullName.split(" ").filter(p => p.trim() !== "");
        const part1 = parts[0];
        const part2 = parts[1] || "";
        
        const matches = await db.select({
            userId: students.userId,
            firstName: students.firstName,
            lastName: students.lastName,
            email: users.email
        }).from(students)
        .leftJoin(users, eq(students.userId, users.id))
        .where(
            or(
                and(
                    like(students.firstName, `%${part1}%`),
                    like(students.lastName, `%${part2}%`)
                ),
                and(
                    like(students.firstName, `%${part2}%`),
                    like(students.lastName, `%${part1}%`)
                )
            )
        );
        
        if (matches.length === 1) {
            usersToProcess.push({
                userId: matches[0].userId!,
                email: matches[0].email!,
                name: `${matches[0].firstName} ${matches[0].lastName}`
            });
        }
    }
    
    console.log(`Total students to email: ${usersToProcess.length}`);
    
    let processed = 0;
    
    for (const u of usersToProcess) {
        const emailContent = `
            <h2>Application Paid & Ready</h2>
            <p>Dear ${u.name},</p>
            <p>Your previous HND application payment has been successfully recorded in the new portal.</p>
            <p>You can now proceed to log in to your student dashboard, click <strong>"Apply for HND"</strong>, and complete your application form details.</p>
            <p>If you encounter any issues, please let us know.</p>
            <br/>
            <p>Best Regards,</p>
            <p>Admissions Office</p>
        `;
        
        try {
            await sendEmail(u.email, "HND Application Payment Recorded", emailContent);
            
            // Send a copy to the admin for EACH student sent
            const adminEmailContent = `
                <h2>Copy: HND Application Payment Recorded</h2>
                <p>This email was successfully sent to ${u.name} (${u.email}) regarding their HND application.</p>
                <hr />
                ${emailContent}
            `;
            await sendEmail("aa.adelopo2@gmail.com", `[COPY] HND Application Payment Recorded - ${u.name}`, adminEmailContent);
            
            console.log(`Emailed: ${u.email}`);
        } catch (error) {
            console.error(`Failed to send email to ${u.email}:`, error);
        }
        processed++;
    }
    
    console.log(`\nSuccessfully emailed ${processed} students.`);
    process.exit(0);
}

run().catch(console.error);
