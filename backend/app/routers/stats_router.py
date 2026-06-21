from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select
from datetime import datetime

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.external_stats import ExternalStats
from app.services.leetcode_service import leetcode_service
from app.services.gfg_service import gfg_service
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/api/stats", tags=["Stats"])

class SyncRequest(BaseModel):
    leetcode_username: Optional[str] = None
    gfg_username: Optional[str] = None
    
class FallbackStatsUpdate(BaseModel):
    platform: str
    data: dict

@router.get("/external")
async def get_external_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    stats = db.execute(select(ExternalStats).where(ExternalStats.user_id == current_user.id)).scalar_one_or_none()
    if not stats:
        return {"leetcode_data": None, "gfg_data": None, "last_synced": None}
    
    return {
        "leetcode_data": stats.leetcode_data,
        "gfg_data": stats.gfg_data,
        "last_synced": stats.last_synced
    }

@router.post("/sync")
async def sync_external_stats(
    request: SyncRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    stats = db.execute(select(ExternalStats).where(ExternalStats.user_id == current_user.id)).scalar_one_or_none()
    if not stats:
        stats = ExternalStats(user_id=current_user.id, leetcode_data={}, gfg_data={})
        db.add(stats)
        
    result = {"leetcode_synced": False, "gfg_synced": False, "errors": []}
    
    if request.leetcode_username:
        lc_data = await leetcode_service.fetch_user_stats(request.leetcode_username)
        if lc_data:
            stats.leetcode_data = lc_data
            result["leetcode_synced"] = True
        else:
            result["errors"].append("Failed to fetch LeetCode stats")
            
    if request.gfg_username:
        g_data = await gfg_service.fetch_user_stats(request.gfg_username)
        if g_data:
            stats.gfg_data = g_data
            result["gfg_synced"] = True
        else:
            result["errors"].append("Failed to fetch GFG stats")
            
    stats.last_synced = datetime.utcnow()
    db.commit()
    
    return result

@router.post("/fallback")
async def update_fallback_stats(
    request: FallbackStatsUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update stats manually if scraper fails"""
    stats = db.execute(select(ExternalStats).where(ExternalStats.user_id == current_user.id)).scalar_one_or_none()
    if not stats:
        stats = ExternalStats(user_id=current_user.id, leetcode_data={}, gfg_data={})
        db.add(stats)
        
    if request.platform == "leetcode":
        stats.leetcode_data = request.data
    elif request.platform == "gfg":
        stats.gfg_data = request.data
    else:
        raise HTTPException(status_code=400, detail="Invalid platform")
        
    stats.last_synced = datetime.utcnow()
    db.commit()
    
    return {"message": "Stats updated manually"}
