"""塞一批示例数据进去，方便第一次打开就能看到图表长什么样。

    python seed.py          # 已有数据则跳过
    python seed.py --reset  # 清空后重建
    python seed.py --clear  # 只清空，不写示例数据（准备开始记真实数据时用）
"""

import sys
from datetime import date, datetime, timedelta

from sqlmodel import Session, delete, select

from app.db import engine, init_db
from app.models import (
    Application,
    ApplicationEvent,
    DevLog,
    Milestone,
    Project,
    Question,
    QuestionTagLink,
    Tag,
    Task,
)
from app.models.enums import (
    AppStatus,
    Channel,
    EventResult,
    EventType,
    JobType,
    Priority,
    ProjectStatus,
    QuestionType,
    TaskStatus,
)

TODAY = date.today()


def reset(session: Session) -> None:
    for model in (
        QuestionTagLink,
        Question,
        Tag,
        ApplicationEvent,
        Application,
        DevLog,
        Task,
        Milestone,
        Project,
    ):
        session.exec(delete(model))
    session.commit()


def days_ago(n: int) -> datetime:
    return datetime.combine(TODAY - timedelta(days=n), datetime.min.time()) + timedelta(hours=14)


def seed_applications(session: Session) -> dict[str, Application]:
    specs = [
        # (公司, 岗位, 渠道, 城市, 几天前投的, 当前状态, 时间线)
        ("字节跳动", "后端开发实习生", Channel.REFERRAL, "北京", 46, AppStatus.OFFER,
         [(EventType.APPLY, 46, EventResult.PASSED),
          (EventType.WRITTEN_TEST, 41, EventResult.PASSED),
          (EventType.INTERVIEW_1, 35, EventResult.PASSED),
          (EventType.INTERVIEW_2, 29, EventResult.PASSED),
          (EventType.HR, 24, EventResult.PASSED),
          (EventType.OFFER, 20, EventResult.PASSED)]),
        ("腾讯", "后台开发（秋招）", Channel.OFFICIAL, "深圳", 38, AppStatus.INTERVIEW_2,
         [(EventType.APPLY, 38, EventResult.PASSED),
          (EventType.WRITTEN_TEST, 31, EventResult.PASSED),
          (EventType.INTERVIEW_1, 22, EventResult.PASSED),
          (EventType.INTERVIEW_2, 5, EventResult.PENDING)]),
        ("阿里巴巴", "Java 开发工程师", Channel.REFERRAL, "杭州", 33, AppStatus.REJECTED,
         [(EventType.APPLY, 33, EventResult.PASSED),
          (EventType.WRITTEN_TEST, 27, EventResult.PASSED),
          (EventType.INTERVIEW_1, 18, EventResult.FAILED),
          (EventType.REJECT, 14, EventResult.FAILED)]),
        ("美团", "后端开发工程师", Channel.NOWCODER, "北京", 26, AppStatus.INTERVIEW_1,
         [(EventType.APPLY, 26, EventResult.PASSED),
          (EventType.WRITTEN_TEST, 19, EventResult.PASSED),
          (EventType.INTERVIEW_1, 3, EventResult.PENDING)]),
        ("快手", "服务端研发实习", Channel.BOSS, "北京", 21, AppStatus.WRITTEN_TEST,
         [(EventType.APPLY, 21, EventResult.PASSED),
          (EventType.WRITTEN_TEST, 4, EventResult.PENDING)]),
        ("小红书", "后端工程师", Channel.REFERRAL, "上海", 17, AppStatus.POOL,
         [(EventType.APPLY, 17, EventResult.PASSED),
          (EventType.WRITTEN_TEST, 12, EventResult.PASSED),
          (EventType.INTERVIEW_1, 8, EventResult.PASSED),
          (EventType.POOL, 2, EventResult.PENDING)]),
        ("网易", "游戏服务器开发", Channel.OFFICIAL, "杭州", 12, AppStatus.APPLIED,
         [(EventType.APPLY, 12, EventResult.PENDING)]),
        ("拼多多", "后端开发（秋招）", Channel.OFFICIAL, "上海", 9, AppStatus.APPLIED,
         [(EventType.APPLY, 9, EventResult.PENDING)]),
        ("滴滴", "基础平台研发", Channel.MAIMAI, "北京", 6, AppStatus.APPLIED,
         [(EventType.APPLY, 6, EventResult.PENDING)]),
        ("Shopee", "Backend Engineer", Channel.LIEPIN, "新加坡", 3, AppStatus.WISHLIST, []),
        ("百度", "搜索架构部后端", Channel.REFERRAL, "北京", 2, AppStatus.APPLIED,
         [(EventType.APPLY, 2, EventResult.PENDING)]),
        ("华为", "云计算开发", Channel.CAMPUS_TALK, "深圳", 1, AppStatus.WISHLIST, []),
    ]

    created: dict[str, Application] = {}
    for order, (company, position, channel, city, ago, status, timeline) in enumerate(specs):
        app = Application(
            company=company,
            position=position,
            job_type=JobType.AUTUMN if "秋招" in position else JobType.INTERN,
            channel=channel,
            city=city,
            applied_at=TODAY - timedelta(days=ago),
            status=status,
            sort_order=order,
            jd_url=None,
            notes=None,
        )
        session.add(app)
        session.flush()
        for event_type, event_ago, result in timeline:
            session.add(
                ApplicationEvent(
                    application_id=app.id,
                    event_type=event_type,
                    result=result,
                    happened_at=days_ago(event_ago),
                    duration_minutes=60 if "interview" in event_type.value else None,
                )
            )
        created[company] = app
    session.commit()
    return created


