from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from database import get_db
from models.all_models import Course, FocusTask, User
from schemas.all_schemas import (
    CourseResponse, CourseCreate,
    FocusTaskResponse, FocusTaskCreate, FocusTaskUpdate
)
from api.deps import get_current_user

router = APIRouter()

# --- Courses ---
@router.get("/courses", response_model=List[CourseResponse])
async def get_courses(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    query = select(Course).where(Course.user_id == current_user.id)
    result = await db.execute(query)
    courses = result.scalars().all()
    
    # 模拟自动加载体验课程
    if not courses:
        demo_courses = [
            Course(user_id=current_user.id, title="高等数学", chapter="第5章 偏微分方程", progress=85, icon="∑", color="#6750A4"),
            Course(user_id=current_user.id, title="数据结构", chapter="第3章 二叉树与堆", progress=42, icon="{}", color="#7D5260"),
            Course(user_id=current_user.id, title="线性代数", chapter="第4章 特征值与特征向量", progress=68, icon="⊕", color="#625B71"),
        ]
        db.add_all(demo_courses)
        await db.commit()
        
        query = select(Course).where(Course.user_id == current_user.id)
        result = await db.execute(query)
        courses = result.scalars().all()
        
    return courses

# --- Tasks ---
@router.get("/tasks", response_model=List[FocusTaskResponse])
async def get_tasks(
    date: str = None,
    current_user: User = Depends(get_current_user), 
    db: AsyncSession = Depends(get_db)
):
    query = select(FocusTask).where(FocusTask.user_id == current_user.id)
    if date:
        query = query.where(FocusTask.date == date)
    result = await db.execute(query)
    return result.scalars().all()

@router.post("/tasks", response_model=FocusTaskResponse)
async def create_task(
    task_in: FocusTaskCreate,
    current_user: User = Depends(get_current_user), 
    db: AsyncSession = Depends(get_db)
):
    new_task = FocusTask(
        user_id=current_user.id,
        **task_in.model_dump()
    )
    db.add(new_task)
    await db.commit()
    await db.refresh(new_task)
    return new_task

@router.patch("/tasks/{task_id}", response_model=FocusTaskResponse)
async def update_task(
    task_id: int,
    task_update: FocusTaskUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(FocusTask).where(FocusTask.id == task_id, FocusTask.user_id == current_user.id)
    result = await db.execute(query)
    task = result.scalars().first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    update_data = task_update.model_dump(exclude_unset=True)
    if update_data.get("completed") is True and not task.completed:
        update_data["completed_at"] = datetime.now()
        
    for key, value in update_data.items():
        setattr(task, key, value)
        
    await db.commit()
    await db.refresh(task)
    return task

@router.delete("/tasks/{task_id}")
async def delete_task(
    task_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(FocusTask).where(FocusTask.id == task_id, FocusTask.user_id == current_user.id)
    result = await db.execute(query)
    task = result.scalars().first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    await db.delete(task)
    await db.commit()
    return {"status": "success"}
