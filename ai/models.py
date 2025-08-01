from pydantic import BaseModel
from datetime import datetime

class File(BaseModel):
    filename: str
    encoding: str
    originalname: str
    size: str
    timestamp: datetime
    status: str
    userid: str

class FileAPIResponse(BaseModel):
    filepath: str
    document_id: str

class Query(BaseModel):
    query: str
    model: str
