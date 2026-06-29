import "dotenv/config";
import mysql from "mysql2/promise";

const baseUri = process.env.DATABASE_URL || "mysql://root:@localhost:3306/school_portal";
const databases = ["school_portal", "portal_AJAT_ACADEMY", "portal_CITADEL_UNI"];

async function run() {
    const newMenus = [
        {
            label: "Security Master Analytics",
            href: "/admin/security-director/analytics",
            icon: "ShieldAlert",
            slot: "primary"
        },
        {
            label: "Visitor Management",
            href: "/admin/security-director/visitors",
            icon: "Users",
            slot: "primary"
        },
        {
            label: "Key Management",
            href: "/admin/security-director/key-management",
            icon: "Key",
            slot: "primary"
        },
        {
            label: "Lost & Found",
            href: "/admin/security-director/lost-and-found",
            icon: "HelpCircle",
            slot: "primary"
        },
        {
            label: "Support Desk",
            href: "/admin/support",
            icon: "LifeBuoy",
            slot: "primary"
        }
    ];

    for (const dbName of databases) {
        console.log(`\n--- Seeding menus for ${dbName} ---`);
        try {
            const parsedUrl = new URL(baseUri);
            parsedUrl.pathname = `/${dbName}`;
            const connection = await mysql.createConnection(parsedUrl.toString());

            for (const menu of newMenus) {
                const [existing]: any = await connection.query(`SELECT id FROM cms_menus WHERE href = ?`, [menu.href]);
                if (existing.length > 0) {
                    console.log(`Menu ${menu.label} already exists in ${dbName}`);
                    continue;
                }

                await connection.execute(
                    `INSERT INTO cms_menus (label, href, icon, is_active, locale, slot, menu_style)
                     VALUES (?, ?, ?, 1, 'en', ?, 'dropdown')`,
                    [menu.label, menu.href, menu.icon, menu.slot]
                );
                console.log(`Added ${menu.label} to ${dbName}`);
            }

            await connection.end();
        } catch (e: any) {
            console.error(`Error in ${dbName}: ${e.message}`);
        }
    }
}

run();
