FROM node:22-bookworm-slim
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.18.0 --activate
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN CI=1 pnpm install --frozen-lockfile
COPY . .
RUN pnpm build
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
