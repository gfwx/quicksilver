from fastapi import FastAPI

app = FastAPI()
@app.get("/")
async def read_root(name: str):
    return {"message" : f"Hello {name}!"}
