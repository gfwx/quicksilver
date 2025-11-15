import asyncio
from os import getenv
from typing import List

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, status
from ollama import AsyncClient

from .db.vector import VectorStore
from .models import FileAPIResponse
from .reader import FileProcessor

load_dotenv()
vs = VectorStore()
app = FastAPI()
host = getenv("OLLAMA_ENDPOINT", "http://localhost:11434")

client = AsyncClient(host=host)


@app.get("/api")
async def read_root():
    return {"message": "Quicksilver Python Microservice"}


def _process_file_sync(
    document_id: str,
    project_id: str,
    filepath: str | None = None,
    content: bytes | None = None,
    filename: str | None = None,
):
    """Synchronous file processing pipeline to be run in a thread."""
    # 1. Process the file to extract text
    fp = FileProcessor(
        filepath=filepath or "", content=content, filename=filename or ""
    )
    fp.process()
    text_content = fp.get()

    if not text_content:
        raise ValueError("Failed to process file.")

    # 2. Chunk the extracted text
    chunks = fp.chunk_data()
    if not chunks:
        raise ValueError("Failed to chunk data.")

    # 3. Add chunks to the vector store
    vs.add(chunks, document_id=document_id, project_id=project_id)

    return document_id


@app.post("/api/process")
async def read_process(jsonBody: FileAPIResponse):
    import base64

    # Support both filepath (legacy) and content (new edge-compatible)
    if jsonBody.content:
        print(f"Processing file from content: {jsonBody.filename}")
    else:
        print(f"Processing file from path: {jsonBody.filepath}")

    document_id = jsonBody.document_id
    project_id = jsonBody.project_id

    # Validate required fields
    if not (jsonBody.filepath or jsonBody.content):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either filepath or content is required.",
            headers={"X-Error": "File path or content missing"},
        )

    if not document_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Document ID is required.",
            headers={"X-Error": "Document id missing"},
        )

    if not project_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Project ID is required.",
            headers={"X-Error": "Project ID missing"},
        )

    try:
        # Decode base64 content if provided
        content_bytes = None
        if jsonBody.content:
            content_bytes = base64.b64decode(jsonBody.content)

        # Run the synchronous pipeline in a worker thread
        document_id = await asyncio.to_thread(
            _process_file_sync,
            document_id=jsonBody.document_id,
            project_id=jsonBody.project_id,
            filepath=jsonBody.filepath,
            content=content_bytes,
            filename=jsonBody.filename,
        )

        return {
            "message": f"File processed and embeddings stored successfully for: {document_id} under project id: {jsonBody.project_id}"
        }

    except ValueError as e:
        # Handle expected processing errors
        if "Failed to process file" in str(e):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to process file.",
                headers={"X-Error": "File processing error"},
            )
        elif "Failed to chunk data" in str(e):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to chunk data.",
                headers={"X-Error": "Data chunking error"},
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Processing error: {e}",
                headers={"X-Error": "Processing error"},
            )
    except Exception as e:
        # Catch-all for any other unexpected errors
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred: {e}",
            headers={"X-Error": "Internal Server Error"},
        )


def _vector_query_sync(query: str, project_id: str) -> List[str]:
    try:
        results = vs.search(query, project_id)
        return [r["text"] for r in results]
    except Exception as e:
        raise ValueError(f"Vector embeddings failure: {e}")


@app.get("/api/vector")
async def get_vector(query, project_id):
    if not query:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Query not specified!",
            headers={"X-Error": "No query"},
        )

    if not project_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Project ID not specified!",
            headers={"X-Error": "No project id specified"},
        )

    try:
        data = await asyncio.to_thread(_vector_query_sync, query, project_id)
        return {"text": data}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Vector embeddings failure: {e}",
        )


@app.delete("/api/purge")
async def delete_vector_embeddings(project_id: str):
    if not project_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Project ID not specified!",
            headers={"X-Error": "No project id specified"},
        )

    try:
        await asyncio.to_thread(vs.delete_many, project_id)
        return {
            "message": f"Successfully deleted all vector embeddings for project: {project_id}"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete vector embeddings: {e}",
        )
