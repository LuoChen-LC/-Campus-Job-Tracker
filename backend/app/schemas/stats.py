from typing import Optional

from pydantic import BaseModel


class FunnelStage(BaseModel):
    stage: str
    label: str
    count: int
    #: 相对上一阶段的转化率
    rate: float


class NamedCount(BaseModel):
    key: str
    count: int


class WeeklyPoint(BaseModel):
    week: str
    count: int


class ChannelStat(BaseModel):
    channel: str
    total: int
    reached_interview: int
    offers: int
    conversion: float


class ProjectProgress(BaseModel):
    id: int
    name: str
    progress: float
    status: str
    task_done: int
    task_total: int


class DashboardStats(BaseModel):
    total_applications: int
    active_applications: int
    offer_count: int
    rejected_count: int
    interview_count: int
    avg_days_to_first_response: Optional[float]

    funnel: list[FunnelStage]
    status_counts: list[NamedCount]
    weekly_applications: list[WeeklyPoint]
    channel_stats: list[ChannelStat]

    total_questions: int
    need_review_count: int
    question_types: list[NamedCount]
    mastery_distribution: list[NamedCount]
    top_tags: list[NamedCount]

    project_progress: list[ProjectProgress]
    logged_hours_this_week: float
