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


# --- PHASE 6: AUTOMATIONS & WORKFLOW ENGINE SCHEMAS ---

class AutomationBase(BaseModel):
    name: str
    description: Optional[str] = None
    trigger_type: str  # lead_inactive, invoice_overdue, website_lead_received, daily_summary, lead_qualified, calendar_event_upcoming, payment_received, custom
    trigger_config: Dict[str, Any] = {}
    condition_config: Dict[str, Any] = {}
    agent_type: str = "sales"  # sales, finance, proposal, customer_support, integrations, supervisor
    action_config: Dict[str, Any] = {}
    status: str = "active"  # active, paused, draft, error
    enabled: bool = True
    requires_approval: bool = True

class AutomationCreate(AutomationBase):
    business_id: str

class AutomationUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    trigger_type: Optional[str] = None
    trigger_config: Optional[Dict[str, Any]] = None
    condition_config: Optional[Dict[str, Any]] = None
    agent_type: Optional[str] = None
    action_config: Optional[Dict[str, Any]] = None
    status: Optional[str] = None
    enabled: Optional[bool] = None
    requires_approval: Optional[bool] = None

class AutomationResponse(AutomationBase):
    id: str
    business_id: str
    created_by: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    last_run_at: Optional[datetime] = None
    next_run_at: Optional[datetime] = None
    runs_count: Optional[int] = 0
    success_count: Optional[int] = 0

class AutomationRunResponse(BaseModel):
    id: str
    automation_id: str
    business_id: str
    status: str  # pending, running, waiting_approval, completed, failed, cancelled, skipped
    trigger_data: Dict[str, Any] = {}
    execution_result: Dict[str, Any] = {}
    error_message: Optional[str] = None
    started_at: datetime
    completed_at: Optional[datetime] = None
    actions: List[Dict[str, Any]] = []

class AutomationActionResponse(BaseModel):
    id: str
    automation_run_id: str
    business_id: str
    action_type: str
    agent_type: str
    input_data: Dict[str, Any] = {}
    output_data: Dict[str, Any] = {}
    status: str  # pending, waiting_approval, approved, rejected, executed, failed
    requires_confirmation: bool = True
    confirmed_by: Optional[str] = None
    confirmed_at: Optional[datetime] = None
    executed_at: Optional[datetime] = None

class AutomationActionApprovalRequest(BaseModel):
    business_id: str
    confirmed: bool = True
    note: Optional[str] = None

class AutomationTemplateResponse(BaseModel):
    id: str
    business_id: Optional[str] = None
    name: str
    description: Optional[str] = None
    category: str
    trigger_type: str
    configuration: Dict[str, Any] = {}
    is_system_template: bool = True
    created_at: Optional[datetime] = None

class AutomationAnalyticsResponse(BaseModel):
    total_runs: int = 0
    successful_runs: int = 0
    failed_runs: int = 0
    skipped_runs: int = 0
    waiting_approval_runs: int = 0
    success_rate_percent: float = 0.0
    active_automations_count: int = 0
    paused_automations_count: int = 0
    runs_timeline: List[Dict[str, Any]] = []
    top_automations: List[Dict[str, Any]] = []

class AutomationStepPreview(BaseModel):
    step_number: int
    title: str
    description: str
    type: str # trigger, action, agent, condition
    agent_badge: Optional[str] = None
    requires_approval: Optional[bool] = False

class AutomationAIBuilderRequest(BaseModel):
    prompt: str
    business_id: str

class AutomationAIBuilderResponse(BaseModel):
    success: bool
    summary: str
    suggested_workflow: AutomationCreate
    steps: List[AutomationStepPreview]
    warnings: List[str] = []

class AutomationLimitsResponse(BaseModel):
    business_id: str
    plan_tier: str
    active_automations_count: int
    limit: int
    can_create: bool
    upgrade_required: bool

class AutomationLogResponse(BaseModel):
    id: str
    business_id: str
    workflow_id: Optional[str] = None
    run_id: Optional[str] = None
    event_type: str
    message: str
    metadata: Dict[str, Any] = {}
    created_at: datetime

class NotificationCreate(BaseModel):
    business_id: str
    title: str
    message: str
    type: str = "info"
    severity: str = "normal"  # low, normal, high, urgent
    action_data: Optional[Dict[str, Any]] = {}
    user_id: Optional[str] = None

class NotificationResponse(BaseModel):
    id: str
    business_id: str
    user_id: Optional[str] = None
    title: str
    message: str
    type: str = "info"
    severity: str = "normal"
    action_data: Optional[Dict[str, Any]] = {}
    is_read: bool = False
    created_at: datetime


# --- PHASE 7: MONETIZATION, SUBSCRIPTIONS & BILLING SCHEMAS ---

class PlanConfigResponse(BaseModel):
    id: str  # 'free', 'starter', 'business', 'pro'
    name: str  # 'Starter', 'Business', 'Pro'
    price_monthly: float
    currency: str = "INR"
    currency_symbol: str = "₹"
    ai_credits_monthly: int
    automations_limit: int
    included_integrations: List[str]
    features: List[str]
    description: str
    is_popular: bool = False
    revenuecat_product_id: Optional[str] = None

class SubscriptionResponse(BaseModel):
    id: str
    business_id: str
    user_id: str
    tier: str  # 'free', 'starter', 'business', 'pro'
    status: str  # 'active', 'trialing', 'canceled', 'past_due', 'expired'
    provider: str = "revenuecat"
    provider_customer_id: Optional[str] = None
    provider_subscription_id: Optional[str] = None
    active_entitlements: List[str] = []
    current_period_start: Optional[datetime] = None
    current_period_end: Optional[datetime] = None
    cancel_at_period_end: bool = False
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class EntitlementsResponse(BaseModel):
    business_id: str
    tier: str
    status: str
    can_access_ai_command: bool = True
    can_access_all_agents: bool = True
    can_access_integrations: bool = True
    can_access_automations: bool = True
    ai_credits_total: int = 15
    ai_credits_used: int = 0
    ai_credits_remaining: int = 15
    automations_limit: int = 2
    automations_active: int = 0
    automations_remaining: int = 2
    feature_flags: Dict[str, bool] = {}

class UsageRecordItem(BaseModel):
    id: str
    business_id: str
    user_id: Optional[str] = None
    action_type: str
    credits_consumed: int
    created_at: datetime

class UsageSummaryResponse(BaseModel):
    business_id: str
    plan_tier: str
    period_start: datetime
    period_end: datetime
    ai_credits_total: int
    ai_credits_used: int
    ai_credits_remaining: int
    ai_credits_percent: float
    automations_limit: int
    automations_active: int
    automations_percent: float
    usage_by_action: Dict[str, int] = {}
    recent_usage_records: List[UsageRecordItem] = []

class BillingHistoryItemResponse(BaseModel):
    id: str
    business_id: str
    amount: float
    currency: str = "INR"
    status: str
    plan_tier: str
    billing_period_start: Optional[datetime] = None
    billing_period_end: Optional[datetime] = None
    provider: str = "revenuecat"
    provider_event_id: Optional[str] = None
    invoice_pdf_url: Optional[str] = None
    created_at: datetime

class RestoreSubscriptionRequest(BaseModel):
    business_id: str
    app_user_id: Optional[str] = None

class RestoreSubscriptionResponse(BaseModel):
    success: bool
    business_id: str
    tier: str
    status: str
    message: str
    entitlements: List[str] = []

class SubscriptionUpgradeRequest(BaseModel):
    business_id: str
    plan_tier: str  # 'starter', 'business', 'pro'



