# Dockerfile
FROM node:20-alpine AS base

# ── deps: install node_modules ────────────────────────────────────────────────
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps

# ── builder: compile Next.js ─────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_OPTIONS="--max-old-space-size=8192"
ENV DATABASE_URL="mysql://portal_user:StrongPassword123!@127.0.0.1:3306/school_portal"
ENV NEXTAUTH_SECRET="build-time-dummy-secret-1234567890"
ENV AUTH_SECRET="build-time-dummy-secret-1234567890"
ENV NEXT_PUBLIC_APP_URL="https://portal.fssibadan.edu.ng"
ENV ENCRYPTION_KEY="1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b"
ENV JWT_SECRET="build-time-jwt-secret-1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b"
# This persists the .next/cache directory between builds so
# unchanged pages are not recompiled — the single biggest win.
RUN --mount=type=cache,id=nextjs-build-cache,target=/app/.next/cache \
    npx next build

# ── runner: minimal production image ─────────────────────────────────────────
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

RUN apk add --no-cache mysql-client

RUN mkdir -p /app/backups && chown nextjs:nodejs /app/backups

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Full prod-only node_modules for the background worker (bullmq, cron-parser,
# dotenv, drizzle-orm, etc. are NOT traced into standalone output).  DevDeps
# are pruned away; the redundant copy of `next/` is dropped (the standalone
# trace carries its own minimal server copy — saving 157 MB of unused SWC
# platform binaries).  This keeps the image correct AND small.
COPY package.json package-lock.json* ./
COPY --from=deps --chown=nextjs:nodejs /app/node_modules ./node_modules
RUN npm prune --omit=dev --legacy-peer-deps --no-audit --no-fund \
 && rm -rf /app/node_modules/next \
 && npm cache clean --force

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
