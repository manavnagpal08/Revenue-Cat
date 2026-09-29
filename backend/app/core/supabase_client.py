import logging
from typing import Optional
from supabase import create_client, Client
from app.core.config import settings

logger = logging.getLogger("soloceo.supabase")

_supabase_client: Optional[Client] = None
_supabase_admin_client: Optional[Client] = None

def get_supabase_client() -> Optional[Client]:
    """Returns the standard Supabase client with Anon key."""
    global _supabase_client
    if _supabase_client is None:
        if settings.SUPABASE_URL and settings.SUPABASE_ANON_KEY and "dummy" not in settings.SUPABASE_URL:
            try:
                _supabase_client = create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)
                logger.info("Supabase anon client initialized successfully.")
            except Exception as e:
                logger.error(f"Failed to initialize Supabase anon client: {e}")
                _supabase_client = None
    return _supabase_client

def get_supabase_admin_client() -> Optional[Client]:
    """Returns the Supabase service role client for backend operations."""
    global _supabase_admin_client
    if _supabase_admin_client is None:
        key = settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_ANON_KEY
        if settings.SUPABASE_URL and key and "dummy" not in settings.SUPABASE_URL:
            try:
                _supabase_admin_client = create_client(settings.SUPABASE_URL, key)
                logger.info("Supabase admin client initialized successfully.")
            except Exception as e:
                logger.error(f"Failed to initialize Supabase admin client: {e}")
                _supabase_admin_client = None
    return _supabase_admin_client
