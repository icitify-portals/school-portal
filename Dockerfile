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
# Full prod modules for worker-side deps (bullmq/node-cron/dotenv) that the
# standalone trace does not include. Pruned of devDeps; the redundant shadow
# copy of `next` is dropped (standalone carries its own traced copy).
# Standalone output is self-contained for the web app, except @swc/helpers
# which Turbopack/Next fails to trace. The background worker additionally
# needs its own small runtime deps (untraced because it is launched via tsx,
# not bundled). Each is only a few MB — keeps the image slim for fast pulls.
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/next ./node_modules/next
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/react ./node_modules/react
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/react-dom ./node_modules/react-dom
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/next-auth ./node_modules/next-auth
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/@swc ./node_modules/@swc
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/bullmq ./node_modules/bullmq
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/ioredis ./node_modules/ioredis
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/uuid ./node_modules/uuid
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/debug ./node_modules/debug
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/ms ./node_modules/ms
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/@ioredis ./node_modules/@ioredis
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/lodash.defaults ./node_modules/lodash.defaults
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/lodash.isarguments ./node_modules/lodash.isarguments
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/redis-parser ./node_modules/redis-parser
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/cron-parser ./node_modules/cron-parser
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/msgpackr ./node_modules/msgpackr
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/node-abort-controller ./node_modules/node-abort-controller
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/semver ./node_modules/semver
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/tslib ./node_modules/tslib
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/denque ./node_modules/denque
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/cluster-key-slot ./node_modules/cluster-key-slot
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/redis-errors ./node_modules/redis-errors
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/standard-as-callback ./node_modules/standard-as-callback
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/dotenv ./node_modules/dotenv
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/node-cron ./node_modules/node-cron
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/drizzle-orm ./node_modules/drizzle-orm
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/mysql2 ./node_modules/mysql2
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/bcryptjs ./node_modules/bcryptjs
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/pdfkit ./node_modules/pdfkit
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/resend ./node_modules/resend
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/twilio ./node_modules/twilio
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/web-push ./node_modules/web-push
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/adm-zip ./node_modules/adm-zip
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/@aws-sdk/client-s3 ./node_modules/@aws-sdk/client-s3
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/@aws-sdk/s3-request-presigner ./node_modules/@aws-sdk/s3-request-presigner

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
