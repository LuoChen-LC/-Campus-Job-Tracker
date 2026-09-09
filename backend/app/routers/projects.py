from datetime import date, datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, func, select

from app.db import get_session
from app.models import DevLog, Milestone, Project, Task
from app.models.enums import ProjectStatus, TaskStatus
from app.schemas.project import (
    DevLogCreate,
    DevLogRead,
    DevLogUpdate,
    MilestoneCreate,
    MilestoneRead,
    MilestoneUpdate,
    ProjectCreate,
    ProjectDetail,
    ProjectRead,
    ProjectUpdate,
    TaskCreate,
    TaskMoveRequest,
    TaskRead,
    TaskUpdate,
)

router = APIRouter(prefix="/api/projects", tags=["projects"])


def _get_or_404(session: Session, project_id: int) -> Project:
    project = session.get(Project, project_id)
    if not project:
        raise HTTPException(404, "项目不存在")
    return project


def _decorate(session: Session, project: Project) -> ProjectRead:
    """进度不存字段，每次按任务完成比现算，避免两边对不上。"""
    tasks = session.exec(select(Task).where(Task.project_id == project.id)).all()
    milestones = session.exec(
        select(Milestone).where(Milestone.project_id == project.id)
    ).all()

    task_total = len(tasks)
    task_done = sum(1 for t in tasks if t.status == TaskStatus.DONE)
    total_hours = session.exec(
        select(func.coalesce(func.sum(DevLog.hours_spent), 0.0)).where(
            DevLog.project_id == project.id
        )
    ).one()
    log_count = session.exec(
        select(func.count(DevLog.id)).where(DevLog.project_id == project.id)
    ).one()
    last_log_date = session.exec(
        select(func.max(DevLog.log_date)).where(DevLog.project_id == project.id)
    ).one()

    data = ProjectRead.model_validate(project)
    data.task_total = task_total
    data.task_done = task_done
    data.progress = round(task_done / task_total, 4) if task_total else 0.0
    data.milestone_total = len(milestones)
    data.milestone_done = sum(1 for m in milestones if m.done)
    data.log_count = log_count or 0
    data.total_hours = round(float(total_hours or 0), 2)
    data.last_log_date = (
        date.fromisoformat(last_log_date) if isinstance(last_log_date, str) else last_log_date
    )
    return data


def _detail(session: Session, project: Project) -> ProjectDetail:
    base = _decorate(session, project)

    tasks = session.exec(
        select(Task)
        .where(Task.project_id == project.id)
        .order_by(Task.sort_order, Task.id)
    ).all()
    milestones = session.exec(
        select(Milestone)
        .where(Milestone.project_id == project.id)
        .order_by(Milestone.sort_order, Milestone.id)
    ).all()
    logs = session.exec(
        select(DevLog)
        .where(DevLog.project_id == project.id)
        .order_by(DevLog.log_date.desc(), DevLog.id.desc())
    ).all()

    milestone_reads = []
    for milestone in milestones:
        item = MilestoneRead.model_validate(milestone)
        related = [t for t in tasks if t.milestone_id == milestone.id]
        item.task_total = len(related)
        item.task_done = sum(1 for t in related if t.status == TaskStatus.DONE)
        milestone_reads.append(item)

    return ProjectDetail(
        **base.model_dump(),
        milestones=milestone_reads,
        tasks=[TaskRead.model_validate(t) for t in tasks],
        logs=[DevLogRead.model_validate(log) for log in logs],
    )


@router.get("", response_model=list[ProjectRead])
def list_projects(
    session: Session = Depends(get_session), status: Optional[ProjectStatus] = None
):
    stmt = select(Project)
    if status:
        stmt = stmt.where(Project.status == status)
    stmt = stmt.order_by(Project.sort_order, Project.id.desc())
    return [_decorate(session, p) for p in session.exec(stmt).all()]


