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
    filepath: str | None = None  # Optional: for backward compatibility
    content: str | None = None  # Base64-encoded file content
    filename: str | None = None  # Original filename when using content
    content_type: str | None = None  # MIME type when using content
    document_id: str
    project_id: str


class VectorAPIResponse(BaseModel):
    query: str
    project_id: str
