import asyncio
import json
from sqlalchemy import select, update
from app.database import AsyncSessionLocal
from app.models import Result, Question

async def main():
    async with AsyncSessionLocal() as db:
        res = await db.execute(select(Result))
        results = res.scalars().all()
        for r in results:
            if not r.answers:
                continue
            answers = json.loads(r.answers)
            qres = await db.execute(select(Question.id).where(Question.quiz_id == r.quiz_id))
            valid_qids = set(str(qid) for qid in qres.scalars().all())
            
            new_answers = {}
            for qid, adata in answers.items():
                if qid in valid_qids:
                    new_answers[qid] = adata
            
            new_score = sum(a.get("score", 0) for a in new_answers.values())
            
            if new_score != r.score or len(new_answers) != len(answers):
                r.answers = json.dumps(new_answers)
                r.score = new_score
                db.add(r)
                print(f"Fixed Result ID {r.id}: new score {new_score}")
        
        await db.commit()

if __name__ == "__main__":
    asyncio.run(main())
