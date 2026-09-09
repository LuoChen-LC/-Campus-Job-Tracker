from collections import Counter, defaultdict
from datetime import date, timedelta

from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from app.db import get_session
from app.models import Application, ApplicationEvent, DevLog, Project, Question, Task
from app.models.enums import (
    FUNNEL_ORDER,
    STATUS_TO_EVENT,
    AppStatus,
    EventType,
    TaskStatus,
)
from app.schemas.stats import (
    ChannelStat,
    DashboardStats,
    FunnelStage,
    NamedCount,
    ProjectProgress,
    WeeklyPoint,
)

router = APIRouter(prefix="/api/stats", tags=["stats"])

INTERVIEW_EVENTS = {
    EventType.INTERVIEW_1,
    EventType.INTERVIEW_2,
    EventType.INTERVIEW_3,
    EventType.HR,
}
CLOSED_STATUSES = {AppStatus.OFFER, AppStatus.REJECTED, AppStatus.POOL}


@router.get("/dashboard", response_model=DashboardStats)
def dashboard(session: Session = Depends(get_session)):
    apps = session.exec(select(Application)).all()
    events = session.exec(select(ApplicationEvent)).all()
    questions = session.exec(select(Question)).all()
    projects = session.exec(select(Project)).all()
    tasks = session.exec(select(Task)).all()
    logs = session.exec(select(DevLog)).all()

    events_by_app: dict[int, list[ApplicationEvent]] = defaultdict(list)
    for event in events:
        events_by_app[event.application_id].append(event)
    for bucket in events_by_app.values():
        bucket.sort(key=lambda e: e.happened_at)

    # ---- 漏斗：某一阶段的人数 = 时间线上出现过该阶段事件的投递数 ----
    reached: dict[EventType, set[int]] = defaultdict(set)
    for event in events:
        reached[event.event_type].add(event.application_id)

    funnel: list[FunnelStage] = []
    # 分母取上一个「有人到过」的阶段：很多公司会跳过三面直接 HR，
    # 拿 0 当分母的话后面所有转化率都会变成 0%，看不出漏在哪一环。
    previous: int | None = None
    for status in FUNNEL_ORDER:
        count = len(reached.get(STATUS_TO_EVENT[status], set()))
        if previous is None:
            rate = 1.0 if count else 0.0
        else:
            rate = round(count / previous, 4)
        funnel.append(
            FunnelStage(stage=status.value, label=status.value, count=count, rate=rate)
        )
        if count:
            previous = count

    # ---- 从投出去到第一次有回音，平均要几天 ----
    gaps: list[float] = []
    for app in apps:
        bucket = events_by_app.get(app.id, [])
        if len(bucket) < 2:
            continue
        delta = (bucket[1].happened_at - bucket[0].happened_at).total_seconds() / 86400
        if delta >= 0:
            gaps.append(delta)
    avg_days = round(sum(gaps) / len(gaps), 1) if gaps else None

    status_counter = Counter(app.status.value for app in apps)
    status_counts = [
        NamedCount(key=status.value, count=status_counter.get(status.value, 0))
        for status in AppStatus
    ]

    # ---- 最近 12 周的投递量 ----
    today = date.today()
    monday = today - timedelta(days=today.weekday())
    weeks = [monday - timedelta(weeks=offset) for offset in range(11, -1, -1)]
    week_counter: Counter[date] = Counter()
    for app in apps:
        applied = app.applied_at
        week_counter[applied - timedelta(days=applied.weekday())] += 1
    weekly = [
        WeeklyPoint(week=week.isoformat(), count=week_counter.get(week, 0)) for week in weeks
    ]

    # ---- 各渠道转化 ----
    channel_totals: Counter[str] = Counter()
    channel_interviews: dict[str, set[int]] = defaultdict(set)
    channel_offers: Counter[str] = Counter()
    for app in apps:
        key = app.channel.value
        channel_totals[key] += 1
        bucket = events_by_app.get(app.id, [])
        if any(e.event_type in INTERVIEW_EVENTS for e in bucket):
            channel_interviews[key].add(app.id)
        if app.status == AppStatus.OFFER or any(
            e.event_type == EventType.OFFER for e in bucket
        ):
            channel_offers[key] += 1
    channel_stats = [
        ChannelStat(
            channel=key,
            total=total,
            reached_interview=len(channel_interviews.get(key, set())),
            offers=channel_offers.get(key, 0),
            conversion=round(len(channel_interviews.get(key, set())) / total, 4)
            if total
            else 0.0,
        )
        for key, total in sorted(channel_totals.items(), key=lambda kv: -kv[1])
    ]

    # ---- 题目 ----
    type_counter = Counter(q.question_type.value for q in questions)
    mastery_counter = Counter(str(q.mastery) for q in questions)
    tag_counter: Counter[str] = Counter()
    for question in questions:
        for tag in question.tags:
            tag_counter[tag.name] += 1

    # ---- 项目 ----
    tasks_by_project: dict[int, list[Task]] = defaultdict(list)
    for task in tasks:
        tasks_by_project[task.project_id].append(task)
    project_progress = []
    for project in projects:
        bucket = tasks_by_project.get(project.id, [])
        done = sum(1 for t in bucket if t.status == TaskStatus.DONE)
        project_progress.append(
            ProjectProgress(
                id=project.id,
                name=project.name,
                progress=round(done / len(bucket), 4) if bucket else 0.0,
                status=project.status.value,
                task_done=done,
                task_total=len(bucket),
            )
        )

    hours_this_week = sum(
        log.hours_spent or 0 for log in logs if log.log_date >= monday
    )

    return DashboardStats(
        total_applications=len(apps),
        active_applications=sum(1 for a in apps if a.status not in CLOSED_STATUSES),
        offer_count=status_counter.get(AppStatus.OFFER.value, 0),
        rejected_count=status_counter.get(AppStatus.REJECTED.value, 0),
        interview_count=sum(1 for e in events if e.event_type in INTERVIEW_EVENTS),
        avg_days_to_first_response=avg_days,
        funnel=funnel,
        status_counts=status_counts,
        weekly_applications=weekly,
        channel_stats=channel_stats,
        total_questions=len(questions),
        need_review_count=sum(1 for q in questions if q.need_review),
        question_types=[
            NamedCount(key=key, count=count) for key, count in type_counter.most_common()
        ],
        mastery_distribution=[
            NamedCount(key=str(level), count=mastery_counter.get(str(level), 0))
            for level in range(1, 6)
        ],
        top_tags=[
            NamedCount(key=key, count=count) for key, count in tag_counter.most_common(12)
        ],
        project_progress=project_progress,
        logged_hours_this_week=round(float(hours_this_week), 2),
    )
