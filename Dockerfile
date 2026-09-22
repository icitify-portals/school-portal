# Dockerfile
FROM node:20-alpine AS base

# ── deps: install node_modules ────────────────────────────────────────────────
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps

# ── closure: bundle only the worker's production dependencies into one tar ───
# The background worker is launched via tsx (never bundled), so it needs the
# FULL transitive closure of its imports.  The web app's own deps come from
# the standalone trace; @swc/helpers is also needed (missing from trace).
# Packing everything into a single tarball keeps the final image to ONE layer
# instead of ~200 COPY layers, so pulls are fast and incremental-relayable.
FROM deps AS closure
WORKDIR /app
RUN mkdir -p /closure
COPY closure-packages.txt ./
RUN set -eux; \
    while IFS= read -r pkg; do \
      [ -z "$pkg" ] && continue; \
      pkg="${pkg#node_modules/}"; \
      mkdir -p "/closure/node_modules/$(dirname "$pkg")"; \
      cp -a "/app/node_modules/$pkg" "/closure/node_modules/$pkg"; \
    done < closure-packages.txt; \
    tar -C /closure -czf /closure.tar.gz .

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
RUN apk add --no-cache tar mysql-client
RUN mkdir -p /app/backups && chown nextjs:nodejs /app/backups

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Worker dependency closure, laid down in a single layer.
COPY --from=closure --chown=nextjs:nodejs /closure.tar.gz /tmp/closure.tar.gz
RUN tar -C /app -xzf /tmp/closure.tar.gz && rm /tmp/closure.tar.gz

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]