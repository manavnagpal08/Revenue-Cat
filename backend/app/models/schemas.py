from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, date

# --- Business & User Schemas ---
class ProfileBase(BaseModel):
    id: str
    email: str
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None

class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None

class ProfileResponse(ProfileBase):
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class BusinessBase(BaseModel):
    name: str
    slug: Optional[str] = None
    industry: Optional[str] = None
    currency: str = "INR"
    currency_symbol: str = "₹"
    phone: Optional[str] = None
    website: Optional[str] = None
    address: Optional[str] = None
    tax_number: Optional[str] = None

class BusinessCreate(BusinessBase):
    timezone: Optional[str] = "Asia/Kolkata"

class BusinessUpdate(BaseModel):
    name: Optional[str] = None
    industry: Optional[str] = None
    currency: Optional[str] = None
    currency_symbol: Optional[str] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    address: Optional[str] = None
    tax_number: Optional[str] = None

class BusinessSettingsBase(BaseModel):
    ai_tone: Optional[str] = "professional"
    default_invoice_due_days: Optional[int] = 14
    default_tax_rate: Optional[float] = 18.00
    notification_email: Optional[bool] = True
    notification_push: Optional[bool] = True

class BusinessSettingsUpdate(BaseModel):
    ai_tone: Optional[str] = None
    default_invoice_due_days: Optional[int] = None
    default_tax_rate: Optional[float] = None
    notification_email: Optional[bool] = None
    notification_push: Optional[bool] = None

class BusinessResponse(BusinessBase):
    id: str
    owner_id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    settings: Optional[BusinessSettingsBase] = None
    role: Optional[str] = "owner"

# --- CUSTOMER SCHEMAS ---
class CustomerBase(BaseModel):
    name: str
    company_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    address: Optional[str] = None
    status: str = "active" # active, inactive, archived
    notes: Optional[str] = None

class CustomerCreate(CustomerBase):
    business_id: str

class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    company_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    address: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None

class CustomerResponse(CustomerBase):
    id: str
    business_id: str
    total_revenue: float = 0.0
    last_interaction_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

# --- LEAD & ACTIVITY SCHEMAS ---
class LeadBase(BaseModel):
    title: str
    company: Optional[str] = None
    contact_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    value: float = 0.0
    source: str = "direct" # direct, website, referral, email, social
    status: str = "new" # new, contacted, qualified, proposal, negotiation, won, lost, converted
    priority: str = "medium" # low, medium, high
    probability: int = 20
    expected_close_date: Optional[date] = None
    notes: Optional[str] = None
    customer_id: Optional[str] = None
    next_followup_at: Optional[datetime] = None

class LeadCreate(LeadBase):
    business_id: str

class LeadUpdate(BaseModel):
    title: Optional[str] = None
    company: Optional[str] = None
    contact_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    value: Optional[float] = None
    source: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    probability: Optional[int] = None
    expected_close_date: Optional[date] = None
    notes: Optional[str] = None
    customer_id: Optional[str] = None
    next_followup_at: Optional[datetime] = None

class LeadActivityBase(BaseModel):
    activity_type: str # call, email, meeting, note, followup, whatsapp, proposal
    title: str
    description: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = {}

class LeadActivityCreate(LeadActivityBase):
    business_id: str
    lead_id: Optional[str] = None
    customer_id: Optional[str] = None

class LeadActivityResponse(LeadActivityBase):
    id: str
    business_id: str
    lead_id: Optional[str] = None
    customer_id: Optional[str] = None
    created_at: Optional[datetime] = None

class LeadResponse(LeadBase):
    id: str
    business_id: str
    last_contacted_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    activities: Optional[List[LeadActivityResponse]] = []

class LeadConvertRequest(BaseModel):
    create_deal: Optional[bool] = False
    deal_title: Optional[str] = None

# --- INVOICE & PAYMENT SCHEMAS ---
class InvoiceItemBase(BaseModel):
    description: str
    quantity: float = 1.0
    unit_price: float = 0.0
    tax_rate: Optional[float] = 0.0
    discount: Optional[float] = 0.0
    total_price: float = 0.0

class InvoiceCreate(BaseModel):
    business_id: str
    customer_id: str
    invoice_number: Optional[str] = None
    issue_date: Optional[date] = None
    due_date: date
    notes: Optional[str] = None
    tax_rate: Optional[float] = 18.0
    discount_amount: Optional[float] = 0.0
    items: List[InvoiceItemBase]

class InvoiceUpdate(BaseModel):
    due_date: Optional[date] = None
    status: Optional[str] = None
    notes: Optional[str] = None
    discount_amount: Optional[float] = None
    items: Optional[List[InvoiceItemBase]] = None

class PaymentCreate(BaseModel):
    business_id: str
    customer_id: Optional[str] = None
    amount: float
    payment_date: Optional[date] = None
    payment_method: str = "bank_transfer" # bank_transfer, upi, card, cash, other
    reference_number: Optional[str] = None
    notes: Optional[str] = None

class PaymentResponse(BaseModel):
    id: str
    business_id: str
    invoice_id: str
    customer_id: str
    amount: float
    payment_date: date
    payment_method: str
    reference_number: Optional[str] = None
    notes: Optional[str] = None
    created_at: Optional[datetime] = None

class InvoiceResponse(BaseModel):
    id: str
    business_id: str
    customer_id: str
    customer_name: Optional[str] = None
    invoice_number: str
    issue_date: date
    due_date: date
    subtotal: float
    tax_rate: float
    tax_amount: float
    discount_amount: float
    total_amount: float
    paid_amount: float
    remaining_balance: float = 0.0
    status: str # draft, sent, paid, partially_paid, overdue, cancelled
    notes: Optional[str] = None
    items: Optional[List[InvoiceItemBase]] = []
    payments: Optional[List[PaymentResponse]] = []
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

