from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from mangum import Mangum
from google.oauth2 import id_token
from google.auth.transport import requests
import os
from dotenv import load_dotenv

# Load .env file only in local development
# In Lambda, this does nothing (no .env file) and Lambda env vars are used instead
load_dotenv()

app = FastAPI()
security = HTTPBearer()

# Configure CORS (update origins after deploying)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://lambda-learning.kstrm.com",
        "https://dx0z6fxaxyua0.cloudfront.net",
        "http://localhost:5173"
    ], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Google Client ID - should be set via environment variable
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")

async def verify_google_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verify Google JWT token from Authorization header"""
    token = credentials.credentials
    
    try:
        # Verify the token
        idinfo = id_token.verify_oauth2_token(
            token, 
            requests.Request(), 
            GOOGLE_CLIENT_ID
        )
        
        # Token is valid, return user info
        return {
            "user_id": idinfo.get("sub"),
            "email": idinfo.get("email"),
            "name": idinfo.get("name"),
            "picture": idinfo.get("picture")
        }
    except ValueError as e:
        # Invalid token
        raise HTTPException(
            status_code=401,
            detail=f"Invalid authentication credentials: {str(e)}"
        )

@app.get("/")
def read_root(user_info: dict = Depends(verify_google_token)):
    """Protected endpoint - requires valid Google authentication"""
    return {
        "message": f"Hello {user_info['name']} from FastAPI on Lambda via Github Actions!",
        "user": user_info
    }

@app.get("/api/items/{item_id}")
def read_item(item_id: int, user_info: dict = Depends(verify_google_token)):
    """Protected endpoint - requires valid Google authentication"""
    return {
        "item_id": item_id, 
        "name": f"Item {item_id}",
        "requested_by": user_info["email"]
    }

# Lambda handler
handler = Mangum(app)