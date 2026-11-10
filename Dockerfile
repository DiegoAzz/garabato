# Etapa 1: Compilación de la aplicación Vite
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Etapa 2: Servidor Node.js para producción con soporte WebSockets y TikTok LIVE
FROM node:20-alpine
WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY --from=builder /app/dist ./dist
COPY server.js ./

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000 80

CMD ["node", "server.js"]
