#!/usr/bin/env bash
# 生成/覆盖 Nginx Basic Auth 的口令文件。
# 用法： ./deploy/set-password.sh <用户名>
set -euo pipefail

cd "$(dirname "$0")/.."
USER_NAME="${1:-}"

if [ -z "$USER_NAME" ]; then
  echo "用法: $0 <用户名>" >&2
  exit 1
fi

read -rsp "为 ${USER_NAME} 设置密码: " PASSWORD; echo
read -rsp "再输入一次: " PASSWORD2; echo
if [ "$PASSWORD" != "$PASSWORD2" ]; then
  echo "两次输入不一致" >&2
  exit 1
fi

# 借 httpd 镜像算 bcrypt，免得在宿主机装 apache2-utils
docker run --rm httpd:2.4-alpine htpasswd -nbB "$USER_NAME" "$PASSWORD" > deploy/htpasswd
# Nginx worker 以 nginx 用户运行，600 会让它读不到文件而返回 500
chmod 644 deploy/htpasswd

echo "已写入 deploy/htpasswd"
echo "如果 web 容器已在运行： docker compose restart web"
