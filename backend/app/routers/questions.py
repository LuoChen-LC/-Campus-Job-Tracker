from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select

from app.db import get_session
from app.models import Question, Tag
from app.models.enums import QuestionType
from app.schemas.question import (
    MasteryUpdate,
    QuestionCreate,
    QuestionRead,
    QuestionUpdate,
    TagCreate,
    TagRead,
)

router = APIRouter(prefix="/api/questions", tags=["questions"])

PALETTE = ["blue", "green", "amber", "violet", "rose", "cyan", "orange", "slate"]


def _resolve_tags(session: Session, names: list[str]) -> list[Tag]:
    """标签按名字找，不存在就建，前端只用传字符串。"""
    tags: list[Tag] = []
    for raw in names:
        name = raw.strip()
        if not name:
            continue
        tag = session.exec(select(Tag).where(Tag.name == name)).first()
        if not tag:
            tag = Tag(name=name, color=PALETTE[len(name) % len(PALETTE)])
            session.add(tag)
            session.flush()
        tags.append(tag)
    return tags


def _get_or_404(session: Session, question_id: int) -> Question:
    question = session.get(Question, question_id)
    if not question:
        raise HTTPException(404, "题目不存在")
    return question


@router.get("", response_model=list[QuestionRead])
def list_questions(
    session: Session = Depends(get_session),
    q: Optional[str] = None,
    question_type: Optional[QuestionType] = None,
    tag: Optional[str] = None,
    company: Optional[str] = None,
    application_id: Optional[int] = None,
    need_review: Optional[bool] = None,
    mastery_lte: Optional[int] = None,
    limit: int = Query(default=500, le=2000),
    offset: int = 0,
):
    stmt = select(Question)
    if question_type:
        stmt = stmt.where(Question.question_type == question_type)
    if company:
        stmt = stmt.where(Question.source_company.like(f"%{company}%"))
    if application_id is not None:
        stmt = stmt.where(Question.application_id == application_id)
    if need_review is not None:
        stmt = stmt.where(Question.need_review == need_review)
    if mastery_lte is not None:
        stmt = stmt.where(Question.mastery <= mastery_lte)
    if q:
        like = f"%{q}%"
        stmt = stmt.where(
            (Question.title.like(like))
            | (Question.content.like(like))
            | (Question.my_answer.like(like))
            | (Question.reference_answer.like(like))
            | (Question.code_snippet.like(like))
        )
    stmt = stmt.order_by(Question.updated_at.desc(), Question.id.desc())
    stmt = stmt.offset(offset).limit(limit)

    results = session.exec(stmt).all()
    if tag:
        results = [item for item in results if any(t.name == tag for t in item.tags)]
    return [QuestionRead.model_validate(item) for item in results]


@router.post("", response_model=QuestionRead, status_code=201)
def create_question(payload: QuestionCreate, session: Session = Depends(get_session)):
    data = payload.model_dump(exclude={"tags"})
    question = Question(**data)
    question.tags = _resolve_tags(session, payload.tags)
    session.add(question)
    session.commit()
    session.refresh(question)
    return QuestionRead.model_validate(question)


@router.get("/{question_id}", response_model=QuestionRead)
def get_question(question_id: int, session: Session = Depends(get_session)):
    return QuestionRead.model_validate(_get_or_404(session, question_id))


@router.patch("/{question_id}", response_model=QuestionRead)
def update_question(
    question_id: int, payload: QuestionUpdate, session: Session = Depends(get_session)
):
    question = _get_or_404(session, question_id)
    fields = payload.model_dump(exclude_unset=True, exclude={"tags"})
    for key, value in fields.items():
        setattr(question, key, value)
    if payload.tags is not None:
        question.tags = _resolve_tags(session, payload.tags)
    question.updated_at = datetime.now()
    session.add(question)
    session.commit()
    session.refresh(question)
    return QuestionRead.model_validate(question)


@router.post("/{question_id}/mastery", response_model=QuestionRead)
def set_mastery(
    question_id: int, payload: MasteryUpdate, session: Session = Depends(get_session)
):
    """自评掌握度。默认 3 星及以下继续留在待复习清单里。"""
    question = _get_or_404(session, question_id)
    question.mastery = max(1, min(5, payload.mastery))
    question.need_review = (
        payload.need_review if payload.need_review is not None else question.mastery <= 3
    )
    question.updated_at = datetime.now()
    session.add(question)
    session.commit()
    session.refresh(question)
    return QuestionRead.model_validate(question)


@router.delete("/{question_id}", status_code=204)
def delete_question(question_id: int, session: Session = Depends(get_session)):
    question = _get_or_404(session, question_id)
    session.delete(question)
    session.commit()


tag_router = APIRouter(prefix="/api/tags", tags=["tags"])


@tag_router.get("", response_model=list[TagRead])
def list_tags(session: Session = Depends(get_session)):
    tags = session.exec(select(Tag).order_by(Tag.name)).all()
    return [TagRead.model_validate(t) for t in tags]


@tag_router.post("", response_model=TagRead, status_code=201)
def create_tag(payload: TagCreate, session: Session = Depends(get_session)):
    existing = session.exec(select(Tag).where(Tag.name == payload.name)).first()
    if existing:
        return TagRead.model_validate(existing)
    tag = Tag(**payload.model_dump())
    session.add(tag)
    session.commit()
    session.refresh(tag)
    return TagRead.model_validate(tag)


@tag_router.delete("/{tag_id}", status_code=204)
def delete_tag(tag_id: int, session: Session = Depends(get_session)):
    tag = session.get(Tag, tag_id)
    if not tag:
        raise HTTPException(404, "标签不存在")
    session.delete(tag)
    session.commit()
