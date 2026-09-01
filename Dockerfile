# Dockerfile
FROM node:20-alpine AS base

# ── deps: install node_modules ────────────────────────────────────────────────
# This layer is ONLY invalidated when package.json / package-lock.json change.
# Source code changes do NOT trigger an npm install.
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps

# ── builder: compile Next.js ─────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
# Copy source AFTER node_modules so the npm ci layer stays cached
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_OPTIONS="--max-old-space-size=4096"
ENV DATABASE_URL="mysql://portal_user:StrongPassword123!@127.0.0.1:3306/school_portal"
ENV NEXTAUTH_SECRET="build-time-dummy-secret-1234567890"
ENV AUTH_SECRET="build-time-dummy-secret-1234567890"
ENV NEXT_PUBLIC_APP_URL="https://portal.fssibadan.edu.ng"
# Use BuildKit cache mount for Next.js compilation cache.
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

# Install mysql-client to enable mysqldump for backup actions
RUN apk add --no-cache mysql-client

# Create backups directory with correct permissions so the Next.js user can write to it
RUN mkdir -p /app/backups && chown nextjs:nodejs /app/backups

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