@router.post("", response_model=ProjectDetail, status_code=201)
def create_project(payload: ProjectCreate, session: Session = Depends(get_session)):
    data = payload.model_dump()
    data["started_at"] = data.get("started_at") or date.today()
    project = Project(**data)
    session.add(project)
    session.commit()
    session.refresh(project)
    return _detail(session, project)


@router.get("/{project_id}", response_model=ProjectDetail)
def get_project(project_id: int, session: Session = Depends(get_session)):
    return _detail(session, _get_or_404(session, project_id))


@router.patch("/{project_id}", response_model=ProjectDetail)
def update_project(
    project_id: int, payload: ProjectUpdate, session: Session = Depends(get_session)
):
    project = _get_or_404(session, project_id)
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(project, key, value)
    project.updated_at = datetime.now()
    session.add(project)
    session.commit()
    session.refresh(project)
    return _detail(session, project)


@router.delete("/{project_id}", status_code=204)
def delete_project(project_id: int, session: Session = Depends(get_session)):
    project = _get_or_404(session, project_id)
    session.delete(project)
    session.commit()


# ---------------------------------------------------------------- milestones


@router.post("/{project_id}/milestones", response_model=MilestoneRead, status_code=201)
def create_milestone(
    project_id: int, payload: MilestoneCreate, session: Session = Depends(get_session)
):
    _get_or_404(session, project_id)
    max_order = session.exec(
        select(func.max(Milestone.sort_order)).where(Milestone.project_id == project_id)
    ).one()
    milestone = Milestone(
        project_id=project_id, sort_order=(max_order or 0) + 1, **payload.model_dump()
    )
    if milestone.done:
        milestone.done_at = datetime.now()
    session.add(milestone)
    session.commit()
    session.refresh(milestone)
    return MilestoneRead.model_validate(milestone)


@router.patch("/{project_id}/milestones/{milestone_id}", response_model=MilestoneRead)
def update_milestone(
    project_id: int,
    milestone_id: int,
    payload: MilestoneUpdate,
    session: Session = Depends(get_session),
):
    milestone = session.get(Milestone, milestone_id)
    if not milestone or milestone.project_id != project_id:
        raise HTTPException(404, "里程碑不存在")
    fields = payload.model_dump(exclude_unset=True)
    if "done" in fields:
        milestone.done_at = datetime.now() if fields["done"] else None
    for key, value in fields.items():
        setattr(milestone, key, value)
    session.add(milestone)
    session.commit()
    session.refresh(milestone)
    return MilestoneRead.model_validate(milestone)


@router.delete("/{project_id}/milestones/{milestone_id}", status_code=204)
def delete_milestone(
    project_id: int, milestone_id: int, session: Session = Depends(get_session)
):
    milestone = session.get(Milestone, milestone_id)
    if not milestone or milestone.project_id != project_id:
        raise HTTPException(404, "里程碑不存在")
    for task in session.exec(select(Task).where(Task.milestone_id == milestone_id)).all():
        task.milestone_id = None
        session.add(task)
    session.delete(milestone)
    session.commit()


# --------------------------------------------------------------------- tasks


@router.post("/{project_id}/tasks", response_model=TaskRead, status_code=201)
def create_task(
    project_id: int, payload: TaskCreate, session: Session = Depends(get_session)
):
    _get_or_404(session, project_id)
    max_order = session.exec(
        select(func.max(Task.sort_order)).where(
            Task.project_id == project_id, Task.status == payload.status
        )
    ).one()
    task = Task(project_id=project_id, sort_order=(max_order or 0) + 1, **payload.model_dump())
    if task.status == TaskStatus.DONE:
        task.done_at = datetime.now()
    session.add(task)
    session.commit()
    session.refresh(task)
    _sync_milestone(session, task.milestone_id)
    return TaskRead.model_validate(task)


