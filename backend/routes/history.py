"""Historical sensor data routes."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc

from database import get_db
from models import SensorReading
from schemas import ReadingResponse, PaginatedResponse

router = APIRouter(tags=["history"])


@router.get("/history", response_model=PaginatedResponse)
async def get_history(
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
):
    """Get paginated historical sensor readings."""
    count_query = select(func.count(SensorReading.id))
    total = (await db.execute(count_query)).scalar() or 0

    query = (
        select(SensorReading)
        .order_by(desc(SensorReading.timestamp))
        .offset((page - 1) * per_page)
        .limit(per_page)
    )
    result = await db.execute(query)
    readings = result.scalars().all()

    items = [ReadingResponse.model_validate(r) for r in readings]

    return PaginatedResponse(
        items=[item.model_dump() for item in items],
        total=total,
        page=page,
        per_page=per_page,
        pages=max(1, (total + per_page - 1) // per_page),
    )
