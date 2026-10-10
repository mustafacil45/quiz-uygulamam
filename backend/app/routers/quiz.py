from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app import schemas, models
from sqlalchemy import insert, select, delete, func
import json
from app.core.security import get_current_user
from typing import Dict, Any

router = APIRouter()




@router.post("/", response_model=schemas.QuizOut)
async def create_quiz(payload: schemas.QuizCreate, db: AsyncSession = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    try:
        print('[DEBUG] POST /api/quiz/ payload:', payload.model_dump())
    except Exception:
        print('[DEBUG] POST /api/quiz/ payload: <unserializable>')
    # basic validation
    if not payload.title or payload.title.strip() == '':
        print('WARNING: create_quiz: missing title')
        raise HTTPException(status_code=422, detail='title is required')
    if not payload.questions or len(payload.questions) == 0:
        print('WARNING: create_quiz: missing questions')
        raise HTTPException(status_code=422, detail='questions are required')
    if not payload.questions or len(payload.questions) == 0:
        print('WARNING: create_quiz: missing questions')
        raise HTTPException(status_code=422, detail='questions are required')

    if payload.room_id:
        # Check permissions
        # 1. Is Host?
        res = await db.execute(select(models.Room).where(models.Room.id == payload.room_id))
        room = res.scalar_one_or_none()
        if not room:
             raise HTTPException(status_code=404, detail='Room not found')
             
        can_create = False
        if room.host_id == current_user.id:
            can_create = True
        else:
            # 2. Has permission?
            res_ur = await db.execute(select(models.UserRoom).where((models.UserRoom.room_id == payload.room_id) & (models.UserRoom.user_id == current_user.id)))
            ur = res_ur.scalar_one_or_none()
            if ur and ur.can_create_quiz:
                can_create = True
                
        if not can_create:
            raise HTTPException(status_code=403, detail='You do not have permission to create quizzes in this room')
    quiz = models.Quiz(
        title=payload.title, 
        description=payload.description, 
        author_id=current_user.id, 
        room_id=payload.room_id,
        is_featured=payload.is_featured,
        is_retakeable=payload.is_retakeable,
        scoring_mode=payload.scoring_mode
    )
    db.add(quiz)
    await db.flush()
    # add questions
    for q in payload.questions or []:
        question = models.Question(quiz_id=quiz.id, text=q.text, choices=json.dumps(q.choices), correct_choice=q.correct_choice, image_url=q.image_url)
        db.add(question)
    try:
        await db.commit()
    except Exception as e:
        print('ERROR: DB commit failed when creating quiz', e)
        await db.rollback()
        raise HTTPException(status_code=500, detail='DB commit failed')
    await db.refresh(quiz)
    # explicitly load questions via a query (avoid lazy-loading in async context)
    res = await db.execute(select(models.Question).where(models.Question.quiz_id == quiz.id))
    questions = res.scalars().all()
    import json as _json
    out = {
        "id": quiz.id,
        "title": quiz.title,
        "description": quiz.description,
        "room_id": quiz.room_id,
        "is_featured": quiz.is_featured,
        "is_retakeable": quiz.is_retakeable,
        "scoring_mode": quiz.scoring_mode,
        "questions": [
            {"id": q.id, "text": q.text, "choices": _json.loads(q.choices), "correct_choice": q.correct_choice, "image_url": q.image_url}
            for q in questions
        ],
    }
    return out


@router.get("/results")
async def get_all_results(db: AsyncSession = Depends(get_db)):
    # Simple endpoint to get all results with user and quiz info
    # Joining Result -> User and Result -> Quiz
    # Note: This might be heavy for large datasets but fine for this scale.
    stmt = select(models.Result, models.User, models.Quiz).join(models.User, models.Result.user_id == models.User.id).join(models.Quiz, models.Result.quiz_id == models.Quiz.id).order_by(models.Result.created_at.desc())
    res = await db.execute(stmt)
    rows = res.all()
    
    out = []
    for result, user, quiz in rows:
        out.append({
            "id": result.id,
            "user_id": user.id,
            "username": user.username,
            "quiz_id": quiz.id,
            "quiz_title": quiz.title,
            "score": result.score,
            "created_at": result.created_at.isoformat() if result.created_at else None,
            "answers": result.answers
        })
    return out


@router.get("/", response_model=list[schemas.QuizOut])
async def list_quizzes(
    skip: int = 0, 
    limit: int = 20, 
    featured: bool = False, 
    scope: str = None, # 'global' or None
    room_id: int = None,
    db: AsyncSession = Depends(get_db)
):
    query = select(models.Quiz)
    
    if featured:
        query = query.where(models.Quiz.is_featured == True)
        
    if scope == 'global':
        query = query.where(models.Quiz.room_id == None)
    elif room_id is not None:
        query = query.where(models.Quiz.room_id == room_id)
    
    query = query.offset(skip).limit(limit)
    res = await db.execute(query)
    rows = res.scalars().all()
    import json as _json
    out = []
    for quiz in rows:
        qres = await db.execute(select(models.Question).where(models.Question.quiz_id == quiz.id))
        qrows = qres.scalars().all()
        out.append({
            "id": quiz.id,
            "title": quiz.title,
            "description": quiz.description,
            "room_id": quiz.room_id,
            "is_featured": quiz.is_featured,
            "is_retakeable": quiz.is_retakeable,
            "scoring_mode": quiz.scoring_mode,
            "questions": [{"id": q.id, "text": q.text, "choices": _json.loads(q.choices), "correct_choice": q.correct_choice, "image_url": q.image_url} for q in qrows],
        })
    return out


@router.get("/{quiz_id}", response_model=schemas.QuizOut)
async def get_quiz(quiz_id: int, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(models.Quiz).where(models.Quiz.id == quiz_id))
    q = res.scalar_one_or_none()
    if not q:
        raise HTTPException(status_code=404, detail="Quiz not found")
    import json as _json
    qres = await db.execute(select(models.Question).where(models.Question.quiz_id == q.id))
    qrows = qres.scalars().all()
    return {
        "id": q.id, 
        "title": q.title, 
        "description": q.description, 
        "room_id": q.room_id, 
        "is_featured": q.is_featured,
        "is_retakeable": q.is_retakeable,
        "scoring_mode": q.scoring_mode,
        "questions": [{"id": qq.id, "text": qq.text, "choices": _json.loads(qq.choices), "correct_choice": qq.correct_choice, "image_url": qq.image_url} for qq in qrows]
    }


@router.post("/{quiz_id}/solve", deprecated=True)
async def solve_quiz_deprecated(quiz_id: int, answers: dict, db: AsyncSession = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # ... legacy implementation wraps around ...
    return {"quiz_id": quiz_id, "score": 0, "total": 0}

@router.post("/{quiz_id}/submit-answer", response_model=schemas.AnswerResponse)
async def submit_answer_step(quiz_id: int, payload: schemas.AnswerSubmit, db: AsyncSession = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    import json
    
    # 1. Get Question
    res = await db.execute(select(models.Question).where(models.Question.id == payload.question_id))
    question = res.scalar_one_or_none()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    user_answer = int(payload.answer)
    correct_answer = int(question.correct_choice)
    print(f'[SUBMIT-ANSWER] quiz={quiz_id} question={payload.question_id} user_answer={user_answer} correct_answer={correct_answer} match={user_answer == correct_answer}')
        
    # 2. Get or Create Result for (user, quiz)
    res_res = await db.execute(select(models.Result).where((models.Result.user_id == current_user.id) & (models.Result.quiz_id == quiz_id)))
    result = res_res.scalar_one_or_none()
    if not result:
        result = models.Result(user_id=current_user.id, quiz_id=quiz_id, score=0, answers="{}")
        db.add(result)
        await db.flush()

    # Load quiz to check retake/scoring policy and questions count
    qres = await db.execute(select(models.Quiz).where(models.Quiz.id == quiz_id))
    quiz = qres.scalar_one_or_none()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    # Load existing answers (represents last saved attempt or stored best/first depending on policy)
    existing_answers = json.loads(result.answers) if result.answers else {}
    # Avoid lazy-loading `quiz.questions` in async context; get question count directly from DB
    qcount_res = await db.execute(select(func.count()).select_from(models.Question).where(models.Question.quiz_id == quiz_id))
    q_count = int(qcount_res.scalar_one() or 0)
    existing_completed = len(existing_answers) >= q_count if q_count > 0 else False
    previous_score = int(result.score or 0)

    # If quiz is NOT retakeable and user already has any answers (i.e. attempted), block updates
    # Allow the quiz author to retake/modify their own quiz regardless of the flag
    is_author = getattr(quiz, 'author_id', None) == current_user.id
    if not quiz.is_retakeable and existing_answers and not is_author:
        raise HTTPException(status_code=403, detail='This quiz is not retakeable')

    # 3. Calculate this step's score
    is_correct = (user_answer == correct_answer)
    step_score = 0
    if is_correct:
        time_limit = 20.0
        spent = min(payload.time_spent, time_limit)
        remaining = time_limit - spent
        step_score = int(80 + (remaining / time_limit) * 20)

    # Prepare tentative answers map for this in-progress attempt
    tentative_answers = dict(existing_answers) if quiz.is_retakeable else {}
    tentative_answers[str(payload.question_id)] = {
        "correct": bool(is_correct),
        "score": step_score,
        "time_spent": payload.time_spent,
        "choice": user_answer
    }

    tentative_total = sum(a["score"] for a in tentative_answers.values())

    # Determine if this attempt would complete the quiz
    tentative_completed = len(tentative_answers) >= q_count and q_count > 0

    # Apply scoring policy
    if quiz.is_retakeable:
        if quiz.scoring_mode == 'first_score':
            # If user has previously completed, keep that first score and do not overwrite
            if existing_completed:
                # Return previous stored values without changing DB
                return {
                    "correct": bool(is_correct),
                    "score": step_score,
                    "total_score": previous_score,
                    "correct_choice": correct_answer
                }
            # Otherwise accept tentative answers (first completion will be stored)
            # update result to tentative
            result.answers = json.dumps(tentative_answers)
            result.score = tentative_total

        elif quiz.scoring_mode == 'best_score':
            # If user has a prior completed score, only overwrite if tentative_total is higher
            if existing_completed and previous_score >= tentative_total and not tentative_completed:
                # No improvement and not completing a better attempt: do nothing
                return {
                    "correct": bool(is_correct),
                    "score": step_score,
                    "total_score": previous_score,
                    "correct_choice": correct_answer
                }
            # If tentative attempt completes and is better than previous, store it
            if tentative_completed:
                if tentative_total > previous_score:
                    result.answers = json.dumps(tentative_answers)
                    result.score = tentative_total
                else:
                    # keep previous best answers/score
                    pass
            else:
                # still in-progress attempt: update stored in-progress answers (do not affect best if exists)
                # Use tentative_answers to allow user to continue attempt
                result.answers = json.dumps(tentative_answers)
                # Do not overwrite score yet unless it improves the best
                if tentative_total > previous_score:
                    result.score = tentative_total

        else:
            # default: behave like first_score
            if not existing_completed:
                result.answers = json.dumps(tentative_answers)
                result.score = tentative_total
    else:
        # Not retakeable and no existing answers (we'd have returned earlier if answers existed)
        # Accept the submission (first and only attempt)
        result.answers = json.dumps(tentative_answers)
        result.score = tentative_total

    await db.commit()

    # Determine total to return (if we kept previous best, use previous_score)
    total_to_return = int(result.score or 0)

    return {
        "correct": bool(is_correct),
        "score": step_score,
        "total_score": total_to_return,
        "correct_choice": correct_answer
    }


@router.delete("/{quiz_id}", status_code=204)
async def delete_quiz(quiz_id: int, db: AsyncSession = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    res = await db.execute(select(models.Quiz).where(models.Quiz.id == quiz_id))
    quiz = res.scalar_one_or_none()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    can_delete = False
    from app.core.security import is_admin_user
    if is_admin_user(current_user):
        can_delete = True
    elif getattr(quiz, 'author_id', None) == current_user.id:
        can_delete = True
    elif quiz.room_id:
        res_room = await db.execute(select(models.Room).where(models.Room.id == quiz.room_id))
        room = res_room.scalar_one_or_none()
        if room and room.host_id == current_user.id:
            can_delete = True
        else:
            res_ur = await db.execute(select(models.UserRoom).where((models.UserRoom.room_id == quiz.room_id) & (models.UserRoom.user_id == current_user.id)))
            ur = res_ur.scalar_one_or_none()
            if ur and ur.can_create_quiz:
                can_delete = True

    if not can_delete:
        raise HTTPException(status_code=403, detail="You do not have permission to delete this quiz")

    await db.delete(quiz)
    await db.commit()
    return


@router.put("/{quiz_id}", response_model=schemas.QuizOut)
async def update_quiz(quiz_id: int, payload: schemas.QuizCreate, db: AsyncSession = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    res = await db.execute(select(models.Quiz).where(models.Quiz.id == quiz_id))
    quiz = res.scalar_one_or_none()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    quiz.title = payload.title
    quiz.description = payload.description
    quiz.room_id = payload.room_id
    quiz.is_featured = payload.is_featured
    # Persist retake and scoring settings if provided
    try:
        quiz.is_retakeable = payload.is_retakeable
        quiz.scoring_mode = payload.scoring_mode
    except Exception:
        # payload may be an orm object or missing attrs; ignore silently
        pass
    
    # Delete existing results since questions are changing completely
    await db.execute(delete(models.Result).where(models.Result.quiz_id == quiz.id))
    
    # Delete existing questions
    await db.execute(delete(models.Question).where(models.Question.quiz_id == quiz.id))
    
    # Add new questions
    import json
    for q in payload.questions or []:
        question = models.Question(quiz_id=quiz.id, text=q.text, choices=json.dumps(q.choices), correct_choice=q.correct_choice, image_url=q.image_url)
        db.add(question)
    
    await db.commit()
    await db.refresh(quiz)
    
    # Reload questions for response
    qres = await db.execute(select(models.Question).where(models.Question.quiz_id == quiz.id))
    questions = qres.scalars().all()
    import json as _json
    
    return {
        "id": quiz.id,
        "title": quiz.title,
        "description": quiz.description,
        "room_id": quiz.room_id,
        "is_featured": quiz.is_featured,
        "is_retakeable": quiz.is_retakeable,
        "scoring_mode": quiz.scoring_mode,
        "questions": [{"id": q.id, "text": q.text, "choices": _json.loads(q.choices), "correct_choice": q.correct_choice} for q in questions],
    }
