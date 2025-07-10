from fastapi import FastAPI, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import SQLModel, Session, create_engine, select
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from typing import Annotated
from contextlib import asynccontextmanager
from backend.models.models import List, Item
from backend.models.schemas import ListRead, ListCreate

connect_args = {"check_same_thread": False}
engine = create_engine("sqlite:///app/backend/data/data.db", connect_args=connect_args, echo=True)

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session

SessionDep = Annotated[Session, Depends(get_session)]

@asynccontextmanager
async def lifespan(api: FastAPI):
    create_db_and_tables()
    # BEFORE APP START
    yield
    # BEFORE APP SHUTDOWN

app = FastAPI(lifespan=lifespan)

app.mount("/static", StaticFiles(directory="app/front/static"), name="static")

app.add_middleware(
    CORSMiddleware,
    allow_origins= ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

templates = Jinja2Templates(directory="app/front/static")

@app.get("/", response_class=HTMLResponse)
async def home(request:Request):
    return templates.TemplateResponse(name="index.html", request=request)

@app.post("/lists/create", tags=["Lists"], response_model=ListRead)
async def create_list(session:SessionDep, list:ListCreate) -> ListRead:

    new_list:List = List(name=list.name)
    session.add(new_list)

    session.commit()
    session.refresh(new_list)

    return new_list

@app.get("/lists/get_all", tags=["Lists"], response_model=list[List])
async def get_all_lists(session:SessionDep, archived:bool = False) -> list[List]:
    
    list_of_list:list[List] = session.exec(select(List).where(List.archived == archived)).all()

    print(list_of_list)

    return list_of_list

@app.get("/lists/{list_id}/get_items", tags=["Lists"], response_model=list[Item], description="Get list items")
async def get_list_items(session:SessionDep, list_id:int) -> list[Item]:
    list = session.get(List, list_id)

    return list.items

@app.get("/lists/{list_id}", tags=["Lists"], response_model=ListRead, description="Get List Object")
async def get_list(session:SessionDep, list_id:int) -> ListRead:
    list = session.get(List, list_id)
    return list

@app.post("/lists/{list_id}/add_item", tags=["Lists", "Items"], response_model=Item)
async def add_item(session:SessionDep, list_id:int, p_item:Item) -> Item:

    new_item = Item(name=p_item.name, qty=p_item.qty, list_id=list_id)

    session.add(new_item)

    session.commit()

    session.refresh(new_item)

    return new_item

@app.delete("/items/{item_id}/delete", tags=["Items"], response_model=Item)
async def delete_item(session:SessionDep, item_id:int) -> Item:

    item = session.get(Item, item_id)

    session.delete(item)

    session.commit()

    return item

@app.put("/items/{item_id}/validate", tags=["Items"], response_model=Item)
async def validate_item(session:SessionDep, item_id:int) -> Item:
    item = session.get(Item, item_id)

    item.valid = not item.valid

    session.add(item)

    session.commit()

    session.refresh(item)

    return item

@app.put("/lists/{list_id}/archive", tags=["Lists"], response_model=List)
async def validate_list(session:SessionDep, list_id:int) -> List:
    list = session.get(List, list_id)

    list.archived = all([item.valid for item in list.items])

    session.add(list)

    session.commit()

    session.refresh(list)

    return list

@app.delete("/lists/{list_id}/delete", tags=["Lists"], response_model=List)
async def delete_list(session:SessionDep, list_id:int) -> List:
    list = session.get(List, list_id)

    session.delete(list)

    session.commit()

    return list