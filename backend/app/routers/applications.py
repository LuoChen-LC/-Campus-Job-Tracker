from datetime import date, datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, func, select

from app.db import get_session
from app.models import Application, ApplicationEvent, Question
from app.models.enums import STATUS_TO_EVENT, AppStatus, Channel, EventResult, JobType
from app.schemas.application import (
    ApplicationCreate,
    ApplicationDetail,
    ApplicationRead,
    ApplicationUpdate,
    BoardColumn,
    EventCreate,
    EventRead,
    EventUpdate,
    MoveRequest,
)

router = APIRouter(prefix="/api/applications", tags=["applications"])


def _decorate(session: Session, app: Application) -> ApplicationRead:
    """补上列表里要展示的聚合字段。"""
    event_count = session.exec(
        select(func.count(ApplicationEvent.id)).where(
            ApplicationEvent.application_id == app.id
        )
    ).one()
    last_event_at = session.exec(
        select(func.max(ApplicationEvent.happened_at)).where(
            ApplicationEvent.application_id == app.id
        )
    ).one()
    question_count = session.exec(
        select(func.count(Question.id)).where(Question.application_id == app.id)
    ).one()
    data = ApplicationRead.model_validate(app)
    data.event_count = event_count or 0
    data.question_count = question_count or 0
    data.last_event_at = last_event_at
    return data


def _get_or_404(session: Session, app_id: int) -> Application:
    app = session.get(Application, app_id)
    if not app:
        raise HTTPException(404, "投递记录不存在")
    return app


def _detail(session: Session, app: Application) -> ApplicationDetail:
    base = _decorate(session, app)
    events = session.exec(
        select(ApplicationEvent)
        .where(ApplicationEvent.application_id == app.id)
        .order_by(ApplicationEvent.happened_at)
    ).all()
    return ApplicationDetail(
        **base.model_dump(), events=[EventRead.model_validate(e) for e in events]
    )


@router.get("/board", response_model=list[BoardColumn])
def get_board(
    session: Session = Depends(get_session),
    job_type: Optional[JobType] = None,
    q: Optional[str] = None,
):
    """看板视图：按状态分列，列内按 sort_order 排。"""
    stmt = select(Application)
    if job_type:
        stmt = stmt.where(Application.job_type == job_type)
    if q:
        like = f"%{q}%"
        stmt = stmt.where(
            (Application.company.like(like)) | (Application.position.like(like))
        )
    stmt = stmt.order_by(Application.sort_order, Application.id)
    apps = session.exec(stmt).all()

    buckets: dict[AppStatus, list[ApplicationRead]] = {s: [] for s in AppStatus}
    for app in apps:
        buckets[app.status].append(_decorate(session, app))
    return [BoardColumn(status=s, items=buckets[s]) for s in AppStatus]


@router.get("", response_model=list[ApplicationRead])
def list_applications(
    session: Session = Depends(get_session),
    status: Optional[AppStatus] = None,
    job_type: Optional[JobType] = None,
    channel: Optional[Channel] = None,
    q: Optional[str] = None,
    limit: int = Query(default=500, le=2000),
    offset: int = 0,
):
    stmt = select(Application)
    if status:
        stmt = stmt.where(Application.status == status)
    if job_type:
        stmt = stmt.where(Application.job_type == job_type)
    if channel:
        stmt = stmt.where(Application.channel == channel)
    if q:
        like = f"%{q}%"
        stmt = stmt.where(
            (Application.company.like(like))
            | (Application.position.like(like))
            | (Application.city.like(like))
        )
    stmt = stmt.order_by(Application.applied_at.desc(), Application.id.desc())
    stmt = stmt.offset(offset).limit(limit)
    return [_decorate(session, a) for a in session.exec(stmt).all()]


