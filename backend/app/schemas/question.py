from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel

from app.models.enums import QuestionType


class TagRead(BaseModel):
    id: int
    name: str
    color: str

    model_config = {"from_attributes": True}


class TagCreate(BaseModel):
    name: str
    color: str = "slate"


class QuestionCreate(BaseModel):
    title: str
    question_type: QuestionType = QuestionType.FUNDAMENTALS
    content: Optional[str] = None
    my_answer: Optional[str] = None
    reference_answer: Optional[str] = None
    code_snippet: Optional[str] = None
    code_language: Optional[str] = "python"
    difficulty: int = 3
    mastery: int = 1
    need_review: bool = True
    source_company: Optional[str] = None
    application_id: Optional[int] = None
    event_id: Optional[int] = None
    asked_at: Optional[date] = None
    tags: list[str] = []


class QuestionUpdate(BaseModel):
    title: Optional[str] = None
    question_type: Optional[QuestionType] = None
    content: Optional[str] = None
    my_answer: Optional[str] = None
    reference_answer: Optional[str] = None
    code_snippet: Optional[str] = None
    code_language: Optional[str] = None
    difficulty: Optional[int] = None
    mastery: Optional[int] = None
    need_review: Optional[bool] = None
    source_company: Optional[str] = None
    application_id: Optional[int] = None
    event_id: Optional[int] = None
    asked_at: Optional[date] = None
    tags: Optional[list[str]] = None


class QuestionRead(BaseModel):
    id: int
    title: str
    question_type: QuestionType
    content: Optional[str]
    my_answer: Optional[str]
    reference_answer: Optional[str]
    code_snippet: Optional[str]
    code_language: Optional[str]
    difficulty: int
    mastery: int
    need_review: bool
    source_company: Optional[str]
    application_id: Optional[int]
    event_id: Optional[int]
    asked_at: Optional[date]
    created_at: datetime
    updated_at: datetime
    tags: list[TagRead] = []

    model_config = {"from_attributes": True}


class MasteryUpdate(BaseModel):
    mastery: int
    #: 不传则按 mastery 自动判断（<=3 继续标记需复习）
    need_review: Optional[bool] = None
