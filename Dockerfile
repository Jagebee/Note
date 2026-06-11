FROM node:20-alpine AS base

WORKDIR /app

# Install OpenSSL (required by Prisma on Alpine)
RUN apk add --no-cache openssl

# Dependencies layer (cached unless package.json changes)
COPY package*.json ./
RUN npm ci && npm install --save-dev @types/bcryptjs

# Prisma client generation
COPY prisma ./prisma
RUN npx prisma generate

# Build application
COPY . .
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