def seed_questions(session: Session, apps: dict[str, Application]) -> None:
    specs = [
        ("HashMap 为什么用红黑树而不是 AVL？", QuestionType.FUNDAMENTALS, "字节跳动", 4, 4,
         ["Java", "集合", "数据结构"],
         "面试官从 HashMap 扩容一路问到 treeify 阈值 8 的由来。",
         "红黑树插入删除旋转次数少，AVL 查询稍快但维护成本高；HashMap 里写多读多，权衡后选红黑树。"),
        ("LRU 缓存（LeetCode 146）", QuestionType.ALGORITHM, "字节跳动", 3, 5,
         ["算法", "链表", "哈希表"],
         "手撕，要求 get/put 都是 O(1)。",
         "哈希表 + 双向链表，头部是最新访问，尾部淘汰。"),
        ("MySQL 索引失效有哪些场景？", QuestionType.FUNDAMENTALS, "腾讯", 3, 3,
         ["MySQL", "索引"],
         "追问了最左前缀和隐式类型转换。",
         "违反最左前缀、对索引列做运算或函数、隐式类型转换、前导模糊匹配、OR 连接非索引列。"),
        ("说说你项目里为什么用 Redis 而不是本地缓存", QuestionType.PROJECT, "腾讯", 3, 3,
         ["Redis", "项目追问"],
         "问完还追问了缓存一致性怎么保证。",
         "多实例部署需要共享缓存；一致性用延迟双删 + 过期兜底。"),
        ("设计一个短链服务", QuestionType.SYSTEM_DESIGN, "阿里巴巴", 4, 2,
         ["系统设计", "分布式"],
         "从发号器聊到存储选型和缓存穿透，答得比较散。",
         "发号器（雪花/号段）→ Base62 编码 → KV 存储 → 布隆过滤器挡穿透 → CDN/301 跳转。"),
        ("进程和线程的区别，协程呢？", QuestionType.FUNDAMENTALS, "美团", 2, 5,
         ["操作系统"],
         "开场热身题。",
         "进程是资源分配单位，线程是调度单位；协程用户态调度，切换不进内核。"),
        ("给定二叉树，求最大路径和", QuestionType.ALGORITHM, "美团", 4, 3,
         ["算法", "二叉树", "DFS"],
         "一面手撕，卡在负值剪枝上。",
         "后序遍历，每个节点返回单边最大贡献，全局维护左+右+根。"),
        ("查出每个部门薪资第二高的员工", QuestionType.SQL, "快手", 3, 2,
         ["SQL", "窗口函数"],
         "笔试第三题。",
         "DENSE_RANK() OVER (PARTITION BY dept ORDER BY salary DESC) 取 rank = 2。"),
        ("TCP 三次握手能改成两次吗？", QuestionType.FUNDAMENTALS, "小红书", 3, 4,
         ["计网", "TCP"],
         None,
         "不能。两次无法确认客户端的接收能力，且历史重复连接请求会导致服务端错误建连。"),
        ("Kafka 怎么保证消息不丢？", QuestionType.FUNDAMENTALS, "小红书", 4, 2,
         ["Kafka", "消息队列"],
         "答得不完整，漏了 min.insync.replicas。",
         "生产端 acks=all + 重试；Broker 端副本数 ≥ 3 且 min.insync.replicas ≥ 2；消费端手动提交位点。"),
        ("你觉得自己最大的缺点是什么？", QuestionType.HR, "字节跳动", 1, 4,
         ["HR面"],
         None,
         "挑一个真实但不影响岗位胜任力的点，并说明正在怎么改进。"),
        ("JVM 什么时候会发生 Full GC？", QuestionType.FUNDAMENTALS, "腾讯", 4, 2,
         ["JVM", "GC"],
         "二面被连着追问了 CMS 和 G1 的区别。",
         "老年代空间不足、方法区不足、System.gc()、晋升失败、CMS 并发模式失败。"),
    ]

    for title, qtype, company, difficulty, mastery, tags, content, answer in specs:
        app = apps.get(company)
        question = Question(
            title=title,
            question_type=qtype,
            content=content,
            reference_answer=answer,
            difficulty=difficulty,
            mastery=mastery,
            need_review=mastery <= 3,
            source_company=company,
            application_id=app.id if app else None,
            asked_at=TODAY - timedelta(days=difficulty * 4),
        )
        resolved = []
        for name in tags:
            tag = session.exec(select(Tag).where(Tag.name == name)).first()
            if not tag:
                tag = Tag(name=name)
                session.add(tag)
                session.flush()
            resolved.append(tag)
        question.tags = resolved
        session.add(question)
    session.commit()


