FROM node:22-bookworm-slim

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.8.1 --activate

COPY package.json pnpm-lock.yaml .npmrc ./
RUN pnpm install --frozen-lockfile

COPY . .

EXPOSE 8081 19000 19001 19002 19006

CMD ["pnpm", "start", "--", "--host", "lan", "--port", "8081"]
