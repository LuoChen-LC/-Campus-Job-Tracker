from datetime import date, datetime
from typing import Optional

from sqlmodel import Field, Relationship, SQLModel

from app.models.enums import AppStatus, Channel, EventResult, EventType, JobType


class Application(SQLModel, table=True):
    """一条投递记录。状态变更的历史全部落在 ApplicationEvent 里。"""

    __tablename__ = "application"

    id: Optional[int] = Field(default=None, primary_key=True)
    company: str = Field(index=True)
    position: str
    job_type: JobType = Field(default=JobType.INTERN, index=True)
    channel: Channel = Field(default=Channel.OFFICIAL)
    city: Optional[str] = None
    salary: Optional[str] = None
    jd_url: Optional[str] = None
    referrer: Optional[str] = None
    applied_at: date = Field(default_factory=date.today, index=True)
    status: AppStatus = Field(default=AppStatus.APPLIED, index=True)
    sort_order: int = Field(default=0)
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

    events: list["ApplicationEvent"] = Relationship(
        back_populates="application",
        sa_relationship_kwargs={
            "cascade": "all, delete-orphan",
            "order_by": "ApplicationEvent.happened_at",
        },
    )


class ApplicationEvent(SQLModel, table=True):
    """投递时间线上的一个节点：投出去 / 笔试 / 某一轮面试 / 结果。"""

    __tablename__ = "application_event"

    id: Optional[int] = Field(default=None, primary_key=True)
    application_id: int = Field(foreign_key="application.id", index=True, ondelete="CASCADE")
    event_type: EventType = Field(default=EventType.OTHER)
    result: EventResult = Field(default=EventResult.PENDING)
    happened_at: datetime = Field(default_factory=datetime.now, index=True)
    duration_minutes: Optional[int] = None
    interviewer: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)

    application: Optional[Application] = Relationship(back_populates="events")
