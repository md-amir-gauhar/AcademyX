FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --production

COPY --from=builder /app/dist ./dist

COPY --from=builder /app/src ./src

COPY start.sh ./start.sh

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

RUN chown -R nodejs:nodejs /app && \
    chmod +x /app/start.sh

USER nodejs

EXPOSE 3000 10000

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD node -e "const port=process.env.PORT||3000; require('http').get('http://localhost:'+port+'/health-check', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["sh", "start.sh"]
