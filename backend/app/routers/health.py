from fastapi import APIRouter
from app.models.schemas import HealthResponse
from app.core.config import settings
from app.core.supabase_client import get_supabase_client

router = APIRouter(prefix="/health", tags=["Health"])

@router.get("", response_model=HealthResponse)
async def check_health():
    client = get_supabase_client()
    db_connected = False
    if client is not None:
        try:
            res = client.table("businesses").select("id").limit(1).execute()
            db_connected = True
        except Exception:
            db_connected = False

    return HealthResponse(
        status="healthy",
        environment=settings.ENVIRONMENT,
        database_connected=db_connected,
        version="1.0.0"
    )
