CREATE TABLE IF NOT EXISTS transcript_audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  actor_id INT NOT NULL,
  actor_name VARCHAR(255) NOT NULL,
  actor_role VARCHAR(100),
  action VARCHAR(100) NOT NULL,
  target_type VARCHAR(50) NOT NULL,
  target_id INT,
  target_label VARCHAR(255),
  details TEXT,
  ip_address VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_tal_actor (actor_id),
  INDEX idx_tal_action (action),
  INDEX idx_tal_target (target_type, target_id),
  INDEX idx_tal_created (created_at),
  FOREIGN KEY (actor_id) REFERENCES users(id)
);
