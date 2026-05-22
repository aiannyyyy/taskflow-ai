from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta
from app.core.database import get_db
from app.models.task import Task
from app.models.user import User
from app.schemas.task import TaskCreate, TaskUpdate, TaskOut
from app.services.auth import get_current_user

router = APIRouter(prefix="/tasks", tags=["Tasks"])


@router.get("/ai-summary")
def ai_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    tasks = db.query(Task).filter(Task.owner_id == current_user.id).all()
    total = len(tasks)
    completed = len([t for t in tasks if t.is_completed])
    pending = total - completed
    overdue = [t for t in tasks if t.due_date and t.due_date < datetime.utcnow() and not t.is_completed]

    return {
        "total_tasks": total,
        "completed": completed,
        "pending": pending,
        "overdue_count": len(overdue),
        "overdue_tasks": [t.title for t in overdue],
        "ai_summary": f"You have {pending} pending tasks and {len(overdue)} overdue. Focus on completing high priority items first.",
    }


@router.get("/ai-plan")
def ai_plan(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    tasks = db.query(Task).filter(
        Task.owner_id == current_user.id,
        Task.is_completed == False
    ).all()

    priority_order = {"high": 0, "medium": 1, "low": 2}
    sorted_tasks = sorted(tasks, key=lambda t: priority_order.get(t.priority.value, 1))

    plan = []
    for i, task in enumerate(sorted_tasks[:5]):
        plan.append({
            "slot": f"Block {i+1}",
            "task": task.title,
            "priority": task.priority.value,
            "estimated_time": "1-2 hours",
        })

    return {
        "date": datetime.utcnow().strftime("%Y-%m-%d"),
        "daily_plan": plan,
        "ai_note": "Plan generated based on your pending tasks sorted by priority.",
    }


@router.post("/ai-suggest")
def ai_suggest(
    payload: TaskCreate,
    current_user: User = Depends(get_current_user),
):
    due = (datetime.utcnow() + timedelta(days=3)).strftime("%Y-%m-%d")
    return {
        "title": payload.title,
        "suggested_priority": "high" if any(w in payload.title.lower() for w in ["urgent", "fix", "bug", "asap"]) else "medium",
        "suggested_due_date": due,
        "suggested_subtasks": [
            f"Research and plan: {payload.title}",
            f"Implement: {payload.title}",
            f"Test and review: {payload.title}",
            f"Deploy or submit: {payload.title}",
        ],
        "ai_note": "AI suggestion based on your task description.",
    }


@router.get("/", response_model=List[TaskOut])
def get_tasks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(Task).filter(Task.owner_id == current_user.id).all()


@router.post("/", response_model=TaskOut, status_code=201)
def create_task(
    payload: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = Task(**payload.model_dump(), owner_id=current_user.id)
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@router.get("/{task_id}", response_model=TaskOut)
def get_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = db.query(Task).filter(Task.id == task_id, Task.owner_id == current_user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@router.put("/{task_id}", response_model=TaskOut)
def update_task(
    task_id: int,
    payload: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = db.query(Task).filter(Task.id == task_id, Task.owner_id == current_user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(task, field, value)

    db.commit()
    db.refresh(task)
    return task


@router.delete("/{task_id}", status_code=204)
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = db.query(Task).filter(Task.id == task_id, Task.owner_id == current_user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    db.delete(task)
    db.commit()