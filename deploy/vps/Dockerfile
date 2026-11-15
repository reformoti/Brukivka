FROM node:24-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production PORT=3000
COPY package.json package-lock.json ./
COPY homow-server/package.json ./homow-server/package.json
RUN npm ci --omit=dev && npm cache clean --force
COPY . .
RUN npm run build
USER node
EXPOSE 3000
CMD ["node", "homow-server/server.mjs"]
