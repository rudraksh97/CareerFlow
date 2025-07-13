from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List
from ..models.database import get_db
from ..models.todo import Todo as TodoModel
from ..schemas import Todo, TodoCreate, TodoUpdate

router = APIRouter()

@router.get("/", response_model=List[Todo])
def list_todos(db: Session = Depends(get_db)):
    return db.query(TodoModel).order_by(TodoModel.created_at.desc()).all()

@router.post("/", response_model=Todo)
def create_todo(todo: TodoCreate, db: Session = Depends(get_db)):
    db_todo = TodoModel(text=todo.text, completed=todo.completed)
    db.add(db_todo)
    db.commit()
    db.refresh(db_todo)
    return db_todo

@router.put("/{todo_id}", response_model=Todo)
def update_todo(todo_id: str, todo: TodoUpdate, db: Session = Depends(get_db)):
    db_todo = db.query(TodoModel).filter(TodoModel.id == todo_id).first()
    if not db_todo:
        raise HTTPException(status_code=404, detail="Todo not found")
    if todo.text is not None:
        db_todo.text = todo.text
    if todo.completed is not None:
        db_todo.completed = todo.completed
    db.commit()
    db.refresh(db_todo)
    return db_todo

@router.delete("/{todo_id}", response_model=dict)
def delete_todo(todo_id: str, db: Session = Depends(get_db)):
    db_todo = db.query(TodoModel).filter(TodoModel.id == todo_id).first()
    if not db_todo:
        raise HTTPException(status_code=404, detail="Todo not found")
    db.delete(db_todo)
    db.commit()
    return {"ok": True} 