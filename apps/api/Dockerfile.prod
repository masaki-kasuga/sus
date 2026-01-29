FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
COPY .npmrc ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
COPY .npmrc ./
RUN npm ci --omit=dev

COPY --from=build /app/dist ./dist
COPY --from=build /app/data ./data

EXPOSE 3000
CMD ["npm", "run", "start"]

