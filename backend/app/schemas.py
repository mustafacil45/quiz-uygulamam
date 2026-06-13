from typing import List, Optional
from pydantic import BaseModel, EmailStr


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    username: Optional[str] = None


class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    username: str
    email: EmailStr

    class Config:
        orm_mode = True

class QuestionCreate(BaseModel):
    text: str
    image_url: Optional[str] = None
    choices: List[str]
    correct_choice: int


class QuestionOut(BaseModel):
    id: int
    text: str
    image_url: Optional[str] = None
    choices: List[str]
    correct_choice: int

    class Config:
        orm_mode = True


class RoomCreate(BaseModel):
    name: str
    is_private: bool = False


class RoomOut(BaseModel):
    id: int
    name: str
    host_id: Optional[int]
    is_private: bool
    participant_count: int = 0
    quizzes: List['QuizOut'] = []

    class Config:
        orm_mode = True


class QuizCreate(BaseModel):
    title: str
    description: Optional[str]
    room_id: Optional[int] = None
    is_featured: bool = False
    questions: List[QuestionCreate] = []


class QuizOut(BaseModel):
    id: int
    title: str
    description: Optional[str]
    room_id: Optional[int]
    is_featured: bool
    questions: List[QuestionOut] = []

    class Config:
        orm_mode = True


# duplicate QuizOut removed (detailed QuizOut above)


class ResultCreate(BaseModel):
    score: int
    answers: str # JSON string

class ResultOut(BaseModel):
    id: int
    user_id: int
    quiz_id: int
    score: int
    answers: Optional[str]
    created_at: Optional[str] # datetime string

    class Config:
        orm_mode = True

# Resolve forward refs
RoomOut.update_forward_refs()
QuizOut.update_forward_refs()


class AnswerSubmit(BaseModel):
    question_id: int
    answer: int  # choice index
    time_spent: float  # seconds


class AnswerResponse(BaseModel):
    correct: bool
    score: int
    total_score: int
    correct_choice: int
