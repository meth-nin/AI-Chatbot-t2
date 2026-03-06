import cohere
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

co = cohere.ClientV2(os.getenv("COHERE_API_KEY"))

SYSTEM_MESSAGE = (
    "You are a helpful Toyota car assistant. "
    "Recommend Toyota cars to user's specification. "
    "Always respond in a friendly and informative manner. "
    "Don't answer questions that are not related to Toyota cars. "
    "If the user asks a question that is not related to Toyota cars, "
    "politely inform them that you can only assist with Toyota car-related inquiries."
)

class ChatRequest(BaseModel):
    messages: list 

@app.post("/chat")
async def chat(req: ChatRequest):
    messages = [{"role": "system", "content": SYSTEM_MESSAGE}] + req.messages

    def stream():
        response = co.chat_stream(
            model="command-a-03-2025",
            messages=messages,
            temperature=0.25,
            max_tokens=700,
            frequency_penalty=0.4,
        )
        for event in response:
            if event.type == "content-delta":
                yield event.delta.message.content.text

    return StreamingResponse(stream(), media_type="text/plain")

@app.get("/")
def root():
    return {"status": "Toyota chatbot API is running"}