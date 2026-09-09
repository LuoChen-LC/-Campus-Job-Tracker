import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(exist_ok=True)

# 默认走本地 data/tracker.db；部署时由 compose 注入绝对路径
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{DATA_DIR / 'tracker.db'}")

# 前后端同源部署（Nginx 反代 /api）时用不到 CORS，这里只服务本地 vite dev
_default_origins = "http://localhost:5173,http://127.0.0.1:5173"
CORS_ORIGINS = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", _default_origins).split(",")
    if origin.strip()
]
