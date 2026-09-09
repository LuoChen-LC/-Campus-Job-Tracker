# 部署到服务器

Ubuntu/Debian VPS + Docker Compose。两个容器：

```
公网 :8080 ──> web (Nginx)  ──┬── /            静态前端（React 打包产物）
                              └── /api/, /docs 反代到 backend:8000
                                        │
                                  backend (FastAPI)  ← 不对外暴露端口
                                        │
                            ./backend/data/tracker.db  ← 挂在宿主机上
```

前端调接口用的是相对路径 `/api`，和页面同源，所以不需要配 CORS。

---

## 一、服务器准备

最低 1C1G 就够（前端构建阶段吃内存，1G 建议先加 swap）。

```bash
# 装 Docker（官方脚本，Ubuntu/Debian 通用）
curl -fsSL https://get.docker.com | sudo sh
sudo systemctl enable --now docker

# 让当前用户免 sudo 用 docker（需要重新登录生效）
sudo usermod -aG docker $USER
```

1G 内存的机器加 swap，避免 `npm run build` 被 OOM kill：

```bash
sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile
sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

## 二、把代码传上去

本机（Windows PowerShell）在项目根目录执行，`node_modules`、`.venv` 不用传：

```powershell
scp -r backend\app backend\requirements.txt backend\seed.py backend\Dockerfile backend\.dockerignore root@服务器IP:/opt/campus-tracker/backend/
```

更省事的是用 rsync（Git Bash / WSL）：

```bash
rsync -avz --exclude node_modules --exclude .venv --exclude dist \
      --exclude __pycache__ --exclude '*.db' \
      ./ root@服务器IP:/opt/campus-tracker/
```

> 也可以先 `git init` 推到 GitHub 私有仓库，再在服务器 `git clone`——后续更新只要 `git pull`，比每次 rsync 舒服。注意仓库必须是**私有**的，`backend/data/*.db` 已在 `.gitignore` 里。

## 三、配置

在服务器上 `cd /opt/campus-tracker`：

```bash
cp .env.example .env
```

改 `.env` 里的 `WEB_PORT`（默认 8080）。

**设置访问口令（这一步不能跳过）**——应用本身没有登录功能，这个口令是唯一的门：

```bash
./deploy/set-password.sh 你的用户名
```

> 必须在第一次 `docker compose up` 之前生成 `deploy/htpasswd`。文件不存在时 Docker 会自作主张建一个同名**目录**挂进去，Nginx 会直接起不来。

## 四、启动

```bash
docker compose up -d --build
```

首次构建要几分钟（装 npm 依赖）。看状态和日志：

```bash
docker compose ps
docker compose logs -f
```

浏览器打开 `http://服务器IP:8080`，输入刚才设的用户名密码。

别忘了在云厂商控制台的**安全组**里放行 8080 端口——阿里云/腾讯云默认只开 22，这是最常见的"服务起来了但打不开"。

```bash
# 如果服务器本身开了 ufw
sudo ufw allow 8080/tcp
```

## 五、灌入示例数据（可选）

```bash
docker compose exec backend python seed.py          # 追加示例数据
docker compose exec backend python seed.py --reset  # 清空后重新灌
docker compose exec backend python seed.py --clear  # 只清空，准备记真实数据
```

数据库文件在宿主机的 `./backend/data/tracker.db`，可以直接拷走。

---

## 日常运维

| 操作 | 命令 |
| --- | --- |
| 更新代码后重新部署 | `git pull && docker compose up -d --build` |
| 查看日志 | `docker compose logs -f backend` |
| 重启 | `docker compose restart` |
| 停止 | `docker compose down`（数据在宿主机，不会丢） |
| 改访问密码 | `./deploy/set-password.sh 用户名 && docker compose restart web` |
| 手动备份 | `./deploy/backup.sh` |

每天凌晨 3 点自动备份，保留 30 天：

```bash
crontab -e
# 加一行：
0 3 * * * /opt/campus-tracker/deploy/backup.sh >> /var/log/tracker-backup.log 2>&1
```

---

## 关于安全的几句实话

当前这套配置的防线只有一条 Basic Auth，且**你选的是 IP + 端口、没有 HTTPS**，这意味着：

- Basic Auth 的用户名密码是**明文**在网络上传输的。同一个 WiFi 下的人、路径上的运营商，抓包就能拿到。
- 拿到口令就等于拿到全部数据的读写权。

所以：**这个密码不要和你任何其他账号重复**，随机生成一串就行。

真要长期跑，补上 HTTPS 是性价比最高的一步。等你有域名了告诉我，加 Certbot 大概十分钟的事：申请证书 + Nginx 加个 443 server 块 + 80 跳转 443，之后自动续期。

另外 `/docs` 那个 FastAPI 接口文档页面也在口令后面。如果不想暴露，把 `frontend/nginx.conf` 里那个 `location ~ ^/(docs|redoc|openapi\.json)$` 块删掉重新 build 即可。
