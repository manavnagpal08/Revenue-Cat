from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, date

# --- Business & User Schemas ---
class ProfileBase(BaseModel):
    id: str
    email: str
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None

class BusinessBase(BaseModel):
    name: str
    slug: Optional[str] = None
    industry: Optional[str] = None
    currency: str = "INR"
    currency_symbol: str = "₹"
    phone: Optional[str] = None
    website: Optional[str] = None

class BusinessCreate(BusinessBase):
    pass

class BusinessResponse(BusinessBase):
    id: str
    owner_id: str
    created_at: Optional[datetime] = None

# --- CRM Schemas ---
class CustomerBase(BaseModel):
    name: str
    company_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    status: str = "active"
    notes: Optional[str] = None

class CustomerCreate(CustomerBase):
    business_id: str

class CustomerResponse(CustomerBase):
    id: str
    business_id: str
    total_revenue: float = 0.0
    last_interaction_at: Optional[datetime] = None
    created_at: Optional[datetime] = None

class LeadBase(BaseModel):
    title: str
    value: float = 0.0
    source: str = "direct"
    status: str = "new"
    probability: int = 20
    notes: Optional[str] = None
    customer_id: Optional[str] = None
    next_followup_at: Optional[datetime] = None

class LeadCreate(LeadBase):
    business_id: str

class LeadResponse(LeadBase):
    id: str
    business_id: str
    last_contacted_at: Optional[datetime] = None
    created_at: Optional[datetime] = None

# --- Finance Schemas ---
class InvoiceItemBase(BaseModel):
    description: str
    quantity: float = 1.0
    unit_price: float = 0.0
    total_price: float = 0.0

class InvoiceBase(BaseModel):
    customer_id: str
    invoice_number: str
    issue_date: date
    due_date: date
    subtotal: float
    tax_rate: float = 18.0
    tax_amount: float = 0.0
    discount_amount: float = 0.0
    total_amount: float
    status: str = "draft"
    notes: Optional[str] = None

class InvoiceCreate(InvoiceBase):
    business_id: str
    items: List[InvoiceItemBase] = []

class InvoiceResponse(InvoiceBase):
    id: str
    business_id: str
    paid_amount: float = 0.0
    created_at: Optional[datetime] = None

# --- Proposal Schemas ---
class ProposalBase(BaseModel):
    title: str
    project_overview: Optional[str] = None
    deliverables: Optional[List[Dict[str, Any]]] = []
    timeline: Optional[str] = None
    total_value: float = 0.0
    status: str = "draft"
    valid_until: Optional[date] = None
    customer_id: Optional[str] = None
    lead_id: Optional[str] = None

class ProposalCreate(ProposalBase):
    business_id: str

class ProposalResponse(ProposalBase):
    id: str
    business_id: str
    pdf_url: Optional[str] = None
    created_at: Optional[datetime] = None

# --- AI Orchestration Schemas ---
class AIQueryRequest(BaseModel):
    business_id: str
    user_id: str
    prompt: str
    conversation_id: Optional[str] = None

class AIActionCard(BaseModel):
    type: str # 'lead_action', 'invoice_reminder', 'proposal_draft', 'kpi_summary'
    title: str
    description: str
    primary_action_label: Optional[str] = None
    action_payload: Optional[Dict[str, Any]] = None

class AIQueryResponse(BaseModel):
    conversation_id: str
    agent: str # 'supervisor', 'sales', 'finance', 'proposal'
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
