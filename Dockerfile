FROM node:22-alpine AS build

WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

FROM node:22-alpine

WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile --prod
COPY --from=build /app/dist ./dist
COPY keys/ ./keys/

EXPOSE 3000
CMD ["node", "dist/main"]