@router.post("", response_model=ApplicationDetail, status_code=201)
def create_application(payload: ApplicationCreate, session: Session = Depends(get_session)):
    data = payload.model_dump()
    data["applied_at"] = data.get("applied_at") or date.today()
    app = Application(**data)

    max_order = session.exec(
        select(func.max(Application.sort_order)).where(Application.status == app.status)
    ).one()
    app.sort_order = (max_order or 0) + 1

    session.add(app)
    session.commit()
    session.refresh(app)

    # 建档时自动补一条起点事件，时间线才算得出响应时长
    event_type = STATUS_TO_EVENT.get(app.status)
    if event_type:
        session.add(
            ApplicationEvent(
                application_id=app.id,
                event_type=event_type,
                result=EventResult.PENDING,
                happened_at=datetime.combine(app.applied_at, datetime.min.time()),
            )
        )
        session.commit()
        session.refresh(app)

    return _detail(session, app)


@router.get("/{app_id}", response_model=ApplicationDetail)
def get_application(app_id: int, session: Session = Depends(get_session)):
    return _detail(session, _get_or_404(session, app_id))


@router.patch("/{app_id}", response_model=ApplicationDetail)
def update_application(
    app_id: int, payload: ApplicationUpdate, session: Session = Depends(get_session)
):
    app = _get_or_404(session, app_id)
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(app, key, value)
    app.updated_at = datetime.now()
    session.add(app)
    session.commit()
    session.refresh(app)
    return _detail(session, app)


@router.delete("/{app_id}", status_code=204)
def delete_application(app_id: int, session: Session = Depends(get_session)):
    app = _get_or_404(session, app_id)
    # 题目不跟着删，只解绑：辛苦记的题不该因为删投递而丢
    for question in session.exec(
        select(Question).where(Question.application_id == app_id)
    ).all():
        question.application_id = None
        question.event_id = None
        session.add(question)
    session.delete(app)
    session.commit()


@router.post("/{app_id}/move", response_model=ApplicationRead)
def move_application(
    app_id: int, payload: MoveRequest, session: Session = Depends(get_session)
):
    """看板拖拽落点：改状态 + 重排目标列 + 自动补一条时间线事件。"""
    app = _get_or_404(session, app_id)
    status_changed = app.status != payload.status
    app.status = payload.status
    app.updated_at = datetime.now()
    session.add(app)

    ordered = payload.ordered_ids or [app_id]
    for index, item_id in enumerate(ordered):
        target = session.get(Application, item_id)
        if target:
            target.sort_order = index
            session.add(target)

    if status_changed and payload.log_event:
        event_type = STATUS_TO_EVENT.get(payload.status)
        if event_type:
            session.add(
                ApplicationEvent(
                    application_id=app.id,
                    event_type=event_type,
                    result=EventResult.PENDING,
                    happened_at=datetime.now(),
                    notes="看板拖动自动记录",
                )
            )

    session.commit()
    session.refresh(app)
    return _decorate(session, app)


@router.post("/{app_id}/events", response_model=EventRead, status_code=201)
def create_event(app_id: int, payload: EventCreate, session: Session = Depends(get_session)):
    app = _get_or_404(session, app_id)
    data = payload.model_dump(exclude={"sync_status"})
    data["happened_at"] = data.get("happened_at") or datetime.now()
    event = ApplicationEvent(application_id=app_id, **data)
    session.add(event)

    if payload.sync_status:
        reverse = {v: k for k, v in STATUS_TO_EVENT.items()}
        new_status = reverse.get(payload.event_type)
        if new_status:
            app.status = new_status
            app.updated_at = datetime.now()
            session.add(app)

    session.commit()
    session.refresh(event)
    return EventRead.model_validate(event)


@router.patch("/{app_id}/events/{event_id}", response_model=EventRead)
def update_event(
    app_id: int,
    event_id: int,
    payload: EventUpdate,
    session: Session = Depends(get_session),
):
    event = session.get(ApplicationEvent, event_id)
    if not event or event.application_id != app_id:
        raise HTTPException(404, "事件不存在")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(event, key, value)
    session.add(event)
    session.commit()
    session.refresh(event)
    return EventRead.model_validate(event)


@router.delete("/{app_id}/events/{event_id}", status_code=204)
def delete_event(app_id: int, event_id: int, session: Session = Depends(get_session)):
    event = session.get(ApplicationEvent, event_id)
    if not event or event.application_id != app_id:
        raise HTTPException(404, "事件不存在")
    session.delete(event)
    session.commit()
