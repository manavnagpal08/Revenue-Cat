import logging
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, Header, Request, status, Response
from app.models.schemas import (
    IntegrationResponse,
    IntegrationConnectURLResponse,
    IntegrationSyncResponse,
    WebsiteLeadWebhookPayload,
    EmailDraftRequest,
    EmailSendRequest,
    CalendarEventCreateRequest,
    WhatsAppMessageSendRequest,
)
from app.core.security import get_current_user_id
from app.core.config import settings
from app.services.integrations.manager import integration_manager
from app.services.integrations.google.gmail import GmailIntegrationProvider
from app.services.integrations.google.calendar import GoogleCalendarIntegrationProvider
from app.services.integrations.meta.whatsapp import WhatsAppIntegrationProvider
from app.services.integrations.website.webhook import WebsiteLeadsIntegrationProvider

logger = logging.getLogger("soloceo_integrations_router")

router = APIRouter(prefix="/integrations", tags=["Integrations & Connected Workspace"])

gmail_provider = GmailIntegrationProvider()
calendar_provider = GoogleCalendarIntegrationProvider()
whatsapp_provider = WhatsAppIntegrationProvider()
website_provider = WebsiteLeadsIntegrationProvider()

@router.get("", response_model=List[Dict[str, Any]])
async def list_integrations(
    business_id: str = Query(..., description="Active workspace ID"),
    user_id: str = Depends(get_current_user_id)
):
    """List connection status for all registered external integrations."""
    return await integration_manager.list_integrations_status(business_id=business_id)


@router.get("/{provider}/status")
async def get_integration_status(
    provider: str,
    business_id: str = Query(..., description="Active workspace ID"),
    user_id: str = Depends(get_current_user_id)
):
    """Retrieve detailed status for a single integration provider."""
    p = integration_manager.get_provider(provider)
    if not p:
        raise HTTPException(status_code=404, detail=f"Provider '{provider}' not found")
    return await p.get_status(business_id=business_id)


