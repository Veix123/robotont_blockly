FROM node:22-bookworm-slim
WORKDIR /app
COPY web/package.json web/package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --prefer-offline --no-audit
COPY web/ ./
RUN npm run build && chown -R node:node /app
USER node
EXPOSE 5174
CMD ["sh", "-c", "npm run preview -- --host \"${WEB_BIND:-127.0.0.1}\" --port \"${PORT:-5174}\" --strictPort"]
