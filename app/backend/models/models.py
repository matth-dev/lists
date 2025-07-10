from sqlmodel import SQLModel, Field, Relationship
from typing import Optional

class List(SQLModel, table=True):
    id:Optional[int] = Field(default=None, primary_key=True)
    name:str = Field(index=True)
    archived:Optional[bool] = Field(default=False)

    items:list["Item"] = Relationship(back_populates="list", cascade_delete=True)

class Item(SQLModel, table=True):
    id:Optional[int] = Field(default=None, primary_key=True)
    name:str = Field(index=True)
    qty:Optional[float] = Field(default=0.0)
    valid:Optional[bool] = Field(default=False)

    list_id:int = Field(foreign_key="list.id", ondelete="CASCADE")
    
    list:List = Relationship(back_populates="items")