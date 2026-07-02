from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()



class UserRoom(Base):
    __tablename__ = "user_rooms"
    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    room_id = Column(Integer, ForeignKey("rooms.id"), primary_key=True)
    status = Column(String(20), default="pending") # pending, approved, rejected
    can_create_quiz = Column(Boolean, default=False)
    joined_at = Column(DateTime(timezone=True), server_default=func.now())

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(128), unique=True, index=True, nullable=False)
    email = Column(String(256), unique=True, index=True, nullable=False)
    hashed_password = Column(String(256), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    rooms = relationship("Room", secondary="user_rooms", back_populates="members")


class Quiz(Base):
    __tablename__ = "quizzes"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(256), nullable=False)
    description = Column(Text)
    author_id = Column(Integer, ForeignKey("users.id"))
    room_id = Column(Integer, ForeignKey("rooms.id"))  # <<< EKLENDİ
    is_featured = Column(Boolean, default=False)
    is_retakeable = Column(Boolean, default=False)  # Tekrar çözülebilir mi?
    scoring_mode = Column(String(20), default="first_score")  # "first_score" ya da "best_score"
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    room = relationship("Room", back_populates="quizzes")
    questions = relationship("Question", back_populates="quiz", cascade="all, delete")



class Question(Base):
    __tablename__ = "questions"
    id = Column(Integer, primary_key=True, index=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id", ondelete="CASCADE"))
    text = Column(Text, nullable=False)
    image_url = Column(String(512), nullable=True) # URL to uploaded image
    choices = Column(Text)  # JSON encoded list as string (simple)
    correct_choice = Column(Integer)  # index of correct choice
    quiz = relationship("Quiz", back_populates="questions")


class Room(Base):
    __tablename__ = "rooms"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(256), nullable=False)
    code = Column(String(10), unique=True, index=True) # Unique 6-char code
    host_id = Column(Integer, ForeignKey("users.id"))
    is_private = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    quizzes = relationship("Quiz", back_populates="room", cascade="all, delete")
    members = relationship("User", secondary="user_rooms", back_populates="rooms")


class Duel(Base):
    __tablename__ = "duels"
    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(Integer, ForeignKey("rooms.id"))
    quiz_id = Column(Integer, ForeignKey("quizzes.id"))
    started_at = Column(DateTime(timezone=True), server_default=func.now())


class Result(Base):
    __tablename__ = "results"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    quiz_id = Column(Integer, ForeignKey("quizzes.id"))
    score = Column(Integer, default=0)
    answers = Column(Text, nullable=True) # JSON encoded answers
    created_at = Column(DateTime(timezone=True), server_default=func.now())

