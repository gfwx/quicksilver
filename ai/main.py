from fastapi import FastAPI, HTTPException, status
from models import File, FileAPIResponse

# Todo afterwards - need to figure out how this works with express api

app = FastAPI()
@app.get("/api")
async def read_root():
    """
        Root endpoint. Returns a simple greeting.
    """
    return {"message": "Welcome to my FastAPI app!"}

@app.post("/api/process")
async def read_process(jsonBody: FileAPIResponse):
    """
        File processing endpoint
    """
    if not jsonBody.filepath:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found",
            headers={'X-Error' : 'File upload error'}
        )
    return {"message": f"File stored at: {jsonBody.filepath}"}
