# evicons.dev: static Astro build served by nginx.
# Build context is the repository root: docker build -f site/Dockerfile .

FROM node:24-alpine AS build
WORKDIR /repo
ENV ASTRO_TELEMETRY_DISABLED=1

# Install workspace dependencies first so this layer is cached until a manifest changes.
COPY package.json package-lock.json ./
COPY packages/react/package.json packages/react/
COPY packages/svg/package.json packages/svg/
COPY site/package.json site/
RUN npm ci --ignore-scripts

COPY . .
RUN npm run build:icons \
 && npm run build -w @evicons/react \
 && npm run build -w site

FROM nginx:1.30-alpine
COPY site/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /repo/site/dist /usr/share/nginx/html
EXPOSE 80
