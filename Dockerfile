##### DEPENDENCIES
FROM --platform=linux/amd64 node:16-alpine3.16 AS deps
# RUN apk add --no-cache libc6-compat openssl1.1-compat
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

ENV SKIP_ENV_VALIDATION 1
# Install Prisma Client - remove if not using Prisma

COPY prisma ./
COPY bin ./

# Install dependencies based on the preferred package manager

COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml\* ./

RUN npm ci

##### BUILDER

FROM --platform=linux/amd64 node:16-alpine3.16 AS builder
ARG DATABASE_URL
ARG NEXT_PUBLIC_CLIENTVAR
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# ENV NEXT_TELEMETRY_DISABLED 1

RUN npm run test

RUN SKIP_ENV_VALIDATION=1 npm run build

##### RUNNER

FROM --platform=linux/amd64 node:16-alpine3.16 AS runner
WORKDIR /app

ENV NODE_ENV production

# ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/next.config.mjs ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

COPY --from=deps --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=deps --chown=nextjs:nodejs /app/schema.prisma ./prisma/schema.prisma
COPY --from=deps --chown=nextjs:nodejs /app/entrypoint.sh ./entrypoint.sh

RUN ls -a

RUN chmod +x entrypoint.sh

USER nextjs
EXPOSE 3000
ENV PORT 3000

ENTRYPOINT ["./entrypoint.sh"]

CMD ["node", "server.js"]
