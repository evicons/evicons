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
# Statistics (OpenPanel) client ID for the browser; empty: the pages carry no statistics script at all.
ARG PUBLIC_OPENPANEL_CLIENT_ID=""
ENV PUBLIC_OPENPANEL_CLIENT_ID=$PUBLIC_OPENPANEL_CLIENT_ID
RUN npm run build:icons \
 && npm run build -w @evicons/react \
 && npm run build -w site

FROM nginx:1.30-alpine
# Statistics proxy /api/op/track, configured at run time: the same client ID as at build time (empty: the
# proxy answers 404) and the OpenPanel server. The entrypoint fills these into the template, and only these.
ENV PUBLIC_OPENPANEL_CLIENT_ID="" \
    OPENPANEL_API_URL="https://stats.landolsi.de" \
    NGINX_ENTRYPOINT_LOCAL_RESOLVERS=1 \
    NGINX_ENVSUBST_FILTER="^(PUBLIC_OPENPANEL_CLIENT_ID|OPENPANEL_API_URL|NGINX_LOCAL_RESOLVERS)$"
COPY site/nginx.conf /etc/nginx/conf.d/default.conf
COPY site/nginx-security-headers.conf /etc/nginx/snippets/security-headers.conf
COPY site/nginx-openpanel-location.conf /etc/nginx/snippets/openpanel-location.conf
COPY site/nginx-openpanel.conf.template /etc/nginx/templates/openpanel.conf.template
COPY --chmod=755 site/nginx-openpanel.envsh /docker-entrypoint.d/16-openpanel.envsh
COPY --from=build /repo/site/dist /usr/share/nginx/html
EXPOSE 80
