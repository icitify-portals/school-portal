const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
dotenv.config();

async function run() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  try {
    console.log("Seeding Security Permissions...");
    const perms = [
      { name: "security.vehicle.register", category: "Security", description: "Register personal or visitor vehicles" },
      { name: "security.vehicle.approve", category: "Security", description: "Review and approve/revoke vehicle gate passes" },
      { name: "security.vehicle.scan", category: "Security", description: "Scan vehicle gate passes to log entry/exit traffic" },
      { name: "security.position.manage", category: "Security", description: "Manage strategic campus patrol checkpoints" },
      { name: "security.patrol.log", category: "Security", description: "Scan patrol checkpoints and log safety status" },
      { name: "security.incident.report", category: "Security", description: "Report and log campus safety incidents" },
      { name: "security.incident.manage", category: "Security", description: "Investigate, update status, and resolve incident cases" },
      { name: "security.dashboard.view", category: "Security", description: "View campus security dashboard stats and analytics" },
    ];

    const permMap = new Map();
    for (const p of perms) {
      const [existing] = await connection.execute("SELECT id FROM permissions WHERE name = ?", [p.name]);
      let permId;
      if (existing.length === 0) {
        const [result] = await connection.execute(
          "INSERT INTO permissions (name, category, description) VALUES (?, ?, ?)",
          [p.name, p.category, p.description]
        );
        permId = result.insertId;
        console.log(`Created permission: ${p.name} (id: ${permId})`);
      } else {
        permId = existing[0].id;
        console.log(`Permission exists: ${p.name} (id: ${permId})`);
      }
      permMap.set(p.name, permId);
    }

    console.log("Seeding Security Roles...");
    const rolesDef = [
      {
        name: "Chief Security Officer",
        description: "Chief Security Officer (CSO). Oversees campus-wide security operations, patrols, and incident management.",
        permissions: [
          "security.vehicle.register",
          "security.vehicle.approve",
          "security.vehicle.scan",
          "security.position.manage",
          "security.patrol.log",
          "security.incident.report",
          "security.incident.manage",
          "security.dashboard.view"
        ]
      },
      {
        name: "Security Officer",
        description: "On-duty security officer responsible for patrols, vehicle screening, and incident logs.",
        permissions: [
          "security.vehicle.scan",
          "security.patrol.log",
          "security.incident.report"
        ]
      }
    ];

    for (const r of rolesDef) {
      const [existing] = await connection.execute("SELECT id FROM roles WHERE name = ?", [r.name]);
      let roleId;
      if (existing.length === 0) {
        const [result] = await connection.execute(
          "INSERT INTO roles (name, description) VALUES (?, ?)",
          [r.name, r.description]
        );
        roleId = result.insertId;
        console.log(`Created role: ${r.name} (id: ${roleId})`);
      } else {
        roleId = existing[0].id;
        console.log(`Role exists: ${r.name} (id: ${roleId})`);
      }

      // Bind Permissions to Role
      for (const pName of r.permissions) {
        const permId = permMap.get(pName);
        if (permId) {
          const [existingRP] = await connection.execute(
            "SELECT role_id FROM role_permissions WHERE role_id = ? AND permission_id = ?",
            [roleId, permId]
          );
          if (existingRP.length === 0) {
            await connection.execute(
              "INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)",
              [roleId, permId]
            );
            console.log(`Bound permission ${pName} to role ${r.name}`);
          }
        }
      }
    }

    // Seed Demo Users
    const passwordHash = await bcrypt.hash("welcome123", 10);
    const demoUsers = [
      {
        name: "CSO Charles",
        email: "cso@school.com",
        roleName: "Chief Security Officer"
      },
      {
        name: "Officer Owen",
        email: "officer@school.com",
        roleName: "Security Officer"
      }
    ];

    console.log("Seeding Demo Security Users...");
    for (const du of demoUsers) {
      const [existingUser] = await connection.execute("SELECT id FROM users WHERE email = ?", [du.email]);
      let userId;
      if (existingUser.length === 0) {
        // Find a valid status / default
        const [result] = await connection.execute(
          "INSERT INTO users (name, email, password, status) VALUES (?, ?, ?, 'active')",
          [du.name, du.email, passwordHash]
        );
        userId = result.insertId;
        console.log(`Created user: ${du.name} (id: ${userId})`);
      } else {
        userId = existingUser[0].id;
        console.log(`User exists: ${du.name} (id: ${userId})`);
      }

      // Map User to Role
      const [role] = await connection.execute("SELECT id FROM roles WHERE name = ?", [du.roleName]);
      if (role.length > 0) {
        const roleId = role[0].id;
        const [existingUR] = await connection.execute(
          "SELECT id FROM user_roles WHERE user_id = ? AND role_id = ?",
          [userId, roleId]
        );
        if (existingUR.length === 0) {
          await connection.execute(
            "INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)",
            [userId, roleId]
          );
          console.log(`Assigned role ${du.roleName} to user ${du.name}`);
        }
      }
    }

    console.log("Security seeding completed successfully!");
  } catch (e) {
    console.error("Seeding error:", e);
  } finally {
    await connection.end();
  }
}
run();
