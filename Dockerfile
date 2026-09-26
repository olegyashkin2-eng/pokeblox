FROM node:24-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production PORT=3000 DB_PATH=/data/pokeblox.db
COPY package.json ./
COPY public ./public
COPY server ./server
RUN mkdir -p /data
EXPOSE 3000
CMD ["node", "server/index.mjs"]
