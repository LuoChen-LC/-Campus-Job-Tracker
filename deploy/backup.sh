#!/usr/bin/env bash
# 备份 SQLite 数据库。丢进 crontab 就是每日备份。
#   0 3 * * * /opt/campus-tracker/deploy/backup.sh >> /var/log/tracker-backup.log 2>&1
set -euo pipefail

cd "$(dirname "$0")/.."
BACKUP_DIR="${BACKUP_DIR:-./backups}"
KEEP_DAYS="${KEEP_DAYS:-30}"

mkdir -p "$BACKUP_DIR"
STAMP=$(date +%Y%m%d-%H%M%S)
TARGET="$BACKUP_DIR/tracker-$STAMP.db"

# 用 sqlite 的 .backup 而不是 cp：容器还在写的时候 cp 可能拷到半截事务
docker compose exec -T backend \
  python -c "
import sqlite3
src = sqlite3.connect('/app/data/tracker.db')
dst = sqlite3.connect('/app/data/.backup.tmp.db')
src.backup(dst)
dst.close(); src.close()
"
mv ./backend/data/.backup.tmp.db "$TARGET"
gzip -f "$TARGET"

find "$BACKUP_DIR" -name 'tracker-*.db.gz' -mtime "+$KEEP_DAYS" -delete
echo "$(date '+%F %T') 备份完成: $TARGET.gz"
