# Stage 1: Build
FROM node:20-alpine AS builder

RUN apk add --no-cache openssl openssl-dev libc6-compat

WORKDIR /app

COPY package*.json ./
COPY tsconfig*.json ./

RUN npm ci

COPY . .

RUN npx prisma generate

# Só precisa rodar build que já faz tudo (front + back)!
RUN npm run build

# Stage 2: Production
FROM node:20-alpine AS production

RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 easier

COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

COPY prisma ./prisma
RUN npx prisma generate

# Importa a pasta dist pronta:
COPY --from=builder /app/dist ./dist

RUN chown -R easier:nodejs /app
USER easier
EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server/index.js"]