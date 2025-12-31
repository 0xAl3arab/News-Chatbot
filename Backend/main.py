from fastapi import FastAPI
from pydantic import BaseModel
from news_client import smart_chat
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="🤖 AI News Chatbot")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

class ChatRequest(BaseModel):
    query: str
    limit: int = 5

@app.get("/")
async def hello():
    return {"message": "🚀 AI News Chatbot Ready!"}

@app.post("/chat")
async def chat(request: ChatRequest):
    result = smart_chat(request.query, request.limit)
    return result
