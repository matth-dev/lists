from pydantic import BaseModel
from typing import Optional
from sqlmodel import SQLModel

class ItemBase(SQLModel):
    name:str
    qty:Optional[float] = 0.0
    valid:Optional[bool] = False

class ItemRead(ItemBase):
    id:int

class ListBase(SQLModel):
    name:str
    archived:Optional[bool] = False

class ListRead(ListBase):
    id:int
    items:list[ItemRead] = []

class ListCreate(BaseModel):
    name:str