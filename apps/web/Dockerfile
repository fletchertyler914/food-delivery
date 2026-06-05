FROM node:24-alpine AS base
ENV DOCKER_BUILD=true
RUN corepack enable
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/package.json
COPY packages/api-client/package.json packages/api-client/package.json
RUN pnpm install --frozen-lockfile

FROM deps AS build
COPY . .
RUN pnpm --filter @food-delivery/web build

FROM nginx:1.27-alpine AS runtime
RUN chown -R nginx:nginx /usr/share/nginx/html /var/cache/nginx /var/log/nginx && \
    touch /var/run/nginx.pid && chown nginx:nginx /var/run/nginx.pid
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
USER nginx
EXPOSE 8080

# `nginx:alpine` ships with `wget`. /healthz is served entirely from
# nginx (no upstream dependency), so the probe stays meaningful even
# during a brief API restart. Compose can `depends_on: condition:
# service_healthy` on the web container.
HEALTHCHECK --interval=15s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --quiet --spider http://127.0.0.1:8080/healthz || exit 1
