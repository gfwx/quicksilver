from fastapi import FastAPI, HTTPException, status
from .models import FileAPIResponse, Query
from .reader import FileProcessor
from .db.vector import VectorStore
from typing import List

# Todo afterwards - need to figure out how this works with express api

vs = VectorStore()
app = FastAPI()

@app.get("/api")
async def read_root():
    return {"message": "FastCTX Python Microservice"}

@app.post("/api/process")
def read_process(jsonBody: FileAPIResponse):
    filepath = jsonBody.filepath
    if not filepath:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File path is required.",
            headers={'X-Error': 'File path missing'}
        )

    try:
        # 1. Process the file to extract text
        fp = FileProcessor(filepath)
        fp.process()
        text_content = fp.get()

        if not text_content:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to process file.",
                headers={'X-Error': 'File processing error'}
            )

        # 2. Chunk the extracted text
        chunks = fp.chunk_data()
        if not chunks:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to chunk data.",
                headers={'X-Error': 'Data chunking error'}
            )

        # 3. Add chunks to the vector store
        vs.add(chunks, document_id=jsonBody.document_id)

        return {"message": f"File processed and embeddings stored successfully for: {jsonBody.document_id}"}

    except Exception as e:
        # Catch-all for any other unexpected errors
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred: {e}",
            headers={'X-Error': 'Internal Server Error'}
        )
@app.post('/api/query')
async def read_query(jsonBody: Query):
    if not jsonBody.query:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No query found!",
            headers={'X-Error' : 'No query'}
        )
    try:
        results = vs.search(jsonBody.query);
        data = [r["text"] for r in results]
        return {"message" : "Query process successful", "data" : data}

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Query process failure: {e}"
        )
