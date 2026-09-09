# ---- 构建阶段：把 React 打成静态文件 ----
FROM node:20-alpine AS builder

WORKDIR /app

# 先只拷依赖清单，命中缓存时跳过 npm ci
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---- 运行阶段：Nginx 托管静态文件 + 反代 /api ----
FROM nginx:1.27-alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
