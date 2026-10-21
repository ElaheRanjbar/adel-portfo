FROM node:24-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY backend/package.json backend/package-lock.json ./backend/
RUN npm ci --prefix backend
COPY . .
RUN npm run build:all

FROM node:24-bookworm-slim
ENV NODE_ENV=production HOST=0.0.0.0 PORT=3000
WORKDIR /app/backend
COPY backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev && mkdir -p data && chown node:node data
COPY --from=build /app/backend/dist ./dist
COPY --from=build /app/dist /app/dist
USER node
VOLUME ["/app/backend/data"]
EXPOSE 3000
CMD ["npm", "start"]
