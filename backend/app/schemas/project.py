from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel

from app.models.enums import Priority, ProjectStatus, TaskStatus


class MilestoneCreate(BaseModel):
    title: str
    description: Optional[str] = None
    due_date: Optional[date] = None
    done: bool = False


class MilestoneUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[date] = None
    done: Optional[bool] = None
    sort_order: Optional[int] = None


class MilestoneRead(BaseModel):
    id: int
    project_id: int
    title: str
    description: Optional[str]
    due_date: Optional[date]
    done: bool
    done_at: Optional[datetime]
    sort_order: int
    task_total: int = 0
    task_done: int = 0

    model_config = {"from_attributes": True}


class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    status: TaskStatus = TaskStatus.TODO
    priority: Priority = Priority.MEDIUM
    milestone_id: Optional[int] = None
    due_date: Optional[date] = None
    estimate_hours: Optional[float] = None


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[TaskStatus] = None
    priority: Optional[Priority] = None
    milestone_id: Optional[int] = None
    due_date: Optional[date] = None
    estimate_hours: Optional[float] = None


class TaskRead(BaseModel):
    id: int
    project_id: int
    milestone_id: Optional[int]
    title: str
    description: Optional[str]
    status: TaskStatus
    priority: Priority
    due_date: Optional[date]
    estimate_hours: Optional[float]
    sort_order: int
    done_at: Optional[datetime]

    model_config = {"from_attributes": True}


class TaskMoveRequest(BaseModel):
    status: TaskStatus
    ordered_ids: list[int] = []


class DevLogCreate(BaseModel):
    log_date: Optional[date] = None
    content: str
    blockers: Optional[str] = None
    hours_spent: Optional[float] = None


class DevLogUpdate(BaseModel):
    log_date: Optional[date] = None
    content: Optional[str] = None
    blockers: Optional[str] = None
    hours_spent: Optional[float] = None


class DevLogRead(BaseModel):
    id: int
    project_id: int
    log_date: date
    content: str
    blockers: Optional[str]
    hours_spent: Optional[float]

    model_config = {"from_attributes": True}


class ProjectCreate(BaseModel):
    name: str
    summary: Optional[str] = None
    description: Optional[str] = None
    tech_stack: Optional[str] = None
    repo_url: Optional[str] = None
    demo_url: Optional[str] = None
    status: ProjectStatus = ProjectStatus.ACTIVE
    started_at: Optional[date] = None
    target_at: Optional[date] = None


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    summary: Optional[str] = None
    description: Optional[str] = None
    tech_stack: Optional[str] = None
    repo_url: Optional[str] = None
    demo_url: Optional[str] = None
    status: Optional[ProjectStatus] = None
    started_at: Optional[date] = None
    target_at: Optional[date] = None


class ProjectRead(BaseModel):
    id: int
    name: str
    summary: Optional[str]
    description: Optional[str]
    tech_stack: Optional[str]
    repo_url: Optional[str]
    demo_url: Optional[str]
    status: ProjectStatus
    started_at: Optional[date]
    target_at: Optional[date]
    created_at: datetime
    updated_at: datetime
    #: 进度 = 已完成任务 / 总任务
    progress: float = 0.0
    task_total: int = 0
    task_done: int = 0
    milestone_total: int = 0
    milestone_done: int = 0
    log_count: int = 0
    total_hours: float = 0.0
    last_log_date: Optional[date] = None

    model_config = {"from_attributes": True}


class ProjectDetail(ProjectRead):
    milestones: list[MilestoneRead] = []
    tasks: list[TaskRead] = []
    logs: list[DevLogRead] = []
