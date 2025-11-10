from datetime import datetime

from pydantic import BaseModel


class File(BaseModel):
    filename: str
    encoding: str
    originalname: str
    size: str
    timestamp: datetime
    status: str
    userid: str
    projectId: str


class FileAPIResponse(BaseModel):
    filepath: str
    document_id: str


class Query(BaseModel):
    query: str
    model: str
