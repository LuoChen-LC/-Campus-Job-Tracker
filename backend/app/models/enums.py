from enum import Enum


class JobType(str, Enum):
    INTERN = "intern"
    AUTUMN = "autumn"
    SPRING = "spring"
    SOCIAL = "social"


class Channel(str, Enum):
    OFFICIAL = "official"
    BOSS = "boss"
    REFERRAL = "referral"
    NOWCODER = "nowcoder"
    LIEPIN = "liepin"
    MAIMAI = "maimai"
    CAMPUS_TALK = "campus_talk"
    OTHER = "other"


class AppStatus(str, Enum):
    """看板列 = 投递的当前阶段"""

    WISHLIST = "wishlist"
    APPLIED = "applied"
    WRITTEN_TEST = "written_test"
    INTERVIEW_1 = "interview_1"
    INTERVIEW_2 = "interview_2"
    INTERVIEW_3 = "interview_3"
    HR = "hr"
    OFFER = "offer"
    POOL = "pool"
    REJECTED = "rejected"


#: 漏斗统计用的推进顺序（泡池子/已挂属于终态，不进漏斗）
FUNNEL_ORDER = [
    AppStatus.APPLIED,
    AppStatus.WRITTEN_TEST,
    AppStatus.INTERVIEW_1,
    AppStatus.INTERVIEW_2,
    AppStatus.INTERVIEW_3,
    AppStatus.HR,
    AppStatus.OFFER,
]


class EventType(str, Enum):
    APPLY = "apply"
    WRITTEN_TEST = "written_test"
    INTERVIEW_1 = "interview_1"
    INTERVIEW_2 = "interview_2"
    INTERVIEW_3 = "interview_3"
    HR = "hr"
    OFFER = "offer"
    REJECT = "reject"
    POOL = "pool"
    OTHER = "other"


class EventResult(str, Enum):
    PENDING = "pending"
    PASSED = "passed"
    FAILED = "failed"
    NA = "na"


class QuestionType(str, Enum):
    ALGORITHM = "algorithm"
    FUNDAMENTALS = "fundamentals"
    PROJECT = "project"
    SYSTEM_DESIGN = "system_design"
    SQL = "sql"
    HR = "hr"
    PUZZLE = "puzzle"
    OTHER = "other"


class ProjectStatus(str, Enum):
    PLANNING = "planning"
    ACTIVE = "active"
    PAUSED = "paused"
    DONE = "done"
    ARCHIVED = "archived"


class TaskStatus(str, Enum):
    TODO = "todo"
    DOING = "doing"
    DONE = "done"


class Priority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


#: 看板拖动到某列时自动补记的事件类型
STATUS_TO_EVENT = {
    AppStatus.APPLIED: EventType.APPLY,
    AppStatus.WRITTEN_TEST: EventType.WRITTEN_TEST,
    AppStatus.INTERVIEW_1: EventType.INTERVIEW_1,
    AppStatus.INTERVIEW_2: EventType.INTERVIEW_2,
    AppStatus.INTERVIEW_3: EventType.INTERVIEW_3,
    AppStatus.HR: EventType.HR,
    AppStatus.OFFER: EventType.OFFER,
    AppStatus.REJECTED: EventType.REJECT,
    AppStatus.POOL: EventType.POOL,
}
