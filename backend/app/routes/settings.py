from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from ..models.database import get_db
from ..models.setting import Setting as SettingModel
from ..schemas import Setting, SettingCreate

router = APIRouter()

@router.get("/{key}", response_model=Setting)
def get_setting(key: str, db: Session = Depends(get_db)):
    """
    Get a specific setting by key.
    """
    db_setting = db.query(SettingModel).filter(SettingModel.key == key).first()
    if db_setting is None:
        raise HTTPException(status_code=404, detail="Setting not found")
    return db_setting

@router.post("/", response_model=Setting)
def upsert_setting(setting: SettingCreate, db: Session = Depends(get_db)):
    """
    Create a new setting or update an existing one.
    """
    db_setting = db.query(SettingModel).filter(SettingModel.key == setting.key).first()
    if db_setting:
        # Update existing setting
        db_setting.value = setting.value
    else:
        # Create new setting
        db_setting = SettingModel(key=setting.key, value=setting.value)
        db.add(db_setting)
    
    db.commit()
    db.refresh(db_setting)
    return db_setting 