# --- PROPOSAL SCHEMAS ---
class ProposalItemBase(BaseModel):
    title: str
    description: Optional[str] = None
    cost: float = 0.0

class ProposalCreate(BaseModel):
    business_id: str
    customer_id: Optional[str] = None
    lead_id: Optional[str] = None
    title: str
    project_overview: Optional[str] = None
    deliverables: Optional[List[Dict[str, Any]]] = []
    timeline: Optional[str] = None
    valid_until: Optional[date] = None
    items: Optional[List[ProposalItemBase]] = []
    total_value: Optional[float] = None

class ProposalUpdate(BaseModel):
    title: Optional[str] = None
    project_overview: Optional[str] = None
    deliverables: Optional[List[Dict[str, Any]]] = None
    timeline: Optional[str] = None
    status: Optional[str] = None
    valid_until: Optional[date] = None
    total_value: Optional[float] = None
    items: Optional[List[ProposalItemBase]] = None

class ProposalResponse(BaseModel):
    id: str
    business_id: str
    customer_id: Optional[str] = None
    customer_name: Optional[str] = None
    lead_id: Optional[str] = None
    title: str
    project_overview: Optional[str] = None
    deliverables: Optional[List[Dict[str, Any]]] = []
    timeline: Optional[str] = None
    total_value: float = 0.0
    status: str # draft, sent, viewed, accepted, rejected, expired
    valid_until: Optional[date] = None
    pdf_url: Optional[str] = None
    items: Optional[List[ProposalItemBase]] = []
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

# --- CUSTOMER DETAIL AGGREGATE ---
class CustomerDetailResponse(CustomerResponse):
    leads: List[LeadResponse] = []
    invoices: List[InvoiceResponse] = []
    proposals: List[ProposalResponse] = []
    activities: List[LeadActivityResponse] = []

# --- DASHBOARD METRICS ---
class DashboardMetricsResponse(BaseModel):
    revenue_this_month: float
    revenue_growth_percent: float
    outstanding_amount: float
    overdue_amount: float
    active_leads_count: int
    pipeline_total_value: float
    pending_proposals_count: int
    overdue_invoices_count: int
    currency_symbol: str = "₹"
    top_lead: Optional[Dict[str, Any]] = None
    recent_invoices: List[InvoiceResponse] = []
    recent_leads: List[LeadResponse] = []
    recent_activities: List[LeadActivityResponse] = []

# --- AI Orchestration Schemas ---
class AIQueryRequest(BaseModel):
    business_id: str
    user_id: str
    prompt: str
    conversation_id: Optional[str] = None

class AIActionCard(BaseModel):
    type: str # lead_action, invoice_reminder, proposal_draft, kpi_summary
    title: str
    description: str
    primary_action_label: Optional[str] = None
    action_payload: Optional[Dict[str, Any]] = None

class AIQueryResponse(BaseModel):
    conversation_id: str
    agent: str # supervisor, sales, finance, proposal
    message: str
    structured_data: Optional[Dict[str, Any]] = None
    action_cards: Optional[List[AIActionCard]] = []
    credits_remaining: Optional[int] = 100

# --- Health Check ---
class HealthResponse(BaseModel):
    status: str
    environment: str
    database_connected: bool
    version: str = "1.0.0"

# --- INTEGRATION SCHEMAS ---
class IntegrationResponse(BaseModel):
    id: str
    business_id: str
    provider: str # gmail, google_calendar, whatsapp, website_leads, crm
    status: str # connected, disconnected, connecting, syncing, error, expired, reauth_required, configuration_required
    account_name: Optional[str] = None
    account_email: Optional[str] = None
    external_account_id: Optional[str] = None
    scopes: Optional[List[str]] = []
    last_synced_at: Optional[datetime] = None
    last_error: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = {}
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class IntegrationConnectURLResponse(BaseModel):
    provider: str
    auth_url: str
    state: str

class IntegrationSyncResponse(BaseModel):
    provider: str
    status: str
    synced_records_count: int = 0
    message: str

class WebsiteLeadWebhookPayload(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    message: Optional[str] = None
    source: Optional[str] = "website_contact_form"
    website: Optional[str] = None
    estimated_budget: Optional[float] = None
    metadata: Optional[Dict[str, Any]] = {}

class EmailMessageItem(BaseModel):
    id: str
    thread_id: Optional[str] = None
    sender: str
    recipient: str
    subject: str
    snippet: Optional[str] = None
    timestamp: datetime
    is_unread: bool = False

class EmailDraftRequest(BaseModel):
    business_id: str
    to_email: str
    subject: str
    body: str
    lead_id: Optional[str] = None
    customer_id: Optional[str] = None

class EmailSendRequest(BaseModel):
    business_id: str
    to_email: str
    subject: str
    body: str
    draft_id: Optional[str] = None
    lead_id: Optional[str] = None
    customer_id: Optional[str] = None

class CalendarEventItem(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    start_time: datetime
    end_time: datetime
    location: Optional[str] = None
    meet_link: Optional[str] = None
    attendees: List[str] = []

class CalendarEventCreateRequest(BaseModel):
    business_id: str
    title: str
    description: Optional[str] = None
    start_time: datetime
    end_time: datetime
    attendees: Optional[List[str]] = []
    location: Optional[str] = None
    customer_id: Optional[str] = None
    lead_id: Optional[str] = None

class WhatsAppMessageSendRequest(BaseModel):
    business_id: str
    to_phone: str
    message: str
    customer_id: Optional[str] = None
    lead_id: Optional[str] = None

