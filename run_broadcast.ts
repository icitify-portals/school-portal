import "dotenv/config";
import { db } from "./src/db/db";
import { sql } from "drizzle-orm";

const query = `CREATE TABLE IF NOT EXISTS broadcast_messages (
  id int NOT NULL AUTO_INCREMENT,
  sender_id int NOT NULL,
  title varchar(255) NOT NULL,
  message text NOT NULL,
  channel enum('toast','email','both') DEFAULT 'both',
  target_criteria text,
  total_recipients int DEFAULT 0,
  status enum('pending','processing','completed','failed') DEFAULT 'pending',
  scheduled_for timestamp NULL DEFAULT NULL,
  created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY sender_id_idx (sender_id),
  CONSTRAINT fk_broadcast_sender FOREIGN KEY (sender_id) REFERENCES users (id) ON DELETE CASCADE
);`;

db.execute(sql.raw(query)).then(() => process.exit(0)).catch(e => {console.error(e); process.exit(1)});