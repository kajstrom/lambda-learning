from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum

app = FastAPI()

# Configure CORS (update origins after deploying)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://lambda-learning.kstrm.com",
        "https://dx0z6fxaxyua0.cloudfront.net"
    ], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Hello from FastAPI on Lambda via Github Actions!"}

@app.get("/api/items/{item_id}")
def read_item(item_id: int):
    return {"item_id": item_id, "name": f"Item {item_id}"}

# Lambda handler
handler = Mangum(app)