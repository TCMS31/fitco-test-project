# syntax=docker/dockerfile:1

# ---- build -----------------------------------------------------------------
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Create React App inlines REACT_APP_* at build time, not at run time, so the
# API origin has to be supplied here rather than as a container env var.
ARG REACT_APP_API_URL=/
ENV REACT_APP_API_URL=$REACT_APP_API_URL

COPY public ./public
COPY src ./src
RUN npm run build

# ---- runtime ---------------------------------------------------------------
FROM nginx:1.27-alpine AS runtime

COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Give the unprivileged nginx user ownership of the paths it writes to and bind
# an unprivileged port, so the container never needs root.
RUN touch /var/run/nginx.pid \
  && chown -R nginx:nginx /var/cache/nginx /var/run/nginx.pid /usr/share/nginx/html

USER nginx

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q --spider http://127.0.0.1:8080/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
