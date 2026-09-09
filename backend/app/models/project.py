from datetime import date, datetime
from typing import Optional

from sqlmodel import Field, Relationship, SQLModel

from app.models.enums import Priority, ProjectStatus, TaskStatus


class Project(SQLModel, table=True):
    __tablename__ = "project"

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    summary: Optional[str] = None
    description: Optional[str] = None
    tech_stack: Optional[str] = None  # 逗号分隔
    repo_url: Optional[str] = None
    demo_url: Optional[str] = None
    status: ProjectStatus = Field(default=ProjectStatus.ACTIVE, index=True)
    started_at: Optional[date] = Field(default_factory=date.today)
    target_at: Optional[date] = None
    sort_order: int = Field(default=0)
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

    milestones: list["Milestone"] = Relationship(
        back_populates="project",
        sa_relationship_kwargs={
            "cascade": "all, delete-orphan",
            "order_by": "Milestone.sort_order",
        },
    )
    tasks: list["Task"] = Relationship(
        back_populates="project",
        sa_relationship_kwargs={
            "cascade": "all, delete-orphan",
            "order_by": "Task.sort_order",
        },
    )
    logs: list["DevLog"] = Relationship(
        back_populates="project",
        sa_relationship_kwargs={
            "cascade": "all, delete-orphan",
            "order_by": "desc(DevLog.log_date)",
        },
    )


class Milestone(SQLModel, table=True):
    __tablename__ = "milestone"

    id: Optional[int] = Field(default=None, primary_key=True)
    project_id: int = Field(foreign_key="project.id", index=True, ondelete="CASCADE")
    title: str
    description: Optional[str] = None
    due_date: Optional[date] = None
    done: bool = Field(default=False)
    done_at: Optional[datetime] = None
    sort_order: int = Field(default=0)
    created_at: datetime = Field(default_factory=datetime.now)

    project: Optional[Project] = Relationship(back_populates="milestones")


class Task(SQLModel, table=True):
    __tablename__ = "task"

    id: Optional[int] = Field(default=None, primary_key=True)
    project_id: int = Field(foreign_key="project.id", index=True, ondelete="CASCADE")
    milestone_id: Optional[int] = Field(
        default=None, foreign_key="milestone.id", index=True, ondelete="SET NULL"
    )
    title: str
    description: Optional[str] = None
    status: TaskStatus = Field(default=TaskStatus.TODO, index=True)
    priority: Priority = Field(default=Priority.MEDIUM)
    due_date: Optional[date] = None
    estimate_hours: Optional[float] = None
    sort_order: int = Field(default=0)
    created_at: datetime = Field(default_factory=datetime.now)
    done_at: Optional[datetime] = None

    project: Optional[Project] = Relationship(back_populates="tasks")


class DevLog(SQLModel, table=True):
    """开发日志：今天干了啥 / 踩了什么坑 / 花了多久。简历素材就从这里回捞。"""

    __tablename__ = "dev_log"

    id: Optional[int] = Field(default=None, primary_key=True)
    project_id: int = Field(foreign_key="project.id", index=True, ondelete="CASCADE")
    log_date: date = Field(default_factory=date.today, index=True)
    content: str
    blockers: Optional[str] = None
    hours_spent: Optional[float] = None
    created_at: datetime = Field(default_factory=datetime.now)

    project: Optional[Project] = Relationship(back_populates="logs")
