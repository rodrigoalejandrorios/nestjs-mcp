FROM node:20-alpine AS installer
WORKDIR /app
COPY package*.json ./
RUN npm install

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=installer /app/node_modules ./node_modules
COPY . .
RUN npm install
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
COPY package*.json ./
COPY tsconfig.json ./
COPY --from=installer /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
EXPOSE 8002

CMD ["npm", "run", "start:prod"]