def seed_projects(session: Session) -> None:
    tracker = Project(
        name="秋招追踪台",
        summary="自己用的投递 / 题库 / 项目进度管理系统",
        tech_stack="React, TypeScript, Tailwind, FastAPI, SQLite",
        repo_url="https://github.com/yourname/campus-tracker",
        status=ProjectStatus.ACTIVE,
        started_at=TODAY - timedelta(days=20),
        target_at=TODAY + timedelta(days=25),
        sort_order=0,
    )
    blog = Project(
        name="个人技术博客",
        summary="基于 Astro 的静态博客，同步沉淀八股与项目复盘",
        tech_stack="Astro, MDX, Vercel",
        repo_url="https://github.com/yourname/blog",
        status=ProjectStatus.PAUSED,
        started_at=TODAY - timedelta(days=90),
        sort_order=1,
    )
    session.add_all([tracker, blog])
    session.commit()
    session.refresh(tracker)
    session.refresh(blog)

    m1 = Milestone(project_id=tracker.id, title="数据模型与接口打通", due_date=TODAY - timedelta(days=8), sort_order=0)
    m2 = Milestone(project_id=tracker.id, title="三大页面可用", due_date=TODAY + timedelta(days=6), sort_order=1)
    m3 = Milestone(project_id=tracker.id, title="部署上线 + 数据备份", due_date=TODAY + timedelta(days=24), sort_order=2)
    session.add_all([m1, m2, m3])
    session.commit()
    for m in (m1, m2, m3):
        session.refresh(m)

    tasks = [
        (m1.id, "设计投递 / 事件流表结构", TaskStatus.DONE, Priority.HIGH),
        (m1.id, "题目与标签多对多", TaskStatus.DONE, Priority.HIGH),
        (m1.id, "项目 / 里程碑 / 任务 / 日志接口", TaskStatus.DONE, Priority.MEDIUM),
        (m2.id, "投递看板拖拽", TaskStatus.DONE, Priority.HIGH),
        (m2.id, "题库筛选与掌握度自评", TaskStatus.DOING, Priority.HIGH),
        (m2.id, "项目详情页三视图", TaskStatus.DOING, Priority.MEDIUM),
        (m2.id, "Dashboard 漏斗图", TaskStatus.TODO, Priority.MEDIUM),
        (m3.id, "Docker 化", TaskStatus.TODO, Priority.LOW),
        (m3.id, "SQLite 定时备份脚本", TaskStatus.TODO, Priority.LOW),
    ]
    for order, (milestone_id, title, status, priority) in enumerate(tasks):
        session.add(
            Task(
                project_id=tracker.id,
                milestone_id=milestone_id,
                title=title,
                status=status,
                priority=priority,
                sort_order=order,
                done_at=datetime.now() if status == TaskStatus.DONE else None,
            )
        )

    session.add_all([
        Task(project_id=blog.id, title="迁移到 Astro 5", status=TaskStatus.TODO, priority=Priority.MEDIUM, sort_order=0),
        Task(project_id=blog.id, title="补三篇 JVM 复盘", status=TaskStatus.TODO, priority=Priority.LOW, sort_order=1),
    ])

    logs = [
        (1, "把看板拖拽接上后端 move 接口，顺手让拖动自动补一条时间线事件。", None, 3.5),
        (2, "题库筛选写完了，标签用逗号输入自动建，省去单独管理标签的页面。", "Markdown 渲染还没接", 4.0),
        (4, "重构进度计算：不再存 progress 字段，改成按任务完成比现算。", "之前两边数据对不上", 2.0),
        (6, "画完投递漏斗，发现笔试到一面掉得最狠，得多刷题。", None, 2.5),
        (9, "搭好 FastAPI 骨架，SQLModel 一份定义同时当 ORM 和 schema。", None, 5.0),
    ]
    for ago, content, blockers, hours in logs:
        session.add(
            DevLog(
                project_id=tracker.id,
                log_date=TODAY - timedelta(days=ago),
                content=content,
                blockers=blockers,
                hours_spent=hours,
            )
        )
    session.commit()

    # 走一遍和接口里一样的规则：任务全 done 的里程碑自动打勾
    for milestone in (m1, m2, m3):
        related = session.exec(
            select(Task).where(Task.milestone_id == milestone.id)
        ).all()
        if related and all(t.status == TaskStatus.DONE for t in related):
            milestone.done = True
            milestone.done_at = datetime.now()
            session.add(milestone)
    session.commit()


def main() -> None:
    init_db()
    with Session(engine) as session:
        if "--clear" in sys.argv:
            reset(session)
            print("已清空所有数据，表结构保留。")
            return
        if "--reset" in sys.argv:
            reset(session)
        elif session.exec(select(Application)).first():
            print("数据库里已经有数据了，跳过。要重来请加 --reset")
            return
        apps = seed_applications(session)
        seed_questions(session, apps)
        seed_projects(session)
    print("示例数据写入完成。")


if __name__ == "__main__":
    main()
