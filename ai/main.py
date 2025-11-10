import asyncio
from os import getenv
from typing import AsyncGenerator, List

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, status
from fastapi.responses import StreamingResponse
from ollama import AsyncClient

from .db.vector import VectorStore
from .models import FileAPIResponse, Query
from .reader import FileProcessor

load_dotenv()
vs = VectorStore()
app = FastAPI()
host = getenv("OLLAMA_ENDPOINT", "http://localhost:11434")

client = AsyncClient(host=host)


def make_prompt(query: str, ctx: List[str]):
    prompt_string = f"Answer the following question based on the context provided. If the context is not provided, just say 'I don't know'.\n\nQuestion: {query}\n\nContext:\n"
    for i, chunk in enumerate(ctx):
        prompt_string += f"Chunk {i + 1}: {chunk}\n"

    return prompt_string


@app.get("/api")
async def read_root():
    return {"message": "Quicksilver Python Microservice"}


def _process_file_sync(filepath: str, document_id: str):
    """Synchronous file processing pipeline to be run in a thread."""
    # 1. Process the file to extract text
    fp = FileProcessor(filepath)
    fp.process()
    text_content = fp.get()

    if not text_content:
        raise ValueError("Failed to process file.")

    # 2. Chunk the extracted text
    chunks = fp.chunk_data()
    if not chunks:
        raise ValueError("Failed to chunk data.")

    # 3. Add chunks to the vector store
    vs.add(chunks, document_id=document_id)

    return document_id


@app.post("/api/process")
async def read_process(jsonBody: FileAPIResponse):
    print(f"Processing file: {jsonBody.filepath}")
    filepath = jsonBody.filepath
    document_id = jsonBody.document_id
    if not filepath:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File path is required.",
            headers={"X-Error": "File path missing"},
        )

    try:
        # Run the synchronous pipeline in a worker thread
        document_id = await asyncio.to_thread(
            _process_file_sync, filepath, jsonBody.document_id
        )

        return {
            "message": f"File processed and embeddings stored successfully for: {document_id}"
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


async def _ollama_stream_generator(
    prompt: str, model: str
) -> AsyncGenerator[str, None]:
    try:
        async for chunk in await client.chat(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            stream=True,
        ):
            if chunk.message and chunk.message.content:
                yield chunk.message.content
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ollama API Error: {e}",
        )


def _vector_query_sync(query: str) -> List[str]:
    try:
        results = vs.search(query)
        return [r["text"] for r in results]
    except Exception as e:
        raise ValueError(f"Vector embeddings failure: {e}")


@app.post("/api/query")
async def read_query(jsonBody: Query):
    if not jsonBody.query:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No query found!",
            headers={"X-Error": "No query"},
        )

    if not jsonBody.model:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Model information not specified!",
            headers={"X-Error": "No model specified"},
        )
    try:
        data = await asyncio.to_thread(_vector_query_sync, jsonBody.query)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Vector embeddings failure: {e}",
        )

    query = make_prompt(jsonBody.query, data)

    return StreamingResponse(
        _ollama_stream_generator(query, jsonBody.model), media_type="text/event-stream"
    )
