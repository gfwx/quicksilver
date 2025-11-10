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
    project_id: str


class FileAPIResponse(BaseModel):
    filepath: str
    document_id: str
    project_id: str


class VectorAPIResponse(BaseModel):
    query: str
    project_id: str
