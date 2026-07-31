# Server Disaster Recovery Plan (RTO < 5 Minutes)

Because this application architecture is completely containerized with Docker, restoring the entire portal from scratch onto a new server is extremely fast. If your main server goes down, execute the following 3 steps on a fresh VPS.

## Prerequisites
1. A fresh Linux server (Ubuntu/Debian) with Docker and Docker Compose installed.
2. A copy of your production `.env` file containing your Database, JWT, and Wasabi Cloud Storage keys.

## Step 1: Clone & Configure (1 Minute)
SSH into your new server, pull your codebase from GitHub, and drop your `.env` file into the root folder.
```bash
git clone https://github.com/icitify-portals/school-portal.git
cd school-portal
# Create or upload your .env file here
nano .env 
```

## Step 2: Spin Up Infrastructure (2 - 3 Minutes)
Run Docker Compose in detached mode. This single command will download the required images, build the application, and start the Next.js server, MySQL database, and Redis cache simultaneously.
```bash
docker compose up -d
```
*Note: Wait a couple of minutes for the database container to initialize itself.*

## Step 3: Pull Remote Backup from Wasabi (1 Minute)
Now that the blank database is running, use the built-in CLI tool to instantly pull the latest backup directly from your Wasabi bucket and restore it into MySQL:
```bash
npx tsx bin/manage-backup.ts pull
```

Within a few minutes, your entire school portal (complete with all database tables, financial records, and uploaded files) will be 100% restored and fully operational!
