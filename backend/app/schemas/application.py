from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel

from app.models.enums import AppStatus, Channel, EventResult, EventType, JobType


class ApplicationCreate(BaseModel):
    company: str
    position: str
    job_type: JobType = JobType.INTERN
    channel: Channel = Channel.OFFICIAL
    city: Optional[str] = None
    salary: Optional[str] = None
    jd_url: Optional[str] = None
    referrer: Optional[str] = None
    applied_at: date | None = None
    status: AppStatus = AppStatus.APPLIED
    notes: Optional[str] = None


class ApplicationUpdate(BaseModel):
    company: Optional[str] = None
    position: Optional[str] = None
    job_type: Optional[JobType] = None
    channel: Optional[Channel] = None
    city: Optional[str] = None
    salary: Optional[str] = None
    jd_url: Optional[str] = None
    referrer: Optional[str] = None
    applied_at: Optional[date] = None
    status: Optional[AppStatus] = None
    notes: Optional[str] = None


class EventCreate(BaseModel):
    event_type: EventType
    result: EventResult = EventResult.PENDING
    happened_at: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    interviewer: Optional[str] = None
    notes: Optional[str] = None
    #: 为 true 时同步把投递的当前状态推进到这一轮
    sync_status: bool = True


class EventUpdate(BaseModel):
    event_type: Optional[EventType] = None
    result: Optional[EventResult] = None
    happened_at: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    interviewer: Optional[str] = None
    notes: Optional[str] = None


class EventRead(BaseModel):
    id: int
    application_id: int
    event_type: EventType
    result: EventResult
    happened_at: datetime
    duration_minutes: Optional[int]
    interviewer: Optional[str]
    notes: Optional[str]

    model_config = {"from_attributes": True}


class ApplicationRead(BaseModel):
    id: int
    company: str
    position: str
    job_type: JobType
    channel: Channel
    city: Optional[str]
    salary: Optional[str]
    jd_url: Optional[str]
    referrer: Optional[str]
    applied_at: date
    status: AppStatus
    sort_order: int
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime
    event_count: int = 0
    question_count: int = 0
    last_event_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class ApplicationDetail(ApplicationRead):
    events: list[EventRead] = []


class MoveRequest(BaseModel):
    status: AppStatus
    #: 目标列拖动完成后的完整 id 顺序
    ordered_ids: list[int] = []
    #: 是否顺便补一条时间线事件
    log_event: bool = True


class BoardColumn(BaseModel):
    status: AppStatus
    items: list[ApplicationRead]
