from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import CORS_ORIGINS
from app.db import init_db
from app.routers import applications, projects, questions, stats


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(
    title="秋招 / 实习 追踪台",
    description="投递记录、面试笔试题库、个人项目进度",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(applications.router)
app.include_router(questions.router)
app.include_router(questions.tag_router)
app.include_router(projects.router)
app.include_router(stats.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
