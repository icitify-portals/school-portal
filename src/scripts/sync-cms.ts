import { db } from "../db/db";
import { sql } from "drizzle-orm";

async function sync() {
    console.log("Starting full CMS DB sync...");

    try {
        // 1. cms_pages
        console.log("Checking cms_pages...");
        await db.execute(sql`
            CREATE TABLE IF NOT EXISTS cms_pages (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                slug VARCHAR(255) UNIQUE NOT NULL,
                content TEXT,
                meta_title VARCHAR(255),
                meta_description TEXT,
                keywords TEXT,
                status ENUM('draft', 'published') DEFAULT 'draft',
                author_id INT,
                is_system_page BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        // 2. cms_menus
        console.log("Checking cms_menus...");
        await db.execute(sql`
            CREATE TABLE IF NOT EXISTS cms_menus (
                id INT AUTO_INCREMENT PRIMARY KEY,
                label VARCHAR(255) NOT NULL,
                href VARCHAR(500),
                icon VARCHAR(50),
                description VARCHAR(500),
                parent_id INT,
                sort_order INT DEFAULT 0,
                is_active BOOLEAN DEFAULT TRUE
            )
        `);

        // 3. cms_homepage_sections
        console.log("Checking cms_homepage_sections...");
        await db.execute(sql`
            CREATE TABLE IF NOT EXISTS cms_homepage_sections (
                id INT AUTO_INCREMENT PRIMARY KEY,
                section_type ENUM('slider', 'hero', 'gallery', 'content', 'features', 'cta') NOT NULL,
                title VARCHAR(255),
                subtitle VARCHAR(500),
                content TEXT,
                settings TEXT,
                sort_order INT DEFAULT 0,
                is_active BOOLEAN DEFAULT TRUE
            )
        `);

        // 4. cms_gallery_images
        console.log("Checking cms_gallery_images...");
        await db.execute(sql`
            CREATE TABLE IF NOT EXISTS cms_gallery_images (
                id INT AUTO_INCREMENT PRIMARY KEY,
                section_id INT,
                image_url VARCHAR(500) NOT NULL,
                caption VARCHAR(255),
                sort_order INT DEFAULT 0,
                FOREIGN KEY (section_id) REFERENCES cms_homepage_sections(id)
            )
        `);

        console.log("Sync complete!");
        process.exit(0);
    } catch (error) {
        console.error("Sync failed:", error);
        process.exit(1);
    }
}

sync();
