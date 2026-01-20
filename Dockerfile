# Multi-stage build para otimizar a imagem final

# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependências
RUN npm ci

# Copiar código fonte
COPY . .

# Gerar Prisma Client
RUN npx prisma generate

# Build do frontend e backend
RUN npm run build

# Stage 2: Production
FROM node:20-alpine AS production

WORKDIR /app

# Instalar apenas dependências de produção
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copiar Prisma schema e migrations
COPY prisma ./prisma

# Gerar Prisma Client na imagem de produção
RUN npx prisma generate

# Copiar build do frontend
COPY --from=builder /app/dist ./dist

# Copiar código do backend compilado
COPY --from=builder /app/server ./server

# Copiar outros arquivos necessários
COPY --from=builder /app/vite.config.ts ./
COPY --from=builder /app/index.html ./

# Criar usuário não-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Mudar propriedade dos arquivos
RUN chown -R nodejs:nodejs /app

# Usar usuário não-root
USER nodejs

# Expor porta
EXPOSE 3000

# Script de inicialização que executa migrations e inicia o servidor
CMD ["sh", "-c", "npx prisma migrate deploy && node server/index.js"]
