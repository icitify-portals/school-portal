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

# The standalone trace covers the web app deps, but the background worker is
# launched via tsx (not bundled) so it needs its own FULL transitive closure of
# prod packages. Each is copied individually to keep the image slim (no giant
# COPY-then-prune layers). Nested versions are copied exactly where Node
# resolves them. Includes @swc/helpers (missing from trace).
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/@aws-crypto/crc32 ./node_modules/@aws-crypto/crc32
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/@aws-crypto/crc32c ./node_modules/@aws-crypto/crc32c
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/@aws-crypto/sha1-browser ./node_modules/@aws-crypto/sha1-browser
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/@aws-crypto/sha256-browser ./node_modules/@aws-crypto/sha256-browser
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/@aws-crypto/sha256-js ./node_modules/@aws-crypto/sha256-js
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/@aws-crypto/supports-web-crypto ./node_modules/@aws-crypto/supports-web-crypto
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/@aws-crypto/util ./node_modules/@aws-crypto/util
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/@aws-sdk/checksums ./node_modules/@aws-sdk/checksums
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/@aws-sdk/client-s3 ./node_modules/@aws-sdk/client-s3
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/@aws-sdk/core ./node_modules/@aws-sdk/core
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/@aws-sdk/credential-provider-env ./node_modules/@aws-sdk/credential-provider-env
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/@aws-sdk/credential-provider-http ./node_modules/@aws-sdk/credential-provider-http
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/@aws-sdk/credential-provider-ini ./node_modules/@aws-sdk/credential-provider-ini
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/@aws-sdk/credential-provider-login ./node_modules/@aws-sdk/credential-provider-login
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/@aws-sdk/credential-provider-node ./node_modules/@aws-sdk/credential-provider-node
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/@aws-sdk/credential-provider-process ./node_modules/@aws-sdk/credential-provider-process
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/@aws-sdk/credential-provider-sso ./node_modules/@aws-sdk/credential-provider-sso
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/@aws-sdk/credential-provider-web-identity ./node_modules/@aws-sdk/credential-provider-web-identity
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/@aws-sdk/middleware-flexible-checksums ./node_modules/@aws-sdk/middleware-flexible-checksums
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/@aws-sdk/middleware-sdk-s3 ./node_modules/@aws-sdk/middleware-sdk-s3
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/@aws-sdk/nested-clients ./node_modules/@aws-sdk/nested-clients
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/@aws-sdk/s3-request-presigner ./node_modules/@aws-sdk/s3-request-presigner
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/@aws-sdk/signature-v4-multi-region ./node_modules/@aws-sdk/signature-v4-multi-region
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/@aws-sdk/token-providers ./node_modules/@aws-sdk/token-providers
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/@aws-sdk/types ./node_modules/@aws-sdk/types
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/@aws-sdk/util-locate-window ./node_modules/@aws-sdk/util-locate-window
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/@aws-sdk/xml-builder ./node_modules/@aws-sdk/xml-builder
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/@aws/lambda-invoke-store ./node_modules/@aws/lambda-invoke-store
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/@ioredis/commands ./node_modules/@ioredis/commands
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/@next/env ./node_modules/@next/env
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/@noble/ciphers ./node_modules/@noble/ciphers
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/@noble/hashes ./node_modules/@noble/hashes
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/@panva/hkdf ./node_modules/@panva/hkdf
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/@selderee/plugin-htmlparser2 ./node_modules/@selderee/plugin-htmlparser2
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/@smithy/core ./node_modules/@smithy/core
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/@smithy/credential-provider-imds ./node_modules/@smithy/credential-provider-imds
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/@smithy/fetch-http-handler ./node_modules/@smithy/fetch-http-handler
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/@smithy/is-array-buffer ./node_modules/@smithy/is-array-buffer
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/@smithy/node-http-handler ./node_modules/@smithy/node-http-handler
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/@smithy/signature-v4 ./node_modules/@smithy/signature-v4
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/@smithy/types ./node_modules/@smithy/types
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/@smithy/util-buffer-from ./node_modules/@smithy/util-buffer-from
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/@smithy/util-utf8 ./node_modules/@smithy/util-utf8
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/@stablelib/base64 ./node_modules/@stablelib/base64
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/@swc/helpers ./node_modules/@swc/helpers
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/@zone-eu/mailsplit ./node_modules/@zone-eu/mailsplit
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/adm-zip ./node_modules/adm-zip
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/agent-base ./node_modules/agent-base
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/asn1.js ./node_modules/asn1.js
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/asynckit ./node_modules/asynckit
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/aws-ssl-profiles ./node_modules/aws-ssl-profiles
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/axios ./node_modules/axios
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/base64-js ./node_modules/base64-js
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/baseline-browser-mapping ./node_modules/baseline-browser-mapping
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/bcryptjs ./node_modules/bcryptjs
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/bn.js ./node_modules/bn.js
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/bowser ./node_modules/bowser
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/brotli ./node_modules/brotli
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/browserify-zlib ./node_modules/browserify-zlib
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/browserify-zlib/node_modules/pako ./node_modules/browserify-zlib/node_modules/pako
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/buffer-equal-constant-time ./node_modules/buffer-equal-constant-time
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/bullmq ./node_modules/bullmq
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/bullmq/node_modules/semver ./node_modules/bullmq/node_modules/semver
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/bullmq/node_modules/uuid ./node_modules/bullmq/node_modules/uuid
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/call-bind-apply-helpers ./node_modules/call-bind-apply-helpers
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/call-bound ./node_modules/call-bound
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/caniuse-lite ./node_modules/caniuse-lite
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/client-only ./node_modules/client-only
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/clone ./node_modules/clone
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/cluster-key-slot ./node_modules/cluster-key-slot
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/combined-stream ./node_modules/combined-stream
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/cron-parser ./node_modules/cron-parser
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/dayjs ./node_modules/dayjs
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/debug ./node_modules/debug
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/deepmerge ./node_modules/deepmerge
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/delayed-stream ./node_modules/delayed-stream
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/denque ./node_modules/denque
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/dfa ./node_modules/dfa
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/dom-serializer ./node_modules/dom-serializer
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/domelementtype ./node_modules/domelementtype
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/domhandler ./node_modules/domhandler
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/domutils ./node_modules/domutils
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/dotenv ./node_modules/dotenv
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/drizzle-orm ./node_modules/drizzle-orm
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/dunder-proto ./node_modules/dunder-proto
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/ecdsa-sig-formatter ./node_modules/ecdsa-sig-formatter
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/encoding-japanese ./node_modules/encoding-japanese
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/entities ./node_modules/entities
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/es-define-property ./node_modules/es-define-property
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/es-errors ./node_modules/es-errors
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/es-object-atoms ./node_modules/es-object-atoms
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/es-set-tostringtag ./node_modules/es-set-tostringtag
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/fast-deep-equal ./node_modules/fast-deep-equal
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/fast-sha256 ./node_modules/fast-sha256
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/follow-redirects ./node_modules/follow-redirects
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/fontkit ./node_modules/fontkit
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/form-data ./node_modules/form-data
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/form-data/node_modules/mime-types ./node_modules/form-data/node_modules/mime-types
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/function-bind ./node_modules/function-bind
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/generate-function ./node_modules/generate-function
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/get-intrinsic ./node_modules/get-intrinsic
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/get-proto ./node_modules/get-proto
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/gopd ./node_modules/gopd
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/has-symbols ./node_modules/has-symbols
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/has-tostringtag ./node_modules/has-tostringtag
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/hasown ./node_modules/hasown
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/he ./node_modules/he
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/html-to-text ./node_modules/html-to-text
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/htmlparser2 ./node_modules/htmlparser2
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/http_ece ./node_modules/http_ece
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/https-proxy-agent ./node_modules/https-proxy-agent
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/iconv-lite ./node_modules/iconv-lite
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/inherits ./node_modules/inherits
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/ioredis ./node_modules/ioredis
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/is-property ./node_modules/is-property
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/jose ./node_modules/jose
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/js-md5 ./node_modules/js-md5
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/jsonwebtoken ./node_modules/jsonwebtoken
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/jsonwebtoken/node_modules/semver ./node_modules/jsonwebtoken/node_modules/semver
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/jwa ./node_modules/jwa
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/jws ./node_modules/jws
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/leac ./node_modules/leac
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/libbase64 ./node_modules/libbase64
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/libmime ./node_modules/libmime
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/libmime/node_modules/iconv-lite ./node_modules/libmime/node_modules/iconv-lite
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/libqp ./node_modules/libqp
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/linebreak ./node_modules/linebreak
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/linebreak/node_modules/base64-js ./node_modules/linebreak/node_modules/base64-js
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/linkify-it ./node_modules/linkify-it
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/lodash.defaults ./node_modules/lodash.defaults
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/lodash.includes ./node_modules/lodash.includes
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/lodash.isarguments ./node_modules/lodash.isarguments
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/lodash.isboolean ./node_modules/lodash.isboolean
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/lodash.isinteger ./node_modules/lodash.isinteger
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/lodash.isnumber ./node_modules/lodash.isnumber
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/lodash.isplainobject ./node_modules/lodash.isplainobject
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/lodash.isstring ./node_modules/lodash.isstring
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/lodash.once ./node_modules/lodash.once
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/long ./node_modules/long
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/lru.min ./node_modules/lru.min
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/luxon ./node_modules/luxon
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/mailparser ./node_modules/mailparser
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/mailparser/node_modules/iconv-lite ./node_modules/mailparser/node_modules/iconv-lite
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/math-intrinsics ./node_modules/math-intrinsics
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/mime-db ./node_modules/mime-db
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/minimalistic-assert ./node_modules/minimalistic-assert
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/minimist ./node_modules/minimist
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/ms ./node_modules/ms
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/msgpackr ./node_modules/msgpackr
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/mysql2 ./node_modules/mysql2
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/named-placeholders ./node_modules/named-placeholders
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/nanoid ./node_modules/nanoid
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/next ./node_modules/next
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/next-auth ./node_modules/next-auth
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/next-auth/node_modules/@auth/core ./node_modules/next-auth/node_modules/@auth/core
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/next/node_modules/postcss ./node_modules/next/node_modules/postcss
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/node-abort-controller ./node_modules/node-abort-controller
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/node-cron ./node_modules/node-cron
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/nodemailer ./node_modules/nodemailer
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/oauth4webapi ./node_modules/oauth4webapi
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/object-inspect ./node_modules/object-inspect
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/parseley ./node_modules/parseley
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/pdfkit ./node_modules/pdfkit
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/peberminta ./node_modules/peberminta
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/picocolors ./node_modules/picocolors
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/png-js ./node_modules/png-js
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/preact ./node_modules/preact
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/preact-render-to-string ./node_modules/preact-render-to-string
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/proxy-from-env ./node_modules/proxy-from-env
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/punycode.js ./node_modules/punycode.js
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/qs ./node_modules/qs
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/react ./node_modules/react
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/redis-errors ./node_modules/redis-errors
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/redis-parser ./node_modules/redis-parser
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/resend ./node_modules/resend
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/restructure ./node_modules/restructure
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/safe-buffer ./node_modules/safe-buffer
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/safer-buffer ./node_modules/safer-buffer
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/scmp ./node_modules/scmp
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/selderee ./node_modules/selderee
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/side-channel ./node_modules/side-channel
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/side-channel-list ./node_modules/side-channel-list
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/side-channel-map ./node_modules/side-channel-map
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/side-channel-weakmap ./node_modules/side-channel-weakmap
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/source-map-js ./node_modules/source-map-js
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/sql-escaper ./node_modules/sql-escaper
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/standard-as-callback ./node_modules/standard-as-callback
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/standardwebhooks ./node_modules/standardwebhooks
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/styled-jsx ./node_modules/styled-jsx
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/svix ./node_modules/svix
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/svix/node_modules/uuid ./node_modules/svix/node_modules/uuid
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/tiny-inflate ./node_modules/tiny-inflate
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/tlds ./node_modules/tlds
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/tslib ./node_modules/tslib
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/twilio ./node_modules/twilio
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/uc.micro ./node_modules/uc.micro
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/unicode-properties ./node_modules/unicode-properties
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/unicode-trie ./node_modules/unicode-trie
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/unicode-trie/node_modules/pako ./node_modules/unicode-trie/node_modules/pako
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/uuid ./node_modules/uuid
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/web-push ./node_modules/web-push
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/web-push/node_modules/https-proxy-agent ./node_modules/web-push/node_modules/https-proxy-agent
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/xmlbuilder ./node_modules/xmlbuilder

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]