@router.patch("/{project_id}/tasks/{task_id}", response_model=TaskRead)
def update_task(
    project_id: int,
    task_id: int,
    payload: TaskUpdate,
    session: Session = Depends(get_session),
):
    task = session.get(Task, task_id)
    if not task or task.project_id != project_id:
        raise HTTPException(404, "任务不存在")
    old_milestone = task.milestone_id
    fields = payload.model_dump(exclude_unset=True)
    if "status" in fields:
        task.done_at = datetime.now() if fields["status"] == TaskStatus.DONE else None
    for key, value in fields.items():
        setattr(task, key, value)
    session.add(task)
    session.commit()
    session.refresh(task)
    _sync_milestone(session, old_milestone)
    _sync_milestone(session, task.milestone_id)
    return TaskRead.model_validate(task)


@router.post("/{project_id}/tasks/{task_id}/move", response_model=TaskRead)
def move_task(
    project_id: int,
    task_id: int,
    payload: TaskMoveRequest,
    session: Session = Depends(get_session),
):
    """任务看板拖拽：换列 + 重排。"""
    task = session.get(Task, task_id)
    if not task or task.project_id != project_id:
        raise HTTPException(404, "任务不存在")
    task.status = payload.status
    task.done_at = datetime.now() if payload.status == TaskStatus.DONE else None
    session.add(task)

    for index, item_id in enumerate(payload.ordered_ids or [task_id]):
        target = session.get(Task, item_id)
        if target and target.project_id == project_id:
            target.sort_order = index
            session.add(target)

    session.commit()
    session.refresh(task)
    _sync_milestone(session, task.milestone_id)
    return TaskRead.model_validate(task)


@router.delete("/{project_id}/tasks/{task_id}", status_code=204)
def delete_task(project_id: int, task_id: int, session: Session = Depends(get_session)):
    task = session.get(Task, task_id)
    if not task or task.project_id != project_id:
        raise HTTPException(404, "任务不存在")
    milestone_id = task.milestone_id
    session.delete(task)
    session.commit()
    _sync_milestone(session, milestone_id)


def _sync_milestone(session: Session, milestone_id: Optional[int]) -> None:
    """里程碑下所有任务都 done 时自动打勾，有任务回退则取消。"""
    if milestone_id is None:
        return
    milestone = session.get(Milestone, milestone_id)
    if not milestone:
        return
    tasks = session.exec(select(Task).where(Task.milestone_id == milestone_id)).all()
    if not tasks:
        return
    all_done = all(t.status == TaskStatus.DONE for t in tasks)
    if all_done != milestone.done:
        milestone.done = all_done
        milestone.done_at = datetime.now() if all_done else None
        session.add(milestone)
        session.commit()


# ------------------------------------------------------------------ devlogs


@router.post("/{project_id}/logs", response_model=DevLogRead, status_code=201)
def create_log(
    project_id: int, payload: DevLogCreate, session: Session = Depends(get_session)
):
    _get_or_404(session, project_id)
    data = payload.model_dump()
    data["log_date"] = data.get("log_date") or date.today()
    log = DevLog(project_id=project_id, **data)
    session.add(log)
    session.commit()
    session.refresh(log)
    return DevLogRead.model_validate(log)


@router.patch("/{project_id}/logs/{log_id}", response_model=DevLogRead)
def update_log(
    project_id: int,
    log_id: int,
    payload: DevLogUpdate,
    session: Session = Depends(get_session),
):
    log = session.get(DevLog, log_id)
    if not log or log.project_id != project_id:
        raise HTTPException(404, "日志不存在")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(log, key, value)
    session.add(log)
    session.commit()
    session.refresh(log)
    return DevLogRead.model_validate(log)


@router.delete("/{project_id}/logs/{log_id}", status_code=204)
def delete_log(project_id: int, log_id: int, session: Session = Depends(get_session)):
    log = session.get(DevLog, log_id)
    if not log or log.project_id != project_id:
        raise HTTPException(404, "日志不存在")
    session.delete(log)
    session.commit()
