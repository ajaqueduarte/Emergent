from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
from typing import Optional
import json
from datetime import datetime

app = FastAPI()

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Simple in-memory storage for game scores (could be extended with MongoDB if needed)
game_scores = []

class GameScore(BaseModel):
    player_name: str
    level_reached: int
    time_taken: float
    timestamp: Optional[str] = None

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "message": "2D Platformer Game API"}

@app.post("/api/score")
async def save_score(score: GameScore):
    """Save a game score"""
    score.timestamp = datetime.now().isoformat()
    game_scores.append(score.dict())
    return {"message": "Score saved successfully", "score": score}

@app.get("/api/scores")
async def get_scores():
    """Get all game scores"""
    return {"scores": game_scores}

@app.get("/api/leaderboard")
async def get_leaderboard():
    """Get top 10 scores"""
    sorted_scores = sorted(game_scores, key=lambda x: x['level_reached'], reverse=True)
    return {"leaderboard": sorted_scores[:10]}

@app.delete("/api/scores")
async def clear_scores():
    """Clear all scores"""
    global game_scores
    game_scores = []
    return {"message": "All scores cleared"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)