from datetime import date, datetime
from typing import Optional

from sqlmodel import Field, Relationship, SQLModel

from app.models.enums import QuestionType


class QuestionTagLink(SQLModel, table=True):
    __tablename__ = "question_tag_link"

    question_id: Optional[int] = Field(
        default=None, foreign_key="question.id", primary_key=True, ondelete="CASCADE"
    )
    tag_id: Optional[int] = Field(
        default=None, foreign_key="tag.id", primary_key=True, ondelete="CASCADE"
    )


class Tag(SQLModel, table=True):
    __tablename__ = "tag"

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True, unique=True)
    color: str = Field(default="slate")
    created_at: datetime = Field(default_factory=datetime.now)

    questions: list["Question"] = Relationship(
        back_populates="tags", link_model=QuestionTagLink
    )


class Question(SQLModel, table=True):
    """一道笔试/面试题。可以挂到具体某次投递的某一轮上。"""

    __tablename__ = "question"

    id: Optional[int] = Field(default=None, primary_key=True)
    title: str = Field(index=True)
    question_type: QuestionType = Field(default=QuestionType.FUNDAMENTALS, index=True)
    content: Optional[str] = None
    my_answer: Optional[str] = None
    reference_answer: Optional[str] = None
    code_snippet: Optional[str] = None
    code_language: Optional[str] = Field(default="python")

    difficulty: int = Field(default=3)  # 1-5 题目本身有多难
    mastery: int = Field(default=1, index=True)  # 1-5 我掌握到什么程度
    need_review: bool = Field(default=True, index=True)

    source_company: Optional[str] = Field(default=None, index=True)
    application_id: Optional[int] = Field(
        default=None, foreign_key="application.id", index=True, ondelete="SET NULL"
    )
    event_id: Optional[int] = Field(
        default=None, foreign_key="application_event.id", index=True, ondelete="SET NULL"
    )
    asked_at: Optional[date] = None

    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

    tags: list[Tag] = Relationship(back_populates="questions", link_model=QuestionTagLink)
