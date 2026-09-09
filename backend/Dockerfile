FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    TZ=Asia/Shanghai

WORKDIR /app

# 依赖单独一层，改代码时不会重装
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app
COPY seed.py .

# data/ 由 compose 以 bind mount 挂进来，这里建目录是为了不挂载时也能跑
RUN mkdir -p /app/data

EXPOSE 8000

# SQLite 单文件写入，保持单进程；并发靠 async 事件循环
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
