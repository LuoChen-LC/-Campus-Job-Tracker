# 一条命令同时起前后端（Windows PowerShell）
# 用法： .\dev.ps1
$root = $PSScriptRoot

Start-Process powershell -ArgumentList @(
  "-NoExit", "-Command",
  "Set-Location '$root\backend'; .\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000"
)

Start-Process powershell -ArgumentList @(
  "-NoExit", "-Command",
  "Set-Location '$root\frontend'; npm run dev"
)

Write-Host "后端 http://127.0.0.1:8000/docs"
Write-Host "前端 http://localhost:5173"
