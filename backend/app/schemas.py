from typing import List, Optional
from pydantic import BaseModel, ConfigDict, EmailStr


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
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    email: EmailStr
    avatar_url: Optional[str] = None


class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    avatar_url: Optional[str] = None  # None = dokunma, "" = fotoğrafı kaldır


class UserUpdateOut(UserOut):
    # Kullanıcı adı değişirse token'daki "sub" eskir; yeni token'lar döner
    access_token: Optional[str] = None
    refresh_token: Optional[str] = None


class PasswordChange(BaseModel):
    current_password: str
    new_password: str

class QuestionCreate(BaseModel):
    text: str
    image_url: Optional[str] = None
    choices: List[str]
    correct_choice: int


class QuestionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    text: str
    image_url: Optional[str] = None
    choices: List[str]
    correct_choice: int


class RoomCreate(BaseModel):
    name: str
    is_private: bool = False


class RoomOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    code: Optional[str] = None
    host_id: Optional[int] = None
    is_private: bool
    participant_count: int = 0
    quizzes: List['QuizOut'] = []


class QuizCreate(BaseModel):
    title: str
    description: Optional[str] = None
    room_id: Optional[int] = None
    is_featured: bool = False
    is_retakeable: bool = False
    scoring_mode: str = "first_score"
    questions: List[QuestionCreate] = []


class QuizOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: Optional[str] = None
    room_id: Optional[int] = None
    is_featured: bool
    is_retakeable: bool = False
    scoring_mode: str = "first_score"
    questions: List[QuestionOut] = []


class ResultCreate(BaseModel):
    score: int
    answers: str # JSON string

class ResultOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    quiz_id: int
    score: int
    answers: Optional[str] = None
    created_at: Optional[str] = None # datetime string

# Resolve forward refs
RoomOut.model_rebuild()
QuizOut.model_rebuild()


class AnswerSubmit(BaseModel):
    question_id: int
    answer: int  # choice index
    time_spent: float  # seconds


class AnswerResponse(BaseModel):
    correct: bool
    score: int
    total_score: int
    correct_choice: int
