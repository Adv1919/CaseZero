from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Absolute imports (No dots!)
import models
from database import engine
from routers import auth, ai_generator 


# Ensure tables are dynamically built in SQLite
models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# --- CORS CONFIGURATION ---
# This allows your Next.js frontend to securely talk to this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- ROUTER PLUGINS ---
# This plugs your separate endpoint files into the main engine
app.include_router(auth.router)
app.include_router(ai_generator.router)

# Health check endpoint just to verify the server is breathing
@app.get("/")
def health_check():
    return {"status": "CaseZero API is online and waiting for generation requests."}