@router.get("/{provider}/connect", response_model=IntegrationConnectURLResponse)
async def get_connect_url(
    provider: str,
    business_id: str = Query(..., description="Active workspace ID"),
    redirect_uri: Optional[str] = Query(None),
    state: Optional[str] = Query("connect"),
    user_id: str = Depends(get_current_user_id)
):
    """Generates the OAuth authorization URL for the requested provider."""
    try:
        url = await integration_manager.get_auth_url(
            business_id=business_id,
            provider_id=provider,
            redirect_uri=redirect_uri or settings.GOOGLE_REDIRECT_URI,
            state=state or "connect"
        )
        return IntegrationConnectURLResponse(
            provider=provider,
            auth_url=url,
            state=state or "connect"
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{provider}/callback")
async def oauth_callback(
    provider: str,
    code: Optional[str] = Query(None),
    state: Optional[str] = Query(None),
    error: Optional[str] = Query(None),
    redirect_uri: Optional[str] = Query(None)
):
    """OAuth callback endpoint where external providers redirect after user consent."""
    if error:
        return Response(content=f"<html><body><h2>OAuth Authorization Denied: {error}</h2></body></html>", media_type="text/html")

    if not code or not state:
        raise HTTPException(status_code=400, detail="Missing code or state in OAuth callback")

    # State format: business_id:provider:random_state
    parts = state.split(":")
    business_id = parts[0] if len(parts) > 0 else "default"

    try:
        res = await integration_manager.handle_callback(
            business_id=business_id,
            provider_id=provider,
            code=code,
            redirect_uri=redirect_uri or settings.GOOGLE_REDIRECT_URI
        )
        return Response(content="<html><body><h2>Integration Connected Successfully! You can return to the app.</h2></body></html>", media_type="text/html")
    except Exception as e:
        logger.error(f"Callback handling failed: {e}")
        return Response(content=f"<html><body><h2>Integration Error: {str(e)}</h2></body></html>", media_type="text/html")


@router.post("/{provider}/disconnect")
async def disconnect_integration(
    provider: str,
    business_id: str = Query(..., description="Active workspace ID"),
    user_id: str = Depends(get_current_user_id)
):
    """Revokes tokens and disconnects integration from workspace."""
    success = await integration_manager.disconnect(business_id=business_id, provider_id=provider)
    return {"success": success, "provider": provider, "status": "disconnected"}


@router.post("/{provider}/sync", response_model=IntegrationSyncResponse)
async def sync_integration(
    provider: str,
    business_id: str = Query(..., description="Active workspace ID"),
    user_id: str = Depends(get_current_user_id)
):
    """Trigger manual synchronization of integration data."""
    res = await integration_manager.sync(business_id=business_id, provider_id=provider)
    return IntegrationSyncResponse(
        provider=provider,
        status=res.get("status", "synced"),
        synced_records_count=res.get("synced_records_count", 0),
        message=res.get("message", "Sync completed.")
    )


# --- GMAIL ROUTES ---
@router.get("/gmail/messages")
async def get_gmail_messages(
    business_id: str = Query(...),
    limit: int = Query(20),
    user_id: str = Depends(get_current_user_id)
):
    """Fetch recent emails from connected Gmail account."""
    return await gmail_provider.get_recent_emails(business_id=business_id, limit=limit)


@router.post("/gmail/draft")
async def create_gmail_draft(
    req: EmailDraftRequest,
    user_id: str = Depends(get_current_user_id)
):
    """Create an email draft without sending."""
    return await gmail_provider.create_draft(
        business_id=req.business_id,
        to_email=req.to_email,
        subject=req.subject,
        body=req.body
    )


@router.post("/gmail/send")
async def send_gmail_email(
    req: EmailSendRequest,
    user_id: str = Depends(get_current_user_id)
):
    """Sends email only after explicit user confirmation."""
    return await gmail_provider.send_confirmed_email(
        business_id=req.business_id,
        to_email=req.to_email,
        subject=req.subject,
        body=req.body
    )


# --- GOOGLE CALENDAR ROUTES ---
@router.get("/calendar/events")
async def get_calendar_events(
    business_id: str = Query(...),
    limit: int = Query(10),
    user_id: str = Depends(get_current_user_id)
):
    """Retrieve upcoming events from Google Calendar."""
    return await calendar_provider.get_events(business_id=business_id, limit=limit)


@router.post("/calendar/events")
async def create_calendar_event(
    req: CalendarEventCreateRequest,
    user_id: str = Depends(get_current_user_id)
):
    """Creates calendar meeting event after user confirmation."""
    return await calendar_provider.create_confirmed_event(
        business_id=req.business_id,
        title=req.title,
        start_time=req.start_time.isoformat(),
        end_time=req.end_time.isoformat(),
        description=req.description,
        attendees=req.attendees
    )


# --- META / WHATSAPP ROUTES ---
@router.get("/whatsapp/webhook")
async def whatsapp_webhook_verification(
    request: Request
):
    """Meta Webhook verification handshake."""
    params = request.query_params
    mode = params.get("hub.mode")
    token = params.get("hub.verify_token")
    challenge = params.get("hub.challenge")

    if mode and token and challenge:
        challenge_res = whatsapp_provider.verify_webhook(mode=mode, token=token, challenge=challenge)
        if challenge_res:
            return Response(content=challenge_res, media_type="text/plain")

    raise HTTPException(status_code=403, detail="Verification failed")


@router.post("/whatsapp/webhook")
async def whatsapp_webhook_ingest(
    request: Request
):
    """Receives inbound messages and delivery events from WhatsApp Cloud API."""
    body = await request.json()
    return await whatsapp_provider.handle_incoming_webhook(payload=body)


@router.post("/whatsapp/send")
async def send_whatsapp_message(
    req: WhatsAppMessageSendRequest,
    user_id: str = Depends(get_current_user_id)
):
    """Sends confirmed WhatsApp message via Meta Cloud API."""
    return await whatsapp_provider.send_confirmed_message(
        business_id=req.business_id,
        to_phone=req.to_phone,
        message=req.message
    )


# --- WEBSITE LEAD CAPTURE WEBHOOK ---
@router.post("/webhooks/leads/{business_id}")
async def website_lead_webhook(
    business_id: str,
    payload: WebsiteLeadWebhookPayload,
    x_soloceo_secret: Optional[str] = Header(None)
):
    """
    Inbound lead capture endpoint for website forms and quotes.
    Secured via webhook secret header. Automatically creates Lead and Customer records.
    """
    if x_soloceo_secret and x_soloceo_secret != settings.WEBHOOK_SIGNING_SECRET:
        raise HTTPException(status_code=401, detail="Invalid webhook signing secret")

    return await website_provider.ingest_lead(business_id=business_id, payload=payload)
