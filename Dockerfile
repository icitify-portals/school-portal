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
# Packing everything into a single deterministic tarball keeps the final image
# to ONE stable layer (fixed mtimes + sorted names), so identical rebuilds
# reuse the same layer digest and deploys only re-pull genuinely changed code.
FROM deps AS closure
WORKDIR /app
RUN apk add --no-cache tar gzip
RUN mkdir -p /closure
COPY closure-packages.txt ./
RUN set -eux; \
    while IFS= read -r pkg; do \
      [ -z "$pkg" ] && continue; \
      pkg="${pkg#node_modules/}"; \
      mkdir -p "/closure/node_modules/$(dirname "$pkg")"; \
      cp -a "/app/node_modules/$pkg" "/closure/node_modules/$pkg"; \
    done < closure-packages.txt; \
    tar --sort=name --mtime='@1704067200' --owner=0 --group=0 --numeric-owner -C /closure -cf - . | gzip -n > /closure.tar.gz

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

# Worker dependency closure, laid down in a single deterministic layer.
# Bind-mount extraction keeps /closure.tar.gz OUT of the image layers entirely,
# so the tar blob is never re-pulled on deploy — only real code changes create
# a new layer, making identical rebuilds pull almost nothing.
RUN --mount=type=bind,from=closure,source=/closure.tar.gz,target=/tmp/closure.tar.gz \
    tar -C /app -xzf /tmp/closure.tar.gz

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]